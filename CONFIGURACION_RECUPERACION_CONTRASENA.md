# Configuración de Recuperación de Contraseña - Supabase

Este documento explica cómo configurar Supabase para que funcione correctamente con la funcionalidad de recuperación de contraseña en la web de ofiSi (ofisi.ar).

## 📋 Requisitos Previos

- Acceso al Dashboard de Supabase
- Proyecto de Supabase configurado
- Dominio: `ofisi.ar`

## 🔧 Pasos de Configuración

### 1. Configurar URL de Redirección en Supabase

1. Accede a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Authentication** → **URL Configuration**
3. En la sección **Redirect URLs**, agrega las siguientes URLs:

```
https://ofisi.ar/resetear-contrasena
https://ofisi.ar/recuperar-contrasena
```

**Nota:** Si estás en desarrollo local, también puedes agregar:
```
http://localhost:3000/resetear-contrasena
http://localhost:3000/recuperar-contrasena
```

### 2. Configurar Plantilla de Email (Opcional pero Recomendado)

1. En el Dashboard de Supabase, ve a **Authentication** → **Email Templates**
2. Selecciona la plantilla **Reset Password**
3. Personaliza el email si lo deseas, asegurándote de que el enlace incluya:
   - `{{ .ConfirmationURL }}` - Este es el enlace que redirige a `/resetear-contrasena`

**Ejemplo de plantilla personalizada:**

```html
<h2>Recuperar Contraseña - ofiSi</h2>
<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer Contraseña</a></p>
<p>Si no solicitaste este cambio, puedes ignorar este email.</p>
<p>Este enlace expirará en 1 hora.</p>
```

### 3. Configurar Variables de Entorno

Asegúrate de que tu archivo `.env.local` en la carpeta `web/` contenga:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://ofisi.ar
```

**Para desarrollo local:**
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Verificar Configuración de SMTP (Opcional)

Si quieres usar tu propio servidor de email en lugar del servicio por defecto de Supabase:

1. Ve a **Project Settings** → **Auth** → **SMTP Settings**
2. Configura tu servidor SMTP:
   - **Host:** tu servidor SMTP
   - **Port:** puerto SMTP (generalmente 587 o 465)
   - **Username:** tu usuario SMTP
   - **Password:** tu contraseña SMTP
   - **Sender email:** el email que aparecerá como remitente (ej: noreply@ofisi.ar)
   - **Sender name:** nombre del remitente (ej: ofiSi)

## 🧪 Probar la Funcionalidad

1. Ve a `https://ofisi.ar/recuperar-contrasena`
2. Ingresa un email válido registrado en tu sistema
3. Revisa el email recibido
4. Haz clic en el enlace del email
5. Deberías ser redirigido a `https://ofisi.ar/resetear-contrasena` con los parámetros necesarios
6. Ingresa tu nueva contraseña
7. Deberías ser redirigido al login

## 🔒 Seguridad

- Los enlaces de recuperación expiran después de 1 hora (configurable en Supabase)
- Los tokens son únicos y de un solo uso
- Los enlaces solo funcionan una vez

## 📝 Notas Importantes

- **Dominio:** Asegúrate de que el dominio `ofisi.ar` esté correctamente configurado en Supabase
- **HTTPS:** Supabase requiere HTTPS en producción para las redirecciones
- **CORS:** Si tienes problemas con CORS, verifica la configuración en Supabase Dashboard → Settings → API

## 🐛 Solución de Problemas

### El email no llega
- Verifica la carpeta de spam
- Revisa la configuración de SMTP si usas un servidor personalizado
- Verifica que el email esté registrado en Supabase

### El enlace no funciona
- Verifica que la URL de redirección esté configurada correctamente en Supabase
- Asegúrate de que `NEXT_PUBLIC_SITE_URL` esté configurado correctamente
- Verifica que el token no haya expirado (1 hora)

### Error al actualizar la contraseña
- Verifica que el token en la URL sea válido
- Asegúrate de que la contraseña cumpla con los requisitos mínimos (6 caracteres)
- Revisa la consola del navegador para más detalles

## 📚 Referencias

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Configuración de Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Password Reset Flow](https://supabase.com/docs/guides/auth/auth-password-reset)

