export interface Precio {
    idPrecio: string;
    idSku: string;
    clItem: string;
    idCliente: string | null;
    nbComercialCliente: string | null;
    idPolitica: string | null;
    nbPolitica: string | null;
    mnPrecioNeto: number;
    clMoneda: string;
    clEstatusPrecio: string;
    feVigenteDesde: string;
    feVigenteHasta: string | null;
}

export interface CrearPrecioRequest {
    idSku: string;
    idCliente: string;
    idPolitica: string;
    mnPrecioNeto: number;
    clMoneda: string;
    feVigenteDesde: string;
    feVigenteHasta: string;
}

export interface PrecioBulkItem {
    clItemOCodigoBarras: string;
    nbComercialCliente: string;
    nbPolitica: string;
    mnPrecioNeto: number;
    clMoneda: string;
    feVigenteHasta: string;
}

export interface PrecioResuelto {
    idSku: string;
    mnPrecioFinal: number;
    clMoneda: string;
    origenPrecio: string;
}

export interface HistorialPrecio {
    idHistorial: string;
    idPrecio: string;
    mnPrecioAnterior: number;
    mnPrecioNuevo: number;
    clMoneda: string;
    feModificacion: string;
    nbUsuarioModificador: string;
}
