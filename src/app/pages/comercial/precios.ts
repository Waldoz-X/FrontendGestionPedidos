import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { FileUploadModule } from 'primeng/fileupload';

import { PreciosApiService } from '../service/precios/precios-api.service';
import { Precio, CrearPrecioRequest, HistorialPrecio } from '../service/precios/precios-api.types';
import { ClientesAdminService } from '../service/clientes-admin.service';
import { ClienteAdmin } from '../service/clientes-admin-api.types';
import { PoliticasApiService } from '../service/politicas/politicas-api.service';
import { Politica } from '../service/politicas/politicas-api.types';

@Component({
    selector: 'p-precios',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, InputNumberModule,
        SelectModule, TagModule, ToastModule, ToolbarModule, DialogModule, ConfirmDialogModule,
        IconFieldModule, InputIconModule, TooltipModule, DatePickerModule, FileUploadModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog [style]="{ width: '450px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <div class="font-semibold text-xl">Gestión de Precios</div>
                </ng-template>
                <ng-template #end>
                    <p-button severity="success" label="Nuevo Precio" icon="pi pi-plus" class="mr-2" (onClick)="abrirNuevo()" />
                    <p-button severity="secondary" label="Carga Masiva" icon="pi pi-upload" class="mr-2" (onClick)="bulkDialogVisible = true" />
                    <p-button severity="secondary" label="Recargar" icon="pi pi-refresh" [outlined]="true" (onClick)="cargarPrecios()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <p-table
                #dt
                [value]="precios()"
                [loading]="loading()"
                [rows]="10"
                [paginator]="true"
                [rowsPerPageOptions]="[10, 25, 50]"
                [globalFilterFields]="['clItem', 'nbComercialCliente', 'nbPolitica', 'clMoneda']"
                [tableStyle]="{ 'min-width': '80rem' }"
                responsiveLayout="scroll"
            >
                <ng-template #caption>
                    <div class="flex items-center justify-between">
                        <span></span>
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search" />
                            <input pInputText type="text" (input)="dt.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar..." />
                        </p-iconfield>
                    </div>
                </ng-template>
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="clItem">SKU / Item <p-sortIcon field="clItem" /></th>
                        <th pSortableColumn="nbComercialCliente">Cliente <p-sortIcon field="nbComercialCliente" /></th>
                        <th pSortableColumn="nbPolitica">Política <p-sortIcon field="nbPolitica" /></th>
                        <th pSortableColumn="mnPrecioNeto">Precio Neto <p-sortIcon field="mnPrecioNeto" /></th>
                        <th>Moneda</th>
                        <th>Vigencia Desde</th>
                        <th>Vigencia Hasta</th>
                        <th pSortableColumn="clEstatusPrecio">Estatus <p-sortIcon field="clEstatusPrecio" /></th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template #body let-precio>
                    <tr>
                        <td class="font-mono">{{ precio.clItem }}</td>
                        <td>{{ precio.nbComercialCliente || '—' }}</td>
                        <td>{{ precio.nbPolitica || '—' }}</td>
                        <td class="font-bold">{{ precio.mnPrecioNeto | currency:'':'symbol':'1.2-2' }}</td>
                        <td><p-tag [value]="precio.clMoneda" severity="info" /></td>
                        <td>{{ precio.feVigenteDesde | date:'dd/MM/yyyy' }}</td>
                        <td>{{ precio.feVigenteHasta ? (precio.feVigenteHasta | date:'dd/MM/yyyy') : 'Sin límite' }}</td>
                        <td><p-tag [value]="precio.clEstatusPrecio" [severity]="precio.clEstatusPrecio === 'ACTIVO' ? 'success' : 'danger'" /></td>
                        <td>
                            <p-button icon="pi pi-history" [rounded]="true" [text]="true" severity="info" pTooltip="Ver Historial" (onClick)="verHistorial(precio)" />
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr><td colspan="9">No se encontraron precios.</td></tr>
                </ng-template>
            </p-table>
        </div>

        <!-- DIALOG NUEVO PRECIO -->
        <p-dialog
            [(visible)]="dialogVisible"
            [style]="{ width: '600px' }"
            header="Nuevo Precio"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <div class="flex justify-between items-center mb-3">
                                <label class="font-bold">Cliente</label>
                                @if (formulario.idCliente) {
                                    <button pButton icon="pi pi-times" class="p-button-rounded p-button-text p-button-xs" style="padding: 0; width: 1.5rem; height: 1.5rem;" (click)="formulario.idCliente = ''" pTooltip="Limpiar cliente"></button>
                                }
                            </div>
                            <p-select appendTo="body" [(ngModel)]="formulario.idCliente" [options]="clientesOptions()" optionLabel="label" optionValue="value" [filter]="true" filterBy="label" placeholder="Buscar cliente..." [disabled]="!!formulario.idPolitica" fluid />
                        </div>
                        <div class="col-span-6">
                            <div class="flex justify-between items-center mb-3">
                                <label class="font-bold">Política</label>
                                @if (formulario.idPolitica) {
                                    <button pButton icon="pi pi-times" class="p-button-rounded p-button-text p-button-xs" style="padding: 0; width: 1.5rem; height: 1.5rem;" (click)="formulario.idPolitica = ''" pTooltip="Limpiar política"></button>
                                }
                            </div>
                            <p-select appendTo="body" [(ngModel)]="formulario.idPolitica" [options]="politicasOptions()" optionLabel="label" optionValue="value" placeholder="Seleccionar" [disabled]="!!formulario.idCliente" fluid />
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12">
                            <label class="block font-bold mb-3">ID del SKU</label>
                            <input type="text" pInputText [(ngModel)]="formulario.idSku" fluid />
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label class="block font-bold mb-3">Precio Neto</label>
                            <p-inputNumber [(ngModel)]="formulario.mnPrecioNeto" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="0" mode="currency" currency="MXN" locale="es-MX" fluid></p-inputNumber>
                        </div>
                        <div class="col-span-6">
                            <label class="block font-bold mb-3">Moneda</label>
                            <p-select appendTo="body" [(ngModel)]="formulario.clMoneda" [options]="monedaOptions" fluid />
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label class="block font-bold mb-3">Vigente Desde</label>
                            <p-datePicker appendTo="body" [(ngModel)]="fechaDesde" dateFormat="dd/mm/yy" fluid></p-datePicker>
                        </div>
                        <div class="col-span-6">
                            <label class="block font-bold mb-3">Vigente Hasta</label>
                            <p-datePicker appendTo="body" [(ngModel)]="fechaHasta" dateFormat="dd/mm/yy" fluid></p-datePicker>
                        </div>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="dialogVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarPrecio()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <!-- DIALOG CARGA MASIVA -->
        <p-dialog
            [(visible)]="bulkDialogVisible"
            [style]="{ width: '500px' }"
            header="Carga Masiva de Precios"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div class="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <i class="pi pi-info-circle text-blue-500 text-xl"></i>
                        <span class="text-sm">Seleccione un archivo <strong>.json</strong> con la estructura de precios. Tamaño máximo: <strong>10MB</strong>.</span>
                    </div>
                    <div class="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg">
                        <i class="pi pi-cloud-upload text-4xl text-surface-400"></i>
                        <p class="m-0 text-surface-500">Arrastre su archivo aquí o use el botón</p>
                        <p-fileupload
                            mode="basic"
                            chooseLabel="Elegir Archivo JSON"
                            chooseIcon="pi pi-file"
                            accept=".json"
                            maxFileSize="10000000"
                            [auto]="true"
                            [customUpload]="true"
                            (uploadHandler)="onUploadBulk($event)" />
                    </div>
                </div>
            </ng-template>
        </p-dialog>

        <!-- DIALOG HISTORIAL -->
        <p-dialog
            [(visible)]="historialDialogVisible"
            [style]="{ width: '700px' }"
            header="Historial de Cambios de Precio"
            [modal]="true"
        >
            <ng-template #content>
                <p-table [value]="historial()" [loading]="cargandoHistorial()">
                    <ng-template #header>
                        <tr>
                            <th>Fecha</th>
                            <th>Precio Anterior</th>
                            <th>Precio Nuevo</th>
                            <th>Moneda</th>
                            <th>Modificado por</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-h>
                        <tr>
                            <td>{{ h.feModificacion | date:'dd/MM/yyyy HH:mm' }}</td>
                            <td class="text-red-500">{{ h.mnPrecioAnterior | currency:'':'symbol':'1.2-2' }}</td>
                            <td class="text-green-500 font-bold">{{ h.mnPrecioNuevo | currency:'':'symbol':'1.2-2' }}</td>
                            <td><p-tag [value]="h.clMoneda" severity="info" /></td>
                            <td>{{ h.nbUsuarioModificador }}</td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr><td colspan="5">No hay historial de cambios para este precio.</td></tr>
                    </ng-template>
                </p-table>
            </ng-template>
        </p-dialog>
    `
})
export class Precios implements OnInit {
    private readonly apiService = inject(PreciosApiService);
    private readonly clientesService = inject(ClientesAdminService);
    private readonly politicasService = inject(PoliticasApiService);
    private readonly messageService = inject(MessageService);
    private readonly destroyRef = inject(DestroyRef);

    precios = signal<Precio[]>([]);
    loading = signal<boolean>(false);
    saving = signal<boolean>(false);

    dialogVisible = false;
    bulkDialogVisible = false;
    historialDialogVisible = false;

    monedaOptions = ['MXN', 'USD', 'EUR'];

    clientesOptions = signal<{label: string, value: string}[]>([]);
    politicasOptions = signal<{label: string, value: string}[]>([]);

    formulario: CrearPrecioRequest = {
        idSku: '', idCliente: '', idPolitica: '', mnPrecioNeto: 0,
        clMoneda: 'MXN', feVigenteDesde: '', feVigenteHasta: ''
    };
    fechaDesde: Date | null = null;
    fechaHasta: Date | null = null;

    historial = signal<HistorialPrecio[]>([]);
    cargandoHistorial = signal<boolean>(false);

    ngOnInit(): void {
        this.cargarPrecios();
        this.cargarDropdowns();
    }

    cargarPrecios(): void {
        this.loading.set(true);
        this.apiService.getPrecios().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => { this.precios.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los precios.', life: 5000 }); }
        });
    }

    cargarDropdowns(): void {
        this.clientesService.getClientes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: ClienteAdmin[]) => { this.clientesOptions.set((data || []).map(c => ({ label: c.nbComercial, value: c.id }))); }
        });
        this.politicasService.getPoliticas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: Politica[]) => { this.politicasOptions.set((data || []).map(p => ({ label: p.nbPolitica, value: p.idPolitica }))); }
        });
    }

    abrirNuevo(): void {
        this.formulario = { idSku: '', idCliente: '', idPolitica: '', mnPrecioNeto: 0, clMoneda: 'MXN', feVigenteDesde: '', feVigenteHasta: '' };
        this.fechaDesde = new Date(); this.fechaHasta = null;
        this.dialogVisible = true;
    }

    guardarPrecio(): void {
        if (!this.formulario.idSku) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El ID del SKU es requerido.', life: 3000 });

 return;
        }

        this.saving.set(true);
        const payload: CrearPrecioRequest = {
            ...this.formulario,
            feVigenteDesde: this.fechaDesde ? this.fechaDesde.toISOString() : new Date().toISOString(),
            feVigenteHasta: this.fechaHasta ? this.fechaHasta.toISOString() : ''
        };

        this.apiService.crearPrecio(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Precio creado correctamente.', life: 3000 });
                this.dialogVisible = false; this.saving.set(false); this.cargarPrecios();
            },
            error: () => { this.saving.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el precio.', life: 5000 }); }
        });
    }

    verHistorial(precio: Precio): void {
        this.cargandoHistorial.set(true);
        this.historialDialogVisible = true;
        this.apiService.getHistorial(precio.idPrecio).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => { this.historial.set(data); this.cargandoHistorial.set(false); },
            error: () => { this.cargandoHistorial.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial.', life: 5000 }); }
        });
    }

    onUploadBulk(event: any): void {
        const file = event.files[0];

        if (!file) return;
        const reader = new FileReader();

        reader.onload = (e: any) => {
            try {
                const jsonContent = JSON.parse(e.target.result);

                if (!Array.isArray(jsonContent)) {
                    this.messageService.add({ severity: 'error', summary: 'Error de Formato', detail: 'El archivo debe contener un arreglo de precios.', life: 5000 });
                    event.options.clear();

 return;
                }

                this.saving.set(true);
                this.apiService.crearPreciosBulk(jsonContent).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Carga masiva de precios completada.', life: 3000 });
                        this.bulkDialogVisible = false; this.saving.set(false); event.options.clear(); this.cargarPrecios();
                    },
                    error: (err) => {
                        console.error(err);
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar la carga masiva.', life: 5000 });
                        this.saving.set(false); event.options.clear();
                    }
                });
            } catch { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'JSON inválido.', life: 5000 }); event.options.clear(); }
        };

        reader.readAsText(file);
    }
}
