import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    ActualizarAreaRequest,
    ActualizarEstadoRequest,
    ActualizarPaisRequest,
    Area,
    CrearAreaRequest,
    CrearEstadoRequest,
    CrearPaisRequest,
    Estado,
    Pais
} from './catalogos-maestros-api.types';

@Injectable({ providedIn: 'root' })
export class CatalogosMaestrosService {
    private readonly baseUrl = '/api/catalogos';
    private readonly http = inject(HttpClient);

    // ─── COUNTRIES ───

    getPaises(activo?: boolean): Observable<Pais[]> {
        let params = new HttpParams();

        if (activo !== undefined) {
            params = params.set('activo', String(activo));
        }

        return this.http.get<Pais[]>(`${this.baseUrl}/paises`, { params });
    }

    crearPais(payload: CrearPaisRequest): Observable<Pais> {
        return this.http.post<Pais>(`${this.baseUrl}/paises`, payload);
    }

    actualizarPais(id: number, payload: ActualizarPaisRequest): Observable<Pais> {
        return this.http.put<Pais>(`${this.baseUrl}/paises/${id}`, payload);
    }

    eliminarPais(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/paises/${id}`);
    }

    // ─── AREAS ───

    getAreas(activo?: boolean): Observable<Area[]> {
        let params = new HttpParams();

        if (activo !== undefined) {
            params = params.set('activo', String(activo));
        }

        return this.http.get<Area[]>(`${this.baseUrl}/areas`, { params });
    }

    crearArea(payload: CrearAreaRequest): Observable<Area> {
        return this.http.post<Area>(`${this.baseUrl}/areas`, payload);
    }

    actualizarArea(id: number, payload: ActualizarAreaRequest): Observable<Area> {
        return this.http.put<Area>(`${this.baseUrl}/areas/${id}`, payload);
    }

    eliminarArea(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/areas/${id}`);
    }

    // ─── ESTADOS ───

    getEstados(idPais?: number, activo?: boolean): Observable<Estado[]> {
        let params = new HttpParams();

        if (idPais !== undefined) {
            params = params.set('idPais', String(idPais));
        }

        if (activo !== undefined) {
            params = params.set('activo', String(activo));
        }

        return this.http.get<Estado[]>(`${this.baseUrl}/estados`, { params });
    }

    crearEstado(payload: CrearEstadoRequest): Observable<Estado> {
        return this.http.post<Estado>(`${this.baseUrl}/estados`, payload);
    }

    actualizarEstado(id: number, payload: ActualizarEstadoRequest): Observable<Estado> {
        return this.http.put<Estado>(`${this.baseUrl}/estados/${id}`, payload);
    }

    eliminarEstado(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/estados/${id}`);
    }
}
