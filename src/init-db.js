require('dotenv').config();
const fs = require('node:fs/promises');
const path = require('node:path');
const { pool } = require('./db');

async function run() {
  const schema = await fs.readFile(path.join(__dirname, '../db/schema.sql'), 'utf8');
  const seed = await fs.readFile(path.join(__dirname, '../db/seed.sql'), 'utf8');
  let lastError;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      await pool.query(schema);
      await pool.query(seed);
      console.log('Esquema listo y productos iniciales cargados.');
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 12) await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  throw lastError;
}

run().catch((error) => {
  console.error('No se pudo inicializar PostgreSQL:', error.message);
  process.exitCode = 1;
}).finally(() => pool.end());

