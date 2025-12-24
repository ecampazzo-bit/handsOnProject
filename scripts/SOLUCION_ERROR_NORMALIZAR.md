# 🔧 Solución: Error "function normalizar_telefono does not exist"

## 🔴 Problema

Al ejecutar el script, obtienes este error:
```json
{"error":"function public.normalizar_telefono(text) does not exist","success":false}
```

## ✅ Solución

Ejecuta el script completo que crea ambas funciones:

### Paso 1: Ejecutar Script Completo

1. Ve a: SQL Editor de Supabase
2. Abre el archivo: `scripts/enviar_codigo_whatsapp_completo.sql`
3. **Copia TODO el contenido**
4. Pégalo en el SQL Editor
5. Haz clic en **"Run"**

Este script:
- ✅ Crea primero la función `normalizar_telefono`
- ✅ Luego crea/actualiza la función `enviar_codigo_whatsapp`
- ✅ Verifica que ambas funciones existan

### Paso 2: Verificar

Después de ejecutar, deberías ver en los resultados:

```
routine_name              | routine_type
--------------------------|-------------
enviar_codigo_whatsapp    | FUNCTION
normalizar_telefono       | FUNCTION
```

### Paso 3: Probar

Ejecuta este query:

```sql
SELECT * FROM public.enviar_codigo_whatsapp('+5491112345678');
```

Deberías ver:
```json
{
  "success": true,
  "message": "Código generado y enviado exitosamente",
  "codigo": "123456",
  "telefono_normalizado": "+5491112345678",
  ...
}
```

## 🎯 ¿Por qué pasó esto?

El script `enviar_codigo_whatsapp_directo_mejorado.sql` asume que la función `normalizar_telefono` ya existe, pero no la crea. El script completo (`enviar_codigo_whatsapp_completo.sql`) crea ambas funciones.

## ✅ Listo

Una vez ejecutado el script completo, debería funcionar correctamente desde la app.

