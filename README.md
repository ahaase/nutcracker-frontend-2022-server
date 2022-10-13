# nutcracker-frontend-2022-server

### SETUP

- Install docker
- Install node.js
- `npm ci`
- `npm run db:start`

### TEAR DOWN

- `npm run db:stop`

### START SERVER

Option 1: `npm start`

Option 2: `npm run forever:start` // To keep the server running

### OTHER COMMANDS

`npm run forever:list` // List forever processes

`npm run forever:stop` // Stop forever process with ID 0. WARNING! This is not necessarily the correct forever process

# API DOCS

There is a request limiter in place set to allow 10 requests per 10 seconds.

To use any endpoint you need to include an API key in your headers:

`headers['api-key'] = 'abcd1234'`

Each API key gets some sample data upon first usage.

## LIST ITEMS
GET `/api/item`

## RETRIEVE ITEM
GET `/api/item/<ID>`

## CREATE ITEM
POST `/api/item`

Payload (All values are optional):
```
{
  description: String, // Optional
  do_before: Integer
}
```
## UPDATE ITEM
PUT `/api/item/<ID>`

Payload (All values are optional):
```
{
  description: String,
  do_before: Integer,
  done: Boolean
}
```
## DELETE ITEM
DELETE `/api/item/<ID>`
