# API de productos

API REST de productos para una tienda, construida con Node.js, Express y PostgreSQL. Incluye 15 productos de ejemplo y se puede iniciar con Docker Compose o desplegar en Render.

## Inicio local con Docker

Requiere Docker Desktop con Compose. Desde esta carpeta ejecuta:

```powershell
docker compose -f compose.yaml up --build
```

La API queda en `http://localhost:3000`; PostgreSQL en `localhost:5432`. La primera ejecución crea el esquema y carga los 15 productos. Para apagar los servicios usa `Ctrl+C` y luego `docker compose -f compose.yaml down`. Para borrar también la base local y sus datos, ejecuta `docker compose -f compose.yaml down -v`.

## Inicio local sin Docker

Requiere Node.js 20+ y PostgreSQL 14+. Copia `.env.example` a `.env`, configura `DATABASE_URL` con tus credenciales y crea la base `tienda`. Luego ejecuta:

```powershell
npm install
npm run db:init
npm run dev
```

`db:init` crea las tablas e inserta los productos de ejemplo si aún no existen.

## Despliegue en Render

El archivo `render.yaml` configura un servicio Docker y una instancia Render Postgres; el servicio obtiene `DATABASE_URL` de la base mediante `fromDatabase`. Al iniciar, el contenedor ejecuta `db:init` y luego la API.

1. Sube este proyecto a GitHub, GitLab o Bitbucket.
2. En Render elige **New → Blueprint** y conecta ese repositorio.
3. Revisa los recursos que propone `render.yaml` y crea el Blueprint.
4. Al terminar el despliegue, abre la URL del servicio y comprueba `/health` y `/api/products`.

Los planes están en `free` para facilitar una primera prueba; revisa en Render las condiciones vigentes de disponibilidad, suspensión y retención de datos antes de usarlo para producción.

## Rutas

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Estado del servicio |
| GET | `/api/products` | Lista productos; acepta `page`, `limit` (máximo 100), `search` y `category` |
| GET | `/api/products/:id` | Obtiene un producto |
| POST | `/api/products` | Crea un producto |
| PATCH | `/api/products/:id` | Actualiza uno o más campos |
| DELETE | `/api/products/:id` | Elimina un producto (respuesta 204) |

### Crear un producto

```http
POST /api/products
Content-Type: application/json

{
  "name": "Café de Chiapas",
  "description": "Bolsa de 500 g",
  "price": 189.50,
  "stock": 25,
  "category": "Bebidas"
}
```

`name` y `price` son obligatorios. `description`, `stock` y `category` son opcionales; sus valores por defecto son texto vacío o cero. Los precios y el inventario no pueden ser negativos.

### Consultar

```text
GET /api/products?page=1&limit=10
GET /api/products?search=café&category=Abarrotes
```

La lista responde con `{ "data": [...], "pagination": { "page", "limit", "total" } }`.

