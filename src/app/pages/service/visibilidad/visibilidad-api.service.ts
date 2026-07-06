import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '@/app/config/app-config.service';
import { VisibilidadProducto, AsignarVisibilidadRequest } from './visibilidad-api.types';

@Injectable({
    providedIn: 'root'
})
export class VisibilidadApiService {
    private readonly http = inject(HttpClient);
    private readonly configService = inject(AppConfigService);

    private get baseUrl() {
        return `${this.configService.getApiBase()}/visibilidad`;
    }

    getMisProductos(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/mis-productos`);
    }

    asignarVisibilidad(payload: AsignarVisibilidadRequest): Observable<VisibilidadProducto> {
        return this.http.post<VisibilidadProducto>(this.baseUrl, payload);
    }

    removerVisibilidad(idCliente: string, idProducto: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${idCliente}/${idProducto}`);
    }

    getClientesProducto(idProducto: string): Observable<VisibilidadProducto[]> {
        return this.http.get<VisibilidadProducto[]>(`${this.baseUrl}/producto/${idProducto}`);
    }
}
