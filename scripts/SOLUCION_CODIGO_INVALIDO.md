# 🔧 Solución: Código Inválido o Expirado

## 🔍 Diagnóstico

El error "código inválido o expirado" puede ocurrir por varias razones:

1. **Formato de teléfono inconsistente** - El teléfono se guarda con un formato y se verifica con otro
2. **Código expirado** - El código expiró (válido por 15 minutos)
3. **Código ya usado** - El código ya fue utilizado
4. **Espacios en el código** - El código tiene espacios que no se están limpiando
5. **Múltiples códigos** - Hay varios códigos y se está buscando el incorrecto

## ✅ Solución

### Paso 1: Ejecutar el Fix

Ejecuta este script en el SQL Editor de Supabase:

```sql
-- Copia y pega el contenido de: scripts/fix_verificacion_codigo.sql
```

Este script:
- ✅ Normaliza el formato del teléfono antes de guardarlo y compararlo
- ✅ Limpia espacios del código antes de comparar
- ✅ Agrega información de debug en caso de error
- ✅ Usa la misma normalización en ambas funciones

### Paso 2: Verificar Códigos Existentes

Ejecuta este query para ver los códigos recientes:

```sql
SELECT 
    telefono,
    public.normalizar_telefono(telefono) as telefono_normalizado,
    codigo,
    usado,
    creado_en,
    expira_en,
    CASE 
        WHEN usado = true THEN 'Usado'
        WHEN expira_en < NOW() THEN 'Expirado'
        ELSE 'Activo'
    END as estado
FROM public.codigos_verificacion
ORDER BY creado_en DESC
LIMIT 5;
```

### Paso 3: Probar Verificación Directamente

Ejecuta este query reemplazando con tu teléfono y código:

```sql
SELECT * FROM public.verificar_codigo_whatsapp(
    '+5491112345678',  -- Tu teléfono
    '123456'           -- El código que recibiste
);
```

**Si hay información de debug**, verás qué códigos están disponibles y por qué no coincide.

### Paso 4: Limpiar Códigos Antiguos

Si hay muchos códigos expirados, puedes limpiarlos:

```sql
DELETE FROM public.codigos_verificacion
WHERE expira_en < NOW() OR usado = true;
```

## 🐛 Debug desde la App

Ahora el servicio de verificación muestra más información en los logs:

1. Abre la consola de desarrollo
2. Intenta verificar un código
3. Revisa los logs:
   - `🔍 Verificando código para: +5491112345678`
   - `📝 Código ingresado: 123456`
   - `📦 Respuesta de verificación: {...}`
   - Si hay error: `🐛 Debug info: {...}`

## 📋 Checklist

- [ ] Ejecutado `fix_verificacion_codigo.sql`
- [ ] Verificados códigos existentes
- [ ] Probada verificación directamente
- [ ] Revisados logs de la app
- [ ] Limpiados códigos antiguos (opcional)

## 🔄 Si Aún No Funciona

1. **Revisa los logs de la app** - Busca la información de debug
2. **Ejecuta el query de debug** - `scripts/debug_codigo_verificacion.sql`
3. **Verifica el formato del teléfono** - Debe ser consistente
4. **Solicita un nuevo código** - Puede que el anterior haya expirado

## 💡 Mejoras Implementadas

1. **Normalización de teléfono** - Ambos formatos (`+549...` y `0911...`) funcionan
2. **Limpieza de código** - Se eliminan espacios automáticamente
3. **Información de debug** - Muestra qué códigos están disponibles
4. **Mejor logging** - Más información en los logs de la app

