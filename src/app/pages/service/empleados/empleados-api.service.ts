import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActualizarEmpleadoRequest, CrearEmpleadoRequest, Empleado } from './empleados-api.types';

@Injectable({ providedIn: 'root' })
export class EmpleadosApiService {
    private readonly http = inject(HttpClient);
    private readonly empleadosUrl = '/api/empleados';

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

    eliminarEmpleado(idEmpleado: string): Observable<void> {
        return this.http.delete<void>(`${this.empleadosUrl}/${idEmpleado}`);
    }
}
