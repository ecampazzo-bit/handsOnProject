# Cambiar Email del Administrador en Supabase

Esta guía explica cómo cambiar el email del administrador de `admin@ofisi.com` a `admin@ofisi.ar` en Supabase.

## 📋 Métodos para Cambiar el Email

### Método 1: Desde el Dashboard de Supabase (Recomendado)

1. **Accede a Supabase Dashboard**
   - Ve a [https://app.supabase.com](https://app.supabase.com)
   - Selecciona tu proyecto

2. **Navega a Authentication**
   - En el menú lateral, ve a **Authentication** → **Users**

3. **Busca el usuario administrador**
   - Busca el usuario con email `admin@ofisi.com`
   - Haz clic en el usuario para abrir sus detalles

4. **Cambia el email**
   - Haz clic en el botón **"Edit"** o en el ícono de edición
   - Cambia el email de `admin@ofisi.com` a `admin@ofisi.ar`
   - Haz clic en **"Save"** o **"Update"**

5. **Verifica el cambio**
   - El usuario ahora debería aparecer con el nuevo email `admin@ofisi.ar`

### Método 2: Usando SQL (Alternativo)

Si prefieres usar SQL directamente:

1. **Accede al SQL Editor**
   - En Supabase Dashboard, ve a **SQL Editor**
   - Crea una nueva query

2. **Ejecuta el siguiente SQL**:
```sql
-- Actualizar el email en la tabla auth.users
UPDATE auth.users
SET email = 'admin@ofisi.ar',
    email_change = 'admin@ofisi.ar',
    email_change_token = NULL,
    email_change_token_new = NULL
WHERE email = 'admin@ofisi.com';

-- Actualizar el email en la tabla public.users (si existe)
UPDATE public.users
SET email = 'admin@ofisi.ar'
WHERE email = 'admin@ofisi.com';
```

3. **Verifica el cambio**:
```sql
-- Verificar que el cambio se aplicó correctamente
SELECT id, email, created_at
FROM auth.users
WHERE email = 'admin@ofisi.ar';
```

## ⚠️ Consideraciones Importantes

### 1. Verificación de Email
- Si el email anterior estaba verificado, el nuevo email **NO estará verificado automáticamente**
- Puedes verificar el nuevo email manualmente desde el Dashboard:
  - Ve a **Authentication** → **Users**
  - Selecciona el usuario `admin@ofisi.ar`
  - Haz clic en **"Verify email"** o marca el checkbox de verificación

### 2. Sesiones Activas
- Si el administrador tiene sesiones activas, deberá:
  - Cerrar sesión
  - Iniciar sesión nuevamente con el nuevo email `admin@ofisi.ar`

### 3. Políticas RLS
- Si tienes políticas RLS que hacen referencia al email antiguo, actualízalas:
  - Ejecuta el script `scripts/crear_politica_admin.sql` actualizado
  - O actualiza manualmente las políticas que referencien `admin@ofisi.com`

### 4. Base de Datos
- Verifica que el email también se actualice en la tabla `public.users` si existe
- Algunos sistemas pueden tener el email duplicado en múltiples tablas

## 🔄 Pasos Adicionales Después del Cambio

1. **Actualizar código** (ya hecho):
   - ✅ `web/src/app/admin/login/page.tsx` - Validación de admin
   - ✅ `scripts/crear_politica_admin.sql` - Función is_admin()
   - ✅ `web/README_ADMIN.md` - Documentación

2. **Probar el login**:
   - Intenta iniciar sesión con `admin@ofisi.ar`
   - Verifica que el acceso al panel de administración funcione

3. **Verificar políticas RLS**:
   - Si usas políticas RLS basadas en email, ejecuta el script actualizado
   - O verifica manualmente que las políticas reconozcan el nuevo email

## 🧪 Verificación

Después de cambiar el email, verifica:

1. **Login funciona**:
   - Ve a `https://ofisi.ar/admin/login`
   - Inicia sesión con `admin@ofisi.ar` y tu contraseña
   - Deberías poder acceder al panel de administración

2. **Políticas RLS funcionan**:
   - Si tienes políticas RLS, verifica que el administrador pueda:
     - Ver todos los usuarios
     - Actualizar usuarios
     - Realizar acciones administrativas

3. **Email verificado**:
   - Verifica que el email esté marcado como verificado en Supabase
   - Si no, verifícalo manualmente desde el Dashboard

## 📝 Notas

- El cambio de email en Supabase es **inmediato**
- No necesitas esperar ningún tiempo de propagación
- Si tienes problemas, verifica que:
  - El nuevo email no esté ya en uso por otro usuario
  - Las políticas RLS estén actualizadas
  - El código de la aplicación esté actualizado (ya hecho)

## 🆘 Solución de Problemas

### Error: "Email already in use"
- Verifica que no exista otro usuario con `admin@ofisi.ar`
- Si existe, elimínalo primero o usa un email diferente

### No puedo iniciar sesión con el nuevo email
- Verifica que el cambio se haya aplicado correctamente en Supabase
- Asegúrate de usar la contraseña correcta
- Intenta cerrar sesión completamente y volver a iniciar

### Las políticas RLS no funcionan
- Ejecuta nuevamente el script `scripts/crear_politica_admin.sql`
- Verifica que la función `is_admin()` esté actualizada con el nuevo email

