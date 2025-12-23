-- ============================================================================
-- HANDSON PROJECT - Database Schema
-- Script completo para crear la base de datos desde cero
-- Versión: 1.0.0
-- Última actualización: Diciembre 2025
-- ============================================================================
-- ============================================================================
-- 1. EXTENSIONES Y FUNCIONES BASE
-- ============================================================================
-- Habilitar extensión para UUIDs y password hashing
create extension if not exists "pgcrypto";
-- Función para actualizar updated_at automáticamente
create or replace function public.set_current_timestamp_updated_at() returns trigger as $$ begin new.updated_at = now();
return new;
end;
$$ language plpgsql;
-- Función para hashear passwords automáticamente
create or replace function public.hash_user_password() returns trigger as $$ begin if tg_op = 'INSERT'
    or (
        tg_op = 'UPDATE'
        and new.password is distinct
        from old.password
    ) then new.password := crypt(new.password, gen_salt('bf'));
end if;
return new;
end;
$$ language plpgsql security definer;
-- ============================================================================
-- 2. CREAR TODOS LOS ENUMS
-- ============================================================================
-- tipo_usuario
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'tipo_usuario'
) then create type public.tipo_usuario as enum ('cliente', 'prestador', 'ambos');
end if;
end $$;
-- urgencia
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'urgencia'
) then create type public.urgencia as enum ('baja', 'media', 'alta', 'emergencia');
end if;
end $$;
-- estado_solicitud
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'estado_solicitud'
) then create type public.estado_solicitud as enum (
    'pendiente',
    'cotizando',
    'aceptada',
    'en_progreso',
    'completada',
    'cancelada'
);
end if;
end $$;
-- estado_cotizacion
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'estado_cotizacion'
) then create type public.estado_cotizacion as enum (
    'enviada',
    'vista',
    'aceptada',
    'rechazada',
    'expirada'
);
end if;
end $$;
-- estado_trabajo
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'estado_trabajo'
) then create type public.estado_trabajo as enum (
    'programado',
    'en_camino',
    'en_progreso',
    'pausado',
    'completado',
    'cancelado'
);
end if;
end $$;
-- tipo_calificacion
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'tipo_calificacion'
) then create type public.tipo_calificacion as enum ('cliente_a_prestador', 'prestador_a_cliente');
end if;
end $$;
-- tipo_mensaje
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'tipo_mensaje'
) then create type public.tipo_mensaje as enum (
    'texto',
    'imagen',
    'archivo',
    'cotizacion',
    'sistema'
);
end if;
end $$;
-- metodo_pago
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'metodo_pago'
) then create type public.metodo_pago as enum (
    'efectivo',
    'transferencia',
    'tarjeta_debito',
    'tarjeta_credito',
    'mercadopago',
    'otro'
);
end if;
end $$;
-- estado_pago
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'estado_pago'
) then create type public.estado_pago as enum (
    'pendiente',
    'procesando',
    'completado',
    'fallido',
    'reembolsado'
);
end if;
end $$;
-- tipo_zona
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'tipo_zona'
) then create type public.tipo_zona as enum ('barrio', 'localidad', 'zona', 'radio_km');
end if;
end $$;
-- tipo_reporte
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'tipo_reporte'
) then create type public.tipo_reporte as enum (
    'fraude',
    'mala_conducta',
    'trabajo_incompleto',
    'no_presentacion',
    'acoso',
    'otro'
);
end if;
end $$;
-- estado_reporte
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'estado_reporte'
) then create type public.estado_reporte as enum (
    'pendiente',
    'en_revision',
    'resuelto',
    'desestimado'
);
end if;
end $$;
-- tipo_notificacion
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'tipo_notificacion'
) then create type public.tipo_notificacion as enum (
    'nueva_solicitud',
    'nueva_cotizacion',
    'trabajo_aceptado',
    'mensaje',
    'calificacion',
    'pago',
    'sistema'
);
end if;
end $$;
-- tipo_cupon
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'tipo_cupon'
) then create type public.tipo_cupon as enum ('porcentaje', 'monto_fijo');
end if;
end $$;
-- estado_referido
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'estado_referido'
) then create type public.estado_referido as enum (
    'pendiente',
    'registrado',
    'primer_trabajo',
    'completado'
);
end if;
end $$;
-- tipo_dato_config
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'tipo_dato_config'
) then create type public.tipo_dato_config as enum ('string', 'integer', 'boolean', 'json');
end if;
end $$;
-- ============================================================================
-- 3. CREAR TABLA USERS
-- ============================================================================
create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    password text not null,
    nombre text not null,
    apellido text not null,
    telefono text not null,
    direccion text,
    latitud numeric(10, 7),
    longitud numeric(10, 7),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    foto_perfil_url text,
    tipo_usuario public.tipo_usuario not null default 'cliente',
    verificado boolean not null default false,
    calificacion_promedio numeric,
    cantidad_calificaciones integer not null default 0,
    fecha_registro timestamptz not null default now(),
    ultimo_acceso timestamptz,
    activo boolean not null default true
);
comment on column public.users.password is 'Contraseña almacenada siempre hasheada. Nunca guardar en texto plano.';
-- Trigger para hashear password
create trigger hash_password_before_write before
insert
    or
