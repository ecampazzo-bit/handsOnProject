/**
 * Script para listar todas las categorías desde la base de datos
 * 
 * Uso:
 *   node scripts/listar-categorias.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
const supabaseAnonKey = 'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Lista todas las categorías
 */
async function listarCategorias() {
  try {
    console.log('\n📋 Obteniendo categorías...\n');

    const { data: categorias, error } = await supabase
      .from('categorias')
      .select('id, nombre, url, created_at')
      .order('nombre', { ascending: true });

    if (error) {
      throw error;
    }

    if (!categorias || categorias.length === 0) {
      console.log('⚠️  No se encontraron categorías en la base de datos');
      return;
    }

    // Estadísticas
    const total = categorias.length;
    const conImagen = categorias.filter(c => c.url).length;
    const sinImagen = total - conImagen;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ESTADÍSTICAS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total de categorías:        ${total}`);
    console.log(`Categorías con imagen:      ${conImagen} ✅`);
    console.log(`Categorías sin imagen:      ${sinImagen} ❌`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Lista detallada
    console.log('📝 LISTA DE CATEGORÍAS:\n');
    
    categorias.forEach((categoria, index) => {
      const numero = String(index + 1).padStart(2, ' ');
      const tieneImagen = categoria.url ? '✅' : '❌';
      const urlDisplay = categoria.url 
        ? categoria.url.substring(0, 60) + '...' 
        : 'Sin imagen';
      
      console.log(`${numero}. [ID: ${categoria.id}] ${categoria.nombre}`);
      console.log(`    ${tieneImagen} ${urlDisplay}`);
      console.log('');
    });

    // Lista simple para copiar nombres
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 NOMBRES PARA USAR EN EL SCRIPT DE SUBIDA:\n');
    categorias.forEach(categoria => {
      console.log(`"${categoria.nombre}"`);
    });
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error al obtener categorías:', error.message);
    if (error.message.includes('permission denied') || error.message.includes('row-level security')) {
      console.error('\n💡 Sugerencia: Este script usa la anon key. Si tienes RLS habilitado,');
      console.error('   podrías necesitar autenticarte o usar el service_role_key.');
    }
    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  listarCategorias();
}

module.exports = { listarCategorias };

