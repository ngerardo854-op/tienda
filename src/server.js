require('dotenv').config();

const express = require('express');
const { pool } = require('./db');

const app = express();
app.use(express.json({ limit: '100kb' }));

const fields = ['name', 'description', 'price', 'stock', 'category'];
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

function validateProduct(body, { partial = false } = {}) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['El cuerpo debe ser un objeto JSON.'], values: {} };
  }
  if (!partial && (!has(body, 'name') || !has(body, 'price'))) errors.push('name y price son obligatorios.');
  if (partial && !fields.some((field) => has(body, field))) errors.push('Incluye al menos un campo para actualizar.');

  const values = {};
  if (has(body, 'name')) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 160) errors.push('name debe ser texto de 1 a 160 caracteres.');
    else values.name = body.name.trim();
  }
  if (has(body, 'description')) {
    if (typeof body.description !== 'string') errors.push('description debe ser texto.');
    else values.description = body.description;
  }
  if (has(body, 'price')) {
    const price = Number(body.price);
    if (body.price === '' || !Number.isFinite(price) || price < 0) errors.push('price debe ser un número mayor o igual a 0.');
    else values.price = price;
  }
  if (has(body, 'stock')) {
    if (!Number.isInteger(body.stock) || body.stock < 0) errors.push('stock debe ser un entero mayor o igual a 0.');
    else values.stock = body.stock;
  }
  if (has(body, 'category')) {
    if (typeof body.category !== 'string' || body.category.length > 100) errors.push('category debe ser texto de hasta 100 caracteres.');
    else values.category = body.category.trim();
  }
  return { errors, values };
}

function parseId(value) {
  return /^\d+$/.test(value) && BigInt(value) > 0n;
}

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/products', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      params.push(`%${req.query.search.trim()}%`);
      conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }
    if (typeof req.query.category === 'string' && req.query.category.trim()) {
      params.push(req.query.category.trim());
      conditions.push(`category = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM products ${where}`, params);
    const listResult = await pool.query(
      `SELECT id, name, description, price, stock, category, created_at, updated_at
       FROM products ${where} ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    res.json({ data: listResult.rows, pagination: { page, limit, total: countResult.rows[0].total } });
  } catch (error) { next(error); }
});

app.get('/api/products/:id', async (req, res, next) => {
  if (!parseId(req.params.id)) return res.status(400).json({ error: 'ID inválido.' });
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json({ data: result.rows[0] });
  } catch (error) { next(error); }
});

app.post('/api/products', async (req, res, next) => {
  const { errors, values } = validateProduct(req.body);
  if (errors.length) return res.status(400).json({ error: 'Datos inválidos.', details: errors });
  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock, category)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [values.name, values.description ?? '', values.price, values.stock ?? 0, values.category ?? '']
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) { next(error); }
});

app.patch('/api/products/:id', async (req, res, next) => {
  if (!parseId(req.params.id)) return res.status(400).json({ error: 'ID inválido.' });
  const { errors, values } = validateProduct(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: 'Datos inválidos.', details: errors });
  try {
    const updates = fields.filter((field) => has(values, field));
    const params = updates.map((field) => values[field]);
    const assignments = updates.map((field, index) => `${field} = $${index + 1}`);
    assignments.push('updated_at = NOW()');
    params.push(req.params.id);
    const result = await pool.query(`UPDATE products SET ${assignments.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
    if (!result.rowCount) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json({ data: result.rows[0] });
  } catch (error) { next(error); }
});

app.delete('/api/products/:id', async (req, res, next) => {
  if (!parseId(req.params.id)) return res.status(400).json({ error: 'ID inválido.' });
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.status(204).end();
  } catch (error) { next(error); }
});

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'JSON inválido.' });
  res.status(500).json({ error: 'Error interno del servidor.' });
});

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, () => console.log(`API disponible en http://localhost:${port}`));
async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

