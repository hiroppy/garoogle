'use strict';

const { createServer } = require('http');

let lastUpdated;

function init() {
  const server = createServer();

  server.on('request', (req, res) => {
    if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'text/json' });
      res.write(
        JSON.stringify({
          lastUpdated
        })
      );
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
    }

    res.end();
  });

  server.listen(3000);
}

function updateLastUpdated(d) {
  lastUpdated = d;
}

module.exports = {
  init,
  updateLastUpdated
};
