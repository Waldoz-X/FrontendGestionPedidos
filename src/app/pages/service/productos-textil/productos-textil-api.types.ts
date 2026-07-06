export interface SkuNestedDtoTextil {
    idSku?: string;
    idElemTalla: number;
    clItem: string;
    clCodigoBarras: string;
    clEstatusSku: string;
    noStockDisponible: number;
    noStockReservado: number;
}

export interface VarianteNestedDtoTextil {
    idVariante?: string;
    idElemCombinacion: number;
    urlImagen: string;
    clEstatusVariante: string;
    skus: SkuNestedDtoTextil[];
}

export interface ProductoTextil {
    id: string; 
    clProducto: string;
    nbProducto: string;
    idElemCategoria: number;
    idElemLineaColeccion: number;
    clHsCode: string;
    clEstatusProducto: string;
    nbTejido: string;
    dsComposicion: string;
    dsCorte: string;
    noGramajeGsm: number;
    idElemGenero: number;
    variantes: VarianteNestedDtoTextil[];
}

export interface CrearProductoTextilRequest {
    clProducto: string;
    nbProducto: string;
    idElemCategoria: number;
    idElemLineaColeccion: number;
    clHsCode: string;
    clEstatusProducto: string;
    nbTejido: string;
    dsComposicion: string;
    dsCorte: string;
    noGramajeGsm: number;
    idElemGenero: number;
    variantes: VarianteNestedDtoTextil[];
}

export type ActualizarProductoTextilRequest = CrearProductoTextilRequest;
