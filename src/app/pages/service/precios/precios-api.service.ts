import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '@/app/config/app-config.service';
import { Precio, CrearPrecioRequest, PrecioBulkItem, PrecioResuelto, HistorialPrecio } from './precios-api.types';

@Injectable({
    providedIn: 'root'
})
export class PreciosApiService {
    private readonly http = inject(HttpClient);
    private readonly configService = inject(AppConfigService);

    private get baseUrl() {
        return `${this.configService.getApiBase()}/precios`;
    }

    getPrecios(): Observable<Precio[]> {
        return this.http.get<Precio[]>(this.baseUrl);
    }

    crearPrecio(payload: CrearPrecioRequest): Observable<Precio> {
        return this.http.post<Precio>(this.baseUrl, payload);
    }

    resolverPrecio(idSku: string): Observable<PrecioResuelto> {
        return this.http.get<PrecioResuelto>(`${this.baseUrl}/resolver/${idSku}`);
    }

    resolverPreciosBulk(ids: string[]): Observable<PrecioResuelto[]> {
        return this.http.post<PrecioResuelto[]>(`${this.baseUrl}/resolver/bulk`, ids);
    }

    crearPreciosBulk(payload: PrecioBulkItem[]): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/bulk`, payload);
    }

    getHistorial(idPrecio: string): Observable<HistorialPrecio[]> {
        return this.http.get<HistorialPrecio[]>(`${this.baseUrl}/${idPrecio}/historial`);
    }
}
