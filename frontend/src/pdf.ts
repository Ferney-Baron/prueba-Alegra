import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { calcularTotales, camposCliente, formatearFecha, moneda, type Cotizacion } from './cotizacion';
import { COLOR_EMPRESA_RGB, EMPRESA } from './empresa';

const ALTO_ENCABEZADO = 34;
const MARGEN = 15;

export function construirPdf(cot: Cotizacion): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const ancho = doc.internal.pageSize.getWidth();
  const { subtotal, montoIva, total } = calcularTotales(cot.items, cot.iva);

  // Franja roja con los datos de la empresa y el título de la cotización.
  doc.setFillColor(...COLOR_EMPRESA_RGB);
  doc.rect(0, 0, ancho, ALTO_ENCABEZADO, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(EMPRESA.nombre, MARGEN, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(EMPRESA.eslogan, MARGEN, 18.5);
  doc.text(`${EMPRESA.nit}  ·  ${EMPRESA.direccion}`, MARGEN, 24);
  doc.text(`${EMPRESA.telefono}  ·  ${EMPRESA.correo}  ·  ${EMPRESA.web}`, MARGEN, 29);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('COTIZACIÓN', ancho - MARGEN, 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Folio: ${cot.folio}`, ancho - MARGEN, 21, { align: 'right' });
  doc.text(`Fecha: ${formatearFecha(cot.fecha)}`, ancho - MARGEN, 26, { align: 'right' });
  const pie = cot.vendedor ? `${cot.formaPago}  ·  Vendedor: ${cot.vendedor}` : cot.formaPago;
  doc.text(pie, ancho - MARGEN, 31, { align: 'right' });

  // Recuadro con los datos del cliente, en dos columnas.
  const yCaja = ALTO_ENCABEZADO + 10;
  const altoCaja = 30;
  doc.setFillColor(247, 247, 247);
  doc.setDrawColor(222);
  doc.rect(MARGEN, yCaja, ancho - MARGEN * 2, altoCaja, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_EMPRESA_RGB);
  doc.text('DATOS DEL CLIENTE', MARGEN + 4, yCaja + 6);

  const campos = camposCliente(cot.cliente);
  const anchoColumna = (ancho - MARGEN * 2) / 2;
  campos.forEach((campo, i) => {
    const x = MARGEN + 4 + Math.floor(i / 3) * anchoColumna;
    const y = yCaja + 13 + (i % 3) * 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(90);
    doc.text(`${campo.etiqueta}:`, x, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30);
    doc.text(campo.valor, x + 22, y, { maxWidth: anchoColumna - 28 });
  });

  autoTable(doc, {
    startY: yCaja + altoCaja + 8,
    margin: { left: MARGEN, right: MARGEN },
    head: [['#', 'Producto', 'Cantidad', 'Precio unit.', 'Subtotal']],
    body: cot.items.map((i, n) => [
      String(n + 1),
      [i.nombre, i.presentacion, i.laboratorio, i.nota ? `Nota: ${i.nota}` : ''].filter(Boolean).join('\n'),
      String(i.cantidad),
      moneda.format(i.precioUnitario),
      moneda.format(i.precioUnitario * i.cantidad),
    ]),
    headStyles: { fillColor: COLOR_EMPRESA_RGB },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { halign: 'right', cellWidth: 22 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 32 },
    },
    didParseCell: ({ section, column, cell }) => {
      if (section === 'head' && column.index >= 2) cell.styles.halign = 'right';
    },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const xEtiqueta = ancho - MARGEN - 70;
  const xValor = ancho - MARGEN;
  let y = finalY + 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text('Subtotal', xEtiqueta, y);
  doc.text(moneda.format(subtotal), xValor, y, { align: 'right' });
  y += 6;
  doc.text(`IVA (${cot.iva}%)`, xEtiqueta, y);
  doc.text(moneda.format(montoIva), xValor, y, { align: 'right' });
  y += 3;
  doc.setDrawColor(...COLOR_EMPRESA_RGB);
  doc.line(xEtiqueta, y, xValor, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLOR_EMPRESA_RGB);
  doc.text('Total', xEtiqueta, y);
  doc.text(moneda.format(total), xValor, y, { align: 'right' });

  if (cot.observaciones) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_EMPRESA_RGB);
    doc.text('OBSERVACIONES', MARGEN, finalY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text(cot.observaciones, MARGEN, finalY + 18, { maxWidth: ancho - MARGEN * 2 - 80 });
  }

  const alto = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text('Cotización válida por 15 días. Precios sujetos a disponibilidad de inventario.', MARGEN, alto - 12);
  doc.text(EMPRESA.nombre, ancho - MARGEN, alto - 12, { align: 'right' });

  return doc;
}

export function descargarPdf(cot: Cotizacion) {
  construirPdf(cot).save(`${cot.folio}.pdf`);
}
