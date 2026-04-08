const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const jwt = require('jsonwebtoken');
const url = require('url');
const { getSession } = require('./containerRuntime');

function createTerminalGateway(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const parsed = url.parse(request.url, true);
    if (parsed.pathname !== '/ws/terminal') {
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws, request) => {
    const parsed = url.parse(request.url, true);
    const token = parsed.query.token;
    const sessionId = parsed.query.sessionId;
    if (!token || !sessionId) {
      ws.close(1008, 'Missing auth token or sessionId');
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      ws.close(1008, 'Invalid token');
      return;
    }

    const session = getSession(sessionId);
    if (!session || String(session.userId) !== String(decoded.userId)) {
      ws.close(1008, 'Session access denied');
      return;
    }

    const shell = spawn('docker', ['exec', '-i', session.containerId, 'bash'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    shell.stdout.on('data', (chunk) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'stdout', data: chunk.toString() }));
      }
    });
    shell.stderr.on('data', (chunk) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'stderr', data: chunk.toString() }));
      }
    });
    shell.on('close', () => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'info', data: '\n[session ended]\n' }));
        ws.close();
      }
    });

    ws.on('message', (message) => {
      try {
        const payload = JSON.parse(message.toString());
        if (payload.type === 'input' && typeof payload.data === 'string') {
          shell.stdin.write(payload.data);
        }
      } catch (error) {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      shell.kill();
    });
  });

  return wss;
}

module.exports = { createTerminalGateway };
