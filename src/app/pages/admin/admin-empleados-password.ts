import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { CrearEmpleadoUsuarioRequest, Empleado } from '../service/empleados/empleados-api.types';
import { EmpleadosApiService } from '../service/empleados/empleados-api.service';
import { EmpleadosUsuariosApiService } from '../service/empleados/empleados-usuarios-api.service';

@Component({
    selector: 'p-admin-empleados-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, DialogModule, InputTextModule, PasswordModule, SelectModule, TableModule],
    template: `
        <div class="card">
            <div class="font-semibold text-xl mb-4">Admin - Usuarios de empleados</div>

            <div class="flex justify-end mb-4">
                <p-button label="Recargar empleados" icon="pi pi-refresh" severity="secondary" [outlined]="true" [loading]="loading()" (onClick)="cargarEmpleados()"></p-button>
            </div>

            @if (errorMessage()) {
                <div class="mb-4 p-3 border-round bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">{{ errorMessage() }}</div>
            }
            @if (successMessage()) {
                <div class="mb-4 p-3 border-round bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">{{ successMessage() }}</div>
            }

            <p-table
                [value]="empleados()"
                dataKey="idEmpleado"
                [loading]="loading()"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="[10, 20, 50]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} empleados"
                [showCurrentPageReport]="true"
            >
                <ng-template #header>
                    <tr>
                        <th>No. Empleado</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Area</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template #body let-e>
                    <tr>
                        <td>{{ e.clEmpleado }}</td>
                        <td>{{ e.nbEmpleado }} {{ e.nbApellidos }}</td>
                        <td>{{ e.email || 'Sin usuario' }}</td>
                        <td>{{ e.area }}</td>
                        <td>{{ e.activo ? 'Activo' : 'Inactivo' }}</td>
                        <td>
                            @if (!e.idUsuario) {
                                <p-button label="Crear usuario" icon="pi pi-user-plus" size="small" severity="info" [outlined]="true" (onClick)="abrirCrearUsuario(e)"></p-button>
                            } @else {
                                <p-button label="Restablecer contraseña" icon="pi pi-key" size="small" severity="secondary" [outlined]="true" (onClick)="abrirCambioPassword(e)"></p-button>
                            }
                        </td>
                    </tr>
                </ng-template>
                <ng-template #empty>
                    <tr>
                        <td colspan="6">No hay empleados para mostrar.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="crearUsuarioDialogVisible" [style]="{ width: '34rem' }" [modal]="true" [header]="'Crear usuario - ' + empleadoNombreSeleccionado()">
            <ng-template #content>
                <form [formGroup]="usuarioForm" class="grid grid-cols-12 gap-4">
                    <div class="col-span-12">
                        <label class="block mb-2 font-medium">Email</label>
                        <input pInputText type="email" formControlName="email" class="w-full" placeholder="usuario@empresa.com" />
                    </div>
                    <div class="col-span-12">
                        <label class="block mb-2 font-medium">Contraseña temporal</label>
                        <p-password formControlName="password" [toggleMask]="true" [feedback]="false" class="w-full" inputStyleClass="w-full"></p-password>
                    </div>
                    <div class="col-span-12">
                        <label class="block mb-2 font-medium">Rol</label>
                        <p-select formControlName="role" [options]="roleOptions" optionLabel="label" optionValue="value" class="w-full"></p-select>
                    </div>
                </form>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="cerrarCrearUsuario()"></p-button>
                <p-button label="Crear" icon="pi pi-check" [loading]="saving()" (onClick)="guardarUsuarioEmpleado()"></p-button>
            </ng-template>
        </p-dialog>

        <p-dialog [(visible)]="passwordDialogVisible" [style]="{ width: '32rem' }" [modal]="true" [header]="'Restablecer contraseña - ' + empleadoNombreSeleccionado()">
            <ng-template #content>
                <form [formGroup]="passwordForm" class="grid grid-cols-12 gap-4">
                    <div class="col-span-12">
                        <label class="block mb-2 font-medium">Nueva contraseña</label>
                        <p-password formControlName="password" [toggleMask]="true" [feedback]="false" class="w-full" inputStyleClass="w-full"></p-password>
                    </div>
                </form>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="cerrarCambioPassword()"></p-button>
                <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" (onClick)="guardarCambioPassword()"></p-button>
            </ng-template>
        </p-dialog>
    `
})
export class AdminEmpleadosUsuarios implements OnInit {
    private readonly empleadosApiService = inject(EmpleadosApiService);
    private readonly empleadosUsuariosApiService = inject(EmpleadosUsuariosApiService);
    private readonly fb = inject(FormBuilder);
    private readonly destroyRef = inject(DestroyRef);

