import { Module } from '@nestjs/common';
import { ProductosModule } from '../productos/productos.module';
import { CotizacionController } from './cotizacion.controller';
import { CotizacionService } from './cotizacion.service';
import { ClaudeService } from './claude.service';
import { OpenAIService } from './openai.service';

@Module({
  imports: [ProductosModule],
  controllers: [CotizacionController],
  providers: [CotizacionService, ClaudeService, OpenAIService],
})
export class CotizacionModule {}
