# Challenge Runtime Contract

This backend can delegate shell challenge execution to an external runtime service via `CHALLENGE_RUNTIME_URL`.

## Environment Variable

- `CHALLENGE_RUNTIME_URL` (optional): base URL for runtime API, for example `https://runtime.example.com`

If unset, backend uses a local mock runtime for development.

## Required Runtime Endpoints

### `GET /health`
- Response `200`:
```json
{ "ok": true }
```

### `POST /sessions/start`
- Request:
```json
{ "userId": "abc123", "level": 4 }
```
- Response:
```json
{
  "sessionId": "sess_123",
  "startedAt": "2026-04-08T00:00:00.000Z",
  "expiresAt": "2026-04-08T00:20:00.000Z"
}
```

### `POST /sessions/:sessionId/stop`
- Request body can be empty (`{}`).
- Response:
```json
{ "success": true }
```

### `POST /sessions/:sessionId/reset`
- Request:
```json
{ "userId": "abc123", "level": 4 }
```
- Response:
```json
{
  "sessionId": "sess_456",
  "startedAt": "2026-04-08T00:05:00.000Z",
  "expiresAt": "2026-04-08T00:25:00.000Z"
}
```

### `POST /sessions/:sessionId/command`
- Request:
```json
{ "command": "ls -la" }
```
- Response:
```json
{ "output": "total 8\n..." }
```
