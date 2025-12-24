# 📋 Guía Paso a Paso: Ejecutar el Script

## ✅ Paso 1: Abrir SQL Editor

1. Ve a: https://supabase.com/dashboard/project/kqxnjpyupcxbajuzsbtx
2. En el menú lateral izquierdo, haz clic en **"SQL Editor"**
3. O ve directamente a: https://supabase.com/dashboard/project/kqxnjpyupcxbajuzsbtx/sql/new

## ✅ Paso 2: Copiar el Script

1. Abre el archivo: `scripts/enviar_codigo_whatsapp_directo_mejorado.sql`
2. **Selecciona TODO el contenido** (Ctrl+A o Cmd+A)
3. **Copia** (Ctrl+C o Cmd+C)

## ✅ Paso 3: Pegar en SQL Editor

1. En el SQL Editor de Supabase, **pega** el script (Ctrl+V o Cmd+V)
2. Verifica que el script completo esté pegado

## ✅ Paso 4: Verificar Service Role Key

El script ya tiene tu service_role_key configurado:
```
v_service_role_key := 'sb_secret_mcxbtxfJQPsXOxFxVmnkAQ_lBX9uGEX';
```

Si necesitas cambiarlo:
1. Ve a: Settings > API
2. Busca "service_role key" (el secreto)
3. Reemplázalo en la línea 92 del script

## ✅ Paso 5: Ejecutar el Script

1. Haz clic en el botón **"Run"** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
2. Espera a que se ejecute (puede tomar unos segundos)
3. Deberías ver: **"Success. No rows returned"** o un mensaje de éxito

## ✅ Paso 6: Verificar que Funcionó

Ejecuta este query para verificar:

```sql
-- Verificar que la función existe
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'enviar_codigo_whatsapp';
```

Deberías ver la función en los resultados.

## ✅ Paso 7: Probar la Función

Ejecuta este query para probar:

```sql
-- Probar la función (reemplaza con tu teléfono)
SELECT * FROM public.enviar_codigo_whatsapp('+5491112345678');
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Código generado y enviado exitosamente",
  "codigo": "123456",
  "telefono_normalizado": "+5491112345678",
  "expira_en": "2024-...",
  "http_status": 200
}
```

## ✅ Paso 8: Probar Desde la App

1. Abre la app móvil
2. Intenta verificar un teléfono
3. Debería funcionar correctamente
4. Revisa los logs de la app para ver si hay errores

## 🐛 Si Hay Errores

### Error: "function normalizar_telefono does not exist"
**Solución:** Ejecuta primero `scripts/fix_verificacion_codigo.sql` para crear la función de normalización.

### Error: "extension pg_net does not exist"
**Solución:**
1. Ve a: Database > Extensions
2. Busca `pg_net`
3. Haz clic en "Enable"

### Error: "Unauthorized" o "Invalid API key"
**Solución:** Verifica que el service_role_key sea correcto en Settings > API.

## 📋 Checklist Final

- [ ] Script ejecutado exitosamente
- [ ] Función `enviar_codigo_whatsapp` existe
- [ ] Probada la función desde SQL
- [ ] Probada desde la app
- [ ] WhatsApp llega correctamente

## 🎉 ¡Listo!

Si todo funciona, ya deberías poder recibir códigos de verificación por WhatsApp desde la app.

