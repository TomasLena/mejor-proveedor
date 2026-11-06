export function obtenerCantidadUnidades(descripcion: string, bultoBD?: number | null): number {
  // Prioridad 1: Columna 'bulto' del Excel si es mayor a 1
    if (bultoBD && bultoBD > 1) {
        return bultoBD;
    }

    if (!descripcion) return 1;

    // Prioridad 2: RegEx de unidades (excluyo: ml, g, gr, cc, cm, mm)
    // Coincide con: "x64", "x 64", "pack x12", "12u", "12 u", "12unid", "c/24", "c/ 24"
    const regexPack = /(?:pack\s?x?|c\/|caja\s?x?|x)\s?(\d+)(?!\s?(?:ml|g|gr|cc|cm|mm|mts|m|kg))\b|\b(\d+)\s?(?:u|unid|unidades)\b/i;

    const match = descripcion.match(regexPack);

    if (match) {
        // El número capturado estará en el grupo 1 o en el grupo 2
        const cantidad = parseInt(match[1] || match[2], 10);
        if (!isNaN(cantidad) && cantidad > 1) {
        return cantidad;
        }
    }

    // Prioridad 3: Unidad individual
    return 1;
    }

    
      //Calcula el precio unitario final redondeado a 2 decimales (Testear Experiencia de usuario).
    export function calcularPrecioUnitario(precioLista: number, cantidadUnidades: number): number {
    if (cantidadUnidades <= 1 || precioLista <= 0) return precioLista;
    return Number((precioLista / cantidadUnidades).toFixed(2));
}