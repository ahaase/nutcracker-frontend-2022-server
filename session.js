import { Item } from "./item.js";
import * as fs from 'fs';
import { log } from './log.js';


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
          return this.client.query('INSERT INTO user_session (api_key, created, last_used) VALUES ($1, $2, $3)', [
            this.apiKey,
            now,
            now
          ], async (err, result) => {
            if (err) return reject(err);

            const itemHandler = new Item(this.client, this.apiKey);

            await log(this.client, 'info', `New API key set up: ${this.apiKey}`);

            try {
              for (let val of initFile) {
                await itemHandler.createItem(val);
              }
            } catch (err) {
              console.log(err);
            }

            resolve();
          });
        }

        this.client.query('UPDATE user_session SET last_used = $1', [ now ], async (err, result) => {
          if (err) return reject(err);

          resolve();
        })
      })
    });
  }
}
