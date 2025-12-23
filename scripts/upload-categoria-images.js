/**
 * Script para subir imágenes representativas de categorías a Supabase Storage
 * 
 * Uso:
 *   node scripts/upload-categoria-images.js <ruta_imagen> <nombre_categoria>
 * 
 * Ejemplo:
 *   node scripts/upload-categoria-images.js ./imagenes/construccion.jpg "Construcción y Albañilería"
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
const supabaseAnonKey = 'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';

// Para subir archivos, necesitamos el service_role_key o autenticarnos
// Si tienes service_role_key, úsalo aquí (NUNCA lo commitees al repo)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

const supabase = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient(supabaseUrl, supabaseAnonKey);

/**
 * Normaliza el nombre de categoría para usarlo como nombre de archivo
 */
function normalizeCategoryName(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]+/g, '-')     // Reemplazar espacios y caracteres especiales con guiones
    .replace(/^-+|-+$/g, '');        // Eliminar guiones al inicio y final
}

/**
 * Obtiene la extensión del archivo
 */
function getFileExtension(filePath) {
  return path.extname(filePath).toLowerCase();
}

/**
 * Valida el tipo de archivo
 */
function isValidImageType(extension) {
  const validTypes = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
  return validTypes.includes(extension);
}

/**
 * Sube una imagen de categoría y actualiza la base de datos
 */
