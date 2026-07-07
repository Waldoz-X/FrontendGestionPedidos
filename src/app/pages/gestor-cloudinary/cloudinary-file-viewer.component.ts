import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { CloudinaryApiService } from '../service/cloudinary-api.service';
import { CloudinaryFolder, CloudinaryResource } from '../service/cloudinary-api.types';
import { FormsModule } from '@angular/forms';

/**
 * Componente para ver y gestionar archivos en una carpeta de Cloudinary
 * Permite copiar URLs, descargar y eliminar archivos
 */
@Component({
  selector: 'p-cloudinary-file-viewer',
  standalone: true,
  imports: [
    TableModule,
    ButtonModule,
    InputIconModule,
    IconFieldModule,
    InputTextModule,
    ConfirmDialogModule,
    SkeletonModule,
    TooltipModule,
    DialogModule,
    FormsModule
],
  providers: [ConfirmationService],
  template: `
    <p-confirmDialog />

    <div class="p-4">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
          <i class="pi pi-images mr-2"></i>Archivos
        </h2>
        <p-button
          icon="pi pi-refresh"
          [rounded]="true"
          [text]="true"
          (click)="loadResources()"
          [disabled]="isLoading"
          pTooltip="Recargar archivos"
          tooltipPosition="left"
        ></p-button>
      </div>

      <!-- Alerta si no hay carpeta seleccionada -->
      @if (!selectedFolder) {
        <div class="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-yellow-700 dark:text-yellow-400">
          <i class="pi pi-exclamation-triangle mr-2"></i>
          <span>Selecciona una carpeta en el tab "Explorador de Carpetas" para ver sus archivos</span>
        </div>
      }

      <!-- Búsqueda y filtros -->
      @if (selectedFolder) {
        <div class="mb-4">
          <p-iconfield>
            <p-inputicon styleClass="pi pi-search" />
            <input
              pInputText
              type="text"
              [(ngModel)]="searchValue"
              (ngModelChange)="filterResources()"
              placeholder="Buscar por nombre..."
              class="w-full"
            />
          </p-iconfield>
        </div>
      }

      <!-- Estado de carga -->
      @if (isLoading && selectedFolder) {
        <div class="space-y-3">
          <p-skeleton height="3rem"></p-skeleton>
          <p-skeleton height="3rem"></p-skeleton>
          <p-skeleton height="3rem"></p-skeleton>
        </div>
      }
      <!-- Tabla de archivos -->
      @if (!isLoading && selectedFolder && filteredResources.length > 0) {
        <div class="overflow-x-auto">
          <p-table
            [value]="filteredResources"
            [paginator]="true"
            [rows]="10"
            [tableStyle]="{ 'min-width': '50rem' }"
            responsiveLayout="scroll"
            [globalFilterFields]="['original_filename', 'format']"
            [rowsPerPageOptions]="[5, 10, 20]"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} archivos"
            [showCurrentPageReport]="true"
            styleClass="p-datatable-striped"
          >
            <ng-template #header>
              <tr>
                <th style="width: 15%">Vista previa</th>
                <th style="width: 35%" pSortableColumn="original_filename">Nombre <p-sortIcon field="original_filename"></p-sortIcon></th>
                <th style="width: 15%">Tamaño</th>
                <th style="width: 20%" pSortableColumn="created_at">Fecha <p-sortIcon field="created_at"></p-sortIcon></th>
                <th style="width: 15%">Acciones</th>
              </tr>
            </ng-template>

            <ng-template #body let-resource>
              <tr>
                <td>
                  <img
                    [src]="resource.secure_url"
                    alt="{{ resource.original_filename }}"
                    class="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-75 transition"
                    (click)="viewImage(resource)"
                    [pTooltip]="'Click para ver en grande'"
                    tooltipPosition="top"
                  />
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-file-image text-blue-500"></i>
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ resource.original_filename || resource.public_id.split('/').pop() }}
                    </span>
                  </div>
                </td>
                <td>
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {{ formatFileSize(resource.bytes) }}
                  </span>
                </td>
                <td>
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {{ formatDate(resource.created_at) }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2 flex-wrap">
                    <p-button
                      icon="pi pi-copy"
                      [rounded]="true"
                      [text]="true"
                      [severity]="'secondary'"
                      (click)="copyUrl(resource.secure_url)"
                      pTooltip="Copiar URL"
                      tooltipPosition="top"
                    ></p-button>
                    <p-button
                      icon="pi pi-download"
                      [rounded]="true"
                      [text]="true"
                      [severity]="'info'"
                      (click)="downloadFile(resource)"
                      pTooltip="Descargar"
                      tooltipPosition="top"
                    ></p-button>
                    <p-button
                      icon="pi pi-trash"
                      [rounded]="true"
                      [text]="true"
                      [severity]="'danger'"
                      (click)="confirmDelete(resource)"
                      pTooltip="Eliminar"
                      tooltipPosition="top"
                    ></p-button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }

      <!-- Estado vacío -->
      @if (!isLoading && selectedFolder && filteredResources.length === 0) {
        <div class="text-center py-12">
          <i class="pi pi-inbox text-gray-300 dark:text-gray-700 text-5xl mb-4"></i>
          <p class="text-gray-600 dark:text-gray-400">
            {{ searchValue ? 'No se encontraron archivos que coincidan' : 'Esta carpeta está vacía' }}
          </p>
        </div>
      }

      <!-- Error -->
      @if (errorMessage) {
        <div class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-red-700 dark:text-red-400">
          <i class="pi pi-exclamation-triangle mr-2"></i>
          {{ errorMessage }}
        </div>
      }
    </div>

    <p-dialog
      [(visible)]="displayModal"
      [header]="selectedImageFile?.original_filename || selectedImageFile?.public_id?.split('/')?.pop()"
      [modal]="true"
      [style]="{ width: '90vw', 'max-width': '80rem' }"
      [maximizable]="true"
      styleClass="p-dialog-maximized"
    >
      <div class="text-center">
        @if (selectedImageFile) {
          <img
            [src]="selectedImageFile.secure_url"
            alt="{{ selectedImageFile.original_filename || selectedImageFile.public_id }}"
            class="max-w-full max-h-[70vh] object-contain mx-auto"
          />
          <div class="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <p class="text-sm text-gray-700 dark:text-gray-300 break-all">
              {{ selectedImageFile.secure_url }}
            </p>
            <p-button
              label="Copiar URL"
              icon="pi pi-copy"
              (click)="copyUrl(selectedImageFile.secure_url)"
              class="mt-3"
            ></p-button>
          </div>
        }
      </div>
    </p-dialog>
  `
})
export class CloudinaryFileViewerComponent implements OnChanges {
  private cloudinaryApi = inject(CloudinaryApiService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  @Input() selectedFolder: CloudinaryFolder | null = null;
  @Output() fileDeleted = new EventEmitter<string>();

  resources: CloudinaryResource[] = [];
  filteredResources: CloudinaryResource[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  searchValue = '';

  displayModal = false;
  selectedImageFile: CloudinaryResource | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedFolder'] && this.selectedFolder) {
      this.loadResources();
    }
  }

