import { z } from 'zod';
import { Producto } from '../productos/producto.interface';

export const ExtraccionSchema = z.object({
  items: z.array(
    z.object({
      textoDetectado: z.string(),
      cantidad: z.number(),
      productoId: z.number().nullable(),
      confianza: z.enum(['alta', 'media', 'baja']),
    }),
  ),
});

export type Extraccion = z.infer<typeof ExtraccionSchema>;

export type TipoImagen = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';

/** Un proveedor de IA capaz de leer la imagen y relacionarla con el catálogo. */
export interface ExtractorIA {
  extraerProductos(imagen: Buffer, tipo: TipoImagen, catalogo: Producto[]): Promise<Extraccion>;
}

export function construirInstrucciones(catalogo: Producto[]): string {
  const catalogoResumido = catalogo.map(({ id, nombre, presentacion }) => ({ id, nombre, presentacion }));
  return `La imagen es una cotización, pedido o lista de productos farmacéuticos.
Extrae cada renglón que represente un producto y relaciónalo con el catálogo de abajo.

Por cada producto de la imagen devuelve:
- textoDetectado: el texto del producto tal como aparece en la imagen.
- cantidad: la cantidad pedida (usa 1 si no aparece).
- productoId: el id del producto del catálogo que corresponde. Tolera abreviaturas, mayúsculas, acentos faltantes, errores de ortografía y nombres comerciales equivalentes. Si el principio activo o la concentración no coinciden con ningún producto del catálogo, usa null.
- confianza: "alta" si la coincidencia es clara, "media" si es probable, "baja" si es dudosa.

Ignora encabezados, totales, fechas y datos del cliente.

Catálogo:
${JSON.stringify(catalogoResumido)}`;
}
