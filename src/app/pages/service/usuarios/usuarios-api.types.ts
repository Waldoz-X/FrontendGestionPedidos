export interface RegistrarUsuarioEmpleadoRequest {
    email: string;
    password?: string;
    confirmPassword?: string;
    nuEmpleado?: string | null;
    clEmpleado: string;
    nbEmpleado: string;
    nbApellidos: string;
    idElemArea: number;
}

export interface RegistrarUsuarioClienteRequest {
    email: string;
    password?: string;
    confirmPassword?: string;
    idCliente: string;
}

export interface AsignarAccesoEmpleadoRequest {
    email: string;
    password?: string;
    idEmpleado: string;
}

export interface AsignarAccesoClienteRequest {
    email: string;
    password?: string;
    idCliente: string;
}

export interface ActualizarEstadoUsuarioRequest {
    nuevoEstado: string; // Ejemplo: 'ACTIVO' | 'INACTIVO'
}

export interface ResetearPasswordUsuarioRequest {
    nuevaPassword?: string;
}

export interface UsuarioEmpleado {
    idEmpleado: string;
    clEmpleado: string;
    nbEmpleado: string;
    nbApellidos: string;
    nbNombreCompleto: string;
    nbDepartamento: string;
    clEstatusEmpleado: string;
}

export interface UsuarioCliente {
    idCliente: string;
    nbComercial: string;
    clTipoCliente: string;
    mnLimiteCredito: number;
    nbMoneda: string;
    clEstatusCliente: string;
}

export interface Usuario {
    idUsuario: string;
    email: string;
    tipoUsuario: 'EMPLEADO' | 'CLIENTE';
    clEstatusUsuario: string;
    roles: string[];
    feCreacion: string;
    empleado: UsuarioEmpleado | null;
    cliente: UsuarioCliente | null;
}
