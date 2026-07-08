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
