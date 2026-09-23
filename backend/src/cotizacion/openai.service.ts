import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { Producto } from '../productos/producto.interface';
import { construirInstrucciones, Extraccion, ExtraccionSchema, ExtractorIA, TipoImagen } from './extraccion';

@Injectable()
export class OpenAIService implements ExtractorIA {
  private client?: OpenAI;
  private readonly modelo: string;

  constructor(private readonly config: ConfigService) {
    this.modelo = config.get<string>('OPENAI_MODEL') || 'gpt-5.4-mini';
  }

  // Se crea al primer uso: el SDK lanza error si falta la key y no debe impedir que arranque el servidor.
  private obtenerCliente(): OpenAI {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('Falta OPENAI_API_KEY en backend/.env.');
    }
    return (this.client ??= new OpenAI({ apiKey }));
  }

  async extraerProductos(imagen: Buffer, tipo: TipoImagen, catalogo: Producto[]): Promise<Extraccion> {
    const client = this.obtenerCliente();
    let respuesta;
    try {
      respuesta = await client.responses.parse({
        model: this.modelo,
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_image', image_url: `data:${tipo};base64,${imagen.toString('base64')}`, detail: 'high' },
              { type: 'input_text', text: construirInstrucciones(catalogo) },
            ],
          },
        ],
        text: { format: zodTextFormat(ExtraccionSchema, 'extraccion') },
      });
    } catch (err) {
      if (err instanceof OpenAI.AuthenticationError) {
        throw new InternalServerErrorException('API key de OpenAI inválida o ausente (revisa backend/.env).');
      }
      if (err instanceof OpenAI.RateLimitError) {
        const mensaje =
          err.code === 'insufficient_quota'
            ? 'Tu cuenta de OpenAI no tiene saldo. Agrega crédito en platform.openai.com → Billing.'
            : 'Límite de uso de la API alcanzado, intenta de nuevo en un momento.';
        throw new HttpException(mensaje, HttpStatus.TOO_MANY_REQUESTS);
      }
      if (err instanceof OpenAI.APIError) {
        throw new BadGatewayException(`Error de la API de OpenAI: ${err.message}`);
      }
      throw err;
    }

    if (!respuesta.output_parsed) {
      throw new UnprocessableEntityException('No se pudieron extraer productos de la imagen.');
    }
    return respuesta.output_parsed;
  }
}
