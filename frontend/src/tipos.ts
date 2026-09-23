export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  presentacion: string;
  laboratorio: string;
  precio: number;
}

export interface ItemCotizacion {
  productoId: number;
  codigo: string;
  nombre: string;
  presentacion: string;
  laboratorio: string;
  precioUnitario: number;
  cantidad: number;
  nota?: string;
  textoDetectado?: string;
  confianza?: 'alta' | 'media' | 'baja';
}

export interface NoEncontrado {
  textoDetectado: string;
  cantidad: number;
}

export interface RespuestaExtraccion {
  items: ItemCotizacion[];
  noEncontrados: NoEncontrado[];
}
