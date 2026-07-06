# 📱 Módulo Gestor de Imágenes Cloudinary

## Descripción
Módulo completo de Angular 21 para gestionar imágenes en Cloudinary con explorador de carpetas, subida de archivos y copia de URLs. Distribuido en componentes standalone con PrimeNG e integración segura con backend.

## 🎯 Características

✅ **Explorador de Carpetas** — Visualiza la estructura de carpetas en Cloudinary  
✅ **Subida de Imágenes** — Drag & drop con progreso de carga  
✅ **Visor de Archivos** — DataTable con búsqueda, paginación y acciones  
✅ **Copiar URLs** — Copia URLs seguras de Cloudinary al clipboard  
✅ **Descargar** — Descarga archivos directamente  
✅ **Eliminar** — Elimina archivos con confirmación  
✅ **Validación** — Límites de tamaño (10MB) y tipo de archivo  
✅ **Seguridad** — Credenciales protegidas en backend, autenticación JWT  

## 📁 Estructura del Proyecto

```
src/app/pages/
├── gestor-cloudinary/
│   ├── gestor-cloudinary.component.ts              # Componente principal (tabs)
│   ├── cloudinary-folder-explorer.component.ts    # Explorador de carpetas
│   ├── cloudinary-uploader.component.ts           # Subidor con drag & drop
│   └── cloudinary-file-viewer.component.ts        # Visor de archivos (DataTable)
│
└── service/
    ├── cloudinary-api.service.ts                  # Servicio HTTP a backend
    └── cloudinary-api.types.ts                    # Tipos por TypeScript
```

## 🚀 Instalación y Uso

### 1. Acceder al Módulo

Navega a la ruta:
```
http://localhost:4200/pages/gestor-cloudinary
```

O en el menú lateral (si está agregado):
```
Panel Admin > Gestor Cloudinary
```

### 2. Explorador de Carpetas

1. Ve al tab **"Explorador de Carpetas"**
2. Se cargarán automáticamente todas las carpetas de tu cuenta Cloudinary
3. Para cada carpeta verás:
   - Nombre de la carpeta
   - Cantidad de archivos dentro
   - Botón "Ver" para seleccionar

### 3. Subir Imágenes

1. Selecciona una carpeta en el Explorador
2. Ve al tab **"Subir Imágenes"**
3. Arrastra imágenes o haz click para seleccionar
4. Soporta múltiples archivos a la vez
5. Click en **"Subir todos"** para iniciar la carga
6. Observa el progreso en tiempo real

**Limitaciones:**
- Máximo 10MB por archivo
- Solo imágenes (.jpg, .png, .gif, .webp)

### 4. Ver y Gestionar Archivos

1. Selecciona una carpeta en el Explorador
2. Ve al tab **"Ver Archivos"**
3. Se muestra una tabla con todos los archivos
4. Funcionalidades por archivo:
   - **👁️ Thumbnail** — Click para ver en grande
   - **📋 Copiar URL** — Copia URL segura al clipboard
   - **⬇️ Descargar** — Descarga el archivo
   - **🗑️ Eliminar** — Elimina el archivo (con confirmación)

5. **Búsqueda** — Filtra archivos por nombre
6. **Paginación** — Establece cuántos archivos mostrar por página

## 🔌 Integración Backend

El módulo espera que el backend (.NET) exponga estos endpoints bajo `/api/Cloudinary`:

### Endpoints Requeridos

#### 1. `GET /api/Cloudinary/folders`
Retorna lista de carpetas top-level de Cloudinary.

**Response:**
```json
[
  {
    "name": "productos",
    "path": "productos",
    "fileCount": 15,
    "lastModified": "2024-06-22T10:30:00Z"
  },
  {
    "name": "guantes",
    "path": "guantes",
    "fileCount": 8,
    "lastModified": "2024-06-20T14:15:00Z"
  }
]
```

#### 2. `GET /api/Cloudinary/resources?prefix={folder}`
Retorna archivos en una carpeta específica.

**Query Parameters:**
- `prefix` (string) — Ruta de la carpeta (ej: `"productos/2024"`)

**Response:**
```json
[
  {
    "public_id": "productos/image_abc123",
    "resource_type": "image",
    "type": "upload",
    "created_at": "2024-06-22T10:30:00Z",
    "bytes": 524288,
    "width": 1920,
    "height": 1080,
    "url": "http://res.cloudinary.com/...",
    "secure_url": "https://res.cloudinary.com/...",
    "folder": "productos",
    "tags": ["producto", "2024"],
    "original_filename": "imagen-producto.jpg",
    "format": "jpg"
  }
]
```

#### 3. `POST /api/Cloudinary/upload`
Sube una imagen a Cloudinary.

**Request:**
```
multipart/form-data:
  - File: <binary image>
  - Folder: "productos"
  - Tags: (opcional) "tag1,tag2"
```

**Response:**
```json
{
  "public_id": "productos/xyz789def456",
  "version": 1719058200,
  "signature": "...",
  "width": 1920,
  "height": 1080,
  "format": "jpg",
  "resource_type": "image",
  "created_at": "2024-06-22T10:30:00Z",
  "tags": [],
  "bytes": 524288,
  "type": "upload",
  "etag": "...",
  "placeholder": false,
  "url": "http://res.cloudinary.com/...",
  "secure_url": "https://res.cloudinary.com/...",
  "folder": "productos",
  "original_filename": "nueva-imagen.jpg",
  "api_key": "599196524587627"
}
```

