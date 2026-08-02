#!/usr/bin/env node
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist', 'bladi-credit-portal', 'browser');
const port = Number(process.env.PORT ?? 4300);
const host = process.env.HOST ?? '127.0.0.1';

const indexTemplate = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

const app = express();

app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
        fontSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'http://localhost:8080'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    frameguard: { action: 'deny' },
  }),
);
app.use(compression());

function renderIndex(req, res) {
  const html = indexTemplate.replaceAll('CSP_NONCE_PLACEHOLDER', res.locals.cspNonce);
  res.set('Cache-Control', 'no-cache');
  res.type('html').send(html);
}

app.get('/index.html', renderIndex);

app.use(
  express.static(distDir, {
    index: false,
    setHeaders: (res, filePath) => {
      if (/-[A-Z0-9]{8}\.(js|css)$/.test(filePath) || /\.(woff2?|ttf|svg|png|ico)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }),
);

app.use((req, res, next) => {
  if (req.method !== 'GET' || !req.accepts('html')) {
    next();
    return;
  }
  renderIndex(req, res);
});

app.listen(port, host, () => {
  console.log(`Preview server serving ${distDir}`);
  console.log(`Local: http://${host}:${port}/`);
});