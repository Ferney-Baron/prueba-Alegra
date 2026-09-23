import { EMPRESA } from '../empresa';

/** Barra superior fija con la identidad de la empresa. */
export default function BarraEmpresa() {
  return (
    <header className="barra-empresa">
      <div className="barra-empresa-interior">
        <div className="logo" aria-hidden="true">
          DF
        </div>
        <div>
          <div className="barra-empresa-nombre">{EMPRESA.nombre}</div>
          <div className="barra-empresa-eslogan">{EMPRESA.eslogan}</div>
        </div>
        <div className="barra-empresa-contacto">
          {EMPRESA.nit}
          <br />
          {EMPRESA.telefono}
        </div>
      </div>
    </header>
  );
}
