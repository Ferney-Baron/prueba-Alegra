import { useMemo, useState } from 'react';
import { calcularTotales, formatearFecha, FORMAS_PAGO, moneda, type Cliente } from '../cotizacion';
import DatosCliente from './DatosCliente';
import type { ItemCotizacion, Producto } from '../tipos';

interface Props {
  folio: string;
  fecha: Date;
  items: ItemCotizacion[];
  onCambiar: (items: ItemCotizacion[]) => void;
  catalogo: Producto[];
  iva: number;
  onCambiarIva: (iva: number) => void;
  cliente: Cliente;
  onCambiarCliente: (cliente: Cliente) => void;
  formaPago: string;
  onCambiarFormaPago: (formaPago: string) => void;
  vendedor: string;
  onCambiarVendedor: (vendedor: string) => void;
  observaciones: string;
  onCambiarObservaciones: (observaciones: string) => void;
  onVerCotizacion: () => void;
}

export default function TablaCotizacion({
  folio,
  fecha,
  items,
  onCambiar,
  catalogo,
  iva,
  onCambiarIva,
  cliente,
  onCambiarCliente,
  formaPago,
  onCambiarFormaPago,
  vendedor,
  onCambiarVendedor,
  observaciones,
  onCambiarObservaciones,
  onVerCotizacion,
}: Props) {
  const [seleccion, setSeleccion] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [notaAbierta, setNotaAbierta] = useState<number | null>(null);

  const { subtotal, montoIva, total } = calcularTotales(items, iva);

  const visibles = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    if (!t) return items;
    return items.filter((i) => [i.codigo, i.nombre, i.presentacion, i.laboratorio].join(' ').toLowerCase().includes(t));
  }, [items, busqueda]);

  function actualizar(productoId: number, cambios: Partial<ItemCotizacion>) {
    onCambiar(items.map((i) => (i.productoId === productoId ? { ...i, ...cambios } : i)));
  }

  function quitar(productoId: number) {
    onCambiar(items.filter((i) => i.productoId !== productoId));
    if (notaAbierta === productoId) setNotaAbierta(null);
  }

  function agregar() {
    const p = catalogo.find((c) => c.id === Number(seleccion));
    if (!p) return;
    const existente = items.find((i) => i.productoId === p.id);
    if (existente) {
      actualizar(p.id, { cantidad: existente.cantidad + 1 });
    } else {
      onCambiar([
        ...items,
        {
          productoId: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          presentacion: p.presentacion,
          laboratorio: p.laboratorio,
          precioUnitario: p.precio,
          cantidad: 1,
        },
      ]);
    }
    setSeleccion('');
  }

  return (
    <section className="panel">
      <div className="panel-titulo">
        <h2>Cotización #: {folio}</h2>
        <span>{formatearFecha(fecha)}</span>
      </div>

      <div className="panel-cuerpo">
        <div className="fila-datos">
          <label className="campo">
            Forma de pago
            <select value={formaPago} onChange={(e) => onCambiarFormaPago(e.target.value)}>
              {FORMAS_PAGO.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="campo">
            Vendedor
            <input
              type="text"
              placeholder="Nombre del asesor"
              value={vendedor}
              onChange={(e) => onCambiarVendedor(e.target.value)}
            />
          </label>
          <label className="campo">
            IVA (%)
            <input
              type="number"
              min={0}
              max={100}
              value={iva}
              onChange={(e) => onCambiarIva(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
        </div>

        <DatosCliente cliente={cliente} onCambiar={onCambiarCliente} />

        <div className="barra-tabla">
          <label className="campo campo-busqueda">
            Buscar
            <input
              type="search"
              placeholder="Producto, código o laboratorio"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>
          <div className="agregar">
            <select value={seleccion} onChange={(e) => setSeleccion(e.target.value)}>
              <option value="">Agregar producto del catálogo…</option>
              {catalogo.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — {p.presentacion} ({moneda.format(p.precio)})
                </option>
              ))}
            </select>
            <button onClick={agregar} disabled={!seleccion}>
              + Agregar
            </button>
          </div>
        </div>

        <div className="tabla-scroll">
          <table className="tabla-datos">
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Código</th>
                <th>Producto</th>
                <th>Laboratorio</th>
                <th className="num">Cant.</th>
                <th className="num">Precio unit.</th>
                <th className="num">Subtotal</th>
                <th className="col-acciones" />
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={8} className="vacio">
                    {items.length === 0
                      ? 'No hay productos del catálogo en la cotización.'
                      : 'Ningún producto coincide con la búsqueda.'}
                  </td>
                </tr>
              )}
              {visibles.map((i, n) => (
                <tr key={i.productoId}>
                  <td className="col-num">{n + 1}</td>
                  <td className="codigo">{i.codigo}</td>
                  <td>
                    <div className="producto">{i.nombre}</div>
                    <div className="detalle">{i.presentacion}</div>
                    {i.textoDetectado && (
                      <div className="detalle">
                        Leído: “{i.textoDetectado}”
                        {i.confianza && i.confianza !== 'alta' && (
                          <span className={`chip ${i.confianza}`}>confianza {i.confianza}</span>
                        )}
                      </div>
                    )}
                    {notaAbierta === i.productoId ? (
                      <input
                        className="nota-input"
                        autoFocus
                        placeholder="Nota para este producto"
                        value={i.nota ?? ''}
                        onChange={(e) => actualizar(i.productoId, { nota: e.target.value })}
                        onBlur={() => setNotaAbierta(null)}
                      />
                    ) : (
                      i.nota && <div className="detalle nota">Nota: {i.nota}</div>
                    )}
                  </td>
                  <td className="detalle">{i.laboratorio}</td>
                  <td className="num">
                    <input
                      type="number"
                      min={1}
                      value={i.cantidad}
                      onChange={(e) => actualizar(i.productoId, { cantidad: Math.max(1, Number(e.target.value) || 1) })}
                    />
                  </td>
                  <td className="num">{moneda.format(i.precioUnitario)}</td>
                  <td className="num importe">{moneda.format(i.precioUnitario * i.cantidad)}</td>
                  <td className="col-acciones">
                    <button
                      className="icono"
                      title="Agregar nota"
                      onClick={() => setNotaAbierta(notaAbierta === i.productoId ? null : i.productoId)}
                    >
                      ✎
                    </button>
                    <button className="icono peligro" title="Quitar" onClick={() => quitar(i.productoId)}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6}>Subtotal</td>
                <td className="num">{moneda.format(subtotal)}</td>
                <td />
              </tr>
              <tr>
                <td colSpan={6}>IVA ({iva}%)</td>
                <td className="num">{moneda.format(montoIva)}</td>
                <td />
              </tr>
              <tr className="fila-total">
                <td colSpan={6}>Total</td>
                <td className="num">{moneda.format(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="conteo">
          Mostrando {visibles.length} de {items.length} {items.length === 1 ? 'producto' : 'productos'}.
        </p>

        <label className="campo">
          Observaciones
          <textarea
            rows={3}
            placeholder="Comentario de cierre que aparecerá en la cotización"
            value={observaciones}
            onChange={(e) => onCambiarObservaciones(e.target.value)}
          />
        </label>

        <div className="acciones">
          <button onClick={onVerCotizacion} disabled={items.length === 0}>
            Ver cotización
          </button>
        </div>
      </div>
    </section>
  );
}
