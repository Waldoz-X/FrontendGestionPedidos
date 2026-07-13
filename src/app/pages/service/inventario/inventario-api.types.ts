export interface MovimientoInventarioRequest {
    idSku: string;
    noCantidad: number;
    dsMotivo: string;
}

export interface AjusteInventarioRequest {
    idSku: string;
    noStockFisicoReal: number;
    dsMotivo: string;
}

export interface MovimientoInventarioDto {
    idMovimiento: string;
    idSku: string;
    noCantidad: number;
    clTipoMovimiento: 'ENTRADA' | 'BAJA' | 'AJUSTE' | 'VENTA';
    dsMotivo: string;
    clOperadorCrea: string;
    nbArtefactoCrea: string;
    feCreacion: string;
}

export interface LibroAuditoriaDto {
    idMovimiento: string;
    feCreacion: string;
    clTipoMovimiento: 'ENTRADA' | 'BAJA' | 'AJUSTE' | 'VENTA';
    noCantidad: number;
    clOperadorCrea: string;
    dsMotivo: string;
    idSku: string;
    clItem: string;
    nbProducto: string;
    nbCombinacion: string;
    nbTalla: string;
}

export interface StockRealDto {
    idSku: string;
    clItem: string;
    nbProducto: string;
    nbCombinacion: string;
    nbTalla: string;
    noStockDisponible: number;
    noStockReservado: number;
    noStockNeto: number;
    noStockMinimo: number;
    mnPrecioBase: number;
    clSemaforoStock: 'SIN_STOCK' | 'STOCK_BAJO' | 'STOCK_OK';
}

export interface RotacionDto {
    idSku: string;
    clItem: string;
    nbProducto: string;
    nbCombinacion: string;
    nbTalla: string;
    noCantidadVendida: number;
}
