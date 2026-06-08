import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AppConfigService } from '../../config/app-config.service';
import { ActualizarClienteAdminRequest, ClienteAdmin, CrearClienteAdminRequest } from './clientes-admin-api.types';

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: string[];
}

@Injectable({ providedIn: 'root' })
export class ClientesAdminService {
    private readonly http = inject(HttpClient);
    private readonly appConfig = inject(AppConfigService);

    private get clientesUrl(): string {
        return `${this.appConfig.getApiBase()}/clientes`;
    }

    getClientes(): Observable<ClienteAdmin[]> {
        return this.http.get<ApiResponse<ClienteAdmin[]> | ClienteAdmin[]>(this.clientesUrl).pipe(map((response) => this.unwrap(response)));
    }

    getClienteById(id: string): Observable<ClienteAdmin> {
        return this.http.get<ApiResponse<ClienteAdmin> | ClienteAdmin>(`${this.clientesUrl}/${id}`).pipe(map((response) => this.unwrap(response)));
    }

    crearCliente(payload: CrearClienteAdminRequest): Observable<ClienteAdmin> {
        return this.http.post<ApiResponse<ClienteAdmin> | ClienteAdmin>(this.clientesUrl, payload).pipe(map((response) => this.unwrap(response)));
    }

    actualizarCliente(id: string, payload: ActualizarClienteAdminRequest): Observable<ClienteAdmin> {
        return this.http.put<ApiResponse<ClienteAdmin> | ClienteAdmin>(`${this.clientesUrl}/${id}`, payload).pipe(map((response) => this.unwrap(response)));
    }

    eliminarCliente(id: string): Observable<void> {
        return this.http.delete<ApiResponse<void> | void>(`${this.clientesUrl}/${id}`).pipe(map(() => void 0));
    }

    private unwrap<T>(response: ApiResponse<T> | T): T {
        if (response && typeof response === 'object' && 'data' in response) {
            const apiResponse = response as ApiResponse<T>;

            if (!apiResponse.success) {
                throw new Error(apiResponse.message || apiResponse.errors?.join(', ') || 'La operación no pudo completarse.');
            }

            return apiResponse.data as T;
        }

        return response as T;
    }
}


