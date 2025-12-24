# Prueba de Subida de Imágenes

Este directorio contiene scripts para probar la funcionalidad mejorada de subida de imágenes.

## 🎯 Objetivo

Verificar que las mejoras implementadas funcionen correctamente:
- ✅ Validación del blob antes de subir
- ✅ Verificación del tamaño del archivo después de subir
- ✅ Detección automática de imágenes corruptas (0 bytes)

## 🚀 Opción 1: Probar desde la App Móvil (Recomendado)

La forma más fácil de probar es usar la app directamente:

1. **Abre la app móvil** en tu dispositivo o emulador
2. **Inicia sesión** con un usuario válido
3. **Navega a "Solicitar Presupuesto"**
4. **Selecciona un servicio** y prestadores
5. **Toma una foto o selecciona una imagen** de la galería
6. **Envía la solicitud**

### Verificar en los Logs

Observa los logs en la consola de desarrollo. Deberías ver:

```
🔄 Procesando imagen 1/1...
✅ Imagen convertida a JPG: file://...
📤 Subiendo imagen 1 a: {user_id}/{solicitud_id}/{timestamp}_0.jpg (XXXX bytes)
✅ Imagen 1 subida exitosamente
✅ Archivo verificado: {filename} (XXXX bytes)
✅ URL pública generada para imagen 1: https://...
```

Si ves un error como:
```
❌ Blob vacío para imagen X, saltando...
```
o
```
❌ ADVERTENCIA: El archivo subido tiene 0 bytes!
```

Significa que hay un problema que necesita ser investigado.

## 🧪 Opción 2: Script de Prueba Automatizado

### Requisitos

- Node.js instalado
- Credenciales de un usuario de prueba en Supabase

### Ejecutar el Script

```bash
cd mobile/scripts
node test-image-upload-simple.js
```

El script te pedirá:
- Email del usuario de prueba
- Password del usuario de prueba

Luego ejecutará automáticamente:
1. Autenticación
2. Creación de solicitud de prueba
3. Subida de imagen de prueba
4. Verificación del tamaño del archivo

### Resultado Esperado

Si todo funciona correctamente, verás:

```
✅✅✅ PRUEBA EXITOSA ✅✅✅
   El archivo se subió correctamente con XXXX bytes
```

## 🔍 Verificación Manual en Supabase

También puedes verificar manualmente en el Dashboard de Supabase:

1. Ve a **Storage** > **solicitudes**
2. Busca la carpeta del usuario que subió la imagen
3. Verifica que el archivo tenga un tamaño > 0 bytes
4. Intenta abrir la imagen desde la URL pública

## 📊 Verificar Imágenes Corruptas

Para verificar si hay imágenes corruptas en el bucket:

```sql
-- Ejecutar en SQL Editor de Supabase
SELECT 
    name,
    (metadata->>'size')::bigint as size_bytes,
    created_at
FROM storage.objects
WHERE bucket_id = 'solicitudes'
  AND (metadata->>'size')::bigint = 0
ORDER BY created_at DESC;
```

## 🐛 Solución de Problemas

### Error: "El blob está vacío (0 bytes)"

**Causa**: La conversión de URI a blob falló o la imagen original está corrupta.

**Solución**:
1. Verifica que la imagen original sea válida
2. Revisa los logs para ver dónde falla la conversión
3. Intenta con otra imagen

### Error: "El archivo subido tiene 0 bytes"

**Causa**: El archivo se subió pero está vacío.

**Solución**:
1. Verifica las políticas RLS del bucket
2. Asegúrate de que el bucket "solicitudes" esté configurado como público
3. Revisa los logs de Supabase Storage

### Error: "Unknown image download error"

**Causa**: La imagen existe pero no se puede cargar.

**Solución**:
1. Verifica que la URL sea correcta
2. Verifica que el bucket sea público
3. Verifica que el archivo tenga tamaño > 0 bytes

## ✅ Checklist de Verificación

Después de subir una imagen, verifica:

- [ ] El blob tiene tamaño > 0 antes de subir
- [ ] El archivo se sube sin errores
- [ ] El archivo verificado tiene tamaño > 0 después de subir
- [ ] La URL pública funciona y muestra la imagen
- [ ] No hay errores en los logs de la app
- [ ] La imagen se muestra correctamente en la app

## 📝 Notas

- Las mejoras implementadas previenen que se suban imágenes vacías
- Si una imagen falla, se registra en los logs pero no detiene el proceso
- Las imágenes corruptas existentes fueron eliminadas automáticamente
- Las nuevas imágenes deberían funcionar correctamente con las validaciones

