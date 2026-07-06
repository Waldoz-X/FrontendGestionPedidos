# 🔌 Guía de Integración Backend - Módulo Cloudinary

## Introducción

Este documento explica cómo implementar los endpoints del backend (.NET 10) para soportar el Gestor de Imágenes de Cloudinary en el frontend Angular.

## 📋 Requisitos Previos

- **.NET 10** instalado
- **CloudinaryDotNet** NuGet package
- Credenciales de Cloudinary (CloudName, ApiKey, ApiSecret)
- Token JWT autenticado en requests

## 🔧 Implementación en Backend

### 1. Instalar NuGet Package

```bash
dotnet add package CloudinaryDotNet
```

### 2. Registrar Configuración en `appsettings.json`

```json
{
  "Cloudinary": {
    "CloudName": "dvqppegcf",
    "ApiKey": "599196524587627",
    "ApiSecret": "EDM9qblt9a7mRyV7sae1wWVDCUw"
  }
}
```

### 3. Crear DTOs (Contracts/Cloudinary/CloudinaryDtos.cs)

```csharp
using System;

namespace YourProject.Contracts.Cloudinary;

// Carpeta de Cloudinary
public record CloudinaryFolderDto(
    string Name,
    string Path,
    int FileCount,
    DateTime? LastModified
);

// Recurso (imagen/archivo)
public record CloudinaryResourceDto(
    string PublicId,
    string ResourceType,
    string Type,
    DateTime CreatedAt,
    long Bytes,
    int? Width,
    int? Height,
    string Url,
    string SecureUrl,
    string Folder,
    string[] Tags,
    string? OriginalFilename,
    string? Format
);

// Respuesta de subida
public record CloudinaryUploadResponseDto(
    string PublicId,
    int Version,
    string Signature,
    int Width,
    int Height,
    string Format,
    string ResourceType,
    DateTime CreatedAt,
    string[] Tags,
    long Bytes,
    string Type,
    string Etag,
    bool Placeholder,
    string Url,
    string SecureUrl,
    string Folder,
    string OriginalFilename,
    string ApiKey
);

// Estadísticas de carpeta
public record CloudinaryStatsDto(
    string Folder,
    int FileCount,
    long TotalSize,
    string TotalSizeFormatted
);

// Respuesta de eliminación
public record CloudinaryDeleteResponseDto(
    bool Success,
    string? Message
);
```

### 4. Crear Servicio (Services/CloudinaryService.cs)

