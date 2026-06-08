import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
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
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { ActualizarEmpleadoRequest, Empleado } from '../service/empleados/empleados-api.types';
import { EmpleadosApiService } from '../service/empleados/empleados-api.service';
import { UsuariosApiService } from '../service/usuarios/usuarios-api.service';
import { RegistrarUsuarioEmpleadoRequest } from '../service/usuarios/usuarios-api.types';
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
                [globalFilterFields]="['nuEmpleado', 'clEmpleado', 'nbEmpleado', 'nbApellidos', 'idElemArea', 'correo']"
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
                        <th pSortableColumn="nuEmpleado" style="min-width: 10rem">No. Empleado <p-sortIcon field="nuEmpleado" /></th>
                        <th pSortableColumn="clEmpleado" style="min-width: 10rem">Clave <p-sortIcon field="clEmpleado" /></th>
                        <th pSortableColumn="nbEmpleado" style="min-width: 12rem">Nombres <p-sortIcon field="nbEmpleado" /></th>
                        <th pSortableColumn="nbApellidos" style="min-width: 12rem">Apellidos <p-sortIcon field="nbApellidos" /></th>
                        <th pSortableColumn="idElemArea" style="min-width: 10rem">Área <p-sortIcon field="idElemArea" /></th>
                        <th pSortableColumn="correo" style="min-width: 14rem">Correo <p-sortIcon field="correo" /></th>
                        <th pSortableColumn="clEstatusEmpleado" style="min-width: 8rem">Estado <p-sortIcon field="clEstatusEmpleado" /></th>
                        <th style="min-width: 10rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-empleado>
                    <tr>
                        <td class="font-mono">{{ empleado.nuEmpleado || '-' }}</td>
                        <td><p-tag [value]="empleado.clEmpleado" severity="secondary" /></td>
                        <td>{{ empleado.nbEmpleado }}</td>
                        <td>{{ empleado.nbApellidos }}</td>
                        <td>{{ getAreaName(empleado.idElemArea) }}</td>
                        <td>{{ empleado.correo || 'Sin correo' }}</td>
                        <td>
                            <p-tag [value]="empleado.clEstatusEmpleado === 'ACTIVO' ? 'Activo' : 'Inactivo'" [severity]="empleado.clEstatusEmpleado === 'ACTIVO' ? 'success' : 'danger'" />
                        </td>
                        <td>
                            <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (onClick)="editarEmpleado(empleado)" pTooltip="Editar" />
                            @if (empleado.clEstatusEmpleado === 'ACTIVO') {
                                <p-button icon="pi pi-ban" severity="danger" [rounded]="true" [outlined]="true" (onClick)="confirmarDesactivar(empleado)" pTooltip="Desactivar" />
                            } @else {
                                <p-button icon="pi pi-check-circle" severity="success" [rounded]="true" [outlined]="true" (onClick)="confirmarActivar(empleado)" pTooltip="Reactivar" />
                            }
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="8">No hay empleados para mostrar.</td>
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
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="create_numeroEmpleado" class="block font-bold mb-3">No. Empleado</label>
                            <input type="text" pInputText id="create_numeroEmpleado" [(ngModel)]="nuevoUsuario.nuEmpleado" fluid />
                        </div>
                        <div class="col-span-6">
                            <label for="create_claveEmpleado" class="block font-bold mb-3">Clave Empleado</label>
                            <input type="text" pInputText id="create_claveEmpleado" [(ngModel)]="nuevoUsuario.clEmpleado" required fluid />
                            @if (submitted() && !nuevoUsuario.clEmpleado) {
                                <small class="text-red-500">La clave de empleado es requerida.</small>
                            }
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12">
                            <label for="create_email" class="block font-bold mb-3">Email</label>
                            <input type="email" pInputText id="create_email" [(ngModel)]="nuevoUsuario.email" required fluid />
                            @if (submitted() && !nuevoUsuario.email) {
                                <small class="text-red-500">Requerido.</small>
                            }
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="create_password" class="block font-bold mb-3">Contraseña</label>
                            <input type="password" pInputText id="create_password" [(ngModel)]="nuevoUsuario.password" required fluid (input)="validarPasswordRealtime()" />
                            @if (submitted() && !nuevoUsuario.password) {
                                <small class="text-red-500">Requerida.</small>
                            }
                            @if (passwordError) {
                                <small class="text-red-500 block mt-1">{{ passwordError }}</small>
                            }
                        </div>
                        <div class="col-span-6">
                            <label for="create_confirm" class="block font-bold mb-3">Confirmar contraseña</label>
                            <input type="password" pInputText id="create_confirm" [(ngModel)]="nuevoUsuario.confirmPassword" required fluid />
                            @if (submitted() && !nuevoUsuario.confirmPassword) {
                                <small class="text-red-500">Requerida.</small>
                            }
                            @if (submitted() && nuevoUsuario.password && nuevoUsuario.confirmPassword && nuevoUsuario.password !== nuevoUsuario.confirmPassword) {
                                <small class="text-red-500">Las contraseñas no coinciden.</small>
                            }
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="create_nombres" class="block font-bold mb-3">Nombres</label>
                            <input type="text" pInputText id="create_nombres" [(ngModel)]="nuevoUsuario.nbEmpleado" required fluid />
                            @if (submitted() && !nuevoUsuario.nbEmpleado) {
                                <small class="text-red-500">Requerido.</small>
                            }
                        </div>
                        <div class="col-span-6">
                            <label for="create_apellidos" class="block font-bold mb-3">Apellidos</label>
                            <input type="text" pInputText id="create_apellidos" [(ngModel)]="nuevoUsuario.nbApellidos" required fluid />
                            @if (submitted() && !nuevoUsuario.nbApellidos) {
                                <small class="text-red-500">Requerido.</small>
                            }
                        </div>
                    </div>
                    <div>
                        <label for="create_area" class="block font-bold mb-3">Área</label>
                        <p-select appendTo="body"
                            id="create_area"
                            [(ngModel)]="nuevoUsuario.idElemArea"
                            [options]="areas()"
                            optionLabel="nombre"
                            optionValue="id"
                            placeholder="Selecciona una área"
                            fluid
                        />
                        @if (submitted() && !nuevoUsuario.idElemArea) {
                            <small class="text-red-500">El área es requerida.</small>
                        }
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
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="edit_nuEmpleado" class="block font-bold mb-3">No. Empleado</label>
                            <input type="text" pInputText id="edit_nuEmpleado" [(ngModel)]="datosEditar.nuEmpleado" fluid />
                        </div>
                        <div class="col-span-6">
                            <label for="edit_clEmpleado" class="block font-bold mb-3">Clave Empleado</label>
                            <input type="text" pInputText id="edit_clEmpleado" [(ngModel)]="datosEditar.clEmpleado" required fluid />
                            @if (submittedEditar() && !datosEditar.clEmpleado) {
                                <small class="text-red-500">Requerido.</small>
                            }
                        </div>
                    </div>
                    <div>
                        <label class="block font-bold mb-3">Correo</label>
                        <span>{{ empleadoEditando.correo || 'Sin correo' }}</span>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="edit_nombres" class="block font-bold mb-3">Nombres</label>
                            <input type="text" pInputText id="edit_nombres" [(ngModel)]="datosEditar.nbEmpleado" required fluid />
                            @if (submittedEditar() && !datosEditar.nbEmpleado) {
                                <small class="text-red-500">Requerido.</small>
                            }
                        </div>
                        <div class="col-span-6">
                            <label for="edit_apellidos" class="block font-bold mb-3">Apellidos</label>
                            <input type="text" pInputText id="edit_apellidos" [(ngModel)]="datosEditar.nbApellidos" required fluid />
                            @if (submittedEditar() && !datosEditar.nbApellidos) {
                                <small class="text-red-500">Requerido.</small>
                            }
                        </div>
                    </div>
                    <div>
                        <label for="edit_area" class="block font-bold mb-3">Área</label>
                        <p-select appendTo="body"
                            id="edit_area"
                            [(ngModel)]="datosEditar.idElemArea"
                            [options]="areas()"
                            optionLabel="nombre"
                            optionValue="id"
                            placeholder="Selecciona una área"
                            fluid
                        />
                        @if (submittedEditar() && !datosEditar.idElemArea) {
                            <small class="text-red-500">Requerido.</small>
                        }
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
    private readonly empleadosService = inject(EmpleadosApiService);
    private readonly usuariosService = inject(UsuariosApiService);
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
    nuevoUsuario: RegistrarUsuarioEmpleadoRequest = this.emptyNuevo();
    passwordError = '';

    // ─── Editar ───
    editarDialogVisible = false;
    submittedEditar = signal<boolean>(false);
    empleadoEditando: Empleado = this.emptyEmpleado();
    datosEditar: ActualizarEmpleadoRequest = { 
        idUsuario: null, 
        idElemArea: 0, 
        nuEmpleado: null,
        clEmpleado: '', 
        nbEmpleado: '', 
        nbApellidos: '', 
        clEstatusEmpleado: 'ACTIVO' 
    };

    // ─── Options ───
    activoOptions = [
        { label: 'Activo', value: true },
        { label: 'Inactivo', value: false }
    ];

    private searchSubject = new Subject<{table: Table, query: string}>();

    ngOnInit(): void {
        this.cargarCatalogos();
        this.cargarEmpleados();

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged((prev, curr) => prev.query === curr.query),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(({table, query}) => {
            table.filterGlobal(query, 'contains');
        });
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
        this.searchSubject.next({ table, query: (event.target as HTMLInputElement).value });
    }

    // ═══ CREAR ═══

    abrirNuevo(): void {
        this.nuevoUsuario = this.emptyNuevo();
        this.submitted.set(false);
        this.passwordError = '';
        this.crearDialogVisible = true;
    }

    validarPasswordRealtime(): void {
        this.passwordError = this.validarFuerzaPassword(this.nuevoUsuario.password || '');
    }

    validarFuerzaPassword(password: string): string {
        if (!password) return '';
        if (password.length < 8) return 'Debe tener al menos 8 caracteres.';
        if (!/[A-Z]/.test(password)) return 'Debe incluir al menos una letra mayúscula.';
        if (!/[a-z]/.test(password)) return 'Debe incluir al menos una letra minúscula.';
        if (!/[0-9]/.test(password)) return 'Debe incluir al menos un número.';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Debe incluir al menos un símbolo especial.';
        return '';
    }

    guardarNuevo(): void {
        this.submitted.set(true);
        this.validarPasswordRealtime();

        if (!this.nuevoUsuario.clEmpleado?.trim() || !this.nuevoUsuario.nbEmpleado?.trim() || !this.nuevoUsuario.nbApellidos?.trim() || !this.nuevoUsuario.idElemArea) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulario incompleto',
                detail: 'Completa todos los datos del empleado.',
                life: 4000
            });
            return;
        }

        if (!this.nuevoUsuario.email?.trim() || !this.nuevoUsuario.password?.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulario incompleto',
                detail: 'El email y la contraseña son obligatorios.',
                life: 4000
            });
            return;
        }

        if (this.passwordError) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Contraseña débil',
                detail: this.passwordError,
                life: 5000
            });
            return;
        }

        if (this.nuevoUsuario.password !== this.nuevoUsuario.confirmPassword) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Error',
                detail: 'Las contraseñas no coinciden.',
                life: 4000
            });
            return;
        }

        this.saving.set(true);

        this.usuariosService.registrarUsuarioEmpleado(this.nuevoUsuario).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.saving.set(false);
                this.crearDialogVisible = false;
                this.cargarEmpleados();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Empleado creado',
                    detail: `${this.nuevoUsuario.nbEmpleado} ${this.nuevoUsuario.nbApellidos} y su usuario fueron registrados correctamente.`,
                    life: 4000
                });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);
                const detail = err.error?.detail || err.error?.title || 'No se pudo crear el empleado/usuario.';

                this.messageService.add({ severity: 'error', summary: 'Error al crear', detail, life: 5000 });
            }
        });
    }

    // ═══ EDITAR ═══

    editarEmpleado(emp: Empleado): void {
        this.empleadoEditando = { ...emp };
        
        this.datosEditar = {
            idUsuario: emp.idUsuario,
            nuEmpleado: emp.nuEmpleado,
            clEmpleado: emp.clEmpleado,
            nbEmpleado: emp.nbEmpleado,
            nbApellidos: emp.nbApellidos,
            idElemArea: emp.idElemArea,
            clEstatusEmpleado: emp.clEstatusEmpleado
        };
        this.submittedEditar.set(false);
        this.editarDialogVisible = true;
    }

    guardarEdicion(): void {
        this.submittedEditar.set(true);

        if (!this.datosEditar.nbEmpleado?.trim() || !this.datosEditar.nbApellidos?.trim() || !this.datosEditar.clEmpleado?.trim() || !this.datosEditar.idElemArea) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulario incompleto',
                detail: 'Los campos Clave, Nombres, Apellidos y Área son obligatorios.',
                life: 4000
            });

            return;
        }

        this.saving.set(true);

        this.empleadosService.actualizarEmpleado(this.empleadoEditando.idEmpleado, this.datosEditar).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.saving.set(false);
                this.editarDialogVisible = false;
                this.cargarEmpleados();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Empleado actualizado',
                    detail: `${this.datosEditar.nbEmpleado} ${this.datosEditar.nbApellidos} fue actualizado correctamente.`,
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
            message: `¿Estás seguro de desactivar a ${emp.nbEmpleado} ${emp.nbApellidos}?`,
            header: 'Confirmar desactivación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, desactivar',
            rejectLabel: 'No',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.empleadosService.actualizarEmpleado(emp.idEmpleado, {
                    idUsuario: emp.idUsuario,
                    nuEmpleado: emp.nuEmpleado,
                    clEmpleado: emp.clEmpleado,
                    nbEmpleado: emp.nbEmpleado,
                    nbApellidos: emp.nbApellidos,
                    idElemArea: emp.idElemArea,
                    clEstatusEmpleado: 'INACTIVO'
                }).pipe(
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe({
                    next: () => {
                        this.cargarEmpleados();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Empleado desactivado',
                            detail: `${emp.nbEmpleado} ${emp.nbApellidos} fue desactivado.`,
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
            message: `¿Reactivar a ${emp.nbEmpleado} ${emp.nbApellidos}?`,
            header: 'Confirmar reactivación',
            icon: 'pi pi-check-circle',
            acceptLabel: 'Sí, reactivar',
            rejectLabel: 'No',
            accept: () => {
                this.empleadosService.actualizarEmpleado(emp.idEmpleado, {
                    idUsuario: emp.idUsuario,
                    nuEmpleado: emp.nuEmpleado,
                    clEmpleado: emp.clEmpleado,
                    nbEmpleado: emp.nbEmpleado,
                    nbApellidos: emp.nbApellidos,
                    idElemArea: emp.idElemArea,
                    clEstatusEmpleado: 'ACTIVO'
                }).pipe(
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe({
                    next: () => {
                        this.cargarEmpleados();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Empleado reactivado',
                            detail: `${emp.nbEmpleado} ${emp.nbApellidos} fue reactivado.`,
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

    getAreaName(idElemArea: number): string {
        const area = this.areas().find(a => a.id === idElemArea);
        return area ? area.nombre : '';
    }

    private emptyNuevo(): RegistrarUsuarioEmpleadoRequest {
        return { email: '', password: '', confirmPassword: '', nuEmpleado: '', clEmpleado: '', nbEmpleado: '', nbApellidos: '', idElemArea: 0 };
    }

    private emptyEmpleado(): Empleado {
        return { idEmpleado: '', idUsuario: null, nuEmpleado: null, clEmpleado: '', nbEmpleado: '', nbApellidos: '', idElemArea: 0, clEstatusEmpleado: 'ACTIVO', correo: null };
    }
}
