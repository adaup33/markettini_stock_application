#!/usr/bin/env node
/* Lightweight WS + HTTP broadcast server used in dev/local for watchlist updates.
   Usage: node scripts/ws-server.js [PORT]
   Broadcast HTTP endpoint: POST /broadcast with JSON body {type: string, payload: any}
*/

const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 4001;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/broadcast') {
    let body = '';
    req.on('data', (chunk) => body += chunk.toString());
    req.on('end', () => {
      try {
        const msg = JSON.parse(body || '{}');
        const payload = JSON.stringify(msg);
        wss.clients.forEach((c) => {
          if (c.readyState === WebSocket.OPEN) c.send(payload);
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WS client connected');
  ws.on('close', () => console.log('WS client disconnected'));
});

server.listen(PORT, () => console.log(`WS server listening http+ws on port ${PORT}`));

