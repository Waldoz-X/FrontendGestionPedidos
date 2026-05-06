export interface Cliente {
    id: string;
    nombreComercial: string;
    tipo: string;
    moneda: string;
    canalVenta: string;
    limiteCredito: number;
    activo: boolean;
    creadoEn: string;
    actualizadoEn: string;
}

export interface DireccionCliente {
    id: string;
    idCliente: string;
    alias: string;
    linea1: string;
    linea2: string;
    ciudad: string;
    estado: string;
    codigoPostal: string;
    pais: string;
    esPrincipal: boolean;
    creadoEn: string;
    actualizadoEn: string;
}

export interface GetClientesQuery {
    activo?: boolean;
    search?: string;
    idEmpleado?: string;
}

export interface CrearClienteRequest {
    nombreComercial: string;
    tipo: string;
    moneda: string;
    canalVenta: string;
    limiteCredito: number;
    activo: boolean;
}

export type ActualizarClienteRequest = CrearClienteRequest;

export interface CrearDireccionClienteRequest {
    alias: string;
    linea1: string;
    linea2: string;
    ciudad: string;
    estado: string;
    codigoPostal: string;
    pais: string;
    esPrincipal: boolean;
}

export type ActualizarDireccionClienteRequest = CrearDireccionClienteRequest;

export interface AsignacionClienteEmpleado {
    idEmpleado: string;
    numeroEmpleado: string;
    nombreEmpleado: string;
    idCliente: string;
    nombreComercialCliente: string;
    tipoRelacion: string;
    activo: boolean;
    creadoEn: string;
    actualizadoEn: string;
}

export interface CrearAsignacionClienteEmpleadoRequest {
    idEmpleado: string;
    idCliente: string;
    tipoRelacion: string;
    activo: boolean;
}

export interface ActualizarAsignacionClienteEmpleadoRequest {
    tipoRelacion: string;
    activo: boolean;
}

export interface ClienteUsuario {
    idUsuario: string;
    email: string;
    activo: boolean;
    idCliente: string;
    roles: string[];
}

export interface CrearClienteUsuarioRequest {
    email: string;
    password: string;
}

export interface ActualizarPasswordClienteUsuarioRequest {
    password: string;
}

