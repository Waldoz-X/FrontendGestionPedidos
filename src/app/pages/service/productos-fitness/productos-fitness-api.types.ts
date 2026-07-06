export interface SkuNestedDtoFitness {
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

export interface VarianteNestedDtoFitness {
    idVariante?: string;
    idElemCombinacion: number;
    clCombinacion?: string;
    nbCombinacion?: string;
    urlImagen?: string;
    clEstatusVariante: string;
    skus: SkuNestedDtoFitness[];
}

export interface CrearProductoFitnessRequest {
    clProducto: string;
    nbProducto: string;
    idElemCategoria: number;
    idElemLineaColeccion: number;
    clHsCode: string;
    clEstatusProducto: string;
    dsComposicion: string;
    dsRelleno: string;
    dsCierre: string;
    dsProteccion: string;
    noPesoOz: number;
    variantes: VarianteNestedDtoFitness[];
}

export interface ActualizarProductoFitnessRequest extends CrearProductoFitnessRequest {
    idProducto?: string;
}

export interface ProductoFitness {
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
    dsComposicion: string;
    dsRelleno: string;
    dsCierre: string;
    dsProteccion: string;
    noPesoOz: number;
    variantes: VarianteNestedDtoFitness[];
}
