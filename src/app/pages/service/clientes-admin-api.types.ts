export interface ClienteAdmin {
    id: string;
    nbComercial: string;
    clTipoCliente: string;
    idElemMoneda: number;
    dsCanalVenta: string;
    mnLimiteCredito: number;
    clEstatusCliente: string;
}

export interface CrearClienteAdminRequest {
    nbComercial: string;
    clTipoCliente: string;
    idElemMoneda: number;
    dsCanalVenta: string;
    mnLimiteCredito: number;
    clEstatusCliente: string;
}

export type ActualizarClienteAdminRequest = CrearClienteAdminRequest;

