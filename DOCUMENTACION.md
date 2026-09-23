# Documentación — Cotizador de medicamentos desde imagen

Aplicación web de prueba que recibe la **imagen** de una cotización, pedido o lista de medicamentos, extrae los productos con un modelo de IA con visión, los relaciona con un **catálogo estático** y arma una cotización con los precios de ese catálogo. La cotización se revisa en pantalla y se descarga en PDF.

- **Moneda:** pesos colombianos (COP), sin decimales.
- **IVA:** 19 % por defecto, editable en pantalla.
- **Alcance:** es una prueba local. No tiene base de datos, autenticación ni despliegue.

---

## 1. Arquitectura

```
Navegador (React + Vite, puerto 5173)
   │  multipart: imagen
   ▼
Backend (NestJS, puerto 3000)
   │  imagen en base64 + catálogo resumido
   ▼
API de IA con visión (OpenAI o Anthropic)
   │  JSON estructurado: [{ textoDetectado, cantidad, productoId, confianza }]
   ▼
Backend valida cada productoId contra data/productos.json
   │  items con precio + noEncontrados
   ▼
Navegador: tabla editable → vista previa → PDF (se genera en el navegador)
```

Dos decisiones que explican el diseño:

1. **El precio nunca lo pone la IA.** El modelo solo devuelve un `productoId`; el backend busca ese id en el catálogo y toma de ahí el precio, el nombre y la presentación. Si el id no existe, la línea se descarta y pasa a `noEncontrados`.
2. **El PDF se genera en el navegador** (jsPDF). No pasa por el backend ni consume llamadas a la API.

### Flujo de la interfaz

1. **Subir imagen** — arrastrar o seleccionar (PNG, JPG, WEBP, GIF; máx. 5 MB).
2. **Editar** — tabla con los productos encontrados: cantidades, notas por producto, quitar, agregar del catálogo, buscador, forma de pago, vendedor, IVA, datos del cliente y observaciones.
3. **Ver cotización** — vista previa con el encabezado de la empresa, los datos del cliente, el detalle y los totales.
4. **Descargar PDF** — archivo tamaño carta con el nombre del folio, por ejemplo `COT-20260923-101530.pdf`.

---

## 2. Estructura del proyecto

```
Nueva carpeta (2)/
├─ backend/                      NestJS + TypeScript
│  ├─ data/productos.json        Catálogo estático (30 productos)
│  ├─ src/
│  │  ├─ main.ts                 Arranque, prefijo /api, CORS para 5173
│  │  ├─ app.module.ts           Módulo raíz (ConfigModule global)
│  │  ├─ productos/              Catálogo
│  │  │  ├─ producto.interface.ts
│  │  │  ├─ productos.service.ts    Carga el JSON al iniciar; índice por id
│  │  │  ├─ productos.controller.ts GET /api/productos
│  │  │  └─ productos.module.ts
│  │  └─ cotizacion/             Extracción y armado
│  │     ├─ extraccion.ts           Esquema Zod, interfaz ExtractorIA y prompt
│  │     ├─ openai.service.ts       Implementación con OpenAI
│  │     ├─ claude.service.ts       Implementación con Anthropic
│  │     ├─ cotizacion.service.ts   Valida ids, calcula subtotales, agrupa
│  │     ├─ cotizacion.controller.ts POST /api/cotizacion/extraer
│  │     └─ cotizacion.module.ts
│  ├─ .env                       Claves y configuración (no se versiona)
│  └─ .env.example
├─ frontend/                     React 19 + Vite + TypeScript
│  └─ src/
│     ├─ main.tsx                Punto de entrada
│     ├─ App.tsx                 Estado general y navegación entre pantallas
│     ├─ tipos.ts                Tipos que vienen del backend
│     ├─ cotizacion.ts           Moneda, totales, folio, cliente, formas de pago
│     ├─ empresa.ts              Datos ficticios de la empresa y color rojo
│     ├─ pdf.ts                  Construcción del PDF con jsPDF
│     ├─ estilos.css             Estilos (un solo archivo)
│     └─ components/
│        ├─ BarraEmpresa.tsx     Barra roja superior
│        ├─ SubirImagen.tsx      Carga de la imagen y llamada al backend
│        ├─ DatosCliente.tsx     Formulario del cliente
│        ├─ TablaCotizacion.tsx  Tabla editable, buscador y totales
│        └─ VistaPrevia.tsx      Hoja de cotización y botón de PDF
└─ ejemplos/
   ├─ cotizacion-ejemplo.png     Imagen de prueba impresa
   ├─ generar_ejemplo.py         Script que la regenera (requiere Pillow)
   └─ WhatsApp Image ... .jpeg   Lista escrita a mano, para probar casos difíciles
```

