INSERT INTO products (name, description, price, stock, category)
SELECT seed.name, seed.description, seed.price, seed.stock, seed.category
FROM (VALUES
  ('Café de Chiapas 500 g', 'Café molido de altura, tostado medio.', 189.50, 25, 'Abarrotes'),
  ('Té verde orgánico 20 sobres', 'Té verde orgánico en sobres individuales.', 79.00, 40, 'Abarrotes'),
  ('Miel de abeja apiario 350 g', 'Miel natural de producción local.', 125.00, 18, 'Abarrotes'),
  ('Chocolate amargo 70% 100 g', 'Barra de chocolate con cacao mexicano.', 68.50, 32, 'Abarrotes'),
  ('Aceite de oliva extra virgen 500 ml', 'Aceite prensado en frío.', 219.00, 14, 'Abarrotes'),
  ('Arroz integral 1 kg', 'Arroz integral de grano largo.', 49.90, 50, 'Abarrotes'),
  ('Pasta artesanal 500 g', 'Pasta de trigo duro, corte fusilli.', 72.00, 28, 'Abarrotes'),
  ('Galletas de avena 250 g', 'Galletas horneadas con avena y pasas.', 59.00, 21, 'Abarrotes'),
  ('Agua mineral 1 L', 'Agua mineral con gas.', 26.00, 60, 'Bebidas'),
  ('Jugo de naranja 1 L', 'Jugo de naranja pasteurizado.', 54.00, 24, 'Bebidas'),
  ('Shampoo de sábila 400 ml', 'Shampoo para uso diario.', 96.00, 16, 'Cuidado personal'),
  ('Jabón artesanal de lavanda', 'Jabón vegetal elaborado a mano.', 48.00, 35, 'Cuidado personal'),
  ('Detergente biodegradable 1 L', 'Detergente líquido para ropa.', 112.00, 19, 'Limpieza'),
  ('Servilletas recicladas 100 pzas', 'Paquete de servilletas de papel reciclado.', 39.50, 45, 'Hogar'),
  ('Bolsa reutilizable de algodón', 'Bolsa plegable para compras.', 89.00, 27, 'Hogar')
) AS seed(name, description, price, stock, category)
WHERE NOT EXISTS (SELECT 1 FROM products existing WHERE existing.name = seed.name);