```csharp
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using YourProject.Contracts.Cloudinary;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace YourProject.Services;

public interface ICloudinaryService
{
    Task<List<CloudinaryFolderDto>> ListFoldersAsync();
    Task<List<CloudinaryResourceDto>> ListResourcesAsync(string? prefix = null);
    Task<CloudinaryUploadResponseDto> UploadImageAsync(Stream fileStream, string fileName, string folder, string[]? tags = null);
    Task<CloudinaryDeleteResponseDto> DeleteResourceAsync(string publicId);
    Task<CloudinaryStatsDto> GetFolderStatsAsync(string folder);
}

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryService> _logger;

    public CloudinaryService(IConfiguration configuration, ILogger<CloudinaryService> logger)
    {
        _logger = logger;

        var cloudName = configuration["Cloudinary:CloudName"]
            ?? throw new InvalidOperationException("Cloudinary:CloudName no configurado");
        var apiKey = configuration["Cloudinary:ApiKey"]
            ?? throw new InvalidOperationException("Cloudinary:ApiKey no configurado");
        var apiSecret = configuration["Cloudinary:ApiSecret"]
            ?? throw new InvalidOperationException("Cloudinary:ApiSecret no configurado");

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
    }

    /// <summary>
    /// Lista todas las carpetas disponibles en Cloudinary
    /// </summary>
    public async Task<List<CloudinaryFolderDto>> ListFoldersAsync()
    {
        try
        {
            var result = await _cloudinary.ListFoldersAsync(new ListFoldersParams());
            var folders = result.Folders?
                .Select(f => new CloudinaryFolderDto(
                    Name: f.Name,
                    Path: f.Path,
                    FileCount: 0, // Será actualizado abajo
                    LastModified: DateTime.UtcNow
                ))
                .ToList() ?? new List<CloudinaryFolderDto>();

            // Para cada carpeta, contar sus recursos
            foreach (var folder in folders)
            {
                var resources = await ListResourcesAsync(folder.Path);
                folder = folder with { FileCount = resources.Count };
            }

            return folders;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al listar carpetas de Cloudinary");
            throw;
        }
    }

    /// <summary>
    /// Lista recursos (imágenes) dentro de una carpeta
    /// </summary>
    public async Task<List<CloudinaryResourceDto>> ListResourcesAsync(string? prefix = null)
    {
        try
        {
            var searchParams = new SearchParams();

            if (!string.IsNullOrEmpty(prefix))
            {
                searchParams.Expression = $"folder:{prefix}*";
            }

            searchParams.MaxResults = 500;

            var result = await _cloudinary.SearchAsync(searchParams);

            return result.Resources
                .Select(r => new CloudinaryResourceDto(
                    PublicId: r.PublicId,
                    ResourceType: r.ResourceType,
                    Type: r.Type,
                    CreatedAt: r.CreatedAt ?? DateTime.UtcNow,
                    Bytes: r.Bytes,
                    Width: r.Width,
                    Height: r.Height,
                    Url: r.SecureUrl ?? r.Url,
                    SecureUrl: r.SecureUrl ?? r.Url,
                    Folder: r.Folder ?? prefix ?? "",
                    Tags: r.Tags?.ToArray() ?? Array.Empty<string>(),
                    OriginalFilename: r.PublicId?.Split('/').Last() ?? "unknown",
                    Format: r.Format
                ))
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al listar recursos de Cloudinary");
            throw;
        }
    }

    /// <summary>
    /// Sube una imagen a Cloudinary
    /// </summary>
    public async Task<CloudinaryUploadResponseDto> UploadImageAsync(
        Stream fileStream, 
        string fileName, 
        string folder, 
        string[]? tags = null)
    {
        try
        {
            // Validaciones
            if (fileStream == null || fileStream.Length == 0)
            {
                throw new ArgumentException("El archivo está vacío");
            }

            if (fileStream.Length > 10 * 1024 * 1024) // 10MB
            {
                throw new ArgumentException("El archivo supera el límite de 10MB");
            }

            // Preparar upload
            var uploadParams = new RawUploadParams
            {
                File = new FileDescription(fileName, fileStream),
                Folder = folder,
                Tags = tags != null ? string.Join(",", tags) : null,
                Overwrite = false
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.StatusCode != System.Net.HttpStatusCode.OK)
            {
                throw new Exception($"Error en Cloudinary: {uploadResult.Error?.Message}");
            }

            return new CloudinaryUploadResponseDto(
                PublicId: uploadResult.PublicId,
                Version: uploadResult.Version,
                Signature: uploadResult.Signature,
                Width: uploadResult.Width,
                Height: uploadResult.Height,
                Format: uploadResult.Format,
                ResourceType: uploadResult.ResourceType,
                CreatedAt: uploadResult.CreatedAt ?? DateTime.UtcNow,
                Tags: uploadResult.Tags?.ToArray() ?? Array.Empty<string>(),
                Bytes: uploadResult.Bytes,
                Type: uploadResult.Type,
                Etag: uploadResult.Etag ?? "",
                Placeholder: uploadResult.IsPlaceholder,
                Url: uploadResult.Url,
                SecureUrl: uploadResult.SecureUrl,
                Folder: folder,
                OriginalFilename: fileName,
                ApiKey: uploadResult.ApiKey
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al subir imagen a Cloudinary");
            throw;
        }
    }

    /// <summary>
    /// Elimina un recurso de Cloudinary
    /// </summary>
    public async Task<CloudinaryDeleteResponseDto> DeleteResourceAsync(string publicId)
    {
        try
        {
            var deleteParams = new DelResParams { PublicIds = new List<string> { publicId } };
            var result = await _cloudinary.DeleteResourcesAsync(deleteParams);

            return new CloudinaryDeleteResponseDto(
                Success: result.Deleted.ContainsKey(publicId),
                Message: result.Deleted.ContainsKey(publicId) 
                    ? "Recurso eliminado exitosamente" 
                    : result.Error?.Message ?? "Error desconocido"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar recurso de Cloudinary");
            throw;
        }
    }

    /// <summary>
    /// Obtiene estadísticas de una carpeta
    /// </summary>
    public async Task<CloudinaryStatsDto> GetFolderStatsAsync(string folder)
    {
        try
        {
            var resources = await ListResourcesAsync(folder);
            var totalSize = resources.Sum(r => r.Bytes);
            var formattedSize = FormatBytes(totalSize);

            return new CloudinaryStatsDto(
                Folder: folder,
                FileCount: resources.Count,
                TotalSize: totalSize,
                TotalSizeFormatted: formattedSize
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener estadísticas de carpeta");
            throw;
        }
    }

    private static string FormatBytes(long bytes)
    {
        if (bytes == 0) return "0 Bytes";
        
        var units = new[] { "Bytes", "KB", "MB", "GB", "TB" };
        var k = 1024.0;
        var i = 0;
        var size = (double)bytes;

        while (size >= k && i < units.Length - 1)
        {
            size /= k;
            i++;
        }

        return $"{Math.Round(size, 2)} {units[i]}";
    }
}
```

