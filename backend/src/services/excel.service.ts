import * as XLSX from 'xlsx';

export interface ProductoExtraido {
    descripcion: string;
    precio: number;
    bulto?: number | null;
    }

    export interface MapeoReglas {
    filaInicioData: number;
    colDescripcion: string;
    colPrecio: string;
    colBulto?: string | null;
    }

    export class ExcelService {
    static procesarExcel(fileBuffer: Buffer, mapeo: MapeoReglas): ProductoExtraido[] {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

        let bestSheetName = workbook.SheetNames[0];
        let maxRows = 0;

        for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
        if (rawData.length > maxRows) {
            maxRows = rawData.length;
            bestSheetName = sheetName;
        }
        }

        const worksheet = workbook.Sheets[bestSheetName];

        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

        const idxDescripcion = XLSX.utils.decode_col(mapeo.colDescripcion.toUpperCase());
        const idxPrecio = XLSX.utils.decode_col(mapeo.colPrecio.toUpperCase());
        const idxBulto = mapeo.colBulto ? XLSX.utils.decode_col(mapeo.colBulto.toUpperCase()) : -1;

        const productos: ProductoExtraido[] = [];
        const startRow = Math.max(0, mapeo.filaInicioData - 1);

        for (let i = startRow; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        const rawDesc = row[idxDescripcion];
        const rawPrecio = row[idxPrecio];

        if (!rawDesc || rawPrecio === null || rawPrecio === undefined) continue;

        const descripcion = String(rawDesc).trim();

        let precioNum = 0;
        if (typeof rawPrecio === 'number') {
            precioNum = rawPrecio;
        } else if (typeof rawPrecio === 'string') {
            const cleaned = rawPrecio.replace(/[^0-9.,]/g, '').replace(',', '.');
            precioNum = parseFloat(cleaned) || 0;
        }

        let bultoNum: number | null = null;
        if (idxBulto >= 0 && row[idxBulto] !== undefined && row[idxBulto] !== null) {
            bultoNum = parseInt(String(row[idxBulto]), 10) || null;
        }

        if (descripcion && precioNum > 0) {
            productos.push({
            descripcion,
            precio: precioNum,
            bulto: bultoNum,
            });
        }
        }

        return productos;
    }
}