#### 4. `DELETE /api/Cloudinary/resources/{publicId}`
Elimina un recurso de Cloudinary.

**Path Parameters:**
- `publicId` (string) — ID público del recurso (URL-encoded, ej: `"productos%2Fimage_abc123"`)

**Response:**
```json
{
  "success": true,
  "message": "Recurso eliminado exitosamente"
}
```

#### 5. `GET /api/Cloudinary/folders/{folder}/stats`
Retorna estadísticas de una carpeta.

**Path Parameters:**
- `folder` (string) — Ruta de la carpeta (URL-encoded)

**Response:**
```json
{
  "folder": "productos",
  "fileCount": 15,
  "totalSize": 52428800,
  "totalSizeFormatted": "50 MB"
}
```

## 🔐 Seguridad

✅ **Credenciales Protegidas** — API Key y Secret nunca se exponen al frontend  
✅ **Autenticación JWT** — Todos los endpoints requieren token válido  
✅ **Autorización por Rol** — Solo Admin/Comercial pueden subir/eliminar  
✅ **Validación Frontend** — Límites de tamaño y tipo de archivo  
✅ **Validación Backend** — Re-validación en servidor  

## ⚙️ Configuración

### Variables de Entorno (`.env`)

```env
API_TARGET=https://localhost:7140
API_BASE=/api
CLOUDINARY_APIKEY=599196524587627
CLOUDINARY_APISECRET=EDM9qblt9a7mRyV7sae1wWVDCUw
```

### Config Dinámica (`src/assets/app-config.json`)

```json
{
  "apiBase": "/api",
  "cloudinaryCloudName": "dvqppegcf"
}
```

## 🎨 Personalización

### Cambiar Colores

Edita las clases de Tailwind en los componentes:
```html
<!-- Primario (azul) -->
<div class="bg-blue-100 dark:bg-blue-900/30 text-blue-700"></div>

<!-- Éxito (verde) -->
<div class="bg-green-100 text-green-700"></div>

<!-- Peligro (rojo) -->
<div class="bg-red-100 text-red-700"></div>
```

### Cambiar Límite de Tamaño

En `cloudinary-uploader.component.ts`:
```typescript
// Línea ~35: Cambiar maxFileSize
[maxFileSize]="10485760"  // 10MB (10 * 1024 * 1024)

// O en validación:
if (file.size > 10485760) { // Cambiar a tu límite
  // ...
}
```

### Cambiar Extensiones Permitidas

En `cloudinary-uploader.component.ts`:
```typescript
// Cambiar el accept en p-fileupload:
accept="image/*"  // Solo imágenes
// O más específico:
accept=".jpg,.jpeg,.png,.gif,.webp"
```

## 🐛 Resolución de Problemas

### "No hay carpetas disponibles"

**Posibles causas:**
1. Backend no está ejecutándose
2. No hay carpetas creadas en Cloudinary
3. Las credenciales son incorrectas

**Solución:**
- Verifica que el backend está en `https://localhost:7140`
- Verifica credenciales de Cloudinary en `appsettings.json`
- Crea una carpeta en Cloudinary manualmente

### "Error al cargar los archivos"

**Posibles causas:**
1. Token JWT expirado
2. Usuario sin permisos
3. Error en el endpoint del backend

**Solución:**
- Re-inicia sesión
- Verifica que el usuario tiene rol Admin/Comercial
- Revisa logs del backend

### "Archivo no se sube"

**Posibles causas:**
1. Archivo supera 10MB
2. Formato no permitido
3. Carpeta no existe en Cloudinary

**Solución:**
- Verifica tamaño del archivo (máx 10MB)
- Usa solo imágenes (.jpg, .png, .gif, .webp)
- Asegúrate de que la carpeta existe

## 📚 Dependencias

- **Angular** 21.0.0
- **PrimeNG** 21.0.2
- **RxJS** 7.8.0
- **Tailwind CSS** 4.1.11

## 🔗 Referencias

- [Documentación Cloudinary SDK](https://cloudinary.com/documentation/dotnet_integration)
- [Documentación PrimeNG](https://primeng.org/)
- [Documentación Angular](https://angular.dev/)

## 📝 Notas

- El módulo usa [Change Detection OnPush](https://angular.dev/guide/change-detection) en el uploader para mejor rendimiento
- Todos los componentes son [standalone](https://angular.dev/guide/standalone-components)
- Compatible con tema dark mode de PrimeNG
- Responsive design con Tailwind CSS
- URLs se copian de forma segura a clipboard

## 🤝 Contribuciones

Para agregar nuevas funcionalidades:

1. Crea un nuevo componente en `src/app/pages/gestor-cloudinary/`
2. Agrega nuevos métodos en `cloudinary-api.service.ts`
3. Actualiza tipos en `cloudinary-api.types.ts`
4. Importa en `gestor-cloudinary.component.ts`

## 📄 Licencia

Este módulo es parte del proyecto FrontendGestionPedidos.

---

**última actualización**: 2026-06-22  
**versión**: 1.0.0

