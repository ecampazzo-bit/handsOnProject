# Configuración del MCP de Hostinger - Solo Herramientas de Hosting

Este documento lista las herramientas del MCP de Hostinger relacionadas únicamente con la gestión de sitios web (hosting), excluyendo dominios, VPS, DNS y otras funcionalidades.

## Herramientas Disponibles para Sitios Web

### 1. Gestión de Sitios Web

#### `hosting_listWebsites`
Lista todos los sitios web (principales y adicionales) de tu cuenta Hostinger.

**Uso:**
- Listar todos los sitios web
- Filtrar por dominio específico
- Filtrar por estado (habilitado/deshabilitado)
- Filtrar por usuario o order_id

#### `hosting_createWebsite`
Crea un nuevo sitio web en tu cuenta Hostinger.

**Parámetros requeridos:**
- `domain`: Nombre del dominio (sin "www.")
- `order_id`: ID de la orden asociada

**Parámetros opcionales:**
- `datacenter_code`: Código del datacenter (requerido solo para el primer sitio en un plan nuevo)

#### `hosting_listOrders`
Lista todas las órdenes de hosting accesibles.

**Filtros disponibles:**
- Por estado: `active`, `deleting`, `deleted`, `suspended`
- Por IDs específicos de órdenes

### 2. Despliegue de Aplicaciones

#### `hosting_deployStaticWebsite`
Despliega un sitio web estático desde un archivo comprimido.

**Requisitos:**
- El archivo debe contener archivos pre-compilados (HTML, CSS, JS, imágenes)
- No debe incluir `node_modules` ni archivos de build
- Formatos soportados: zip, tar, tar.gz, tgz, 7z, gz, gzip

**Parámetros:**
- `domain`: Dominio del sitio
- `archivePath`: Ruta al archivo comprimido
- `removeArchive`: Opcional, eliminar archivo después del despliegue

#### `hosting_deployJsApplication`
Despliega una aplicación JavaScript/Node.js desde un archivo comprimido.

**Requisitos:**
- El archivo debe contener SOLO archivos fuente
- NO incluir `node_modules` ni archivos de build
- El build se ejecutará automáticamente en el servidor

**Parámetros:**
- `domain`: Dominio de la aplicación
- `archivePath`: Ruta al archivo comprimido
- `removeArchive`: Opcional, eliminar archivo después del despliegue

**Seguimiento:**
- Usa `hosting_listJsDeployments` para ver el estado del despliegue
- Usa `hosting_showJsDeploymentLogs` para ver logs en caso de errores

#### `hosting_listJsDeployments`
Lista los despliegues de aplicaciones JavaScript con su estado.

**Estados posibles:**
- `pending`: Pendiente
- `running`: En ejecución
- `completed`: Completado
- `failed`: Fallido

**Filtros:**
- Por estado específico
- Paginación disponible

#### `hosting_showJsDeploymentLogs`
Muestra los logs de un despliegue específico para debugging.

**Parámetros:**
- `domain`: Dominio de la aplicación
- `buildUuid`: UUID del build (obtenido de `listJsDeployments`)
- `fromLine`: Opcional, línea desde la cual leer logs

### 3. WordPress

#### `hosting_importWordpressWebsite`
Importa un sitio WordPress completo desde un archivo comprimido y un dump de base de datos.

**Parámetros:**
- `domain`: Dominio del sitio
- `archivePath`: Ruta al archivo comprimido del sitio (zip, tar, tar.gz, etc.)
- `databaseDump`: Ruta al archivo .sql de la base de datos

**Nota:** El proceso puede tardar varios minutos para sitios grandes.

#### `hosting_deployWordpressTheme`
Despliega un tema de WordPress desde un directorio.

**Parámetros:**
- `domain`: Dominio del sitio WordPress
- `slug`: Slug del tema (ej: `twentytwentyfive`)
- `themePath`: Ruta al directorio del tema
- `activate`: Opcional, activar el tema después del despliegue

### 4. Utilidades

#### `hosting_listAvailableDatacenters`
Lista los datacenters disponibles para configurar planes de hosting.

**Uso:**
- Obtener el mejor datacenter para una orden específica
- El primer resultado es la mejor opción para tu orden

**Parámetros:**
- `order_id`: ID de la orden

#### `hosting_generateAFreeSubdomain`
Genera un subdominio gratuito único para usar con servicios de hosting.

**Uso:**
- Crear un subdominio temporal para pruebas
- No requiere comprar un dominio personalizado
- Formato: `*.hostingersite.com`

#### `hosting_verifyDomainOwnership`
Verifica la propiedad de un dominio antes de usarlo para sitios web.

**Parámetros:**
- `domain`: Dominio a verificar

**Respuesta:**
- `is_accessible: true`: Dominio accesible, listo para usar
- `is_accessible: false`: Requiere agregar un registro TXT a DNS
- Incluye el registro TXT necesario si no es accesible

**Nota:** No es necesario para subdominios gratuitos de Hostinger (*.hostingersite.com)

## Ejemplos de Uso

### Listar todos mis sitios web
```
Lista todos los sitios web de mi cuenta Hostinger
```

### Desplegar un sitio estático
```
Despliega el sitio web estático desde web-deploy.zip al dominio ejemplo.com
```

### Ver estado de despliegue de aplicación Node.js
```
Muestra el estado de los despliegues de aplicaciones JavaScript para ejemplo.com
```

### Crear un nuevo sitio web
```
Crea un nuevo sitio web para el dominio mipagina.com usando la orden 12345
```

## Herramientas Excluidas (No usar)

Para evitar usar herramientas no relacionadas con hosting, evita mencionar:
- ❌ Dominios (domain management)
- ❌ DNS (DNS records)
- ❌ VPS (Virtual Private Servers)
- ❌ Billing (facturación)
- ❌ Reach (email marketing)

## Notas Importantes

1. **Seguridad**: Tu API token está configurado en `~/.cursor/mcp.json` y está protegido por `.gitignore`

2. **Archivos de despliegue**: 
   - Para sitios estáticos: incluir solo archivos compilados
   - Para aplicaciones JS: incluir solo código fuente (sin node_modules ni build)

3. **Tiempos de procesamiento**:
   - Despliegues simples: 1-2 minutos
   - Importación de WordPress: 5-10 minutos para sitios medianos
   - Builds de aplicaciones JS: depende del tamaño del proyecto

4. **Verificación de dominio**: 
   - Los cambios de DNS pueden tardar hasta 10 minutos en propagarse
   - Usa subdominios gratuitos de Hostinger para pruebas rápidas

