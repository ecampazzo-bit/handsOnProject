# Solución: Verificación de Teléfono No Funciona

## Problema
La verificación del número de celular no está funcionando, aunque antes funcionaba correctamente.

## Posibles Causas

1. **Normalización de teléfono inconsistente**: El formato del teléfono puede no coincidir entre el envío y la verificación
2. **Funciones RPC desactualizadas**: Las funciones en la base de datos pueden no estar usando la normalización correcta
3. **Tabla codigos_verificacion incompleta**: Puede faltar el campo `intentos` o tener estructura incorrecta
4. **Códigos expirados**: Puede haber códigos antiguos bloqueando la verificación

## Solución Paso a Paso

### Paso 1: Diagnosticar el Problema

Ejecuta el script de diagnóstico en Supabase SQL Editor:

```sql
-- Ejecutar: scripts/diagnostico_verificacion_telefono.sql
```

Este script verificará:
- ✅ Si existe la tabla `codigos_verificacion`
- ✅ Si existe el campo `telefono_verificado` en `users`
- ✅ Si existen las funciones RPC necesarias
- ✅ El estado de los códigos recientes
- ✅ Si la normalización de teléfono funciona correctamente

### Paso 2: Aplicar el Fix

Ejecuta el script de corrección en Supabase SQL Editor:

```sql
-- Ejecutar: scripts/fix_verificacion_telefono.sql
```

Este script:
- ✅ Asegura que existe el campo `telefono_verificado`
- ✅ Crea/actualiza la tabla `codigos_verificacion` con todos los campos necesarios
- ✅ Actualiza la función `normalizar_telefono` con mejor lógica
- ✅ Actualiza `enviar_codigo_whatsapp` para usar normalización consistente
- ✅ Actualiza `verificar_codigo_whatsapp` para usar normalización consistente
- ✅ Limpia códigos antiguos

### Paso 3: Verificar que Funciona

Después de ejecutar el fix, prueba manualmente:

```sql
-- 1. Generar un código de prueba
SELECT * FROM public.enviar_codigo_whatsapp('+5491112345678');

-- 2. Verificar el código (usa el código que retornó el paso 1)
SELECT * FROM public.verificar_codigo_whatsapp('+5491112345678', '123456');
```

### Paso 4: Probar desde la App

1. Abre la app móvil
2. Ve a "Gestión de Cuenta"
3. Intenta verificar tu teléfono
4. Revisa los logs en la consola para ver si hay errores

## Cambios Realizados

### Función `normalizar_telefono` (Mejorada)
- Maneja mejor los diferentes formatos de teléfono argentino
- Normaliza consistentemente a formato `+54XXXXXXXXXX`
- Maneja casos edge como teléfonos que empiezan con 0, 9, 54, etc.

### Función `enviar_codigo_whatsapp` (Mejorada)
- Normaliza el teléfono antes de guardarlo
- Guarda el teléfono normalizado en la tabla
- Limpia códigos expirados automáticamente
- Invalida códigos anteriores del mismo teléfono

### Función `verificar_codigo_whatsapp` (Mejorada)
- Normaliza el teléfono antes de buscar
- Compara usando teléfonos normalizados
- Incluye información de debug en caso de error
- Actualiza el campo `telefono_verificado` correctamente

## Debugging

Si después del fix sigue sin funcionar:

### 1. Verificar Logs de la App
Revisa la consola de la app para ver:
- El formato del teléfono que se está enviando
- El código que se está verificando
- Los errores de la RPC

### 2. Verificar Códigos en la Base de Datos
```sql
SELECT 
    id,
    telefono,
    codigo,
    usado,
    intentos,
    creado_en,
    expira_en,
    CASE 
        WHEN usado = true THEN 'Usado'
        WHEN expira_en < NOW() THEN 'Expirado'
        ELSE 'Activo'
    END as estado
FROM public.codigos_verificacion
ORDER BY creado_en DESC
LIMIT 10;
```

### 3. Verificar Normalización
```sql
-- Probar con diferentes formatos
SELECT 
    'Original: +5491112345678' as formato,
    public.normalizar_telefono('+5491112345678') as normalizado
UNION ALL
SELECT 
    'Original: 091112345678',
    public.normalizar_telefono('091112345678')
UNION ALL
SELECT 
    'Original: 91112345678',
    public.normalizar_telefono('91112345678');
```

### 4. Verificar Usuario
```sql
SELECT 
    id,
    email,
    telefono,
    telefono_verificado,
    public.normalizar_telefono(telefono) as telefono_normalizado
FROM public.users
WHERE email = 'tu_email@ejemplo.com';
```

## Notas Importantes

1. **Formato de Teléfono**: La app normaliza el teléfono usando `formatArgentinePhone()` que convierte a formato `+54XXXXXXXXXX`. Las funciones RPC también normalizan, así que debe haber consistencia.

2. **Códigos Expirados**: Los códigos expiran después de 15 minutos. Si un código no funciona, solicita uno nuevo.

3. **Límite de Intentos**: Después de 5 intentos fallidos, el código se marca como usado y necesitas solicitar uno nuevo.

4. **Edge Function**: El envío de WhatsApp puede fallar, pero el código se genera igual. En desarrollo, el código se muestra en los logs.

## Contacto

Si el problema persiste después de aplicar estos fixes, revisa:
- Los logs de la Edge Function `send-whatsapp-code` en Supabase
- Los logs de la app móvil
- La configuración de la Edge Function (secrets, variables de entorno)