### 5. Registrar Servicio en Program.cs

```csharp
// Agregar en Program.cs después de CreateBuilder
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
```

### 6. Crear Controlador (Controllers/CloudinaryController.cs)

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YourProject.Contracts.Cloudinary;
using YourProject.Services;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace YourProject.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Requiere autenticación JWT
public class CloudinaryController : ControllerBase
{
    private readonly ICloudinaryService _cloudinaryService;
    private readonly ILogger<CloudinaryController> _logger;

    public CloudinaryController(ICloudinaryService cloudinaryService, ILogger<CloudinaryController> logger)
    {
        _cloudinaryService = cloudinaryService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene lista de carpetas disponibles
    /// </summary>
    [HttpGet("folders")]
    [ProducesResponseType(typeof(List<CloudinaryFolderDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CloudinaryFolderDto>>> GetFolders()
    {
        try
        {
            var folders = await _cloudinaryService.ListFoldersAsync();
            return Ok(folders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener carpetas");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { error = "Error al obtener carpetas" });
        }
    }

    /// <summary>
    /// Obtiene archivos de una carpeta
    /// </summary>
    [HttpGet("resources")]
    [ProducesResponseType(typeof(List<CloudinaryResourceDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CloudinaryResourceDto>>> GetResources([FromQuery] string? prefix = null)
    {
        try
        {
            var resources = await _cloudinaryService.ListResourcesAsync(prefix);
            return Ok(resources);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener recursos");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { error = "Error al obtener recursos" });
        }
    }

    /// <summary>
    /// Sube una imagen a Cloudinary
    /// Requiere rol Admin
    /// </summary>
    [HttpPost("upload")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(CloudinaryUploadResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CloudinaryUploadResponseDto>> UploadImage(
        [FromForm] IFormFile file,
        [FromForm] string folder,
        [FromForm] string? tags = null)
    {
        try
        {
            // Validaciones
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { error = "Archivo no proporcionado" });
            }

            if (!file.ContentType.StartsWith("image/"))
            {
                return BadRequest(new { error = "Solo se permiten imágenes" });
            }

            if (file.Length > 10 * 1024 * 1024) // 10MB
            {
                return BadRequest(new { error = "El archivo supera 10MB" });
            }

            if (string.IsNullOrEmpty(folder))
            {
                return BadRequest(new { error = "Carpeta no especificada" });
            }

            // Convertir tags string a array
            var tagsArray = string.IsNullOrEmpty(tags) 
                ? null 
                : tags.Split(',', System.StringSplitOptions.RemoveEmptyEntries);

            // Subir
            using var stream = file.OpenReadStream();
            var result = await _cloudinaryService.UploadImageAsync(
                stream, 
                file.FileName, 
                folder, 
                tagsArray);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al subir imagen");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { error = "Error al subir imagen" });
        }
    }

    /// <summary>
    /// Elimina un recurso de Cloudinary
    /// Requiere rol Admin
    /// </summary>
    [HttpDelete("resources/{*publicId}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(CloudinaryDeleteResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CloudinaryDeleteResponseDto>> DeleteResource(string publicId)
    {
        try
        {
            if (string.IsNullOrEmpty(publicId))
            {
                return BadRequest(new { error = "PublicId no proporcionado" });
            }

            var result = await _cloudinaryService.DeleteResourceAsync(publicId);
            
            if (!result.Success)
            {
                return BadRequest(new { error = result.Message });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar recurso");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { error = "Error al eliminar recurso" });
        }
    }

    /// <summary>
    /// Obtiene estadísticas de una carpeta
    /// </summary>
    [HttpGet("folders/{folder}/stats")]
    [ProducesResponseType(typeof(CloudinaryStatsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CloudinaryStatsDto>> GetFolderStats(string folder)
    {
        try
        {
            if (string.IsNullOrEmpty(folder))
            {
                return BadRequest(new { error = "Carpeta no especificada" });
            }

            var stats = await _cloudinaryService.GetFolderStatsAsync(folder);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener estadísticas");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { error = "Error al obtener estadísticas" });
        }
    }
}
```

## 🔐 Consideraciones de Seguridad

✅ **Autorización JWT** — Todos los endpoints requieren token válido  
✅ **Restricción por Rol** — Upload/Delete solo para Admin  
✅ **Validación de Archivos** — Límite de tamaño y tipo  
✅ **Logging** — Se registran todas las operaciones  
✅ **Manejo de Errores** — Respuestas HTTP apropiadas  

## 📊 Estructura de Carpetas Recomendada en Cloudinary

Organiza tus imágenes por categoría:

```
cloudinary/
  ├── productos/
  │   ├── 2024/
  │   │   ├── image_001.jpg
  │   │   └── image_002.jpg
  │   └── 2025/
  │       └── ...
  ├── guantes/
  │   ├── modelos/
  │   └── colores/
  ├── usuarios/
  │   └── avatares/
  └── otros/
      └── ...
```

## 🧪 Testing

### Prueba con Postman

**1. GET /api/Cloudinary/folders**
```
GET https://localhost:7140/api/Cloudinary/folders
Authorization: Bearer {token_jwt}
```

**2. POST /api/Cloudinary/upload**
```
POST https://localhost:7140/api/Cloudinary/upload
Authorization: Bearer {token_jwt}
Content-Type: multipart/form-data

Form Data:
  - File: (select image file)
  - Folder: productos
  - Tags: producto,2024
```

**3. DELETE /api/Cloudinary/resources/{publicId}**
```
DELETE https://localhost:7140/api/Cloudinary/resources/productos%2Fimage_001
Authorization: Bearer {token_jwt}
```

## 📝 Notas

- El servicio `ICloudinaryService` es inyectable y puede usarse en otros controladores
- Todos los métodos son asincronos (async/await)
- Los errores se registran en los logs
- Las respuestas siguen patrones RESTful estándar

---

**última actualización**: 2026-06-22

