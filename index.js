import express from 'express';
import * as pg from 'pg';
import { Item } from './item.js';
import { log } from './log.js';
import { createSession, Session } from './session.js';
import * as pgSettings from './pg_settings.js';
import rateLimit from 'express-rate-limit'
import cors from 'cors';

const { Pool } = pg.default;
const app = express();
const port = 3000;

const limiter = rateLimit({
	windowMs: 10 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
});

app.use(limiter);
app.use(cors())

app.use((req, res, next) => {
  res.sendError = sendError;
  res.sendSuccess = sendSuccess;

  const apiKey = req.headers['api-key'];
  if (!apiKey) return res.sendError(400, 'API key must be specified');
  if (typeof apiKey !== 'string') return res.sendError(400, 'API key must be a string');
  if (apiKey.length < 8) return res.sendError(400, 'API key must be at least 8 characters in length');

  res.apiKey = apiKey;

  new Pool(pgSettings.default).connect(async (err, client, release) => {
    if (err) {
      console.log('[ERROR]', apiKey, 'Failed to connect to database');

      return res.sendError(500, 'Failed to connect to database');
    }
    res.client = client;

    await log(client, 'info', `${apiKey} START - ${req.method} ${req.url}`);
  
    res.on("finish", async function() {
      await log(client, 'info', `${apiKey} END - ${req.method} ${req.url}`);
      release();
    });

    if (req.url === '/api/session/new') return next();

    try {
      await (new Session(client, apiKey).getSession());

      req.itemHandler = new Item(client, apiKey);
    } catch (err) {
      return res.sendError(500, err.message);
    }

    next();
  });
});

app.use(express.json());

// Index
app.get('/api/item', (req, res) => {
  req.itemHandler.listItems(req.query.offset, req.query.limit).then((items) => {
    res.sendSuccess(items);
  }).catch((err) => {
    res.sendError(500, err.message);
  });
});

// Retrieve
app.get('/api/item/:id', (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.sendError(400, 'ID is required');
  }

  req.itemHandler.retrieveItem(id).then((item) => {
    res.sendSuccess(item);
  }).catch((err) => {
    res.sendError(500, err.message);
  })
});

// Create
app.post('/api/item', (req, res) => {
  req.itemHandler.createItem(req.body).then((item) => {
    res.sendSuccess(item);
  }).catch((err) => {
    res.sendError(500, err.message);
  });
});

// Update
app.put('/api/item/:id', (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.sendError(400, 'ID is required');
  }

  req.itemHandler.updateItem(id, req.body).then((item) => {
    res.sendSuccess(item);
  }).catch((err) => {
    res.sendError(500, err.message);
  });
});

// Delete
app.delete('/api/item/:id', (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.sendError(400, 'ID is required');
  }

  req.itemHandler.deleteItem(id).then((item) => {
    res.sendSuccess(item);
  }).catch((err) => {
    res.sendError(500, err.message);
  });
});

app.post('/api/session/new', (req, res) => {
  createSession(res.client, req.headers['api-key'], req.body.count).then((newSessions) => {
    res.sendSuccess(newSessions)
  }).catch((err) => {
    console.log(err);
    res.sendError(500, err.message);
  });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

async function sendError(status, message) {
  this.status(status);
  this.send({
    error: {
      code: status,
      message,
    },
  });
  if (this.client) {
    await log(this.client, status, message);
  }
}

async function sendSuccess(response) {
  this.send(response);

  if (this.client && this.apiKey) {
    await log(this.client, 'info', `${this.apiKey} OK`);
  }
}
