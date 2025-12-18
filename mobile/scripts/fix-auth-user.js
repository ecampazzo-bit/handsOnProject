const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
const supabaseAnonKey = 'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixAuthUser() {
  try {
    const email = 'ecampazzo@hotmail.com';
    const password = 'TuContraseña123'; // El usuario debe proporcionar la contraseña correcta
    
    console.log('=== Verificando y corrigiendo usuario de autenticación ===\n');
    console.log('Email:', email);
    
    // Verificar en public.users
    const { data: publicUser, error: publicError } = await supabase
      .from('users_public')
      .select('id, email, nombre, apellido')
      .eq('email', email)
      .single();

    if (publicError || !publicUser) {
      console.error('❌ Usuario no encontrado en public.users');
      return;
    }

    console.log('✅ Usuario encontrado en public.users:', {
      id: publicUser.id,
      email: publicUser.email,
      nombre: publicUser.nombre
    });

    // Intentar iniciar sesión para verificar si existe en auth.users
    console.log('\n--- Intentando iniciar sesión ---');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (signInError) {
      console.log('❌ Error al iniciar sesión:', signInError.message);
      
      if (signInError.code === 'invalid_credentials') {
        console.log('\n⚠️  El usuario no existe en auth.users o la contraseña es incorrecta.');
        console.log('\n📋 SOLUCIONES:');
        console.log('\n1. Si el usuario fue creado manualmente en public.users:');
        console.log('   Necesitas crear el usuario en auth.users usando Supabase Dashboard:');
        console.log('   - Ve a Authentication > Users > Add User');
        console.log('   - Email:', email);
        console.log('   - Password: (la contraseña que el usuario quiere usar)');
        console.log('   - Auto Confirm User: ✓');
        
        console.log('\n2. O ejecuta este SQL en Supabase Dashboard (requiere service_role key):');
        console.log('   INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)');
        console.log('   SELECT id, email, password, now(), created_at, updated_at');
        console.log('   FROM public.users');
        console.log('   WHERE email = \'' + email + '\'');
        console.log('   AND NOT EXISTS (SELECT 1 FROM auth.users WHERE email = \'' + email + '\');');
        
        console.log('\n3. Si el usuario existe pero el email no está confirmado:');
        console.log('   UPDATE auth.users SET email_confirmed_at = now() WHERE email = \'' + email + '\';');
        
        console.log('\n4. Si la contraseña es incorrecta:');
        console.log('   El usuario debe usar "Olvidé mi contraseña" o crear una nueva cuenta.');
      }
    } else {
      console.log('✅ Inicio de sesión exitoso!');
      console.log('Usuario autenticado:', {
        id: signInData.user.id,
        email: signInData.user.email,
        emailConfirmed: signInData.user.email_confirmed_at ? 'Sí' : 'No'
      });
      
      // Cerrar sesión
      await supabase.auth.signOut();
    }
    
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

// Si se proporciona la contraseña como argumento
const password = process.argv[2];
if (password) {
  console.log('⚠️  No uses contraseñas en la línea de comandos por seguridad.');
  console.log('Ejecuta el script sin contraseña para ver las instrucciones.\n');
}

fixAuthUser();

