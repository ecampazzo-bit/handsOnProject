# Guía: Verificar y Reparar Relaciones Usuario -> Prestador -> Servicios

## El Problema
El servicio "Albañil" existe en la BD, pero no está vinculado correctamente:
- ❌ Usuario prestador existe
- ❌ Registro en `prestadores` existe
- ❌ **Pero la relación en `prestador_servicios` NO existe**

## Las Relaciones Que Deben Existir

```
users (usuario)
  ↓ (usuario_id)
prestadores
  ↓ (prestador_id)
prestador_servicios
  ↓ (servicio_id)
servicios
```

## Cómo Verificar

### Paso 1: Ver todos los prestadores y sus servicios
En el SQL Editor, ejecuta:
```sql
SELECT 
    u.id,
    u.email,
    u.nombre,
    u.tipo_usuario,
    p.id as prestador_id,
    COUNT(ps.id) as cantidad_servicios_vinculados
FROM public.users u
LEFT JOIN public.prestadores p ON u.id = p.usuario_id
LEFT JOIN public.prestador_servicios ps ON p.id = ps.prestador_id
WHERE u.tipo_usuario IN ('prestador', 'ambos')
GROUP BY u.id, p.id
ORDER BY u.created_at DESC;
```

**Busca tu prestador "Albañil" en los resultados:**
- Si `prestador_id` es NULL → El prestador no fue creado
- Si `cantidad_servicios_vinculados` es 0 → El prestador existe pero sin servicios

### Paso 2: Ver específicamente tu prestador
Ejecuta:
```sql
SELECT 
    u.id as usuario_id,
    u.email,
    u.nombre,
    p.id as prestador_id,
    p.usuario_id,
    p.created_at
FROM public.users u
LEFT JOIN public.prestadores p ON u.id = p.usuario_id
WHERE u.email = 'EMAIL_DEL_PRESTADOR';
```

Anota el `prestador_id` si no es NULL.

### Paso 3: Ver los servicios del prestador
Si en el paso 2 obtuviste un `prestador_id`, ejecuta:
```sql
SELECT 
    ps.id,
    ps.prestador_id,
    ps.servicio_id,
    s.nombre as servicio_nombre
FROM public.prestador_servicios ps
LEFT JOIN public.servicios s ON ps.servicio_id = s.id
WHERE ps.prestador_id = PRESTADOR_ID;
```

Reemplaza `PRESTADOR_ID` con el ID del paso anterior.

**Si no devuelve resultados** → Este es el problema: Los servicios no están vinculados.

### Paso 4: Ver el servicio "Albañil"
```sql
SELECT 
    s.id,
    s.nombre,
    COUNT(ps.id) as cantidad_prestadores
FROM public.servicios s
LEFT JOIN public.prestador_servicios ps ON s.id = ps.servicio_id
WHERE s.nombre = 'Albañil'
GROUP BY s.id;
```

Anota el `id` de "Albañil".

## Cómo Reparar

### Si el Prestador No Existe
```sql
-- Crear el prestador
INSERT INTO public.prestadores (usuario_id, descripcion_profesional)
SELECT id, NULL
FROM public.users
WHERE email = 'EMAIL_DEL_PRESTADOR' AND id NOT IN (SELECT usuario_id FROM public.prestadores);
```

### Si el Prestador Existe Pero Sin Servicios
```sql
-- Obtén primero estos IDs:
SELECT id FROM public.prestadores WHERE usuario_id = (
  SELECT id FROM public.users WHERE email = 'EMAIL_DEL_PRESTADOR'
); -- Anota PRESTADOR_ID

SELECT id FROM public.servicios WHERE nombre = 'Albañil'; -- Anota SERVICIO_ID

-- Luego crea la relación:
INSERT INTO public.prestador_servicios (prestador_id, servicio_id)
VALUES (PRESTADOR_ID, SERVICIO_ID)
ON CONFLICT (prestador_id, servicio_id) DO NOTHING;
```

## Script Completo de Reparación Automática

Ejecuta esto si quieres hacer todo de una vez:

```sql
DO $$ 
DECLARE
  v_usuario_id uuid;
  v_prestador_id bigint;
  v_servicio_id bigint;
BEGIN
  -- 1. Obtener el usuario
  SELECT id INTO v_usuario_id FROM public.users 
  WHERE email = 'EMAIL_DEL_PRESTADOR' LIMIT 1;
  
  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  
  -- 2. Crear prestador si no existe
  INSERT INTO public.prestadores (usuario_id, descripcion_profesional)
  VALUES (v_usuario_id, NULL)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_prestador_id;
  
  -- 3. Si no se creó (ya existía), obtenerlo
  IF v_prestador_id IS NULL THEN
    SELECT id INTO v_prestador_id FROM public.prestadores 
    WHERE usuario_id = v_usuario_id LIMIT 1;
  END IF;
  
  -- 4. Obtener servicio Albañil
  SELECT id INTO v_servicio_id FROM public.servicios 
  WHERE nombre = 'Albañil' LIMIT 1;
  
  IF v_servicio_id IS NULL THEN
    RAISE EXCEPTION 'Servicio Albañil no encontrado';
  END IF;
  
  -- 5. Crear la relación
  INSERT INTO public.prestador_servicios (prestador_id, servicio_id)
  VALUES (v_prestador_id, v_servicio_id)
  ON CONFLICT (prestador_id, servicio_id) DO NOTHING;
  
  RAISE NOTICE 'Relación creada: Prestador % - Servicio % (Albañil)', v_prestador_id, v_servicio_id;
END $$;
```

## Verificar que Funciona

Después de ejecutar la reparación, ejecuta:
```sql
SELECT 
    u.email,
    p.id as prestador_id,
    COUNT(ps.id) as servicios
FROM public.users u
JOIN public.prestadores p ON u.id = p.usuario_id
LEFT JOIN public.prestador_servicios ps ON p.id = ps.prestador_id
WHERE u.email = 'EMAIL_DEL_PRESTADOR'
GROUP BY u.id, p.id;
```

Deberías obtener `servicios = 1` (el Albañil).

## En la App

Una vez reparado, cuando otro usuario busque "Albañil", debería verlo en la lista de prestadores.

Si aún no aparece:
1. Limpia el almacenamiento de la app (Clear App Data)
2. Reinicia la app
3. Intenta buscar nuevamente

