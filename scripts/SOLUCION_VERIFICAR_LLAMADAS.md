# 🔧 Solución: Error al Verificar Llamadas HTTP

## 🔴 Problema

Al intentar verificar las llamadas HTTP, obtienes errores porque las columnas no existen:
- `status_code` no existe
- `created` no existe

## ✅ Solución

### Paso 1: Verificar Columnas Disponibles

Ejecuta este query primero:

```sql
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_schema = 'net'
  AND table_name = 'http_request_queue'
ORDER BY ordinal_position;
```

Esto te mostrará qué columnas tiene realmente la tabla.

### Paso 2: Usar Query Genérico

Una vez que veas las columnas, usa este query genérico:

```sql
SELECT *
FROM net.http_request_queue
WHERE url LIKE '%send-whatsapp-code%'
ORDER BY id DESC
LIMIT 10;
```

Esto mostrará todas las columnas disponibles.

### Paso 3: Alternativa - Verificar si pg_net Está Habilitada

Si la tabla no existe o no tiene datos, verifica que `pg_net` esté habilitada:

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

Si no existe:
1. Ve a: Database > Extensions
2. Busca `pg_net`
3. Haz clic en "Enable"

## 🔍 Otra Forma de Verificar

Si no puedes ver las llamadas HTTP directamente, puedes verificar de otras formas:

### 1. Revisar Logs de Edge Function

1. Ve a: Edge Functions → `send-whatsapp-code` → Logs
2. Busca intentos recientes
3. Si hay logs → La edge function se está llamando
4. Si no hay logs → La edge function no se está llamando

### 2. Revisar Logs de Twilio

1. Ve a: https://console.twilio.com/us1/monitor/logs/messaging
2. Busca intentos de envío recientes
3. Si hay registros → Twilio está recibiendo las llamadas
4. Si no hay registros → Twilio no está recibiendo las llamadas

### 3. Probar Edge Function Manualmente

1. Ve a: Edge Functions → `send-whatsapp-code` → "Invoke function"
2. Ingresa:
```json
{
  "telefono": "+5493804663809",
  "codigo": "123456"
}
```
3. Si funciona → La edge function está bien
4. Si no funciona → Revisa las variables de entorno

## 📋 Checklist

- [ ] Ejecutado query para ver columnas
- [ ] pg_net habilitada
- [ ] Revisados logs de edge function
- [ ] Revisados logs de Twilio
- [ ] Probada edge function manualmente

