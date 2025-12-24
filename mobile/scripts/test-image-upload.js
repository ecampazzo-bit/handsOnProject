/**
 * Script de prueba para verificar la subida de imágenes a Supabase Storage
 * 
 * Este script:
 * 1. Crea una imagen de prueba pequeña
 * 2. Se autentica con un usuario de prueba
 * 3. Crea una solicitud de prueba
 * 4. Sube la imagen usando la función mejorada
 * 5. Verifica que la imagen se subió correctamente (tamaño > 0)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
const supabaseAnonKey = 'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Crea una imagen JPEG de prueba pequeña (1x1 pixel)
 */
function createTestImage() {
  // Crear un JPEG mínimo válido (1x1 pixel rojo)
  // Esto es un JPEG válido pero muy pequeño
  const jpegHeader = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
    0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
    0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
    0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xF6, 0xFF, 0xD9
  ]);
  
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const testImagePath = path.join(tempDir, 'test-image.jpg');
  fs.writeFileSync(testImagePath, jpegHeader);
  
  return testImagePath;
}

/**
 * Convierte un archivo local a Blob (simulando el comportamiento de React Native)
 */
async function fileToBlob(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return new Blob([fileBuffer], { type: 'image/jpeg' });
}

/**
 * Función principal de prueba
 */
