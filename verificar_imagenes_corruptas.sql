-- ============================================================================
-- SCRIPT PARA VERIFICAR Y LIMPIAR IMÁGENES CORRUPTAS (0 bytes) EN EL BUCKET "solicitudes"
-- ============================================================================
-- Este script ayuda a identificar y eliminar imágenes que fueron subidas
-- pero tienen 0 bytes (archivos corruptos)
-- ============================================================================

-- 1. Verificar imágenes con tamaño 0 en el bucket "solicitudes"
-- Nota: Esto requiere acceso al storage.objects directamente
-- Puedes ejecutarlo desde el SQL Editor de Supabase

-- Listar todos los archivos del bucket "solicitudes" con su metadata
SELECT 
    name,
    bucket_id,
    (metadata->>'size')::bigint as size_bytes,
    created_at,
    updated_at
FROM storage.objects
WHERE bucket_id = 'solicitudes'
ORDER BY created_at DESC;

-- Encontrar archivos con tamaño 0 o NULL
SELECT 
    name,
    bucket_id,
    (metadata->>'size')::bigint as size_bytes,
    created_at
FROM storage.objects
WHERE bucket_id = 'solicitudes'
  AND (
    (metadata->>'size')::bigint = 0 
    OR metadata->>'size' IS NULL
    OR (metadata->>'size')::bigint IS NULL
  )
ORDER BY created_at DESC;

-- ============================================================================
-- ELIMINAR ARCHIVOS CORRUPTOS (CUIDADO: Esto elimina permanentemente)
-- ============================================================================
-- Descomenta las siguientes líneas solo si quieres eliminar los archivos corruptos
-- Asegúrate de revisar primero la lista de archivos arriba

/*
-- Eliminar archivos con tamaño 0
DELETE FROM storage.objects
WHERE bucket_id = 'solicitudes'
  AND (
    (metadata->>'size')::bigint = 0 
    OR metadata->>'size' IS NULL
    OR (metadata->>'size')::bigint IS NULL
  );
*/

-- ============================================================================
-- ALTERNATIVA: Usar la API de Storage de Supabase desde JavaScript
-- ============================================================================
-- Si prefieres usar JavaScript, puedes usar este código:

/*
import { supabase } from './supabaseClient';

async function encontrarYLimpiarImagenesCorruptas() {
  try {
    // Obtener todas las carpetas en el bucket
    const { data: folders, error: foldersError } = await supabase.storage
      .from('solicitudes')
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (foldersError) {
      console.error('Error al listar carpetas:', foldersError);
      return;
    }

    const archivosCorruptos = [];

    // Recorrer cada carpeta (user_id)
    for (const folder of folders) {
      if (folder.id) {
        const { data: solicitudesFolders, error: solicitudesError } = await supabase.storage
          .from('solicitudes')
          .list(folder.name, {
            limit: 1000
          });

        if (solicitudesError) continue;

        // Recorrer cada solicitud
        for (const solicitudFolder of solicitudesFolders || []) {
          const path = `${folder.name}/${solicitudFolder.name}`;
          const { data: files, error: filesError } = await supabase.storage
            .from('solicitudes')
            .list(path, {
              limit: 1000
            });

          if (filesError) continue;

          // Verificar cada archivo
          for (const file of files || []) {
            const fileSize = file.metadata?.size || 0;
            if (fileSize === 0 || fileSize === '0') {
              const fullPath = `${path}/${file.name}`;
              archivosCorruptos.push(fullPath);
              console.log(`Archivo corrupto encontrado: ${fullPath}`);
            }
          }
        }
      }
    }

    console.log(`Total de archivos corruptos encontrados: ${archivosCorruptos.length}`);

    // Eliminar archivos corruptos (descomenta para ejecutar)
    /*
    if (archivosCorruptos.length > 0) {
      const { data, error } = await supabase.storage
        .from('solicitudes')
        .remove(archivosCorruptos);

      if (error) {
        console.error('Error al eliminar archivos corruptos:', error);
      } else {
        console.log(`✅ ${archivosCorruptos.length} archivos corruptos eliminados`);
      }
    }
    */

  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función
encontrarYLimpiarImagenesCorruptas();
*/

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Las imágenes corruptas (0 bytes) pueden causar errores al intentar
--    cargarlas en la aplicación
--
-- 2. Si encuentras imágenes corruptas, probablemente fueron subidas cuando
--    había un problema con la conversión de URI a Blob
--
-- 3. Las imágenes nuevas deberían funcionar correctamente con las mejoras
--    implementadas en solicitudService.ts que validan el blob antes de subirlo
--
-- 4. Si eliminas archivos corruptos, asegúrate de actualizar también la base
--    de datos para remover las referencias a esas URLs en la tabla solicitudes_servicio
--
-- 5. Para actualizar las referencias en la base de datos después de eliminar
--    archivos corruptos:
/*
UPDATE solicitudes_servicio
SET fotos_urls = array_remove(fotos_urls, 'URL_DEL_ARCHIVO_CORRUPTO')
WHERE 'URL_DEL_ARCHIVO_CORRUPTO' = ANY(fotos_urls);
*/
-- ============================================================================

