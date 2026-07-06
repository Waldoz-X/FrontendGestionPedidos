export interface SkuNestedDto {
    idSku?: string;
    idElemTalla: number;
    clItem: string;
    clCodigoBarras: string;
    clEstatusSku: string;
    noStockDisponible: number;
    noStockReservado: number;
}

export interface VarianteNestedDto {
    idVariante?: string;
    idElemCombinacion: number;
    urlImagen: string;
    clEstatusVariante: string;
    skus: SkuNestedDto[];
}

export interface ProductoGuante {
    id: string; 
    clProducto: string;
    nbProducto: string;
    idElemCategoria: number;
    idElemLineaColeccion: number;
    clHsCode: string;
    clEstatusProducto: string;
    nbPalma: string;
    dsComposicion: string;
    clMsCode: string;
    clIndicePalma: string;
    dsForro: string;
    dsCierre: string;
    dsHomologacion: string;
    variantes: VarianteNestedDto[];
}

export interface CrearProductoGuanteRequest {
    clProducto: string;
    nbProducto: string;
    idElemCategoria: number;
    idElemLineaColeccion: number;
    clHsCode: string;
    clEstatusProducto: string;
    nbPalma: string;
    dsComposicion: string;
    clMsCode: string;
    clIndicePalma: string;
    dsForro: string;
    dsCierre: string;
    dsHomologacion: string;
    variantes: VarianteNestedDto[];
}

export type ActualizarProductoGuanteRequest = CrearProductoGuanteRequest;