async function testImageUpload() {
  try {
    console.log('🧪 Iniciando prueba de subida de imagen...\n');
    
    // 1. Crear imagen de prueba
    console.log('1️⃣ Creando imagen de prueba...');
    const testImagePath = createTestImage();
    const stats = fs.statSync(testImagePath);
    console.log(`✅ Imagen de prueba creada: ${testImagePath}`);
    console.log(`   Tamaño: ${stats.size} bytes\n`);
    
    if (stats.size === 0) {
      throw new Error('La imagen de prueba tiene 0 bytes');
    }
    
    // 2. Autenticarse (necesitas proporcionar credenciales de prueba)
    console.log('2️⃣ Autenticando usuario...');
    console.log('⚠️  NOTA: Necesitas proporcionar credenciales de un usuario de prueba');
    console.log('   Por favor, modifica las siguientes líneas con credenciales válidas:\n');
    
    // TODO: Reemplazar con credenciales de prueba
    const testEmail = 'test@example.com'; // Cambiar por un email de prueba
    const testPassword = 'testpassword123'; // Cambiar por una contraseña de prueba
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (authError) {
      console.error('❌ Error de autenticación:', authError.message);
      console.log('\n💡 Para probar manualmente:');
      console.log('   1. Abre la app móvil');
      console.log('   2. Inicia sesión con un usuario');
      console.log('   3. Crea una nueva solicitud con una foto');
      console.log('   4. Verifica en los logs que la imagen se suba correctamente\n');
      return;
    }
    
    if (!authData.user) {
      throw new Error('No se pudo autenticar el usuario');
    }
    
    console.log(`✅ Usuario autenticado: ${authData.user.email}\n`);
    
    // 3. Crear una solicitud de prueba
    console.log('3️⃣ Creando solicitud de prueba...');
    const { data: solicitudData, error: solicitudError } = await supabase
      .from('solicitudes_servicio')
      .insert({
        cliente_id: authData.user.id,
        servicio_id: 1, // Asumiendo que existe un servicio con ID 1
        descripcion_problema: 'Solicitud de prueba para verificar subida de imágenes',
        estado: 'pendiente',
      })
      .select('id')
      .single();
    
    if (solicitudError || !solicitudData) {
      throw new Error(`Error al crear solicitud: ${solicitudError?.message || 'Error desconocido'}`);
    }
    
    const solicitudId = solicitudData.id;
    console.log(`✅ Solicitud creada con ID: ${solicitudId}\n`);
    
    // 4. Convertir imagen a Blob
    console.log('4️⃣ Convirtiendo imagen a Blob...');
    const blob = await fileToBlob(testImagePath);
    
    if (!blob || blob.size === 0) {
      throw new Error('El blob está vacío (0 bytes)');
    }
    
    console.log(`✅ Blob creado: ${blob.size} bytes, tipo: ${blob.type}\n`);
    
    // 5. Subir imagen a Supabase Storage
    console.log('5️⃣ Subiendo imagen a Supabase Storage...');
    const timestamp = Date.now();
    const fileName = `${authData.user.id}/${solicitudId}/${timestamp}_0.jpg`;
    
    console.log(`   Ruta: ${fileName}`);
    console.log(`   Tamaño del blob: ${blob.size} bytes`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('solicitudes')
      .upload(fileName, blob, {
        cacheControl: '3600',
        contentType: 'image/jpeg',
        upsert: false,
      });
    
    if (uploadError) {
      throw new Error(`Error al subir: ${uploadError.message}`);
    }
    
    if (!uploadData) {
      throw new Error('No se recibió data después de subir');
    }
    
    console.log(`✅ Imagen subida exitosamente\n`);
    
    // 6. Verificar que el archivo se subió correctamente
    console.log('6️⃣ Verificando archivo subido...');
    const pathParts = fileName.split('/');
    const folderPath = pathParts.slice(0, -1).join('/');
    const fileNameOnly = pathParts[pathParts.length - 1];
    
    const { data: files, error: listError } = await supabase.storage
      .from('solicitudes')
      .list(folderPath, {
        search: fileNameOnly,
      });
    
    if (listError) {
      console.warn(`⚠️  No se pudo verificar el archivo: ${listError.message}`);
    } else if (files && files.length > 0) {
      const file = files[0];
      const fileSize = file.metadata?.size || 0;
      console.log(`✅ Archivo verificado:`);
      console.log(`   Nombre: ${file.name}`);
      console.log(`   Tamaño: ${fileSize} bytes`);
      console.log(`   Tipo: ${file.metadata?.mimetype || 'N/A'}`);
      
      if (fileSize === 0 || fileSize === '0') {
        console.error(`\n❌ ERROR: El archivo subido tiene 0 bytes!`);
        console.error(`   Esto indica que hay un problema con la subida.`);
        return;
      } else {
        console.log(`\n✅ ÉXITO: El archivo se subió correctamente con ${fileSize} bytes`);
      }
    }
    
    // 7. Obtener URL pública
    console.log('\n7️⃣ Obteniendo URL pública...');
    const { data: { publicUrl } } = supabase.storage
      .from('solicitudes')
      .getPublicUrl(fileName);
    
    console.log(`✅ URL pública: ${publicUrl}\n`);
    
    // 8. Actualizar solicitud con la URL
    console.log('8️⃣ Actualizando solicitud con URL de imagen...');
    const { error: updateError } = await supabase
      .from('solicitudes_servicio')
      .update({ fotos_urls: [publicUrl] })
      .eq('id', solicitudId);
    
    if (updateError) {
      console.warn(`⚠️  No se pudo actualizar la solicitud: ${updateError.message}`);
    } else {
      console.log(`✅ Solicitud actualizada con URL de imagen\n`);
    }
    
    // Limpiar archivo temporal
    fs.unlinkSync(testImagePath);
    console.log('🧹 Archivo temporal eliminado\n');
    
    console.log('✅✅✅ PRUEBA COMPLETADA EXITOSAMENTE ✅✅✅');
    console.log(`\n📋 Resumen:`);
    console.log(`   - Solicitud ID: ${solicitudId}`);
    console.log(`   - URL de imagen: ${publicUrl}`);
    console.log(`   - Tamaño del archivo: ${blob.size} bytes`);
    console.log(`\n💡 Puedes verificar la imagen accediendo a: ${publicUrl}`);
    
  } catch (error) {
    console.error('\n❌❌❌ ERROR EN LA PRUEBA ❌❌❌');
    console.error(`Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testImageUpload()
    .then(() => {
      console.log('\n✅ Script finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { testImageUpload };

