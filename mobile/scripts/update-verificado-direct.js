const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
const supabaseAnonKey = 'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateVerificado() {
  try {
    console.log('Actualizando campo verificado para ecampazzo@hotmail.com...');
    
    // Primero verificar el usuario actual
    const { data: userBefore } = await supabase
      .from('users_public')
      .select('id, email, nombre, apellido, verificado')
      .eq('email', 'ecampazzo@hotmail.com')
      .single();

    if (!userBefore) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('Usuario antes:', userBefore);

    // Intentar actualizar usando la función RPC
    const { data: updateResult, error: updateError } = await supabase.rpc(
      'update_user_verificado',
      {
        p_email: 'ecampazzo@hotmail.com',
        p_verificado: true
      }
    );

    if (updateError) {
      console.error('❌ Error al actualizar:', updateError);
      console.log('\n⚠️  La función RPC puede no existir aún.');
      console.log('Por favor, ejecuta primero el SQL en Supabase Dashboard:');
      console.log('\n📄 Archivo: scripts/update-verificado-rpc.sql\n');
      console.log('O ejecuta directamente este SQL:');
      console.log('\nUPDATE users SET verificado = true WHERE email = \'ecampazzo@hotmail.com\';\n');
      return;
    }

    console.log('✅ Resultado de la actualización:', updateResult);

    // Verificar el resultado
    const { data: userAfter } = await supabase
      .from('users_public')
      .select('id, email, nombre, apellido, verificado')
      .eq('email', 'ecampazzo@hotmail.com')
      .single();
    
    console.log('Usuario después:', userAfter);
    
    if (userAfter?.verificado === true) {
      console.log('\n✅ Campo verificado actualizado exitosamente a true');
    } else {
      console.log('\n⚠️  El campo verificado no se actualizó correctamente');
    }
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

updateVerificado();

