export interface SkuNestedDtoEspinillera {
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

export interface VarianteNestedDtoEspinillera {
    idVariante?: string;
    idElemCombinacion: number;
    clCombinacion?: string;
    nbCombinacion?: string;
    urlImagen?: string;
    clEstatusVariante: string;
    skus: SkuNestedDtoEspinillera[];
}

export interface CrearProductoEspinilleraRequest {
    clProducto: string;
    nbProducto: string;
    idElemCategoria: number;
    idElemLineaColeccion: number;
    clHsCode: string;
    clEstatusProducto: string;
    dsMaterial: string;
    dsProteccion: string;
    variantes: VarianteNestedDtoEspinillera[];
}

export interface ActualizarProductoEspinilleraRequest extends CrearProductoEspinilleraRequest {
    idProducto?: string;
}

export interface ProductoEspinillera {
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
    dsMaterial: string;
    dsProteccion: string;
    variantes: VarianteNestedDtoEspinillera[];
}
