const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
const supabaseAnonKey = 'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function sendVerificationEmail() {
  try {
    const email = 'ecampazzo@hotmail.com';
    
    console.log('=== Enviando email de verificación ===\n');
    console.log('Email:', email);
    
    // Método 1: Usar resend para reenviar el email de confirmación
    // Nota: Esto requiere que el usuario haya intentado registrarse primero
    console.log('\n--- Método 1: Usando resend (requiere sesión) ---');
    
    // Primero intentar iniciar sesión para obtener una sesión temporal
    // Nota: Esto puede fallar si el email no está confirmado, pero necesitamos la sesión
    console.log('Intentando obtener sesión...');
    
    // Método alternativo: Usar la función de administración
    // Pero con la anon key no tenemos acceso directo a auth.admin
    
    console.log('\n⚠️  Para enviar el email de verificación, tienes dos opciones:\n');
    
    console.log('📧 OPCIÓN 1: Desde Supabase Dashboard (Más fácil)');
    console.log('1. Ve a https://supabase.com/dashboard');
    console.log('2. Selecciona tu proyecto');
    console.log('3. Ve a Authentication > Users');
    console.log('4. Busca el usuario con email:', email);
    console.log('5. Haz clic en los tres puntos (...) junto al usuario');
    console.log('6. Selecciona "Send magic link" o "Resend confirmation email"');
    console.log('7. El usuario recibirá el email de verificación\n');
    
    console.log('📧 OPCIÓN 2: Usar la API de Supabase (Requiere código)');
    console.log('Para enviar el email programáticamente, necesitas:');
    console.log('1. Usar el service_role key (no el anon key)');
    console.log('2. O hacer que el usuario inicie sesión primero');
    console.log('3. Luego llamar a supabase.auth.resend()\n');
    
    console.log('📧 OPCIÓN 3: Confirmar el email directamente (Para desarrollo)');
    console.log('Si estás en desarrollo y quieres confirmar el email sin enviar el correo:');
    console.log('Ejecuta este SQL en Supabase Dashboard:\n');
    console.log('UPDATE auth.users');
    console.log('SET email_confirmed_at = now()');
    console.log('WHERE email = \'' + email + '\';\n');
    
    // Intentar usar resend si hay una forma de hacerlo
    // Nota: resend() requiere que el usuario haya iniciado sesión o tenga un token válido
    console.log('--- Intentando método alternativo ---');
    
    // Verificar el estado del usuario
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('No se puede listar usuarios con anon key (esperado)');
      console.log('Necesitas usar el service_role key o el Dashboard\n');
    } else {
      const user = users?.find(u => u.email === email);
      if (user) {
        console.log('Usuario encontrado:', {
          id: user.id,
          email: user.email,
          emailConfirmed: user.email_confirmed_at ? 'Sí' : 'No'
        });
        
        if (!user.email_confirmed_at) {
          console.log('\n✅ El email aún no está confirmado');
          console.log('Usa una de las opciones anteriores para enviar el email de verificación');
        } else {
          console.log('\n✅ El email ya está confirmado');
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

sendVerificationEmail();

