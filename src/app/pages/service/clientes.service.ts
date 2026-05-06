import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    AsignacionClienteEmpleado,
    ActualizarClienteRequest,
    ActualizarPasswordClienteUsuarioRequest,
    ActualizarAsignacionClienteEmpleadoRequest,
    ActualizarDireccionClienteRequest,
    Cliente,
    ClienteUsuario,
    CrearAsignacionClienteEmpleadoRequest,
    CrearClienteRequest,
    CrearClienteUsuarioRequest,
    CrearDireccionClienteRequest,
    DireccionCliente,
    GetClientesQuery
} from './clientes-api.types';

@Injectable({ providedIn: 'root' })
export class ClientesService {
    private readonly http = inject(HttpClient);
    private readonly clientesUrl = '/api/clientes';
    private readonly asignacionesUrl = '/api/asignaciones-cliente-empleado';

    getClientes(query?: GetClientesQuery): Observable<Cliente[]> {
        let params = new HttpParams();

        if (query?.activo !== undefined) {
            params = params.set('activo', String(query.activo));
        }

        if (query?.search) {
            params = params.set('search', query.search);
        }

        if (query?.idEmpleado) {
            params = params.set('idEmpleado', query.idEmpleado);
        }

        return this.http.get<Cliente[]>(this.clientesUrl, { params });
    }

    getClienteById(id: string): Observable<Cliente> {
        return this.http.get<Cliente>(`${this.clientesUrl}/${id}`);
    }

    crearCliente(payload: CrearClienteRequest): Observable<Cliente> {
        return this.http.post<Cliente>(this.clientesUrl, payload);
    }

    actualizarCliente(id: string, payload: ActualizarClienteRequest): Observable<Cliente> {
        return this.http.put<Cliente>(`${this.clientesUrl}/${id}`, payload);
    }

    getDirecciones(idCliente: string): Observable<DireccionCliente[]> {
        return this.http.get<DireccionCliente[]>(`${this.clientesUrl}/${idCliente}/direcciones`);
    }

    crearDireccion(idCliente: string, payload: CrearDireccionClienteRequest): Observable<DireccionCliente> {
        return this.http.post<DireccionCliente>(`${this.clientesUrl}/${idCliente}/direcciones`, payload);
    }

    actualizarDireccion(idCliente: string, idDireccion: string, payload: ActualizarDireccionClienteRequest): Observable<DireccionCliente> {
        return this.http.put<DireccionCliente>(`${this.clientesUrl}/${idCliente}/direcciones/${idDireccion}`, payload);
    }

    getAsignacionesPorEmpleado(idEmpleado: string, activo?: boolean): Observable<AsignacionClienteEmpleado[]> {
        let params = new HttpParams();

        if (activo !== undefined) {
            params = params.set('activo', String(activo));
        }

        return this.http.get<AsignacionClienteEmpleado[]>(`${this.asignacionesUrl}/empleados/${idEmpleado}/clientes`, { params });
    }

    getAsignacionesPorCliente(idCliente: string, activo?: boolean): Observable<AsignacionClienteEmpleado[]> {
        let params = new HttpParams();

        if (activo !== undefined) {
            params = params.set('activo', String(activo));
        }

        return this.http.get<AsignacionClienteEmpleado[]>(`${this.asignacionesUrl}/clientes/${idCliente}/empleados`, { params });
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

    getUsuariosCliente(idCliente: string): Observable<ClienteUsuario[]> {
        return this.http.get<ClienteUsuario[]>(`${this.clientesUrl}/${idCliente}/usuarios`);
    }

    crearUsuarioCliente(idCliente: string, payload: CrearClienteUsuarioRequest): Observable<ClienteUsuario> {
        return this.http.post<ClienteUsuario>(`${this.clientesUrl}/${idCliente}/usuarios`, payload);
    }

    actualizarPasswordUsuarioCliente(idCliente: string, idUsuario: string, payload: ActualizarPasswordClienteUsuarioRequest): Observable<ClienteUsuario> {
        return this.http.put<ClienteUsuario>(`${this.clientesUrl}/${idCliente}/usuarios/${idUsuario}/password`, payload);
    }
}