  loadResources(): void {
    if (!this.selectedFolder) return;

    this.isLoading = true;
    this.errorMessage = null;

    this.cloudinaryApi.listResources(this.selectedFolder.path).subscribe({
      next: (resources) => {
        // Sort by date descending (newest first)
        this.resources = (resources || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        this.filterResources();
        this.isLoading = false;
        this.messageService.add({
          severity: 'info',
          summary: 'Archivos cargados',
          detail: `Se encontraron ${resources.length} archivos`,
          life: 2000
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error al cargar los archivos. Intenta nuevamente.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.errorMessage,
          life: 4000
        });
        console.error('Error loading resources:', err);
      }
    });
  }

  filterResources(): void {
    if (!this.searchValue) {
      this.filteredResources = this.resources;
    } else {
      const search = this.searchValue.toLowerCase();

      this.filteredResources = this.resources.filter(
        (r) => {
          const name = r.original_filename || r.public_id.split('/').pop() || '';

          return name.toLowerCase().includes(search) || r.format?.toLowerCase().includes(search);
        }
      );
    }
  }

  copyUrl(url: string): void {
    if (!url) return;

    navigator.clipboard.writeText(url).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'URL copiada',
        detail: 'La URL se copió al portapapeles',
        life: 2000
      });
    });
  }

  downloadFile(resource: CloudinaryResource): void {
    const link = document.createElement('a');

    link.href = resource.secure_url;
    link.download = resource.original_filename || 'download';
    link.click();
  }

  confirmDelete(resource: CloudinaryResource): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar "${resource.original_filename}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteFile(resource);
      }
    });
  }

  deleteFile(resource: CloudinaryResource): void {
    this.cloudinaryApi.deleteResource(resource.public_id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Archivo eliminado',
          detail: `"${resource.original_filename}" fue eliminado exitosamente`,
          life: 3000
        });
        this.fileDeleted.emit(resource.original_filename || resource.public_id);
        this.loadResources();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al eliminar el archivo. Intenta nuevamente.',
          life: 4000
        });
        console.error('Error deleting file:', err);
      }
    });
  }

  viewImage(resource: CloudinaryResource): void {
    this.selectedImageFile = resource;
    this.displayModal = true;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);

      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }
}


