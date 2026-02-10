-- ============================================================================
-- SECURITY FIX: Enable RLS and Create Policies for All Tables
-- This script fixes the 18 security vulnerabilities detected by Supabase
-- ============================================================================
-- IMPORTANT: Review and test these policies before applying to production
-- ============================================================================
-- NOTE: The users table already has RLS enabled, but you may want to review
-- the policy "Authenticated users can read public user data" as it allows
-- reading all fields including email, phone, address. Consider using the
-- users_public view instead for public data access.
-- ============================================================================

-- ============================================================================
-- 1. CATEGORIAS (Read-only catalog - can be public)
-- ============================================================================
alter table public.categorias enable row level security;

-- Allow public read access to categories
drop policy if exists "Public can read categorias" on public.categorias;
create policy "Public can read categorias" on public.categorias
    for select
    using (true);

-- Only authenticated users can insert/update/delete (admin operations)
drop policy if exists "Only authenticated can modify categorias" on public.categorias;
create policy "Only authenticated can modify categorias" on public.categorias
    for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

-- ============================================================================
-- 2. SERVICIOS (Read-only catalog - can be public)
-- ============================================================================
alter table public.servicios enable row level security;

-- Allow public read access to services
drop policy if exists "Public can read servicios" on public.servicios;
create policy "Public can read servicios" on public.servicios
    for select
    using (true);

-- Only authenticated users can insert/update/delete (admin operations)
drop policy if exists "Only authenticated can modify servicios" on public.servicios;
create policy "Only authenticated can modify servicios" on public.servicios
    for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

-- ============================================================================
-- 3. PRESTADOR_SERVICIOS
-- ============================================================================
alter table public.prestador_servicios enable row level security;

-- Prestadores can read their own services
drop policy if exists "Prestadores can read own services" on public.prestador_servicios;
create policy "Prestadores can read own services" on public.prestador_servicios
    for select
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = prestador_servicios.prestador_id
            and p.usuario_id = auth.uid()
        )
    );

-- Authenticated users can read all prestador_servicios (for search)
drop policy if exists "Authenticated can read all prestador_servicios" on public.prestador_servicios;
create policy "Authenticated can read all prestador_servicios" on public.prestador_servicios
    for select
    using (auth.role() = 'authenticated');

-- Prestadores can insert/update/delete their own services
drop policy if exists "Prestadores can manage own services" on public.prestador_servicios;
create policy "Prestadores can manage own services" on public.prestador_servicios
    for all
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = prestador_servicios.prestador_id
            and p.usuario_id = auth.uid()
        )
    )
    with check (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = prestador_servicios.prestador_id
            and p.usuario_id = auth.uid()
        )
    );

-- ============================================================================
-- 4. SOLICITUDES_SERVICIO
-- ============================================================================
alter table public.solicitudes_servicio enable row level security;

-- Clients can read their own requests
drop policy if exists "Clients can read own solicitudes" on public.solicitudes_servicio;
create policy "Clients can read own solicitudes" on public.solicitudes_servicio
    for select
    using (
        auth.role() = 'authenticated' and
        cliente_id = auth.uid()
    );

-- Prestadores can read solicitudes for services they offer
drop policy if exists "Prestadores can read relevant solicitudes" on public.solicitudes_servicio;
create policy "Prestadores can read relevant solicitudes" on public.solicitudes_servicio
    for select
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestador_servicios ps
            join public.prestadores p on p.id = ps.prestador_id
            where ps.servicio_id = solicitudes_servicio.servicio_id
            and p.usuario_id = auth.uid()
        )
    );

-- Clients can insert their own requests
drop policy if exists "Clients can insert own solicitudes" on public.solicitudes_servicio;
create policy "Clients can insert own solicitudes" on public.solicitudes_servicio
    for insert
    with check (
        auth.role() = 'authenticated' and
        cliente_id = auth.uid()
    );

-- Clients can update their own requests
drop policy if exists "Clients can update own solicitudes" on public.solicitudes_servicio;
create policy "Clients can update own solicitudes" on public.solicitudes_servicio
    for update
    using (
        auth.role() = 'authenticated' and
        cliente_id = auth.uid()
    )
    with check (
        auth.role() = 'authenticated' and
        cliente_id = auth.uid()
    );

-- ============================================================================
-- 5. COTIZACIONES
-- ============================================================================
alter table public.cotizaciones enable row level security;

