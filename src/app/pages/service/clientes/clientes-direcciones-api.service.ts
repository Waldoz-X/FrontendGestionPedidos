import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActualizarDireccionClienteRequest, CrearDireccionClienteRequest, DireccionCliente } from './clientes-api.types';

@Injectable({ providedIn: 'root' })
export class ClientesDireccionesApiService {
    private readonly http = inject(HttpClient);
    private readonly clientesUrl = '/api/clientes';

    getDirecciones(idCliente: string): Observable<DireccionCliente[]> {
        return this.http.get<DireccionCliente[]>(`${this.clientesUrl}/${idCliente}/direcciones`);
    }

    crearDireccion(idCliente: string, payload: CrearDireccionClienteRequest): Observable<DireccionCliente> {
        return this.http.post<DireccionCliente>(`${this.clientesUrl}/${idCliente}/direcciones`, payload);
    }

    actualizarDireccion(idCliente: string, idDireccion: string, payload: ActualizarDireccionClienteRequest): Observable<DireccionCliente> {
        return this.http.put<DireccionCliente>(`${this.clientesUrl}/${idCliente}/direcciones/${idDireccion}`, payload);
    }
}
