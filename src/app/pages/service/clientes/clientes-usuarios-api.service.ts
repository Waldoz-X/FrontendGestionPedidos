import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActualizarPasswordClienteUsuarioRequest, ClienteUsuario, CrearClienteUsuarioRequest } from './clientes-api.types';

@Injectable({ providedIn: 'root' })
export class ClientesUsuariosApiService {
    private readonly http = inject(HttpClient);
    private readonly clientesUrl = '/api/clientes';

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
