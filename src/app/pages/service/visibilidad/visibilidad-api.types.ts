export interface VisibilidadProducto {
    idCliente: string;
    nbComercialCliente: string;
    idProducto: string;
    nbProducto: string;
    clTipoAcceso: string;
}

export interface AsignarVisibilidadRequest {
    idCliente: string;
    idProducto: string;
    clTipoAcceso: string;
}
