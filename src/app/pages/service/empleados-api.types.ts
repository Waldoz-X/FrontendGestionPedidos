export interface Empleado {
    idEmpleado: string;
    idUsuario: string | null;
    numeroEmpleado: string;
    nombres: string;
    apellidos: string;
    area: string;
    activo: boolean;
    email: string | null;
}

export interface CrearEmpleadoRequest {
    numeroEmpleado: string;
    nombres: string;
    apellidos: string;
    area: string;
    activo: boolean;
}

export interface EmpleadoUsuario {
    idUsuario: string;
    email: string;
    activo: boolean;
    idCliente: string | null;
    roles: string[];
}

export interface CrearEmpleadoUsuarioRequest {
    email: string;
    password: string;
    role: string;
}

export interface ActualizarEmpleadoRequest {
    nombres: string;
    apellidos: string;
    area: string;
    activo: boolean;
}

export interface ActualizarPasswordEmpleadoRequest {
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    expiresInSeconds: number;
    tokenType: string;
    email: string;
    roles: string[];
}

export interface EmpleadoPerfil {
    numeroEmpleado: string;
    nombres: string;
    apellidos: string;
    area: string;
    activo: boolean;
}

export interface AuthMeResponse {
    idUsuario: string;
    idEmpleado: string | null;
    email: string;
    activo: boolean;
    idCliente: string | null;
    empleado: EmpleadoPerfil | null;
    roles: string[];
}