async function uploadCategoriaImage(imagePath, categoriaNombre, categoriaId = null) {
  try {
    console.log(`\n📤 Subiendo imagen para categoría: ${categoriaNombre}`);
    
    // Validar que el archivo existe
    if (!fs.existsSync(imagePath)) {
      throw new Error(`El archivo no existe: ${imagePath}`);
    }

    // Leer el archivo
    const fileBuffer = fs.readFileSync(imagePath);
    const fileSize = fileBuffer.length;
    
    console.log(`   📁 Archivo: ${path.basename(imagePath)}`);
    console.log(`   📏 Tamaño: ${(fileSize / 1024).toFixed(2)} KB`);

    // Validar tamaño (máximo 1MB según documentación)
    const maxSize = 1024 * 1024; // 1MB
    if (fileSize > maxSize) {
      throw new Error(`El archivo es muy grande (${(fileSize / 1024).toFixed(2)} KB). Máximo permitido: 1MB`);
    }

    // Obtener extensión
    const extension = getFileExtension(imagePath);
    if (!isValidImageType(extension)) {
      throw new Error(`Tipo de archivo no válido: ${extension}. Permitidos: .jpg, .jpeg, .png, .webp, .svg`);
    }

    // Normalizar nombre de categoría para el path
    const normalizedName = normalizeCategoryName(categoriaNombre);
    const fileName = `categorias/${normalizedName}${extension}`;

    console.log(`   📝 Path en storage: ${fileName}`);

    // Si no se proporciona categoriaId, buscar por nombre
    if (!categoriaId) {
      const { data: categoria, error: errorCategoria } = await supabase
        .from('categorias')
        .select('id')
        .eq('nombre', categoriaNombre)
        .single();

      if (errorCategoria || !categoria) {
        throw new Error(`No se encontró la categoría: ${categoriaNombre}`);
      }

      categoriaId = categoria.id;
      console.log(`   🏷️  Categoría encontrada: ID ${categoriaId}`);
    }

    // Subir imagen al bucket "servicios"
    console.log(`   ⬆️  Subiendo a Supabase Storage...`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('servicios')
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        contentType: `image/${extension.replace('.', '')}`,
        upsert: true // Reemplazar si ya existe
      });

    if (uploadError) {
      // Si el error es que el bucket no existe o no hay permisos, proporcionar ayuda
      if (uploadError.message.includes('Bucket not found')) {
        throw new Error(`El bucket "servicios" no existe. Créalo en Supabase Dashboard > Storage`);
      }
      if (uploadError.message.includes('new row violates row-level security')) {
        throw new Error(`Error de permisos. Usa SUPABASE_SERVICE_ROLE_KEY como variable de entorno o autentica como admin`);
      }
      throw uploadError;
    }

    console.log(`   ✅ Imagen subida exitosamente`);

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('servicios')
      .getPublicUrl(fileName);

    console.log(`   🔗 URL pública: ${publicUrl}`);

    // Actualizar la tabla categorias con la URL
    console.log(`   💾 Actualizando base de datos...`);
    const { error: updateError } = await supabase
      .from('categorias')
      .update({ url: publicUrl })
      .eq('id', categoriaId);

    if (updateError) {
      throw new Error(`Error al actualizar categoría: ${updateError.message}`);
    }

    console.log(`   ✅ Base de datos actualizada`);
    console.log(`\n✅✅✅ ¡Proceso completado exitosamente! ✅✅✅\n`);

    return {
      success: true,
      url: publicUrl,
      categoriaId
    };

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Sube múltiples imágenes desde un directorio
 */
async function uploadMultipleImages(directoryPath, categoriaMap = null) {
  try {
    console.log(`\n📂 Procesando directorio: ${directoryPath}\n`);

    if (!fs.existsSync(directoryPath)) {
      throw new Error(`El directorio no existe: ${directoryPath}`);
    }

    const files = fs.readdirSync(directoryPath);
    const imageFiles = files.filter(file => {
      const ext = getFileExtension(file);
      return isValidImageType(ext);
    });

    if (imageFiles.length === 0) {
      console.log('⚠️  No se encontraron archivos de imagen válidos en el directorio');
      return;
    }

    console.log(`📸 Encontradas ${imageFiles.length} imágenes:\n`);

    for (const file of imageFiles) {
      const filePath = path.join(directoryPath, file);
      const fileNameWithoutExt = path.basename(file, path.extname(file));
      
      // Si hay un mapa, usar el nombre de categoría del mapa
      // Si no, usar el nombre del archivo como nombre de categoría
      const categoriaNombre = categoriaMap 
        ? categoriaMap[fileNameWithoutExt] 
        : fileNameWithoutExt;

      if (!categoriaNombre) {
        console.log(`⏭️  Saltando ${file} - no se encontró categoría correspondiente`);
        continue;
      }

      await uploadCategoriaImage(filePath, categoriaNombre);
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

// Ejecutar script
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📖 Uso del script:
  
  Subir una imagen individual:
    node scripts/upload-categoria-images.js <ruta_imagen> <nombre_categoria> [categoria_id]
  
  Ejemplo:
    node scripts/upload-categoria-images.js ./imagenes/construccion.jpg "Construcción y Albañilería"
  
  Subir múltiples imágenes desde un directorio:
    node scripts/upload-categoria-images.js --dir <directorio>
  
  Ejemplo:
    node scripts/upload-categoria-images.js --dir ./imagenes/categorias

📝 Notas:
  - El nombre de categoría debe coincidir exactamente con el nombre en la base de datos
  - Los archivos se suben al bucket "servicios" con el path: categorias/{nombre_normalizado}.{ext}
  - Para operaciones administrativas, usa la variable de entorno SUPABASE_SERVICE_ROLE_KEY
  
🔐 Autenticación:
  Si necesitas permisos de administrador, configura:
    export SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
    `);
    process.exit(1);
  }

  if (args[0] === '--dir' && args[1]) {
    // Modo directorio
    await uploadMultipleImages(args[1]);
  } else if (args.length >= 2) {
    // Modo archivo individual
    const imagePath = args[0];
    const categoriaNombre = args[1];
    const categoriaId = args[2] ? parseInt(args[2]) : null;

    await uploadCategoriaImage(imagePath, categoriaNombre, categoriaId);
  } else {
    console.error('❌ Argumentos insuficientes. Usa --help para ver el uso.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { uploadCategoriaImage, uploadMultipleImages };

