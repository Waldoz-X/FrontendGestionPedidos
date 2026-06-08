import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActualizarAsignacionClienteEmpleadoRequest, AsignacionClienteEmpleado, CrearAsignacionClienteEmpleadoRequest } from './clientes-api.types';

@Injectable({ providedIn: 'root' })
export class AsignacionesApiService {
    private readonly http = inject(HttpClient);
    private readonly asignacionesUrl = '/api/asignaciones';

    getAsignacionesPorEmpleado(idEmpleado: string, activo?: boolean): Observable<AsignacionClienteEmpleado[]> {
        let params = new HttpParams();

        if (activo !== undefined) {
            params = params.set('activo', String(activo));
        }

        return this.http.get<AsignacionClienteEmpleado[]>(`${this.asignacionesUrl}/empleado/${idEmpleado}/clientes`, { params });
    }

    getAsignacionesPorCliente(idCliente: string, activo?: boolean): Observable<AsignacionClienteEmpleado[]> {
        let params = new HttpParams();

        if (activo !== undefined) {
            params = params.set('activo', String(activo));
        }

        return this.http.get<AsignacionClienteEmpleado[]>(`${this.asignacionesUrl}/cliente/${idCliente}/empleados`, { params });
    }

    getTodas(): Observable<AsignacionClienteEmpleado[]> {
        return this.http.get<AsignacionClienteEmpleado[]>(this.asignacionesUrl);
    }

    crearAsignacion(payload: CrearAsignacionClienteEmpleadoRequest): Observable<AsignacionClienteEmpleado> {
        return this.http.post<AsignacionClienteEmpleado>(this.asignacionesUrl, payload);
    }

    actualizarAsignacion(idEmpleado: string, idCliente: string, payload: ActualizarAsignacionClienteEmpleadoRequest): Observable<AsignacionClienteEmpleado> {
        return this.http.put<AsignacionClienteEmpleado>(`${this.asignacionesUrl}/${idEmpleado}/${idCliente}`, payload);
    }

    eliminarAsignacion(idEmpleado: string, idCliente: string): Observable<void> {
        return this.http.delete<void>(`${this.asignacionesUrl}/${idEmpleado}/${idCliente}`);
    }
}
