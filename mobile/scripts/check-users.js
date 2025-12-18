const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
const supabaseAnonKey = 'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
  try {
    console.log('Buscando usuarios con email que contenga "ecampazzo"...');
    
    // Intentar buscar usuarios (puede fallar por RLS)
    const { data: users, error } = await supabase
      .from('users_public')
      .select('id, email, nombre, apellido, verificado')
      .ilike('email', '%ecampazzo%');

    if (error) {
      console.error('Error al buscar usuarios:', error);
      console.log('\n⚠️  No se puede acceder directamente por RLS.');
      console.log('Por favor, ejecuta esta consulta SQL directamente en Supabase Dashboard:');
      console.log('\nSELECT id, email, nombre, apellido, verificado FROM users WHERE email ILIKE \'%ecampazzo%\';\n');
      return;
    }

    if (!users || users.length === 0) {
      console.log('No se encontraron usuarios con ese email');
      return;
    }

    console.log('Usuarios encontrados:');
    users.forEach(user => {
      console.log(`- ${user.email}: ${user.nombre} ${user.apellido} (verificado: ${user.verificado})`);
    });
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

checkUsers();

