# Solución para Error 500 al Enviar Email de Recuperación de Contraseña

## Problema Identificado

Los logs de Supabase muestran que todas las solicitudes de recuperación de contraseña están devolviendo **error 500** (Internal Server Error) cuando se usa la URL `https://ofisi.ar/resetear-contrasena`.

**Evidencia de los logs:**
```
POST | 500 | /auth/v1/recover?redirect_to=https%3A%2F%2Fofisi.ar%2Fresetear-contrasena
```

Sin embargo, algunos requests con `redirect_to=https://localhost:3000/auth/reset-password` fueron exitosos (200).

## Causas Posibles

1. **Redirect URL no configurada en Supabase** (Más probable)
   - La URL `https://ofisi.ar/resetear-contrasena` no está en la lista de Redirect URLs permitidas en Supabase
   - Supabase rechaza el envío del email porque la redirect URL no está autorizada

2. **Problema con la configuración SMTP**
   - El servicio SMTP de Supabase puede tener problemas
   - Puede estar relacionado con límites de rate limiting
   - Puede requerir configuración SMTP personalizada para producción

## Solución Paso a Paso

### Paso 1: Configurar Redirect URLs en Supabase (CRÍTICO)

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto `handsOn Project`
3. Ve a: **Authentication** → **URL Configuration**
4. En la sección **Redirect URLs**, asegúrate de que estén estas URLs (una por línea):
   ```
   https://ofisi.ar/resetear-contrasena
   https://ofisi.ar/confirmar-email
   ofisi://auth/callback
   ofisi://
   ```
5. Haz clic en **Save** para guardar los cambios

**⚠️ IMPORTANTE**: Sin esto, Supabase rechazará enviar el email y devolverá error 500.

### Paso 2: Verificar Configuración SMTP

1. Ve a: **Project Settings** → **Auth** → **SMTP Settings**
2. Verifica si tienes un SMTP personalizado configurado:
   - Si no tienes SMTP configurado, Supabase usa su servicio por defecto
   - El servicio por defecto tiene límites y puede tener problemas en producción

3. **Recomendación para Producción**: Configura un SMTP personalizado:
   - **SendGrid** (Recomendado): https://sendgrid.com
   - **Gmail SMTP**: Requiere App Password
   - **Mailgun**: https://mailgun.com
   - **AWS SES**: Si usas AWS

### Paso 3: Verificar Email Templates

1. Ve a: **Authentication** → **Email Templates**
2. Verifica que el template **Reset Password** esté habilitado
3. Revisa que el contenido del template sea correcto

### Paso 4: Verificar Rate Limits

Los logs muestran muchos intentos. Puede haber alcanzado el límite de rate limiting:
- Espera unos minutos antes de intentar de nuevo
- Verifica en los logs si hay errores 429 (Too Many Requests)

## Configuración Recomendada para SMTP (SendGrid)

Si quieres configurar SendGrid para mayor confiabilidad:

1. **Crea una cuenta en SendGrid**
   - Ve a https://sendgrid.com
   - Crea una cuenta gratuita (hasta 100 emails/día gratis)

2. **Crea un API Key**
   - Ve a Settings → API Keys
   - Crea un nuevo API Key con permisos "Full Access" o "Mail Send"
   - Copia el API Key generado

3. **Configura en Supabase**
   - Ve a: **Project Settings** → **Auth** → **SMTP Settings**
   - Habilita "Enable Custom SMTP"
   - Configura:
     - **SMTP Host**: `smtp.sendgrid.net`
     - **SMTP Port**: `587`
     - **SMTP User**: `apikey`
     - **SMTP Password**: Tu API Key de SendGrid
     - **Sender email**: Tu email verificado en SendGrid (ej: noreply@ofisi.ar)
     - **Sender name**: "ofiSí"

4. **Verifica el dominio en SendGrid** (Opcional pero recomendado)
   - Para usar `noreply@ofisi.ar`, necesitas verificar el dominio `ofisi.ar` en SendGrid
   - O usa el email de tu cuenta de SendGrid que ya está verificado

## Verificar que Funciona

Después de configurar las Redirect URLs:

1. Intenta recuperar la contraseña desde la app
2. Verifica los logs en Supabase (Logs → API Logs)
3. Deberías ver un código 200 en lugar de 500
4. Revisa tu bandeja de entrada (y spam) para ver si llegó el email

## Troubleshooting

### Si sigue dando error 500 después de configurar Redirect URLs:
- Verifica que la URL esté exactamente como aparece en la lista (sin espacios, sin trailing slash a menos que lo necesites)
- Espera unos minutos después de guardar los cambios en Supabase
- Revisa los logs de Supabase para ver el error específico

### Si los emails no llegan:
- Revisa la carpeta de spam
- Verifica que el email del destinatario sea válido
- Revisa los logs de Supabase para ver si hay errores de entrega
- Si usas SMTP personalizado, revisa los logs del proveedor SMTP

### Si hay error de rate limiting:
- Espera 15-30 minutos antes de intentar de nuevo
- Considera configurar SMTP personalizado para mayor capacidad

## Estado Actual según Logs

- ✅ Requests con `localhost:3000` → **200 OK** (Funciona)
- ❌ Requests con `ofisi.ar` → **500 Internal Server Error** (No funciona)

**Conclusión**: Lo más probable es que la URL `https://ofisi.ar/resetear-contrasena` no esté configurada como Redirect URL permitida en Supabase.