update of password on public.users for each row execute function public.hash_user_password();
-- Trigger para updated_at
create trigger set_timestamp_users before
update on public.users for each row execute function public.set_current_timestamp_updated_at();
-- Habilitar RLS
alter table public.users enable row level security;
-- Políticas RLS
drop policy if exists "Users can read own data" on public.users;
drop policy if exists "Users can update own data" on public.users;
drop policy if exists "Only authenticated users can insert" on public.users;
create policy "Users can read own data" on public.users for
select using (
        auth.role() = 'authenticated'
        and auth.uid() = id
    );
create policy "Users can update own data" on public.users for
update using (
        auth.role() = 'authenticated'
        and auth.uid() = id
    ) with check (
        auth.role() = 'authenticated'
        and auth.uid() = id
    );
create policy "Only authenticated users can insert" on public.users for
insert with check (auth.role() = 'authenticated');
-- Política para permitir a usuarios autenticados leer datos públicos de otros usuarios
create policy "Authenticated users can read public user data" on public.users for
select using (
        auth.role() = 'authenticated'
    );
-- Crear view pública (sin password)
drop view if exists public.users_public;
create view public.users_public as
select id,
    email,
    nombre,
    apellido,
    telefono,
    foto_perfil_url,
    direccion,
    latitud,
    longitud,
    created_at,
    updated_at,
    tipo_usuario,
    verificado,
    calificacion_promedio,
    cantidad_calificaciones,
    fecha_registro,
    ultimo_acceso,
    activo
