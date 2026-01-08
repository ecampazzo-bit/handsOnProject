# Verificar Configuración SMTP en Supabase

## Problema
Aparece el error "error sending recovery email" al intentar recuperar la contraseña.

## Posibles Causas

### 1. Redirect URL no configurada en Supabase
Si la URL de redirección (`https://ofisi.ar/resetear-contrasena`) no está en la lista de URLs permitidas, Supabase rechazará enviar el email.

### 2. Configuración SMTP no configurada
Supabase usa por defecto su propio servicio de email, pero si tienes problemas, puede ser que necesites configurar un SMTP personalizado.

### 3. Email templates no configurados
Los templates de email pueden no estar configurados correctamente.

## Solución

### Paso 1: Verificar Redirect URLs

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a: **Authentication** → **URL Configuration**
4. En la sección **Redirect URLs**, asegúrate de que estén estas URLs (una por línea):
   ```
   https://ofisi.ar/resetear-contrasena
   https://ofisi.ar/confirmar-email
   ofisi://auth/callback
   ofisi://
   ```
5. Haz clic en **Save** para guardar los cambios

### Paso 2: Verificar Configuración SMTP

1. Ve a: **Authentication** → **Email Templates**
2. Verifica que los templates estén habilitados:
   - **Reset Password** debe estar habilitado
   - **Confirm signup** debe estar habilitado

3. Si quieres usar un SMTP personalizado (recomendado para producción):
   - Ve a: **Project Settings** → **Auth** → **SMTP Settings**
   - Configura tu proveedor SMTP (Gmail, SendGrid, etc.)

### Paso 3: Verificar Logs de Supabase

1. Ve a: **Logs** → **API Logs**
2. Busca intentos recientes de `resetPasswordForEmail`
3. Revisa los errores específicos que aparezcan

### Paso 4: Verificar Rate Limits

Supabase tiene límites de rate limiting. Si has intentado enviar muchos emails seguidos:
- Espera unos minutos antes de intentar de nuevo
- Verifica en los logs si hay errores 429 (Too Many Requests)

## Configurar SMTP Personalizado (Recomendado para Producción)

### Opción 1: Gmail SMTP

1. Ve a: **Project Settings** → **Auth** → **SMTP Settings**
2. Configura:
   - **Enable Custom SMTP**: ✅ Habilitado
   - **SMTP Host**: `smtp.gmail.com`
   - **SMTP Port**: `587`
   - **SMTP User**: Tu email de Gmail
   - **SMTP Password**: Usa una "App Password" de Gmail (no tu contraseña normal)
   - **Sender email**: Tu email de Gmail
   - **Sender name**: "ofiSí"

**Nota**: Para Gmail, necesitas:
- Habilitar "Acceso de aplicaciones menos seguras" (no recomendado) O
- Crear una "App Password" desde tu cuenta de Google

### Opción 2: SendGrid (Recomendado)

1. Crea una cuenta en SendGrid
2. Obtén tu API Key
3. Configura en Supabase:
   - **SMTP Host**: `smtp.sendgrid.net`
   - **SMTP Port**: `587`
   - **SMTP User**: `apikey`
   - **SMTP Password**: Tu API Key de SendGrid
   - **Sender email**: Tu email verificado en SendGrid

### Opción 3: Otros proveedores SMTP

Puedes usar cualquier proveedor SMTP que soporte SMTP estándar (Mailgun, AWS SES, etc.)

## Verificar que funciona

Después de configurar:

1. Intenta recuperar la contraseña desde la app
2. Verifica los logs en Supabase
3. Revisa tu bandeja de entrada (y spam) para ver si llegó el email

## Troubleshooting

### Error: "Redirect URL not allowed"
- **Solución**: Agrega la URL a la lista de Redirect URLs en Supabase

### Error: "Email rate limit exceeded"
- **Solución**: Espera unos minutos antes de intentar de nuevo

### Error: "SMTP configuration error"
- **Solución**: Verifica que la configuración SMTP sea correcta
- Revisa que las credenciales sean válidas
- Verifica que el puerto no esté bloqueado por firewall

### Los emails no llegan
- Revisa la carpeta de spam
- Verifica que el email del destinatario sea válido
- Revisa los logs de Supabase para ver si hay errores de entrega
- Si usas SMTP personalizado, verifica los logs del proveedor SMTP

## Enlaces Útiles

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Configuración SMTP en Supabase](https://supabase.com/docs/guides/auth/auth-smtp)
- [Email Templates en Supabase](https://supabase.com/docs/guides/auth/auth-email-templates)
