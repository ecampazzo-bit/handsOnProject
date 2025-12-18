const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
const supabaseAnonKey = 'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function sendVerificationEmail() {
  try {
    const email = 'ecampazzo@hotmail.com';
    
    console.log('=== Enviando email de verificación ===\n');
    console.log('Email:', email);
    
    // Usar resend para reenviar el email de confirmación
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: undefined, // No redirigir después de confirmar
      },
    });

    console.log('\nResultado:', {
      hasData: !!data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
    });

    if (error) {
      console.error('\n❌ Error al enviar email:', error.message);
      
      if (error.message?.includes('rate limit')) {
        console.log('\n⚠️  Demasiados intentos. Espera unos minutos antes de intentar nuevamente.');
      } else if (error.message?.includes('already confirmed')) {
        console.log('\n✅ Este email ya está confirmado.');
      } else if (error.message?.includes('User not found')) {
        console.log('\n⚠️  Usuario no encontrado en auth.users.');
        console.log('Asegúrate de que el usuario exista en Authentication > Users');
      } else {
        console.log('\n📋 Alternativa: Envía el email desde Supabase Dashboard:');
        console.log('1. Ve a Authentication > Users');
        console.log('2. Busca el usuario:', email);
        console.log('3. Haz clic en los tres puntos (...)');
        console.log('4. Selecciona "Resend confirmation email"');
      }
      
      return;
    }

    console.log('\n✅ Email de verificación enviado exitosamente!');
    console.log('El usuario recibirá el email en:', email);
    console.log('\nNota: Si no recibes el email, verifica:');
    console.log('1. La carpeta de spam');
    console.log('2. Que el email esté correcto');
    console.log('3. La configuración de SMTP en Supabase Dashboard');
    
  } catch (error) {
    console.error('Error inesperado:', error.message);
  }
}

sendVerificationEmail();

