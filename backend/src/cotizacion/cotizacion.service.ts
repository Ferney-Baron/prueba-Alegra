import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductosService } from '../productos/productos.service';
import { ClaudeService } from './claude.service';
import { OpenAIService } from './openai.service';
import { ExtractorIA, TipoImagen } from './extraccion';

export interface ItemCotizacion {
  productoId: number;
  codigo: string;
  nombre: string;
  presentacion: string;
  laboratorio: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
  textoDetectado: string;
  confianza: 'alta' | 'media' | 'baja';
}

export interface NoEncontrado {
  textoDetectado: string;
  cantidad: number;
}

@Injectable()
export class CotizacionService {
  private readonly extractor: ExtractorIA;

  constructor(
    private readonly productos: ProductosService,
    config: ConfigService,
    claude: ClaudeService,
    openai: OpenAIService,
  ) {
    // PROVEEDOR_IA manda; si no está, se usa OpenAI cuando hay OPENAI_API_KEY y Claude en otro caso.
    const proveedor = config.get<string>('PROVEEDOR_IA') || (config.get<string>('OPENAI_API_KEY') ? 'openai' : 'claude');
    this.extractor = proveedor.toLowerCase() === 'openai' ? openai : claude;
  }

  async extraer(imagen: Buffer, tipo: TipoImagen) {
    const extraccion = await this.extractor.extraerProductos(imagen, tipo, this.productos.listar());

    const items: ItemCotizacion[] = [];
    const noEncontrados: NoEncontrado[] = [];

    for (const item of extraccion.items) {
      const cantidad = Math.max(1, Math.round(item.cantidad) || 1);
      // El id lo propone el modelo; solo se acepta si existe en el catálogo.
      const producto = item.productoId != null ? this.productos.buscarPorId(item.productoId) : undefined;
      if (!producto) {
        noEncontrados.push({ textoDetectado: item.textoDetectado, cantidad });
        continue;
      }
      const existente = items.find((i) => i.productoId === producto.id);
      if (existente) {
        existente.cantidad += cantidad;
        existente.subtotal = existente.cantidad * existente.precioUnitario;
        continue;
      }
      items.push({
        productoId: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        presentacion: producto.presentacion,
        laboratorio: producto.laboratorio,
        precioUnitario: producto.precio,
        cantidad,
        subtotal: cantidad * producto.precio,
        textoDetectado: item.textoDetectado,
        confianza: item.confianza,
      });
    }

    return { items, noEncontrados };
  }
}
