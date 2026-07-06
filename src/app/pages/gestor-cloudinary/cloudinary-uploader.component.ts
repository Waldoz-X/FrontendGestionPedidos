import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { CloudinaryApiService } from '../service/cloudinary-api.service';
import { CloudinaryFolder } from '../service/cloudinary-api.types';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { NgClass } from '@angular/common';

interface UploadedFile {
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  rawFile?: File;
}

/**
 * Componente para subir imágenes a Cloudinary
 * Soporta drag & drop y múltiples archivos
 */
@Component({
  selector: 'p-cloudinary-uploader',
  standalone: true,
  imports: [CommonModule, FileUploadModule, ButtonModule, ProgressBarModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4">
      <div class="mb-4">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
          <i class="pi pi-upload mr-2"></i>Subir Imágenes
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Arrastra imágenes aquí o haz clic para seleccionar. Máximo 10MB por archivo.
        </p>
      </div>

      <!-- Alerta si no hay carpeta seleccionada -->
      @if (!selectedFolder) {
        <div class="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-yellow-700 dark:text-yellow-400">
          <i class="pi pi-exclamation-triangle mr-2"></i>
          <span>Selecciona una carpeta primero en el tab "Explorador de Carpetas" para subir imágenes</span>
        </div>
      }

      <!-- Uploader -->
      @if (selectedFolder) {
        <div class="mb-6">
          <p-fileupload
            #uploader
            name="demo[]"
            [multiple]="true"
            accept="image/*"
            [maxFileSize]="10485760"
            [customUpload]="true"
            (onSelect)="onSelect($event)"
            (onRemove)="onRemove($event)"
            (onClear)="onClear()"
            [showUploadButton]="false"
            [showCancelButton]="false"
            mode="advanced"
            [auto]="false"
            [disabled]="isUploading"
            chooseStyleClass="text-center"
          >
            <ng-template #empty>
              <div class="p-8 text-center">
                <i class="pi pi-cloud-upload text-gray-300 dark:text-gray-700 text-5xl mb-4"></i>
                <p class="text-lg text-gray-600 dark:text-gray-400">
                  Arrastra y suelta imágenes aquí, o haz clic para seleccionar
                </p>
              </div>
            </ng-template>
          </p-fileupload>
        </div>
      }

      <!-- Lista de archivos seleccionados -->
      @if (selectedFiles.length > 0) {
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Archivos seleccionados ({{ selectedFiles.length }})
            </h3>
            <p-button
              label="Subir todos"
              icon="pi pi-upload"
              [disabled]="isUploading"
              (click)="uploadAllFiles()"
              pTooltip="Inicia la carga de todos los archivos"
              tooltipPosition="left"
            ></p-button>
          </div>

          <div class="space-y-3">
            @for (file of selectedFiles; track file.name) {
              <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-3 flex-1">
                    <i
                      [ngClass]="{
                        'pi pi-file-image': file.status !== 'error',
                        'pi pi-exclamation-circle text-red-500': file.status === 'error'
                      }"
                      class="text-xl"
                    ></i>
                    <div class="flex-1">
                      <p class="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {{ file.name }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ formatFileSize(file.size) }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      [ngClass]="{
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300':
                          file.status === 'pending',
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300':
                          file.status === 'uploading',
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300':
                          file.status === 'success',
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300':
                          file.status === 'error'
                      }"
                      class="px-3 py-1 rounded-full text-xs font-semibold"
                    >
                      {{ getStatusLabel(file.status) }}
                    </span>
                    @if ((file.status === 'pending' || file.status === 'error') && !isUploading) {
                      <p-button
                        icon="pi pi-times"
                        [text]="true"
                        [rounded]="true"
                        severity="danger"
                        (click)="removeFileFromList(file)"
                        pTooltip="Quitar de la lista"
                        class="w-8 h-8"
                      ></p-button>
                    }
                  </div>
                </div>

                <!-- Barra de progreso -->
                @if (file.status === 'uploading') {
                  <div class="mt-2">
                    <p-progressBar [value]="file.progress" [showValue]="true" class="mb-2"></p-progressBar>
                  </div>
                }

                <!-- Mensaje de error -->
                @if (file.status === 'error' && file.error) {
                  <div class="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-red-700 dark:text-red-400 text-xs">
                    {{ file.error }}
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Estado vacío -->
      @if (selectedFiles.length === 0 && !isUploading) {
        <div class="text-center py-8">
          <i class="pi pi-inbox text-gray-300 dark:text-gray-700 text-4xl mb-3"></i>
          <p class="text-gray-600 dark:text-gray-400">Ningún archivo seleccionado</p>
        </div>
      }
    </div>
  `
})
export class CloudinaryUploaderComponent {
  private cloudinaryApi = inject(CloudinaryApiService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('uploader') uploader?: FileUpload;

  @Input() selectedFolder: CloudinaryFolder | null = null;
  @Output() uploadComplete = new EventEmitter<string>();

  selectedFiles: UploadedFile[] = [];
  isUploading = false;

  onSelect(event: any): void {
    for (const file of event.files) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Tipo no válido',
          detail: `${file.name} no es una imagen. Solo se permiten imágenes.`,
          life: 4000
        });
        continue;
      }

      // Validar tamaño (10MB)
      if (file.size > 10485760) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Archivo muy grande',
          detail: `${file.name} supera los 10MB permitidos.`,
          life: 4000
        });
        continue;
      }

      // Agregar a la lista con referencia al archivo original
      this.selectedFiles.push({
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'pending',
        error: undefined,
        rawFile: file
      });
    }
    this.cdr.markForCheck();
  }

  onRemove(event: any): void {
    const file = event.file;
    this.selectedFiles = this.selectedFiles.filter(f => f.name !== file.name);
    this.cdr.markForCheck();
  }

  onClear(): void {
    this.selectedFiles = [];
    this.cdr.markForCheck();
  }

  removeFileFromList(file: UploadedFile): void {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
    if (this.uploader && file.rawFile) {
      const idx = this.uploader.files.indexOf(file.rawFile);
      if (idx !== -1) {
        this.uploader.remove({} as Event, idx);
      }
    }
    this.cdr.markForCheck();
  }

  uploadAllFiles(): void {
    if (!this.selectedFolder) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Selecciona una carpeta primero',
        life: 3000
      });

      return;
    }

    this.isUploading = true;
    let uploadedCount = 0;
    let errorCount = 0;

    this.selectedFiles.forEach((file) => {
      if (file.status !== 'pending') {
        return;
      }

      file.status = 'uploading';
      this.cdr.markForCheck();

      // Simulamos el progreso mientras se carga
      const progressInterval = setInterval(() => {
        if (file.progress < 90) {
          file.progress += Math.random() * 40;
          this.cdr.markForCheck();
        }
      }, 200);

       if (!file.rawFile) {
         file.status = 'error';
         file.error = 'Archivo no encontrado';
         errorCount++;
         clearInterval(progressInterval);
         this.cdr.markForCheck();
         return;
       }

      const actualFile = file.rawFile;

      this.cloudinaryApi.uploadImage(actualFile, this.selectedFolder!.path).subscribe({
        next: () => {
          clearInterval(progressInterval);
          file.progress = 100;
          file.status = 'success';
          uploadedCount++;
          this.uploadComplete.emit(file.name);

           // Si todos los archivos se completaron
           if (uploadedCount + errorCount === this.selectedFiles.length) {
             this.isUploading = false;

             this.showUploadSummary(uploadedCount, errorCount);

             if (uploadedCount > 0) {
               this.selectedFiles = [];
               if (this.uploader) {
                 this.uploader.clear();
               }
             }
           }
           this.cdr.markForCheck();
        },
        error: (error) => {
          clearInterval(progressInterval);
          file.status = 'error';
          file.error = error?.error?.message || 'Error desconocido en la carga';
          errorCount++;

          if (uploadedCount + errorCount === this.selectedFiles.length) {
            this.isUploading = false;
            this.showUploadSummary(uploadedCount, errorCount);
            if (uploadedCount > 0) {
              this.selectedFiles = this.selectedFiles.filter(f => f.status === 'error');
            }
          }
          this.cdr.markForCheck();
        }
      });
    });
  }

  private showUploadSummary(uploadedCount: number, errorCount: number): void {
    if (uploadedCount > 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Carga completada',
        detail: `${uploadedCount} archivo(s) subido(s) exitosamente`,
        life: 4000
      });
    }

    if (errorCount > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errores en la carga',
        detail: `${errorCount} archivo(s) fallaron`,
        life: 4000
      });
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      uploading: 'Subiendo...',
      success: 'Exitoso',
      error: 'Error'
    };

    return labels[status] || status;
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
}