from public.users;
-- ============================================================================
-- 4. CREAR TABLAS DE CATÁLOGO
-- ============================================================================
-- Tabla categorias
create table if not exists public.categorias (
    id bigint generated by default as identity primary key,
    nombre text not null,
    url text,
    created_at timestamptz not null default now()
);
-- Tabla servicios
create table if not exists public.servicios (
    id bigint generated by default as identity primary key,
    nombre text not null,
    categoria_id bigint references public.categorias(id) on delete restrict,
    created_at timestamptz not null default now()
);
-- ============================================================================
-- 5. CREAR TABLA PRESTADORES
-- ============================================================================
create table if not exists public.prestadores (
    id bigint generated by default as identity primary key,
    usuario_id uuid not null references public.users(id) on delete cascade,
    descripcion_profesional text,
    años_experiencia integer,
    tiene_matricula boolean not null default false,
    numero_matricula text,
    documentos_verificados boolean not null default false,
    radio_cobertura_km integer,
    disponibilidad_inmediata boolean not null default false,
    precio_minimo numeric,
    acepta_efectivo boolean not null default true,
    acepta_transferencia boolean not null default false,
    acepta_tarjeta boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(usuario_id)
);
-- Trigger para updated_at
create trigger set_timestamp_prestadores before
update on public.prestadores for each row execute function public.set_current_timestamp_updated_at();
-- Habilitar RLS en prestadores
alter table public.prestadores enable row level security;
-- Políticas RLS para prestadores
drop policy if exists "Users can read own prestador" on public.prestadores;
drop policy if exists "Users can insert own prestador" on public.prestadores;
drop policy if exists "Users can update own prestador" on public.prestadores;
drop policy if exists "Authenticated users can read all prestadores" on public.prestadores;
create policy "Users can read own prestador" on public.prestadores for
select using (auth.uid() = usuario_id);
create policy "Users can insert own prestador" on public.prestadores for
insert with check (auth.uid() = usuario_id);
create policy "Users can update own prestador" on public.prestadores for
update using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);
-- Permitir a usuarios autenticados leer todos los prestadores (para búsqueda)
create policy "Authenticated users can read all prestadores" on public.prestadores for
select using (auth.role() = 'authenticated');
-- ============================================================================
-- 6. CREAR TABLA PRESTADOR_SERVICIOS
-- ============================================================================
create table if not exists public.prestador_servicios (
    id bigint generated by default as identity primary key,
    prestador_id bigint not null references public.prestadores(id) on delete cascade,
    servicio_id bigint not null references public.servicios(id) on delete restrict,
    precio_base numeric,
    precio_desde numeric,
    experiencia_años integer,
    destacado boolean not null default false,
    fecha_agregado timestamptz not null default now(),
    unique(prestador_id, servicio_id)
);
-- ============================================================================
-- 7. CREAR TABLA SOLICITUDES_SERVICIO
-- ============================================================================
create table if not exists public.solicitudes_servicio (
    id bigint generated by default as identity primary key,
    cliente_id uuid not null references public.users(id) on delete restrict,
    servicio_id bigint not null references public.servicios(id) on delete restrict,
    descripcion_problema text,
    direccion text,
    latitud numeric(10, 7),
    longitud numeric(10, 7),
    fecha_preferida date,
    horario_preferido text,
    presupuesto_estimado numeric,
    urgencia public.urgencia not null default 'media',
    estado public.estado_solicitud not null default 'pendiente',
    fotos_urls text [],
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
-- Trigger para updated_at
create trigger set_timestamp_solicitudes before
update on public.solicitudes_servicio for each row execute function public.set_current_timestamp_updated_at();
-- ============================================================================
-- 8. CREAR TABLA COTIZACIONES
-- ============================================================================
create table if not exists public.cotizaciones (
    id bigint generated by default as identity primary key,
    solicitud_id bigint not null references public.solicitudes_servicio(id) on delete cascade,
    prestador_id bigint not null references public.prestadores(id) on delete restrict,
    precio_ofrecido numeric not null,
    descripcion_trabajo text,
    tiempo_estimado integer,
    materiales_incluidos boolean not null default false,
    garantia_dias integer,
    fecha_disponible date,
    estado public.estado_cotizacion not null default 'enviada',
    vigencia_hasta timestamptz,
    created_at timestamptz not null default now()
);
-- ============================================================================
-- 9. CREAR TABLA TRABAJOS
-- ============================================================================
create table if not exists public.trabajos (
    id bigint generated by default as identity primary key,
    solicitud_id bigint not null references public.solicitudes_servicio(id) on delete restrict,
    cotizacion_id bigint references public.cotizaciones(id) on delete
    set null,
        prestador_id bigint not null references public.prestadores(id) on delete restrict,
        cliente_id uuid not null references public.users(id) on delete restrict,
        fecha_inicio timestamptz,
        fecha_fin timestamptz,
        fecha_programada timestamptz,
        estado public.estado_trabajo not null default 'programado',
        monto_final numeric,
        notas_prestador text,
        notas_cliente text,
        fotos_antes text [],
        fotos_durante text [],
        fotos_despues text [],
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
);
-- Trigger para updated_at
create trigger set_timestamp_trabajos before
update on public.trabajos for each row execute function public.set_current_timestamp_updated_at();
-- ============================================================================
-- 10. CREAR TABLA CALIFICACIONES
-- ============================================================================
create table if not exists public.calificaciones (
    id bigint generated by default as identity primary key,
    trabajo_id bigint not null references public.trabajos(id) on delete restrict,
    calificador_id uuid not null references public.users(id) on delete restrict,
    calificado_id uuid not null references public.users(id) on delete restrict,
    tipo_calificacion public.tipo_calificacion not null,
    puntuacion integer not null check (
        puntuacion >= 1
        and puntuacion <= 5
    ),
    puntualidad integer check (
        puntualidad >= 1
        and puntualidad <= 5
    ),
    calidad_trabajo integer check (
        calidad_trabajo >= 1
        and calidad_trabajo <= 5
    ),
    limpieza integer check (
        limpieza >= 1
        and limpieza <= 5
    ),
    comunicacion integer check (
        comunicacion >= 1
        and comunicacion <= 5
    ),
    relacion_precio_calidad integer check (
        relacion_precio_calidad >= 1
        and relacion_precio_calidad <= 5
    ),
    comentario text,
    respuesta text,
    fecha_calificacion timestamptz not null default now(),
    verificado boolean not null default false
);
-- ============================================================================
-- 11. CREAR TABLAS DE MENSAJERÍA
-- ============================================================================
-- Tabla conversaciones
create table if not exists public.conversaciones (
    id bigint generated by default as identity primary key,
    solicitud_id bigint references public.solicitudes_servicio(id) on delete
    set null,
        participante_1_id uuid not null references public.users(id) on delete restrict,
        participante_2_id uuid not null references public.users(id) on delete restrict,
        ultimo_mensaje_id bigint,
        ultimo_mensaje_fecha timestamptz,
        created_at timestamptz not null default now(),
        check (participante_1_id != participante_2_id)
);
-- Tabla mensajes
create table if not exists public.mensajes (
    id bigint generated by default as identity primary key,
    conversacion_id bigint not null references public.conversaciones(id) on delete cascade,
    remitente_id uuid not null references public.users(id) on delete restrict,
    contenido text not null,
    tipo public.tipo_mensaje not null default 'texto',
    leido boolean not null default false,
    fecha_lectura timestamptz,
    created_at timestamptz not null default now()
);
-- Agregar FK para ultimo_mensaje_id después de crear mensajes
alter table public.conversaciones drop constraint if exists fk_ultimo_mensaje;
alter table public.conversaciones
add constraint fk_ultimo_mensaje foreign key (ultimo_mensaje_id) references public.mensajes(id) on delete
set null;
-- ============================================================================
-- 12. CREAR TABLA PAGOS
-- ============================================================================
create table if not exists public.pagos (
    id bigint generated by default as identity primary key,
    trabajo_id bigint not null references public.trabajos(id) on delete restrict,
    cliente_id uuid not null references public.users(id) on delete restrict,
    prestador_id bigint not null references public.prestadores(id) on delete restrict,
    monto numeric not null,
    metodo_pago public.metodo_pago not null,
    estado public.estado_pago not null default 'pendiente',
    transaccion_id varchar(255),
    comision_plataforma numeric,
    neto_prestador numeric,
    fecha_pago timestamptz,
    fecha_liberacion timestamptz,
    comprobante_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
-- Trigger para updated_at
create trigger set_timestamp_pagos before
update on public.pagos for each row execute function public.set_current_timestamp_updated_at();
-- ============================================================================
-- 13. CREAR TABLAS DE DISPONIBILIDAD Y COBERTURA
-- ============================================================================
-- Tabla disponibilidad_prestadores
create table if not exists public.disponibilidad_prestadores (
    id bigint generated by default as identity primary key,
    prestador_id bigint not null references public.prestadores(id) on delete cascade,
    dia_semana integer not null check (
        dia_semana >= 0
        and dia_semana <= 6
    ),
    hora_inicio time not null,
    hora_fin time not null,
    activo boolean not null default true,
    check (hora_fin > hora_inicio)
);
-- Tabla zonas_cobertura
create table if not exists public.zonas_cobertura (
    id bigint generated by default as identity primary key,
    prestador_id bigint not null references public.prestadores(id) on delete cascade,
    nombre_zona varchar(255) not null,
    tipo public.tipo_zona not null,
    radio_km integer,
    centro_latitud numeric(10, 7),
    centro_longitud numeric(10, 7),
    recargo_porcentaje numeric default 0
);
-- ============================================================================
-- 14. CREAR TABLAS DE REPORTES Y NOTIFICACIONES
-- ============================================================================
-- Tabla reportes
create table if not exists public.reportes (
    id bigint generated by default as identity primary key,
    reportante_id uuid not null references public.users(id) on delete restrict,
    reportado_id uuid not null references public.users(id) on delete restrict,
    trabajo_id bigint references public.trabajos(id) on delete
    set null,
        tipo public.tipo_reporte not null,
        descripcion text not null,
        evidencias_urls text [],
        estado public.estado_reporte not null default 'pendiente',
        resolucion text,
        fecha_resolucion timestamptz,
        created_at timestamptz not null default now()
);
-- Tabla notificaciones
create table if not exists public.notificaciones (
    id bigint generated by default as identity primary key,
    usuario_id uuid not null references public.users(id) on delete cascade,
    tipo public.tipo_notificacion not null,
    titulo varchar(255) not null,
    contenido text,
    referencia_id integer,
    referencia_tipo varchar(100),
    leida boolean not null default false,
    enviada_push boolean not null default false,
    enviada_email boolean not null default false,
    created_at timestamptz not null default now()
);
-- ============================================================================
-- 15. CREAR TABLAS DE PERFIL
-- ============================================================================
-- Tabla favoritos
create table if not exists public.favoritos (
    id bigint generated by default as identity primary key,
    usuario_id uuid not null references public.users(id) on delete cascade,
    prestador_id bigint not null references public.prestadores(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique(usuario_id, prestador_id)
);
-- Tabla certificaciones
create table if not exists public.certificaciones (
    id bigint generated by default as identity primary key,
    prestador_id bigint not null references public.prestadores(id) on delete cascade,
    nombre_certificacion varchar(255) not null,
    institucion varchar(255),
    numero_certificado varchar(255),
    fecha_obtencion date,
    fecha_vencimiento date,
    documento_url text,
    verificado boolean not null default false,
    created_at timestamptz not null default now()
);
-- Tabla portfolio
create table if not exists public.portfolio (
    id bigint generated by default as identity primary key,
    prestador_id bigint not null references public.prestadores(id) on delete cascade,
    servicio_id bigint not null references public.servicios(id) on delete restrict,
    titulo varchar(255) not null,
    descripcion text,
    fotos_urls text [],
    fecha_trabajo date,
    destacado boolean not null default false,
    created_at timestamptz not null default now()
);
-- ============================================================================
-- 16. CREAR TABLAS DE MARKETING
-- ============================================================================
-- Tabla cupones_descuento
create table if not exists public.cupones_descuento (
    id bigint generated by default as identity primary key,
    codigo varchar(100) not null unique,
    tipo public.tipo_cupon not null,
    valor numeric not null,
    minimo_compra numeric,
    maximo_descuento numeric,
    usos_maximos integer,
    usos_actuales integer not null default 0,
    usuario_especifico_id uuid references public.users(id) on delete
    set null,
        valido_desde timestamptz not null,
        valido_hasta timestamptz not null,
        activo boolean not null default true,
        servicios_aplicables bigint [],
        created_at timestamptz not null default now()
);
-- Tabla referidos
create table if not exists public.referidos (
    id bigint generated by default as identity primary key,
    referidor_id uuid not null references public.users(id) on delete restrict,
    referido_id uuid not null references public.users(id) on delete restrict,
    estado public.estado_referido not null default 'pendiente',
    bono_referidor numeric default 0,
    bono_referido numeric default 0,
    pagado boolean not null default false,
    created_at timestamptz not null default now(),
    check (referidor_id != referido_id)
);
-- Tabla configuracion_sistema
create table if not exists public.configuracion_sistema (
    id bigint generated by default as identity primary key,
    clave varchar(255) not null unique,
    valor text not null,
    tipo_dato public.tipo_dato_config not null,
    descripcion text,
    editable boolean not null default true,
    updated_at timestamptz not null default now()
);
-- Trigger para updated_at
create trigger set_timestamp_config before
update on public.configuracion_sistema for each row execute function public.set_current_timestamp_updated_at();
-- ============================================================================
-- 17. CREAR TODOS LOS ÍNDICES
-- ============================================================================
-- Índices para usuarios
create index if not exists idx_usuarios_email on public.users(email);
-- Índices para solicitudes
create index if not exists idx_solicitudes_cliente_estado_created on public.solicitudes_servicio(cliente_id, estado, created_at desc);
create index if not exists idx_solicitudes_ubicacion on public.solicitudes_servicio(latitud, longitud);
-- Índices para trabajos
create index if not exists idx_trabajos_prestador_estado on public.trabajos(prestador_id, estado);
create index if not exists idx_trabajos_cliente_estado on public.trabajos(cliente_id, estado);
-- Índices para calificaciones
create index if not exists idx_calificaciones_calificado on public.calificaciones(calificado_id);
-- Índices para mensajes
create index if not exists idx_mensajes_conversacion_created on public.mensajes(conversacion_id, created_at desc);
-- Índices para cotizaciones
create index if not exists idx_cotizaciones_solicitud_estado on public.cotizaciones(solicitud_id, estado);
-- Índices para prestador_servicios
create index if not exists idx_prestador_servicios_prestador_servicio on public.prestador_servicios(prestador_id, servicio_id);
-- Índices para notificaciones
create index if not exists idx_notificaciones_usuario_leida on public.notificaciones(usuario_id, leida, created_at desc);
-- Índices para conversaciones
create index if not exists idx_conversaciones_participantes on public.conversaciones(participante_1_id, participante_2_id);
create index if not exists idx_conversaciones_solicitud on public.conversaciones(solicitud_id);
-- Índices para prestadores
create index if not exists idx_prestadores_usuario on public.prestadores(usuario_id);
-- Índices para pagos
create index if not exists idx_pagos_trabajo on public.pagos(trabajo_id);
create index if not exists idx_pagos_prestador_estado on public.pagos(prestador_id, estado);
-- Índices para favoritos
create index if not exists idx_favoritos_usuario on public.favoritos(usuario_id);
-- Índices para portfolio
create index if not exists idx_portfolio_prestador on public.portfolio(prestador_id);
create index if not exists idx_portfolio_servicio on public.portfolio(servicio_id);
-- ============================================================================
-- 18. INSERTAR DATOS INICIALES
-- ============================================================================
-- Insertar categorías
insert into public.categorias (id, nombre)
values (1, 'Construcción y Albañilería'),
    (2, 'Electricidad'),
    (3, 'Plomería y Gas'),
    (4, 'Climatización'),
    (5, 'Pintura y Revestimientos'),
    (6, 'Pisos y Cerámicas'),
    (7, 'Carpintería'),
    (8, 'Herrería y Metalurgia'),
    (9, 'Techos e Impermeabilización'),
    (10, 'Vidrios y Aberturas'),
    (11, 'Jardinería y Paisajismo'),
    (12, 'Tecnología e Informática'),
    (13, 'Electrodomésticos'),
    (14, 'Automotor'),
    (15, 'Limpieza'),
    (16, 'Mudanzas y Transporte'),
    (17, 'Eventos y Catering'),
    (18, 'Estética y Belleza'),
    (19, 'Salud y Bienestar'),
    (20, 'Educación'),
    (21, 'Mascotas'),
    (22, 'Seguridad'),
    (23, 'Otros Servicios') on conflict (id) do nothing;
-- Insertar servicios
insert into public.servicios (nombre, categoria_id)
values -- Construcción y Albañilería (1)
    ('Albañil', 1),
    ('Constructor', 1),
    ('Maestro mayor de obras', 1),
    ('Oficial de construcción', 1),
    ('Yesero', 1),
    ('Revocador', 1),
    ('Colocador de revestimientos', 1),
    ('Demoliciones', 1),
    -- Electricidad (2)
    ('Electricista matriculado', 2),
    ('Electricista domiciliario', 2),
    ('Electricista industrial', 2),
    ('Instalador de tableros eléctricos', 2),
    ('Instalador de sistemas de iluminación', 2),
    ('Reparación de electrodomésticos', 2),
    -- Plomería y Gas (3)
    ('Plomero', 3),
    ('Gasista matriculado', 3),
    ('Destapador de cañerías', 3),
    ('Instalador de termotanques', 3),
    ('Instalador de calefones', 3),
    ('Reparación de bombas de agua', 3),
    ('Instalador de sistemas de riego', 3),
    -- Climatización (4)
    ('Técnico en aire acondicionado', 4),
    ('Instalador de split', 4),
    ('Técnico en refrigeración', 4),
    ('Instalador de calefacción', 4),
    ('Mantenimiento de sistemas HVAC', 4),
    -- Pintura y Revestimientos (5)
    ('Pintor', 5),
    ('Pintor de obra', 5),
    ('Durlock / Yeso', 5),
    ('Colocador de papel tapiz', 5),
    ('Colocador de vinilos decorativos', 5),
    ('Microcemento / Cemento alisado', 5),
    ('Venecitas', 5),
    -- Pisos y Cerámicas (6)
    ('Colocador de cerámicos', 6),
    ('Colocador de porcelanatos', 6),
    ('Pulidor de pisos', 6),
    ('Plastificador de pisos', 6),
    ('Colocador de pisos flotantes', 6),
    ('Parquetista', 6),
    ('Instalador de alfombras', 6),
    -- Carpintería (7)
    ('Carpintero', 7),
    ('Ebanista', 7),
    ('Restaurador de muebles', 7),
    ('Fabricante de muebles a medida', 7),
    ('Instalador de muebles de cocina', 7),
    ('Tapicero', 7),
    -- Herrería y Metalurgia (8)
    ('Herrero', 8),
    ('Soldador', 8),
    ('Instalador de rejas', 8),
    ('Fabricante de portones', 8),
    ('Cerrajero', 8),
    ('Afilador', 8),
    -- Techos e Impermeabilización (9)
    ('Techista', 9),
    ('Instalador de membranas', 9),
    ('Impermeabilizador', 9),
    ('Instalador de canaletas', 9),
    ('Reparación de techos', 9),
    ('Instalador de tejas', 9),
    -- Vidrios y Aberturas (10)
    ('Vidriero', 10),
    ('Instalador de ventanas', 10),
    ('Instalador de mamparas', 10),
    ('Reparación de aberturas de aluminio', 10),
    ('Mosquiteros', 10),
    -- Jardinería y Paisajismo (11)
    ('Jardinero', 11),
    ('Paisajista', 11),
    ('Podador de árboles', 11),
    ('Fumigador', 11),
    ('Mantenimiento de piscinas', 11),
    ('Instalador de césped sintético', 11),
    ('Limpieza de terrenos', 11),
    -- Tecnología e Informática (12)
    ('Técnico en computación', 12),
    ('Instalador de redes', 12),
    ('Técnico en celulares', 12),
    ('Reparación de notebooks', 12),
    ('Instalador de cámaras de seguridad', 12),
    ('Configuración de Smart TV', 12),
    ('Soporte técnico remoto', 12),
    -- Electrodomésticos (13)
    ('Técnico en heladeras', 13),
    ('Técnico en lavarropas', 13),
    ('Técnico en microondas', 13),
    ('Reparación de cocinas', 13),
    ('Técnico en aspiradoras', 13),
    ('Service de línea blanca', 13),
    -- Automotor (14)
    ('Mecánico', 14),
    ('Electricista del automotor', 14),
    ('Chapista', 14),
    ('Pintor automotor', 14),
    ('Gomería', 14),
    ('Lavadero de autos', 14),
    ('Instalador de alarmas', 14),
    ('Polarizado de vidrios', 14),
    -- Limpieza (15)
    ('Limpieza de casas/departamentos', 15),
    ('Limpieza profunda / post obra', 15),
    ('Limpieza de oficinas', 15),
    ('Limpieza de tapizados', 15),
    ('Limpieza de vidrios', 15),
    ('Limpieza de tanques de agua', 15),
    ('Desinfección y sanitización', 15),
    -- Mudanzas y Transporte (16)
    ('Mudanzas', 16),
    ('Flete', 16),
    ('Guardamuebles', 16),
    ('Armado y desarmado de muebles', 16),
    -- Eventos y Catering (17)
    ('Chef a domicilio', 17),
    ('Catering', 17),
    ('Servicio de mozos', 17),
    ('Barman', 17),
    ('DJ', 17),
    ('Fotógrafo', 17),
    ('Organizador de eventos', 17),
    -- Estética y Belleza (18)
    ('Peluquero/a a domicilio', 18),
    ('Manicura/Pedicura', 18),
    ('Maquillador/a', 18),
    ('Masajista', 18),
    ('Barbero', 18),
    ('Depilación', 18),
    -- Salud y Bienestar (19)
    ('Enfermero/a', 19),
    ('Cuidador/a de adultos mayores', 19),
    ('Cuidador/a de niños (niñera)', 19),
    ('Fisioterapeuta a domicilio', 19),
    ('Nutricionista', 19),
    ('Entrenador personal', 19),
    -- Educación (20)
    (
        'Profesor particular (matemática, física, etc.)',
        20
    ),
    ('Profesor de idiomas', 20),
    ('Profesor de música', 20),
    ('Apoyo escolar', 20),
    ('Clases de computación', 20),
    -- Mascotas (21)
    ('Veterinario a domicilio', 21),
    ('Paseador de perros', 21),
    ('Peluquería canina', 21),
    ('Adiestrador', 21),
    ('Cuidador de mascotas', 21),
    -- Seguridad (22)
    ('Instalador de alarmas', 22),
    ('Cerrajería 24hs', 22),
    ('Instalador de cámaras', 22),
    ('Portero eléctrico', 22),
    ('Control de accesos', 22),
    -- Otros Servicios (23)
    ('Tapicero de autos', 23),
    ('Afinador de instrumentos', 23),
    ('Costurero/a', 23),
    ('Modista', 23),
    ('Zapatero', 23),
    ('Lustrador de calzado', 23) on conflict do nothing;
-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- Verificar creación
select 'Tablas creadas: ' || count(*)::text as resumen
from information_schema.tables
where table_schema = 'public'
    and table_type = 'BASE TABLE';
select 'Índices creados: ' || count(*)::text as resumen
from pg_indexes
where schemaname = 'public'
    and indexname like 'idx_%';



