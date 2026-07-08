import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { ActualizarClienteAdminRequest, ClienteAdmin, CrearClienteAdminRequest } from '../service/clientes-admin-api.types';
import { ClientesAdminService } from '../service/clientes-admin.service';
import { CatalogosApiService } from '../service/catalogos-api.service';

type ClienteForm = CrearClienteAdminRequest;

@Component({
    selector: 'p-clientes',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, TagModule, ToastModule, ToolbarModule, DialogModule, ConfirmDialogModule, IconFieldModule, InputIconModule, TooltipModule],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog [style]="{ width: '450px' }" />

        <div class="card">
            <p-toolbar class="mb-6">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Clientes</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Administración del catálogo de clientes.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nuevo" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirNuevo()" />
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="cargarClientes()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <p-table
                #dt
                [value]="clientes()"
                dataKey="id"
                [loading]="loading()"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="[10, 20, 50]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} clientes"
                [showCurrentPageReport]="true"
                [globalFilterFields]="['nbComercial', 'clTipoCliente', 'dsCanalVenta', 'clEstatusCliente']"
                [tableStyle]="{ 'min-width': '70rem' }"
                [rowHover]="true"
            >
                <ng-template #caption>
                    <div class="flex items-center justify-between gap-4">
                        <span class="text-sm text-surface-500">Registros disponibles</span>
                        <p-iconfield>
                            <p-inputicon class="pi pi-search" />
                            <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar Clientes " />
                        </p-iconfield>
                    </div>
                </ng-template>

                <ng-template #header>
                    <tr>
                        <th pSortableColumn="nbComercial" style="min-width: 18rem">Nombre comercial <p-sortIcon field="nbComercial" /></th>
                        <th pSortableColumn="clTipoCliente" style="min-width: 10rem">Tipo <p-sortIcon field="clTipoCliente" /></th>
                        <th style="min-width: 9rem">Moneda</th>
                        <th style="min-width: 14rem">Canal venta</th>
                        <th pSortableColumn="mnLimiteCredito" class="text-right" style="min-width: 11rem">Límite crédito <p-sortIcon field="mnLimiteCredito" /></th>
                        <th pSortableColumn="clEstatusCliente" style="min-width: 9rem">Estado <p-sortIcon field="clEstatusCliente" /></th>
                        <th style="min-width: 12rem"></th>
                    </tr>
                </ng-template>

                <ng-template #body let-cliente>
                    <tr>
                        <td class="font-medium">
                            <div class="flex flex-col">
                                <span>{{ cliente.nbComercial }}</span>
                                <small class="text-surface-500 font-mono">{{ cliente.id }}</small>
                            </div>
                        </td>
                        <td>{{ cliente.clTipoCliente }}</td>
                        <td>{{ getMonedaLabel(cliente.idElemMoneda) }}</td>
                        <td>{{ cliente.dsCanalVenta }}</td>
                        <td class="text-right">{{ cliente.mnLimiteCredito | number : '1.2-2' }}</td>
                        <td>
                            <p-tag [value]="cliente.clEstatusCliente" [severity]="cliente.clEstatusCliente === 'ACTIVO' ? 'success' : 'danger'" />
                        </td>
                        <td>
                            <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (onClick)="abrirEditar(cliente)" pTooltip="Editar" />
                            <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="confirmarEliminar(cliente)" pTooltip="Eliminar" />
                        </td>
                    </tr>
                </ng-template>

                <ng-template #emptymessage>
                    <tr>
                        <td colspan="7">No hay clientes para mostrar.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="dialogVisible" [style]="{ width: '560px' }" [header]="editMode ? 'Editar cliente' : 'Nuevo cliente'" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-5">
                    <div>
                        <label for="nbComercial" class="block font-bold mb-2">Nombre comercial  <span class="text-red-500">*</span></label>
                        <input id="nbComercial" pInputText [(ngModel)]="form.nbComercial" class="w-full" maxlength="100" />
                        @if (submitted() && !form.nbComercial.trim()) {
                            <small class="text-red-500">El nombre comercial es obligatorio.</small>
                        }
                    </div>

                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6">
                            <label for="clTipoCliente" class="block font-bold mb-2">Tipo de cliente  <span class="text-red-500">*</span></label>
                            <p-select appendTo="body" inputId="clTipoCliente" [(ngModel)]="form.clTipoCliente" [options]="tipoClienteOptions" optionLabel="label" optionValue="value" placeholder="Selecciona..." fluid />
                            @if (submitted() && !form.clTipoCliente) {
                                <small class="text-red-500">El tipo de cliente es obligatorio.</small>
                            }
                        </div>

                        <div class="col-span-12 md:col-span-6">
                            <label for="idElemMoneda" class="block font-bold mb-2">Moneda  <span class="text-red-500">*</span></label>
                            <p-select appendTo="body" inputId="idElemMoneda" [(ngModel)]="form.idElemMoneda" [options]="monedaOptions()" optionLabel="label" optionValue="value" placeholder="Selecciona..." fluid />
                            @if (submitted() && !form.idElemMoneda) {
                                <small class="text-red-500">La moneda es obligatoria.</small>
                            }
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12">
                            <label for="dsCanalVenta" class="block font-bold mb-2">Canal de venta  <span class="text-red-500">*</span></label>
                            <input id="dsCanalVenta" pInputText [(ngModel)]="form.dsCanalVenta" class="w-full" maxlength="150" />
                            @if (submitted() && !form.dsCanalVenta.trim()) {
                                <small class="text-red-500">El canal de venta es obligatorio.</small>
                            }
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6">
                            <label for="mnLimiteCredito" class="block font-bold mb-2">Límite de crédito</label>
                            <p-inputNumber inputId="mnLimiteCredito" [(ngModel)]="form.mnLimiteCredito" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="0" fluid />
                        </div>

                        <div class="col-span-12 md:col-span-6">
                            <label for="clEstatusCliente" class="block font-bold mb-2">Estado</label>
                            <p-select appendTo="body" inputId="clEstatusCliente" [(ngModel)]="form.clEstatusCliente" [options]="estatusOptions" optionLabel="label" optionValue="value" placeholder="Selecciona..." fluid />
                        </div>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="dialogVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarCliente()" [loading]="saving()" />
            </ng-template>
        </p-dialog>
    `
})
export class ClientesAdminComponent implements OnInit {
    private readonly clientesService = inject(ClientesAdminService);
    private readonly catalogosGenService = inject(CatalogosApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly destroyRef = inject(DestroyRef);

    clientes = signal<ClienteAdmin[]>([]);
    loading = signal(false);
    saving = signal(false);
    submitted = signal(false);

    dialogVisible = false;
    editMode = false;
    selectedId: string | null = null;
    form: ClienteForm = this.emptyForm();

    tipoClienteOptions = [
        { label: 'Distribuidor', value: 'Distribuidor' },
        { label: 'Mayorista', value: 'Mayorista' },
        { label: 'Minorista', value: 'Minorista' },
        { label: 'Directo', value: 'Directo' }
    ];

    estatusOptions = [
        { label: 'ACTIVO', value: 'ACTIVO' },
        { label: 'INACTIVO', value: 'INACTIVO' }
    ];

    monedaOptions = signal<{label: string, value: number, clave?: string}[]>([]);

    private searchSubject = new Subject<{table: Table, query: string}>();

    ngOnInit(): void {
        this.cargarClientes();
        this.cargarMonedas();

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged((prev, curr) => prev.query === curr.query),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(({table, query}) => {
            table.filterGlobal(query, 'contains');
        });
    }

    cargarMonedas(): void {
        this.catalogosGenService.getElementos('MONEDAS').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                const options = (data || []).map(m => ({
                    label: m.nbCatalogoElemento || (m as any).nbMoneda,
                    value: m.idCatalogoElemento || (m as any).idCatalogoElemento,
                    clave: m.clCatalogoElemento || (m as any).clMoneda
                }));

                this.monedaOptions.set(options);
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las monedas.' })
        });
    }

    getMonedaLabel(idMoneda: number): string {
        const option = this.monedaOptions().find(m => m.value === idMoneda);

        return option ? (option.clave || option.label || idMoneda.toString()) : idMoneda.toString();
    }

    cargarClientes(): void {
        this.loading.set(true);

        this.clientesService.getClientes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                this.clientes.set(data);
                this.loading.set(false);
            },
            error: (err: HttpErrorResponse) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error de carga', detail: this.getErrorMessage(err, 'No se pudieron cargar los clientes.'), life: 5000 });
            }
        });
    }

    onGlobalFilter(table: Table, event: Event): void {
        this.searchSubject.next({ table, query: (event.target as HTMLInputElement).value });
    }

    abrirNuevo(): void {
        this.form = this.emptyForm();
        this.selectedId = null;
        this.editMode = false;
        this.submitted.set(false);
        this.dialogVisible = true;
    }

    abrirEditar(cliente: ClienteAdmin): void {
        this.selectedId = cliente.id || (cliente as any).idCliente;
        this.editMode = true;
        this.form = {
            nbComercial: cliente.nbComercial || '',
            clTipoCliente: cliente.clTipoCliente || 'Distribuidor',
            idElemMoneda: cliente.idElemMoneda || 0,
            dsCanalVenta: cliente.dsCanalVenta || '',
            mnLimiteCredito: cliente.mnLimiteCredito || 0,
            clEstatusCliente: cliente.clEstatusCliente || 'ACTIVO'
        };
        this.submitted.set(false);
        this.dialogVisible = true;
    }

    guardarCliente(): void {
        this.submitted.set(true);

        if (!this.form.nbComercial.trim() || !this.form.clTipoCliente.trim() || !this.form.dsCanalVenta.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'Completa los campos obligatorios.', life: 4000 });


            return;
        }

        if (!this.form.idElemMoneda) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'Debes indicar el ID de moneda.', life: 4000 });


            return;
        }

        this.saving.set(true);

        const payload: ActualizarClienteAdminRequest = {
            nbComercial: this.form.nbComercial.trim(),
            clTipoCliente: this.form.clTipoCliente.trim(),
            idElemMoneda: Number(this.form.idElemMoneda),
            dsCanalVenta: this.form.dsCanalVenta.trim(),
            mnLimiteCredito: Number(this.form.mnLimiteCredito ?? 0),
            clEstatusCliente: this.form.clEstatusCliente ? this.form.clEstatusCliente.trim().toUpperCase() : 'ACTIVO'
        };

        const request$ = this.editMode && this.selectedId ? this.clientesService.actualizarCliente(this.selectedId, payload) : this.clientesService.crearCliente(payload);

        request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (cliente) => {
                this.saving.set(false);
                this.dialogVisible = false;
                this.cargarClientes();
                this.messageService.add({ severity: 'success', summary: this.editMode ? 'Cliente actualizado' : 'Cliente creado', detail: `${cliente.nbComercial} se guardó correctamente.`, life: 4000 });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: this.getErrorMessage(err, 'No se pudo guardar el cliente.'), life: 5000 });
            }
        });
    }

    confirmarEliminar(cliente: ClienteAdmin): void {
        this.confirmationService.confirm({
            message: `¿Deseas eliminar al cliente <b>${cliente.nbComercial}</b>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.clientesService.eliminarCliente(cliente.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.cargarClientes();
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'El cliente fue eliminado correctamente.', life: 3000 });
                    },
                    error: (err: HttpErrorResponse) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: this.getErrorMessage(err, 'No se pudo eliminar el cliente.'), life: 5000 });
                    }
                });
            }
        });
    }

    private emptyForm(): ClienteForm {
        return {
            nbComercial: '',
            clTipoCliente: 'Distribuidor',
            idElemMoneda: 0,
            dsCanalVenta: '',
            mnLimiteCredito: 0,
            clEstatusCliente: 'ACTIVO'
        };
    }

    private getErrorMessage(err: HttpErrorResponse, fallback: string): string {
        const detail = err.error as { detail?: string; message?: string; title?: string } | null;

        if (err.status === 0) {
            return 'No se pudo conectar con el backend.';
        }

        if (err.status === 401) {
            return 'Tu sesión expiró. Vuelve a iniciar sesión.';
        }

        if (err.status === 403) {
            return 'No tienes permisos para realizar esta acción.';
        }

        return detail?.detail || detail?.message || detail?.title || fallback;
    }
}


