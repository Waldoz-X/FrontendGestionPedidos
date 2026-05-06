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
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { ActualizarEmpleadoRequest, CrearEmpleadoRequest, Empleado } from '../service/empleados-api.types';
import { EmpleadosService } from '../service/empleados.service';
import { CatalogosMaestrosService } from '../service/catalogos-maestros.service';
import { Area } from '../service/catalogos-maestros-api.types';

@Component({
    selector: 'p-empleados',
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
        ConfirmDialogModule,
        IconFieldModule,
        InputIconModule,
        TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog [style]="{ width: '450px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Empleados</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Gestión de empleados del sistema.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nuevo" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirNuevo()" />
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="cargarEmpleados()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <p-table
                #dt
                [value]="empleados()"
                dataKey="idEmpleado"
                [loading]="loading()"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="[10, 20, 50]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} empleados"
                [showCurrentPageReport]="true"
                [globalFilterFields]="['numeroEmpleado', 'nombres', 'apellidos', 'area', 'email']"
                [tableStyle]="{ 'min-width': '70rem' }"
                [rowHover]="true"
            >
                <ng-template #caption>
                    <div class="flex items-center justify-between">
                        <span></span>
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search" />
                            <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar..." />
                        </p-iconfield>
                    </div>
                </ng-template>
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="numeroEmpleado" style="min-width: 10rem">No. Empleado <p-sortIcon field="numeroEmpleado" /></th>
                        <th pSortableColumn="nombres" style="min-width: 12rem">Nombres <p-sortIcon field="nombres" /></th>
                        <th pSortableColumn="apellidos" style="min-width: 12rem">Apellidos <p-sortIcon field="apellidos" /></th>
                        <th pSortableColumn="area" style="min-width: 10rem">Área <p-sortIcon field="area" /></th>
                        <th style="min-width: 14rem">Email</th>
                        <th pSortableColumn="activo" style="min-width: 8rem">Estado <p-sortIcon field="activo" /></th>
                        <th style="min-width: 10rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-empleado>
                    <tr>
                        <td class="font-mono">{{ empleado.numeroEmpleado }}</td>
                        <td>{{ empleado.nombres }}</td>
                        <td>{{ empleado.apellidos }}</td>
                        <td>{{ empleado.area }}</td>
                        <td>{{ empleado.email || 'Sin usuario' }}</td>
                        <td>
                            <p-tag [value]="empleado.activo ? 'Activo' : 'Inactivo'" [severity]="empleado.activo ? 'success' : 'danger'" />
                        </td>
                        <td>
                            <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (onClick)="editarEmpleado(empleado)" pTooltip="Editar" />
                            @if (empleado.activo) {
                                <p-button icon="pi pi-ban" severity="danger" [rounded]="true" [outlined]="true" (onClick)="confirmarDesactivar(empleado)" pTooltip="Desactivar" />
                            } @else {
                                <p-button icon="pi pi-check-circle" severity="success" [rounded]="true" [outlined]="true" (onClick)="confirmarActivar(empleado)" pTooltip="Reactivar" />
                            }
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="7">No hay empleados para mostrar.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO CREAR ═══ -->
        <p-dialog
            [(visible)]="crearDialogVisible"
            [style]="{ width: '500px' }"
            header="Nuevo Empleado"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="create_numeroEmpleado" class="block font-bold mb-3">No. Empleado</label>
                        <input type="text" pInputText id="create_numeroEmpleado" [(ngModel)]="nuevoEmpleado.numeroEmpleado" required fluid />
                        @if (submitted() && !nuevoEmpleado.numeroEmpleado) {
                            <small class="text-red-500">El número de empleado es requerido.</small>
                        }
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="create_nombres" class="block font-bold mb-3">Nombres</label>
                            <input type="text" pInputText id="create_nombres" [(ngModel)]="nuevoEmpleado.nombres" required fluid />
                            @if (submitted() && !nuevoEmpleado.nombres) {
                                <small class="text-red-500">Requerido.</small>
                            }
                        </div>
                        <div class="col-span-6">
                            <label for="create_apellidos" class="block font-bold mb-3">Apellidos</label>
                            <input type="text" pInputText id="create_apellidos" [(ngModel)]="nuevoEmpleado.apellidos" required fluid />
                            @if (submitted() && !nuevoEmpleado.apellidos) {
                                <small class="text-red-500">Requerido.</small>
                            }
                        </div>
                    </div>
                    <div>
                        <label for="create_area" class="block font-bold mb-3">Área</label>
                        <p-select
                            id="create_area"
                            [(ngModel)]="nuevoEmpleado.area"
                            [options]="areas()"
                            optionLabel="nombre"
                            optionValue="nombre"
                            placeholder="Selecciona una área"
                            fluid
                        />
                        @if (submitted() && !nuevoEmpleado.area) {
                            <small class="text-red-500">El área es requerida.</small>
                        }
                    </div>
                    <div>
                        <label for="create_activo" class="block font-bold mb-3">Estado</label>
                        <p-select
                            inputId="create_activo"
                            [(ngModel)]="nuevoEmpleado.activo"
                            [options]="activoOptions"
                            optionLabel="label"
                            optionValue="value"
                            fluid
                        />
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="crearDialogVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarNuevo()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <!-- ═══ DIALOGO EDITAR ═══ -->
        <p-dialog
            [(visible)]="editarDialogVisible"
            [style]="{ width: '500px' }"
            header="Editar Empleado"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label class="block font-bold mb-3">No. Empleado</label>
                        <span class="font-mono text-lg">{{ empleadoEditando.numeroEmpleado }}</span>
                    </div>
                    <div>
                        <label class="block font-bold mb-3">Email</label>
                        <span>{{ empleadoEditando.email || 'Sin usuario' }}</span>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="edit_nombres" class="block font-bold mb-3">Nombres</label>
                            <input type="text" pInputText id="edit_nombres" [(ngModel)]="datosEditar.nombres" required fluid />
                            @if (submittedEditar() && !datosEditar.nombres) {
                                <small class="text-red-500">Requerido.</small>
                            }
                        </div>
                        <div class="col-span-6">
                            <label for="edit_apellidos" class="block font-bold mb-3">Apellidos</label>
                            <input type="text" pInputText id="edit_apellidos" [(ngModel)]="datosEditar.apellidos" required fluid />
                            @if (submittedEditar() && !datosEditar.apellidos) {
                                <small class="text-red-500">Requerido.</small>
                            }
                        </div>
                    </div>
                    <div>
                        <label for="edit_area" class="block font-bold mb-3">Área</label>
                        <p-select
                            id="edit_area"
                            [(ngModel)]="datosEditar.area"
                            [options]="areas()"
                            optionLabel="nombre"
                            optionValue="nombre"
                            placeholder="Selecciona una área"
                            fluid
                        />
                        @if (submittedEditar() && !datosEditar.area) {
                            <small class="text-red-500">Requerido.</small>
                        }
                    </div>
                    <div>
                        <label for="edit_activo" class="block font-bold mb-3">Estado</label>
                        <p-select
                            inputId="edit_activo"
                            [(ngModel)]="datosEditar.activo"
                            [options]="activoOptions"
                            optionLabel="label"
                            optionValue="value"
                            fluid
                        />
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="editarDialogVisible = false" />
                <p-button label="Guardar cambios" icon="pi pi-check" (onClick)="guardarEdicion()" [loading]="saving()" />
            </ng-template>
        </p-dialog>
    `
})
export class Empleados implements OnInit {
    private readonly empleadosService = inject(EmpleadosService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly catalogosService = inject(CatalogosMaestrosService);
    private readonly destroyRef = inject(DestroyRef);

    // ─── State ───
    empleados = signal<Empleado[]>([]);
    areas = signal<Area[]>([]);
    loading = signal<boolean>(false);
    saving = signal<boolean>(false);

    // ─── Crear ───
    crearDialogVisible = false;
    submitted = signal<boolean>(false);
    nuevoEmpleado: CrearEmpleadoRequest = this.emptyNuevo();

    // ─── Editar ───
    editarDialogVisible = false;
    submittedEditar = signal<boolean>(false);
    empleadoEditando: Empleado = this.emptyEmpleado();
    datosEditar: ActualizarEmpleadoRequest = { nombres: '', apellidos: '', area: '', activo: true };

    // ─── Options ───
    activoOptions = [
        { label: 'Activo', value: true },
        { label: 'Inactivo', value: false }
    ];

    ngOnInit(): void {
        this.cargarCatalogos();
        this.cargarEmpleados();
    }

    cargarCatalogos(): void {
        this.catalogosService.getAreas(true).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (data) => this.areas.set(data),
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las áreas.' })
        });
    }

    // ═══ LISTADO ═══

    cargarEmpleados(): void {
        this.loading.set(true);

        this.empleadosService.getEmpleados().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (response) => {
                this.empleados.set(response);
                this.loading.set(false);
            },
            error: (error: HttpErrorResponse) => {
                this.loading.set(false);

                let detail: string;

                if (error.status === 0) {
                    detail = 'No se pudo conectar con el backend. Verifica que esté ejecutándose.';
                } else if (error.status === 401) {
                    detail = 'Sesión expirada o token inválido. Inicia sesión nuevamente.';
                } else {
                    detail = `Error al cargar empleados (${error.status}).`;
                }

                this.messageService.add({ severity: 'error', summary: 'Error de carga', detail, life: 5000 });
            }
        });
    }

    onGlobalFilter(table: Table, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    // ═══ CREAR ═══

    abrirNuevo(): void {
        this.nuevoEmpleado = this.emptyNuevo();
        this.submitted.set(false);
        this.crearDialogVisible = true;
    }

    guardarNuevo(): void {
        this.submitted.set(true);

        if (!this.nuevoEmpleado.numeroEmpleado?.trim() || !this.nuevoEmpleado.nombres?.trim() || !this.nuevoEmpleado.apellidos?.trim() || !this.nuevoEmpleado.area?.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulario incompleto',
                detail: 'Completa todos los campos obligatorios.',
                life: 4000
            });

            return;
        }

        this.saving.set(true);

        this.empleadosService.crearEmpleado(this.nuevoEmpleado).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (emp) => {
                this.saving.set(false);
                this.crearDialogVisible = false;
                this.cargarEmpleados();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Empleado creado',
                    detail: `${emp.nombres} ${emp.apellidos} fue registrado correctamente.`,
                    life: 4000
                });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);
                const detail = err.error?.detail || err.error?.title || 'No se pudo crear el empleado.';

                this.messageService.add({ severity: 'error', summary: 'Error al crear', detail, life: 5000 });
            }
        });
    }

    // ═══ EDITAR ═══

    editarEmpleado(emp: Empleado): void {
        this.empleadoEditando = { ...emp };
        this.datosEditar = {
            nombres: emp.nombres,
            apellidos: emp.apellidos,
            area: emp.area,
            activo: emp.activo
        };
        this.submittedEditar.set(false);
        this.editarDialogVisible = true;
    }

    guardarEdicion(): void {
        this.submittedEditar.set(true);

        if (!this.datosEditar.nombres?.trim() || !this.datosEditar.apellidos?.trim() || !this.datosEditar.area?.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulario incompleto',
                detail: 'Los campos Nombres, Apellidos y Área son obligatorios.',
                life: 4000
            });

            return;
        }

        this.saving.set(true);

        this.empleadosService.actualizarEmpleado(this.empleadoEditando.idEmpleado, this.datosEditar).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (emp) => {
                this.saving.set(false);
                this.editarDialogVisible = false;
                this.cargarEmpleados();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Empleado actualizado',
                    detail: `${emp.nombres} ${emp.apellidos} fue actualizado correctamente.`,
                    life: 4000
                });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);
                const detail = err.error?.detail || err.error?.title || 'No se pudo actualizar el empleado.';

                this.messageService.add({ severity: 'error', summary: 'Error al actualizar', detail, life: 5000 });
            }
        });
    }

    // ═══ DESACTIVAR / ACTIVAR (eliminación lógica) ═══

    confirmarDesactivar(emp: Empleado): void {
        this.confirmationService.confirm({
            message: `¿Estás seguro de desactivar a ${emp.nombres} ${emp.apellidos}?`,
            header: 'Confirmar desactivación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, desactivar',
            rejectLabel: 'No',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.empleadosService.actualizarEmpleado(emp.idEmpleado, {
                    nombres: emp.nombres,
                    apellidos: emp.apellidos,
                    area: emp.area,
                    activo: false
                }).pipe(
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe({
                    next: () => {
                        this.cargarEmpleados();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Empleado desactivado',
                            detail: `${emp.nombres} ${emp.apellidos} fue desactivado.`,
                            life: 4000
                        });
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo desactivar al empleado.',
                            life: 5000
                        });
                    }
                });
            }
        });
    }

    confirmarActivar(emp: Empleado): void {
        this.confirmationService.confirm({
            message: `¿Reactivar a ${emp.nombres} ${emp.apellidos}?`,
            header: 'Confirmar reactivación',
            icon: 'pi pi-check-circle',
            acceptLabel: 'Sí, reactivar',
            rejectLabel: 'No',
            accept: () => {
                this.empleadosService.actualizarEmpleado(emp.idEmpleado, {
                    nombres: emp.nombres,
                    apellidos: emp.apellidos,
                    area: emp.area,
                    activo: true
                }).pipe(
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe({
                    next: () => {
                        this.cargarEmpleados();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Empleado reactivado',
                            detail: `${emp.nombres} ${emp.apellidos} fue reactivado.`,
                            life: 4000
                        });
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo reactivar al empleado.',
                            life: 5000
                        });
                    }
                });
            }
        });
    }

    // ═══ HELPERS ═══

    private emptyNuevo(): CrearEmpleadoRequest {
        return { numeroEmpleado: '', nombres: '', apellidos: '', area: '', activo: true };
    }

    private emptyEmpleado(): Empleado {
        return { idEmpleado: '', idUsuario: null, numeroEmpleado: '', nombres: '', apellidos: '', area: '', activo: true, email: null };
    }
}
