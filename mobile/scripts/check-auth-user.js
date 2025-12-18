const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
const supabaseAnonKey = 'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAuthUser() {
  try {
    const email = 'ecampazzo@hotmail.com';
    
    console.log('Verificando usuario en auth.users y public.users...\n');
    
    // Verificar en public.users
    const { data: publicUser, error: publicError } = await supabase
      .from('users_public')
      .select('id, email, nombre, apellido, verificado')
      .eq('email', email)
      .single();

    if (publicError) {
      console.error('Error al buscar en public.users:', publicError);
    } else {
      console.log('✅ Usuario en public.users:', publicUser);
    }

    // Intentar iniciar sesión para verificar credenciales
    console.log('\n--- Intentando iniciar sesión ---');
    console.log('Email:', email);
    
    // Nota: No podemos verificar la contraseña directamente por seguridad
    // Pero podemos verificar si el usuario existe en auth.users
    
    console.log('\n⚠️  Para verificar el usuario en auth.users, necesitas:');
    console.log('1. Ir a Supabase Dashboard > Authentication > Users');
    console.log('2. Buscar el usuario por email:', email);
    console.log('3. Verificar si el email está confirmado (Email Confirmed)');
    console.log('4. Si no está confirmado, hacer clic en "Confirm Email" o usar el SQL:');
    console.log('\n   UPDATE auth.users SET email_confirmed_at = now() WHERE email = \'' + email + '\';\n');
    
    // Intentar obtener información del usuario autenticado (si hay sesión)
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('✅ Hay una sesión activa:', {
        userId: session.user.id,
        email: session.user.email,
        emailConfirmed: session.user.email_confirmed_at ? 'Sí' : 'No'
      });
    } else {
      console.log('ℹ️  No hay sesión activa');
    }
    
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

checkAuthUser();