---

## 3. Requisitos e instalación

- **Node.js 20 o superior** (probado con Node 24).
- **API key con saldo** de OpenAI (https://platform.openai.com/api-keys) o de Anthropic (https://console.anthropic.com/).
  Los planes de suscripción ChatGPT Plus y Claude Pro **no** incluyen saldo de API: se paga aparte, por consumo.

```bash
cd backend  && npm install
cd frontend && npm install
```

### Variables de entorno (`backend/.env`)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PROVEEDOR_IA` | No | `openai` o `claude`. Si falta, usa OpenAI cuando hay `OPENAI_API_KEY`, y Claude en otro caso. |
| `OPENAI_API_KEY` | Sí con OpenAI | Clave de platform.openai.com. |
| `OPENAI_MODEL` | No | Modelo con visión. Por defecto `gpt-5.4-mini`. |
| `ANTHROPIC_API_KEY` | Sí con Claude | Clave de console.anthropic.com. |
| `PORT` | No | Puerto del backend. Por defecto `3000`. |

Los clientes de IA se crean **al primer uso**, no al arrancar, para que el servidor levante aunque falte una clave.

### Ejecución

```bash
# Terminal 1
cd backend && npm run start:dev     # http://localhost:3000/api

# Terminal 2
cd frontend && npm run dev          # http://localhost:5173
```

Vite redirige `/api` al puerto 3000, así que en desarrollo no hay problemas de CORS. Para compilar: `npm run build` en cada carpeta.

---

## 4. API del backend

Prefijo global: `/api`.

### `GET /api/productos`

Devuelve el catálogo completo.

```json
[
  {
    "id": 1,
    "codigo": "MED-001",
    "nombre": "Paracetamol",
    "presentacion": "500 mg, caja 20 tabletas",
    "laboratorio": "Genfar",
    "precio": 4500
  }
]
```

### `POST /api/cotizacion/extraer`

`multipart/form-data` con el campo **`imagen`**. Acepta `image/png`, `image/jpeg`, `image/webp` e `image/gif`, hasta 5 MB.

Respuesta:

```json
{
  "items": [
    {
      "productoId": 2,
      "codigo": "MED-002",
      "nombre": "Ibuprofeno",
      "presentacion": "400 mg, caja 10 tabletas",
      "laboratorio": "MK",
      "precioUnitario": 6800,
      "cantidad": 10,
      "subtotal": 68000,
      "textoDetectado": "1. Ibuprofeno",
      "confianza": "alta"
    }
  ],
  "noEncontrados": [{ "textoDetectado": "Tramadol 50 mg gotas", "cantidad": 6 }]
}
```

- `textoDetectado` es el texto leído en la imagen; sirve para revisar la lectura.
- `confianza` vale `alta`, `media` o `baja`. La interfaz marca las dos últimas.
- Si el mismo producto aparece varias veces, las cantidades se suman en una sola línea.

Ejemplo con curl:

```bash
curl -F "imagen=@ejemplos/cotizacion-ejemplo.png" http://localhost:3000/api/cotizacion/extraer
```

### Errores

| Código | Cuándo |
|---|---|
| 400 | Falta el archivo o el formato no es una imagen admitida. |
| 429 | Límite de uso alcanzado, o la cuenta de OpenAI no tiene saldo (`insufficient_quota`). |
| 422 | El modelo no devolvió un resultado utilizable, o rechazó la imagen. |
| 500 | Falta la API key o es inválida. |
| 502 | Otro error de la API de IA. |

Todos llegan al frontend con un campo `message` en español, que se muestra bajo el botón de extraer.

---

## 5. Cómo se extraen los productos

`backend/src/cotizacion/extraccion.ts` concentra las dos piezas que comparten los proveedores:

- **El prompt** (`construirInstrucciones`): le manda al modelo el catálogo resumido (id, nombre y presentación) y le pide, por cada renglón de la imagen, el texto leído, la cantidad, el `productoId` correspondiente y el nivel de confianza. Le indica tolerar abreviaturas, mayúsculas, acentos faltantes y errores de ortografía, devolver `null` si no hay coincidencia, e ignorar encabezados, totales y datos del cliente.
- **El esquema de salida** (`ExtraccionSchema`, con Zod): obliga al modelo a responder en un formato fijo. OpenAI lo recibe vía `zodTextFormat` y Anthropic vía `zodOutputFormat`.

Agregar otro proveedor es implementar la interfaz `ExtractorIA` y registrarlo en `cotizacion.module.ts`.

**Validación posterior** (`cotizacion.service.ts`): cada `productoId` se busca en el catálogo y solo se acepta si existe; la cantidad se redondea con mínimo 1, y los repetidos se agrupan sumando cantidades.

---

## 6. Frontend

**Estado**: vive en `App.tsx` — catálogo, productos extraídos, no encontrados, IVA, cliente, forma de pago, vendedor, observaciones, folio y fecha. `previa` decide qué pantalla se ve: con valor muestra la vista previa; sin valor, la de edición.

**Cálculos**: `cotizacion.ts` tiene `calcularTotales` (subtotal, IVA y total), el formato de moneda (`es-CO` / `COP`, sin decimales), `nuevoFolio` (`COT-AAAAMMDD-HHMMSS`) y `camposCliente`, que arma las etiquetas del cliente y pone un guion donde falte el dato. Esas funciones las usan la tabla, la vista previa y el PDF, así que los tres siempre muestran lo mismo.

**PDF** (`pdf.ts`): tamaño carta, con franja roja de la empresa, recuadro del cliente en dos columnas, tabla con `jspdf-autotable`, totales, observaciones y pie de página. `jspdf` se carga con `import()` dinámico al pulsar "Descargar PDF", para no pesar en la carga inicial.

**Estilos**: un solo `estilos.css`, con los colores en variables sobre `:root`. El rojo sale de `--primario`.

---

## 7. Personalización

| Qué | Dónde |
|---|---|
| Productos y precios | `backend/data/productos.json` (reiniciar el backend: el archivo se lee al arrancar) |
| Empresa y color rojo | `frontend/src/empresa.ts` (`EMPRESA`, `COLOR_EMPRESA`, `COLOR_EMPRESA_RGB`) |
| Modelo de IA | `OPENAI_MODEL` en `backend/.env` |
| IVA por defecto | `IVA_POR_DEFECTO` en `frontend/src/cotizacion.ts` |
| Formas de pago | `FORMAS_PAGO` en `frontend/src/cotizacion.ts` |
| Textos del PDF | `frontend/src/pdf.ts` (validez, pie de página) |

Los datos de la empresa son ficticios: cámbialos por los reales antes de usar la cotización con clientes.

---

## 8. Limitaciones y pendientes

- **Sin persistencia.** Al recargar la página se pierde todo. No hay historial de cotizaciones ni consecutivo real: el folio se arma con la fecha y la hora.
- **Un solo catálogo fijo**, con precios de prueba en COP.
- **Sin autenticación.** Cualquiera que alcance el puerto 3000 puede gastar tu saldo de API. No lo expongas a internet como está.
- **La lectura puede fallar.** Las fotos torcidas, borrosas o con letra a mano son el caso difícil. Por eso la tabla es editable y se muestra el texto leído junto a cada producto.
- **IVA general.** Se aplica un solo porcentaje a toda la cotización. En Colombia muchos medicamentos están excluidos de IVA; si es tu caso, pon 0 % o pide que el IVA se maneje por producto.
- **Precisión del modelo sin medir.** `gpt-5.4-mini` se eligió por ser económico y leer imágenes, no porque se comparara con otros modelos sobre estas imágenes.

Ideas para seguir: guardar las cotizaciones en base de datos, consecutivo real, logo en el PDF, envío por correo, IVA por producto y varias listas de precios.

---

## 9. Solución de problemas

| Síntoma | Causa probable |
|---|---|
| "Falta OPENAI_API_KEY en backend/.env" | No hay clave configurada, o no reiniciaste el backend tras editar `.env`. |
| "Tu cuenta de OpenAI no tiene saldo" | Falta cargar crédito en platform.openai.com → Billing. |
| Cambios que no se ven en pantalla | Caché del navegador: recarga con `Ctrl+Shift+R`. |
| Cambios del catálogo que no aparecen | El JSON se lee al arrancar: reinicia el backend. |
| `node` no se reconoce en la terminal | Abre una terminal nueva después de instalar Node. |
| Error de compilación con TypeScript 7 | El backend usa NestJS, que hoy requiere TypeScript 6. |

---

## 10. Versiones

**Backend:** NestJS 12 · TypeScript 6 · `openai` 7 · `@anthropic-ai/sdk` 0.127 · Zod 4
**Frontend:** React 19 · Vite 8 · TypeScript 6 · jsPDF 4 · jspdf-autotable 5
