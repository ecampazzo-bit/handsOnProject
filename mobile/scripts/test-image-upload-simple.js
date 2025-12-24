/**
 * Script simplificado para probar la subida de imágenes
 * 
 * Este script verifica que las mejoras funcionen correctamente
 * ejecutando una prueba directa con Supabase Storage
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
const supabaseAnonKey = 'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Crea un blob de imagen JPEG válido mínimo (1x1 pixel)
 */
function createTestImageBlob() {
  // JPEG mínimo válido (aproximadamente 200 bytes)
  const jpegData = Buffer.from([
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
  
  return new Blob([jpegData], { type: 'image/jpeg' });
}

async function testImageUpload() {
  console.log('🧪 Prueba de subida de imagen mejorada\n');
  console.log('⚠️  Esta prueba requiere autenticación.');
  console.log('   Por favor, proporciona las credenciales de un usuario de prueba:\n');
  
  // Solicitar credenciales (en producción usaría readline)
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));
  
  try {
    const email = await question('Email: ');
    const password = await question('Password: ');
    
    console.log('\n🔄 Autenticando...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (authError || !authData.user) {
      console.error('❌ Error de autenticación:', authError?.message || 'Usuario no encontrado');
      rl.close();
      return;
    }
    
    console.log(`✅ Autenticado como: ${authData.user.email}\n`);
    
    // Crear blob de prueba
    console.log('📦 Creando imagen de prueba...');
    const testBlob = createTestImageBlob();
    console.log(`✅ Blob creado: ${testBlob.size} bytes\n`);
    
    if (testBlob.size === 0) {
      throw new Error('El blob de prueba está vacío');
    }
    
    // Crear solicitud de prueba
    console.log('📝 Creando solicitud de prueba...');
    const { data: solicitudData, error: solicitudError } = await supabase
      .from('solicitudes_servicio')
      .insert({
        cliente_id: authData.user.id,
        servicio_id: 1,
        descripcion_problema: 'Solicitud de prueba - verificación de subida de imágenes',
        estado: 'pendiente',
      })
      .select('id')
      .single();
    
    if (solicitudError || !solicitudData) {
      throw new Error(`Error al crear solicitud: ${solicitudError?.message}`);
    }
    
    const solicitudId = solicitudData.id;
    console.log(`✅ Solicitud creada: ID ${solicitudId}\n`);
    
    // Subir imagen
    console.log('📤 Subiendo imagen...');
    const timestamp = Date.now();
    const fileName = `${authData.user.id}/${solicitudId}/${timestamp}_test.jpg`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('solicitudes')
      .upload(fileName, testBlob, {
        cacheControl: '3600',
        contentType: 'image/jpeg',
      });
    
    if (uploadError) {
      throw new Error(`Error al subir: ${uploadError.message}`);
    }
    
    console.log(`✅ Imagen subida: ${fileName}\n`);
    
    // Verificar tamaño
    console.log('🔍 Verificando archivo subido...');
    const pathParts = fileName.split('/');
    const folderPath = pathParts.slice(0, -1).join('/');
    
    const { data: files } = await supabase.storage
      .from('solicitudes')
      .list(folderPath);
    
    const uploadedFile = files?.find(f => f.name.includes('test.jpg'));
    if (uploadedFile) {
      const fileSize = uploadedFile.metadata?.size || 0;
      console.log(`✅ Archivo verificado:`);
      console.log(`   Tamaño: ${fileSize} bytes`);
      
      if (fileSize === 0) {
        console.error('\n❌ ERROR: El archivo tiene 0 bytes!');
      } else {
        console.log('\n✅✅✅ PRUEBA EXITOSA ✅✅✅');
        console.log(`   El archivo se subió correctamente con ${fileSize} bytes`);
      }
    }
    
    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('solicitudes')
      .getPublicUrl(fileName);
    
    console.log(`\n📎 URL pública: ${publicUrl}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  testImageUpload();
}

module.exports = { testImageUpload };

