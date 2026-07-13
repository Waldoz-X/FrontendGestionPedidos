import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '@/app/config/app-config.service';
import { VisibilidadDto, VisibilidadUpsertDto } from './visibilidad-api.types';
import { 
    VisibilidadProducto, 
    ProductoVisibleDto, 
    AsignarVisibilidadBulkRequest
} from './visibilidad-api.types';

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

    asignarVisibilidad(payload: VisibilidadUpsertDto): Observable<VisibilidadDto> {
        return this.http.post<VisibilidadDto>(this.baseUrl, payload);
    }

    asignarVisibilidadBulk(payload: AsignarVisibilidadBulkRequest): Observable<VisibilidadProducto[]> {
        return this.http.post<VisibilidadProducto[]>(`${this.baseUrl}/bulk`, payload);
    }

    removerVisibilidad(idCliente: string, idProducto: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${idCliente}/${idProducto}`);
    }

    removerVisibilidadPorId(idVisibilidad: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${idVisibilidad}`);
    }

    getClientesProducto(idProducto: string): Observable<VisibilidadDto[]> {
        return this.http.get<VisibilidadDto[]>(`${this.baseUrl}/producto/${idProducto}`);
    }

    getProductosCliente(idCliente: string): Observable<ProductoVisibleDto[]> {
        return this.http.get<ProductoVisibleDto[]>(`${this.baseUrl}/cliente/${idCliente}`);
    }
}
