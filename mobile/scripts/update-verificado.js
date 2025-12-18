const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
const supabaseAnonKey = 'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateVerificado() {
  try {
    console.log('Actualizando campo verificado para ecampazzo@hotmail.com...');
    
    // Primero verificar si el usuario existe
    const { data: user, error: selectError } = await supabase
      .from('users')
      .select('id, email, nombre, apellido, verificado')
      .eq('email', 'ecampazzo@hotmail.com')
      .single();

    if (selectError) {
      console.error('Error al buscar usuario:', selectError);
      return;
    }

    if (!user) {
      console.log('Usuario no encontrado');
      return;
    }

    console.log('Usuario encontrado:', user);

    // Intentar actualizar usando RPC function (si existe) o directo
    // Como las políticas RLS pueden bloquear esto, intentaremos primero con RPC
    const { data: updateResult, error: updateError } = await supabase.rpc(
      'update_user_verificado',
      {
        p_email: 'ecampazzo@hotmail.com',
        p_verificado: true
      }
    ).catch(async () => {
      // Si la función RPC no existe, intentar actualización directa
      // Nota: Esto puede fallar por RLS, pero lo intentamos
      const { data, error } = await supabase
        .from('users')
        .update({ verificado: true })
        .eq('email', 'ecampazzo@hotmail.com')
        .select();
      
      return { data, error };
    });

    if (updateError) {
      console.error('Error al actualizar:', updateError);
      console.log('\n⚠️  Las políticas RLS pueden estar bloqueando la actualización.');
      console.log('Por favor, ejecuta esta consulta SQL directamente en Supabase:');
      console.log('\nUPDATE users SET verificado = true WHERE email = \'ecampazzo@hotmail.com\';');
      return;
    }

    console.log('✅ Campo verificado actualizado exitosamente');
    console.log('Resultado:', updateResult || 'Actualizado');
    
    // Verificar el resultado
    const { data: verifyUser } = await supabase
      .from('users')
      .select('id, email, nombre, apellido, verificado')
      .eq('email', 'ecampazzo@hotmail.com')
      .single();
    
    console.log('Usuario actualizado:', verifyUser);
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

updateVerificado();

