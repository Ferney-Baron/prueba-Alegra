# Cotizador de medicamentos desde imagen

App de prueba: subes la imagen de una cotización o pedido, una IA con visión (OpenAI o Claude) lee los productos, los relaciona con el catálogo estático `backend/data/productos.json` y la app arma la cotización con los precios del catálogo (subtotal, IVA editable y total).

Flujo: subir imagen → revisar/editar productos → **Ver cotización** (vista previa con folio, fecha, cliente, productos, subtotal, IVA y total) → **Descargar PDF**.

- **backend/** — NestJS (puerto 3000)
  - `GET  /api/productos` — catálogo
  - `POST /api/cotizacion/extraer` — multipart, campo `imagen` (PNG/JPG/WEBP/GIF, máx. 5 MB)
- **frontend/** — React + Vite (puerto 5173, redirige `/api` al backend)

> Documentación completa (arquitectura, API, personalización y limitaciones): [DOCUMENTACION.md](DOCUMENTACION.md)

## Requisitos
- Node.js 20 o superior
- Una API key **con saldo** de OpenAI (https://platform.openai.com/api-keys) o de Anthropic (https://console.anthropic.com/).
  Los planes ChatGPT Plus / Claude Pro no incluyen saldo de API: se paga aparte, por consumo.

## Cómo correrla
1. Configura `backend/.env`:
   ```
   PROVEEDOR_IA=openai          # o claude
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-5.4-mini    # cualquier modelo de OpenAI con visión
   ANTHROPIC_API_KEY=           # solo si usas PROVEEDOR_IA=claude
   ```
   Si omites `PROVEEDOR_IA`, se usa OpenAI cuando hay `OPENAI_API_KEY` y Claude en otro caso.
2. Backend (terminal 1):
   ```
   cd backend
   npm install
   npm run start:dev
   ```
3. Frontend (terminal 2):
   ```
   cd frontend
   npm install
   npm run dev
   ```
4. Abre http://localhost:5173 y sube `ejemplos/cotizacion-ejemplo.png`.

En la imagen de ejemplo hay 6 productos que sí están en el catálogo (algunos abreviados o mal escritos) y uno que no está (Tramadol). Ese aparece en "No encontrados en el catálogo".

## Personalizar
- **Empresa y color:** `frontend/src/empresa.ts` (nombre, NIT, dirección, teléfono, correo, web y el rojo corporativo `COLOR_EMPRESA` / `COLOR_EMPRESA_RGB`). Los datos actuales son ficticios.
- **Datos del cliente:** se escriben en la app antes de generar la cotización y salen en la vista previa y en el PDF.

## Cambiar el catálogo
Edita `backend/data/productos.json` (campos: `id`, `codigo`, `nombre`, `presentacion`, `laboratorio`, `precio`) y reinicia el backend.
