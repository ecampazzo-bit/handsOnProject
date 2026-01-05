# Solución: No aparecen usuarios en el Dashboard

## 🔍 Diagnóstico

Si los usuarios no aparecen en el dashboard de administración, puede deberse a varias causas:

### 1. SERVICE_ROLE_KEY no configurado en Hostinger

**Problema más común:** El `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` no está configurado en las variables de entorno de Hostinger.

**Solución:**
1. Accede al panel de Hostinger
2. Ve a la configuración de tu aplicación Node.js
3. Busca la sección de **Variables de Entorno**
4. Agrega o verifica estas variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://kqxnjpyupcxbajuzsbtx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```
5. **Importante:** El `SERVICE_ROLE_KEY` es diferente del `ANON_KEY` y es necesario para bypass RLS
6. Reinicia la aplicación después de agregar las variables

### 2. Verificar en la Consola del Navegador

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Console**
3. Recarga la página del dashboard
4. Busca mensajes que empiecen con `=== Cargando usuarios ===`
5. Revisa los logs para ver:
   - Si hay errores de autenticación
   - Si la consulta retorna datos vacíos
   - Si hay errores de permisos

### 3. Verificar en Supabase

1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta esta consulta para verificar que hay usuarios:
   ```sql
   SELECT COUNT(*) as total_usuarios FROM public.users;
   ```
3. Si retorna 0, no hay usuarios en la base de datos
4. Si retorna un número mayor a 0, el problema es de permisos o configuración

### 4. Verificar Políticas RLS

Si las políticas RLS están muy restrictivas, incluso el `SERVICE_ROLE_KEY` podría tener problemas.

1. Ve a Supabase Dashboard → Authentication → Policies
2. Verifica que las políticas permitan lectura para administradores
3. O temporalmente desactiva RLS en la tabla `users` para probar:
   ```sql
   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
   ```
   **⚠️ Solo para pruebas. Reactiva RLS después.**

## 🛠️ Soluciones Implementadas

### Mejoras en el Código

1. **Logs de depuración mejorados:**
   - Muestra información detallada en la consola
   - Indica si hay errores específicos
   - Muestra cuántos usuarios se encontraron

2. **Manejo de errores mejorado:**
   - Muestra mensajes de error más descriptivos
   - Maneja el caso de usuarios vacíos
   - No falla silenciosamente

3. **Verificación de SERVICE_ROLE_KEY:**
   - Advertencia en desarrollo si no está configurado
   - Fallback a ANON_KEY si no está disponible (puede causar problemas)

## 📋 Checklist de Verificación

- [ ] `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` está configurado en Hostinger
- [ ] Las variables de entorno están correctamente escritas (sin espacios)
- [ ] La aplicación se reinició después de agregar las variables
- [ ] Hay usuarios en la tabla `public.users` en Supabase
- [ ] No hay errores en la consola del navegador
- [ ] Las políticas RLS permiten acceso administrativo

## 🔧 Pasos para Configurar SERVICE_ROLE_KEY en Hostinger

1. **Obtener el SERVICE_ROLE_KEY:**
   - Ve a Supabase Dashboard
   - Settings → API
   - Copia el **service_role key** (secret) - ⚠️ NO el anon key

2. **Configurar en Hostinger:**
   - Panel de Hostinger → Tu aplicación Node.js
   - Variables de Entorno
   - Agrega: `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
   - Valor: pega el service_role key copiado
   - Guarda y reinicia la aplicación

3. **Verificar:**
   - Abre la consola del navegador (F12)
   - Ve al dashboard de administración
   - Revisa los logs en la consola
   - Deberías ver: `=== Cargando usuarios ===` y luego los datos

## 🆘 Si el Problema Persiste

1. **Revisa los logs del servidor en Hostinger:**
   - Busca errores relacionados con Supabase
   - Verifica que las variables de entorno estén cargadas

2. **Prueba la consulta directamente en Supabase:**
   ```sql
   SELECT id, email, nombre, apellido, tipo_usuario, activo, verificado, created_at
   FROM public.users
   ORDER BY created_at DESC;
   ```

3. **Verifica que el usuario admin esté autenticado:**
   - Asegúrate de estar logueado como administrador
   - Verifica que `sessionStorage` tenga `admin_authenticated: 'true'`

4. **Contacta soporte con:**
   - Capturas de pantalla de la consola del navegador
   - Logs del servidor de Hostinger
   - Mensaje de error completo (si hay)

## 📚 Referencias

- [Supabase Service Role Key](https://supabase.com/docs/guides/api/api-keys)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [Hostinger Environment Variables](https://support.hostinger.com/en/articles/6476220-how-to-deploy-a-node-js-application)

