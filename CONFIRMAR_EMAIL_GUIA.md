# Guía para Confirmar Email de Usuarios en Supabase

## Problema
Aunque pusiste `verificado = true` en la tabla `users`, Supabase Auth necesita que `email_confirmed_at` en la tabla `auth.users` tenga un valor para permitir el login.

## Solución

### Opción 1: Usar el SQL Editor del Dashboard de Supabase (Recomendado)

1. **Ve al Dashboard de Supabase**: https://supabase.com/dashboard
2. **Selecciona tu proyecto**: `handsOnProject`
3. **Ve a SQL Editor** (en el menú lateral izquierdo)
4. **Ejecuta el siguiente script SQL**:

```sql
-- Confirmar un email específico
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'usuario@example.com' AND email_confirmed_at IS NULL;
```

**Reemplaza `usuario@example.com` con el email del usuario que quieres confirmar.**

### Opción 2: Usar la Función RPC desde la App

Si tienes la función RPC `confirm_user_email` creada, puedes confirmar desde la app:

```typescript
import { confirmUserEmail } from '../services/authService';

// En cualquier lugar de tu código
const { success, message } = await confirmUserEmail('usuario@example.com');
if (success) {
  console.log('Email confirmado!');
} else {
  console.error('Error:', message);
}
```

### Opción 3: Ejecutar el Script SQL desde Migración

Si aún no creaste la función RPC, ejecuta primero el contenido de:
`/scripts/confirm_email.sql`

en el SQL Editor de Supabase.

## Verificar que funciona

Después de confirmar el email, ejecuta esta query para verificar:

```sql
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'usuario@example.com';
```

Deberías ver que `email_confirmed_at` tiene una fecha/hora en lugar de NULL.

## Para Confirmación Automática en Desarrollo

Si quieres que todos los nuevos usuarios tengan sus emails automáticamente confirmados en desarrollo, puedes:

1. Crear un trigger en la tabla `auth.users` (si Supabase lo permite)
2. O llamar a `confirmUserEmail()` inmediatamente después de crear un usuario en `signUp()`

Ejemplo en signUp:

```typescript
// Después de crear el usuario exitosamente
if (authData.user) {
  // En desarrollo, confirmar automáticamente el email
  if (process.env.NODE_ENV === 'development') {
    await confirmUserEmail(email);
  }
}
```

## Notas Importantes

- ⚠️ `email_confirmed_at` en `auth.users` es diferente de `verificado` en la tabla `users`
- Supabase valida contra `auth.users.email_confirmed_at` para permitir login
- La tabla `users` es solo para datos de negocio
- Si actualizas solo `verificado` en `users`, el usuario no podrá iniciar sesión

## Debugging

Si aún no puedes iniciar sesión después de confirmar:

1. Verifica que el email sea exactamente igual (mayúsculas, espacios, etc.)
2. Revisa los logs de la app para ver qué error específico devuelve Supabase
3. Asegúrate que el usuario existe en `auth.users` (no solo en `users`)
4. Intenta cerrar sesión completamente y limpiar el almacenamiento de la app

