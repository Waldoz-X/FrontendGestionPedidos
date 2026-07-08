import { SecurityHelper } from '@/app/shared/utils/security.util';

import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import { VisibilidadApiService } from '../service/visibilidad/visibilidad-api.service';
import { VisibilidadProducto, AsignarVisibilidadRequest } from '../service/visibilidad/visibilidad-api.types';
import { ClientesAdminService } from '../service/clientes-admin.service';
import { ClienteAdmin } from '../service/clientes-admin-api.types';
import { ProductosGuanteApiService } from '../service/productos-guante/productos-guante-api.service';
import { ProductoGuante } from '../service/productos-guante/productos-guante-api.types';

@Component({
    selector: 'p-visibilidad',
    standalone: true,
    imports: [
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
    TooltipModule
],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog [style]="{ width: '450px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <div class="font-semibold text-xl">Visibilidad de Productos</div>
                </ng-template>
                <ng-template #end>
                    <p-button severity="success" label="Asignar Acceso" icon="pi pi-plus" class="mr-2" (onClick)="abrirAsignar()" />
                </ng-template>
            </p-toolbar>

            <!-- Selector de producto -->
            <div class="mb-6">
                <div class="grid grid-cols-12 gap-4 items-end">
                    <div class="col-span-6">
                        <label class="block font-bold mb-3">Seleccione un producto para ver sus clientes autorizados:</label>
                        <p-select
                            [(ngModel)]="productoSeleccionadoId"
                            [options]="productosOptions()"
                            optionLabel="label"
                            optionValue="value"
                            [filter]="true"
                            filterBy="label"
                            placeholder="Buscar producto..."
                            fluid
                            (onChange)="onProductoChange()"
                        />
                    </div>
                    <div class="col-span-2">
                        <p-button label="Consultar" icon="pi pi-search" (onClick)="consultarVisibilidad()" [disabled]="!productoSeleccionadoId" />
                    </div>
                </div>
            </div>

            <p-table
                [value]="visibilidades()"
                [loading]="loading()"
                [rows]="10"
                [paginator]="true"
                [rowsPerPageOptions]="[10, 25, 50]"
                [tableStyle]="{ 'min-width': '50rem' }"
                responsiveLayout="scroll"
            >
                <ng-template #header>
                    <tr>
                        <th>Cliente</th>
                        <th>Producto</th>
                        <th>Tipo de Acceso</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template #body let-v>
                    <tr>
                        <td>{{ v.nbComercialCliente }}</td>
                        <td>{{ v.nbProducto }}</td>
                        <td>
                            <p-tag [value]="v.clTipoAcceso" [severity]="v.clTipoAcceso === 'EXCLUSIVO' ? 'warn' : 'success'" />
                        </td>
                        <td>
                            <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" pTooltip="Revocar acceso" (onClick)="revocarAcceso(v)" />
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr><td colspan="4">
                        @if (productoSeleccionadoId) {
                            No hay clientes con acceso a este producto.
                        } @else {
                            Seleccione un producto para ver los clientes autorizados.
                        }
                    </td></tr>
                </ng-template>
            </p-table>
        </div>

        <!-- DIALOG ASIGNAR ACCESO -->
        <p-dialog
            [(visible)]="dialogVisible"
            [style]="{ width: '500px' }"
            header="Asignar Acceso a Producto"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label class="block font-bold mb-3">Cliente <span class="text-red-500">*</span></label>
                        <p-select appendTo="body" [(ngModel)]="formulario.idCliente" [options]="clientesOptions()" optionLabel="label" optionValue="value" [filter]="true" filterBy="label" placeholder="Buscar cliente..." fluid />
                    </div>
                    <div>
                        <label class="block font-bold mb-3">Producto <span class="text-red-500">*</span></label>
                        <p-select appendTo="body" [(ngModel)]="formulario.idProducto" [options]="productosOptions()" optionLabel="label" optionValue="value" [filter]="true" filterBy="label" placeholder="Buscar producto..." fluid />
                    </div>
                    <div>
                        <label class="block font-bold mb-3">Tipo de Acceso</label>
                        <p-select appendTo="body" [(ngModel)]="formulario.clTipoAcceso" [options]="tipoAccesoOptions" fluid />
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="dialogVisible = false" />
                <p-button label="Asignar" icon="pi pi-check" (onClick)="guardarVisibilidad()" [loading]="saving()" />
            </ng-template>
        </p-dialog>
    `
})
export class Visibilidad implements OnInit {
    private readonly apiService = inject(VisibilidadApiService);
    private readonly clientesService = inject(ClientesAdminService);
    private readonly productosService = inject(ProductosGuanteApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly destroyRef = inject(DestroyRef);

    visibilidades = signal<VisibilidadProducto[]>([]);
    loading = signal<boolean>(false);
    saving = signal<boolean>(false);

    dialogVisible = false;
    productoSeleccionadoId = '';

    tipoAccesoOptions = ['VISIBLE', 'EXCLUSIVO'];

    clientesOptions = signal<{label: string, value: string}[]>([]);
    productosOptions = signal<{label: string, value: string}[]>([]);

    formulario: AsignarVisibilidadRequest = { idCliente: '', idProducto: '', clTipoAcceso: 'VISIBLE' };

    ngOnInit(): void {
        this.cargarDropdowns();
    }

    cargarDropdowns(): void {
        this.clientesService.getClientes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: ClienteAdmin[]) => { 
                this.clientesOptions.set((data || []).map(c => ({ 
                    label: c.nbComercial, 
                    value: c.id || (c as any).idCliente 
                }))); 
            }
        });
        this.productosService.getProductosGuantes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: ProductoGuante[]) => { 
                this.productosOptions.set((data || []).map(p => ({ 
                    label: (p.clProducto || '') + ' - ' + (p.nbProducto || ''), 
                    value: p.id || (p as any).idProducto 
                }))); 
            }
        });
    }

    onProductoChange(): void {
        if (this.productoSeleccionadoId) {
            this.consultarVisibilidad();
        }
    }

    consultarVisibilidad(): void {
        if (!this.productoSeleccionadoId) return;
        this.loading.set(true);
        this.apiService.getClientesProducto(this.productoSeleccionadoId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => { this.visibilidades.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo consultar la visibilidad.', life: 5000 }); }
        });
    }

    abrirAsignar(): void {
        this.formulario = { idCliente: '', idProducto: this.productoSeleccionadoId || '', clTipoAcceso: 'VISIBLE' };
        this.dialogVisible = true;
    }

    guardarVisibilidad(): void {
        if (!this.formulario.idCliente || !this.formulario.idProducto) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione un cliente y un producto.', life: 3000 });


 return;
        }

        this.saving.set(true);
        this.apiService.asignarVisibilidad(SecurityHelper.sanitizePayload(this.formulario)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Acceso asignado correctamente.', life: 3000 });
                this.dialogVisible = false; this.saving.set(false);
                if (this.productoSeleccionadoId) this.consultarVisibilidad();
            },
            error: () => { this.saving.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo asignar el acceso.', life: 5000 }); }
        });
    }

    revocarAcceso(v: VisibilidadProducto): void {
        this.confirmationService.confirm({
            message: `¿Está seguro de revocar el acceso de "${v.nbComercialCliente}" a "${v.nbProducto}"?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.apiService.removerVisibilidad(v.idCliente, v.idProducto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Acceso revocado.', life: 3000 });
                        this.consultarVisibilidad();
                    },
                    error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo revocar el acceso.', life: 5000 }); }
                });
            }
        });
    }
}
