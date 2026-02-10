# Análisis de Impacto: RLS Policies en el Registro de Usuarios

## Flujo Actual de Registro

Según el código en `authService.ts`, el registro funciona así:

1. **Crear usuario en Supabase Auth** (`supabase.auth.signUp()`)
   - Esto crea el usuario en `auth.users`
   - Automáticamente establece una sesión autenticada
   - El usuario queda con `auth.role() = 'authenticated'`

2. **Insertar perfil en tabla `users`** (función RPC `insert_user_profile`)
   - Se llama después de que la sesión está establecida
   - Usa `authData.user.id` como el ID del usuario

3. **Crear registro en `prestadores`** (si aplica)
   - Función RPC `insert_prestador`
   - Solo si `tipoUsuario === "prestador" || "ambos"`

## Análisis de Políticas RLS Actuales

### Tabla `users` - Política Actual

```sql
create policy "Only authenticated users can insert" on public.users
for insert
with check (auth.role() = 'authenticated');
```

**✅ ESTO DEBERÍA FUNCIONAR** porque:
- Después de `signUp()`, el usuario ya está autenticado
- `auth.role()` retornará `'authenticated'`
- La política permite insertar si `auth.role() = 'authenticated'`

### Tabla `prestadores` - Política Actual

```sql
create policy "Users can insert own prestador" on public.prestadores
for insert
with check (auth.uid() = usuario_id);
```

**✅ ESTO DEBERÍA FUNCIONAR** porque:
- El usuario ya está autenticado
- `auth.uid()` será igual al `usuario_id` que se pasa
- La política permite insertar si `auth.uid() = usuario_id`

## ⚠️ POSIBLE PROBLEMA: Funciones RPC

El código usa funciones RPC (`insert_user_profile`, `insert_prestador`) que probablemente son `SECURITY DEFINER`. Estas funciones:

- **Si son SECURITY DEFINER**: Ejecutan con privilegios elevados y **ignoran RLS** ✅
- **Si NO son SECURITY DEFINER**: Dependen de las políticas RLS del usuario que las llama

### Verificación Necesaria

Necesitas verificar si estas funciones existen y cómo están definidas:

```sql
-- Verificar si existen las funciones
SELECT 
    proname as function_name,
    prosecdef as is_security_definer,
    pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname IN ('insert_user_profile', 'insert_prestador', 'save_prestador_servicios')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

## Impacto de las Nuevas Políticas RLS

### ✅ NO AFECTA el Registro

Las nuevas políticas RLS que agregamos **NO afectan** el registro porque:

1. **Tabla `users`**: Ya tiene RLS y la política permite insertar usuarios autenticados
2. **Tabla `prestadores`**: Ya tiene RLS y la política permite insertar si `auth.uid() = usuario_id`
3. **Otras tablas**: No se usan durante el registro inicial

### ⚠️ POSIBLE PROBLEMA: Si las funciones RPC no existen

Si las funciones RPC `insert_user_profile` o `insert_prestador` **NO existen** o **NO son SECURITY DEFINER**, entonces:

- El registro podría fallar
- Necesitarías crear estas funciones o ajustar las políticas

## Recomendaciones

### 1. Verificar Funciones RPC (CRÍTICO)

Antes de aplicar el script, verifica que estas funciones existan:

```sql
-- Verificar funciones RPC
SELECT 
    proname as function_name,
    prosecdef as is_security_definer
FROM pg_proc
WHERE proname IN ('insert_user_profile', 'insert_prestador', 'save_prestador_servicios')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

**Si no existen**, necesitas crearlas. Aquí está un ejemplo:

```sql
-- Función para insertar perfil de usuario (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.insert_user_profile(
    p_id uuid,
    p_email text,
    p_password text,
    p_nombre text,
    p_apellido text,
    p_telefono text,
    p_direccion text DEFAULT NULL,
    p_latitud numeric DEFAULT NULL,
    p_longitud numeric DEFAULT NULL,
    p_tipo_usuario public.tipo_usuario DEFAULT 'cliente'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user jsonb;
BEGIN
    -- Verificar que el usuario existe en auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_id) THEN
        RAISE EXCEPTION 'Usuario no existe en auth.users';
    END IF;

    -- Insertar en tabla users
    INSERT INTO public.users (
        id, email, password, nombre, apellido, telefono,
        direccion, latitud, longitud, tipo_usuario
    ) VALUES (
        p_id, p_email, p_password, p_nombre, p_apellido, p_telefono,
        p_direccion, p_latitud, p_longitud, p_tipo_usuario
    )
    RETURNING jsonb_build_object(
        'id', id,
        'email', email,
        'nombre', nombre,
        'apellido', apellido,
        'telefono', telefono,
        'direccion', direccion,
        'latitud', latitud,
        'longitud', longitud,
        'tipo_usuario', tipo_usuario,
        'verificado', verificado,
        'activo', activo
    ) INTO v_user;

    RETURN v_user;
END;
$$;
```

### 2. Ajustar Política de `users` (OPCIONAL pero RECOMENDADO)

La política actual permite que cualquier usuario autenticado inserte cualquier usuario. Podrías hacerla más restrictiva:

```sql
-- Política más restrictiva (solo puede insertar su propio perfil)
DROP POLICY IF EXISTS "Only authenticated users can insert" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = id
);
```

**PERO**: Esto podría romper el registro si las funciones RPC no son SECURITY DEFINER. Mejor dejarla como está si las funciones RPC funcionan.

### 3. Probar el Registro Después de Aplicar RLS

Después de aplicar el script, prueba:

1. ✅ Registrar un nuevo usuario (cliente)
2. ✅ Registrar un nuevo usuario (prestador)
3. ✅ Registrar un nuevo usuario (ambos)
4. ✅ Verificar que el perfil se crea correctamente
5. ✅ Verificar que el prestador se crea (si aplica)

## Conclusión

### ✅ El script NO debería romper el registro SI:

1. Las funciones RPC `insert_user_profile` y `insert_prestador` existen
2. Estas funciones son `SECURITY DEFINER` (ignoran RLS)
3. O si no son SECURITY DEFINER, el usuario ya está autenticado cuando se llaman

### ⚠️ PODRÍA romper el registro SI:

1. Las funciones RPC no existen
2. Las funciones RPC no son SECURITY DEFINER Y hay algún problema con la sesión

### 🔧 Acción Requerida

**ANTES de aplicar el script**, ejecuta esta verificación:

```sql
-- Verificar funciones críticas
SELECT 
    proname as function_name,
    prosecdef as is_security_definer,
    CASE 
        WHEN prosecdef THEN '✅ IGNORA RLS (seguro)'
        ELSE '⚠️ DEPENDE DE RLS (verificar)'
    END as security_status
FROM pg_proc
WHERE proname IN ('insert_user_profile', 'insert_prestador', 'save_prestador_servicios')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

Si las funciones no existen o no son SECURITY DEFINER, necesitas crearlas o ajustar las políticas antes de aplicar el script.
