import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TimelineModule } from 'primeng/timeline';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';

import { PedidosService } from '../service/pedidos.service';
import {
    Pedido,
    HistorialPedido,
    DashboardResumenDto,
    EstatusPedido,
    CambiarEstatusPedidoRequest
} from '../service/pedidos-api.types';
import { ClientesAdminService } from '../service/clientes-admin.service';
import { ClienteAdmin } from '../service/clientes-admin-api.types';
import { EmpleadosApiService } from '../service/empleados/empleados-api.service';
import { Empleado } from '../service/empleados/empleados-api.types';

@Component({
    selector: 'p-admin-pedidos',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        SelectModule,
        TagModule,
        ToastModule,
        ToolbarModule,
        TooltipModule,
        TimelineModule,
        TextareaModule,
        ConfirmDialogModule,
        CardModule
    ],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast />
        <p-confirmDialog [style]="{ width: '450px' }" />

        <div class="grid grid-cols-12 gap-6">
            <!-- ═══ HEADER & GENERAL TOOLBAR ═══ -->
            <div class="col-span-12">
                <p-toolbar styleClass="mb-1">
                    <ng-template #start>
                        <div class="font-semibold text-2xl flex items-center gap-2">
                            <i class="pi pi-shield text-primary-500 text-3xl"></i>
                            Administración Global de Pedidos
                        </div>
                    </ng-template>
                    <ng-template #end>
                        <p-button
                            severity="secondary"
                            label="Actualizar Bandeja"
                            icon="pi pi-refresh"
                            (onClick)="cargarDatos()"
                            [loading]="loading()"
                        />
                    </ng-template>
                </p-toolbar>
            </div>

            <!-- ═══ DASHBOARD EXECUTIVE CARDS ═══ -->
            <div class="col-span-12 md:col-span-6 lg:col-span-4">
                <div class="card p-4 flex items-center justify-between border border-surface-200 rounded-lg shadow-sm bg-surface-0 dark:bg-surface-900">
                    <div>
                        <span class="block text-surface-500 font-medium mb-3">Total Facturado</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">
                            $ {{ dashboardResumen()?.montoTotalFacturado | number: '1.2-2' }}
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-green-100 dark:bg-green-950/30 rounded-lg w-12 h-12">
                        <i class="pi pi-money-bill text-green-500 text-2xl"></i>
                    </div>
                </div>
            </div>

            <div class="col-span-12 md:col-span-6 lg:col-span-4">
                <div class="card p-4 flex items-center justify-between border border-surface-200 rounded-lg shadow-sm bg-surface-0 dark:bg-surface-900">
                    <div>
                        <span class="block text-surface-500 font-medium mb-3">Pendiente por Facturar</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">
                            $ {{ dashboardResumen()?.montoPendienteFacturar | number: '1.2-2' }}
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-950/30 rounded-lg w-12 h-12">
                        <i class="pi pi-clock text-orange-500 text-2xl"></i>
                    </div>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-4">
                <div class="card p-4 border border-surface-200 rounded-lg shadow-sm bg-surface-0 dark:bg-surface-900">
                    <span class="block text-surface-500 font-medium mb-3">Distribución por Estatus</span>
                    <div class="flex flex-wrap gap-2">
                        @for (status of estatusPills; track status.value) {
                            <button
                                type="button"
                                (click)="seleccionarFiltroEstatus(status.value)"
                                [class]="'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ' + 
                                    (filtroEstatus === status.value 
                                        ? 'bg-primary border-primary text-primary-contrast shadow-sm' 
                                        : 'bg-surface-50 hover:bg-surface-100 border-surface-200 text-surface-700')"
                            >
                                <span>{{ status.label }}</span>
                                <span [class]="'px-1.5 py-0.5 rounded-full text-[10px] ' + 
                                    (filtroEstatus === status.value ? 'bg-primary-emphasis text-primary' : 'bg-surface-200 text-surface-800')">
                                    {{ getCountByStatus(status.value) }}
                                </span>
                            </button>
                        }
                    </div>
                </div>
            </div>

            <!-- ═══ FILTROS DE AUDITORÍA Y LISTADO ═══ -->
            <div class="col-span-12">
                <div class="card p-5 border border-surface-200 rounded-lg shadow-sm bg-surface-0 dark:bg-surface-900">
                    <!-- Fila de Filtros -->
                    <div class="grid grid-cols-12 gap-4 items-end mb-6">
                        <div class="col-span-12 md:col-span-4">
                            <label class="block font-semibold mb-2 text-sm text-surface-700 dark:text-surface-300">
                                <i class="pi pi-user mr-1 text-primary-500"></i> Filtrar por Cliente
                            </label>
                            <p-select
                                [(ngModel)]="filtroCliente"
                                [options]="clientesOptions()"
                                optionLabel="label"
                                optionValue="value"
                                [filter]="true"
                                filterBy="label"
                                placeholder="Todos los clientes"
                                [showClear]="true"
                                fluid
                                (onChange)="cargarPedidos()"
                            />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label class="block font-semibold mb-2 text-sm text-surface-700 dark:text-surface-300">
                                <i class="pi pi-users mr-1 text-primary-500"></i> Filtrar por Vendedor (Auditar)
                            </label>
                            <p-select
                                [(ngModel)]="filtroVendedor"
                                [options]="vendedoresOptions()"
                                optionLabel="label"
                                optionValue="value"
                                [filter]="true"
                                filterBy="label"
                                placeholder="Todos los vendedores"
                                [showClear]="true"
                                fluid
                                (onChange)="cargarPedidos()"
                            />
                        </div>
                        <div class="col-span-12 md:col-span-4 flex gap-2">
                            <div class="w-full">
                                <label class="block font-semibold mb-2 text-sm text-surface-700 dark:text-surface-300">
                                    Estatus
                                </label>
                                <p-select
                                    [(ngModel)]="filtroEstatus"
                                    [options]="estatusOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Todos los estatus"
                                    [showClear]="true"
                                    fluid
                                    (onChange)="cargarPedidos()"
                                />
                            </div>
                            <p-button
                                severity="secondary"
                                icon="pi pi-filter-slash"
                                (onClick)="limpiarFiltros()"
                                pTooltip="Limpiar filtros"
                                [style]="{ 'margin-bottom': '1px', 'height': '40px' }"
                            />
                        </div>
                    </div>

                    <!-- Tabla de Pedidos -->
                    <p-table
                        [value]="pedidos()"
                        [loading]="loading()"
                        [paginator]="true"
                        [rows]="10"
                        [rowsPerPageOptions]="[10, 20, 50]"
                        styleClass="p-datatable-striped"
                        responsiveLayout="scroll"
                    >
                        <ng-template #header>
                            <tr>
                                <th class="w-40">Folio</th>
                                <th>Cliente</th>
                                <th>Capturado Por</th>
                                <th class="w-36 text-center">Fecha</th>
                                <th class="w-28 text-right">Total</th>
                                <th class="w-32 text-center">Estatus</th>
                                <th class="w-36 text-center">Acciones</th>
                            </tr>
                        </ng-template>

                        <ng-template #body let-pedido>
                            <tr>
                                <td class="whitespace-nowrap">
                                    <strong class="text-primary-500 font-mono">{{ pedido.folio }}</strong>
                                </td>
                                <td class="max-w-[220px]">
                                    <div class="font-semibold text-surface-900 dark:text-surface-0 truncate" [title]="pedido.nombreCliente">
                                        {{ pedido.nombreCliente }}
                                    </div>
                                    @if (pedido.resumenProductos) {
                                        <div class="text-surface-500 text-xs truncate mt-0.5" [title]="pedido.resumenProductos">
                                            <i class="pi pi-box text-[10px] mr-1 text-primary-400"></i>{{ pedido.resumenProductos }}
                                        </div>
                                    }
                                </td>
                                <td>
                                    {{ getNombreCapturador(pedido.idUsuarioCaptura) }}
                                </td>
                                <td class="text-center font-mono text-xs">
                                    {{ pedido.fecha | date: 'dd/MM/yyyy HH:mm' }}
                                </td>
                                <td class="text-right font-bold font-mono text-xs whitespace-nowrap">
                                    {{ pedido.total | currency: 'USD': 'symbol': '1.2-2' }}
                                    <span class="text-[9px] text-surface-400 font-sans block mt-0.5 leading-none">
                                        {{ pedido.moneda }}
                                    </span>
                                </td>
                                <td class="text-center">
                                    <p-tag
                                        [value]="pedido.estatus"
                                        [severity]="getSeverity(pedido.estatus)"
                                    />
                                </td>
                                <td class="text-center">
                                    <div class="flex justify-center gap-1.5">
                                        <p-button
                                            icon="pi pi-search"
                                            severity="info"
                                            [rounded]="true"
                                            [text]="true"
                                            pTooltip="Ver partidas y totales"
                                            (onClick)="abrirDetalle(pedido)"
                                        />
                                        <p-button
                                            icon="pi pi-history"
                                            severity="secondary"
                                            [rounded]="true"
                                            [text]="true"
                                            pTooltip="Historial de auditoría"
                                            (onClick)="abrirAuditoria(pedido)"
                                        />
                                        @if (puedeOperar(pedido.estatus)) {
                                            <p-button
                                                icon="pi pi-cog"
                                                severity="success"
                                                [rounded]="true"
                                                [text]="true"
                                                pTooltip="Operar flujo de trabajo"
                                                (onClick)="abrirDetalle(pedido)"
                                            />
                                        }
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template #emptymessage>
                            <tr>
                                <td colspan="7" class="text-center py-8 text-surface-500">
                                    <i class="pi pi-inbox text-4xl mb-3 block"></i>
                                    No se encontraron pedidos con los filtros aplicados.
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </div>

        <p-dialog
            [(visible)]="detalleVisible"
            [header]="'Detalle de Pedido: ' + (selectedPedido()?.folio || '')"
            [modal]="true"
            [style]="{ width: '85vw', 'max-width': '1000px' }"
            [contentStyle]="{ 'max-height': '75vh', 'overflow-y': 'auto' }"
            [dismissableMask]="true"
        >
            @if (selectedPedido(); as pedido) {
                <div class="grid grid-cols-12 gap-6 mt-2">
                    
                    <!-- Ficha Informativa (Full Width Top Banner) -->
                    <div class="col-span-12">
                        <div class="p-5 border border-surface-200 rounded-lg bg-surface-50 dark:bg-surface-800/40 grid grid-cols-12 gap-6 shadow-sm">
                            <div class="col-span-12 md:col-span-4">
                                <span class="block text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">CLIENTE</span>
                                <span class="font-bold text-base text-surface-900 dark:text-surface-50">{{ pedido.nombreCliente }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-2">
                                <span class="block text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">FECHA DE CAPTURA</span>
                                <span class="font-mono text-sm font-semibold">{{ pedido.fecha | date: 'dd/MM/yyyy HH:mm' }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-3">
                                <span class="block text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">VENDEDOR / CAPTURADOR</span>
                                <span class="text-sm font-semibold text-surface-700 dark:text-surface-200">{{ getNombreCapturador(pedido.idUsuarioCaptura) }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-3">
                                <span class="block text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">ESTATUS ACTUAL</span>
                                <p-tag [value]="pedido.estatus" [severity]="getSeverity(pedido.estatus)" class="mt-0.5 inline-block" />
                            </div>
                            @if (pedido.notas) {
                                <div class="col-span-12 border-t border-surface-200 pt-3 mt-1">
                                    <span class="block text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">NOTAS DEL PEDIDO</span>
                                    <p class="text-xs italic text-surface-600 dark:text-surface-300 mt-1 whitespace-pre-line bg-surface-0 dark:bg-surface-900 p-3 rounded border border-surface-200">
                                        {{ pedido.notas }}
                                    </p>
                                </div>
                            }
                        </div>
                    </div>

                    <!-- Columnas de Contenido -->
                    <div class="col-span-12 flex flex-col gap-4">
                        <!-- Detalle de Partidas -->
                        <div>
                            <h5 class="font-bold text-lg mb-3 flex items-center gap-2">
                                <i class="pi pi-shopping-bag text-primary"></i> Partidas del Pedido
                            </h5>
                            <p-table [value]="pedido.lineas" styleClass="p-datatable-striped p-datatable-sm" responsiveLayout="scroll">
                                <ng-template #header>
                                    <tr>
                                        <th>Producto</th>
                                        <th class="w-20 text-center">Cant.</th>
                                        <th class="w-28 text-right">Unitario ({{ pedido.moneda }})</th>
                                        <th class="w-24 text-right">Desc. ({{ pedido.moneda }})</th>
                                        <th class="w-28 text-right">Subtotal</th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-linea>
                                    <tr>
                                        <td>
                                            <div class="font-semibold text-surface-950 dark:text-surface-50 text-sm">
                                                {{ linea.nbProducto || 'Producto' }}
                                            </div>
                                            <div class="text-[11px] text-surface-500 font-mono mt-0.5">
                                                {{ linea.clItem || linea.idSku }}
                                                @if (linea.nbTalla) {
                                                    <span class="text-primary font-bold ml-1.5">• {{ linea.nbTalla }}</span>
                                                }
                                                @if (linea.nbCombinacion) {
                                                    <span class="text-surface-400 ml-1.5">• {{ linea.nbCombinacion }}</span>
                                                }
                                            </div>
                                        </td>
                                        <td class="text-center font-mono font-semibold">{{ linea.cantidad }}</td>
                                        <td class="text-right font-mono text-xs">{{ linea.precioUnitario | currency: '': 'symbol': '1.2-2' }}</td>
                                        <td class="text-right text-red-500 font-mono font-medium text-xs">- {{ linea.descuentoLinea | currency: '': 'symbol': '1.2-2' }}</td>
                                        <td class="text-right font-mono font-bold text-surface-950 dark:text-surface-50 text-xs">{{ linea.subtotal | currency: '': 'symbol': '1.2-2' }}</td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </div>

                        <!-- Totales -->
                        <div class="flex flex-col items-end gap-1.5 mt-2 p-4 border border-surface-200 bg-surface-50/50 rounded-lg shadow-xs">
                            <div class="text-xs text-surface-600">Subtotal: <span class="font-mono text-xs font-semibold ml-2">{{ pedido.subtotal | currency: '': 'symbol': '1.2-2' }}</span></div>
                            <div class="text-xs text-red-500">Descuento Comercial: <span class="font-mono text-xs font-semibold ml-2">-{{ pedido.descuentoComercial | currency: '': 'symbol': '1.2-2' }}</span></div>
                            <div class="text-xs text-red-500">Descuento Admin: <span class="font-mono text-xs font-semibold ml-2">-{{ pedido.descuentoAdmin | currency: '': 'symbol': '1.2-2' }}</span></div>
                            <div class="text-lg font-bold mt-2 pt-2 border-t border-surface-300 w-64 text-right flex justify-between items-center">
                                Total Pedido:
                                <span class="font-mono text-primary ml-2">
                                    {{ pedido.total | currency: 'USD': 'symbol': '1.2-2' }}
                                    <span class="text-xs text-surface-500 ml-1 font-sans font-normal">
                                        {{ pedido.moneda }}
                                    </span>
                                </span>
                            </div>
                        </div>

                        <!-- OPERACIONES DE FLUJO DE TRABAJO (OPERAR ESTATUS) -->
                        @if (puedeOperar(pedido.estatus)) {
                            <div class="mt-4 p-4 border border-surface-200 rounded-lg bg-primary-50/10 dark:bg-primary-950/10">
                                <h6 class="font-bold text-sm text-primary mb-3">Control de Flujo de Trabajo</h6>
                                
                                <div class="mb-4">
                                    <label class="block text-xs font-semibold mb-1.5 text-surface-500">Notas de transición (Requerido para cambios):</label>
                                    <textarea
                                        rows="2"
                                        pTextarea
                                        [(ngModel)]="notasTransicion"
                                        placeholder="Ej: Ingresar número de guía de paquetería, motivo de facturación o justificación de cancelación."
                                        class="w-full text-xs"
                                    ></textarea>
                                </div>

                                <div class="flex gap-4">
                                    @if (pedido.estatus === 'Confirmado' || pedido.estatus === 'CONFIRMADO') {
                                        <p-button
                                            label="Facturar Pedido"
                                            icon="pi pi-file-excel"
                                            severity="success"
                                            [fluid]="true"
                                            class="flex-1"
                                            (onClick)="cambiarEstadoOperativo('FACTURADO')"
                                            [disabled]="!notasTransicion.trim()"
                                        />
                                    }
                                    @if (pedido.estatus === 'Facturado' || pedido.estatus === 'FACTURADO') {
                                        <p-button
                                            label="Registrar Envío (Descontar Stock)"
                                            icon="pi pi-send"
                                            severity="info"
                                            [fluid]="true"
                                            class="flex-1"
                                            (onClick)="cambiarEstadoOperativo('ENVIADO')"
                                            [disabled]="!notasTransicion.trim()"
                                        />
                                    }
                                    <!-- Cancelación permitida en confirmados y facturados -->
                                    <p-button
                                        label="Cancelar Pedido"
                                        icon="pi pi-times-circle"
                                        severity="danger"
                                        [fluid]="true"
                                        [text]="true"
                                        class="flex-1 border border-red-200 hover:bg-red-50"
                                        (onClick)="cambiarEstadoOperativo('CANCELADO')"
                                        [disabled]="!notasTransicion.trim()"
                                    />
                                </div>
                            </div>
                        }
                    </div>
                </div>
            }
        </p-dialog>

        <!-- Diálogo Exclusivo de Auditoría -->
        <p-dialog
            [(visible)]="auditoriaVisible"
            [header]="'Historial de Auditoría: ' + (selectedPedido()?.folio || '')"
            [modal]="true"
            [style]="{ width: '450px' }"
            [dismissableMask]="true"
        >
            @if (loadingHistorial()) {
                <div class="flex justify-center p-8"><i class="pi pi-spin pi-spinner text-3xl text-primary"></i></div>
            } @else if (historial().length === 0) {
                <div class="text-center py-6 text-surface-400 text-sm">
                    No hay registros de cambios de estado para este pedido.
                </div>
            } @else {
                <div class="mt-4">
                    <p-timeline [value]="historial()">
                        <ng-template #content let-event>
                            <div class="p-3 border border-surface-100 rounded bg-surface-50 dark:bg-surface-900 mb-4 shadow-sm">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs text-surface-500 font-mono">
                                        {{ event.registradoEn | date: 'dd/MM/yyyy HH:mm' }}
                                    </span>
                                </div>
                                <div class="flex flex-wrap gap-2 items-center text-sm mb-2">
                                    <p-tag [value]="event.estatusAnterior || 'CREACIÓN'" [severity]="getSeverity(event.estatusAnterior)" />
                                    <i class="pi pi-arrow-right text-surface-400 text-xs"></i>
                                    <p-tag [value]="event.estatusNuevo" [severity]="getSeverity(event.estatusNuevo)" />
                                </div>
                                <div class="text-xs text-surface-600 dark:text-surface-300 mt-2 bg-surface-0 p-2 rounded border border-surface-200">
                                    "{{ event.notas || event.notes || 'Sin notas' }}"
                                </div>
                            </div>
                        </ng-template>
                    </p-timeline>
                </div>
            }
        </p-dialog>
    `
})
export class AdminPedidos implements OnInit {
    private readonly apiService = inject(PedidosService);
    private readonly clientesService = inject(ClientesAdminService);
    private readonly empleadosService = inject(EmpleadosApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly destroyRef = inject(DestroyRef);

    loading = signal<boolean>(false);
    dashboardResumen = signal<DashboardResumenDto | null>(null);
    pedidos = signal<Pedido[]>([]);
    historial = signal<HistorialPedido[]>([]);

    clientes = signal<ClienteAdmin[]>([]);
    vendedores = signal<Empleado[]>([]);

    // Mapeo rápido de IDs de capturadores
    vendedoresMap: Record<string, string> = {};

    clientesOptions = computed(() => [
        { label: 'Todos los clientes', value: '' },
        ...this.clientes().map(c => ({
            label: c.nbComercial,
            value: c.id || (c as any).idCliente
        }))
    ]);

    vendedoresOptions = computed(() => [
        { label: 'Todos los vendedores', value: '' },
        ...this.vendedores().map(e => ({
            label: `${e.nbEmpleado} ${e.nbApellidos || ''}`.trim(),
            value: e.idEmpleado
        }))
    ]);

    // Opciones del dropdown de estatus
    estatusOptions = [
        { label: 'Todos los estatus', value: '' },
        { label: 'Borrador', value: 'BORRADOR' },
        { label: 'Confirmado', value: 'CONFIRMADO' },
        { label: 'Facturado', value: 'FACTURADO' },
        { label: 'Enviado', value: 'ENVIADO' },
        { label: 'Cancelado', value: 'CANCELADO' }
    ];

    // Opciones de Pills
    estatusPills = [
        { label: 'Borrador', value: 'BORRADOR' },
        { label: 'Confirmado', value: 'CONFIRMADO' },
        { label: 'Facturado', value: 'FACTURADO' },
        { label: 'Enviado', value: 'ENVIADO' },
        { label: 'Cancelado', value: 'CANCELADO' }
    ];

    // Filtros de búsqueda vinculados
    filtroCliente = '';
    filtroVendedor = '';
    filtroEstatus = '';

    // Modal Detalle
    detalleVisible = false;
    auditoriaVisible = false;
    loadingHistorial = signal<boolean>(false);
    selectedPedido = signal<Pedido | null>(null);
    notasTransicion = '';

    ngOnInit(): void {
        this.cargarDatos();
        this.cargarCatalogos();
    }

    cargarDatos(): void {
        this.cargarDashboard();
        this.cargarPedidos();
    }

    cargarDashboard(): void {
        this.apiService
            .getDashboardResumen()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => this.dashboardResumen.set(res),
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo cargar el resumen del dashboard.'
                    });
                }
            });
    }

    cargarPedidos(): void {
        this.loading.set(true);
        const query = {
            idCliente: this.filtroCliente || undefined,
            idEmpleado: this.filtroVendedor || undefined,
            estatus: this.filtroEstatus || undefined
        };

        this.apiService
            .getPedidos(query)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.pedidos.set(res || []);
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudieron cargar los pedidos.'
                    });
                }
            });
    }

    cargarCatalogos(): void {
        // Cargar clientes
        this.clientesService
            .getClientes()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => this.clientes.set(res || [])
            });

        // Cargar vendedores
        this.empleadosService
            .getEmpleados()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.vendedores.set(res || []);
                    // Armar mapa rápido de idEmpleado -> Nombre Completo
                    const map: Record<string, string> = {};

                    (res || []).forEach(e => {
                        map[e.idEmpleado] = `${e.nbEmpleado} ${e.nbApellidos || ''}`.trim();
                    });
                    this.vendedoresMap = map;
                }
            });
    }

    getNombreCapturador(idUsuarioCaptura: string): string {
        return this.vendedoresMap[idUsuarioCaptura] || idUsuarioCaptura || 'Capturador';
    }

    getCountByStatus(estatus: string): number {
        const counts = this.dashboardResumen()?.conteosPorEstatus;

        if (!counts) return 0;
        
        // El conteo en el backend puede venir en mayúsculas o minúsculas según la db
        const matchingKey = Object.keys(counts).find(
            key => key.toUpperCase() === estatus.toUpperCase()
        );

        return matchingKey ? (counts as any)[matchingKey] : 0;
    }

    seleccionarFiltroEstatus(estatus: string): void {
        // Alternar filtro de estatus al dar clic en la tarjeta de resumen
        if (this.filtroEstatus === estatus) {
            this.filtroEstatus = '';
        } else {
            this.filtroEstatus = estatus;
        }

        this.cargarPedidos();
    }

    limpiarFiltros(): void {
        this.filtroCliente = '';
        this.filtroVendedor = '';
        this.filtroEstatus = '';
        this.cargarPedidos();
    }

    abrirDetalle(pedido: Pedido): void {
        this.loading.set(true);
        this.apiService.getPedidoById(pedido.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (detalle) => {
                    this.selectedPedido.set(detalle);
                    this.notasTransicion = '';
                    this.detalleVisible = true;
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo cargar el detalle del pedido.'
                    });
                }
            });
    }

    abrirAuditoria(pedido: Pedido): void {
        this.selectedPedido.set(pedido);
        this.auditoriaVisible = true;
        this.loadingHistorial.set(true);
        this.apiService.getPedidoById(pedido.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (detalle) => {
                    this.selectedPedido.set(detalle);
                    this.historial.set(detalle.historial || []);
                    this.loadingHistorial.set(false);
                },
                error: () => {
                    this.loadingHistorial.set(false);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo cargar el historial de auditoría.'
                    });
                }
            });
    }

    puedeOperar(estatus: string): boolean {
        const st = (estatus || '').toUpperCase();

        return st === 'CONFIRMADO' || st === 'FACTURADO';
    }

    cambiarEstadoOperativo(nuevoEstatus: EstatusPedido): void {
        const pedido = this.selectedPedido();

        if (!pedido) return;

        this.confirmationService.confirm({
            message: `¿Está seguro de que desea cambiar el estatus del pedido ${pedido.folio} a <b>${nuevoEstatus}</b>?`,
            header: 'Confirmar cambio de estatus',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, cambiar',
            rejectLabel: 'Cancelar',
            accept: () => {
                const payload: CambiarEstatusPedidoRequest = {
                    estatus: nuevoEstatus,
                    notas: this.notasTransicion
                };

                this.apiService.cambiarEstatus(pedido.id, payload)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Estatus Actualizado',
                                detail: `El pedido ahora está en estatus ${nuevoEstatus}.`
                            });
                            this.detalleVisible = false;
                            this.cargarDatos(); // Recargar tabla y KPI dashboards
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: err.error?.message || 'No se pudo cambiar el estatus del pedido.'
                            });
                        }
                    });
            }
        });
    }

    getSeverity(estatus: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        const st = (estatus || '').toUpperCase();

        switch (st) {
            case 'BORRADOR':
                return 'secondary';
            case 'CONFIRMADO':
                return 'contrast';
            case 'FACTURADO':
                return 'success';
            case 'ENVIADO':
                return 'info';
            case 'CANCELADO':
                return 'danger';
            default:
                return undefined;
        }
    }
}
