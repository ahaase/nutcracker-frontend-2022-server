import { v4 as uuidv4 } from 'uuid';

export class Item {

  constructor(client, apiKey) {
    if (!client) throw new Error('Client must be specified');
    if (!apiKey) throw new Error('API key must be specified');

    this.client = client;
    this.apiKey = apiKey;
  }

  listItems() {
    return new Promise((resolve, reject) => {
      this.client.query('SELECT uuid, description, done, do_before FROM item WHERE api_key = $1', [ this.apiKey ], (err, result) => {
        if (err) return reject(err);

        resolve(result.rows);
      });
    });
  }

  createItem(values) {
    const possibleValues = ['description', 'do_before'];
    let validatedValues = {};

    return new Promise((resolve, reject) => {
      try {
        validatedValues = this.validateValues(values, possibleValues);
      } catch (err) {
        return reject(err);
      }

      validatedValues.uuid = uuidv4();
      validatedValues.api_key = this.apiKey;

      const valuesString = []

      for (let i = 0; i < Object.keys(validatedValues).length; i++) {
        valuesString.push(`$${i + 1}`);
      }

      this.client.query(`INSERT INTO item (${
        Object.keys(validatedValues).join(',')
      }) VALUES (${
        valuesString.join(',')
      }) RETURNING uuid, description, done, do_before`, Object.values(validatedValues), (err, result) => {
        if (err) return reject(err);

        resolve(result.rows[0]);
      });
    });
  }

  retrieveItem(id) {
    return new Promise((resolve, reject) => {
      if (!id) return reject(new Error('ID must be specified'));

      this.client.query('SELECT uuid, description, done, do_before FROM item WHERE uuid = $1 AND api_key = $2', [ id, this.apiKey ], (err, result) => {
        if (err) return reject(err);
        if (!result.rows.length) return reject(new Error('Item not found'));

        resolve(result.rows[0]);
      });
    });
  }

  updateItem(id, values) {
    const possibleValues = ['description', 'done', 'do_before'];
    let validatedValues = {};

    return new Promise((resolve, reject) => {
      if (!id) return reject(new Error('ID must be specified'));

      try {
        validatedValues = this.validateValues(values, possibleValues);
      } catch (err) {
        return reject(err);
      }

      const parts = [];

      let i = 3;
      for (let key in validatedValues) {
        parts.push(`${key} = $${i}`);
        i++;
      }

      this.client.query(`UPDATE item SET ${parts.join(',')} WHERE uuid = $1 AND api_key = $2 RETURNING uuid, description, done, do_before`, [ id, this.apiKey, ...Object.values(validatedValues) ], (err, result) => {
        if (err) return reject(err);
        if (!result.rows.length) return reject(new Error('Item not found'));

        resolve(result.rows[0]);
      });
    });
  }

  deleteItem(id) {
    return new Promise((resolve, reject) => {
      if (!id) return reject(new Error('ID must be specified'));

      this.client.query('DELETE FROM item WHERE uuid = $1 AND api_key = $2', [ id, this.apiKey ], (err, result) => {
        if (err) return reject(err);
        if (!result.rowCount) return reject(new Error('Item not found'));

        resolve({rows_deleted: result.rowCount});
      });
    });
  }

  validateValues(values, possibleValues) {
    if (!values) throw new Error('No values specified');
    if (typeof values !== 'object') throw new Error('Values must be a map');

    if (possibleValues.includes('description') && Object.prototype.hasOwnProperty.call(values, 'description')) {
      values.description = values.description.toString();

      if (typeof values.description !== 'string') {
        throw new Error('Description must be a string');
      }
    }

    if (possibleValues.includes('done') && Object.prototype.hasOwnProperty.call(values, 'done')) {
      if (values.done === 'true') {
        values.done = true;
      }
      if (values.done === 'false') {
        values.done = false;
      }
      if (typeof values.done !== 'boolean') {
        throw new Error('done must be a boolean');
      }
    }

    if (possibleValues.includes('do_before') && Object.prototype.hasOwnProperty.call(values, 'do_before')) {
      values.do_before = parseInt(values.do_before);

      if ((!values.do_before && values.do_before !== 0) || values.do_before < 0) {
        throw new Error('do_before must be a positive integer');
      } 
    }

    const validatedValues = {};

    for (let val of possibleValues) {
      if (Object.prototype.hasOwnProperty.call(values, val)) {
        validatedValues[val] = values[val];
      }
    }

    return validatedValues;
  }
}
