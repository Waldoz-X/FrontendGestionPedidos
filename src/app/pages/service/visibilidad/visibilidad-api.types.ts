export interface VisibilidadDto {
    idVisibilidad: string;
    idCliente: string;
    nbComercialCliente: string;
    idProducto?: string;
    nbProducto?: string;
    idVariante?: string;
    nbCombinacion?: string;
    idSku?: string;
    clItem?: string;
    clTipoAcceso: string; // "VISIBLE" | "EXCLUSIVO" | "OCULTO"
    clEstatusVisibilidad: string;
}

export interface VisibilidadUpsertDto {
    idCliente: string;
    idProducto?: string;
    idVariante?: string;
    idSku?: string;
    clTipoAcceso: string; // "VISIBLE" | "EXCLUSIVO" | "OCULTO"
}

export interface VisibilidadProducto {
    idCliente: string;
    nbComercialCliente: string;
    idProducto: string;
    nbProducto: string;
    clTipoAcceso: string;
}

export interface ProductoVisibleDto {
    idProducto: string;
    clProducto: string;
    nbProducto: string;
    clCategoria: string;
    clLineaColeccion: string;
    clTipoAcceso: string;
}

export interface AsignarVisibilidadRequest {
    idCliente: string;
    idProducto: string;
    clTipoAcceso: string;
}

export interface AsignarVisibilidadBulkRequest {
    idCliente: string;
    idsProductos: string[];
    clTipoAcceso: string;
}
