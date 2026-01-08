# Configurar Redirect URL para Confirmación de Email en Supabase

## Problema
Cuando el usuario hace clic en el enlace de confirmación de email, la app muestra un error y redirige incorrectamente a la pantalla de recuperación de contraseña.

## Solución

### 1. Configurar Redirect URL en Supabase

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Navega a: **Authentication** → **URL Configuration**
3. En la sección **Redirect URLs**, agrega:
   ```
   ofisi://auth/callback
   ofisi://
   https://ofisi.ar/confirmar-email
   ```
4. Guarda los cambios

**Nota**: La URL `https://ofisi.ar/confirmar-email` es para cuando el usuario hace clic en el enlace desde un navegador web. Las URLs `ofisi://` son para cuando se abre desde la app móvil.

### 2. Verificar el Scheme de la App

El scheme está configurado en `mobile/app.json`:
```json
"scheme": "ofisi"
```

Esto significa que los deep links deben usar el formato: `ofisi://...`

### 3. Formato de URLs de Confirmación

Supabase enviará enlaces de confirmación con el siguiente formato:
```
ofisi://auth/callback?token_hash=...&type=email
```

O alternativamente:
```
ofisi://#access_token=...&refresh_token=...&type=email
```

## Código Implementado

El código en `App.tsx` ahora maneja ambos formatos:
- Detecta deep links cuando la app se abre
- Extrae el `token_hash` o `access_token`
- Verifica el email con Supabase
- Muestra un mensaje de éxito o error apropiado

## Pruebas

1. Registra un nuevo usuario
2. Revisa tu email y haz clic en el enlace de confirmación
3. La app debería abrirse y mostrar un mensaje de confirmación exitosa
4. Si hay un error, se mostrará un mensaje explicativo

## Troubleshooting

### Si el enlace no abre la app:
- Verifica que el scheme "ofisi" esté configurado en `app.json`
- Verifica que el redirect URL esté configurado en Supabase
- En Android, verifica que el intent filter esté configurado (se genera automáticamente con Expo)

### Si muestra error al verificar:
- Verifica que el enlace no haya expirado (los enlaces de Supabase expiran después de cierto tiempo)
- Verifica los logs de la consola para ver el error específico
- Solicita un nuevo enlace de verificación desde la app

### Si redirige incorrectamente:
- Verifica que no haya código que navegue automáticamente en caso de error
- El código actual solo muestra un Alert, no navega automáticamente
