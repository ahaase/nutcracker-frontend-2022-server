import express from 'express';
import * as pg from 'pg';
import { Item } from './item.js';
import { log } from './log.js';
import { Session } from './session.js';
import * as pgSettings from './pg_settings.js';
import rateLimit from 'express-rate-limit'

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

app.use((req, res, next) => {
  res.sendError = sendError;

  const apiKey = req.headers['api-key'];
  if (!apiKey) return res.sendError(400, 'API key must be specified');
  if (typeof apiKey !== 'string') return res.sendError(400, 'API key must be a string');
  if (apiKey.length < 8) return res.sendError(400, 'API key must be at least 8 characters in length');

  new Pool(pgSettings.default).connect(async (err, client, release) => {
    if (err) return res.sendError(500, 'Failed to connect to databse');
    res.client = client;

    await log(client, 'info', `User connected: ${apiKey}`);
  
    res.on("finish", async function() {
      await log(client, 'info', `User disconnected: ${apiKey}`);
      release();
    });

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
  req.itemHandler.listItems().then((items) => {
    res.send(items);
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
    res.send(item);
  }).catch((err) => {
    res.sendError(500, err.message);
  })
});

// Create
app.post('/api/item', (req, res) => {
  req.itemHandler.createItem(req.body).then((item) => {
    res.send(item);
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
    res.send(item);
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
    res.send(item);
  }).catch((err) => {
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