-- Clients can read cotizaciones for their solicitudes
drop policy if exists "Clients can read cotizaciones for own solicitudes" on public.cotizaciones;
create policy "Clients can read cotizaciones for own solicitudes" on public.cotizaciones
    for select
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.solicitudes_servicio s
            where s.id = cotizaciones.solicitud_id
            and s.cliente_id = auth.uid()
        )
    );

-- Prestadores can read their own cotizaciones
drop policy if exists "Prestadores can read own cotizaciones" on public.cotizaciones;
create policy "Prestadores can read own cotizaciones" on public.cotizaciones
    for select
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = cotizaciones.prestador_id
            and p.usuario_id = auth.uid()
        )
    );

-- Prestadores can insert their own cotizaciones
drop policy if exists "Prestadores can insert own cotizaciones" on public.cotizaciones;
create policy "Prestadores can insert own cotizaciones" on public.cotizaciones
    for insert
    with check (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = cotizaciones.prestador_id
            and p.usuario_id = auth.uid()
        )
    );

-- Prestadores can update their own cotizaciones
drop policy if exists "Prestadores can update own cotizaciones" on public.cotizaciones;
create policy "Prestadores can update own cotizaciones" on public.cotizaciones
    for update
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = cotizaciones.prestador_id
            and p.usuario_id = auth.uid()
        )
    )
    with check (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = cotizaciones.prestador_id
            and p.usuario_id = auth.uid()
        )
    );

-- Clients can update cotizaciones for their solicitudes (to accept/reject)
drop policy if exists "Clients can update cotizaciones for own solicitudes" on public.cotizaciones;
create policy "Clients can update cotizaciones for own solicitudes" on public.cotizaciones
    for update
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.solicitudes_servicio s
            where s.id = cotizaciones.solicitud_id
            and s.cliente_id = auth.uid()
        )
    )
    with check (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.solicitudes_servicio s
            where s.id = cotizaciones.solicitud_id
            and s.cliente_id = auth.uid()
        )
    );

-- ============================================================================
-- 6. TRABAJOS
-- ============================================================================
alter table public.trabajos enable row level security;

-- Clients can read their own trabajos
drop policy if exists "Clients can read own trabajos" on public.trabajos;
create policy "Clients can read own trabajos" on public.trabajos
    for select
    using (
        auth.role() = 'authenticated' and
        cliente_id = auth.uid()
    );

-- Prestadores can read their own trabajos
drop policy if exists "Prestadores can read own trabajos" on public.trabajos;
create policy "Prestadores can read own trabajos" on public.trabajos
    for select
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = trabajos.prestador_id
            and p.usuario_id = auth.uid()
        )
    );

-- Clients and prestadores can update trabajos they're involved in
drop policy if exists "Participants can update trabajos" on public.trabajos;
create policy "Participants can update trabajos" on public.trabajos
    for update
    using (
        auth.role() = 'authenticated' and
        (
            cliente_id = auth.uid() or
            exists (
                select 1 from public.prestadores p
                where p.id = trabajos.prestador_id
                and p.usuario_id = auth.uid()
            )
        )
    )
    with check (
        auth.role() = 'authenticated' and
        (
            cliente_id = auth.uid() or
            exists (
                select 1 from public.prestadores p
                where p.id = trabajos.prestador_id
                and p.usuario_id = auth.uid()
            )
        )
    );

-- ============================================================================
-- 7. CALIFICACIONES
-- ============================================================================
alter table public.calificaciones enable row level security;

-- Anyone can read calificaciones (for public profiles)
drop policy if exists "Public can read calificaciones" on public.calificaciones;
create policy "Public can read calificaciones" on public.calificaciones
    for select
    using (true);

-- Users can insert their own calificaciones
drop policy if exists "Users can insert own calificaciones" on public.calificaciones;
create policy "Users can insert own calificaciones" on public.calificaciones
    for insert
    with check (
        auth.role() = 'authenticated' and
        calificador_id = auth.uid()
    );

-- Users can update their own calificaciones
drop policy if exists "Users can update own calificaciones" on public.calificaciones;
create policy "Users can update own calificaciones" on public.calificaciones
    for update
    using (
        auth.role() = 'authenticated' and
        calificador_id = auth.uid()
    )
    with check (
        auth.role() = 'authenticated' and
        calificador_id = auth.uid()
    );

-- ============================================================================
-- 8. CONVERSACIONES
-- ============================================================================
alter table public.conversaciones enable row level security;

