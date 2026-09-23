import type { ItemCotizacion } from './tipos';

export const moneda = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

/** IVA general en Colombia. */
export const IVA_POR_DEFECTO = 19;

export interface Cliente {
  nombre: string;
  documento: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  correo: string;
}

export const CLIENTE_VACIO: Cliente = {
  nombre: '',
  documento: '',
  direccion: '',
  ciudad: '',
  telefono: '',
  correo: '',
};

export interface Totales {
  subtotal: number;
  montoIva: number;
  total: number;
}

export function calcularTotales(items: ItemCotizacion[], iva: number): Totales {
  const subtotal = items.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0);
  const montoIva = subtotal * (iva / 100);
  return { subtotal, montoIva, total: subtotal + montoIva };
}

/** Datos de la cotización ya confirmada, lista para vista previa y PDF. */
export interface Cotizacion {
  folio: string;
  fecha: Date;
  cliente: Cliente;
  items: ItemCotizacion[];
  iva: number;
  formaPago: string;
  vendedor: string;
  observaciones: string;
}

export const FORMAS_PAGO = ['Contado', 'Crédito 15 días', 'Crédito 30 días', 'Crédito 60 días'];

export function nuevoFolio(fecha = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `COT-${fecha.getFullYear()}${p(fecha.getMonth() + 1)}${p(fecha.getDate())}-${p(fecha.getHours())}${p(fecha.getMinutes())}${p(fecha.getSeconds())}`;
}

export function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Etiqueta y valor de cada dato del cliente, con guion cuando está vacío. */
export function camposCliente(cliente: Cliente): { etiqueta: string; valor: string }[] {
  return [
    { etiqueta: 'Cliente', valor: cliente.nombre },
    { etiqueta: 'NIT / C.C.', valor: cliente.documento },
    { etiqueta: 'Dirección', valor: cliente.direccion },
    { etiqueta: 'Ciudad', valor: cliente.ciudad },
    { etiqueta: 'Teléfono', valor: cliente.telefono },
    { etiqueta: 'Correo', valor: cliente.correo },
  ].map((c) => ({ ...c, valor: c.valor.trim() || '—' }));
}
