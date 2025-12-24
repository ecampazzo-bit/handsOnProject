-- ============================================================================
-- COMPLETAR TABLAS DE PRESTADORES
-- Script para agregar políticas RLS, índices y funciones RPC necesarias
-- ============================================================================

-- ============================================================================
-- 1. POLÍTICAS RLS PARA CALIFICACIONES
-- ============================================================================
alter table public.calificaciones enable row level security;

drop policy if exists "Users can read calificaciones" on public.calificaciones;
drop policy if exists "Users can insert own calificaciones" on public.calificaciones;
drop policy if exists "Users can update own calificaciones" on public.calificaciones;

-- Cualquiera puede leer calificaciones (para mostrar en perfiles)
create policy "Users can read calificaciones" on public.calificaciones
for select
using (true);

-- Los usuarios autenticados pueden crear calificaciones donde son el calificador
create policy "Users can insert own calificaciones" on public.calificaciones
for insert
with check (
  auth.role() = 'authenticated'
  and auth.uid() = calificador_id
);

-- Los usuarios pueden actualizar sus propias calificaciones (solo antes de cierto tiempo)
create policy "Users can update own calificaciones" on public.calificaciones
for update
using (
  auth.role() = 'authenticated'
  and auth.uid() = calificador_id
  and created_at > now() - interval '24 hours'
)
with check (
  auth.role() = 'authenticated'
  and auth.uid() = calificador_id
);

-- El calificado puede responder a la calificación
create policy "Calificado can respond" on public.calificaciones
for update
using (
  auth.role() = 'authenticated'
  and auth.uid() = calificado_id
)
with check (
  auth.role() = 'authenticated'
  and auth.uid() = calificado_id
);

-- ============================================================================
-- 2. POLÍTICAS RLS PARA PORTFOLIO
-- ============================================================================
alter table public.portfolio enable row level security;

drop policy if exists "Users can read portfolio" on public.portfolio;
drop policy if exists "Prestadores can insert own portfolio" on public.portfolio;
drop policy if exists "Prestadores can update own portfolio" on public.portfolio;
drop policy if exists "Prestadores can delete own portfolio" on public.portfolio;

-- Cualquiera puede leer portfolio (para mostrar en perfiles)
create policy "Users can read portfolio" on public.portfolio
for select
using (true);

-- Los prestadores pueden insertar su propio portfolio
create policy "Prestadores can insert own portfolio" on public.portfolio
for insert
with check (
  auth.role() = 'authenticated'
  and exists (
    select 1 from public.prestadores p
    where p.id = prestador_id
    and p.usuario_id = auth.uid()
  )
);

-- Los prestadores pueden actualizar su propio portfolio
create policy "Prestadores can update own portfolio" on public.portfolio
for update
using (
  auth.role() = 'authenticated'
  and exists (
    select 1 from public.prestadores p
    where p.id = prestador_id
    and p.usuario_id = auth.uid()
  )
)
with check (
  auth.role() = 'authenticated'
  and exists (
    select 1 from public.prestadores p
    where p.id = prestador_id
    and p.usuario_id = auth.uid()
  )
);

-- Los prestadores pueden eliminar su propio portfolio
create policy "Prestadores can delete own portfolio" on public.portfolio
for delete
using (
  auth.role() = 'authenticated'
  and exists (
    select 1 from public.prestadores p
    where p.id = prestador_id
    and p.usuario_id = auth.uid()
  )
);

-- ============================================================================
-- 3. POLÍTICAS RLS PARA CONVERSACIONES
-- ============================================================================
alter table public.conversaciones enable row level security;

drop policy if exists "Users can read own conversations" on public.conversaciones;
drop policy if exists "Users can create conversations" on public.conversaciones;

-- Los usuarios solo pueden leer conversaciones donde participan
create policy "Users can read own conversations" on public.conversaciones
for select
using (
  auth.role() = 'authenticated'
  and (
    participante_1_id = auth.uid()
    or participante_2_id = auth.uid()
  )
);

-- Los usuarios autenticados pueden crear conversaciones donde son participantes
create policy "Users can create conversations" on public.conversaciones
for insert
with check (
  auth.role() = 'authenticated'
  and (
    participante_1_id = auth.uid()
    or participante_2_id = auth.uid()
  )
);