    empleados = signal<Empleado[]>([]);
    loading = signal(false);
    saving = signal(false);
    errorMessage = signal('');
    successMessage = signal('');

    empleadoSeleccionado = signal<Empleado | null>(null);
    crearUsuarioDialogVisible = false;
    passwordDialogVisible = false;

    roleOptions = [
        { label: 'Admin', value: 'Admin' },
        { label: 'Comercial', value: 'Comercial' }
    ];

    usuarioForm = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        role: ['Comercial', Validators.required]
    });

    passwordForm = this.fb.nonNullable.group({
        password: ['', [Validators.required, Validators.minLength(8)]]
    });

    ngOnInit(): void {
        this.cargarEmpleados();
    }

    empleadoNombreSeleccionado(): string {
        const empleado = this.empleadoSeleccionado();

        if (!empleado) {

            return '';
        }

        return `${empleado.clEmpleado} - ${empleado.nbEmpleado} ${empleado.nbApellidos}`;
    }

    cargarEmpleados(): void {
        this.loading.set(true);

        this.errorMessage.set('');

        this.empleadosApiService
            .getEmpleados()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.empleados.set(response);
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                    this.errorMessage.set('No se pudieron cargar los empleados.');
                }
            });
    }

    abrirCambioPassword(empleado: Empleado): void {
        this.errorMessage.set('');
        this.successMessage.set('');
        this.empleadoSeleccionado.set(empleado);
        this.passwordForm.reset({ password: '' });
        this.passwordDialogVisible = true;
    }

    abrirCrearUsuario(empleado: Empleado): void {
        this.errorMessage.set('');
        this.successMessage.set('');
        this.empleadoSeleccionado.set(empleado);
        this.usuarioForm.reset({ email: '', password: '', role: 'Comercial' });
        this.crearUsuarioDialogVisible = true;
    }

    cerrarCrearUsuario(): void {
        this.crearUsuarioDialogVisible = false;
        this.usuarioForm.reset({ email: '', password: '', role: 'Comercial' });
        this.empleadoSeleccionado.set(null);
    }

    cerrarCambioPassword(): void {
        this.passwordDialogVisible = false;
        this.empleadoSeleccionado.set(null);
        this.passwordForm.reset({ password: '' });
    }

    guardarCambioPassword(): void {
        const empleado = this.empleadoSeleccionado();

        this.errorMessage.set('');
        this.successMessage.set('');

        if (!empleado) {
            this.errorMessage.set('Selecciona un empleado para cambiar la contraseña.');

            return;
        }

        if (!empleado.idUsuario) {
            this.errorMessage.set('El empleado no tiene usuario. Primero crea la cuenta.');

            return;
        }

        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            this.errorMessage.set('Ingresa una contraseña válida.');

            return;
        }

        this.saving.set(true);

        this.empleadosUsuariosApiService
            .actualizarPasswordEmpleado(empleado.idEmpleado, this.passwordForm.getRawValue())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.saving.set(false);
                    this.successMessage.set('Contraseña actualizada correctamente.');
                    this.cerrarCambioPassword();
                },
                error: (error: HttpErrorResponse) => {
                    this.saving.set(false);
                    this.errorMessage.set(error.status === 400 ? 'La contraseña no cumple con la política.' : 'No se pudo actualizar la contraseña.');
                }
            });
    }

    guardarUsuarioEmpleado(): void {
        const empleado = this.empleadoSeleccionado();

        this.errorMessage.set('');
        this.successMessage.set('');

        if (!empleado) {
            this.errorMessage.set('Selecciona un empleado para crear usuario.');

            return;
        }

        if (this.usuarioForm.invalid) {
            this.usuarioForm.markAllAsTouched();
            this.errorMessage.set('Completa email, contraseña y rol válidos.');

            return;
        }

        this.saving.set(true);

        const payload = this.usuarioForm.getRawValue() as CrearEmpleadoUsuarioRequest;

        this.empleadosUsuariosApiService
            .crearUsuarioEmpleado(empleado.idEmpleado, payload)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.saving.set(false);
                    this.successMessage.set('Usuario de empleado creado correctamente.');
                    this.cerrarCrearUsuario();
                    this.cargarEmpleados();
                },
                error: (error: HttpErrorResponse) => {
                    this.saving.set(false);
                    this.errorMessage.set(error.status === 400 ? 'Datos inválidos para crear el usuario.' : 'No se pudo crear el usuario del empleado.');
                }
            });
    }
}

