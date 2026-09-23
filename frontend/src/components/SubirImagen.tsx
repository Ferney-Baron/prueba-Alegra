import { useEffect, useRef, useState } from 'react';
import type { RespuestaExtraccion } from '../tipos';

interface Props {
  onResultado: (res: RespuestaExtraccion) => void;
}

export default function SubirImagen({ onResultado }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!archivo) return;
    const url = URL.createObjectURL(archivo);
    setVistaPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  function elegir(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.');
      return;
    }
    setError(null);
    setArchivo(f);
  }

  async function extraer() {
    if (!archivo) return;
    setCargando(true);
    setError(null);
    try {
      const datos = new FormData();
      datos.append('imagen', archivo);
      const r = await fetch('/api/cotizacion/extraer', { method: 'POST', body: datos });
      const cuerpo = await r.json().catch(() => null);
      if (!r.ok) throw new Error(cuerpo?.message ?? `Error ${r.status}`);
      onResultado(cuerpo as RespuestaExtraccion);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="tarjeta">
      <div
        className={`zona ${arrastrando ? 'arrastrando' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          elegir(e.dataTransfer.files[0]);
        }}
      >
        {vistaPrevia ? (
          <img src={vistaPrevia} alt="Vista previa" />
        ) : (
          <p>
            Arrastra una imagen aquí o haz clic para seleccionarla
            <br />
            <small>PNG, JPG, WEBP o GIF · máx. 5 MB</small>
          </p>
        )}
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          hidden
          onChange={(e) => elegir(e.target.files?.[0])}
        />
      </div>
      <div className="acciones">
        {archivo && <span className="nombre-archivo">{archivo.name}</span>}
        <button onClick={extraer} disabled={!archivo || cargando}>
          {cargando ? (
            <>
              <span className="spinner" /> Analizando…
            </>
          ) : (
            'Extraer productos'
          )}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