-- Los usuarios pueden actualizar conversaciones donde participan (para actualizar último mensaje)
create policy "Users can update own conversations" on public.conversaciones
for update
using (
  auth.role() = 'authenticated'
  and (
    participante_1_id = auth.uid()
    or participante_2_id = auth.uid()
  )
)
with check (
  auth.role() = 'authenticated'
  and (
    participante_1_id = auth.uid()
    or participante_2_id = auth.uid()
  )
);

-- ============================================================================
-- 4. POLÍTICAS RLS PARA MENSAJES
-- ============================================================================
alter table public.mensajes enable row level security;

drop policy if exists "Users can read messages from own conversations" on public.mensajes;
drop policy if exists "Users can send messages in own conversations" on public.mensajes;
drop policy if exists "Users can update own messages" on public.mensajes;

-- Los usuarios pueden leer mensajes de conversaciones donde participan
create policy "Users can read messages from own conversations" on public.mensajes
for select
using (
  auth.role() = 'authenticated'
  and exists (
    select 1 from public.conversaciones c
    where c.id = conversacion_id
    and (
      c.participante_1_id = auth.uid()
      or c.participante_2_id = auth.uid()
    )
  )
);

-- Los usuarios pueden enviar mensajes en conversaciones donde participan
create policy "Users can send messages in own conversations" on public.mensajes
for insert
with check (
  auth.role() = 'authenticated'
  and remitente_id = auth.uid()
  and exists (
    select 1 from public.conversaciones c
    where c.id = conversacion_id
    and (
      c.participante_1_id = auth.uid()
      or c.participante_2_id = auth.uid()
    )
  )
);

