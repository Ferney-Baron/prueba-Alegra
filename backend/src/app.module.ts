import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductosModule } from './productos/productos.module';
import { CotizacionModule } from './cotizacion/cotizacion.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ProductosModule, CotizacionModule],
})
export class AppModule {}
