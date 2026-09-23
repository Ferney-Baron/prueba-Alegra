import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CotizacionService } from './cotizacion.service';
import { TipoImagen } from './extraccion';

const TIPOS_PERMITIDOS: TipoImagen[] = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const TAMANO_MAXIMO = 5 * 1024 * 1024;

@Controller('cotizacion')
export class CotizacionController {
  constructor(private readonly cotizacionService: CotizacionService) {}

  @Post('extraer')
  @UseInterceptors(FileInterceptor('imagen', { limits: { fileSize: TAMANO_MAXIMO } }))
  extraer(@UploadedFile() archivo?: Express.Multer.File) {
    if (!archivo) {
      throw new BadRequestException('Envía una imagen en el campo "imagen".');
    }
    if (!TIPOS_PERMITIDOS.includes(archivo.mimetype as TipoImagen)) {
      throw new BadRequestException('Formato no soportado. Usa PNG, JPG, WEBP o GIF.');
    }
    return this.cotizacionService.extraer(archivo.buffer, archivo.mimetype as TipoImagen);
  }
}
