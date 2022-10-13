
export async function log(client, type, message) {
  const timestamp = Math.floor(Date.now() / 1000);

  return new Promise((resolve, reject) => {
    client.query('INSERT INTO log(type, message, timestamp) VALUES ($1, $2, $3) RETURNING *', [type, message, timestamp], (err, res) => {
      if (err) return reject(err);
      console.log(`[${type}] ${message} - ${timestamp}`);
      resolve();
    });
  });
}