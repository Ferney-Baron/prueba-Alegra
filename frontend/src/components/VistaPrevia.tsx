import { useState } from 'react';
import { calcularTotales, camposCliente, formatearFecha, moneda, type Cotizacion } from '../cotizacion';
import { EMPRESA } from '../empresa';

interface Props {
  cotizacion: Cotizacion;
  onEditar: () => void;
}

export default function VistaPrevia({ cotizacion, onEditar }: Props) {
  const { subtotal, montoIva, total } = calcularTotales(cotizacion.items, cotizacion.iva);
  const [generando, setGenerando] = useState(false);

  async function descargar() {
    setGenerando(true);
    try {
      // jsPDF es pesado: se carga solo cuando se pide el PDF.
      const { descargarPdf } = await import('../pdf');
      descargarPdf(cotizacion);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <section className="tarjeta">
      <div className="barra-previa">
        <button className="secundario" onClick={onEditar}>
          ← Editar
        </button>
        <button onClick={descargar} disabled={generando}>
          {generando ? 'Generando…' : 'Descargar PDF'}
        </button>
      </div>

      <div className="hoja">
        <div className="hoja-encabezado">
          <div>
            <div className="empresa-nombre">{EMPRESA.nombre}</div>
            <div className="empresa-datos">
              {EMPRESA.eslogan}
              <br />
              {EMPRESA.nit} · {EMPRESA.direccion}
              <br />
              {EMPRESA.telefono} · {EMPRESA.correo} · {EMPRESA.web}
            </div>
          </div>
          <div className="hoja-meta">
            <h2>COTIZACIÓN</h2>
            <div>Folio: {cotizacion.folio}</div>
            <div>Fecha: {formatearFecha(cotizacion.fecha)}</div>
            <div>Forma de pago: {cotizacion.formaPago}</div>
            {cotizacion.vendedor && <div>Vendedor: {cotizacion.vendedor}</div>}
          </div>
        </div>

        <div className="caja-cliente">
          <h3>Datos del cliente</h3>
          <dl>
            {camposCliente(cotizacion.cliente).map((campo) => (
              <div key={campo.etiqueta}>
                <dt>{campo.etiqueta}</dt>
                <dd>{campo.valor}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="tabla-scroll">
          <table className="tabla-datos">
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Producto</th>
                <th>Laboratorio</th>
                <th className="num">Cant.</th>
                <th className="num">Precio unit.</th>
                <th className="num">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {cotizacion.items.map((i, n) => (
                <tr key={i.productoId}>
                  <td className="col-num">{n + 1}</td>
                  <td>
                    <div className="producto">{i.nombre}</div>
                    <div className="detalle">{i.presentacion}</div>
                    {i.nota && <div className="detalle nota">Nota: {i.nota}</div>}
                  </td>
                  <td className="detalle">{i.laboratorio}</td>
                  <td className="num">{i.cantidad}</td>
                  <td className="num">{moneda.format(i.precioUnitario)}</td>
                  <td className="num importe">{moneda.format(i.precioUnitario * i.cantidad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="totales">
          <div>
            <span>Subtotal</span>
            <span>{moneda.format(subtotal)}</span>
          </div>
          <div>
            <span>IVA ({cotizacion.iva}%)</span>
            <span>{moneda.format(montoIva)}</span>
          </div>
          <div className="total">
            <span>Total</span>
            <span>{moneda.format(total)}</span>
          </div>
        </div>

        {cotizacion.observaciones && (
          <div className="observaciones">
            <h3>Observaciones</h3>
            <p>{cotizacion.observaciones}</p>
          </div>
        )}

        <p className="hoja-pie">Cotización válida por 15 días. Precios sujetos a disponibilidad de inventario.</p>
      </div>
    </section>
  );
}
