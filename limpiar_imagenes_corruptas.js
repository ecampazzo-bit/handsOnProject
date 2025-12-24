/**
 * Script para eliminar imágenes corruptas de Supabase Storage usando la API REST
 * Ejecutar con: SUPABASE_SERVICE_KEY="tu-key" node limpiar_imagenes_corruptas.js
 */

const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY no está configurada');
  console.log('Ejecuta: export SUPABASE_SERVICE_KEY="tu-service-key"');
  process.exit(1);
}

async function deleteFile(bucket, path) {
  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

async function limpiarImagenesCorruptas() {
  console.log('🧹 Iniciando limpieza de imágenes corruptas...\n');

  // Archivos específicos mencionados en los errores
  const archivosCorruptos = [
    'e5b1708a-16e5-4097-b5e5-e3a53cd4b3e5/37/1766488168175_0.jpg',
    'e5b1708a-16e5-4097-b5e5-e3a53cd4b3e5/29/1766486513283_0.jpg',
    'e5b1708a-16e5-4097-b5e5-e3a53cd4b3e5/27/1766486146880_0.jpg',
  ];

  // Limpiar bucket solicitudes
  console.log('📁 Limpiando bucket "solicitudes"...');
  for (const archivo of archivosCorruptos) {
    try {
      await deleteFile('solicitudes', archivo);
      console.log(`✅ Eliminado: ${archivo}`);
    } catch (err) {
      console.error(`❌ Error eliminando ${archivo}:`, err.message);
    }
  }

  // Limpiar avatar corrupto
  console.log('\n📁 Limpiando bucket "avatars"...');
  const avatarCorrupto = 'e5b1708a-16e5-4097-b5e5-e3a53cd4b3e5/avatar.jpg';
  
  try {
    await deleteFile('avatars', avatarCorrupto);
    console.log(`✅ Eliminado: ${avatarCorrupto}`);
  } catch (err) {
    console.error(`❌ Error eliminando ${avatarCorrupto}:`, err.message);
  }

  console.log('\n✅ Limpieza completada');
}

limpiarImagenesCorruptas().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
