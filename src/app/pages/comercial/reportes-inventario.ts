import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

import { InventarioApiService } from '../service/inventario/inventario-api.service';
import { LibroAuditoriaDto, StockRealDto, RotacionDto } from '../service/inventario/inventario-api.types';

@Component({
    selector: 'p-reportes-inventario',
    standalone: true,
    imports: [
        FormsModule,
        ButtonModule,
        DatePickerModule,
        SelectModule,
        TableModule,
        TagModule,
        TabsModule,
        ToastModule,
        ToolbarModule,
        TooltipModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />
        
        <div class="card">
            <div class="font-semibold text-xl mb-4">Reportes de Inventario y Auditoría</div>
            <p class="text-sm text-surface-500 mb-6">
                Consulte las tendencias de ventas, el stock físico real y audite todos los movimientos del sistema.
            </p>

            <p-tabs value="0">
                <p-tablist>
                    <p-tab value="0"><i class="pi pi-box mr-2"></i> Estado Actual (Stock Real)</p-tab>
                    <p-tab value="1"><i class="pi pi-chart-line mr-2"></i> Rotación (KPI Ventas)</p-tab>
                    <p-tab value="2"><i class="pi pi-history mr-2"></i> Libro de Auditoría (Kardex)</p-tab>
                </p-tablist>

                <p-tabpanels>
                    <!-- TABS 0: STOCK REAL -->
                    <p-tabpanel value="0">
                        <p-toolbar styleClass="mb-4">
                            <ng-template #start>
                                <p-iconfield>
                                    <p-inputicon class="pi pi-search" />
                                    <input pInputText type="text" (input)="dtStock.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar por SKU o Producto..." />
                                </p-iconfield>
                            </ng-template>
                            <ng-template #end>
                                <p-button severity="secondary" label="Exportar CSV" icon="pi pi-file-excel" (onClick)="dtStock.exportCSV()" pTooltip="Exportar a Excel" />
                                <p-button severity="info" label="Actualizar" icon="pi pi-refresh" (onClick)="cargarStockReal()" class="ml-2" [loading]="loadingStock()" />
                            </ng-template>
                        </p-toolbar>

                        <p-table #dtStock [value]="stockRealList()" [loading]="loadingStock()" [paginator]="true" [rows]="10"
                            [globalFilterFields]="['clItem', 'nbProducto', 'nbCombinacion', 'nbTalla']"
                            [rowsPerPageOptions]="[10, 20, 50]"
                            [showCurrentPageReport]="true" currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                            [rowHover]="true" responsiveLayout="scroll" exportFilename="Reporte_Stock_Real">
                            <ng-template #header>
                                <tr>
                                    <th pSortableColumn="clItem" style="min-width: 10rem">SKU <p-sortIcon field="clItem"/></th>
                                    <th pSortableColumn="nbProducto" style="min-width: 12rem">Producto <p-sortIcon field="nbProducto"/></th>
                                    <th pSortableColumn="nbCombinacion" style="min-width: 10rem">Variante <p-sortIcon field="nbCombinacion"/></th>
                                    <th pSortableColumn="noStockDisponible" style="min-width: 8rem">Físico <p-sortIcon field="noStockDisponible"/></th>
                                    <th pSortableColumn="noStockReservado" style="min-width: 8rem">Reservado <p-sortIcon field="noStockReservado"/></th>
                                    <th pSortableColumn="noStockNeto" style="min-width: 8rem">Neto <p-sortIcon field="noStockNeto"/></th>
                                    <th pSortableColumn="clSemaforoStock" style="min-width: 10rem">Estatus <p-sortIcon field="clSemaforoStock"/></th>
                                </tr>
                            </ng-template>
                            <ng-template #body let-s>
                                <tr>
                                    <td class="font-mono text-xs">{{ s.clItem }}</td>
                                    <td class="font-bold">{{ s.nbProducto }}</td>
                                    <td>{{ s.nbCombinacion }} - {{ s.nbTalla }}</td>
                                    <td>{{ s.noStockDisponible }}</td>
                                    <td class="text-surface-500">{{ s.noStockReservado }}</td>
                                    <td class="font-bold">{{ s.noStockNeto }}</td>
                                    <td>
                                        <p-tag [value]="formatSemaforo(s.clSemaforoStock)" [severity]="getSemaforoSeverity(s.clSemaforoStock)" />
                                    </td>
                                </tr>
                            </ng-template>
                            <ng-template #emptymessage>
                                <tr>
                                    <td colspan="7" class="text-center py-4">No se encontraron registros de stock real.</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>

                    <!-- TABS 1: ROTACION (KPI) -->
                    <p-tabpanel value="1">
                        <div class="grid grid-cols-12 gap-4 mb-4 items-end">
                            <div class="col-span-12 md:col-span-4">
                                <label class="block font-bold mb-2">Rango de Fechas (Filtrado en Servidor)</label>
                                <p-datePicker [(ngModel)]="fechasRotacion" selectionMode="range" [readonlyInput]="true" dateFormat="dd/mm/yy" class="w-full" fluid appendTo="body"></p-datePicker>
                            </div>
                            <div class="col-span-12 md:col-span-8 flex justify-between gap-2">
                                <div>
                                    <p-button label="Filtrar" icon="pi pi-filter" severity="primary" (onClick)="cargarRotacion()" [loading]="loadingRotacion()" />
                                </div>
                                <div>
                                    <p-button severity="secondary" label="Exportar CSV" icon="pi pi-file-excel" (onClick)="dtRotacion.exportCSV()" pTooltip="Exportar a Excel" />
                                </div>
                            </div>
                        </div>

                        <p-table #dtRotacion [value]="rotacionList()" [loading]="loadingRotacion()" [paginator]="true" [rows]="10"
                            [globalFilterFields]="['clItem', 'nbProducto', 'nbCombinacion']"
                            [rowsPerPageOptions]="[10, 20, 50]"
                            [showCurrentPageReport]="true" currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                            [rowHover]="true" responsiveLayout="scroll" exportFilename="Reporte_Rotacion">
                            <ng-template #header>
                                <tr>
                                    <th style="min-width: 10rem">SKU</th>
                                    <th style="min-width: 12rem">Producto</th>
                                    <th style="min-width: 10rem">Variante</th>
                                    <th pSortableColumn="noCantidadVendida" style="min-width: 10rem">Piezas Vendidas <p-sortIcon field="noCantidadVendida"/></th>
                                </tr>
                            </ng-template>
                            <ng-template #body let-r>
                                <tr>
                                    <td class="font-mono text-xs">{{ r.clItem }}</td>
                                    <td class="font-bold">{{ r.nbProducto }}</td>
                                    <td>{{ r.nbCombinacion }} - {{ r.nbTalla }}</td>
                                    <td class="font-bold text-blue-500">{{ r.noCantidadVendida }}</td>
                                </tr>
                            </ng-template>
                            <ng-template #emptymessage>
                                <tr>
                                    <td colspan="4" class="text-center py-4">No hay datos de rotación para este rango de fechas.</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>

                    <!-- TABS 2: LIBRO DE AUDITORIA -->
                    <p-tabpanel value="2">
                        <div class="grid grid-cols-12 gap-4 mb-4 items-end">
                            <div class="col-span-12 md:col-span-4">
                                <label class="block font-bold mb-2">Rango de Fechas (Filtrado en Servidor)</label>
                                <p-datePicker [(ngModel)]="fechasAuditoria" selectionMode="range" [readonlyInput]="true" dateFormat="dd/mm/yy" class="w-full" fluid appendTo="body"></p-datePicker>
                            </div>
                            <div class="col-span-12 md:col-span-3">
                                <label class="block font-bold mb-2">Tipo de Movimiento</label>
                                <p-select [(ngModel)]="tipoMovimientoFiltro" [options]="tipoMovimientoOptions" placeholder="Todos" [showClear]="true" class="w-full" fluid />
                            </div>
                            <div class="col-span-12 md:col-span-5 flex justify-between gap-2">
                                <div>
                                    <p-button label="Filtrar" icon="pi pi-filter" severity="primary" (onClick)="cargarLibroAuditoria()" [loading]="loadingAuditoria()" />
                                </div>
                                <div>
                                    <p-button severity="secondary" label="Exportar CSV" icon="pi pi-file-excel" (onClick)="dtAuditoria.exportCSV()" pTooltip="Exportar a Excel" />
                                </div>
                            </div>
                        </div>

                        <p-table #dtAuditoria [value]="auditoriaList()" [loading]="loadingAuditoria()" [paginator]="true" [rows]="10"
                            [globalFilterFields]="['clItem', 'nbProducto', 'clOperadorCrea', 'dsMotivo']"
                            [rowsPerPageOptions]="[10, 20, 50, 100]"
                            [showCurrentPageReport]="true" currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} movimientos"
                            [rowHover]="true" responsiveLayout="scroll" exportFilename="Libro_Auditoria_Global">
                            <ng-template #caption>
                                <p-iconfield>
                                    <p-inputicon class="pi pi-search" />
                                    <input pInputText type="text" (input)="dtAuditoria.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar en resultados..." />
                                </p-iconfield>
                            </ng-template>
                            <ng-template #header>
                                <tr>
                                    <th pSortableColumn="feCreacion" style="width: 11rem">Fecha <p-sortIcon field="feCreacion"/></th>
                                    <th pSortableColumn="clTipoMovimiento" style="width: 8rem">Tipo <p-sortIcon field="clTipoMovimiento"/></th>
                                    <th style="min-width: 10rem">SKU / Producto</th>
                                    <th pSortableColumn="noCantidad" style="width: 7rem">Cant. <p-sortIcon field="noCantidad"/></th>
                                    <th style="min-width: 14rem">Motivo / Operador</th>
                                </tr>
                            </ng-template>
                            <ng-template #body let-m>
                                <tr>
                                    <td class="text-xs font-mono">{{ formatFecha(m.feCreacion) }}</td>
                                    <td>
                                        <p-tag [value]="m.clTipoMovimiento" [severity]="getTipoMovimientoSeverity(m.clTipoMovimiento)" />
                                    </td>
                                    <td>
                                        <div class="font-mono text-xs">{{ m.clItem }}</div>
                                        <div class="text-xs font-bold">{{ m.nbProducto }}</div>
                                        <div class="text-xs text-surface-500">{{ m.nbCombinacion }} ({{ m.nbTalla }})</div>
                                    </td>
                                    <td class="font-mono font-bold text-center">
                                        <span [class.text-green-500]="m.noCantidad > 0" [class.text-red-500]="m.noCantidad < 0">
                                            {{ m.noCantidad > 0 ? '+' : '' }}{{ m.noCantidad }}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="text-sm">{{ m.dsMotivo }}</div>
                                        <div class="text-xs text-surface-500"><i class="pi pi-user text-xs mr-1"></i> {{ m.clOperadorCrea }}</div>
                                    </td>
                                </tr>
                            </ng-template>
                            <ng-template #emptymessage>
                                <tr>
                                    <td colspan="5" class="text-center py-4">No se encontraron movimientos en el periodo seleccionado.</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        </div>
    `
})
export class ReportesInventario implements OnInit {
    private readonly apiService = inject(InventarioApiService);
    private readonly messageService = inject(MessageService);
    private readonly destroyRef = inject(DestroyRef);

    // Estados
    stockRealList = signal<StockRealDto[]>([]);
    rotacionList = signal<RotacionDto[]>([]);
    auditoriaList = signal<LibroAuditoriaDto[]>([]);

    loadingStock = signal<boolean>(false);
    loadingRotacion = signal<boolean>(false);
    loadingAuditoria = signal<boolean>(false);

    // Filtros
    fechasRotacion: Date[] = [];
    fechasAuditoria: Date[] = [];
    tipoMovimientoFiltro: string | null = null;
    tipoMovimientoOptions = [
        { label: 'ENTRADA', value: 'ENTRADA' },
        { label: 'BAJA', value: 'BAJA' },
        { label: 'AJUSTE', value: 'AJUSTE' },
        { label: 'VENTA', value: 'VENTA' }
    ];

    ngOnInit(): void {
        // Inicializar rango de fechas: Últimos 30 días
        const today = new Date();
        const thirtyDaysAgo = new Date();

        thirtyDaysAgo.setDate(today.getDate() - 30);


        this.fechasRotacion = [thirtyDaysAgo, today];
        this.fechasAuditoria = [thirtyDaysAgo, today];

        this.cargarStockReal();
        this.cargarRotacion();
        this.cargarLibroAuditoria();
    }

    cargarStockReal(): void {
        this.loadingStock.set(true);
        this.apiService.getStockReal().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                this.stockRealList.set(data || []);
                this.loadingStock.set(false);
            },
            error: () => {
                this.loadingStock.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el Stock Real.' });
            }
        });
    }

    cargarRotacion(): void {
        if (!this.fechasRotacion || !this.fechasRotacion[0]) return;
        const feInicio = this.fechasRotacion[0].toISOString().split('T')[0];
        const feFin = this.fechasRotacion[1] ? this.fechasRotacion[1].toISOString().split('T')[0] : feInicio;

        this.loadingRotacion.set(true);
        this.apiService.getRotacion(feInicio, feFin).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                this.rotacionList.set(data || []);
                this.loadingRotacion.set(false);
            },
            error: () => {
                this.loadingRotacion.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el reporte de Rotación.' });
            }
        });
    }

    cargarLibroAuditoria(): void {
        if (!this.fechasAuditoria || !this.fechasAuditoria[0]) return;
        const feInicio = this.fechasAuditoria[0].toISOString().split('T')[0];
        const feFin = this.fechasAuditoria[1] ? this.fechasAuditoria[1].toISOString().split('T')[0] : feInicio;
        const clTipo = this.tipoMovimientoFiltro || undefined;

        this.loadingAuditoria.set(true);
        this.apiService.getLibroAuditoria(clTipo, feInicio, feFin).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                this.auditoriaList.set(data || []);
                this.loadingAuditoria.set(false);
            },
            error: () => {
                this.loadingAuditoria.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el Libro de Auditoría.' });
            }
        });
    }

    // Utilerías de Formateo
    getSemaforoSeverity(status: string): "success" | "warn" | "danger" | "secondary" {
        switch(status) {
            case 'STOCK_OK': return 'success';
            case 'STOCK_BAJO': return 'warn';
            case 'SIN_STOCK': return 'danger';
            default: return 'secondary';
        }
    }

    formatSemaforo(status: string): string {
        switch(status) {
            case 'STOCK_OK': return 'OK';
            case 'STOCK_BAJO': return 'Bajo';
            case 'SIN_STOCK': return 'Agotado';
            default: return status;
        }
    }

    getTipoMovimientoSeverity(tipo: string): "success" | "danger" | "warn" | "info" | "secondary" {
        switch (tipo) {
            case 'ENTRADA': return 'success';
            case 'BAJA': return 'danger';
            case 'AJUSTE': return 'warn';
            case 'VENTA': return 'info';
            default: return 'secondary';
        }
    }

    formatFecha(fechaStr: string): string {
        if (!fechaStr) return '';
        const date = new Date(fechaStr);

        return date.toLocaleString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
