export interface Politica {
    idPolitica: string;
    nbPolitica: string;
    clTipoPolitica: string;
    noPrioridad: number;
    mnFactorDescuento: number;
    feVigenteDesde: string;
    feVigenteHasta: string | null;
    clEstatusPolitica: string;
    conteoClientes: number;
}

export interface CrearPoliticaRequest {
    nbPolitica: string;
    clTipoPolitica: string;
    noPrioridad: number;
    mnFactorDescuento: number;
    feVigenteDesde: string;
    feVigenteHasta: string;
}

export interface PoliticaCliente {
    idCliente: string;
    idPolitica: string;
    nbComercial: string;
    esPrincipal: boolean;
}

export interface AsignarClientePoliticaRequest {
    idCliente: string;
    idPolitica: string;
    esPrincipal: boolean;
}