-- Participants can read their own conversations
drop policy if exists "Participants can read own conversations" on public.conversaciones;
create policy "Participants can read own conversations" on public.conversaciones
    for select
    using (
        auth.role() = 'authenticated' and
        (
            participante_1_id = auth.uid() or
            participante_2_id = auth.uid()
        )
    );

-- Participants can insert conversations they're part of
drop policy if exists "Participants can insert conversations" on public.conversaciones;
create policy "Participants can insert conversations" on public.conversaciones
    for insert
    with check (
        auth.role() = 'authenticated' and
        (
            participante_1_id = auth.uid() or
            participante_2_id = auth.uid()
        )
    );

-- Participants can update their own conversations
drop policy if exists "Participants can update own conversations" on public.conversaciones;
create policy "Participants can update own conversations" on public.conversaciones
    for update
    using (
        auth.role() = 'authenticated' and
        (
            participante_1_id = auth.uid() or
            participante_2_id = auth.uid()
        )
    )
    with check (
        auth.role() = 'authenticated' and
        (
            participante_1_id = auth.uid() or
            participante_2_id = auth.uid()
        )
    );

-- ============================================================================
-- 9. MENSAJES
-- ============================================================================
alter table public.mensajes enable row level security;

-- Participants can read messages from their conversations
drop policy if exists "Participants can read messages" on public.mensajes;
create policy "Participants can read messages" on public.mensajes
    for select
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.conversaciones c
            where c.id = mensajes.conversacion_id
            and (
                c.participante_1_id = auth.uid() or
                c.participante_2_id = auth.uid()
            )
        )
    );

-- Users can insert messages in conversations they're part of
drop policy if exists "Users can insert messages" on public.mensajes;
create policy "Users can insert messages" on public.mensajes
    for insert
    with check (
        auth.role() = 'authenticated' and
        remitente_id = auth.uid() and
        exists (
            select 1 from public.conversaciones c
            where c.id = mensajes.conversacion_id
            and (
                c.participante_1_id = auth.uid() or
                c.participante_2_id = auth.uid()
            )
        )
    );

-- Users can update their own messages (mark as read, etc.)
drop policy if exists "Users can update own messages" on public.mensajes;
create policy "Users can update own messages" on public.mensajes
    for update
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.conversaciones c
            where c.id = mensajes.conversacion_id
            and (
                c.participante_1_id = auth.uid() or
                c.participante_2_id = auth.uid()
            )
        )
    )
    with check (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.conversaciones c
            where c.id = mensajes.conversacion_id
            and (
                c.participante_1_id = auth.uid() or
                c.participante_2_id = auth.uid()
            )
        )
    );

-- ============================================================================
-- 10. PAGOS
-- ============================================================================
alter table public.pagos enable row level security;

-- Clients can read their own payments
drop policy if exists "Clients can read own pagos" on public.pagos;
create policy "Clients can read own pagos" on public.pagos
    for select
    using (
        auth.role() = 'authenticated' and
        cliente_id = auth.uid()
    );

-- Prestadores can read their own payments
drop policy if exists "Prestadores can read own pagos" on public.pagos;
create policy "Prestadores can read own pagos" on public.pagos
    for select
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = pagos.prestador_id
            and p.usuario_id = auth.uid()
        )
    );

-- Only system can insert/update payments (via service role)
-- Regular users cannot directly modify payments
drop policy if exists "No direct payment modifications" on public.pagos;
create policy "No direct payment modifications" on public.pagos
    for all
    using (false)
    with check (false);

-- ============================================================================
-- 11. DISPONIBILIDAD_PRESTADORES
-- ============================================================================
alter table public.disponibilidad_prestadores enable row level security;

-- Prestadores can read their own availability
drop policy if exists "Prestadores can read own disponibilidad" on public.disponibilidad_prestadores;
create policy "Prestadores can read own disponibilidad" on public.disponibilidad_prestadores
    for select
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = disponibilidad_prestadores.prestador_id
            and p.usuario_id = auth.uid()
        )
    );

-- Authenticated users can read all availability (for search)
drop policy if exists "Authenticated can read all disponibilidad" on public.disponibilidad_prestadores;
create policy "Authenticated can read all disponibilidad" on public.disponibilidad_prestadores
    for select
    using (auth.role() = 'authenticated');

