#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const ROOT_DIR = __dirname;
const MAX_PORT = 65535;
const MIN_PORT = 1025;

function isValidPortNumber(value) {
  const port = Number(value);
  return Number.isInteger(port) && port >= MIN_PORT && port <= MAX_PORT;
}

function generateRandomPort() {
  return Math.floor(Math.random() * (MAX_PORT - MIN_PORT + 1)) + MIN_PORT;
}

function resolvePortFromArgs() {
  const [, , arg] = process.argv;
  if (arg === undefined) {
    return generateRandomPort();
  }

  if (!isValidPortNumber(arg)) {
    console.error(`Invalid port: "${arg}". Please provide an integer between ${MIN_PORT} and ${MAX_PORT}.`);
    process.exit(1);
  }

  return Number(arg);
}

function createRequestHandler(rootDir) {
  return function handleRequest(req, res) {
    const method = req.method || 'GET';
    if (method !== 'GET' && method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Method Not Allowed');
      return;
    }

    const requestUrl = new URL(req.url || '/', `http://${req.headers.host}`);
    let relativePath = decodeURIComponent(requestUrl.pathname);

    if (relativePath.endsWith('/')) {
      relativePath = path.join(relativePath, 'index.html');
    }

    const safePath = path.normalize(relativePath).replace(/^\/+/, '');
    const filePath = path.join(rootDir, safePath);

    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (statErr, stats) => {
      if (statErr || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }

      const extension = path.extname(filePath);
      const contentType = MIME_TYPES[extension] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });

      if (method === 'HEAD') {
        res.end();
        return;
      }

      const readStream = fs.createReadStream(filePath);
      readStream.on('error', (err) => {
        console.error('Error reading file:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        }
        res.end('Internal Server Error');
      });
      readStream.pipe(res);
    });
  };
}

function startServer(port, rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(createRequestHandler(rootDir));

    server.once('error', (err) => {
      reject({ err, server });
    });

    server.listen(port, () => {
      const address = server.address();
      const host = (address.address === '::' || address.address === '0.0.0.0')
        ? 'localhost'
        : address.address;
      console.log(`Serving Laser Switch at http://${host}:${address.port}`);
      resolve(server);
    });
  });
}

async function main() {
  const explicitPort = resolvePortFromArgs();
  let port = explicitPort;
  const maxAttempts = explicitPort ? 1 : 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const server = await startServer(port, ROOT_DIR);
      return server;
    } catch (errorInfo) {
      const { err } = errorInfo;
      if (err.code === 'EADDRINUSE' && !explicitPort) {
        port = generateRandomPort();
        continue;
      }

      console.error(`Failed to start server on port ${port}:`, err.message);
      process.exit(1);
    }
  }

  console.error('Unable to bind to a port after multiple attempts.');
  process.exit(1);
}

main();
