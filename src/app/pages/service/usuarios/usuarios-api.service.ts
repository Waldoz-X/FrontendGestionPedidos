import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    ActualizarEstadoUsuarioRequest,
    AsignarAccesoClienteRequest,
    AsignarAccesoEmpleadoRequest,
    RegistrarUsuarioClienteRequest,
    RegistrarUsuarioEmpleadoRequest,
    ResetearPasswordUsuarioRequest,
    Usuario
} from './usuarios-api.types';

@Injectable({ providedIn: 'root' })
export class UsuariosApiService {
    private readonly http = inject(HttpClient);
    private readonly usuariosUrl = '/api/usuarios';

    getUsuarios(): Observable<Usuario[]> {
        return this.http.get<Usuario[]>(this.usuariosUrl);
    }

    registrarUsuarioEmpleado(payload: RegistrarUsuarioEmpleadoRequest): Observable<any> {
        return this.http.post(`${this.usuariosUrl}/empleados/registrar`, payload);
    }

    registrarUsuarioCliente(payload: RegistrarUsuarioClienteRequest): Observable<any> {
        return this.http.post(`${this.usuariosUrl}/clientes/registrar`, payload);
    }

    asignarAccesoEmpleado(idEmpleado: string, payload: AsignarAccesoEmpleadoRequest): Observable<any> {
        return this.http.post(`${this.usuariosUrl}/empleados/${idEmpleado}/acceso`, payload);
    }

    asignarAccesoCliente(idCliente: string, payload: AsignarAccesoClienteRequest): Observable<any> {
        return this.http.post(`${this.usuariosUrl}/clientes/${idCliente}/acceso`, payload);
    }

    getUsuarioById(idUsuario: string): Observable<any> {
        return this.http.get(`${this.usuariosUrl}/${idUsuario}`);
    }

    eliminarUsuario(idUsuario: string): Observable<void> {
        return this.http.delete<void>(`${this.usuariosUrl}/${idUsuario}`);
    }

    actualizarEstado(idUsuario: string, nuevoEstado: string): Observable<void> {
        const payload: ActualizarEstadoUsuarioRequest = { nuevoEstado };
        return this.http.put<void>(`${this.usuariosUrl}/${idUsuario}/estado`, payload);
    }

    resetearPassword(idUsuario: string, nuevaPassword: string): Observable<void> {
        const payload: ResetearPasswordUsuarioRequest = { nuevaPassword };
        return this.http.put<void>(`${this.usuariosUrl}/${idUsuario}/resetear-password`, payload);
    }
}
