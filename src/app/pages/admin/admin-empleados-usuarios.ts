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
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { CrearEmpleadoUsuarioRequest, Empleado } from '../service/empleados/empleados-api.types';
import { EmpleadosApiService } from '../service/empleados/empleados-api.service';
import { EmpleadosUsuariosApiService } from '../service/empleados/empleados-usuarios-api.service';

@Component({
    selector: 'p-admin-empleados-usuarios',
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
        PasswordModule,
        TooltipModule
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
                        <div class="font-semibold text-xl">Usuarios de Empleados</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Creación de cuentas y restablecimiento de contraseñas.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="cargarEmpleados()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <!-- ═══ TABLA ═══ -->
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
                [globalFilterFields]="['clEmpleado', 'nbEmpleado', 'nbApellidos', 'idElemArea', 'email']"
                [tableStyle]="{ 'min-width': '70rem' }"
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
                        <th pSortableColumn="clEmpleado" style="min-width: 10rem">No. Empleado <p-sortIcon field="clEmpleado" /></th>
                        <th pSortableColumn="nbEmpleado" style="min-width: 12rem">Nombres <p-sortIcon field="nbEmpleado" /></th>
                        <th pSortableColumn="nbApellidos" style="min-width: 12rem">Apellidos <p-sortIcon field="nbApellidos" /></th>
                        <th pSortableColumn="idElemArea" style="min-width: 10rem">Área <p-sortIcon field="idElemArea" /></th>
                        <th style="min-width: 10rem">Email</th>
                        <th pSortableColumn="activo" style="min-width: 8rem">Estado <p-sortIcon field="activo" /></th>
                        <th style="min-width: 7rem">Cuenta</th>
                        <th style="min-width: 12rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-e>
                    <tr>
                        <td class="font-mono">{{ e.clEmpleado }}</td>
                        <td>{{ e.nbEmpleado }}</td>
                        <td>{{ e.nbApellidos }}</td>
                        <td>{{ e.idElemArea }}</td>
                        <td>{{ e.email || '—' }}</td>
                        <td>
                            <p-tag [value]="e.clEstatusEmpleado === 'ACTIVO' ? 'Activo' : 'Inactivo'" [severity]="e.clEstatusEmpleado === 'ACTIVO' ? 'success' : 'danger'" />
                        </td>
                        <td>
                            <p-tag [value]="e.idUsuario ? 'Con cuenta' : 'Sin cuenta'" [severity]="e.idUsuario ? 'info' : 'warn'" />
                        </td>
                        <td>
                            @if (!e.idUsuario) {
                                <p-button icon="pi pi-user-plus" [rounded]="true" [outlined]="true" severity="info" (onClick)="abrirCrearUsuario(e)" pTooltip="Crear cuenta" />
                            } @else {
                                <p-button icon="pi pi-key" [rounded]="true" [outlined]="true" severity="secondary" (onClick)="abrirCambioPassword(e)" pTooltip="Cambiar contraseña" />
                            }
                        </td>
                    </tr>
                </ng-template>
                <ng-template #empty>
                    <tr>
                        <td colspan="7" class="text-center text-surface-500">No hay empleados para mostrar.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO CREAR USUARIO ═══ -->
        <p-dialog
            [(visible)]="crearDialogVisible"
            [style]="{ width: '500px' }"
            [header]="'Crear cuenta — ' + selectedNombre"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label class="block font-bold mb-3">Empleado</label>
                        <span class="text-lg">{{ selectedNombre }}</span>
                    </div>
                    <div>
                        <label for="usr_email" class="block font-bold mb-3">Email</label>
                        <input type="email" pInputText id="usr_email" [(ngModel)]="nuevoUsuario.email" placeholder="usuario@empresa.com" fluid />
                        @if (submitted() && !nuevoUsuario.email) {
                            <small class="text-red-500">El email es requerido.</small>
                        }
                    </div>
                    <div>
                        <label for="usr_password" class="block font-bold mb-3">Contraseña temporal</label>
                        <p-password inputId="usr_password" [(ngModel)]="nuevoUsuario.password" [toggleMask]="true" [feedback]="false" class="w-full" inputStyleClass="w-full" />
                        @if (submitted() && !nuevoUsuario.password) {
                            <small class="text-red-500">La contraseña es requerida (mín. 8 caracteres).</small>
                        }
                    </div>
                    <div>
                        <label for="usr_role" class="block font-bold mb-3">Rol</label>
                        <p-select
                            inputId="usr_role"
                            [(ngModel)]="nuevoUsuario.role"
                            [options]="roleOptions"
                            optionLabel="label"
                            optionValue="value"
                            appendTo="body"
                            fluid
                        />
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="crearDialogVisible = false" />
                <p-button label="Crear cuenta" icon="pi pi-check" (onClick)="guardarUsuarioEmpleado()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <!-- ═══ DIALOGO CAMBIAR CONTRASEÑA ═══ -->
        <p-dialog
            [(visible)]="passwordDialogVisible"
            [style]="{ width: '450px' }"
            [header]="'Cambiar contraseña — ' + selectedNombre"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label class="block font-bold mb-3">Empleado</label>
                        <span class="text-lg">{{ selectedNombre }}</span>
                    </div>
                    <div>
                        <label class="block font-bold mb-3">Email actual</label>
                        <span>{{ selectedEmail }}</span>
                    </div>
                    <div>
                        <label for="pwd_new" class="block font-bold mb-3">Nueva contraseña</label>
                        <p-password inputId="pwd_new" [(ngModel)]="nuevaPassword" [toggleMask]="true" [feedback]="false" class="w-full" inputStyleClass="w-full" />
                        @if (submittedPwd() && !nuevaPassword) {
                            <small class="text-red-500">La contraseña es requerida (mín. 8 caracteres).</small>
                        }
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="passwordDialogVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarCambioPassword()" [loading]="saving()" />
            </ng-template>
        </p-dialog>
    `
})
export class AdminEmpleadosUsuarios implements OnInit {
    private readonly empleadosApiService = inject(EmpleadosApiService);
    private readonly empleadosUsuariosApiService = inject(EmpleadosUsuariosApiService);
    private readonly messageService = inject(MessageService);
    private readonly destroyRef = inject(DestroyRef);

    // ─── State ───
    empleados = signal<Empleado[]>([]);
    loading = signal(false);
    saving = signal(false);

    // ─── Crear usuario ───
    crearDialogVisible = false;
    submitted = signal(false);
    selectedIdEmpleado = '';
    selectedNombre = '';
    nuevoUsuario: CrearEmpleadoUsuarioRequest = { email: '', password: '', role: 'Comercial' };

    roleOptions = [
        { label: 'Admin', value: 'Admin' },
        { label: 'Comercial', value: 'Comercial' }
    ];

    // ─── Cambiar password ───
    passwordDialogVisible = false;
    submittedPwd = signal(false);
    selectedEmail = '';
    nuevaPassword = '';

    ngOnInit(): void {
        this.cargarEmpleados();
    }

    // ═══ LISTADO ═══

    cargarEmpleados(): void {
        this.loading.set(true);

        this.empleadosApiService.getEmpleados().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => { this.empleados.set(r); this.loading.set(false); },
            error: (err: HttpErrorResponse) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error de carga', detail: err.status === 0 ? 'No se pudo conectar con el backend.' : 'No se pudieron cargar los empleados.', life: 5000 });
            }
        });
    }

    onGlobalFilter(table: Table, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    // ═══ CREAR USUARIO ═══

    abrirCrearUsuario(emp: Empleado): void {
        this.selectedIdEmpleado = emp.idEmpleado;
        this.selectedNombre = `${emp.clEmpleado} — ${emp.nbEmpleado} ${emp.nbApellidos}`;
        this.nuevoUsuario = { email: '', password: '', role: 'Comercial' };
        this.submitted.set(false);
        this.crearDialogVisible = true;
    }

    guardarUsuarioEmpleado(): void {
        this.submitted.set(true);

        if (!this.nuevoUsuario.email?.trim() || !this.nuevoUsuario.password?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'Email y contraseña son obligatorios.', life: 4000 });


            return;
        }

        if (this.nuevoUsuario.password.length < 8) {
            this.messageService.add({ severity: 'warn', summary: 'Contraseña corta', detail: 'La contraseña debe tener al menos 8 caracteres.', life: 4000 });


            return;
        }

        this.saving.set(true);

        this.empleadosUsuariosApiService.crearUsuarioEmpleado(this.selectedIdEmpleado, this.nuevoUsuario).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.saving.set(false);
                this.crearDialogVisible = false;
                this.cargarEmpleados();
                this.messageService.add({ severity: 'success', summary: 'Cuenta creada', detail: `Se creó la cuenta para ${this.selectedNombre}.`, life: 4000 });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);
                const detail = err.status === 400 ? 'Datos inválidos. Verifica email y contraseña.' : err.status === 409 ? 'Ya existe un usuario con ese email.' : 'No se pudo crear la cuenta.';

                this.messageService.add({ severity: 'error', summary: 'Error al crear', detail, life: 5000 });
            }
        });
    }

    // ═══ CAMBIAR CONTRASEÑA ═══

    abrirCambioPassword(emp: Empleado): void {
        this.selectedIdEmpleado = emp.idEmpleado;
        this.selectedNombre = `${emp.clEmpleado} — ${emp.nbEmpleado} ${emp.nbApellidos}`;
        this.selectedEmail = emp.correo || '';
        this.nuevaPassword = '';
        this.submittedPwd.set(false);
        this.passwordDialogVisible = true;
    }

    guardarCambioPassword(): void {
        this.submittedPwd.set(true);

        if (!this.nuevaPassword?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Campo vacío', detail: 'Ingresa la nueva contraseña.', life: 4000 });


            return;
        }

        if (this.nuevaPassword.length < 8) {
            this.messageService.add({ severity: 'warn', summary: 'Contraseña corta', detail: 'La contraseña debe tener al menos 8 caracteres.', life: 4000 });


            return;
        }

        this.saving.set(true);

        this.empleadosUsuariosApiService.actualizarPasswordEmpleado(this.selectedIdEmpleado, { password: this.nuevaPassword }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.saving.set(false);
                this.passwordDialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Contraseña actualizada', detail: `Contraseña cambiada para ${this.selectedNombre}.`, life: 4000 });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);
                const detail = err.status === 400 ? 'La contraseña no cumple con la política de seguridad.' : 'No se pudo actualizar la contraseña.';

                this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
            }
        });
    }
}
