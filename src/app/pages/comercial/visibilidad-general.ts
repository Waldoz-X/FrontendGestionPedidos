import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PickListModule } from 'primeng/picklist';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import { VisibilidadApiService } from '../service/visibilidad/visibilidad-api.service';
import { ProductoVisibleDto } from '../service/visibilidad/visibilidad-api.types';
import { ClientesAdminService } from '../service/clientes-admin.service';
import { ClienteAdmin } from '../service/clientes-admin-api.types';
import { ProductosGuanteApiService } from '../service/productos-guante/productos-guante-api.service';
import { ProductoGuante } from '../service/productos-guante/productos-guante-api.types';

interface ProductoPickItem {
    idProducto: string;
    clProducto: string;
    nbProducto: string;
    clTipoAcceso: string;
    _enTarget: boolean;
    nbPalma?: string;
    clMsCode?: string;
}

@Component({
    selector: 'p-visibilidad-general',
    standalone: true,
    imports: [
        FormsModule,
        ButtonModule,
        ConfirmDialogModule,
        PickListModule,
        SelectModule,
        TagModule,
        ToastModule,
        ToolbarModule,
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
                        <div class="font-semibold text-xl">Visibilidad General de Productos</div>
                        <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
                            Asigne o revoque el acceso a productos completos para cada cliente de forma masiva.
                        </p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button
                        severity="success"
                        label="Guardar Cambios"
                        icon="pi pi-save"
                        (onClick)="guardarCambios()"
                        [loading]="saving()"
                        [disabled]="!clienteSeleccionadoId"
                    />
                </ng-template>
            </p-toolbar>

            <!-- SELECTORES SUPERIORES -->
            <div class="grid grid-cols-12 gap-4 items-end mb-6">
                <div class="col-span-12 md:col-span-5">
                    <label class="block font-bold mb-3">Seleccione un Cliente <span class="text-red-500">*</span></label>
                    <p-select
                        [(ngModel)]="clienteSeleccionadoId"
                        [options]="clientesOptions()"
                        optionLabel="label"
                        optionValue="value"
                        [filter]="true"
                        filterBy="label"
                        placeholder="Buscar cliente..."
                        fluid
                        (onChange)="onClienteChange()"
                    />
                </div>
                <div class="col-span-12 md:col-span-3">
                    <label class="block font-bold mb-3">Acceso predeterminado:</label>
                    <p-select
                        [(ngModel)]="tipoAccesoDefault"
                        [options]="tipoAccesoOptions"
                        fluid
                    />
                </div>
                <div class="col-span-12 md:col-span-4">
                    @if (clienteSeleccionadoId && !loading()) {
                        <div class="flex gap-3 text-sm">
                            <span class="text-surface-500">
                                <i class="pi pi-box mr-1"></i> Disponibles: <strong>{{ productosDisponibles.length }}</strong>
                            </span>
                            <span class="text-green-500">
                                <i class="pi pi-check-circle mr-1"></i> Asignados: <strong>{{ productosAsignados.length }}</strong>
                            </span>
                        </div>
                    }
                </div>
            </div>

            <!-- INSTRUCCIONES RÁPIDAS -->
            @if (clienteSeleccionadoId && !loading()) {
                <div class="flex flex-wrap gap-4 items-center justify-between p-3 mb-4 rounded border border-surface-200 bg-surface-50 text-xs text-surface-600">
                    <div class="flex flex-wrap gap-x-6 gap-y-2">
                        <span><strong class="text-primary font-bold mr-1">&gt;</strong> Asignar seleccionados</span>
                        <span><strong class="text-primary font-bold mr-1">&gt;&gt;</strong> Asignar todos los productos</span>
                        <span><strong class="text-primary font-bold mr-1">&lt;</strong> Revocar seleccionados</span>
                        <span><strong class="text-primary font-bold mr-1">&lt;&lt;</strong> Revocar todos los productos</span>
                    </div>
                    <div class="text-primary-500 font-medium">
                        <i class="pi pi-info-circle mr-1"></i> También puedes arrastrar y soltar los productos.
                    </div>
                </div>
            }

            <!-- PICKLIST -->
            @if (clienteSeleccionadoId && !loading()) {
                <p-pickList
                    [source]="productosDisponibles"
                    [target]="productosAsignados"
                    sourceHeader="Productos Disponibles"
                    targetHeader="Productos Asignados"
                    [dragdrop]="true"
                    [responsive]="true"
                    [sourceStyle]="{ height: '55vh', 'min-height': '400px' }"
                    [targetStyle]="{ height: '55vh', 'min-height': '400px' }"
                    filterBy="clProducto,nbProducto"
                    sourceFilterPlaceholder="Buscar disponible..."
                    targetFilterPlaceholder="Buscar asignado..."
                    [showSourceControls]="false"
                    [showTargetControls]="false"
                    (onMoveToTarget)="onMoverATarget($event)"
                    (onMoveAllToTarget)="onMoverTodosATarget()"
                    (onMoveToSource)="onMoverASource($event)"
                    (onMoveAllToSource)="onMoverTodosASource()"
                >
                    <ng-template let-item #item>
                        <div class="flex items-center justify-between w-full gap-2 py-1">
                            <div class="flex flex-col min-w-0">
                                <span class="font-semibold text-sm truncate text-wrap">{{ item.nbProducto }}</span>
                                <div class="flex flex-wrap gap-x-2 text-surface-500 text-xs mt-0.5">
                                    <span>Código: <strong>{{ item.clProducto }}</strong></span>
                                    @if (item.nbPalma) {
                                        <span class="text-primary-500">• Palma: {{ item.nbPalma }}</span>
                                    }
                                    @if (item.clMsCode) {
                                        <span class="text-surface-400">• Corte: {{ item.clMsCode }}</span>
                                    }
                                </div>
                            </div>
                            @if (item._enTarget) {
                                <p-tag
                                    [value]="item.clTipoAcceso"
                                    [style]="{ cursor: 'pointer', 'font-size': '0.7rem' }"
                                    [severity]="item.clTipoAcceso === 'EXCLUSIVO' ? 'warn' : 'success'"
                                    (click)="toggleTipoAcceso(item); $event.stopPropagation()"
                                    pTooltip="Clic para cambiar tipo de acceso"
                                />
                            }
                        </div>
                    </ng-template>
                </p-pickList>
            } @else if (clienteSeleccionadoId && loading()) {
                <div class="flex items-center justify-center py-16">
                    <i class="pi pi-spin pi-spinner text-4xl text-primary mr-4"></i>
                    <span class="text-lg text-surface-500">Cargando productos del cliente...</span>
                </div>
            } @else {
                <div class="text-center text-surface-500 py-16">
                    <i class="pi pi-info-circle text-5xl mb-4 block"></i>
                    <p class="text-lg">Seleccione un cliente para gestionar la visibilidad de sus productos.</p>
                    <p class="text-sm mt-2">Use las flechas o arrastre los productos entre los paneles para asignar o revocar acceso.</p>
                </div>
            }
        </div>
    `
})
export class VisibilidadGeneral implements OnInit {
    private readonly apiService = inject(VisibilidadApiService);
    private readonly clientesService = inject(ClientesAdminService);
    private readonly productosService = inject(ProductosGuanteApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly destroyRef = inject(DestroyRef);

    loading = signal<boolean>(false);
    saving = signal<boolean>(false);
    clienteSeleccionadoId = '';
    tipoAccesoDefault = 'VISIBLE';
    tipoAccesoOptions = ['VISIBLE', 'EXCLUSIVO'];
    clientesOptions = signal<{ label: string; value: string }[]>([]);
    productosDisponibles: ProductoPickItem[] = [];
    productosAsignados: ProductoPickItem[] = [];
    originalAsignados: ProductoPickItem[] = [];

    ngOnInit(): void {
        this.cargarClientes();
    }

    cargarClientes(): void {
        this.clientesService.getClientes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: ClienteAdmin[]) => {
                this.clientesOptions.set((data || []).map(c => ({
                    label: c.nbComercial,
                    value: c.id || (c as any).idCliente
                })));
            }
        });
    }

    onClienteChange(): void {
        if (this.clienteSeleccionadoId) {
            this.cargarPickList();
        } else {
            this.productosDisponibles = [];
            this.productosAsignados = [];
            this.originalAsignados = [];
        }
    }

    cargarPickList(): void {
        this.loading.set(true);
        this.productosDisponibles = [];
        this.productosAsignados = [];

        let todosProductos: ProductoGuante[] = [];
        let asignados: ProductoVisibleDto[] = [];
        let cargasCompletas = 0;

        const verificarYProcesar = () => {
            cargasCompletas++;

            if (cargasCompletas < 2) return;

            const asignadosIds = new Set(asignados.map(a => a.idProducto));

            this.productosAsignados = asignados.map(a => {
                const pInfo = todosProductos.find(p => (p.id || (p as any).idProducto) === a.idProducto);

                return {
                    idProducto: a.idProducto,
                    clProducto: a.clProducto,
                    nbProducto: a.nbProducto,
                    clTipoAcceso: a.clTipoAcceso || 'VISIBLE',
                    _enTarget: true,
                    nbPalma: pInfo?.nbPalma,
                    clMsCode: pInfo?.clMsCode
                };
            });

            this.productosDisponibles = todosProductos
                .filter(p => !asignadosIds.has(p.id || (p as any).idProducto))
                .map(p => ({
                    idProducto: p.id || (p as any).idProducto,
                    clProducto: p.clProducto,
                    nbProducto: p.nbProducto,
                    clTipoAcceso: this.tipoAccesoDefault,
                    _enTarget: false,
                    nbPalma: p.nbPalma,
                    clMsCode: p.clMsCode
                }));

            this.originalAsignados = this.productosAsignados.map(p => ({ ...p }));
            this.loading.set(false);
        };

        this.productosService.getProductosGuantes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                todosProductos = data || [];
                verificarYProcesar();
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos.', life: 5000 });
            }
        });

        this.apiService.getProductosCliente(this.clienteSeleccionadoId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                asignados = data || [];
                verificarYProcesar();
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo consultar la visibilidad del cliente.', life: 5000 });
            }
        });
    }

    onMoverATarget(event: any): void {
        for (const item of event.items) {
            item._enTarget = true;

            if (!this.originalAsignados.some((o: ProductoPickItem) => o.idProducto === item.idProducto)) {
                item.clTipoAcceso = this.tipoAccesoDefault;
            }
        }
    }

    onMoverTodosATarget(): void {
        for (const item of this.productosAsignados) {
            if (!item._enTarget) {
                item._enTarget = true;

                if (!this.originalAsignados.some((o: ProductoPickItem) => o.idProducto === item.idProducto)) {
                    item.clTipoAcceso = this.tipoAccesoDefault;
                }
            }
        }
    }

    onMoverASource(event: any): void {
        for (const item of event.items) {
            item._enTarget = false;
        }
    }

    onMoverTodosASource(): void {
        for (const item of this.productosDisponibles) {
            item._enTarget = false;
        }
    }

    toggleTipoAcceso(item: ProductoPickItem): void {
        item.clTipoAcceso = item.clTipoAcceso === 'VISIBLE' ? 'EXCLUSIVO' : 'VISIBLE';
    }

    guardarCambios(): void {
        const nuevos = this.productosAsignados.filter(
            p => !this.originalAsignados.some(o => o.idProducto === p.idProducto)
        );

        const cambiados = this.productosAsignados.filter(p => {
            const original = this.originalAsignados.find(o => o.idProducto === p.idProducto);

            return original && original.clTipoAcceso !== p.clTipoAcceso;
        });

        const revocados = this.originalAsignados.filter(
            o => !this.productosAsignados.some(p => p.idProducto === o.idProducto)
        );

        const toAssign = [...nuevos, ...cambiados];

        if (toAssign.length === 0 && revocados.length === 0) {
            this.messageService.add({ severity: 'info', summary: 'Sin cambios', detail: 'No hay cambios pendientes para guardar.', life: 3000 });

            return;
        }

        this.confirmationService.confirm({
            message: this.buildResumenCambios(nuevos.length, cambiados.length, revocados.length),
            header: 'Confirmar cambios de visibilidad',
            icon: 'pi pi-question-circle',
            acceptLabel: 'Sí, guardar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.ejecutarGuardado(toAssign, revocados);
            }
        });
    }

    private buildResumenCambios(nuevos: number, cambiados: number, revocados: number): string {
        const partes: string[] = [];

        if (nuevos > 0) partes.push(`<b>${nuevos}</b> producto(s) serán asignados`);
        if (cambiados > 0) partes.push(`<b>${cambiados}</b> producto(s) cambiarán tipo de acceso`);
        if (revocados > 0) partes.push(`<b>${revocados}</b> producto(s) serán revocados`);

        return '¿Desea aplicar los siguientes cambios?<br><br>' + partes.join('<br>');
    }

    private ejecutarGuardado(toAssign: ProductoPickItem[], revocados: ProductoPickItem[]): void {
        this.saving.set(true);
        const observables: Observable<any>[] = [];

        if (toAssign.length > 0) {
            const grupos = toAssign.reduce((acc, p) => {
                if (!acc[p.clTipoAcceso]) acc[p.clTipoAcceso] = [];
                acc[p.clTipoAcceso].push(p.idProducto);

                return acc;
            }, {} as Record<string, string[]>);

            for (const tipoAcceso in grupos) {
                const payload = {
                    idCliente: this.clienteSeleccionadoId,
                    idsProductos: grupos[tipoAcceso].filter(id => !!id),
                    clTipoAcceso: tipoAcceso
                };

                observables.push(this.apiService.asignarVisibilidadBulk(payload));
            }
        }

        for (const r of revocados) {
            observables.push(this.apiService.removerVisibilidad(this.clienteSeleccionadoId, r.idProducto));
        }

        if (observables.length === 0) {
            this.saving.set(false);

            return;
        }

        forkJoin(observables).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                const msgs: string[] = [];

                if (toAssign.length > 0) msgs.push(`${toAssign.length} producto(s) asignado(s)`);
                if (revocados.length > 0) msgs.push(`${revocados.length} producto(s) revocado(s)`);

                this.messageService.add({
                    severity: 'success',
                    summary: 'Cambios guardados',
                    detail: msgs.join(' y ') + '.',
                    life: 4000
                });
                this.saving.set(false);
                this.cargarPickList();
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron guardar todos los cambios.', life: 5000 });
            }
        });
    }
}
