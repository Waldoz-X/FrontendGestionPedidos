export interface Pais {
    id: number;
    nombre: string;
    codigoISO: string;
    activo: boolean;
}

export interface CrearPaisRequest {
    nombre: string;
    codigoISO: string;
    activo: boolean;
}

export type ActualizarPaisRequest = CrearPaisRequest;

export interface Area {
    id: number;
    nombre: string;
    activo: boolean;
}

export interface CrearAreaRequest {
    nombre: string;
    activo: boolean;
}

export type ActualizarAreaRequest = CrearAreaRequest;

export interface Estado {
    id: number;
    idPais: number;
    nombre: string;
    activo: boolean;
}

export interface CrearEstadoRequest {
    idPais: number;
    nombre: string;
    activo: boolean;
}

export type ActualizarEstadoRequest = CrearEstadoRequest;
