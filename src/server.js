'use strict';

const { createServer } = require('http');

const server = createServer();

server.on('request', (req, res) => {
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write(':)');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
  }

  res.end();
});

server.listen(3000);
