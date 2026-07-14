import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
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
import { LibroAuditoriaDto, MovimientoInventarioDto, RotacionDto, StockRealDto } from '../service/inventario/inventario-api.types';

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
                Consulte stock real, rotación, libro de auditoría y kardex por SKU con filtros claros y exportación CSV para Excel.
            </p>

            <p-tabs value="0">
                <p-tablist>
                    <p-tab value="0"><i class="pi pi-box mr-2"></i> Estado Actual (Stock Real)</p-tab>
                    <p-tab value="1"><i class="pi pi-chart-line mr-2"></i> Rotación (KPI Ventas)</p-tab>
                    <p-tab value="2"><i class="pi pi-history mr-2"></i> Libro de Auditoría</p-tab>
                    <p-tab value="3"><i class="pi pi-list-check mr-2"></i> Kardex por SKU</p-tab>
                </p-tablist>

                <p-tabpanels>
                    <p-tabpanel value="0">
                        <p-toolbar styleClass="mb-4">
                            <ng-template #start>
                                <p-iconfield>
                                    <p-inputicon class="pi pi-search" />
                                    <input pInputText type="text" (input)="dtStock.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar por SKU o Producto..." />
                                </p-iconfield>
                            </ng-template>
                            <ng-template #end>
                                <p-button severity="secondary" label="Exportar CSV" icon="pi pi-file-excel" (onClick)="exportStockCsv()" [disabled]="!stockRealList().length" pTooltip="Descargar CSV compatible con Excel" />
                                <p-button severity="info" label="Actualizar" icon="pi pi-refresh" (onClick)="cargarStockReal()" class="ml-2" [loading]="loadingStock()" />
                            </ng-template>
                        </p-toolbar>

                        <div class="flex flex-wrap gap-2 mb-4 text-sm">
                            <span class="px-3 py-1 border-round bg-surface-100">SKUs: <b>{{ stockRealList().length }}</b></span>
                            <span class="px-3 py-1 border-round bg-red-100 text-red-600">Stock bajo/agotado: <b>{{ stockComprometidoCount() }}</b></span>
                            <span class="px-3 py-1 border-round bg-green-100 text-green-700">Stock OK: <b>{{ stockOkCount() }}</b></span>
                        </div>

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

                    <p-tabpanel value="1">
                        <div class="grid grid-cols-12 gap-4 mb-4 items-end">
                            <div class="col-span-12 md:col-span-3">
                                <label class="block font-bold mb-2">Rango de Fechas (Filtrado en Servidor)</label>
                                <p-datePicker [(ngModel)]="fechasRotacion" selectionMode="range" [readonlyInput]="true" dateFormat="dd/mm/yy" class="w-full" fluid appendTo="body"></p-datePicker>
                            </div>
                            <div class="col-span-12 md:col-span-4">
                                <label class="block font-bold mb-2">Búsqueda en resultados</label>
                                <p-iconfield>
                                    <p-inputicon class="pi pi-search" />
                                    <input pInputText type="text" (input)="dtRotacion.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar por SKU o producto..." class="w-full" />
                                </p-iconfield>
                            </div>
                            <div class="col-span-12 md:col-span-5 flex justify-between gap-2">
                                <div>
                                    <p-button label="Filtrar" icon="pi pi-filter" severity="primary" (onClick)="cargarRotacion()" [loading]="loadingRotacion()" />
                                </div>
                                <div>
                                    <p-button severity="secondary" label="Exportar CSV" icon="pi pi-file-excel" (onClick)="exportRotacionCsv()" [disabled]="!rotacionList().length" pTooltip="Descargar CSV compatible con Excel" />
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
                                    <p-button severity="secondary" label="Exportar CSV" icon="pi pi-file-excel" (onClick)="exportAuditoriaCsv()" [disabled]="!auditoriaList().length" pTooltip="Descargar CSV compatible con Excel" />
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

                    <p-tabpanel value="3">
                        <div class="grid grid-cols-12 gap-4 mb-4 items-end">
                            <div class="col-span-12 md:col-span-7">
                                <label class="block font-bold mb-2">SKU</label>
                                <p-select
                                    [(ngModel)]="kardexSkuId"
                                    [options]="skuOptions()"
                                    optionLabel="label"
                                    optionValue="value"
                                    [filter]="true"
                                    filterBy="label"
                                    placeholder="Seleccione un SKU"
                                    [showClear]="true"
                                    class="w-full"
                                    fluid
                                />
                            </div>
                            <div class="col-span-12 md:col-span-5 flex justify-between gap-2">
                                <div>
                                    <p-button label="Consultar Kardex" icon="pi pi-search" severity="primary" (onClick)="cargarKardex()" [loading]="loadingKardex()" />
                                </div>
                                <div>
                                    <p-button severity="secondary" label="Exportar CSV" icon="pi pi-file-excel" (onClick)="exportKardexCsv()" [disabled]="!kardexList().length" pTooltip="Descargar CSV compatible con Excel" />
                                </div>
                            </div>
                        </div>

                        <p-table #dtKardex [value]="kardexList()" [loading]="loadingKardex()" [paginator]="true" [rows]="10"
                            [globalFilterFields]="['clTipoMovimiento', 'dsMotivo', 'clOperadorCrea']"
                            [rowsPerPageOptions]="[10, 20, 50]"
                            [showCurrentPageReport]="true" currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} movimientos"
                            [rowHover]="true" responsiveLayout="scroll" exportFilename="Kardex_SKU">
                            <ng-template #caption>
                                <p-iconfield>
                                    <p-inputicon class="pi pi-search" />
                                    <input pInputText type="text" (input)="dtKardex.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar en movimientos..." />
                                </p-iconfield>
                            </ng-template>
                            <ng-template #header>
                                <tr>
                                    <th pSortableColumn="feCreacion" style="width: 11rem">Fecha <p-sortIcon field="feCreacion"/></th>
                                    <th pSortableColumn="clTipoMovimiento" style="width: 8rem">Tipo <p-sortIcon field="clTipoMovimiento"/></th>
                                    <th pSortableColumn="noCantidad" style="width: 7rem">Cant. <p-sortIcon field="noCantidad"/></th>
                                    <th style="min-width: 14rem">Motivo</th>
                                    <th style="min-width: 12rem">Operador</th>
                                </tr>
                            </ng-template>
                            <ng-template #body let-m>
                                <tr>
                                    <td class="text-xs font-mono">{{ formatFecha(m.feCreacion) }}</td>
                                    <td>
                                        <p-tag [value]="m.clTipoMovimiento" [severity]="getTipoMovimientoSeverity(m.clTipoMovimiento)" />
                                    </td>
                                    <td class="font-mono font-bold text-center">
                                        <span [class.text-green-500]="m.noCantidad > 0" [class.text-red-500]="m.noCantidad < 0">
                                            {{ m.noCantidad > 0 ? '+' : '' }}{{ m.noCantidad }}
                                        </span>
                                    </td>
                                    <td>{{ m.dsMotivo }}</td>
                                    <td class="text-xs">{{ m.clOperadorCrea }}</td>
                                </tr>
                            </ng-template>
                            <ng-template #emptymessage>
                                <tr>
                                    <td colspan="5" class="text-center py-4">No hay movimientos para el SKU seleccionado.</td>
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
    kardexList = signal<MovimientoInventarioDto[]>([]);
    skuOptions = signal<{ label: string; value: string }[]>([]);

    loadingStock = signal<boolean>(false);
    loadingRotacion = signal<boolean>(false);
    loadingAuditoria = signal<boolean>(false);
    loadingKardex = signal<boolean>(false);
    stockComprometidoCount = computed(() => this.stockRealList().filter((item) => item.clSemaforoStock !== 'STOCK_OK').length);
    stockOkCount = computed(() => this.stockRealList().filter((item) => item.clSemaforoStock === 'STOCK_OK').length);

    // Filtros
    fechasRotacion: Date[] = [];
    fechasAuditoria: Date[] = [];
    tipoMovimientoFiltro: string | null = null;
    kardexSkuId: string | null = null;
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
                const rows = data || [];

                this.stockRealList.set(rows);
                this.skuOptions.set(rows.map((item) => ({ label: `${item.clItem} · ${item.nbProducto} · ${item.nbCombinacion} · ${item.nbTalla}`, value: item.idSku })));
                this.loadingStock.set(false);
            },
            error: () => {
                this.loadingStock.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el Stock Real.' });
            }
        });
    }

    cargarRotacion(): void {
        const range = this.getDateRangeForApi(this.fechasRotacion);

        if (!range) return;

        this.loadingRotacion.set(true);
        this.apiService.getRotacion(range.feInicio, range.feFin).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
        const range = this.getDateRangeForApi(this.fechasAuditoria);

        if (!range) return;
        const clTipo = this.tipoMovimientoFiltro || undefined;

        this.loadingAuditoria.set(true);
        this.apiService.getLibroAuditoria(clTipo, range.feInicio, range.feFin).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

    cargarKardex(): void {
        if (!this.kardexSkuId) {
            this.messageService.add({ severity: 'warn', summary: 'SKU requerido', detail: 'Seleccione un SKU para consultar su kardex.' });

            return;
        }

        this.loadingKardex.set(true);
        this.apiService.getKardex(this.kardexSkuId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                this.kardexList.set(data || []);
                this.loadingKardex.set(false);
            },
            error: () => {
                this.loadingKardex.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el Kardex.' });
            }
        });
    }

    exportStockCsv(): void {
        this.exportToCsv(
            this.stockRealList(),
            'Reporte_Stock_Real',
            [
                { header: 'ID SKU', value: (r) => r.idSku },
                { header: 'SKU', value: (r) => r.clItem },
                { header: 'Producto', value: (r) => r.nbProducto },
                { header: 'Combinacion', value: (r) => r.nbCombinacion },
                { header: 'Talla', value: (r) => r.nbTalla },
                { header: 'Stock disponible', value: (r) => r.noStockDisponible },
                { header: 'Stock reservado', value: (r) => r.noStockReservado },
                { header: 'Stock neto', value: (r) => r.noStockNeto },
                { header: 'Stock minimo', value: (r) => r.noStockMinimo },
                { header: 'Semaforo', value: (r) => this.formatSemaforo(r.clSemaforoStock) }
            ]
        );
    }

    exportRotacionCsv(): void {
        this.exportToCsv(
            this.rotacionList(),
            'Reporte_Rotacion',
            [
                { header: 'ID SKU', value: (r) => r.idSku },
                { header: 'SKU', value: (r) => r.clItem },
                { header: 'Producto', value: (r) => r.nbProducto },
                { header: 'Combinacion', value: (r) => r.nbCombinacion },
                { header: 'Talla', value: (r) => r.nbTalla },
                { header: 'Cantidad vendida', value: (r) => r.noCantidadVendida }
            ]
        );
    }

    exportAuditoriaCsv(): void {
        this.exportToCsv(
            this.auditoriaList(),
            'Libro_Auditoria',
            [
                { header: 'ID Movimiento', value: (r) => r.idMovimiento },
                { header: 'Fecha', value: (r) => this.formatFecha(r.feCreacion) },
                { header: 'Tipo movimiento', value: (r) => r.clTipoMovimiento },
                { header: 'ID SKU', value: (r) => r.idSku },
                { header: 'SKU', value: (r) => r.clItem },
                { header: 'Producto', value: (r) => r.nbProducto },
                { header: 'Combinacion', value: (r) => r.nbCombinacion },
                { header: 'Talla', value: (r) => r.nbTalla },
                { header: 'Cantidad', value: (r) => r.noCantidad },
                { header: 'Operador', value: (r) => r.clOperadorCrea },
                { header: 'Motivo', value: (r) => r.dsMotivo }
            ]
        );
    }

    exportKardexCsv(): void {
        this.exportToCsv(
            this.kardexList(),
            'Kardex_SKU',
            [
                { header: 'ID Movimiento', value: (r) => r.idMovimiento },
                { header: 'ID SKU', value: (r) => r.idSku },
                { header: 'Fecha', value: (r) => this.formatFecha(r.feCreacion) },
                { header: 'Tipo movimiento', value: (r) => r.clTipoMovimiento },
                { header: 'Cantidad', value: (r) => r.noCantidad },
                { header: 'Motivo', value: (r) => r.dsMotivo },
                { header: 'Operador', value: (r) => r.clOperadorCrea }
            ]
        );
    }

    private getDateRangeForApi(fechas: Date[]): { feInicio: string; feFin: string } | null {
        if (!fechas || !fechas[0]) {
            this.messageService.add({ severity: 'warn', summary: 'Rango requerido', detail: 'Seleccione una fecha inicial.' });

            return null;
        }

        const start = new Date(fechas[0]);
        const end = new Date(fechas[1] ?? fechas[0]);

        if (end < start) {
            this.messageService.add({ severity: 'warn', summary: 'Rango inválido', detail: 'La fecha fin no puede ser menor que la fecha inicio.' });

            return null;
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return {
            feInicio: start.toISOString(),
            feFin: end.toISOString()
        };
    }

    private exportToCsv<T>(
        rows: T[],
        filename: string,
        columns: { header: string; value: (row: T) => string | number | null | undefined }[]
    ): void {
        if (!rows.length) {
            this.messageService.add({ severity: 'warn', summary: 'Sin datos', detail: 'No hay registros para exportar.' });

            return;
        }

        const headerLine = columns.map((column) => this.toCsvValue(column.header)).join(',');
        const dataLines = rows.map((row) => columns.map((column) => this.toCsvValue(column.value(row))).join(','));
        const csv = ['\uFEFF' + headerLine, ...dataLines].join('\r\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.messageService.add({ severity: 'success', summary: 'Exportación lista', detail: `Se exportaron ${rows.length} registros.` });
    }

    private toCsvValue(value: string | number | null | undefined): string {
        const text = `${value ?? ''}`;
        const escaped = text.replace(/"/g, '""');

        return `"${escaped}"`;
    }

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
