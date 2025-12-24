# 🔍 Diagnóstico: Trigger No Funciona Desde la App

## 🔴 Problema

El trigger funciona cuando insertas directamente desde SQL, pero no cuando la app llama a la función RPC `enviar_codigo_whatsapp`.

## 🔍 Posibles Causas

### 1. Permisos RLS (Row Level Security)
- El trigger puede no tener permisos para insertar
- La función RPC puede estar bloqueada por RLS

### 2. El Trigger Falla Silenciosamente
- El trigger puede estar fallando pero no mostrar el error
- Los errores pueden estar siendo capturados y silenciados

### 3. Service Role Key Incorrecto
- El `service_role_key` en el trigger puede ser incorrecto
- Puede ser el `anon_key` en lugar del `service_role_key`

### 4. pg_net No Está Habilitada
- La extensión `pg_net` puede no estar habilitada
- Sin ella, el trigger no puede hacer llamadas HTTP

## ✅ Solución Paso a Paso

### Paso 1: Ejecutar el Fix

Ejecuta este script en el SQL Editor:

```sql
-- Copia y pega el contenido de: scripts/fix_trigger_desde_app.sql
```

Este script:
- ✅ Mejora el trigger con mejor logging
- ✅ Agrega manejo de errores más robusto
- ✅ Verifica permisos RLS
- ✅ Crea función de prueba

### Paso 2: Verificar pg_net

Ejecuta:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

Si no existe:
1. Ve a Database > Extensions
2. Busca `pg_net`
3. Haz clic en "Enable"

### Paso 3: Verificar Service Role Key

1. Ve a: Settings > API
2. Copia el **service_role key** (el secreto, no el público)
3. Actualiza el trigger con el key correcto:
```sql
-- En el script fix_trigger_desde_app.sql, reemplaza:
v_service_role_key := 'TU_SERVICE_ROLE_KEY_AQUI';
```

### Paso 4: Probar el Trigger

Ejecuta:
```sql
SELECT public.test_trigger_whatsapp();
```

Esto insertará un código de prueba y debería activar el trigger.

### Paso 5: Verificar Logs

1. Ve a: Database > Logs (o usa el SQL Editor para ver logs)
2. Busca mensajes que empiecen con "Trigger activado"
3. Si hay errores, aparecerán como "WARNING"

### Paso 6: Probar Desde la App

1. Abre la app
2. Intenta verificar un teléfono
3. Revisa los logs de la app
4. Verifica en Supabase si se insertó el código:
```sql
SELECT * FROM public.codigos_verificacion
ORDER BY creado_en DESC
LIMIT 1;
```

## 🐛 Debug Adicional

### Verificar que el Trigger se Activa

Ejecuta esto después de llamar desde la app:
```sql
-- Ver códigos recientes
SELECT 
    telefono,
    codigo,
    usado,
    creado_en,
    expira_en
FROM public.codigos_verificacion
ORDER BY creado_en DESC
LIMIT 5;
```

Si el código se inserta pero el WhatsApp no llega:
- El trigger se activa pero falla al llamar a la edge function
- Revisa los logs de PostgreSQL para ver el error

### Verificar Llamadas HTTP

```sql
SELECT * FROM net.http_request_queue
ORDER BY created DESC
LIMIT 10;
```

Esto muestra las últimas llamadas HTTP hechas por pg_net.

## 🔧 Solución Alternativa: RPC Directa

Si el trigger sigue sin funcionar, usa la versión directa de la RPC:

1. Ejecuta: `scripts/enviar_codigo_whatsapp_directo.sql`
2. Esta versión llama directamente a la edge function sin depender del trigger
3. Reemplaza el `service_role_key` en el script

## 📋 Checklist

- [ ] Ejecutado `fix_trigger_desde_app.sql`
- [ ] pg_net habilitada
- [ ] service_role_key correcto en el trigger
- [ ] Probado con `test_trigger_whatsapp()`
- [ ] Revisados logs de PostgreSQL
- [ ] Probado desde la app
- [ ] Verificado que se insertan códigos desde la app

## 🆘 Si Aún No Funciona

1. **Usa la RPC directa** - `scripts/enviar_codigo_whatsapp_directo.sql`
2. **Revisa los logs de PostgreSQL** - Busca errores del trigger
3. **Verifica permisos RLS** - Asegúrate de que la función RPC pueda insertar
4. **Prueba con un usuario diferente** - Puede ser problema de permisos específicos

