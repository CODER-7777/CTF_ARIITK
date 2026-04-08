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

  // Local no-docker fallback: mock terminal output.
  const trimmed = String(command || '').trim();
  if (!trimmed) return { output: '' };
  if (trimmed === 'help') {
    return { output: 'Commands: ls, pwd, whoami, cat <file>, help\n' };
  }
  if (trimmed === 'ls') return { output: 'README  notes.txt  token_hint.txt\n' };
  if (trimmed === 'pwd') return { output: `/bandit/l${getSession(sessionId)?.level || 1}\n` };
  if (trimmed === 'whoami') return { output: 'bandit-player\n' };
  if (trimmed === 'cat README') {
    return { output: 'Welcome agent. Enumerate files and read clues to recover the proof token.\n' };
  }
  if (trimmed === 'cat notes.txt') {
    return { output: 'Hint: the proof token is not in this file. Try reading token_hint.txt.\n' };
  }
  if (trimmed === 'cat token_hint.txt') {
    const level = getSession(sessionId)?.level || 1;
    return { output: `bandit{level_${level}_proof_from_runtime}\n` };
  }
  if (trimmed.startsWith('cat ') && trimmed.includes('token')) {
    const level = getSession(sessionId)?.level || 1;
    return { output: `bandit{level_${level}_proof_from_runtime}\n` };
  }
  if (trimmed.startsWith('nano ')) {
    return { output: 'nano: command unavailable in hosted mock runtime\n' };
  }
  return { output: `bash: ${trimmed}: command not found\n` };
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
