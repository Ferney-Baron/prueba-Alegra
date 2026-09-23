import { useEffect, useState } from 'react';
import BarraEmpresa from './components/BarraEmpresa';
import SubirImagen from './components/SubirImagen';
import TablaCotizacion from './components/TablaCotizacion';
import VistaPrevia from './components/VistaPrevia';
import { CLIENTE_VACIO, FORMAS_PAGO, IVA_POR_DEFECTO, nuevoFolio, type Cliente, type Cotizacion } from './cotizacion';
import type { ItemCotizacion, NoEncontrado, Producto, RespuestaExtraccion } from './tipos';

export default function App() {
  const [catalogo, setCatalogo] = useState<Producto[]>([]);
  const [items, setItems] = useState<ItemCotizacion[] | null>(null);
  const [noEncontrados, setNoEncontrados] = useState<NoEncontrado[]>([]);
  const [iva, setIva] = useState(IVA_POR_DEFECTO);
  const [cliente, setCliente] = useState<Cliente>(CLIENTE_VACIO);
  const [formaPago, setFormaPago] = useState(FORMAS_PAGO[0]);
  const [vendedor, setVendedor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [encabezado, setEncabezado] = useState({ folio: '', fecha: new Date() });
  const [previa, setPrevia] = useState<Cotizacion | null>(null);

  useEffect(() => {
    fetch('/api/productos')
      .then((r) => r.json())
      .then(setCatalogo)
      .catch(() => setCatalogo([]));
  }, []);

  function alExtraer(res: RespuestaExtraccion) {
    const fecha = new Date();
    setEncabezado({ folio: nuevoFolio(fecha), fecha });
    setItems(res.items);
    setNoEncontrados(res.noEncontrados);
    setPrevia(null);
  }

  function verCotizacion() {
    if (!items) return;
    setPrevia({
      ...encabezado,
      cliente,
      items,
      iva,
      formaPago,
      vendedor: vendedor.trim(),
      observaciones: observaciones.trim(),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <BarraEmpresa />
      <div className="contenedor">
        {previa ? (
          <VistaPrevia cotizacion={previa} onEditar={() => setPrevia(null)} />
        ) : (
          <>
            <SubirImagen onResultado={alExtraer} />

            {items && (
              <TablaCotizacion
                folio={encabezado.folio}
                fecha={encabezado.fecha}
                items={items}
                onCambiar={setItems}
                catalogo={catalogo}
                iva={iva}
                onCambiarIva={setIva}
                cliente={cliente}
                onCambiarCliente={setCliente}
                formaPago={formaPago}
                onCambiarFormaPago={setFormaPago}
                vendedor={vendedor}
                onCambiarVendedor={setVendedor}
                observaciones={observaciones}
                onCambiarObservaciones={setObservaciones}
                onVerCotizacion={verCotizacion}
              />
            )}

            {items && noEncontrados.length > 0 && (
              <section className="tarjeta aviso">
                <h2>No encontrados en el catálogo ({noEncontrados.length})</h2>
                <ul>
                  {noEncontrados.map((n, i) => (
                    <li key={i}>
                      <strong>{n.textoDetectado}</strong> — cantidad {n.cantidad}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
