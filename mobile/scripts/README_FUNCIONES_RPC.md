# Funciones RPC para Registro de Usuarios

Este directorio contiene las funciones RPC necesarias para el registro de usuarios que solucionan el error "Unauthorized: user must exist in auth.users or match authenticated user".

## Problema

Durante el registro de usuarios, puede haber un pequeño delay entre:
1. La creación del usuario en Supabase Auth (`auth.users`)
2. La propagación del usuario en la base de datos
3. La inserción del perfil en la tabla `public.users`

Esto causaba el error: `Unauthorized: user must exist in auth.users or match authenticated user`

## Solución

Las funciones RPC usan `SECURITY DEFINER` para bypass RLS y permiten la inserción durante el registro, incluso si hay un pequeño delay en la propagación del usuario.

## Funciones Incluidas

### 1. `insert_user_profile.sql`
Inserta el perfil de usuario durante el registro.

**Parámetros:**
- `p_id` (uuid): ID del usuario (debe coincidir con auth.uid())
- `p_email` (text): Email del usuario
- `p_password` (text): Contraseña (se hashea automáticamente)
- `p_nombre` (text): Nombre del usuario
- `p_apellido` (text): Apellido del usuario
- `p_telefono` (text): Teléfono del usuario
- `p_direccion` (text, opcional): Dirección
- `p_latitud` (numeric, opcional): Latitud
- `p_longitud` (numeric, opcional): Longitud
- `p_tipo_usuario` (tipo_usuario, opcional): Tipo de usuario (default: 'cliente')

**Retorna:** JSON con los datos del usuario (sin password)

### 2. `insert_prestador.sql`
Inserta un prestador durante el registro.

**Parámetros:**
- `p_usuario_id` (uuid): ID del usuario
- `p_descripcion_profesional` (text, opcional): Descripción profesional

**Retorna:** JSON con los datos del prestador creado

### 3. `save_prestador_servicios.sql`
Guarda los servicios de un prestador. Esta función es especialmente importante porque se llama después del registro cuando el usuario selecciona sus servicios.

**Parámetros:**
- `p_usuario_id` (uuid): ID del usuario
- `p_servicios` (jsonb): Array de servicios en formato:
  ```json
  [
    {"servicio_id": 1, "precio_base": 1000, "precio_desde": 800, "experiencia_años": 5},
    {"servicio_id": 2, "precio_base": 2000, "precio_desde": 1500, "experiencia_años": 3}
  ]
  ```

**Retorna:** JSON con el resultado de la operación

**Nota importante:** Esta función verifica primero si `auth.uid()` coincide con `p_usuario_id` (caso más común cuando el usuario ya está autenticado). Si no coincide, verifica que el usuario existe en `auth.users` con retry logic. Esto resuelve el error "Unauthorized: user must exist in auth.users or match authenticated user" que puede ocurrir al agregar servicios después del registro.

## Cómo Aplicar

### Opción 1: Desde el Dashboard de Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **SQL Editor**
3. Copia y pega el contenido de cada archivo `.sql` en orden:
   - `insert_user_profile.sql`
   - `insert_prestador.sql`
   - `save_prestador_servicios.sql`
4. Ejecuta cada script haciendo clic en **Run**

### Opción 2: Desde la línea de comandos (psql)

```bash
# Conectarte a tu base de datos Supabase
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Ejecutar los scripts en orden
\i mobile/scripts/insert_user_profile.sql
\i mobile/scripts/insert_prestador.sql
\i mobile/scripts/save_prestador_servicios.sql
```

### Opción 3: Usando Supabase CLI

```bash
# Si tienes Supabase CLI configurado
supabase db push
```

## Características de Seguridad

Todas las funciones:
- ✅ Usan `SECURITY DEFINER` para bypass RLS durante el registro
- ✅ Verifican que el usuario exista en `auth.users` (con retry logic)
- ✅ Verifican que el ID coincida con `auth.uid()` como fallback
- ✅ Manejan errores apropiadamente
- ✅ Retornan datos sin información sensible (sin passwords)

## Verificación

Después de aplicar los scripts, puedes verificar que las funciones existen:

```sql
-- Verificar que las funciones existen
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN ('insert_user_profile', 'insert_prestador', 'save_prestador_servicios')
  AND pronamespace = 'public'::regnamespace;
```

## Notas Importantes

1. **Orden de ejecución**: Ejecuta los scripts en el orden indicado, ya que `insert_prestador` y `save_prestador_servicios` dependen de que `insert_user_profile` funcione correctamente.

2. **Permisos**: Las funciones usan `SECURITY DEFINER`, lo que significa que se ejecutan con los permisos del propietario de la función (normalmente el usuario `postgres`). Esto es necesario para bypass RLS durante el registro.

3. **Retry Logic**: Las funciones incluyen lógica de retry (hasta 5 intentos con 200ms de delay) para manejar delays en la propagación del usuario en `auth.users`.

4. **Manejo de Duplicados**: Si un usuario o prestador ya existe, las funciones retornan los datos existentes en lugar de lanzar un error.

## Troubleshooting

### Error: "function does not exist"
- Asegúrate de haber ejecutado los scripts SQL en Supabase
- Verifica que estás usando el esquema correcto (`public`)

### Error: "permission denied"
- Verifica que las funciones tienen `SECURITY DEFINER`
- Asegúrate de que el usuario tiene permisos para ejecutar funciones RPC

### Error: "Unauthorized: user must exist in auth.users"
- Verifica que el usuario se creó correctamente en Supabase Auth antes de llamar a la función
- Asegúrate de que la sesión está establecida correctamente en el cliente

## Actualización de Funciones Existentes

Si ya tienes estas funciones definidas en Supabase, ejecutar estos scripts las actualizará con la nueva lógica de retry y verificación mejorada.

