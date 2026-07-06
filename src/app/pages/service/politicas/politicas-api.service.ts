import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '@/app/config/app-config.service';
import { Politica, CrearPoliticaRequest, PoliticaCliente, AsignarClientePoliticaRequest } from './politicas-api.types';

@Injectable({
    providedIn: 'root'
})
export class PoliticasApiService {
    private readonly http = inject(HttpClient);
    private readonly configService = inject(AppConfigService);

    private get baseUrl() {
        return `${this.configService.getApiBase()}/politicas`;
    }

    getPoliticas(): Observable<Politica[]> {
        return this.http.get<Politica[]>(this.baseUrl);
    }

    crearPolitica(payload: CrearPoliticaRequest): Observable<Politica> {
        return this.http.post<Politica>(this.baseUrl, payload);
    }

    getClientesPolitica(idPolitica: string): Observable<PoliticaCliente[]> {
        return this.http.get<PoliticaCliente[]>(`${this.baseUrl}/${idPolitica}/clientes`);
    }

    asignarClientePolitica(idPolitica: string, payload: AsignarClientePoliticaRequest): Observable<PoliticaCliente> {
        return this.http.post<PoliticaCliente>(`${this.baseUrl}/${idPolitica}/clientes`, payload);
    }

    removerClientePolitica(idPolitica: string, idCliente: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${idPolitica}/clientes/${idCliente}`);
    }
}
