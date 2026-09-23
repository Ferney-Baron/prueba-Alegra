import type { Cliente } from '../cotizacion';

interface Props {
  cliente: Cliente;
  onCambiar: (cliente: Cliente) => void;
}

const CAMPOS: { clave: keyof Cliente; etiqueta: string; placeholder: string; tipo?: string }[] = [
  { clave: 'nombre', etiqueta: 'Cliente', placeholder: 'Nombre o razón social' },
  { clave: 'documento', etiqueta: 'NIT / C.C.', placeholder: '900.123.456-7' },
  { clave: 'direccion', etiqueta: 'Dirección', placeholder: 'Carrera 10 # 20-30' },
  { clave: 'ciudad', etiqueta: 'Ciudad', placeholder: 'Medellín' },
  { clave: 'telefono', etiqueta: 'Teléfono', placeholder: '(604) 555 6789' },
  { clave: 'correo', etiqueta: 'Correo', placeholder: 'compras@cliente.com', tipo: 'email' },
];

export default function DatosCliente({ cliente, onCambiar }: Props) {
  return (
    <fieldset className="datos-cliente">
      <legend>Datos del cliente (opcionales)</legend>
      <div className="rejilla-campos">
        {CAMPOS.map(({ clave, etiqueta, placeholder, tipo }) => (
          <label className="campo" key={clave}>
            {etiqueta}
            <input
              type={tipo ?? 'text'}
              placeholder={placeholder}
              value={cliente[clave]}
              onChange={(e) => onCambiar({ ...cliente, [clave]: e.target.value })}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
