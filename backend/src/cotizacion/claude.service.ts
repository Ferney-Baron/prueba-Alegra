import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { Producto } from '../productos/producto.interface';
import { construirInstrucciones, Extraccion, ExtraccionSchema, ExtractorIA, TipoImagen } from './extraccion';

@Injectable()
export class ClaudeService implements ExtractorIA {
  private client?: Anthropic;

  constructor(private readonly config: ConfigService) {}

  // Se crea al primer uso para que el servidor arranque aunque falte la key.
  private obtenerCliente(): Anthropic {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('Falta ANTHROPIC_API_KEY en backend/.env.');
    }
    return (this.client ??= new Anthropic({ apiKey }));
  }

  async extraerProductos(imagen: Buffer, tipo: TipoImagen, catalogo: Producto[]): Promise<Extraccion> {
    const client = this.obtenerCliente();
    let respuesta;
    try {
      respuesta = await client.messages.parse({
        model: 'claude-opus-5',
        max_tokens: 16000,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: tipo, data: imagen.toString('base64') } },
              { type: 'text', text: construirInstrucciones(catalogo) },
            ],
          },
        ],
        output_config: { format: zodOutputFormat(ExtraccionSchema) },
      });
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) {
        throw new InternalServerErrorException('API key de Anthropic inválida o ausente (revisa backend/.env).');
      }
      if (err instanceof Anthropic.RateLimitError) {
        throw new HttpException('Límite de uso de la API alcanzado, intenta de nuevo en un momento.', HttpStatus.TOO_MANY_REQUESTS);
      }
      if (err instanceof Anthropic.APIError) {
        throw new BadGatewayException(`Error de la API de Claude: ${err.message}`);
      }
      throw err;
    }

    if (respuesta.stop_reason === 'refusal') {
      throw new UnprocessableEntityException('Claude no pudo procesar esta imagen.');
    }
    if (!respuesta.parsed_output) {
      throw new UnprocessableEntityException('No se pudieron extraer productos de la imagen.');
    }
    return respuesta.parsed_output;
  }
}
