/**
 * Script simplificado para subir imagen de Vidrios y Aberturas
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ Se requiere SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function subir() {
  try {
    const imagePath = 'mobile/assets/pisosyceramicos.png';
    const fileBuffer = fs.readFileSync(imagePath);
    const fileName = 'categorias/pisos-y-ceramicos.png';
    
    console.log('📤 Subiendo imagen...');
    
    // Subir con service_role (bypass RLS)
    const { data, error } = await supabase.storage
      .from('servicios')
      .upload(fileName, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error('❌ Error al subir:', error.message);
      
      // Si el error es RLS, sugerir solución alternativa
      if (error.message.includes('row-level security')) {
        console.log('\n💡 El service_role_key debería bypass RLS, pero las políticas pueden estar bloqueando.');
        console.log('   Solución: Ejecuta este SQL para permitir inserts con service_role:');
        console.log('\n   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');
        console.log('   -- Luego vuelve a habilitarlo:');
        console.log('   -- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;');
      }
      return;
    }

    console.log('✅ Imagen subida');
    
    // Obtener URL
    const { data: { publicUrl } } = supabase.storage
      .from('servicios')
      .getPublicUrl(fileName);
    
    console.log('🔗 URL:', publicUrl);
    
    // Actualizar categoría
    const { error: updateError } = await supabase
      .from('categorias')
      .update({ url: publicUrl })
      .eq('nombre', 'Pisos y Cerámicas');

    if (updateError) {
      console.error('❌ Error al actualizar:', updateError.message);
      return;
    }

    console.log('✅ Categoría actualizada');
    console.log('\n✅✅✅ ¡Completado! ✅✅✅\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

subir();

