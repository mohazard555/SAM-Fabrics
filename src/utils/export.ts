

export const exportToExcel = (filename: string, rows: object[]) => {
    if (!rows || rows.length === 0) {
        return;
    }

    const headers = Object.keys(rows[0]);
    
    const escapeXml = (unsafe: any): string => {
        // Coerce to string, handling null/undefined
        const str = String(unsafe ?? '');
        return str.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    };

    const headerRow = `<Row>${headers.map(header => `<Cell ss:StyleID="s62"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`).join('')}</Row>`;

    const dataRows = rows.map(row => {
        const cells = headers.map(header => {
            const value = (row as any)[header];
            const type = typeof value === 'number' ? 'Number' : 'String';
            return `<Cell><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
        }).join('');
        return `<Row>${cells}</Row>`;
    }).join('');

    const template = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Bottom"/>
      <Borders/>
      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="s62">
      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000" ss:Bold="1"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Sheet1" ss:RightToLeft="1">
    <Table>
      ${headerRow}
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};