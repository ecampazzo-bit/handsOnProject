# Pasos ANTES de Aplicar el Fix de RLS

## ⚠️ IMPORTANTE: Verificar antes de aplicar

Sigue estos pasos en orden para asegurar que el registro de usuarios no se rompa:

## Paso 1: Verificar Funciones RPC (OBLIGATORIO)

Ejecuta en Supabase SQL Editor:

```sql
-- Ejecutar: verificar_funciones_rpc_registro.sql
```

**Resultado esperado:**
- Deberías ver 3 funciones: `insert_user_profile`, `insert_prestador`, `save_prestador_servicios`
- Todas deben tener `is_security_definer = true` ✅

**Si NO aparecen las funciones o no son SECURITY DEFINER:**
- Ve al Paso 2

**Si SÍ aparecen y son SECURITY DEFINER:**
- Ve directamente al Paso 3

## Paso 2: Crear Funciones RPC (Solo si faltan)

Ejecuta en Supabase SQL Editor:

```sql
-- Ejecutar: crear_funciones_rpc_registro.sql
```

Esto creará las funciones necesarias con `SECURITY DEFINER` para que ignoren RLS.

**Después de ejecutar:**
- Verifica nuevamente con el script del Paso 1
- Todas las funciones deben aparecer con `is_security_definer = true`

## Paso 3: Probar Registro Actual (RECOMENDADO)

Antes de aplicar RLS, prueba que el registro funciona:

1. Abre tu app móvil
2. Intenta registrar un nuevo usuario (cliente)
3. Intenta registrar un nuevo usuario (prestador)
4. Verifica que ambos se crean correctamente

**Si el registro funciona:**
- Continúa al Paso 4

**Si el registro NO funciona:**
- Revisa los logs de error
- Verifica que las funciones RPC existen
- NO apliques el fix de RLS hasta resolver esto

## Paso 4: Aplicar Fix de RLS

Una vez verificadas las funciones RPC:

1. **Haz backup de tu base de datos** (Settings → Database → Backups)
2. Ejecuta `fix_security_rls_policies.sql` en Supabase SQL Editor
3. Verifica que no hay errores

## Paso 5: Probar Registro Después de RLS

Después de aplicar el fix, prueba nuevamente:

1. ✅ Registrar un nuevo usuario (cliente)
2. ✅ Registrar un nuevo usuario (prestador)
3. ✅ Registrar un nuevo usuario (ambos)
4. ✅ Verificar que el perfil se crea
5. ✅ Verificar que el prestador se crea (si aplica)

**Si todo funciona:**
- ✅ El fix está completo
- Verifica en Security Advisor que los 18 errores desaparecieron

**Si algo falla:**
- Revisa los logs de error
- Verifica que las funciones RPC son SECURITY DEFINER
- Puedes deshabilitar RLS temporalmente en una tabla específica:
  ```sql
  ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;
  ```

## Resumen de Archivos

1. **`verificar_funciones_rpc_registro.sql`** - Verifica si las funciones existen
2. **`crear_funciones_rpc_registro.sql`** - Crea las funciones si faltan
3. **`fix_security_rls_policies.sql`** - Aplica el fix de RLS (ejecutar después de verificar)
4. **`ANALISIS_IMPACTO_RLS_REGISTRO.md`** - Análisis detallado del impacto

## Preguntas Frecuentes

### ¿Por qué necesito funciones SECURITY DEFINER?

Las funciones `SECURITY DEFINER` ejecutan con privilegios elevados y **ignoran RLS**. Esto permite que el registro funcione incluso cuando RLS está habilitado, porque la función puede insertar datos sin depender de las políticas del usuario.

### ¿Qué pasa si las funciones no son SECURITY DEFINER?

Si las funciones no son SECURITY DEFINER, dependen de las políticas RLS del usuario que las llama. Esto podría funcionar si el usuario ya está autenticado, pero es más seguro usar SECURITY DEFINER.

### ¿Puedo aplicar el fix sin verificar primero?

**NO recomendado**. Si las funciones RPC no existen o no son SECURITY DEFINER, el registro podría romperse. Es mejor verificar primero.

### ¿Cómo sé si el registro se rompió?

Síntomas:
- Error al intentar registrar un nuevo usuario
- Mensaje de "permission denied" o "row-level security policy violation"
- El usuario se crea en `auth.users` pero no en `public.users`

### ¿Cómo revierto el fix si algo falla?

Puedes deshabilitar RLS en tablas específicas:

```sql
-- Deshabilitar RLS en una tabla
ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;

-- O eliminar todas las políticas
DROP POLICY IF EXISTS "nombre_politica" ON nombre_tabla;
```

Pero es mejor hacer backup antes de aplicar el fix.
