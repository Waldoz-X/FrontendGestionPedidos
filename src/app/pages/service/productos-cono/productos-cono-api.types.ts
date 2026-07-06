export interface SkuNestedDtoCono {
    idSku?: string;
    idElemTalla: number;
    clTalla?: string;
    clItem: string;
    clCodigoBarras?: string;
    clEstatusSku: string;
    noStockDisponible?: number;
    noStockReservado?: number;
    StockDisponible?: number;
    StockReservado?: number;
    NoStockDisponible?: number;
    NoStockReservado?: number;
    stockDisponible?: number;
    stockReservado?: number;
}

export interface VarianteNestedDtoCono {
    idVariante?: string;
    idElemCombinacion: number;
    clCombinacion?: string;
    nbCombinacion?: string;
    urlImagen?: string;
    clEstatusVariante: string;
    skus: SkuNestedDtoCono[];
}

export interface CrearProductoConoRequest {
    clProducto: string;
    nbProducto: string;
    idElemCategoria: number;
    idElemLineaColeccion: number;
    clHsCode: string;
    clEstatusProducto: string;
    noAlturaCm: number;
    dsMaterial: string;
    fgEsUnitalla: boolean;
    variantes: VarianteNestedDtoCono[];
}

export interface ActualizarProductoConoRequest extends CrearProductoConoRequest {
    idProducto?: string;
}

export interface ProductoCono {
    idProducto: string;
    clProducto: string;
    nbProducto: string;
    idElemCategoria: number;
    clCategoria: string;
    nbCategoria: string;
    idElemLineaColeccion: number;
    clLineaColeccion: string;
    nbLineaColeccion: string;
    clHsCode: string;
    clEstatusProducto: string;
    noAlturaCm: number;
    dsMaterial: string;
    fgEsUnitalla: boolean;
    variantes: VarianteNestedDtoCono[];
}
