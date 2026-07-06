import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';

import { ProductoGuante, VarianteNestedDto, SkuNestedDto } from '../service/productos-guante/productos-guante-api.types';
import { ProductosGuanteApiService } from '../service/productos-guante/productos-guante-api.service';
import { CatalogosApiService, CatalogoElemento } from '../service/catalogos-api.service';

@Component({
    selector: 'app-guantes-visor',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        CardModule,
        DialogModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        TagModule,
        ToastModule,
        TooltipModule,
        PaginatorModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="card p-6">
            <!-- ═══ HEADER & SEARCH ═══ -->
            <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                <div>
                    <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Visor de Guantes</h2>
                    <p class="text-surface-500 dark:text-surface-400 mt-1">Explora visualmente el catálogo de guantes y variantes.</p>
                </div>
                <div class="w-full md:w-80">
                    <p-iconfield styleClass="w-full">
                        <p-inputicon styleClass="pi pi-search" />
                        <input 
                            pInputText 
                            type="text" 
                            [(ngModel)]="searchQuery" 
                            (ngModelChange)="onSearchChange()"
                            placeholder="Buscar por código, modelo, color..." 
                            class="w-full"
                        />
                    </p-iconfield>
                </div>
            </div>

            <!-- ═══ GRID DE GUANTES ═══ -->
            @if (loading()) {
                <div class="flex justify-center items-center py-12">
                    <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
                    <span class="ml-3 text-lg text-surface-500">Cargando catálogo...</span>
                </div>
            } @else {
                @if (filteredGuantes().length === 0) {
                    <div class="text-center py-12 border rounded-lg border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
                        <i class="pi pi-box text-5xl text-surface-400 mb-3"></i>
                        <p class="text-surface-600 dark:text-surface-400 text-lg font-semibold">No se encontraron guantes que coincidan con la búsqueda.</p>
                    </div>
                } @else {
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        @for (guante of paginatedGuantes(); track guante.id || guante.clProducto) {
                            <div 
                                class="group relative bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col h-full"
                                (click)="abrirDetalle(guante)"
                            >
                                <!-- Imagen Cloudinary Mini -->
                                <div class="relative bg-surface-100 dark:bg-surface-955 aspect-square flex items-center justify-center overflow-hidden border-b border-surface-150 dark:border-surface-850">
                                    <img 
                                        [src]="getImagenMini(guante)" 
                                        [alt]="guante.nbProducto" 
                                        class="object-contain h-48 w-full p-4 transform group-hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                        (error)="onImgError($event)"
                                    />
                                    
                                    <div class="absolute top-3 right-3 flex flex-col gap-1.5">
                                        <p-tag 
                                            [value]="guante.clEstatusProducto === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO'" 
                                            [severity]="guante.clEstatusProducto === 'ACTIVO' ? 'success' : 'danger'"
                                        />
                                        <p-tag 
                                            [value]="getCategoriaLabel(guante.idElemCategoria)" 
                                            severity="secondary"
                                        />
                                    </div>
                                </div>

                                <!-- Detalles del Card -->
                                <div class="p-4 flex flex-col flex-grow">
                                    <span class="text-xs font-mono font-bold text-primary dark:text-primary-400 uppercase tracking-wider">{{ guante.clProducto }}</span>
                                    <h3 class="text-lg font-bold text-surface-800 dark:text-surface-100 mt-1 line-clamp-1">{{ guante.nbProducto }}</h3>
                                    
                                    <div class="flex flex-col gap-2 mt-3 text-xs flex-grow">
                                        <div class="flex flex-col">
                                            <span class="text-surface-400 dark:text-surface-500 font-bold uppercase tracking-wider">Colores</span>
                                            <span class="text-sm font-semibold text-surface-800 dark:text-surface-200 mt-0.5 line-clamp-2">{{ getColoresDisponibles(guante) }}</span>
                                        </div>
                                        <div class="flex flex-col">
                                            <span class="text-surface-400 dark:text-surface-500 font-bold uppercase tracking-wider">Tallas</span>
                                            <span class="text-sm font-semibold text-surface-800 dark:text-surface-200 mt-0.5">{{ getTallasDisponibles(guante) }}</span>
                                        </div>
                                    </div>

                                    <!-- Línea divisoria y Precio/Stock -->
                                    <div class="border-t border-surface-100 dark:border-surface-800 pt-3 mt-4 flex items-center justify-between">
                                        <div class="flex flex-col">
                                            <span class="text-xs text-surface-400 dark:text-surface-500">Colección</span>
                                            <span class="text-sm font-semibold line-clamp-1">{{ getColeccionLabel(guante.idElemLineaColeccion) }}</span>
                                        </div>
                                        <div class="flex flex-col items-end">
                                            <span class="text-xs text-surface-400 dark:text-surface-505 font-medium">Stock Total</span>
                                            <p-tag 
                                                [value]="getStockTotal(guante) > 0 ? getStockTotal(guante) + ' pzs' : 'AGOTADO'"
                                                [severity]="getStockTotal(guante) > 0 ? (getStockTotal(guante) > 10 ? 'info' : 'warn') : 'danger'"
                                                styleClass="font-semibold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                    
                    <!-- Paginador -->
                    <div class="mt-6 flex justify-center">
                        <p-paginator 
                            [first]="first()" 
                            [rows]="rows()" 
                            [totalRecords]="filteredGuantes().length" 
                            [rowsPerPageOptions]="[8, 16, 24, 32]"
                            (onPageChange)="onPageChange($event)"
                        />
                    </div>
                }
            }
        </div>

        <!-- ═══ MODAL DETALLE DE GUANTE (CARD EXPANDIDO) ═══ -->
        <p-dialog
            [(visible)]="detalleVisible"
            [style]="{ width: '750px' }"
            [modal]="true"
            [header]="guanteSeleccionado()?.nbProducto || ''"
            [resizable]="false"
            [draggable]="false"
            styleClass="p-fluid rounded-2xl"
        >
            <ng-template #content>
                @if (guanteSeleccionado(); as guante) {
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 pb-2">
                        <!-- Lado izquierdo: Imagen grande -->
                        <div class="col-span-12 md:col-span-6 flex flex-col gap-4">
                            <div class="relative bg-surface-50 dark:bg-surface-955 aspect-square rounded-xl flex items-center justify-center overflow-hidden border border-surface-200 dark:border-surface-850 p-4 shadow-inner">
                                <img 
                                    [src]="getImagenVarianteActual()" 
                                    [alt]="guante.nbProducto" 
                                    class="object-contain max-h-[300px] w-full"
                                    (error)="onImgError($event)"
                                />
                                
                                @if (varianteSeleccionada(); as varAct) {
                                    <div class="absolute bottom-3 left-3 right-3 flex justify-between bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs">
                                        <span>Color: <strong>{{ getCombinacionName(varAct.idElemCombinacion) }}</strong></span>
                                        <span class="font-mono">{{ varAct.clEstatusVariante }}</span>
                                    </div>
                                }
                            </div>

                            <!-- Selector de Variantes (Carrusel de Miniaturas) -->
                            @if (guante.variantes && guante.variantes.length > 1) {
                                <div>
                                    <span class="block text-xs font-bold text-surface-505 uppercase tracking-wider mb-2">Variantes Disponibles</span>
                                    <div class="flex gap-2.5 overflow-x-auto pb-1">
                                        @for (v of guante.variantes; track $index; let idx = $index) {
                                            <button 
                                                class="w-14 h-14 rounded-lg overflow-hidden border-2 bg-surface-50 dark:bg-surface-900 transition-all p-1 flex items-center justify-center"
                                                [class.border-primary]="idx === varianteIdx()"
                                                [class.border-surface-200]="idx !== varianteIdx()"
                                                (click)="seleccionarVariante(idx)"
                                                [title]="getCombinacionName(v.idElemCombinacion)"
                                            >
                                                <img 
                                                    [src]="v.urlImagen || 'demo/images/product/product-placeholder.svg'" 
                                                    class="object-contain w-full h-full"
                                                    (error)="onImgError($event)"
                                                />
                                            </button>
                                        }
                                    </div>
                                </div>
                            }
                        </div>

                        <!-- Lado derecho: Ficha técnica y Tallas -->
                        <div class="col-span-12 md:col-span-6 flex flex-col gap-5">
                            <div>
                                <span class="text-xs font-mono font-bold text-primary dark:text-primary-400 uppercase tracking-wider block">{{ guante.clProducto }}</span>
                                <h3 class="text-2xl font-extrabold text-surface-900 dark:text-surface-50 mt-1">{{ guante.nbProducto }}</h3>
                                <p class="text-sm text-surface-500 mt-2 line-clamp-3 italic">
                                    {{ guante.dsComposicion || 'Sin descripción técnica disponible.' }}
                                </p>
                            </div>

                            <!-- Especificaciones Rápidas -->
                            <div class="grid grid-cols-2 gap-3 bg-surface-50 dark:bg-surface-955 p-4 rounded-xl border border-surface-200/60 dark:border-surface-800">
                                <div class="flex flex-col">
                                    <span class="text-xs text-surface-400 dark:text-surface-505 font-medium">Palma:</span>
                                    <span class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ guante.nbPalma || 'N/A' }}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-xs text-surface-400 dark:text-surface-505 font-medium">Índice Palma:</span>
                                    <span class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ guante.clIndicePalma || 'N/A' }}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-xs text-surface-400 dark:text-surface-505 font-medium">Cierre:</span>
                                    <span class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ guante.dsCierre || 'N/A' }}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-xs text-surface-400 dark:text-surface-505 font-medium">Forro:</span>
                                    <span class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ guante.dsForro || 'N/A' }}</span>
                                </div>
                            </div>

                            <!-- Tabla de Stock por Talla -->
                            <div>
                                <span class="block text-xs font-bold text-surface-505 uppercase tracking-wider mb-2">Desglose de Tallas (SKUs)</span>
                                @if (varianteSeleccionada(); as selectedVar) {
                                    @if (selectedVar.skus && selectedVar.skus.length > 0) {
                                        <div class="border border-surface-200 dark:border-surface-800 rounded-lg overflow-hidden shadow-sm">
                                            <table class="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr class="bg-surface-100 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-300 font-bold">
                                                        <th class="p-2">Talla</th>
                                                        <th class="p-2">Item Code</th>
                                                        <th class="p-2 text-right">Disponible</th>
                                                        <th class="p-2 text-right">Reservado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    @for (sku of selectedVar.skus; track sku.idSku || $index) {
                                                        <tr class="border-b border-surface-150 dark:border-surface-850 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
                                                            <td class="p-2 font-bold">{{ cleanTallaLabel(getTallaLabel(sku.idElemTalla)) }}</td>
                                                            <td class="p-2 font-mono text-surface-500">{{ sku.clItem || 'N/A' }}</td>
                                                            <td class="p-2 text-right font-semibold" [class.text-red-500]="sku.noStockDisponible <= 0">
                                                                {{ sku.noStockDisponible }}
                                                            </td>
                                                            <td class="p-2 text-right text-surface-500">
                                                                {{ sku.noStockReservado }}
                                                            </td>
                                                        </tr>
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                    } @else {
                                        <div class="text-center py-4 bg-surface-50 dark:bg-surface-900 border rounded-lg border-surface-200 dark:border-surface-800 text-surface-500">
                                            No hay tallas disponibles para este color.
                                        </div>
                                    }
                                }
                            </div>
                        </div>
                    </div>
                }
            </ng-template>
            <ng-template #footer>
                <div class="flex justify-end pt-2">
                    <p-button label="Cerrar" icon="pi pi-times" [text]="true" (onClick)="detalleVisible = false" />
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class GuantesVisor implements OnInit {
    private readonly apiService = inject(ProductosGuanteApiService);
    private readonly catalogosService = inject(CatalogosApiService);
    private readonly messageService = inject(MessageService);
    private readonly destroyRef = inject(DestroyRef);

    // --- State ---
    guantes = signal<ProductoGuante[]>([]);
    loading = signal<boolean>(false);
    searchQuery = signal<string>('');
    
    // --- Pagination State ---
    first = signal<number>(0);
    rows = signal<number>(8);

    // --- Mappings Cache ---
    categoriasMap = signal<Map<number, string>>(new Map());
    coleccionesMap = signal<Map<number, string>>(new Map());
    combinacionesMap = signal<Map<number, string>>(new Map());
    tallasMap = signal<Map<number, string>>(new Map());

    // --- Details Dialog State ---
    detalleVisible: boolean = false;
    guanteSeleccionado = signal<ProductoGuante | null>(null);
    varianteIdx = signal<number>(0);

    // --- Computed Filter ---
    filteredGuantes = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        const list = this.guantes();
        if (!query) return list;

        return list.filter(g => {
            const matchesCode = g.clProducto?.toLowerCase().includes(query);
            const matchesName = g.nbProducto?.toLowerCase().includes(query);
            const matchesPalma = g.nbPalma?.toLowerCase().includes(query);
            
            // Check if any variant combinations matches search
            const matchesColor = (g.variantes || []).some(v => {
                const combName = this.combinacionesMap().get(Number(v.idElemCombinacion)) || '';
                return combName.toLowerCase().includes(query);
            });

            return matchesCode || matchesName || matchesPalma || matchesColor;
        });
    });

    paginatedGuantes = computed(() => {
        const list = this.filteredGuantes();
        const start = this.first();
        const end = start + this.rows();
        return list.slice(start, end);
    });

    varianteSeleccionada = computed(() => {
        const guante = this.guanteSeleccionado();
        if (!guante || !guante.variantes || guante.variantes.length === 0) return null;
        const index = this.varianteIdx();
        return guante.variantes[index] || guante.variantes[0];
    });

    ngOnInit(): void {
        this.cargarCatalogos();
        this.cargarCatalogosMaestros();
    }

    cargarCatalogos(): void {
        this.loading.set(true);

        // Load all catalog elements for resolving names
        const loadToMap = (clCatalogo: string, mapSignal: any) => {
            this.catalogosService.getElementos(clCatalogo).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                next: (data: CatalogoElemento[]) => {
                    const newMap = new Map<number, string>();
                    (data || []).forEach(item => {
                        if (item.idCatalogoElemento !== undefined) {
                            newMap.set(Number(item.idCatalogoElemento), item.nbCatalogoElemento || item.clCatalogoElemento);
                        }
                    });
                    mapSignal.set(newMap);
                },
                error: (err) => console.error(`Error al cargar catálogo ${clCatalogo}:`, err)
            });
        };

        loadToMap('DIVISIONES', this.categoriasMap);
        loadToMap('LINEAS_COLECCION', this.coleccionesMap);
        loadToMap('COMBINACIONES', this.combinacionesMap);
        loadToMap('TALLAS', this.tallasMap);
    }

    cargarCatalogosMaestros(): void {
        this.apiService.getProductosGuantes().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (data) => {
                this.guantes.set(data);
                this.loading.set(false);
            },
            error: (err: HttpErrorResponse) => {
                this.loading.set(false);
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los guantes.', life: 5000 });
            }
        });
    }

    // --- Resolvers & Helpers ---
    getCategoriaLabel(id: number): string {
        return this.categoriasMap().get(Number(id)) || 'Adulto';
    }

    getColeccionLabel(id: number): string {
        return this.coleccionesMap().get(Number(id)) || 'General';
    }

    getCombinacionName(id: number): string {
        return this.combinacionesMap().get(Number(id)) || 'N/A';
    }

    getTallaLabel(id: number): string {
        return this.tallasMap().get(Number(id)) || id.toString();
    }

    getImagenMini(guante: ProductoGuante): string {
        if (guante.variantes && guante.variantes.length > 0) {
            const url = guante.variantes[0].urlImagen;
            if (!url) return 'demo/images/product/product-placeholder.svg';
            if (url.includes('cloudinary.com') && url.includes('/upload/')) {
                return url.replace('/upload/', '/upload/w_250,h_250,c_limit,q_auto,f_auto/');
            }
            return url;
        }
        return 'demo/images/product/product-placeholder.svg';
    }

    getColoresDisponibles(guante: ProductoGuante): string {
        if (!guante.variantes || guante.variantes.length === 0) return 'N/A';
        return guante.variantes
            .map(v => this.getCombinacionName(v.idElemCombinacion))
            .filter((value, index, self) => self.indexOf(value) === index)
            .join(', ');
    }

    cleanTallaLabel(label: string): string {
        if (!label) return '';
        return label
            .replace(/Talla\s+/i, '')
            .replace(/\s*-\s*\w+/g, '')
            .trim();
    }

    getTallasDisponibles(guante: ProductoGuante): string {
        if (!guante.variantes || guante.variantes.length === 0) return 'N/A';
        const allTallas: string[] = [];
        guante.variantes.forEach(v => {
            (v.skus || []).forEach(s => {
                const rawLabel = this.getTallaLabel(s.idElemTalla);
                const label = this.cleanTallaLabel(rawLabel);
                if (label && !allTallas.includes(label)) {
                    allTallas.push(label);
                }
            });
        });
        return allTallas.length > 0 ? allTallas.sort((a,b) => a.localeCompare(b, undefined, {numeric: true})).join(', ') : 'N/A';
    }

    getStockTotal(guante: ProductoGuante): number {
        let total = 0;
        (guante.variantes || []).forEach(v => {
            (v.skus || []).forEach(s => {
                total += s.noStockDisponible || 0;
            });
        });
        return total;
    }

    onImgError(event: any): void {
        event.target.src = 'demo/images/product/product-placeholder.svg';
    }

    onPageChange(event: any): void {
        this.first.set(event.first);
        this.rows.set(event.rows);
    }

    onSearchChange(): void {
        this.first.set(0);
    }

    // --- Details Modal Operations ---
    abrirDetalle(guante: ProductoGuante): void {
        this.guanteSeleccionado.set(guante);
        this.varianteIdx.set(0);
        this.detalleVisible = true;
    }

    seleccionarVariante(idx: number): void {
        this.varianteIdx.set(idx);
    }

    getImagenVarianteActual(): string {
        const selected = this.varianteSeleccionada();
        if (!selected || !selected.urlImagen) return 'demo/images/product/product-placeholder.svg';
        const url = selected.urlImagen;
        if (url.includes('cloudinary.com') && url.includes('/upload/')) {
            return url.replace('/upload/', '/upload/w_500,h_500,c_limit,q_auto,f_auto/');
        }
        return url;
    }
}