-- Prestadores can manage their own availability
drop policy if exists "Prestadores can manage own disponibilidad" on public.disponibilidad_prestadores;
create policy "Prestadores can manage own disponibilidad" on public.disponibilidad_prestadores
    for all
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = disponibilidad_prestadores.prestador_id
            and p.usuario_id = auth.uid()
        )
    )
    with check (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = disponibilidad_prestadores.prestador_id
            and p.usuario_id = auth.uid()
        )
    );

-- ============================================================================
-- 12. ZONAS_COBERTURA
-- ============================================================================
alter table public.zonas_cobertura enable row level security;

-- Prestadores can read their own coverage zones
drop policy if exists "Prestadores can read own zonas" on public.zonas_cobertura;
create policy "Prestadores can read own zonas" on public.zonas_cobertura
    for select
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = zonas_cobertura.prestador_id
            and p.usuario_id = auth.uid()
        )
    );

-- Authenticated users can read all coverage zones (for search)
drop policy if exists "Authenticated can read all zonas" on public.zonas_cobertura;
create policy "Authenticated can read all zonas" on public.zonas_cobertura
    for select
    using (auth.role() = 'authenticated');

-- Prestadores can manage their own coverage zones
drop policy if exists "Prestadores can manage own zonas" on public.zonas_cobertura;
create policy "Prestadores can manage own zonas" on public.zonas_cobertura
    for all
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = zonas_cobertura.prestador_id
            and p.usuario_id = auth.uid()
        )
    )
    with check (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = zonas_cobertura.prestador_id
            and p.usuario_id = auth.uid()
        )
    );

-- ============================================================================
-- 13. REPORTES
-- ============================================================================
alter table public.reportes enable row level security;

-- Users can read their own reports (as reporter)
drop policy if exists "Users can read own reportes" on public.reportes;
create policy "Users can read own reportes" on public.reportes
    for select
    using (
        auth.role() = 'authenticated' and
        reportante_id = auth.uid()
    );

-- Users can insert their own reports
drop policy if exists "Users can insert own reportes" on public.reportes;
create policy "Users can insert own reportes" on public.reportes
    for insert
    with check (
        auth.role() = 'authenticated' and
        reportante_id = auth.uid()
    );

-- Only admins can update reports (resolve them)
-- Regular users cannot update reports
drop policy if exists "No direct report updates" on public.reportes;
create policy "No direct report updates" on public.reportes
    for update
    using (false)
    with check (false);

-- ============================================================================
-- 14. NOTIFICACIONES
-- ============================================================================
alter table public.notificaciones enable row level security;

-- Users can read their own notifications
drop policy if exists "Users can read own notificaciones" on public.notificaciones;
create policy "Users can read own notificaciones" on public.notificaciones
    for select
    using (
        auth.role() = 'authenticated' and
        usuario_id = auth.uid()
    );

-- Users can update their own notifications (mark as read)
drop policy if exists "Users can update own notificaciones" on public.notificaciones;
create policy "Users can update own notificaciones" on public.notificaciones
    for update
    using (
        auth.role() = 'authenticated' and
        usuario_id = auth.uid()
    )
    with check (
        auth.role() = 'authenticated' and
        usuario_id = auth.uid()
    );

-- Only system can insert notifications (via service role or triggers)
drop policy if exists "No direct notification inserts" on public.notificaciones;
create policy "No direct notification inserts" on public.notificaciones
    for insert
    with check (false);

-- ============================================================================
-- 15. FAVORITOS
-- ============================================================================
alter table public.favoritos enable row level security;

-- Users can read their own favorites
drop policy if exists "Users can read own favoritos" on public.favoritos;
create policy "Users can read own favoritos" on public.favoritos
    for select
    using (
        auth.role() = 'authenticated' and
        usuario_id = auth.uid()
    );

-- Users can manage their own favorites
drop policy if exists "Users can manage own favoritos" on public.favoritos;
create policy "Users can manage own favoritos" on public.favoritos
    for all
    using (
        auth.role() = 'authenticated' and
        usuario_id = auth.uid()
    )
    with check (
        auth.role() = 'authenticated' and
        usuario_id = auth.uid()
    );

-- ============================================================================
-- 16. CERTIFICACIONES
-- ============================================================================
alter table public.certificaciones enable row level security;

-- Prestadores can read their own certifications
drop policy if exists "Prestadores can read own certificaciones" on public.certificaciones;
create policy "Prestadores can read own certificaciones" on public.certificaciones
    for select
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = certificaciones.prestador_id
            and p.usuario_id = auth.uid()
        )
    );

