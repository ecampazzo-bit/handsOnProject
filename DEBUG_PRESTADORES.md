# Guía para Debuggear Prestadores No Encontrados

## Problema
Tienes un prestador de "Albañil" pero cuando otro usuario busca no lo encuentra.

## Posibles Causas

### 1. El servicio "Albañil" no existe en la BD
La función que busca servicios usa el nombre exacto del servicio en la tabla `servicios`.

**Solución:**
1. Ve a SQL Editor en tu dashboard de Supabase
2. Ejecuta las primeras queries de `/scripts/debug_servicios.sql` para verificar
3. Si "Albañil" no aparece, ejecuta la parte que dice "Para crear los servicios que faltan"

### 2. El prestador no existe o no está vinculado correctamente
Aunque pusiste `tipo_usuario = 'prestador'`, el registro en `prestadores` puede no haberse creado.

**Solución:**
1. Ejecuta esta query:
```sql
SELECT u.id, u.email, u.nombre, u.tipo_usuario,
       p.id as prestador_id,
       COUNT(ps.id) as cantidad_servicios
FROM public.users u
LEFT JOIN public.prestadores p ON u.id = p.usuario_id
LEFT JOIN public.prestador_servicios ps ON p.id = ps.prestador_id
WHERE u.email = 'tu_email@example.com'
GROUP BY u.id, p.id;
```

2. Verifica que:
   - `prestador_id` no sea NULL
   - `cantidad_servicios` sea > 0

### 3. Los servicios no se guardaron en `prestador_servicios`
Aunque existe el prestador, los servicios no se guardaron correctamente.

**Debugging:**
1. Mira el log de la app cuando se registre el prestador y seleccione servicios
2. Deberías ver logs como:
   - ✓ Servicio encontrado: "Albañil" -> ID: X
   - Servicios encontrados para guardar: 1 de 1

3. Si ves "Servicio no encontrado", significa que el servicio no existe en la BD

## Paso a Paso para Verificar

### Step 1: Verificar que el servicio existe
```sql
SELECT id, nombre FROM public.servicios WHERE nombre = 'Albañil';
```
Deberías obtener un resultado con el ID del servicio.

### Step 2: Verificar que el prestador existe
```sql
SELECT id, usuario_id FROM public.prestadores WHERE usuario_id = 'UUID_DEL_USUARIO';
```
Reemplaza `UUID_DEL_USUARIO` con el ID del usuario prestador.

### Step 3: Verificar que está vinculado el servicio
```sql
SELECT * FROM public.prestador_servicios 
WHERE prestador_id = PRESTADOR_ID_DEL_PASO_2
AND servicio_id = ID_DEL_PASO_1;
```

### Step 4: Verificar que otro usuario pueda verlo en la búsqueda
La búsqueda consulta así:
```sql
SELECT ps.*, s.nombre, u.nombre as nombre_usuario
FROM prestador_servicios ps
JOIN servicios s ON ps.servicio_id = s.id
JOIN prestadores p ON ps.prestador_id = p.id
JOIN users u ON p.usuario_id = u.id
WHERE s.id = SERVICIO_ID;
```

## Solución Rápida

Si todo está NULL o vacío, ejecuta esto (reemplazando valores):

```sql
-- 1. Asegurar que la categoría existe
INSERT INTO public.categorias (nombre) VALUES ('Construcción y Albañilería')
ON CONFLICT DO NOTHING;

-- 2. Obtener el ID de la categoría
SELECT id INTO categoria_id FROM public.categorias WHERE nombre = 'Construcción y Albañilería' LIMIT 1;

-- 3. Crear el servicio si no existe
INSERT INTO public.servicios (nombre, categoria_id) VALUES ('Albañil', categoria_id)
ON CONFLICT DO NOTHING;

-- 4. Obtener IDs
SELECT id FROM public.servicios WHERE nombre = 'Albañil'; -- Nota este ID
SELECT id FROM public.prestadores WHERE usuario_id = 'UUID_PRESTADOR'; -- Nota este ID

-- 5. Crear la relación
INSERT INTO public.prestador_servicios (prestador_id, servicio_id)
VALUES (PRESTADOR_ID, SERVICIO_ID);
```

## Logs Esperados Cuando Funciona

En la app deberías ver en los logs:
```
=== saveUserServices INICIO ===
userId recibido: xxxxx
servicios recibidos: [{nombre: "Albañil", categoria: "Construcción y Albañilería"}]
Mapa de servicios: {"albañil": 5, "Albañil": 5, ...}
✓ Servicio encontrado: "Albañil" -> ID: 5
Servicios encontrados para guardar: 1 de 1
Servicios para guardar: [{"servicio_id": 5}]
Servicios guardados exitosamente
```

## Si Aún No Funciona

1. Verifica que el usuario prestador esté registrado y verificado
2. Ejecuta `/scripts/debug_servicios.sql` completo y comparte los resultados
3. Revisa el log de la app cuando guarda los servicios
