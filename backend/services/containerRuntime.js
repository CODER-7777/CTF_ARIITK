const { randomUUID } = require('crypto');

const sessions = new Map();
const runtimeUrl = process.env.CHALLENGE_RUNTIME_URL;
const sessionMinutes = Number(process.env.BANDIT_SESSION_MINUTES || 20);

async function callRuntime(path, method = 'GET', body) {
  if (!runtimeUrl) return null;
  const res = await fetch(`${runtimeUrl}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`Runtime error ${res.status}`);
  return res.json();
}

async function createSession({ userId, level }) {
  const remote = await callRuntime('/sessions/start', 'POST', { userId: String(userId), level: level.level });
  if (remote) return remote;
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + (level.maxSessionMinutes || sessionMinutes) * 60 * 1000);
  const local = { sessionId, userId: String(userId), level: level.level, startedAt: new Date(), expiresAt };
  sessions.set(sessionId, local);
  return local;
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

function getUserLevelSession(userId, level) {
  return [...sessions.values()].find((s) => s.userId === String(userId) && s.level === level) || null;
}

async function stopSession(sessionId) {
  const remote = await callRuntime(`/sessions/${sessionId}/stop`, 'POST', {});
  if (remote) return remote;
  sessions.delete(sessionId);
  return { success: true };
}

async function resetSession(sessionId, { userId, level }) {
  const remote = await callRuntime(`/sessions/${sessionId}/reset`, 'POST', { userId: String(userId), level: level.level });
  if (remote) return remote;
  await stopSession(sessionId);
  return createSession({ userId, level });
}

async function runSessionCommand(sessionId, command) {
  const remote = await callRuntime(`/sessions/${sessionId}/command`, 'POST', { command });
  if (remote) return remote;

  // Local no-docker fallback: robust mock terminal output.
  const trimmed = String(command || '').trim();
  if (!trimmed) return { output: '' };

  // Split command into base and arguments
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  const currentLevel = getSession(sessionId)?.level || 1;

  switch (cmd) {
    case 'help':
      return { output: 'Standard Bandit Commands: ls, pwd, whoami, cat, help, clear, cd\n' };

    case 'clear':
      return { output: '\x1Bc' }; // ANSI escape to clear terminal

    case 'pwd':
      return { output: `/home/bandit-user/level${currentLevel}\n` };

    case 'whoami':
      return { output: `bandit-level${currentLevel}\n` };

    case 'ls':
      // Handle ls flags (like -la, -l, -a) by just showing the same files for now
      // but accepting the command without error.
      return { output: 'total 24\ndrwxr-xr-x 2 bandit-user bandit-user 4096 Apr  8 22:00 .\ndrwxr-xr-x 3 root        root        4096 Apr  8 22:00 ..\n-rw-r--r-- 1 bandit-user bandit-user   82 Apr  8 22:00 notes.txt\n-rw-r--r-- 1 bandit-user bandit-user   68 Apr  8 22:00 README\n-r-------- 1 bandit-user bandit-user   42 Apr  8 22:00 token_hint.txt\n' };

    case 'cat':
      if (args.length === 0) return { output: 'cat: missing operand\n' };
      const filename = args[0];
      if (filename === 'README') {
        return { output: 'Welcome agent. Enumerate files and read clues to recover the proof token.\n' };
      }
      if (filename === 'notes.txt') {
        return { output: 'Hint: the proof token is not in this file. Try reading token_hint.txt.\n' };
      }
      if (filename === 'token_hint.txt') {
        return { output: `bandit{level_${currentLevel}_proof_from_runtime}\n` };
      }
      return { output: `cat: ${filename}: No such file or directory\n` };

    case 'cd':
      return { output: 'Permission denied: Restricted shell. You cannot leave this directory.\n' };

    case 'nano':
    case 'vi':
    case 'vim':
      return { output: `${cmd}: command unavailable in hosted mock runtime. Use 'cat' to read files.\n` };

    default:
      return { output: `bash: ${cmd}: command not found\n` };
  }
}

async function checkHealth() {
  if (runtimeUrl) {
    try {
      const data = await callRuntime('/health');
      return { ok: true, mode: 'remote', details: data };
    } catch (error) {
      return { ok: false, mode: 'remote', message: error.message };
    }
  }
  return { ok: true, mode: 'local-mock' };
}

module.exports = {
  createSession,
  getSession,
  getUserLevelSession,
  stopSession,
  resetSession,
  runSessionCommand,
  checkHealth,
  sessions
};
