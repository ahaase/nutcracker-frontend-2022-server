import { Item } from "./item.js";
import * as fs from 'fs';
import { log } from './log.js';
import { pbkdf2Sync } from 'node:crypto';
import * as secretKey from './secret_key.js';
import { v4 as uuidv4 } from 'uuid';

const initFile = JSON.parse(fs.readFileSync('./init_session.json'));

export class Session {

  constructor(client, apiKey) {
    if (!client) throw new Error('Client must be specified');
    if (!apiKey) throw new Error('API key must be specified');

    this.client = client;
    this.apiKey = apiKey;
  }

  async getSession() {
    return new Promise((resolve, reject) => {
      this.client.query('SELECT * FROM user_session WHERE api_key = $1', [ this.apiKey ], (err, result) => {
        if (err) return reject(err);

        const now = Math.floor(Date.now() / 1000);

        if (!result.rows.length) {
          return reject(new Error('Invalid key'));
        }

        this.client.query('UPDATE user_session SET last_used = $1', [ now ], async (err, result) => {
          if (err) return reject(err);

          resolve();
        })
      })
    });
  }
}

export function createSession(client, key, count = 1) {
  return new Promise(async (resolve, reject) => {
    const hash = pbkdf2Sync(key, '', 1000, 64, 'sha512').toString('hex');

    if (hash !== secretKey.default.key) {
      return reject(new Error('Incorrect key'));
    }

    const now = Math.floor(Date.now() / 1000);

    const sessionIds = [];

    for (let i = 0; i < count; i++) {
      sessionIds.push(uuidv4());
    }

    const promises = [];

    for (let session of sessionIds) {
      promises.push(new Promise((resolve, reject) => {
        client.query('INSERT INTO user_session (api_key, created, last_used) VALUES ($1, $2, $3)', [
          session,
          now,
          now
        ], async (err, result) => {
          if (err) return reject(session);
    
          const itemHandler = new Item(client, session);
    
          await log(client, 'info', `New API key set up: ${session}`);
    
          try {
            for (let val of initFile) {
              await itemHandler.createItem(val);
            }
          } catch (err) {
            console.log(err);
          }
    
          resolve(session);
        });
      }));
    }

    Promise.allSettled(promises).then((results) => {
      const resolveData = [];
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          resolveData.push(result.value);
        }
      });

      resolve(resolveData);
    });
  });
}
