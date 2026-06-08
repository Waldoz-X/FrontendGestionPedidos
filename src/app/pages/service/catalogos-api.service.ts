import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../config/app-config.service';

export interface Catalogo {
    idCatalogo?: number;
    clCatalogo: string;
    nbCatalogo: string;
    dsCatalogo: string;
    idCatalogoPadre?: number | null;
    clEstatusCatalogo?: string;
}

export interface CrearCatalogoRequest {
    clCatalogo: string;
    nbCatalogo: string;
    dsCatalogo: string;
    idCatalogoPadre?: number | null;
}

export interface ActualizarCatalogoRequest {
    nbCatalogo: string;
    dsCatalogo: string;
    idCatalogoPadre?: number | null;
    clEstatusCatalogo?: string;
}

export interface CatalogoElemento {
    idCatalogoElemento?: number;
    clCatalogoElemento: string;
    nbCatalogoElemento: string;
    dsCatalogoElemento: string;
    idCatalogoElementoPadre?: number | null;
    nbCatalogo?: string;
    nbCatalogoElementoPadre?: string;
    clEstatusCatalogoElemento?: string;
}

export interface CrearCatalogoElementoRequest {
    clCatalogoElemento: string;
    nbCatalogoElemento: string;
    dsCatalogoElemento: string;
    idCatalogoElementoPadre?: number | null;
}

export interface ActualizarCatalogoElementoRequest {
    nbCatalogoElemento: string;
    dsCatalogoElemento: string;
    idCatalogoElementoPadre?: number | null;
    clEstatusCatalogoElemento?: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogosApiService {
    private readonly http = inject(HttpClient);
    private readonly appConfig = inject(AppConfigService);

    private get baseUrl(): string {
        return this.appConfig.getCatalogosBase();
    }

    getCatalogos(): Observable<Catalogo[]> {
        return this.http.get<Catalogo[]>(`${this.baseUrl}`);
    }

    crearCatalogo(payload: CrearCatalogoRequest): Observable<Catalogo> {
        return this.http.post<Catalogo>(`${this.baseUrl}`, payload);
    }

    actualizarCatalogo(id: number, payload: ActualizarCatalogoRequest): Observable<Catalogo> {
        return this.http.put<Catalogo>(`${this.baseUrl}/${id}`, payload);
    }

    eliminarCatalogo(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    getElementos(clCatalogo: string): Observable<CatalogoElemento[]> {
        return this.http.get<CatalogoElemento[]>(`${this.baseUrl}/${encodeURIComponent(clCatalogo)}`);
    }

    crearElemento(clCatalogo: string, payload: CrearCatalogoElementoRequest) {
        return this.http.post<CatalogoElemento>(`${this.baseUrl}/${encodeURIComponent(clCatalogo)}`, payload);
    }

    getElementoById(id: number) {
        return this.http.get<CatalogoElemento>(`${this.baseUrl}/elementos/${id}`);
    }

    actualizarElemento(id: number, payload: ActualizarCatalogoElementoRequest) {
        return this.http.put<CatalogoElemento>(`${this.baseUrl}/elementos/${id}`, payload);
    }

    eliminarElemento(id: number) {
        return this.http.delete<void>(`${this.baseUrl}/elementos/${id}`);
    }
}

