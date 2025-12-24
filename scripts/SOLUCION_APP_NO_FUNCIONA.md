# 🔧 Solución: Funciona desde SQL pero no desde la App

## 🔴 Problema

- ✅ Funciona desde Supabase SQL Editor
- ✅ El trigger funciona
- ✅ El sandbox está configurado
- ❌ **NO funciona desde la app**

## 🔍 Causas Posibles

### 1. Permisos RLS (Row Level Security)
La función puede no tener permisos para insertar cuando se llama desde la app.

### 2. SECURITY DEFINER Faltante
La función puede no tener `SECURITY DEFINER`, lo que impide que se ejecute con permisos elevados.

### 3. search_path Incorrecto
La función puede no estar usando el schema correcto.

### 4. pg_net No Funciona desde la App
Puede haber un problema con cómo `pg_net` se ejecuta cuando se llama desde la app.

## ✅ Solución

### Paso 1: Ejecutar el Fix

Ejecuta este script en el SQL Editor:

```sql
-- Copia y pega el contenido de: scripts/fix_rpc_desde_app.sql
```

Este script:
- ✅ Asegura que la función tenga `SECURITY DEFINER`
- ✅ Configura `SET search_path = public`
- ✅ Agrega manejo de excepciones más robusto
- ✅ Captura el `job_id` de pg_net para debug

### Paso 2: Verificar

Ejecuta este query:

```sql
SELECT 
    routine_name,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'enviar_codigo_whatsapp';
```

Deberías ver:
```
routine_name            | security_type
------------------------|---------------
enviar_codigo_whatsapp  | DEFINER
```

### Paso 3: Probar desde la App

1. Abre la app
2. Intenta verificar un teléfono
3. Debería funcionar ahora

### Paso 4: Si Aún No Funciona - Verificar Llamadas HTTP

Ejecuta:

```sql
SELECT 
    id,
    url,
    method,
    created,
    error_msg
FROM net.http_request_queue
WHERE url LIKE '%send-whatsapp-code%'
ORDER BY created DESC
LIMIT 5;
```

**Si NO hay registros:**
- `pg_net` no está haciendo las llamadas
- Verifica que `pg_net` esté habilitada
- Verifica el `service_role_key`

**Si hay registros con error:**
- Revisa el `error_msg`
- Puede ser problema de autenticación

## 🔍 Debug Adicional

### Verificar Códigos Generados

```sql
SELECT 
    telefono,
    codigo,
    usado,
    creado_en
FROM public.codigos_verificacion
ORDER BY creado_en DESC
LIMIT 5;
```

Si los códigos se están generando pero el WhatsApp no llega:
- El problema está en la llamada HTTP a la edge function
- Revisa los logs de la edge function

### Verificar Permisos RLS

```sql
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'codigos_verificacion';
```

Si hay políticas restrictivas, pueden estar bloqueando la inserción desde la app.

## 📋 Checklist

- [ ] Función tiene `SECURITY DEFINER`
- [ ] Función tiene `SET search_path = public`
- [ ] `pg_net` está habilitada
- [ ] `service_role_key` es correcto
- [ ] Probado desde la app
- [ ] Verificadas llamadas HTTP

## 🎯 Solución Más Probable

El problema más común es que la función no tiene `SECURITY DEFINER` o `SET search_path`. El script `fix_rpc_desde_app.sql` corrige ambos problemas.

