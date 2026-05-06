import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { CatalogosMaestrosService } from '../service/catalogos-maestros.service';
import { CrearEstadoRequest, Estado, Pais } from '../service/catalogos-maestros-api.types';

@Component({
    selector: 'p-admin-estados',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        TagModule,
        ToastModule,
        ToolbarModule,
        DialogModule,
        IconFieldModule,
        InputIconModule,
        TooltipModule,
        CheckboxModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog [style]="{ width: '450px' }" />

        <div class="card">
            <!-- ═══ TOOLBAR ═══ -->
            <p-toolbar class="mb-6">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Estados</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Catálogo maestro de estados vinculados a un país.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nuevo" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirNuevo()" />
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="cargarEstados()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <!-- ═══ TABLA ═══ -->
            <p-table
                #dt
                [value]="estados()"
                dataKey="id"
                [loading]="loading()"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="[10, 20, 50]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} estados"
                [showCurrentPageReport]="true"
                [globalFilterFields]="['nombre', 'nombrePais']"
                [tableStyle]="{ 'min-width': '50rem' }"
                [rowHover]="true"
            >
                <ng-template #caption>
                    <div class="flex items-center justify-between">
                        <span></span>
                        <p-iconfield>
                            <p-inputicon class="pi pi-search" />
                            <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar..." />
                        </p-iconfield>
                    </div>
                </ng-template>
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="nombrePais" style="min-width: 16rem">País <p-sortIcon field="nombrePais" /></th>
                        <th pSortableColumn="nombre" style="min-width: 16rem">Nombre <p-sortIcon field="nombre" /></th>
                        <th pSortableColumn="activo" style="min-width: 8rem">Estado <p-sortIcon field="activo" /></th>
                        <th style="min-width: 8rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-estado>
                    <tr>
                        <td>{{ estado.nombrePais }}</td>
                        <td class="font-medium">{{ estado.nombre }}</td>
                        <td><p-tag [value]="estado.activo ? 'Activo' : 'Inactivo'" [severity]="estado.activo ? 'success' : 'danger'" /></td>
                        <td>
                            <div class="flex gap-2">
                                <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editarEstado(estado)" pTooltip="Editar" />
                                <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="eliminarEstado(estado)" pTooltip="Eliminar" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #empty>
                    <tr>
                        <td colspan="4">No hay estados registrados.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO CRUD ═══ -->
        <p-dialog [(visible)]="dialogVisible" [style]="{ width: '450px' }" [header]="editMode ? 'Editar Estado' : 'Nuevo Estado'" [modal]="true" appendTo="body">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="idPais" class="block font-bold mb-3">País</label>
                        <p-select
                            inputId="idPais"
                            [options]="paises()"
                            [(ngModel)]="formData.idPais"
                            optionLabel="nombre"
                            optionValue="id"
                            placeholder="Selecciona un país"
                            [filter]="true"
                            filterBy="nombre"
                            fluid
                            appendTo="body" />
                        @if (submitted() && !formData.idPais) {
                            <small class="text-red-500">El país es requerido.</small>
                        }
                    </div>
                    <div>
                        <label for="nombre" class="block font-bold mb-3">Nombre</label>
                        <input type="text" pInputText id="nombre" [(ngModel)]="formData.nombre" required autofocus fluid placeholder="Ej: Nuevo León" />
                        @if (submitted() && !formData.nombre) {
                            <small class="text-red-500">El nombre es requerido.</small>
                        }
                    </div>
                    <div class="flex items-center gap-2">
                        <p-checkbox inputId="activo" [(ngModel)]="formData.activo" [binary]="true" />
                        <label for="activo">Activo</label>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="dialogVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardar()" [loading]="saving()" />
            </ng-template>
        </p-dialog>
    `
})
export class AdminEstadosComponent implements OnInit {
    private readonly catalogosService = inject(CatalogosMaestrosService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly destroyRef = inject(DestroyRef);

    // ─── State ───
    estados = signal<(Estado & { nombrePais?: string })[]>([]);
    paises = signal<Pais[]>([]);
    loading = signal(false);
    saving = signal(false);
    submitted = signal(false);

    // ─── Dialog ───
    dialogVisible = false;
    editMode = false;
    selectedId: number | null = null;
    formData: CrearEstadoRequest = this.emptyForm();

    ngOnInit(): void {
        this.cargarPaisesYEstados();
    }

    // ═══ LISTA ═══

    cargarPaisesYEstados(): void {
        this.loading.set(true);
        // Primero cargamos los países para poder mostrar el nombre del país en la tabla
        this.catalogosService.getPaises(true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (dataPaises) => {
                this.paises.set(dataPaises);
                this.cargarEstados();
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los países.', life: 5000 });
            }
        });
    }

    cargarEstados(): void {
        this.loading.set(true);
        this.catalogosService
            .getEstados()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    // Mapeamos para agregar el nombre del pais y que el filtro global funcione mejor
                    const estadosConPais = data.map((estado) => {
                        const pais = this.paises().find((p) => p.id === estado.idPais);

                        return { ...estado, nombrePais: pais ? pais.nombre : 'Desconocido' };
                    });

                    this.estados.set(estadosConPais);
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                    this.messageService.add({ severity: 'error', summary: 'Error de carga', detail: 'No se pudieron cargar los estados.', life: 5000 });
                }
            });
    }

    onGlobalFilter(table: Table, event: Event): void {
        const input = event.target as HTMLInputElement | null;

        table.filterGlobal(input?.value ?? '', 'contains');
    }

    // ═══ CREAR ═══

    abrirNuevo(): void {
        this.formData = this.emptyForm();

        if (this.paises().length > 0) {
            this.formData.idPais = this.paises()[0].id;
        }

        this.editMode = false;
        this.selectedId = null;
        this.submitted.set(false);
        this.dialogVisible = true;
    }

    // ═══ EDITAR ═══

    editarEstado(estado: Estado): void {
        this.formData = { idPais: estado.idPais, nombre: estado.nombre, activo: estado.activo };
        this.editMode = true;
        this.selectedId = estado.id;
        this.submitted.set(false);
        this.dialogVisible = true;
    }

    // ═══ GUARDAR ═══

    guardar(): void {
        this.submitted.set(true);

        if (!this.formData.nombre?.trim() || !this.formData.idPais) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'País y nombre son obligatorios.', life: 4000 });

            return;
        }

        this.saving.set(true);

        const request$ = this.editMode
            ? this.catalogosService.actualizarEstado(this.selectedId!, this.formData)
            : this.catalogosService.crearEstado(this.formData);

        request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (estado) => {
                this.saving.set(false);
                this.dialogVisible = false;
                this.cargarEstados();
                this.messageService.add({
                    severity: 'success',
                    summary: this.editMode ? 'Estado actualizado' : 'Estado creado',
                    detail: `${estado.nombre} fue guardado correctamente.`,
                    life: 4000
                });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);

                const detail = err.error?.detail || err.error?.title || 'No se pudo guardar el estado.';

                this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
            }
        });
    }

    // ═══ ELIMINAR ═══

    eliminarEstado(estado: Estado): void {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el estado <b>${estado.nombre}</b>?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.catalogosService.eliminarEstado(estado.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.cargarEstados();
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'El estado fue eliminado correctamente.', life: 3000 });
                    },
                    error: (err: HttpErrorResponse) => {
                        const detail = err.error?.detail || err.error?.title || 'No se pudo eliminar el estado porque podría estar en uso.';

                        this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
                    }
                });
            }
        });
    }

    // ═══ HELPERS ═══

    private emptyForm(): CrearEstadoRequest {
        return { idPais: 0, nombre: '', activo: true };
    }
}
