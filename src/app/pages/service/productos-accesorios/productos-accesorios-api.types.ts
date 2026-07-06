export interface SkuNestedDtoAccesorio {
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

export interface VarianteNestedDtoAccesorio {
    idVariante?: string;
    idElemCombinacion: number;
    clCombinacion?: string;
    nbCombinacion?: string;
    urlImagen?: string;
    clEstatusVariante: string;
    skus: SkuNestedDtoAccesorio[];
}

export interface CrearProductoAccesorioRequest {
    clProducto: string;
    nbProducto: string;
    idElemCategoria: number;
    idElemLineaColeccion: number;
    clHsCode: string;
    clEstatusProducto: string;
    clSubcategoria: string;
    dsMaterialPrincipal: string;
    variantes: VarianteNestedDtoAccesorio[];
}

export interface ActualizarProductoAccesorioRequest extends CrearProductoAccesorioRequest {
    idProducto?: string;
}

export interface ProductoAccesorio {
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
    clSubcategoria: string;
    dsMaterialPrincipal: string;
    variantes: VarianteNestedDtoAccesorio[];
}
