import { SecurityHelper } from '@/app/shared/utils/security.util';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
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
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';

import { Empleado } from '../service/empleados/empleados-api.types';
import { EmpleadosApiService } from '../service/empleados/empleados-api.service';
import { Cliente } from '../service/clientes/clientes-api.types';
import { ClientesApiService } from '../service/clientes/clientes-api.service';
import { UsuariosApiService } from '../service/usuarios/usuarios-api.service';
import { Usuario } from '../service/usuarios/usuarios-api.types';

@Component({
    selector: 'p-usuarios',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        TagModule,
        ToastModule,
        ToolbarModule,
        DialogModule,
        ConfirmDialogModule,
        IconFieldModule,
        InputIconModule,
        TooltipModule,
        SelectModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog [style]="{ width: '450px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Gestión de Usuarios</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Administra los usuarios del sistema.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nuevo Usuario" icon="pi pi-user-plus" severity="success" class="mr-2" (onClick)="abrirNuevoUsuario()" />
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="cargarDatos()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <!-- TABLA UNIFICADA DE USUARIOS -->
            <p-table #dtUsuarios [value]="usuarios()" dataKey="idUsuario" [loading]="loading()" [paginator]="true" [rows]="10" [globalFilterFields]="['email', 'empleado.nbNombreCompleto', 'cliente.nbComercial', 'tipoUsuario']" [tableStyle]="{ 'min-width': '70rem' }">
                <ng-template #caption>
                    <div class="flex items-center justify-end">
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search" />
                            <input pInputText type="text" (input)="onGlobalFilter(dtUsuarios, $event)" placeholder="Buscar Usuarios" />
                        </p-iconfield>
                    </div>
                </ng-template>
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="tipoUsuario">Tipo <p-sortIcon field="tipoUsuario" /></th>
                        <th>Referencia (Nombre/Comercial)</th>
                        <th pSortableColumn="email">Email <p-sortIcon field="email" /></th>
                        <th>Roles</th>
                        <th pSortableColumn="clEstatusUsuario">Estado <p-sortIcon field="clEstatusUsuario" /></th>
                        <th style="min-width: 14rem">Acciones</th>
                    </tr>
                </ng-template>
                <ng-template #body let-u>
                    <tr>
                        <td>
                            <p-tag [value]="u.tipoUsuario" [severity]="u.tipoUsuario === 'EMPLEADO' ? 'info' : 'warn'" />
                        </td>
                        <td class="font-medium">
                            {{ u.tipoUsuario === 'EMPLEADO' ? u.empleado?.nbNombreCompleto : u.cliente?.nbComercial }}
                            @if (u.tipoUsuario === 'EMPLEADO' && u.empleado) {
                                <div class="text-sm text-surface-500 font-normal">No. {{ u.empleado.clEmpleado }} | {{ u.empleado.nbDepartamento }}</div>
                            }
                        </td>
                        <td>{{ u.email }}</td>
                        <td>
                            @for (rol of u.roles; track rol) {
                                <p-tag [value]="rol" severity="secondary" styleClass="mr-1" />
                            }
                        </td>
                        <td>
                            <p-tag [value]="u.clEstatusUsuario === 'ACTIVO' ? 'Activo' : 'Inactivo'" [severity]="u.clEstatusUsuario === 'ACTIVO' ? 'success' : 'danger'" />
                        </td>
                        <td>
                            <p-button icon="pi pi-key" class="mr-2" [rounded]="true" [outlined]="true" severity="warn" (onClick)="abrirResetPassword(u)" pTooltip="Resetear Contraseña" />
                            <p-button icon="pi pi-power-off" class="mr-2" [rounded]="true" [outlined]="true" severity="info" (onClick)="abrirCambiarEstado(u)" pTooltip="Cambiar Estado" />
                            <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="confirmarEliminarUsuario(u)" pTooltip="Eliminar Usuario" />
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr><td colspan="6">No hay usuarios registrados.</td></tr>
                </ng-template>
            </p-table>
        </div>

        <!-- DIALOG NUEVO USUARIO -->
        <p-dialog [(visible)]="nuevoDialogVisible" [style]="{ width: '500px' }" header="Crear Nuevo Usuario" [modal]="true" appendTo="body">
            <ng-template #content>
                <div class="flex flex-col gap-6" style="padding-top: 10px;">
                    <div>
                        <label for="tipo_usr" class="block font-bold mb-3">Tipo de Usuario</label>
                        <p-select appendTo="body" id="tipo_usr" [(ngModel)]="tipoUsuarioData" [options]="tipoOpciones" optionLabel="label" optionValue="value" fluid (onChange)="idEntidadData = ''" />
                    </div>

                    @if (tipoUsuarioData === 'EMPLEADO') {
                        <div>
                            <label for="emp_sel" class="block font-bold mb-3">Seleccionar Empleado</label>
                            <p-select appendTo="body" id="emp_sel" [(ngModel)]="idEntidadData" [options]="empleadosDisponibles()" optionLabel="label" optionValue="value" fluid placeholder="Seleccione un empleado" [filter]="true" filterBy="label" />
                        </div>
                    } @else {
                        <div>
                            <label for="cli_sel" class="block font-bold mb-3">Seleccionar Cliente</label>
                            <p-select appendTo="body" id="cli_sel" [(ngModel)]="idEntidadData" [options]="clientesDisponibles()" optionLabel="label" optionValue="value" fluid placeholder="Seleccione un cliente" [filter]="true" filterBy="label" />
                        </div>
                    }

                    <div>
                        <label for="acc_email" class="block font-bold mb-3">Email</label>
                        <input type="email" pInputText id="acc_email" [(ngModel)]="accesoFormData.email" required fluid />
                    </div>
                    <div>
                        <label for="acc_password" class="block font-bold mb-3">Contraseña</label>
                        <input type="password" pInputText id="acc_password" [(ngModel)]="accesoFormData.password" required fluid (input)="validarPasswordAcceso()" />
                        @if (passwordAccesoError) {
                            <small class="text-red-500 block mt-1">{{ passwordAccesoError }}</small>
                        }
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="nuevoDialogVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarNuevoUsuario()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <!-- DIALOG RESET PASSWORD -->
        <p-dialog [(visible)]="resetDialogVisible" [style]="{ width: '400px' }" header="Resetear Contraseña" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <p class="m-0 text-surface-500">Nueva contraseña para: <strong>{{ nombreParaAcceso }}</strong></p>
                    <div>
                        <label for="reset_pw" class="block font-bold mb-3">Contraseña</label>
                        <input type="password" pInputText id="reset_pw" [(ngModel)]="resetPasswordData" required fluid (input)="validarPasswordReset()" />
                        @if (passwordResetError) {
                            <small class="text-red-500 block mt-1">{{ passwordResetError }}</small>
                        }
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="resetDialogVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarResetPassword()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <!-- DIALOG CAMBIAR ESTADO -->
        <p-dialog [(visible)]="estadoDialogVisible" [style]="{ width: '400px' }" header="Cambiar Estado" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6" style="padding-top: 10px;">
                    <div>
                        <label for="estado_sel" class="block font-bold mb-3">Nuevo Estado</label>
                        <p-select appendTo="body" id="estado_sel" [(ngModel)]="estadoFormData" [options]="estadoOptions" optionLabel="label" optionValue="value" fluid />
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="estadoDialogVisible = false" />
                <p-button label="Actualizar" icon="pi pi-check" (onClick)="guardarEstado()" [loading]="saving()" />
            </ng-template>
        </p-dialog>
    `
})
export class Usuarios implements OnInit {
    private readonly empleadosService = inject(EmpleadosApiService);
    private readonly clientesService = inject(ClientesApiService);
    private readonly usuariosService = inject(UsuariosApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly destroyRef = inject(DestroyRef);

    // State
    usuarios = signal<Usuario[]>([]);
    empleados = signal<Empleado[]>([]);
    clientes = signal<Cliente[]>([]);
    loading = signal<boolean>(false);
    saving = signal<boolean>(false);

    private searchSubject = new Subject<{table: Table, query: string}>();

    // Dialog state - Nuevo
    nuevoDialogVisible = false;
    tipoUsuarioData: 'EMPLEADO' | 'CLIENTE' = 'EMPLEADO';
    idEntidadData = '';
    tipoOpciones = [
        { label: 'Empleado', value: 'EMPLEADO' },
        { label: 'Cliente', value: 'CLIENTE' }
    ];

    accesoFormData = { email: '', password: '' };
    passwordAccesoError = '';

    // Dialog state - Reset Pwd
    resetDialogVisible = false;
    idParaAcceso = '';
    nombreParaAcceso = '';
    resetPasswordData = '';
    passwordResetError = '';

    // Dialog state - Estado
    estadoDialogVisible = false;
    estadoFormData = '';
    estadoOptions = [
        { label: 'ACTIVO', value: 'ACTIVO' },
        { label: 'INACTIVO', value: 'INACTIVO' }
    ];

    empleadosDisponibles = computed(() => {
        const users = this.usuarios() || [];
        const emps = Array.isArray(this.empleados()) ? this.empleados() : [];

        return emps
            .filter(e => {
                const idE = e.idEmpleado || (e as any).id;

                return !users.some(u => u.empleado?.idEmpleado === idE);
            })
            .map(e => ({ value: e.idEmpleado || (e as any).id, label: `${e.clEmpleado} — ${e.nbEmpleado} ${e.nbApellidos}` }));
    });

    clientesDisponibles = computed(() => {
        const users = this.usuarios() || [];
        const clis = Array.isArray(this.clientes()) ? this.clientes() : [];

        return clis
            .filter(c => {
                const idC = c.id || (c as any).idCliente;

                return !users.some(u => u.cliente?.idCliente === idC);
            })
            .map(c => ({ value: c.id || (c as any).idCliente, label: c.nombreComercial || (c as any).nbComercial || 'Cliente sin nombre' }));
    });

    ngOnInit(): void {
        this.cargarDatos();

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged((prev, curr) => prev.query === curr.query),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(({table, query}) => {
            table.filterGlobal(query, 'contains');
        });
    }

    cargarDatos(): void {
        this.loading.set(true);

        // Load Usuarios
        this.usuariosService.getUsuarios().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                this.usuarios.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios.' });
                this.loading.set(false);
            }
        });

        // Load Empleados (for dropdown)
        this.empleadosService.getEmpleados().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => this.empleados.set(data)
        });

        // Load Clientes (for dropdown)
        this.clientesService.getClientes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => this.clientes.set(data)
        });
    }

    onGlobalFilter(table: Table, event: Event): void {
        this.searchSubject.next({ table, query: (event.target as HTMLInputElement).value });
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

    // --- NUEVO USUARIO ---

    abrirNuevoUsuario(): void {
        this.tipoUsuarioData = 'EMPLEADO';
        this.idEntidadData = '';
        this.accesoFormData = { email: '', password: '' };
        this.passwordAccesoError = '';
        this.nuevoDialogVisible = true;
    }

    validarPasswordAcceso(): void {
        this.passwordAccesoError = this.validarFuerzaPassword(this.accesoFormData.password);
    }

    guardarNuevoUsuario(): void {
        this.validarPasswordAcceso();

        if (!this.idEntidadData) {
            this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Debe seleccionar un empleado o cliente.' });


            return;
        }

        if (!this.accesoFormData.email || !this.accesoFormData.password) {
            this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Email y contraseña son obligatorios.' });


            return;
        }

        if (this.passwordAccesoError) {
            this.messageService.add({ severity: 'warn', summary: 'Contraseña débil', detail: this.passwordAccesoError });


            return;
        }

        this.saving.set(true);
        const req$ = this.tipoUsuarioData === 'EMPLEADO'
            ? this.usuariosService.asignarAccesoEmpleado(this.idEntidadData, { email: SecurityHelper.sanitizeString(this.accesoFormData.email), password: this.accesoFormData.password, idEmpleado: this.idEntidadData })
            : this.usuariosService.registrarUsuarioCliente({ email: SecurityHelper.sanitizeString(this.accesoFormData.email), password: this.accesoFormData.password, confirmPassword: this.accesoFormData.password, idCliente: this.idEntidadData });

        req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.saving.set(false);
                this.nuevoDialogVisible = false;
                this.cargarDatos();
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado correctamente.' });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);
                const msg = err.error?.detail || err.error?.title || 'No se pudo crear el acceso.';

                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }

    // --- RESET PASSWORD ---

    abrirResetPassword(usr: Usuario): void {
        this.idParaAcceso = usr.idUsuario;
        this.nombreParaAcceso = usr.tipoUsuario === 'EMPLEADO' ? usr.empleado?.nbNombreCompleto || '' : usr.cliente?.nbComercial || '';
        this.resetPasswordData = '';
        this.passwordResetError = '';
        this.resetDialogVisible = true;
    }

    validarPasswordReset(): void {
        this.passwordResetError = this.validarFuerzaPassword(this.resetPasswordData);
    }

    guardarResetPassword(): void {
        this.validarPasswordReset();

        if (!this.resetPasswordData) {
            this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'La nueva contraseña es obligatoria.' });


            return;
        }

        if (this.passwordResetError) {
            this.messageService.add({ severity: 'warn', summary: 'Contraseña débil', detail: this.passwordResetError });


            return;
        }

        this.saving.set(true);
        this.usuariosService.resetearPassword(this.idParaAcceso, this.resetPasswordData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.saving.set(false);
                this.resetDialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Contraseña reseteada.' });
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo resetear la contraseña.' });
            }
        });
    }

    // --- CAMBIAR ESTADO ---

    abrirCambiarEstado(usr: Usuario): void {
        this.idParaAcceso = usr.idUsuario;
        this.estadoFormData = usr.clEstatusUsuario === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO';
        this.estadoDialogVisible = true;
    }

    guardarEstado(): void {
        this.saving.set(true);
        this.usuariosService.actualizarEstado(this.idParaAcceso, this.estadoFormData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.saving.set(false);
                this.estadoDialogVisible = false;
                this.cargarDatos(); // Refresh to show new state
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Estado actualizado.' });
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado.' });
            }
        });
    }

    // --- ELIMINAR USUARIO ---

    confirmarEliminarUsuario(usr: Usuario): void {
        const nombre = usr.tipoUsuario === 'EMPLEADO' ? usr.empleado?.nbNombreCompleto : usr.cliente?.nbComercial;

        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el usuario de ${nombre}? El acceso al sistema será revocado de inmediato.`,
            header: 'Confirmar eliminación de usuario',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.usuariosService.eliminarUsuario(usr.idUsuario).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.cargarDatos();
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'El usuario fue eliminado.' });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el usuario.' });
                    }
                });
            }
        });
    }
}
