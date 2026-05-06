import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    ActualizarEmpleadoRequest,
    ActualizarPasswordEmpleadoRequest,
    AuthMeResponse,
    CrearEmpleadoRequest,
    CrearEmpleadoUsuarioRequest,
    Empleado,
    EmpleadoUsuario,
    LoginRequest,
    LoginResponse
} from './empleados-api.types';

@Injectable({ providedIn: 'root' })
export class EmpleadosService {
    private readonly http = inject(HttpClient);
    private readonly empleadosUrl = '/api/empleados';
    private readonly authUrl = '/api/auth';

    getEmpleados(): Observable<Empleado[]> {
        return this.http.get<Empleado[]>(this.empleadosUrl);
    }

    getEmpleadoById(idEmpleado: string): Observable<Empleado> {
        return this.http.get<Empleado>(`${this.empleadosUrl}/${idEmpleado}`);
    }

    crearEmpleado(payload: CrearEmpleadoRequest): Observable<Empleado> {
        return this.http.post<Empleado>(this.empleadosUrl, payload);
    }

    actualizarEmpleado(idEmpleado: string, payload: ActualizarEmpleadoRequest): Observable<Empleado> {
        return this.http.put<Empleado>(`${this.empleadosUrl}/${idEmpleado}`, payload);
    }

    crearUsuarioEmpleado(idEmpleado: string, payload: CrearEmpleadoUsuarioRequest): Observable<EmpleadoUsuario> {
        return this.http.post<EmpleadoUsuario>(`${this.empleadosUrl}/${idEmpleado}/usuario`, payload);
    }

    actualizarPasswordEmpleado(idEmpleado: string, payload: ActualizarPasswordEmpleadoRequest): Observable<EmpleadoUsuario> {
        return this.http.put<EmpleadoUsuario>(`${this.empleadosUrl}/${idEmpleado}/usuario/password`, payload);
    }

    login(payload: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.authUrl}/login`, payload);
    }

    getMe(): Observable<AuthMeResponse> {
        return this.http.get<AuthMeResponse>(`${this.authUrl}/me`);
    }
}

