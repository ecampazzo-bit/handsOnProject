# Eliminación de Cuenta de Usuario

Este documento explica cómo se implementó la funcionalidad para que los usuarios puedan eliminar su propia cuenta desde la aplicación web.

## Archivos Creados

1. **`/web/src/app/eliminar-cuenta/page.tsx`**: Página web para eliminar cuenta
2. **`/scripts/agregar_politica_delete_usuario.sql`**: Script SQL para agregar política RLS

## Configuración Requerida

### 1. Aplicar Política RLS en Supabase

Para que los usuarios puedan eliminar su propia cuenta, necesitas ejecutar el script SQL en Supabase:

```sql
-- Ejecutar en Supabase SQL Editor
-- Archivo: scripts/agregar_politica_delete_usuario.sql
```

Este script crea una política RLS que permite a los usuarios autenticados eliminar su propia cuenta de la tabla `public.users`.

### 2. Verificar que la Política se Aplicó Correctamente

Puedes verificar las políticas RLS ejecutando:

```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

Deberías ver una política llamada `"Users can delete own account"`.

## Funcionalidad

### Página de Eliminación de Cuenta

La página `/eliminar-cuenta` permite a los usuarios:

1. **Verificar autenticación**: Solo usuarios autenticados pueden acceder
2. **Confirmar eliminación**: Debe escribir "eliminar" para confirmar
3. **Verificar contraseña** (opcional pero recomendado): Puede ingresar su contraseña para mayor seguridad
4. **Eliminar cuenta**: 
   - Elimina el usuario de la tabla `public.users`
   - Marca la cuenta como inactiva (si la eliminación falla)
   - Cierra la sesión
   - Redirige a la página principal

### Limitaciones Actuales

**Nota importante**: La eliminación completa del usuario de Supabase Auth (`auth.users`) requiere permisos de administrador y no se puede hacer directamente desde el cliente por razones de seguridad.

Para una eliminación completa:
- El usuario puede contactar con soporte en `info@ofisi.ar`
- O se puede implementar una función Edge de Supabase con permisos de administrador

La página actual elimina el usuario de `public.users` y cierra la sesión, lo que efectivamente desactiva la cuenta.

## Enlaces

La página de eliminar cuenta está disponible en:

1. **Footer del sitio**: Enlace en la sección "Soporte"
2. **Página de Privacidad**: Enlace en la sección de "Derecho de Eliminación"

## Seguridad

- ✅ Verificación de autenticación antes de mostrar la página
- ✅ Confirmación requerida (escribir "eliminar")
- ✅ Verificación opcional de contraseña
- ✅ Política RLS que solo permite eliminar la propia cuenta
- ✅ Cierre de sesión automático después de la eliminación

## Próximos Pasos (Opcional)

Para una eliminación más completa, considera:

1. **Función Edge de Supabase**: Crear una función que elimine el usuario de `auth.users` usando el cliente de administrador
2. **Eliminación en cascada**: Configurar triggers en la base de datos para eliminar datos relacionados cuando se elimina un usuario
3. **Período de gracia**: Implementar un período de 30 días antes de eliminar permanentemente los datos

