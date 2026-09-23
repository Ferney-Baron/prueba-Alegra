import { Injectable, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Producto } from './producto.interface';

@Injectable()
export class ProductosService implements OnModuleInit {
  private productos: Producto[] = [];
  private porId = new Map<number, Producto>();

  onModuleInit() {
    const ruta = join(process.cwd(), 'data', 'productos.json');
    this.productos = JSON.parse(readFileSync(ruta, 'utf-8')) as Producto[];
    this.porId = new Map(this.productos.map((p) => [p.id, p]));
  }

  listar(): Producto[] {
    return this.productos;
  }

  buscarPorId(id: number): Producto | undefined {
    return this.porId.get(id);
  }
}
