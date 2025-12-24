/**
 * Script para limpiar todas las imágenes del bucket 'solicitudes' en Supabase Storage
 * 
 * Uso: cd mobile && node limpiar_storage.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (usa las mismas credenciales que la app móvil)
const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
const supabaseKey = 'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function limpiarStorage() {
  try {
    console.log('🧹 Iniciando limpieza del bucket "solicitudes"...\n');
    
    // Función recursiva para listar todos los archivos
    const allPaths = [];
    
    async function listarRecursivo(path = '') {
      const { data: items, error } = await supabase.storage
        .from('solicitudes')
        .list(path, {
          limit: 1000,
          offset: 0
        });

      if (error) {
        // Si el error es que no existe, simplemente retornar
        if (error.message && (error.message.includes('not found') || error.message.includes('does not exist'))) {
          return;
        }
        console.error(`⚠️  Error al listar "${path}":`, error.message);
        return;
      }

      if (!items || items.length === 0) {
        return;
      }

      for (const item of items) {
        const fullPath = path ? `${path}/${item.name}` : item.name;
        
        // Si es una carpeta (id es null o metadata es null), listar recursivamente
        if (item.id === null || !item.metadata) {
          await listarRecursivo(fullPath);
        } else {
          // Es un archivo
          allPaths.push(fullPath);
        }
      }
    }

    // Listar recursivamente todas las carpetas y archivos
    await listarRecursivo();

    console.log(`📊 Total de archivos encontrados: ${allPaths.length}\n`);

    if (allPaths.length === 0) {
      console.log('✅ El bucket "solicitudes" ya está vacío');
      return;
    }

    // Eliminar archivos en lotes de 100 (límite de Supabase)
    const batchSize = 100;
    let eliminados = 0;

    console.log('🗑️  Eliminando archivos...\n');

    for (let i = 0; i < allPaths.length; i += batchSize) {
      const batch = allPaths.slice(i, i + batchSize);
      
      const { error: deleteError } = await supabase.storage
        .from('solicitudes')
        .remove(batch);

      if (deleteError) {
        console.error(`❌ Error al eliminar lote ${Math.floor(i / batchSize) + 1}:`, deleteError.message);
      } else {
        eliminados += batch.length;
        const porcentaje = Math.round((eliminados / allPaths.length) * 100);
        console.log(`   Progreso: ${eliminados}/${allPaths.length} (${porcentaje}%)`);
      }
    }

    console.log(`\n✅ Limpieza completada: ${eliminados} archivos eliminados`);
    
    // Intentar eliminar carpetas vacías también
    console.log('\n🧹 Limpiando carpetas vacías...');
    const carpetas = [];
    
    async function listarCarpetas(path = '') {
      const { data: items, error } = await supabase.storage
        .from('solicitudes')
        .list(path, { limit: 1000 });

      if (error || !items) return;

      for (const item of items) {
        const fullPath = path ? `${path}/${item.name}` : item.name;
        if (item.id === null || !item.metadata) {
          carpetas.push(fullPath);
          await listarCarpetas(fullPath);
        }
      }
    }

    await listarCarpetas();
    
    // Eliminar carpetas (Supabase las elimina automáticamente si están vacías)
    if (carpetas.length > 0) {
      console.log(`   Encontradas ${carpetas.length} carpetas`);
      // Las carpetas se eliminan automáticamente cuando están vacías
    }
    
    // Verificar que se eliminaron todos
    const { data: remainingFiles } = await supabase.storage
      .from('solicitudes')
      .list('', { limit: 1 });

    if (remainingFiles && remainingFiles.length > 0) {
      console.log('\n⚠️  Advertencia: Aún quedan elementos en el bucket.');
      console.log('   Puede que sean carpetas vacías que se eliminarán automáticamente.');
    } else {
      console.log('\n✅ El bucket "solicitudes" está completamente vacío');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }
}

// Ejecutar
limpiarStorage()
  .then(() => {
    console.log('\n✨ Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

