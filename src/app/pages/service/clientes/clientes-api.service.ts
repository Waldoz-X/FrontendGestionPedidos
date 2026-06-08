import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActualizarClienteRequest, Cliente, CrearClienteRequest, GetClientesQuery } from './clientes-api.types';

@Injectable({ providedIn: 'root' })
export class ClientesApiService {
    private readonly http = inject(HttpClient);
    private readonly clientesUrl = '/api/clientes';

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

    eliminarCliente(id: string): Observable<void> {
        return this.http.delete<void>(`${this.clientesUrl}/${id}`);
    }
}
