export interface SkuNestedDtoMochila {
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

export interface VarianteNestedDtoMochila {
    idVariante?: string;
    idElemCombinacion: number;
    clCombinacion?: string;
    nbCombinacion?: string;
    urlImagen?: string;
    clEstatusVariante: string;
    skus: SkuNestedDtoMochila[];
}

export interface CrearProductoMochilaRequest {
    clProducto: string;
    nbProducto: string;
    idElemCategoria: number;
    idElemLineaColeccion: number;
    clHsCode: string;
    clEstatusProducto: string;
    clSubcategoria: string;
    dsMaterialPrincipal: string;
    noCapacidadLitros: number;
    noCompartimentos: number;
    dsDimensiones: string;
    fgEsUnitalla: boolean;
    variantes: VarianteNestedDtoMochila[];
}

export interface ActualizarProductoMochilaRequest extends CrearProductoMochilaRequest {
    idProducto?: string;
}

export interface ProductoMochila {
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
    noCapacidadLitros: number;
    noCompartimentos: number;
    dsDimensiones: string;
    fgEsUnitalla: boolean;
    variantes: VarianteNestedDtoMochila[];
}
