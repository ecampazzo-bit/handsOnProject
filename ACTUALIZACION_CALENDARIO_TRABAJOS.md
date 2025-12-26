# Actualización del Calendario de Trabajos

## Cambios Realizados

### 1. Corrección en `aceptarCotizacion`

**Archivo modificado:** `mobile/src/services/solicitudService.ts`

**Problema detectado:** Cuando se aceptaba una cotización, se creaba el trabajo pero NO se establecía la `fecha_programada`, incluso si la cotización tenía una `fecha_disponible`.

**Solución implementada:**
- Ahora cuando se crea el trabajo, se verifica si la cotización tiene `fecha_disponible`
- Si existe, se transfiere automáticamente como `fecha_programada` del trabajo
- Esto asegura que los trabajos aparezcan en el calendario desde el momento que se aceptan

**Código agregado:**
```typescript
// Si la cotización tiene fecha_disponible, usarla como fecha_programada
const trabajoData: any = {
  solicitud_id: solicitudId,
  cotizacion_id: cotizacionId,
  prestador_id: cotiz.prestador_id,
  cliente_id: solicitud.cliente_id,
  estado: "programado",
  monto_final: cotiz.precio_ofrecido,
};

// Transferir fecha_disponible de la cotización a fecha_programada del trabajo
if (cotiz.fecha_disponible) {
  trabajoData.fecha_programada = cotiz.fecha_disponible;
  console.log(`Estableciendo fecha_programada del trabajo: ${cotiz.fecha_disponible}`);
}
```

### 2. Script SQL para Pruebas del Calendario

**Archivo creado:** `scripts/agregar_fechas_prueba_trabajos.sql`

Este script permite agregar fechas de prueba a los trabajos existentes para visualizar y probar el calendario.

**Características:**
- Agrega fechas aleatorias de **Diciembre 2025** a la mitad de los trabajos
- Agrega fechas aleatorias de **Enero 2026** a la otra mitad
- Solo afecta trabajos en estados: `aceptado`, `programado`, `en_curso`
- Incluye consultas de verificación para ver los resultados

**Distribución de fechas:**
- Diciembre 2025: 5, 8, 10, 15, 18, 20, 23, 25, 28, 30
- Enero 2026: 5, 8, 12, 15, 18, 20, 22, 25, 28, 30

## Cómo Usar el Script SQL

### Opción 1: Desde Supabase Dashboard
1. Ir a Supabase Dashboard
2. Seleccionar tu proyecto
3. Ir a "SQL Editor"
4. Copiar y pegar el contenido de `scripts/agregar_fechas_prueba_trabajos.sql`
5. Ejecutar el script
6. Ver los resultados en las consultas de verificación al final

### Opción 2: Desde la línea de comandos
```bash
# Si tienes acceso directo a la base de datos
psql -h [HOST] -U [USER] -d [DATABASE] -f scripts/agregar_fechas_prueba_trabajos.sql
```

## Verificación

Después de ejecutar el script, verifica que:

1. Los trabajos tengan fechas asignadas:
```sql
SELECT id, cliente_id, prestador_id, estado, fecha_programada
FROM trabajos
WHERE fecha_programada IS NOT NULL
ORDER BY fecha_programada;
```

2. Ver el conteo por mes:
```sql
SELECT 
  TO_CHAR(fecha_programada, 'YYYY-MM') as mes,
  COUNT(*) as cantidad_trabajos
FROM trabajos
WHERE fecha_programada IS NOT NULL
GROUP BY TO_CHAR(fecha_programada, 'YYYY-MM')
ORDER BY mes;
```

## Prueba en la App

1. Inicia la app móvil
2. Ve a "Gestión de Cuenta"
3. Observa el calendario:
   - Deberías ver **puntos azules** en los días donde tienes trabajos solicitados
   - Deberías ver **puntos verdes** en los días donde tienes trabajos a realizar
4. Toca cualquier día marcado para ver los detalles de los trabajos

## Flujo Completo de Trabajo con Fecha

### Como Prestador:
1. Recibes una solicitud de servicio
2. Creas una cotización y **seleccionas una fecha disponible**
3. El cliente acepta tu cotización
4. ✅ Se crea automáticamente un trabajo con `fecha_programada = fecha_disponible`
5. El trabajo aparece en el calendario en la fecha seleccionada

### Como Cliente:
1. Solicitas un servicio
2. Recibes cotizaciones de prestadores
3. Aceptas una cotización (que puede tener fecha disponible)
4. ✅ Se crea un trabajo y si la cotización tenía fecha, aparece en tu calendario
5. Puedes ver todos tus trabajos programados en el calendario

## Notas Importantes

- La `fecha_disponible` de la cotización es opcional
- Si no se especifica fecha al crear la cotización, el trabajo se crea sin `fecha_programada`
- Los trabajos sin `fecha_programada` no aparecen en el calendario
- Se puede actualizar la `fecha_programada` de un trabajo posteriormente desde la pantalla de detalles del trabajo
