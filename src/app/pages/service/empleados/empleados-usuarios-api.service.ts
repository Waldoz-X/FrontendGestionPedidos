import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActualizarPasswordEmpleadoRequest, CrearEmpleadoUsuarioRequest, EmpleadoUsuario } from './empleados-api.types';

@Injectable({ providedIn: 'root' })
export class EmpleadosUsuariosApiService {
    private readonly http = inject(HttpClient);
    private readonly empleadosUrl = '/api/empleados';

    crearUsuarioEmpleado(idEmpleado: string, payload: CrearEmpleadoUsuarioRequest): Observable<EmpleadoUsuario> {
        return this.http.post<EmpleadoUsuario>(`${this.empleadosUrl}/${idEmpleado}/usuario`, payload);
    }

    actualizarPasswordEmpleado(idEmpleado: string, payload: ActualizarPasswordEmpleadoRequest): Observable<EmpleadoUsuario> {
        return this.http.put<EmpleadoUsuario>(`${this.empleadosUrl}/${idEmpleado}/usuario/password`, payload);
    }
}
