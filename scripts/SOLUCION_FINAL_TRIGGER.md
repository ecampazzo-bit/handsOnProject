# 🎯 Solución Final: Trigger No Funciona Desde la App

## 🔴 Problema Identificado

El trigger funciona desde SQL pero no desde la app. Esto puede ser por:
1. **Service Role Key incorrecto** - El trigger usa `sb_publishable_...` que es un anon_key, no un service_role_key
2. **Permisos RLS** - Puede haber restricciones
3. **El trigger falla silenciosamente**

## ✅ Solución Recomendada: RPC Directa

En lugar de depender del trigger, usa la versión directa de la RPC que llama a la edge function directamente.

### Paso 1: Obtener Service Role Key Correcto

1. Ve a: Supabase Dashboard > Settings > API
2. Busca **"service_role key"** (el secreto, NO el público)
3. Debe ser un JWT largo que empieza con `eyJ...`
4. **NO uses** el que empieza con `sb_publishable_` (ese es el anon_key)

### Paso 2: Ejecutar RPC Directa

Ejecuta este script en el SQL Editor:

```sql
-- Copia y pega el contenido de: scripts/enviar_codigo_whatsapp_directo.sql
-- IMPORTANTE: Reemplaza 'TU_SERVICE_ROLE_KEY_AQUI' con tu service_role_key real
```

Esta versión:
- ✅ Llama directamente a la edge function desde la RPC
- ✅ No depende del trigger
- ✅ Más confiable y fácil de debuggear
- ✅ Funciona igual desde SQL y desde la app

### Paso 3: Verificar

1. Prueba desde la app
2. Debería funcionar correctamente

## 🔄 Alternativa: Arreglar el Trigger

Si prefieres usar el trigger, ejecuta:

```sql
-- Copia y pega: scripts/fix_trigger_desde_app.sql
-- IMPORTANTE: Reemplaza el service_role_key con el correcto
```

## 📋 Comparación

| Método | Pros | Contras |
|--------|------|---------|
| **RPC Directa** | ✅ Más confiable<br>✅ Fácil de debuggear<br>✅ No depende de triggers | ⚠️ Llamada HTTP en cada request |
| **Trigger** | ✅ Automático<br>✅ Separado de la lógica | ⚠️ Más difícil de debuggear<br>⚠️ Puede fallar silenciosamente |

## 🎯 Recomendación

**Usa la RPC Directa** - Es más confiable y funciona igual desde SQL y desde la app.