-- Authenticated users can read all certifications (for public profiles)
drop policy if exists "Authenticated can read all certificaciones" on public.certificaciones;
create policy "Authenticated can read all certificaciones" on public.certificaciones
    for select
    using (auth.role() = 'authenticated');

-- Prestadores can manage their own certifications
drop policy if exists "Prestadores can manage own certificaciones" on public.certificaciones;
create policy "Prestadores can manage own certificaciones" on public.certificaciones
    for all
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = certificaciones.prestador_id
            and p.usuario_id = auth.uid()
        )
    )
    with check (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = certificaciones.prestador_id
            and p.usuario_id = auth.uid()
        )
    );

-- ============================================================================
-- 17. PORTFOLIO
-- ============================================================================
alter table public.portfolio enable row level security;

-- Prestadores can read their own portfolio
drop policy if exists "Prestadores can read own portfolio" on public.portfolio;
create policy "Prestadores can read own portfolio" on public.portfolio
    for select
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = portfolio.prestador_id
            and p.usuario_id = auth.uid()
        )
    );

-- Authenticated users can read all portfolio (for public profiles)
drop policy if exists "Authenticated can read all portfolio" on public.portfolio;
create policy "Authenticated can read all portfolio" on public.portfolio
    for select
    using (auth.role() = 'authenticated');

-- Prestadores can manage their own portfolio
drop policy if exists "Prestadores can manage own portfolio" on public.portfolio;
create policy "Prestadores can manage own portfolio" on public.portfolio
    for all
    using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = portfolio.prestador_id
            and p.usuario_id = auth.uid()
        )
    )
    with check (
        auth.role() = 'authenticated' and
        exists (
            select 1 from public.prestadores p
            where p.id = portfolio.prestador_id
            and p.usuario_id = auth.uid()
        )
    );

-- ============================================================================
-- 18. CUPONES_DESCUENTO
-- ============================================================================
alter table public.cupones_descuento enable row level security;

-- Authenticated users can read active coupons
drop policy if exists "Authenticated can read active cupones" on public.cupones_descuento;
create policy "Authenticated can read active cupones" on public.cupones_descuento
    for select
    using (
        auth.role() = 'authenticated' and
        activo = true and
        valido_desde <= now() and
        valido_hasta >= now()
    );

-- Only admins can insert/update/delete coupons (via service role)
-- Regular users cannot modify coupons
drop policy if exists "No direct coupon modifications" on public.cupones_descuento;
create policy "No direct coupon modifications" on public.cupones_descuento
    for all
    using (false)
    with check (false);

-- ============================================================================
-- 19. REFERIDOS
-- ============================================================================
alter table public.referidos enable row level security;

-- Users can read their own referrals (as referrer or referred)
drop policy if exists "Users can read own referidos" on public.referidos;
create policy "Users can read own referidos" on public.referidos
    for select
    using (
        auth.role() = 'authenticated' and
        (
            referidor_id = auth.uid() or
            referido_id = auth.uid()
        )
    );

-- Only system can insert/update referrals (via service role or triggers)
-- Regular users cannot directly modify referrals
drop policy if exists "No direct referral modifications" on public.referidos;
create policy "No direct referral modifications" on public.referidos
    for all
    using (false)
    with check (false);

-- ============================================================================
-- 20. CONFIGURACION_SISTEMA
-- ============================================================================
alter table public.configuracion_sistema enable row level security;

-- Authenticated users can read system configuration
drop policy if exists "Authenticated can read configuracion" on public.configuracion_sistema;
create policy "Authenticated can read configuracion" on public.configuracion_sistema
    for select
    using (auth.role() = 'authenticated');

-- Only admins can modify system configuration (via service role)
-- Regular users cannot modify configuration
drop policy if exists "No direct config modifications" on public.configuracion_sistema;
create policy "No direct config modifications" on public.configuracion_sistema
    for all
    using (false)
    with check (false);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify RLS is enabled on all tables:

-- Check which tables have RLS enabled
select 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
order by tablename;

-- Check policy count per table
select 
    schemaname,
    tablename,
    count(*) as policy_count
from pg_policies
where schemaname = 'public'
group by schemaname, tablename
order by tablename;

-- ============================================================================
-- END OF SECURITY FIX SCRIPT
-- ============================================================================
-- After running this script, all 18 security vulnerabilities should be fixed.
-- Review the policies and adjust them according to your specific business needs.
-- ============================================================================
