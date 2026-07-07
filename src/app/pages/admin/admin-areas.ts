
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
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { CatalogosMaestrosService } from '../service/catalogos-maestros.service';
import { Area, CrearAreaRequest } from '../service/catalogos-maestros-api.types';

@Component({
    selector: 'p-admin-areas',
    standalone: true,
    imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
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
                        <div class="font-semibold text-xl">Áreas</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Catálogo maestro de áreas operativas.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nueva" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirNuevo()" />
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="cargarAreas()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <!-- ═══ TABLA ═══ -->
            <p-table
                #dt
                [value]="areas()"
                dataKey="id"
                [loading]="loading()"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="[10, 20, 50]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} áreas"
                [showCurrentPageReport]="true"
                [globalFilterFields]="['nombre']"
                [tableStyle]="{ 'min-width': '40rem' }"
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
                        <th pSortableColumn="nombre" style="min-width: 16rem">Nombre <p-sortIcon field="nombre" /></th>
                        <th pSortableColumn="activo" style="min-width: 8rem">Estado <p-sortIcon field="activo" /></th>
                        <th style="min-width: 8rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-area>
                    <tr>
                        <td class="font-medium">{{ area.nombre }}</td>
                        <td><p-tag [value]="area.activo ? 'Activo' : 'Inactivo'" [severity]="area.activo ? 'success' : 'danger'" /></td>
                        <td>
                            <div class="flex gap-2">
                                <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editarArea(area)" pTooltip="Editar" />
                                <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="eliminarArea(area)" pTooltip="Eliminar" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #empty>
                    <tr>
                        <td colspan="3">No hay áreas registradas.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO CRUD ═══ -->
        <p-dialog [(visible)]="dialogVisible" [style]="{ width: '450px' }" [header]="editMode ? 'Editar Área' : 'Nueva Área'" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="nombre" class="block font-bold mb-3">Nombre</label>
                        <input type="text" pInputText id="nombre" [(ngModel)]="formData.nombre" required autofocus fluid placeholder="Ej: Ventas" />
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
export class AdminAreasComponent implements OnInit {
    private readonly catalogosService = inject(CatalogosMaestrosService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly destroyRef = inject(DestroyRef);

    // ─── State ───
    areas = signal<Area[]>([]);
    loading = signal(false);
    saving = signal(false);
    submitted = signal(false);

    // ─── Dialog ───
    dialogVisible = false;
    editMode = false;
    selectedId: number | null = null;
    formData: CrearAreaRequest = this.emptyForm();

    ngOnInit(): void {
        this.cargarAreas();
    }

    // ═══ LISTA ═══

    cargarAreas(): void {
        this.loading.set(true);
        this.catalogosService.getAreas().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (data) => {
                this.areas.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error de carga', detail: 'No se pudieron cargar las áreas.', life: 5000 });
            }
        });
    }

    onGlobalFilter(table: Table, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    // ═══ CREAR ═══

    abrirNuevo(): void {
        this.formData = this.emptyForm();
        this.editMode = false;
        this.selectedId = null;
        this.submitted.set(false);
        this.dialogVisible = true;
    }

    // ═══ EDITAR ═══

    editarArea(area: Area): void {
        this.formData = { nombre: area.nombre, activo: area.activo };
        this.editMode = true;
        this.selectedId = area.id;
        this.submitted.set(false);
        this.dialogVisible = true;
    }

    // ═══ GUARDAR ═══

    guardar(): void {
        this.submitted.set(true);

        if (!this.formData.nombre?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'El nombre es obligatorio.', life: 4000 });

            return;
        }

        this.saving.set(true);

        const request$ = this.editMode
            ? this.catalogosService.actualizarArea(this.selectedId!, this.formData)
            : this.catalogosService.crearArea(this.formData);

        request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (area) => {
                this.saving.set(false);
                this.dialogVisible = false;
                this.cargarAreas();
                this.messageService.add({
                    severity: 'success',
                    summary: this.editMode ? 'Área actualizada' : 'Área creada',
                    detail: `${area.nombre} fue guardada correctamente.`,
                    life: 4000
                });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);

                const detail = err.error?.detail || err.error?.title || 'No se pudo guardar el área.';

                this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
            }
        });
    }

    // ═══ ELIMINAR ═══

    eliminarArea(area: Area): void {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el área <b>${area.nombre}</b>?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.catalogosService.eliminarArea(area.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.cargarAreas();
                        this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'El área fue eliminada correctamente.', life: 3000 });
                    },
                    error: (err: HttpErrorResponse) => {
                        this.saving.set(false);

                        const detail = err.error?.detail || err.error?.title || 'No se pudo eliminar el área porque podría estar en uso.';

                        this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
                    }
                });
            }
        });
    }

    // ═══ HELPERS ═══

    private emptyForm(): CrearAreaRequest {
        return { nombre: '', activo: true };
    }
}
