import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    ActualizarCantidadLineaRequest,
    ActualizarNotasPedidoRequest,
    AgregarLineaRequest,
    CrearPedidoRequest,
    GetPedidosQuery,
    HistorialPedido,
    Pedido
} from './pedidos-api.types';

@Injectable({ providedIn: 'root' })
export class PedidosService {
    private readonly url = '/api/pedidos';
    private readonly http = inject(HttpClient);

    getPedidos(query?: GetPedidosQuery): Observable<Pedido[]> {
        let params = new HttpParams();

        if (query?.estatus) {
            params = params.set('estatus', query.estatus);
        }

        if (query?.idCliente) {
            params = params.set('idCliente', query.idCliente);
        }

        return this.http.get<Pedido[]>(this.url, { params });
    }

    getPedidoById(id: string): Observable<Pedido> {
        return this.http.get<Pedido>(`${this.url}/${id}`);
    }

    crearPedido(payload: CrearPedidoRequest): Observable<Pedido> {
        return this.http.post<Pedido>(this.url, payload);
    }

    actualizarNotas(id: string, payload: ActualizarNotasPedidoRequest): Observable<Pedido> {
        return this.http.put<Pedido>(`${this.url}/${id}/notas`, payload);
    }

    agregarLinea(id: string, payload: AgregarLineaRequest): Observable<Pedido> {
        return this.http.post<Pedido>(`${this.url}/${id}/lineas`, payload);
    }

    actualizarCantidadLinea(id: string, idLinea: string, payload: ActualizarCantidadLineaRequest): Observable<Pedido> {
        return this.http.put<Pedido>(`${this.url}/${id}/lineas/${idLinea}`, payload);
    }

    eliminarLinea(id: string, idLinea: string): Observable<Pedido> {
        return this.http.delete<Pedido>(`${this.url}/${id}/lineas/${idLinea}`);
    }

    getHistorial(id: string): Observable<HistorialPedido[]> {
        return this.http.get<HistorialPedido[]>(`${this.url}/${id}/historial`);
    }
}