-- Los usuarios pueden actualizar sus propios mensajes (marcar como leído, etc.)
create policy "Users can update own messages" on public.mensajes
for update
using (
  auth.role() = 'authenticated'
  and exists (
    select 1 from public.conversaciones c
    where c.id = conversacion_id
    and (
      c.participante_1_id = auth.uid()
      or c.participante_2_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 5. POLÍTICAS RLS PARA CERTIFICACIONES
-- ============================================================================
alter table public.certificaciones enable row level security;

drop policy if exists "Users can read certificaciones" on public.certificaciones;
drop policy if exists "Prestadores can insert own certificaciones" on public.certificaciones;
drop policy if exists "Prestadores can update own certificaciones" on public.certificaciones;
drop policy if exists "Prestadores can delete own certificaciones" on public.certificaciones;

-- Cualquiera puede leer certificaciones verificadas, solo el prestador las no verificadas
create policy "Users can read certificaciones" on public.certificaciones
for select
using (
  verificado = true
  or exists (
    select 1 from public.prestadores p
    where p.id = prestador_id
    and p.usuario_id = auth.uid()
  )
);

-- Los prestadores pueden insertar sus propias certificaciones
create policy "Prestadores can insert own certificaciones" on public.certificaciones
for insert
with check (
  auth.role() = 'authenticated'
  and exists (
    select 1 from public.prestadores p
    where p.id = prestador_id
    and p.usuario_id = auth.uid()
  )
);

-- Los prestadores pueden actualizar sus propias certificaciones (si no están verificadas)
create policy "Prestadores can update own certificaciones" on public.certificaciones
for update
using (
  auth.role() = 'authenticated'
  and verificado = false
  and exists (
    select 1 from public.prestadores p
    where p.id = prestador_id
    and p.usuario_id = auth.uid()
  )
)
with check (
  auth.role() = 'authenticated'
  and verificado = false
  and exists (
    select 1 from public.prestadores p
    where p.id = prestador_id
    and p.usuario_id = auth.uid()
  )
);

-- Los prestadores pueden eliminar sus propias certificaciones no verificadas
create policy "Prestadores can delete own certificaciones" on public.certificaciones
for delete
using (
  auth.role() = 'authenticated'
  and verificado = false
  and exists (
    select 1 from public.prestadores p
    where p.id = prestador_id
    and p.usuario_id = auth.uid()
  )
);

-- ============================================================================
-- 6. ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índice para calificaciones por trabajo
create index if not exists idx_calificaciones_trabajo on public.calificaciones(trabajo_id);

-- Índice para calificaciones por calificador
create index if not exists idx_calificaciones_calificador on public.calificaciones(calificador_id);

-- Índice para portfolio por prestador y destacado
create index if not exists idx_portfolio_prestador_destacado on public.portfolio(prestador_id, destacado desc, created_at desc);

-- Índice para mensajes por remitente y leído
create index if not exists idx_mensajes_remitente_leido on public.mensajes(remitente_id, leido);

-- Índice para certificaciones por prestador y verificado
create index if not exists idx_certificaciones_prestador_verificado on public.certificaciones(prestador_id, verificado);

-- ============================================================================
-- 7. FUNCIÓN RPC PARA ACTUALIZAR FOTO DE PERFIL
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_user_profile_picture(
  p_user_id uuid,
  p_foto_perfil_url text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Verificar que el usuario existe y está autenticado
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only update own profile picture'
      USING ERRCODE = 'P0001';
  END IF;

  -- Actualizar la foto de perfil
  UPDATE public.users
  SET foto_perfil_url = p_foto_perfil_url,
      updated_at = now()
  WHERE id = p_user_id;

  -- Retornar los datos actualizados
  SELECT jsonb_build_object(
    'id', u.id,
    'foto_perfil_url', u.foto_perfil_url,
    'updated_at', u.updated_at
  ) INTO v_result
  FROM public.users u
  WHERE u.id = p_user_id;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.update_user_profile_picture IS 
'Actualiza la foto de perfil de un usuario. Solo el usuario puede actualizar su propia foto.';

-- ============================================================================
-- 8. FUNCIÓN RPC PARA CREAR/ACTUALIZAR PORTFOLIO
-- ============================================================================
CREATE OR REPLACE FUNCTION public.upsert_portfolio_item(
  p_portfolio_id bigint DEFAULT NULL,
  p_prestador_id bigint,
  p_servicio_id bigint,
  p_titulo varchar(255),
  p_descripcion text DEFAULT NULL,
  p_fotos_urls text[] DEFAULT NULL,
  p_fecha_trabajo date DEFAULT NULL,
  p_destacado boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_portfolio_id bigint;
  v_result jsonb;
BEGIN
  -- Obtener el usuario_id del prestador
  SELECT usuario_id INTO v_user_id
  FROM public.prestadores
  WHERE id = p_prestador_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Prestador no encontrado'
      USING ERRCODE = 'P0002';
  END IF;

  -- Verificar autorización
  IF auth.uid() IS NULL OR auth.uid() != v_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only manage own portfolio'
      USING ERRCODE = 'P0001';
  END IF;

  -- Si se proporciona un ID, actualizar; si no, insertar
  IF p_portfolio_id IS NOT NULL THEN
    UPDATE public.portfolio
    SET servicio_id = p_servicio_id,
        titulo = p_titulo,
        descripcion = p_descripcion,
        fotos_urls = p_fotos_urls,
        fecha_trabajo = p_fecha_trabajo,
        destacado = p_destacado
    WHERE id = p_portfolio_id
      AND prestador_id = p_prestador_id
    RETURNING id INTO v_portfolio_id;

    IF v_portfolio_id IS NULL THEN
      RAISE EXCEPTION 'Portfolio item no encontrado o no autorizado'
        USING ERRCODE = 'P0003';
    END IF;
  ELSE
    INSERT INTO public.portfolio (
      prestador_id,
      servicio_id,
      titulo,
      descripcion,
      fotos_urls,
      fecha_trabajo,
      destacado
    ) VALUES (
      p_prestador_id,
      p_servicio_id,
      p_titulo,
      p_descripcion,
      p_fotos_urls,
      p_fecha_trabajo,
      p_destacado
    )
    RETURNING id INTO v_portfolio_id;
  END IF;

  -- Retornar los datos del item creado/actualizado
  SELECT jsonb_build_object(
    'id', p.id,
    'prestador_id', p.prestador_id,
    'servicio_id', p.servicio_id,
    'titulo', p.titulo,
    'descripcion', p.descripcion,
    'fotos_urls', p.fotos_urls,
    'fecha_trabajo', p.fecha_trabajo,
    'destacado', p.destacado,
    'created_at', p.created_at
  ) INTO v_result
  FROM public.portfolio p
  WHERE p.id = v_portfolio_id;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.upsert_portfolio_item IS 
'Crea o actualiza un item del portfolio. Solo el prestador puede gestionar su propio portfolio.';

-- ============================================================================
-- 9. FUNCIÓN RPC PARA CREAR CALIFICACIÓN
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_calificacion(
  p_trabajo_id bigint,
  p_calificador_id uuid,
  p_calificado_id uuid,
  p_tipo_calificacion public.tipo_calificacion,
  p_puntuacion integer,
  p_puntualidad integer DEFAULT NULL,
  p_calidad_trabajo integer DEFAULT NULL,
  p_limpieza integer DEFAULT NULL,
  p_comunicacion integer DEFAULT NULL,
  p_relacion_precio_calidad integer DEFAULT NULL,
  p_comentario text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_calificacion_id bigint;
  v_result jsonb;
BEGIN
  -- Verificar autorización
  IF auth.uid() IS NULL OR auth.uid() != p_calificador_id THEN
    RAISE EXCEPTION 'Unauthorized: can only create own calificaciones'
      USING ERRCODE = 'P0001';
  END IF;

  -- Verificar que el trabajo existe y está completado
  IF NOT EXISTS (
    SELECT 1 FROM public.trabajos
    WHERE id = p_trabajo_id
    AND estado = 'completado'
    AND (
      cliente_id = p_calificador_id
      OR prestador_id IN (
        SELECT id FROM public.prestadores WHERE usuario_id = p_calificador_id
      )
    )
  ) THEN
    RAISE EXCEPTION 'Trabajo no encontrado, no completado o no autorizado'
      USING ERRCODE = 'P0002';
  END IF;

  -- Verificar que no existe ya una calificación del mismo tipo para este trabajo
  IF EXISTS (
    SELECT 1 FROM public.calificaciones
    WHERE trabajo_id = p_trabajo_id
    AND calificador_id = p_calificador_id
    AND tipo_calificacion = p_tipo_calificacion
  ) THEN
    RAISE EXCEPTION 'Ya existe una calificación de este tipo para este trabajo'
      USING ERRCODE = 'P0003';
  END IF;

  -- Insertar la calificación
  INSERT INTO public.calificaciones (
    trabajo_id,
    calificador_id,
    calificado_id,
    tipo_calificacion,
    puntuacion,
    puntualidad,
    calidad_trabajo,
    limpieza,
    comunicacion,
    relacion_precio_calidad,
    comentario
  ) VALUES (
    p_trabajo_id,
    p_calificador_id,
    p_calificado_id,
    p_tipo_calificacion,
    p_puntuacion,
    p_puntualidad,
    p_calidad_trabajo,
    p_limpieza,
    p_comunicacion,
    p_relacion_precio_calidad,
    p_comentario
  )
  RETURNING id INTO v_calificacion_id;

  -- Actualizar calificación promedio del usuario calificado
  -- (esto se puede hacer con un trigger, pero lo hacemos aquí para simplificar)
  PERFORM update_user_rating(p_calificado_id);

  -- Retornar los datos de la calificación creada
  SELECT jsonb_build_object(
    'id', c.id,
    'trabajo_id', c.trabajo_id,
    'calificador_id', c.calificador_id,
    'calificado_id', c.calificado_id,
    'tipo_calificacion', c.tipo_calificacion,
    'puntuacion', c.puntuacion,
    'comentario', c.comentario,
    'created_at', c.fecha_calificacion
  ) INTO v_result
  FROM public.calificaciones c
  WHERE c.id = v_calificacion_id;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.create_calificacion IS 
'Crea una nueva calificación. Solo se puede calificar trabajos completados.';

-- ============================================================================
-- 10. FUNCIÓN PARA ACTUALIZAR CALIFICACIÓN PROMEDIO DEL USUARIO
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_user_rating(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promedio numeric;
  v_cantidad integer;
BEGIN
  -- Calcular promedio y cantidad de calificaciones
  SELECT 
    COALESCE(AVG(puntuacion), 0),
    COUNT(*)
  INTO v_promedio, v_cantidad
  FROM public.calificaciones
  WHERE calificado_id = p_user_id;

  -- Actualizar en la tabla users
  UPDATE public.users
  SET calificacion_promedio = v_promedio,
      cantidad_calificaciones = v_cantidad,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.update_user_rating IS 
'Actualiza la calificación promedio y cantidad de calificaciones de un usuario.';

-- ============================================================================
-- 11. FUNCIÓN RPC PARA CREAR O OBTENER CONVERSACIÓN
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_or_create_conversacion(
  p_participante_1_id uuid,
  p_participante_2_id uuid,
  p_solicitud_id bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversacion_id bigint;
  v_result jsonb;
BEGIN
  -- Verificar autorización
  IF auth.uid() IS NULL OR (auth.uid() != p_participante_1_id AND auth.uid() != p_participante_2_id) THEN
    RAISE EXCEPTION 'Unauthorized: can only create conversations where you participate'
      USING ERRCODE = 'P0001';
  END IF;

  -- Buscar conversación existente
  SELECT id INTO v_conversacion_id
  FROM public.conversaciones
  WHERE (
    (participante_1_id = p_participante_1_id AND participante_2_id = p_participante_2_id)
    OR (participante_1_id = p_participante_2_id AND participante_2_id = p_participante_1_id)
  )
  LIMIT 1;

  -- Si no existe, crearla
  IF v_conversacion_id IS NULL THEN
    INSERT INTO public.conversaciones (
      participante_1_id,
      participante_2_id,
      solicitud_id
    ) VALUES (
      p_participante_1_id,
      p_participante_2_id,
      p_solicitud_id
    )
    RETURNING id INTO v_conversacion_id;
  END IF;

  -- Retornar los datos de la conversación
  SELECT jsonb_build_object(
    'id', c.id,
    'participante_1_id', c.participante_1_id,
    'participante_2_id', c.participante_2_id,
    'solicitud_id', c.solicitud_id,
    'created_at', c.created_at
  ) INTO v_result
  FROM public.conversaciones c
  WHERE c.id = v_conversacion_id;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_or_create_conversacion IS 
'Obtiene una conversación existente o crea una nueva entre dos participantes.';

-- ============================================================================
-- 12. FUNCIÓN RPC PARA ENVIAR MENSAJE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.send_message(
  p_conversacion_id bigint,
  p_remitente_id uuid,
  p_contenido text,
  p_tipo public.tipo_mensaje DEFAULT 'texto'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mensaje_id bigint;
  v_result jsonb;
BEGIN
  -- Verificar autorización
  IF auth.uid() IS NULL OR auth.uid() != p_remitente_id THEN
    RAISE EXCEPTION 'Unauthorized: can only send messages as yourself'
      USING ERRCODE = 'P0001';
  END IF;

  -- Verificar que la conversación existe y el remitente participa
  IF NOT EXISTS (
    SELECT 1 FROM public.conversaciones
    WHERE id = p_conversacion_id
    AND (
      participante_1_id = p_remitente_id
      OR participante_2_id = p_remitente_id
    )
  ) THEN
    RAISE EXCEPTION 'Conversación no encontrada o no autorizado'
      USING ERRCODE = 'P0002';
  END IF;

  -- Insertar el mensaje
  INSERT INTO public.mensajes (
    conversacion_id,
    remitente_id,
    contenido,
    tipo
  ) VALUES (
    p_conversacion_id,
    p_remitente_id,
    p_contenido,
    p_tipo
  )
  RETURNING id INTO v_mensaje_id;

  -- Actualizar último mensaje en la conversación
  UPDATE public.conversaciones
  SET ultimo_mensaje_id = v_mensaje_id,
      ultimo_mensaje_fecha = now()
  WHERE id = p_conversacion_id;

  -- Retornar los datos del mensaje creado
  SELECT jsonb_build_object(
    'id', m.id,
    'conversacion_id', m.conversacion_id,
    'remitente_id', m.remitente_id,
    'contenido', m.contenido,
    'tipo', m.tipo,
    'leido', m.leido,
    'created_at', m.created_at
  ) INTO v_result
  FROM public.mensajes m
  WHERE m.id = v_mensaje_id;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.send_message IS 
'Envía un mensaje en una conversación. Actualiza automáticamente el último mensaje de la conversación.';

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

