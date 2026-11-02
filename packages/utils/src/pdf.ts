export interface PdfTableOptions {
  title: string;
  filename: string;
  columns: string[];
  rows: (string | number)[][];
}

/** Browser only. jsPDF is lazy-loaded so it stays out of the main bundle. */
export async function exportTablePdf({
  title,
  filename,
  columns,
  rows,
}: PdfTableOptions): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  autoTable(doc, { head: [columns], body: rows, startY: 22, styles: { fontSize: 9 } });
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
