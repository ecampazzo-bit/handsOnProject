/**
 * Script para limpiar todas las imágenes del bucket 'solicitudes' en Supabase Storage
 * 
 * Uso: node limpiar_storage.js
 * 
 * NOTA: Este script debe ejecutarse desde el directorio mobile/ donde están las dependencias
 * o tener @supabase/supabase-js instalado globalmente.
 */

const path = require('path');
const { createClient } = require(path.join(__dirname, 'mobile', 'node_modules', '@supabase', 'supabase-js'));

// Configuración de Supabase (usa las mismas credenciales que la app móvil)
const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
const supabaseKey = 'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan las variables de entorno EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function limpiarStorage() {
  try {
    console.log('Iniciando limpieza del bucket "solicitudes"...');
    
    // Listar todos los archivos en el bucket
    const { data: files, error: listError } = await supabase.storage
      .from('solicitudes')
      .list('', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('Error al listar archivos:', listError);
      return;
    }

    if (!files || files.length === 0) {
      console.log('No hay archivos en el bucket "solicitudes"');
      return;
    }

    console.log(`Encontrados ${files.length} archivos/carpetas`);

    // Recopilar todas las rutas de archivos (incluyendo subcarpetas)
    const allPaths = [];
    
    async function listarRecursivo(path = '') {
      const { data: items, error } = await supabase.storage
        .from('solicitudes')
        .list(path, {
          limit: 1000,
          offset: 0
        });

      if (error) {
        console.error(`Error al listar ${path}:`, error);
        return;
      }

      if (!items) return;

      for (const item of items) {
        const fullPath = path ? `${path}/${item.name}` : item.name;
        
        if (item.id === null) {
          // Es una carpeta, listar recursivamente
          await listarRecursivo(fullPath);
        } else {
          // Es un archivo
          allPaths.push(fullPath);
        }
      }
    }

    // Listar recursivamente todas las carpetas
    await listarRecursivo();

    console.log(`Total de archivos a eliminar: ${allPaths.length}`);

    if (allPaths.length === 0) {
      console.log('No hay archivos para eliminar');
      return;
    }

    // Eliminar archivos en lotes de 100 (límite de Supabase)
    const batchSize = 100;
    let eliminados = 0;

    for (let i = 0; i < allPaths.length; i += batchSize) {
      const batch = allPaths.slice(i, i + batchSize);
      
      const { error: deleteError } = await supabase.storage
        .from('solicitudes')
        .remove(batch);

      if (deleteError) {
        console.error(`Error al eliminar lote ${i / batchSize + 1}:`, deleteError);
      } else {
        eliminados += batch.length;
        console.log(`Eliminados ${eliminados}/${allPaths.length} archivos...`);
      }
    }

    console.log(`\n✅ Limpieza completada: ${eliminados} archivos eliminados`);
    
    // Verificar que se eliminaron todos
    const { data: remainingFiles } = await supabase.storage
      .from('solicitudes')
      .list('', { limit: 1 });

    if (remainingFiles && remainingFiles.length > 0) {
      console.log('⚠️  Advertencia: Aún quedan archivos en el bucket. Puede que haya subcarpetas anidadas.');
    } else {
      console.log('✅ El bucket está completamente vacío');
    }

  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

// Ejecutar
limpiarStorage();

