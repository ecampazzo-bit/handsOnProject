/**
 * Script directo para subir imagen de categoría
 * Usa service_role_key para permisos administrativos
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';

// Solicitar service_role_key si no está en variables de entorno
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error(`
❌ ERROR: Se requiere SUPABASE_SERVICE_ROLE_KEY

Para subir la imagen, ejecuta:

export SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
node scripts/subir-imagen-categoria-directo.js

O directamente:

SUPABASE_SERVICE_ROLE_KEY=tu_key node scripts/subir-imagen-categoria-directo.js

📝 Dónde encontrar el service_role_key:
   Supabase Dashboard > Settings > API > service_role key (secret)
  `);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function subirImagen() {
  const imagePath = 'mobile/assets/vidriosyaberturas.png';
  const categoriaNombre = 'Vidrios y Aberturas';
  
  try {
    console.log(`\n📤 Subiendo imagen para categoría: ${categoriaNombre}\n`);
    
    // Leer archivo
    const fileBuffer = fs.readFileSync(imagePath);
    const fileSize = fileBuffer.length;
    console.log(`📁 Archivo: ${imagePath}`);
    console.log(`📏 Tamaño: ${(fileSize / 1024).toFixed(2)} KB`);

    // Buscar categoría
    console.log(`🔍 Buscando categoría: "${categoriaNombre}"...`);
    const { data: categoria, error: errorCategoria } = await supabase
      .from('categorias')
      .select('id, nombre')
      .ilike('nombre', categoriaNombre)
      .single();

    if (errorCategoria || !categoria) {
      // Intentar búsqueda más flexible
      const { data: categorias } = await supabase
        .from('categorias')
        .select('id, nombre')
        .ilike('nombre', `%vidrios%`);
      
      if (categorias && categorias.length > 0) {
        console.log(`\n⚠️  Categoría exacta no encontrada. Categorías similares:`);
        categorias.forEach(c => console.log(`   - ID ${c.id}: "${c.nombre}"`));
        throw new Error(`No se encontró la categoría exacta "${categoriaNombre}". Verifica el nombre.`);
      }
      throw new Error(`No se encontró la categoría: ${errorCategoria?.message}`);
    }

    console.log(`✅ Categoría encontrada: ID ${categoria.id} - "${categoria.nombre}"`);

    // Normalizar nombre para path
    const normalizedName = categoria.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const fileName = `categorias/${normalizedName}.png`;
    console.log(`📝 Path en storage: ${fileName}`);

    // Subir imagen usando el cliente de Supabase con service_role (bypass RLS)
    console.log(`⬆️  Subiendo a Supabase Storage...`);
    
    // El service_role_key debería bypass RLS automáticamente
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('servicios')
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        contentType: 'image/png',
        upsert: true,
        // Forzar uso de service_role
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      });

    if (uploadError) {
      if (uploadError.message.includes('Bucket not found')) {
        throw new Error('El bucket "servicios" no existe. Créalo en Supabase Dashboard > Storage');
      }
      if (uploadError.message.includes('row-level security')) {
        console.error('\n⚠️  Error de permisos RLS. Esto puede ocurrir si:');
        console.error('   1. Las políticas RLS del bucket están bloqueando la operación');
        console.error('   2. El service_role_key no está configurado correctamente');
        console.error('\n💡 Solución alternativa: Sube la imagen manualmente desde el Dashboard');
        console.error('   y luego actualiza la URL en la base de datos con el script SQL.\n');
      }
      throw uploadError;
    }

    console.log(`✅ Imagen subida exitosamente`);

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('servicios')
      .getPublicUrl(fileName);

    console.log(`🔗 URL pública: ${publicUrl}`);

    // Actualizar categoría
    console.log(`💾 Actualizando base de datos...`);
    const { error: updateError } = await supabase
      .from('categorias')
      .update({ url: publicUrl })
      .eq('id', categoria.id);

    if (updateError) {
      throw new Error(`Error al actualizar categoría: ${updateError.message}`);
    }

    console.log(`✅ Base de datos actualizada`);
    console.log(`\n✅✅✅ ¡Proceso completado exitosamente! ✅✅✅\n`);
    console.log(`📋 Resumen:`);
    console.log(`   Categoría: ${categoria.nombre} (ID: ${categoria.id})`);
    console.log(`   URL: ${publicUrl}\n`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

subirImagen();

