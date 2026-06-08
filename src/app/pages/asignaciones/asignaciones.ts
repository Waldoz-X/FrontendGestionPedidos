import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { Empleado } from '../service/empleados/empleados-api.types';
import { EmpleadosApiService } from '../service/empleados/empleados-api.service';
import { AsignacionClienteEmpleado, Cliente, CrearAsignacionClienteEmpleadoRequest } from '../service/clientes/clientes-api.types';
import { ClientesApiService } from '../service/clientes/clientes-api.service';
import { AsignacionesApiService } from '../service/clientes/asignaciones-api.service';

@Component({
    selector: 'p-asignaciones',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        CheckboxModule,
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
            <!-- ═══ TOOLBAR ═══ -->
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Asignaciones Cliente — Empleado</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Consulta y gestión de asignaciones.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nueva" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirCrear()" />
                </ng-template>
            </p-toolbar>

            <!-- ═══ FILTROS ═══ -->
            <div class="grid grid-cols-12 gap-4 mb-6">
                <div class="col-span-12 md:col-span-4">
                    <label class="block mb-2 font-medium">Consultar por empleado</label>
                    <p-select
                        [(ngModel)]="filtroEmpleadoId"
                        [ngModelOptions]="{ standalone: true }"
                        [options]="empleadoOptions()"
                        optionLabel="label"
                        optionValue="value"
                        [filter]="true"
                        filterBy="label"
                        placeholder="Seleccionar empleado..."
                        [showClear]="true"
                        class="w-full"
                        (onChange)="onFiltroEmpleadoChange()"
                    />
                </div>
                <div class="col-span-12 md:col-span-4">
                    <label class="block mb-2 font-medium">Consultar por cliente</label>
                    <p-select
                        [(ngModel)]="filtroClienteId"
                        [ngModelOptions]="{ standalone: true }"
                        [options]="clienteOptions()"
                        optionLabel="label"
                        optionValue="value"
                        [filter]="true"
                        filterBy="label"
                        placeholder="Seleccionar cliente..."
                        [showClear]="true"
                        class="w-full"
                        (onChange)="onFiltroClienteChange()"
                    />
                </div>
                <div class="col-span-12 md:col-span-3">
                    <label class="block mb-2 font-medium">Estado</label>
                    <p-select
                        [(ngModel)]="filtroActivo"
                        [ngModelOptions]="{ standalone: true }"
                        [options]="estadoOptions"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                        (onChange)="recargarConFiltros()"
                    />
                </div>
                <div class="col-span-12 md:col-span-1 flex items-end">
                    <p-button icon="pi pi-search" severity="secondary" [outlined]="true" (onClick)="recargarConFiltros()" pTooltip="Buscar" class="w-full" />
                </div>
            </div>

            <!-- ═══ TABLA ═══ -->
            <p-table
                [value]="asignaciones()"
                dataKey="idEmpleado"
                [loading]="loading()"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="[10, 20, 50]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} asignaciones"
                [showCurrentPageReport]="true"
                [tableStyle]="{ 'min-width': '65rem' }"
                [rowHover]="true"
            >
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="numeroEmpleado" style="min-width: 10rem">No. Empleado <p-sortIcon field="numeroEmpleado" /></th>
                        <th pSortableColumn="clEmpleado" style="min-width: 10rem">Clave <p-sortIcon field="clEmpleado" /></th>
                        <th pSortableColumn="nombreEmpleado" style="min-width: 14rem">Empleado <p-sortIcon field="nombreEmpleado" /></th>
                        <th pSortableColumn="nombreComercialCliente" style="min-width: 14rem">Cliente <p-sortIcon field="nombreComercialCliente" /></th>
                        <th pSortableColumn="clTipoRelacion" style="min-width: 10rem">Tipo relación <p-sortIcon field="clTipoRelacion" /></th>
                        <th pSortableColumn="clEstatusAsignacion" style="min-width: 8rem">Estado <p-sortIcon field="clEstatusAsignacion" /></th>
                        <th style="min-width: 10rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-item>
                    <tr>
                        <td class="font-mono">{{ item.nuEmpleado || item.numeroEmpleado || '-' }}</td>
                        <td><p-tag [value]="item.clEmpleado || 'N/A'" severity="secondary" /></td>
                        <td>{{ item.nombreEmpleado || (item.nbEmpleado ? item.nbEmpleado + ' ' + (item.nbApellidos || '') : '') }}</td>
                        <td class="font-medium">{{ item.nombreComercialCliente || item.nbComercial }}</td>
                        <td>{{ item.clTipoRelacion }}</td>
                        <td>
                            <p-tag [value]="item.clEstatusAsignacion === 'ACTIVO' ? 'Activo' : 'Inactivo'" [severity]="item.clEstatusAsignacion === 'ACTIVO' ? 'success' : 'danger'" />
                        </td>
                        <td>
                            <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (onClick)="abrirEditar(item)" pTooltip="Editar" />
                            <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="confirmarEliminar(item)" pTooltip="Eliminar" />
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="6" class="text-center text-surface-500">
                            No se encontraron asignaciones.
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO CREAR ═══ -->
        <p-dialog [(visible)]="crearDialogVisible" [style]="{ width: '500px' }" header="Nueva Asignación" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="crear_empleado" class="block font-bold mb-3">Empleado</label>
                        <p-select
                            inputId="crear_empleado"
                            [(ngModel)]="nuevaAsignacion.idEmpleado"
                            [options]="empleadoOptions()"
                            optionLabel="label"
                            optionValue="value"
                            [filter]="true"
                            filterBy="label"
                            placeholder="Seleccionar..."
                            appendTo="body"
                            fluid
                        />
                        @if (submitted() && !nuevaAsignacion.idEmpleado) {
                            <small class="text-red-500">Selecciona un empleado.</small>
                        }
                    </div>
                    <div>
                        <label for="crear_cliente" class="block font-bold mb-3">Cliente</label>
                        <p-select
                            inputId="crear_cliente"
                            [(ngModel)]="nuevaAsignacion.idCliente"
                            [options]="clienteOptions()"
                            optionLabel="label"
                            optionValue="value"
                            [filter]="true"
                            filterBy="label"
                            placeholder="Seleccionar..."
                            appendTo="body"
                            fluid
                        />
                        @if (submitted() && !nuevaAsignacion.idCliente) {
                            <small class="text-red-500">Selecciona un cliente.</small>
                        }
                        <label for="crear_tipo" class="block font-bold mb-3">Tipo de relación</label>
                        <p-select appendTo="body"
                            inputId="crear_tipo"
                            [(ngModel)]="nuevaAsignacion.clTipoRelacion"
                            [options]="tipoRelacionOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Seleccionar..."
                            fluid
                        />
                        @if (submitted() && !nuevaAsignacion.clTipoRelacion) {
                            <small class="text-red-500">Requerido.</small>
                        }
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="crearDialogVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarNueva()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <!-- ═══ DIALOGO EDITAR ═══ -->
        <p-dialog [(visible)]="editarDialogVisible" [style]="{ width: '500px' }" header="Editar Asignación" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label class="block font-bold mb-3">Empleado</label>
                        <span class="text-lg">{{ editandoNombreEmpleado }}</span>
                    </div>
                    <div>
                        <label class="block font-bold mb-3">Cliente</label>
                        <span class="text-lg">{{ editandoNombreCliente }}</span>
                    </div>
                    <div>
                        <label for="edit_tipo" class="block font-bold mb-3">Tipo de relación</label>
                        <p-select appendTo="body"
                            inputId="edit_tipo"
                            [(ngModel)]="datosEditar.clTipoRelacion"
                            [options]="tipoRelacionOptions"
                            optionLabel="label"
                            optionValue="value"
                            fluid
                        />
                        @if (submittedEditar() && !datosEditar.clTipoRelacion) {
                            <small class="text-red-500">Requerido.</small>
                        }
                    </div>
                    <div class="flex items-center gap-2">
                        <p-checkbox inputId="edit_activo" [(ngModel)]="datosEditar.activo" [binary]="true" />
                        <label for="edit_activo">Activo</label>
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
export class Asignaciones implements OnInit {
    private readonly clientesService = inject(ClientesApiService);
    private readonly asignacionesService = inject(AsignacionesApiService);
    private readonly empleadosService = inject(EmpleadosApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly destroyRef = inject(DestroyRef);

    // ─── State ───
    empleados = signal<Empleado[]>([]);
    clientes = signal<Cliente[]>([]);
    asignaciones = signal<AsignacionClienteEmpleado[]>([]);
    loading = signal<boolean>(false);
    saving = signal<boolean>(false);

    // ─── Filtros ───
    filtroEmpleadoId = '';
    filtroClienteId = '';
    filtroActivo = 'todos';

    estadoOptions = [
        { value: 'todos', label: 'Todos' },
        { value: 'activos', label: 'Solo activos' },
        { value: 'inactivos', label: 'Solo inactivos' }
    ];

    tipoRelacionOptions = [
        { label: 'Responsable', value: 'Responsable' },
        { label: 'Colaborador', value: 'Colaborador' }
    ];

    empleadoOptions = computed(() =>
        this.empleados().map((e) => ({ value: e.idEmpleado || (e as any).id, label: `${e.clEmpleado} — ${e.nbEmpleado} ${e.nbApellidos}` }))
    );

    clienteOptions = computed(() =>
        this.clientes().map((c) => ({ value: c.id || (c as any).idCliente, label: c.nombreComercial || (c as any).nbComercial || 'Cliente sin nombre' }))
    );

    // ─── Crear ───
    crearDialogVisible = false;
    submitted = signal<boolean>(false);
    nuevaAsignacion: CrearAsignacionClienteEmpleadoRequest = this.emptyAsignacion();

    // ─── Editar ───
    editarDialogVisible = false;
    submittedEditar = signal<boolean>(false);
    editandoIdEmpleado = '';
    editandoIdCliente = '';
    editandoNombreEmpleado = '';
    editandoNombreCliente = '';
    datosEditar = { clTipoRelacion: '', activo: true };

    ngOnInit(): void {
        this.cargarCatalogos();
    }

    // ═══════════════════════════════════════════
    // CARGA INICIAL
    // ═══════════════════════════════════════════

    cargarCatalogos(): void {
        this.empleadosService.getEmpleados().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => this.empleados.set(r.filter((e) => e.clEstatusEmpleado === 'ACTIVO')),
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los empleados.', life: 5000 })
        });

        this.clientesService.getClientes().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => {
                this.clientes.set(r);
                this.cargarTodas();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los clientes.', life: 5000 })
        });
    }

    // ═══════════════════════════════════════════
    // FILTROS Y CONSULTA
    // ═══════════════════════════════════════════

    onFiltroEmpleadoChange(): void {
        if (this.filtroEmpleadoId) {
            this.filtroClienteId = '';
            this.cargarPorEmpleado();
        } else {
            this.cargarTodas();
        }
    }

    onFiltroClienteChange(): void {
        if (this.filtroClienteId) {
            this.filtroEmpleadoId = '';
            this.cargarPorCliente();
        } else {
            this.cargarTodas();
        }
    }

    recargarConFiltros(): void {
        if (this.filtroEmpleadoId) {
            this.cargarPorEmpleado();
        } else if (this.filtroClienteId) {
            this.cargarPorCliente();
        } else {
            this.cargarTodas();
        }
    }

    cargarTodas(): void {
        this.loading.set(true);
        const activo = this.getActivoFilterValue();

        this.asignacionesService.getTodas().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (results) => {
                let list = results;
                if (activo !== undefined) {
                    const status = activo ? 'ACTIVO' : 'INACTIVO';
                    list = list.filter(a => a.clEstatusAsignacion === status);
                }
                this.asignaciones.set(list);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las asignaciones.', life: 5000 });
            }
        });
    }

    cargarPorEmpleado(): void {
        this.loading.set(true);
        this.asignacionesService.getAsignacionesPorEmpleado(this.filtroEmpleadoId, this.getActivoFilterValue()).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => { this.asignaciones.set(r); this.loading.set(false); },
            error: () => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las asignaciones.', life: 5000 });
            }
        });
    }

    cargarPorCliente(): void {
        this.loading.set(true);
        this.asignacionesService.getAsignacionesPorCliente(this.filtroClienteId, this.getActivoFilterValue()).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => { this.asignaciones.set(r); this.loading.set(false); },
            error: () => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las asignaciones.', life: 5000 });
            }
        });
    }

    // ═══════════════════════════════════════════
    // CREAR
    // ═══════════════════════════════════════════

    abrirCrear(): void {
        this.nuevaAsignacion = this.emptyAsignacion();
        this.submitted.set(false);
        this.crearDialogVisible = true;
    }

    guardarNueva(): void {
        this.submitted.set(true);

        if (!this.nuevaAsignacion.idEmpleado || !this.nuevaAsignacion.idCliente || !this.nuevaAsignacion.clTipoRelacion?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'Completa todos los campos obligatorios.', life: 4000 });

            return;
        }

        this.saving.set(true);

        this.asignacionesService.crearAsignacion(this.nuevaAsignacion).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.saving.set(false);
                this.crearDialogVisible = false;
                this.recargarConFiltros();
                this.messageService.add({ severity: 'success', summary: 'Asignación creada', detail: 'La asignación fue registrada correctamente.', life: 4000 });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);

                let detail = 'No se pudo crear la asignación.';

                if (err.status === 409) detail = 'Ya existe una asignación para este empleado y cliente.';

                if (err.status === 404) detail = 'No se encontró el empleado o cliente seleccionado.';

                this.messageService.add({ severity: 'error', summary: 'Error al crear', detail, life: 5000 });
            }
        });
    }

    // ═══════════════════════════════════════════
    // EDITAR
    // ═══════════════════════════════════════════

    abrirEditar(item: AsignacionClienteEmpleado): void {
        this.editandoIdEmpleado = item.idEmpleado;
        this.editandoIdCliente = item.idCliente;
        const nombreEmp = item.nombreEmpleado || (item.nbEmpleado ? item.nbEmpleado + ' ' + (item.nbApellidos || '') : '');
        this.editandoNombreEmpleado = `${item.nuEmpleado || item.numeroEmpleado || '-'} | ${item.clEmpleado || 'N/A'} — ${nombreEmp}`;
        this.editandoNombreCliente = item.nombreComercialCliente || item.nbComercial || 'Cliente sin nombre';
        this.datosEditar = { clTipoRelacion: item.clTipoRelacion, activo: item.clEstatusAsignacion === 'ACTIVO' };
        this.submittedEditar.set(false);
        this.editarDialogVisible = true;
    }

    guardarEdicion(): void {
        this.submittedEditar.set(true);

        if (!this.datosEditar.clTipoRelacion?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'El tipo de relación es obligatorio.', life: 4000 });

            return;
        }

        this.saving.set(true);

        this.asignacionesService.actualizarAsignacion(this.editandoIdEmpleado, this.editandoIdCliente, {
            clTipoRelacion: this.datosEditar.clTipoRelacion,
            clEstatusAsignacion: this.datosEditar.activo ? 'ACTIVO' : 'INACTIVO'
        }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.saving.set(false);
                this.editarDialogVisible = false;
                this.recargarConFiltros();
                this.messageService.add({ severity: 'success', summary: 'Asignación actualizada', detail: 'Los cambios fueron guardados correctamente.', life: 4000 });
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error al actualizar', detail: 'No se pudo actualizar la asignación.', life: 5000 });
            }
        });
    }

    // ═══════════════════════════════════════════
    // ELIMINAR
    // ═══════════════════════════════════════════

    confirmarEliminar(item: AsignacionClienteEmpleado): void {
        const nombreEmp = item.nombreEmpleado || (item.nbEmpleado ? item.nbEmpleado + ' ' + (item.nbApellidos || '') : '');
        const nombreCli = item.nombreComercialCliente || item.nbComercial || 'Cliente sin nombre';
        this.confirmationService.confirm({
            message: `¿Eliminar la asignación de ${nombreEmp} con ${nombreCli}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.asignacionesService.eliminarAsignacion(item.idEmpleado, item.idCliente).pipe(
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe({
                    next: () => {
                        this.recargarConFiltros();
                        this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: `La asignación de ${nombreEmp} fue eliminada.`, life: 4000 });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la asignación.', life: 5000 })
                });
            }
        });
    }

    // ═══════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════

    private emptyAsignacion(): CrearAsignacionClienteEmpleadoRequest {
        return { idEmpleado: '', idCliente: '', clTipoRelacion: 'Responsable' };
    }

    private getActivoFilterValue(): boolean | undefined {
        if (this.filtroActivo === 'activos') return true;

        if (this.filtroActivo === 'inactivos') return false;

        return undefined;
    }
}
