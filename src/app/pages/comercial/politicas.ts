import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';

import { PoliticasApiService } from '../service/politicas/politicas-api.service';
import { Politica, CrearPoliticaRequest, PoliticaCliente, AsignarClientePoliticaRequest } from '../service/politicas/politicas-api.types';
import { ClientesAdminService } from '../service/clientes-admin.service';
import { ClienteAdmin } from '../service/clientes-admin-api.types';

@Component({
    selector: 'app-politicas',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, InputNumberModule,
        SelectModule, TagModule, ToastModule, ToolbarModule, DialogModule, ConfirmDialogModule,
        IconFieldModule, InputIconModule, DatePickerModule, CheckboxModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog [style]="{ width: '450px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <div class="font-semibold text-xl">Políticas de Precio</div>
                </ng-template>
                <ng-template #end>
                    <p-button severity="success" label="Nueva Política" icon="pi pi-plus" class="mr-2" (onClick)="abrirNueva()" />
                </ng-template>
            </p-toolbar>

            <p-table
                #dt
                [value]="politicas()"
                [loading]="loading()"
                [rows]="10"
                [paginator]="true"
                [rowsPerPageOptions]="[10, 25, 50]"
                [globalFilterFields]="['nbPolitica', 'clTipoPolitica', 'clEstatusPolitica']"
                [tableStyle]="{ 'min-width': '75rem' }"
                responsiveLayout="scroll"
            >
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="nbPolitica">Nombre <p-sortIcon field="nbPolitica" /></th>
                        <th pSortableColumn="clTipoPolitica">Tipo <p-sortIcon field="clTipoPolitica" /></th>
                        <th pSortableColumn="noPrioridad">Prioridad <p-sortIcon field="noPrioridad" /></th>
                        <th>Factor Desc.</th>
                        <th>Vigencia Desde</th>
                        <th>Vigencia Hasta</th>
                        <th>Clientes</th>
                        <th pSortableColumn="clEstatusPolitica">Estatus <p-sortIcon field="clEstatusPolitica" /></th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template #body let-pol>
                    <tr>
                        <td>{{ pol.nbPolitica }}</td>
                        <td><p-tag [value]="pol.clTipoPolitica" /></td>
                        <td class="text-center">{{ pol.noPrioridad }}</td>
                        <td>{{ pol.mnFactorDescuento | percent:'1.0-2' }}</td>
                        <td>{{ pol.feVigenteDesde | date:'dd/MM/yyyy' }}</td>
                        <td>{{ pol.feVigenteHasta ? (pol.feVigenteHasta | date:'dd/MM/yyyy') : 'Sin límite' }}</td>
                        <td class="text-center">
                            <p-tag [value]="pol.conteoClientes.toString()" [severity]="pol.conteoClientes > 0 ? 'info' : 'warn'" />
                        </td>
                        <td><p-tag [value]="pol.clEstatusPolitica" [severity]="pol.clEstatusPolitica === 'ACTIVO' ? 'success' : 'danger'" /></td>
                        <td>
                            <p-button icon="pi pi-users" [rounded]="true" [text]="true" severity="info" pTooltip="Gestionar Clientes" (onClick)="abrirClientes(pol)" class="mr-1" />
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr><td colspan="9">No se encontraron políticas.</td></tr>
                </ng-template>
            </p-table>
        </div>

        <!-- DIALOG NUEVA POLÍTICA -->
        <p-dialog
            [(visible)]="dialogVisible"
            [style]="{ width: '550px' }"
            header="Nueva Política"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12">
                            <label class="block font-bold mb-3">Nombre de la Política</label>
                            <input type="text" pInputText [(ngModel)]="formulario.nbPolitica" fluid />
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label class="block font-bold mb-3">Tipo</label>
                            <p-select appendTo="body" [(ngModel)]="formulario.clTipoPolitica" [options]="tipoOptions" fluid />
                        </div>
                        <div class="col-span-6">
                            <label class="block font-bold mb-3">Prioridad</label>
                            <p-inputnumber [(ngModel)]="formulario.noPrioridad" [min]="1" [max]="100" fluid />
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12">
                            <label class="block font-bold mb-3">Factor de Descuento (ej. 0.10 = 10%)</label>
                            <p-inputnumber [(ngModel)]="formulario.mnFactorDescuento" [minFractionDigits]="2" [maxFractionDigits]="4" [min]="0" [max]="1" fluid />
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label class="block font-bold mb-3">Vigente Desde</label>
                            <p-datepicker appendTo="body" [(ngModel)]="fechaDesde" dateFormat="dd/mm/yy" fluid />
                        </div>
                        <div class="col-span-6">
                            <label class="block font-bold mb-3">Vigente Hasta</label>
                            <p-datepicker appendTo="body" [(ngModel)]="fechaHasta" dateFormat="dd/mm/yy" fluid />
                        </div>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="dialogVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarPolitica()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <!-- DIALOG GESTIONAR CLIENTES DE POLÍTICA -->
        <p-dialog
            [(visible)]="clientesDialogVisible"
            [style]="{ width: '700px' }"
            [header]="'Clientes de: ' + (politicaSeleccionada?.nbPolitica || '')"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div class="flex gap-2 items-end">
                        <div class="flex-1">
                            <label class="block font-bold mb-2">Agregar Cliente</label>
                            <p-select appendTo="body" [(ngModel)]="clienteSeleccionadoId" [options]="clientesOptions()" optionLabel="label" optionValue="value" [filter]="true" filterBy="label" placeholder="Buscar cliente..." fluid />
                        </div>
                        <div>
                            <p-button label="Asignar" icon="pi pi-plus" (onClick)="asignarCliente()" [disabled]="!clienteSeleccionadoId" />
                        </div>
                    </div>

                    <p-table [value]="clientesPolitica()" [loading]="cargandoClientes()">
                        <ng-template #header>
                            <tr>
                                <th>Cliente</th>
                                <th>Principal</th>
                                <th></th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-cp>
                            <tr>
                                <td>{{ cp.nbComercial }}</td>
                                <td><p-tag [value]="cp.esPrincipal ? 'SÍ' : 'NO'" [severity]="cp.esPrincipal ? 'success' : 'secondary'" /></td>
                                <td>
                                    <p-button icon="pi pi-trash" severity="danger" [text]="true" (onClick)="removerCliente(cp)" />
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template #emptymessage>
                            <tr><td colspan="3">No hay clientes asignados a esta política.</td></tr>
                        </ng-template>
                    </p-table>
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class Politicas implements OnInit {
    private readonly apiService = inject(PoliticasApiService);
    private readonly clientesService = inject(ClientesAdminService);
    private readonly messageService = inject(MessageService);
    private readonly destroyRef = inject(DestroyRef);

    politicas = signal<Politica[]>([]);
    loading = signal<boolean>(false);
    saving = signal<boolean>(false);
    dialogVisible = false;

    tipoOptions = ['DESCUENTO', 'LISTA_FIJA', 'MAYOREO'];

    formulario: CrearPoliticaRequest = {
        nbPolitica: '', clTipoPolitica: 'DESCUENTO', noPrioridad: 1,
        mnFactorDescuento: 0, feVigenteDesde: '', feVigenteHasta: ''
    };
    fechaDesde: Date | null = null;
    fechaHasta: Date | null = null;

    // Gestión de clientes
    clientesDialogVisible = false;
    politicaSeleccionada: Politica | null = null;
    clientesPolitica = signal<PoliticaCliente[]>([]);
    cargandoClientes = signal<boolean>(false);
    clientesOptions = signal<{label: string, value: string}[]>([]);
    clienteSeleccionadoId: string = '';

    ngOnInit(): void {
        this.cargarPoliticas();
        this.cargarClientes();
    }

    cargarPoliticas(): void {
        this.loading.set(true);
        this.apiService.getPoliticas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => { this.politicas.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las políticas.', life: 5000 }); }
        });
    }

    cargarClientes(): void {
        this.clientesService.getClientes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: ClienteAdmin[]) => {
                this.clientesOptions.set((data || []).map(c => ({ 
                    label: c.nbComercial, 
                    value: c.id || (c as any).idCliente 
                })));
            }
        });
    }

    abrirNueva(): void {
        this.formulario = { nbPolitica: '', clTipoPolitica: 'DESCUENTO', noPrioridad: 1, mnFactorDescuento: 0, feVigenteDesde: '', feVigenteHasta: '' };
        this.fechaDesde = new Date();
        this.fechaHasta = null;
        this.dialogVisible = true;
    }

    guardarPolitica(): void {
        if (!this.formulario.nbPolitica) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El nombre de la política es requerido.', life: 3000 });
            return;
        }
        this.saving.set(true);
        const payload: CrearPoliticaRequest = {
            ...this.formulario,
            feVigenteDesde: this.fechaDesde ? this.fechaDesde.toISOString() : new Date().toISOString(),
            feVigenteHasta: this.fechaHasta ? this.fechaHasta.toISOString() : ''
        };
        this.apiService.crearPolitica(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Política creada correctamente.', life: 3000 });
                this.dialogVisible = false; this.saving.set(false); this.cargarPoliticas();
            },
            error: () => { this.saving.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la política.', life: 5000 }); }
        });
    }

    abrirClientes(pol: Politica): void {
        this.politicaSeleccionada = pol;
        this.clienteSeleccionadoId = '';
        this.clientesDialogVisible = true;
        this.cargarClientesPolitica(pol.idPolitica);
    }

    cargarClientesPolitica(idPolitica: string): void {
        this.cargandoClientes.set(true);
        this.apiService.getClientesPolitica(idPolitica).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => { this.clientesPolitica.set(data); this.cargandoClientes.set(false); },
            error: () => { this.cargandoClientes.set(false); }
        });
    }

    asignarCliente(): void {
        if (!this.clienteSeleccionadoId || !this.politicaSeleccionada) return;
        const payload: AsignarClientePoliticaRequest = {
            idCliente: this.clienteSeleccionadoId,
            idPolitica: this.politicaSeleccionada.idPolitica,
            esPrincipal: false
        };
        this.apiService.asignarClientePolitica(this.politicaSeleccionada.idPolitica, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente asignado.', life: 3000 });
                this.clienteSeleccionadoId = '';
                this.cargarClientesPolitica(this.politicaSeleccionada!.idPolitica);
                this.cargarPoliticas();
            },
            error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo asignar el cliente.', life: 5000 }); }
        });
    }

    removerCliente(cp: PoliticaCliente): void {
        this.apiService.removerClientePolitica(cp.idPolitica, cp.idCliente).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente removido.', life: 3000 });
                this.cargarClientesPolitica(cp.idPolitica);
                this.cargarPoliticas();
            },
            error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo remover el cliente.', life: 5000 }); }
        });
    }
}
