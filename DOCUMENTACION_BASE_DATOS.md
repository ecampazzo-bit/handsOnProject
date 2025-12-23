# Documentación de Base de Datos - HandsOn Project

Esta documentación describe la estructura completa de la base de datos para la plataforma HandsOn, un sistema de gestión de servicios profesionales que conecta clientes con prestadores de servicios.

## Índice

1. [Visión General](#visión-general)
2. [Tipos ENUM](#tipos-enum)
3. [Estructura de Tablas](#estructura-de-tablas)
4. [Relaciones entre Tablas](#relaciones-entre-tablas)
5. [Índices](#índices)
6. [Scripts de Replicación](#scripts-de-replicación)
7. [Datos Iniciales](#datos-iniciales)

---

## Visión General

La base de datos está diseñada para soportar una plataforma completa de servicios profesionales con las siguientes funcionalidades principales:

- **Gestión de Usuarios**: Clientes y prestadores con perfiles completos
- **Catálogo de Servicios**: Categorías y servicios disponibles
- **Solicitudes y Cotizaciones**: Sistema de solicitudes de servicios y cotizaciones de prestadores
- **Trabajos**: Seguimiento completo del ciclo de vida de trabajos
- **Calificaciones**: Sistema bidireccional de calificaciones
- **Mensajería**: Sistema de conversaciones y mensajería entre usuarios
- **Pagos**: Gestión de pagos y comisiones
- **Disponibilidad y Cobertura**: Horarios y zonas de cobertura de prestadores
- **Portfolio y Certificaciones**: Portfolios de trabajos y certificaciones
- **Notificaciones y Reportes**: Sistema de notificaciones y reportes

---

## Tipos ENUM

### tipo_usuario
Valores: `cliente`, `prestador`, `ambos`

### urgencia
Valores: `baja`, `media`, `alta`, `emergencia`

### estado_solicitud
Valores: `pendiente`, `cotizando`, `aceptada`, `en_progreso`, `completada`, `cancelada`

### estado_cotizacion
Valores: `enviada`, `vista`, `aceptada`, `rechazada`, `expirada`

### estado_trabajo
Valores: `programado`, `en_camino`, `en_progreso`, `pausado`, `completado`, `cancelado`

### tipo_calificacion
Valores: `cliente_a_prestador`, `prestador_a_cliente`

### tipo_mensaje
Valores: `texto`, `imagen`, `archivo`, `cotizacion`, `sistema`

### metodo_pago
Valores: `efectivo`, `transferencia`, `tarjeta_debito`, `tarjeta_credito`, `mercadopago`, `otro`

### estado_pago
Valores: `pendiente`, `procesando`, `completado`, `fallido`, `reembolsado`

### tipo_zona
Valores: `barrio`, `localidad`, `zona`, `radio_km`

### tipo_reporte
Valores: `fraude`, `mala_conducta`, `trabajo_incompleto`, `no_presentacion`, `acoso`, `otro`

### estado_reporte
Valores: `pendiente`, `en_revision`, `resuelto`, `desestimado`

### tipo_notificacion
Valores: `nueva_solicitud`, `nueva_cotizacion`, `trabajo_aceptado`, `mensaje`, `calificacion`, `pago`, `sistema`

### tipo_cupon
Valores: `porcentaje`, `monto_fijo`

### estado_referido
Valores: `pendiente`, `registrado`, `primer_trabajo`, `completado`

### tipo_dato_config
Valores: `string`, `integer`, `boolean`, `json`

---

## Estructura de Tablas

### 1. users

Tabla principal de usuarios del sistema (clientes y prestadores).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Identificador único |
| email | text | NOT NULL, UNIQUE | Email del usuario (usado como nombre de usuario) |
| password | text | NOT NULL | Contraseña hasheada (nunca texto plano) |
| nombre | text | NOT NULL | Nombre del usuario |
| apellido | text | NOT NULL | Apellido del usuario |
| telefono | text | NOT NULL | Teléfono de contacto |
| direccion | text | NULLABLE | Dirección completa |
| latitud | numeric(10,7) | NULLABLE | Coordenada GPS - latitud |
| longitud | numeric(10,7) | NULLABLE | Coordenada GPS - longitud |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de última actualización (auto) |
| foto_perfil_url | text | NULLABLE | URL de la foto de perfil |
| tipo_usuario | tipo_usuario | NOT NULL, DEFAULT 'cliente' | Tipo de usuario: cliente, prestador, ambos |
| verificado | boolean | NOT NULL, DEFAULT false | Usuario verificado |
| calificacion_promedio | numeric | NULLABLE | Calificación promedio (1-5) |
| cantidad_calificaciones | integer | NOT NULL, DEFAULT 0 | Cantidad de calificaciones recibidas |
| fecha_registro | timestamptz | NOT NULL, DEFAULT now() | Fecha de registro |
| ultimo_acceso | timestamptz | NULLABLE | Fecha del último acceso |
| activo | boolean | NOT NULL, DEFAULT true | Usuario activo/inactivo |

**Políticas RLS:**
- Usuarios autenticados pueden leer su propia información
- Usuarios pueden actualizar sus propios datos
- Solo usuarios autenticados pueden insertar

**View asociada:** `users_public` (expone todos los campos excepto password)

---

### 2. prestadores

Extiende la tabla users con información profesional de prestadores de servicios.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| usuario_id | uuid | NOT NULL, UNIQUE, FK → users(id) | Referencia al usuario |
| descripcion_profesional | text | NULLABLE | Descripción profesional |
| años_experiencia | integer | NULLABLE | Años de experiencia |
| tiene_matricula | boolean | NOT NULL, DEFAULT false | Si tiene matrícula profesional |
| numero_matricula | text | NULLABLE | Número de matrícula |
| documentos_verificados | boolean | NOT NULL, DEFAULT false | Documentos verificados |
| radio_cobertura_km | integer | NULLABLE | Radio de cobertura en km |
| disponibilidad_inmediata | boolean | NOT NULL, DEFAULT false | Disponibilidad inmediata |
| precio_minimo | numeric | NULLABLE | Precio mínimo de trabajos |
| acepta_efectivo | boolean | NOT NULL, DEFAULT true | Acepta pago en efectivo |
| acepta_transferencia | boolean | NOT NULL, DEFAULT false | Acepta transferencia |
| acepta_tarjeta | boolean | NOT NULL, DEFAULT false | Acepta tarjeta |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de actualización (auto) |

---

### 3. categorias

Categorías de servicios disponibles.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| nombre | text | NOT NULL | Nombre de la categoría |
| url | text | NULLABLE | URL de la imagen representativa de la categoría |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |

---

### 4. servicios

Servicios disponibles en el sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| nombre | text | NOT NULL | Nombre del servicio |
| categoria_id | bigint | NOT NULL, FK → categorias(id) | Categoría a la que pertenece |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |

---

### 5. prestador_servicios

Relación muchos a muchos entre prestadores y servicios.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| prestador_id | bigint | NOT NULL, FK → prestadores(id) | Prestador |
| servicio_id | bigint | NOT NULL, FK → servicios(id) | Servicio |
| precio_base | numeric | NULLABLE | Precio base del servicio |
| precio_desde | numeric | NULLABLE | Precio desde |
| experiencia_años | integer | NULLABLE | Años de experiencia en este servicio |
| destacado | boolean | NOT NULL, DEFAULT false | Si está destacado |
| fecha_agregado | timestamptz | NOT NULL, DEFAULT now() | Fecha en que agregó el servicio |

**Constraint UNIQUE:** (prestador_id, servicio_id)

---

### 6. solicitudes_servicio

Solicitudes de servicios por parte de clientes.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| cliente_id | uuid | NOT NULL, FK → users(id) | Cliente que solicita |
| servicio_id | bigint | NOT NULL, FK → servicios(id) | Servicio solicitado |
| descripcion_problema | text | NULLABLE | Descripción del problema/necesidad |
| direccion | text | NULLABLE | Dirección donde se requiere el servicio |
| latitud | numeric(10,7) | NULLABLE | Coordenada GPS - latitud |
| longitud | numeric(10,7) | NULLABLE | Coordenada GPS - longitud |
| fecha_preferida | date | NULLABLE | Fecha preferida |
| horario_preferido | text | NULLABLE | Horario preferido |
| presupuesto_estimado | numeric | NULLABLE | Presupuesto estimado del cliente |
| urgencia | urgencia | NOT NULL, DEFAULT 'media' | Nivel de urgencia |
| estado | estado_solicitud | NOT NULL, DEFAULT 'pendiente' | Estado de la solicitud |
| fotos_urls | text[] | NULLABLE | Array de URLs de fotos |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de actualización (auto) |

---

### 7. cotizaciones

Cotizaciones enviadas por prestadores para solicitudes.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| solicitud_id | bigint | NOT NULL, FK → solicitudes_servicio(id) | Solicitud asociada |
| prestador_id | bigint | NOT NULL, FK → prestadores(id) | Prestador que cotiza |
| precio_ofrecido | numeric | NOT NULL | Precio ofrecido |
| descripcion_trabajo | text | NULLABLE | Descripción del trabajo propuesto |
| tiempo_estimado | integer | NULLABLE | Tiempo estimado en horas |
| materiales_incluidos | boolean | NOT NULL, DEFAULT false | Si materiales están incluidos |
| garantia_dias | integer | NULLABLE | Días de garantía |
| fecha_disponible | date | NULLABLE | Fecha disponible para realizar el trabajo |
| estado | estado_cotizacion | NOT NULL, DEFAULT 'enviada' | Estado de la cotización |
| vigencia_hasta | timestamptz | NULLABLE | Vigencia de la cotización |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |

---

### 8. trabajos

Trabajos en progreso o completados.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| solicitud_id | bigint | NOT NULL, FK → solicitudes_servicio(id) | Solicitud original |
| cotizacion_id | bigint | NULLABLE, FK → cotizaciones(id) | Cotización aceptada |
| prestador_id | bigint | NOT NULL, FK → prestadores(id) | Prestador asignado |
| cliente_id | uuid | NOT NULL, FK → users(id) | Cliente |
| fecha_inicio | timestamptz | NULLABLE | Fecha de inicio real |
| fecha_fin | timestamptz | NULLABLE | Fecha de finalización |
| fecha_programada | timestamptz | NULLABLE | Fecha programada |
| estado | estado_trabajo | NOT NULL, DEFAULT 'programado' | Estado del trabajo |
| monto_final | numeric | NULLABLE | Monto final acordado |
| notas_prestador | text | NULLABLE | Notas del prestador |
| notas_cliente | text | NULLABLE | Notas del cliente |
| fotos_antes | text[] | NULLABLE | Fotos antes del trabajo |
| fotos_durante | text[] | NULLABLE | Fotos durante el trabajo |
| fotos_despues | text[] | NULLABLE | Fotos después del trabajo |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de actualización (auto) |

---

### 9. calificaciones

Sistema de calificaciones bidireccional (cliente→prestador y prestador→cliente).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| trabajo_id | bigint | NOT NULL, FK → trabajos(id) | Trabajo relacionado |
| calificador_id | uuid | NOT NULL, FK → users(id) | Usuario que califica |
| calificado_id | uuid | NOT NULL, FK → users(id) | Usuario calificado |
| tipo_calificacion | tipo_calificacion | NOT NULL | Tipo de calificación |
| puntuacion | integer | NOT NULL, CHECK 1-5 | Puntuación general (1-5) |
| puntualidad | integer | NULLABLE, CHECK 1-5 | Puntuación de puntualidad |
| calidad_trabajo | integer | NULLABLE, CHECK 1-5 | Calidad del trabajo |
| limpieza | integer | NULLABLE, CHECK 1-5 | Limpieza |
| comunicacion | integer | NULLABLE, CHECK 1-5 | Comunicación |
| relacion_precio_calidad | integer | NULLABLE, CHECK 1-5 | Relación precio-calidad |
| comentario | text | NULLABLE | Comentario del calificador |
| respuesta | text | NULLABLE | Respuesta del calificado |
| fecha_calificacion | timestamptz | NOT NULL, DEFAULT now() | Fecha de calificación |
| verificado | boolean | NOT NULL, DEFAULT false | Si está verificado |

---

### 10. conversaciones

Conversaciones entre usuarios.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| solicitud_id | bigint | NULLABLE, FK → solicitudes_servicio(id) | Solicitud relacionada (opcional) |
| participante_1_id | uuid | NOT NULL, FK → users(id) | Primer participante |
| participante_2_id | uuid | NOT NULL, FK → users(id) | Segundo participante |
| ultimo_mensaje_id | bigint | NULLABLE, FK → mensajes(id) | Último mensaje |
| ultimo_mensaje_fecha | timestamptz | NULLABLE | Fecha del último mensaje |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |

**Constraint CHECK:** participante_1_id != participante_2_id

---

### 11. mensajes

Mensajes dentro de conversaciones.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| conversacion_id | bigint | NOT NULL, FK → conversaciones(id) | Conversación |
| remitente_id | uuid | NOT NULL, FK → users(id) | Remitente |
| contenido | text | NOT NULL | Contenido del mensaje |
| tipo | tipo_mensaje | NOT NULL, DEFAULT 'texto' | Tipo de mensaje |
| leido | boolean | NOT NULL, DEFAULT false | Si fue leído |
| fecha_lectura | timestamptz | NULLABLE | Fecha de lectura |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |

---

### 12. pagos

Gestión de pagos y comisiones.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| trabajo_id | bigint | NOT NULL, FK → trabajos(id) | Trabajo relacionado |
| cliente_id | uuid | NOT NULL, FK → users(id) | Cliente que paga |
| prestador_id | bigint | NOT NULL, FK → prestadores(id) | Prestador que recibe |
| monto | numeric | NOT NULL | Monto total |
| metodo_pago | metodo_pago | NOT NULL | Método de pago |
| estado | estado_pago | NOT NULL, DEFAULT 'pendiente' | Estado del pago |
| transaccion_id | varchar(255) | NULLABLE | ID de transacción externa |
| comision_plataforma | numeric | NULLABLE | Comisión de la plataforma |
| neto_prestador | numeric | NULLABLE | Monto neto para el prestador |
| fecha_pago | timestamptz | NULLABLE | Fecha de pago |
| fecha_liberacion | timestamptz | NULLABLE | Fecha de liberación al prestador |
| comprobante_url | text | NULLABLE | URL del comprobante |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de actualización (auto) |

---

### 13. disponibilidad_prestadores

Horarios de disponibilidad de prestadores.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| prestador_id | bigint | NOT NULL, FK → prestadores(id) | Prestador |
| dia_semana | integer | NOT NULL, CHECK 0-6 | Día de la semana (0=domingo, 6=sábado) |
| hora_inicio | time | NOT NULL | Hora de inicio |
| hora_fin | time | NOT NULL | Hora de fin |
| activo | boolean | NOT NULL, DEFAULT true | Si está activo |

**Constraint CHECK:** hora_fin > hora_inicio

---

### 14. zonas_cobertura

Zonas de cobertura de prestadores.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| prestador_id | bigint | NOT NULL, FK → prestadores(id) | Prestador |
| nombre_zona | varchar(255) | NOT NULL | Nombre de la zona |
| tipo | tipo_zona | NOT NULL | Tipo de zona |
| radio_km | integer | NULLABLE | Radio en km (si aplica) |
| centro_latitud | numeric(10,7) | NULLABLE | Latitud del centro |
| centro_longitud | numeric(10,7) | NULLABLE | Longitud del centro |
| recargo_porcentaje | numeric | DEFAULT 0 | Porcentaje de recargo |

---

### 15. reportes

Reportes entre usuarios.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| reportante_id | uuid | NOT NULL, FK → users(id) | Usuario que reporta |
| reportado_id | uuid | NOT NULL, FK → users(id) | Usuario reportado |
| trabajo_id | bigint | NULLABLE, FK → trabajos(id) | Trabajo relacionado (opcional) |
| tipo | tipo_reporte | NOT NULL | Tipo de reporte |
| descripcion | text | NOT NULL | Descripción del reporte |
| evidencias_urls | text[] | NULLABLE | URLs de evidencias |
| estado | estado_reporte | NOT NULL, DEFAULT 'pendiente' | Estado del reporte |
| resolucion | text | NULLABLE | Resolución del reporte |
| fecha_resolucion | timestamptz | NULLABLE | Fecha de resolución |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |

---

### 16. notificaciones

Sistema de notificaciones.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| usuario_id | uuid | NOT NULL, FK → users(id) | Usuario destinatario |
| tipo | tipo_notificacion | NOT NULL | Tipo de notificación |
| titulo | varchar(255) | NOT NULL | Título de la notificación |
| contenido | text | NULLABLE | Contenido |
| referencia_id | integer | NULLABLE | ID del objeto relacionado |
| referencia_tipo | varchar(100) | NULLABLE | Tipo de objeto relacionado |
| leida | boolean | NOT NULL, DEFAULT false | Si fue leída |
| enviada_push | boolean | NOT NULL, DEFAULT false | Si se envió push |
| enviada_email | boolean | NOT NULL, DEFAULT false | Si se envió email |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |

---

### 17. favoritos

Prestadores favoritos de usuarios.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| usuario_id | uuid | NOT NULL, FK → users(id) | Usuario |
| prestador_id | bigint | NOT NULL, FK → prestadores(id) | Prestador favorito |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |

**Constraint UNIQUE:** (usuario_id, prestador_id)

---

### 18. certificaciones

Certificaciones de prestadores.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| prestador_id | bigint | NOT NULL, FK → prestadores(id) | Prestador |
| nombre_certificacion | varchar(255) | NOT NULL | Nombre de la certificación |
| institucion | varchar(255) | NULLABLE | Institución que la emitió |
| numero_certificado | varchar(255) | NULLABLE | Número de certificado |
| fecha_obtencion | date | NULLABLE | Fecha de obtención |
| fecha_vencimiento | date | NULLABLE | Fecha de vencimiento |
| documento_url | text | NULLABLE | URL del documento |
| verificado | boolean | NOT NULL, DEFAULT false | Si está verificado |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |

---

### 19. portfolio

Portfolio de trabajos realizados por prestadores.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| prestador_id | bigint | NOT NULL, FK → prestadores(id) | Prestador |
| servicio_id | bigint | NOT NULL, FK → servicios(id) | Servicio |
| titulo | varchar(255) | NOT NULL | Título del trabajo |
| descripcion | text | NULLABLE | Descripción |
| fotos_urls | text[] | NULLABLE | URLs de fotos |
| fecha_trabajo | date | NULLABLE | Fecha del trabajo |
| destacado | boolean | NOT NULL, DEFAULT false | Si está destacado |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |

---

### 20. cupones_descuento

Sistema de cupones de descuento.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| codigo | varchar(100) | NOT NULL, UNIQUE | Código del cupón |
| tipo | tipo_cupon | NOT NULL | Tipo: porcentaje o monto fijo |
| valor | numeric | NOT NULL | Valor del descuento |
| minimo_compra | numeric | NULLABLE | Compra mínima requerida |
| maximo_descuento | numeric | NULLABLE | Descuento máximo (si aplica) |
| usos_maximos | integer | NULLABLE | Usos máximos permitidos |
| usos_actuales | integer | NOT NULL, DEFAULT 0 | Usos actuales |
| usuario_especifico_id | uuid | NULLABLE, FK → users(id) | Usuario específico (si aplica) |
| valido_desde | timestamptz | NOT NULL | Válido desde |
| valido_hasta | timestamptz | NOT NULL | Válido hasta |
| activo | boolean | NOT NULL, DEFAULT true | Si está activo |
| servicios_aplicables | bigint[] | NULLABLE | IDs de servicios aplicables |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |

---

### 21. referidos

Sistema de referidos y bonificaciones.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| referidor_id | uuid | NOT NULL, FK → users(id) | Usuario que refirió |
| referido_id | uuid | NOT NULL, FK → users(id) | Usuario referido |
| estado | estado_referido | NOT NULL, DEFAULT 'pendiente' | Estado del referido |
| bono_referidor | numeric | DEFAULT 0 | Bono para el referidor |
| bono_referido | numeric | DEFAULT 0 | Bono para el referido |
| pagado | boolean | NOT NULL, DEFAULT false | Si fue pagado |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de creación |

**Constraint CHECK:** referidor_id != referido_id

---

### 22. configuracion_sistema

Configuración del sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | bigint | PK, IDENTITY | Identificador único |
| clave | varchar(255) | NOT NULL, UNIQUE | Clave de configuración |
| valor | text | NOT NULL | Valor (como texto) |
| tipo_dato | tipo_dato_config | NOT NULL | Tipo de dato del valor |
| descripcion | text | NULLABLE | Descripción |
| editable | boolean | NOT NULL, DEFAULT true | Si es editable |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Fecha de actualización (auto) |

---

## Relaciones entre Tablas

### Diagrama de Relaciones Principales

```
users (1) ────< (1) prestadores
  │                    │
  │                    │
  │                    ├───< (N) prestador_servicios >─── (N) servicios
  │                    │
  │                    ├───< (N) cotizaciones
  │                    │
  │                    ├───< (N) trabajos
  │                    │
  │                    ├───< (N) pagos
  │                    │
  │                    ├───< (N) favoritos
  │                    │
  │                    ├───< (N) certificaciones
  │                    │
  │                    ├───< (N) portfolio
  │                    │
  │                    ├───< (N) disponibilidad_prestadores
  │                    │
  │                    └───< (N) zonas_cobertura
  │
  ├───< (N) solicitudes_servicio >─── (N) servicios
  │                    │
  │                    ├───< (N) cotizaciones
  │                    │
  │                    ├───< (1) trabajos
  │                    │
  │                    └───< (N) conversaciones
  │
  ├───< (N) trabajos >───< (N) calificaciones
  │
  ├───< (N) conversaciones >───< (N) mensajes
  │
  ├───< (N) notificaciones
  │
  ├───< (N) reportes
  │
  └───< (N) referidos
```

### Relaciones Detalladas

- **users → prestadores**: 1 a 1 (un usuario puede ser un prestador)
- **users → solicitudes_servicio**: 1 a N (un usuario puede tener múltiples solicitudes)
- **prestadores → prestador_servicios**: 1 a N
- **servicios → prestador_servicios**: 1 a N
- **solicitudes_servicio → cotizaciones**: 1 a N
- **cotizaciones → trabajos**: 1 a 1 (una cotización aceptada genera un trabajo)
- **trabajos → calificaciones**: 1 a N (múltiples calificaciones por trabajo)
- **trabajos → pagos**: 1 a N (puede haber múltiples pagos por trabajo)
- **conversaciones → mensajes**: 1 a N

---

## Índices

### Índices de Búsqueda

- `idx_usuarios_email` - Búsqueda por email
- `idx_solicitudes_cliente_estado_created` - Solicitudes por cliente, estado y fecha
- `idx_solicitudes_ubicacion` - Búsqueda geográfica (latitud, longitud)
- `idx_trabajos_prestador_estado` - Trabajos por prestador y estado
- `idx_trabajos_cliente_estado` - Trabajos por cliente y estado
- `idx_calificaciones_calificado` - Calificaciones recibidas
- `idx_mensajes_conversacion_created` - Mensajes por conversación ordenados por fecha
- `idx_cotizaciones_solicitud_estado` - Cotizaciones por solicitud y estado
- `idx_prestador_servicios_prestador_servicio` - Búsqueda de servicios de prestadores
- `idx_prestadores_usuario` - Búsqueda de prestador por usuario
- `idx_pagos_trabajo` - Pagos por trabajo
- `idx_pagos_prestador_estado` - Pagos por prestador y estado
- `idx_favoritos_usuario` - Favoritos por usuario
- `idx_portfolio_prestador` - Portfolio por prestador
- `idx_portfolio_servicio` - Portfolio por servicio
- `idx_notificaciones_usuario_leida` - Notificaciones por usuario y estado de lectura
- `idx_conversaciones_participantes` - Conversaciones por participantes
- `idx_conversaciones_solicitud` - Conversaciones por solicitud

---

## Scripts de Replicación

### Script Completo de Creación

Este script incluye todo lo necesario para recrear la base de datos desde cero. Ejecuta los scripts en el orden indicado.

#### 1. Extensiones y Funciones Base

```sql
-- Habilitar extensión para UUIDs y password hashing
create extension if not exists "pgcrypto";

-- Función para actualizar updated_at automáticamente
create or replace function public.set_current_timestamp_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Función para hashear passwords automáticamente
create or replace function public.hash_user_password()
returns trigger as $$
begin
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.password is distinct from old.password) then
    new.password := crypt(new.password, gen_salt('bf'));
  end if;
  return new;
end;
$$ language plpgsql security definer;
```

#### 2. Crear Todos los ENUMs

```sql
-- tipo_usuario
do $$ begin
  if not exists (select 1 from pg_type where typname = 'tipo_usuario') then
    create type public.tipo_usuario as enum ('cliente', 'prestador', 'ambos');
  end if;
end $$;

-- urgencia
do $$ begin
  if not exists (select 1 from pg_type where typname = 'urgencia') then
    create type public.urgencia as enum ('baja', 'media', 'alta', 'emergencia');
  end if;
end $$;

-- estado_solicitud
do $$ begin
  if not exists (select 1 from pg_type where typname = 'estado_solicitud') then
    create type public.estado_solicitud as enum ('pendiente', 'cotizando', 'aceptada', 'en_progreso', 'completada', 'cancelada');
  end if;
end $$;

-- estado_cotizacion
do $$ begin
  if not exists (select 1 from pg_type where typname = 'estado_cotizacion') then
    create type public.estado_cotizacion as enum ('enviada', 'vista', 'aceptada', 'rechazada', 'expirada');
  end if;
end $$;

-- estado_trabajo
do $$ begin
  if not exists (select 1 from pg_type where typname = 'estado_trabajo') then
    create type public.estado_trabajo as enum ('programado', 'en_camino', 'en_progreso', 'pausado', 'completado', 'cancelado');
  end if;
end $$;

-- tipo_calificacion
do $$ begin
  if not exists (select 1 from pg_type where typname = 'tipo_calificacion') then
    create type public.tipo_calificacion as enum ('cliente_a_prestador', 'prestador_a_cliente');
  end if;
end $$;

-- tipo_mensaje
do $$ begin
  if not exists (select 1 from pg_type where typname = 'tipo_mensaje') then
    create type public.tipo_mensaje as enum ('texto', 'imagen', 'archivo', 'cotizacion', 'sistema');
  end if;
end $$;

-- metodo_pago
do $$ begin
  if not exists (select 1 from pg_type where typname = 'metodo_pago') then
    create type public.metodo_pago as enum ('efectivo', 'transferencia', 'tarjeta_debito', 'tarjeta_credito', 'mercadopago', 'otro');
  end if;
end $$;

-- estado_pago
do $$ begin
  if not exists (select 1 from pg_type where typname = 'estado_pago') then
    create type public.estado_pago as enum ('pendiente', 'procesando', 'completado', 'fallido', 'reembolsado');
  end if;
end $$;

-- tipo_zona
do $$ begin
  if not exists (select 1 from pg_type where typname = 'tipo_zona') then
    create type public.tipo_zona as enum ('barrio', 'localidad', 'zona', 'radio_km');
  end if;
end $$;

-- tipo_reporte
do $$ begin
  if not exists (select 1 from pg_type where typname = 'tipo_reporte') then
    create type public.tipo_reporte as enum ('fraude', 'mala_conducta', 'trabajo_incompleto', 'no_presentacion', 'acoso', 'otro');
  end if;
end $$;

-- estado_reporte
do $$ begin
  if not exists (select 1 from pg_type where typname = 'estado_reporte') then
    create type public.estado_reporte as enum ('pendiente', 'en_revision', 'resuelto', 'desestimado');
  end if;
end $$;

-- tipo_notificacion
do $$ begin
  if not exists (select 1 from pg_type where typname = 'tipo_notificacion') then
    create type public.tipo_notificacion as enum ('nueva_solicitud', 'nueva_cotizacion', 'trabajo_aceptado', 'mensaje', 'calificacion', 'pago', 'sistema');
  end if;
end $$;

-- tipo_cupon
do $$ begin
  if not exists (select 1 from pg_type where typname = 'tipo_cupon') then
    create type public.tipo_cupon as enum ('porcentaje', 'monto_fijo');
  end if;
end $$;

-- estado_referido
do $$ begin
  if not exists (select 1 from pg_type where typname = 'estado_referido') then
    create type public.estado_referido as enum ('pendiente', 'registrado', 'primer_trabajo', 'completado');
  end if;
end $$;

-- tipo_dato_config
do $$ begin
  if not exists (select 1 from pg_type where typname = 'tipo_dato_config') then
    create type public.tipo_dato_config as enum ('string', 'integer', 'boolean', 'json');
  end if;
end $$;
```

#### 3. Crear Tabla users

```sql
-- Tabla users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password text not null,
  nombre text not null,
  apellido text not null,
  telefono text not null,
  direccion text,
  latitud numeric(10,7),
  longitud numeric(10,7),
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
create trigger hash_password_before_write
before insert or update of password on public.users
for each row
execute function public.hash_user_password();

-- Trigger para updated_at
create trigger set_timestamp_users
before update on public.users
for each row
execute function public.set_current_timestamp_updated_at();

-- Habilitar RLS
alter table public.users enable row level security;

-- Políticas RLS
create policy "Users can read own data" on public.users
for select
using (auth.role() = 'authenticated' and auth.uid() = id);

create policy "Users can update own data" on public.users
for update
using (auth.role() = 'authenticated' and auth.uid() = id)
with check (auth.role() = 'authenticated' and auth.uid() = id);

create policy "Only authenticated users can insert" on public.users
for insert
with check (auth.role() = 'authenticated');

-- Crear view pública (sin password)
create or replace view public.users_public as
select
  id,
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
```

#### 4. Crear Tablas de Catálogo (categorias, servicios)

```sql
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
```

#### 5. Crear Tabla prestadores

```sql
-- Tabla prestadores
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
create trigger set_timestamp_prestadores
before update on public.prestadores
for each row
execute function public.set_current_timestamp_updated_at();
```

#### 6. Crear Tabla prestador_servicios

```sql
-- Tabla prestador_servicios
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
```

#### 7. Crear Tabla solicitudes_servicio

```sql
-- Tabla solicitudes_servicio
create table if not exists public.solicitudes_servicio (
  id bigint generated by default as identity primary key,
  cliente_id uuid not null references public.users(id) on delete restrict,
  servicio_id bigint not null references public.servicios(id) on delete restrict,
  descripcion_problema text,
  direccion text,
  latitud numeric(10,7),
  longitud numeric(10,7),
  fecha_preferida date,
  horario_preferido text,
  presupuesto_estimado numeric,
  urgencia public.urgencia not null default 'media',
  estado public.estado_solicitud not null default 'pendiente',
  fotos_urls text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger para updated_at
create trigger set_timestamp_solicitudes
before update on public.solicitudes_servicio
for each row
execute function public.set_current_timestamp_updated_at();
```

#### 8. Crear Tabla cotizaciones

```sql
-- Tabla cotizaciones
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
```

#### 9. Crear Tabla trabajos

```sql
-- Tabla trabajos
create table if not exists public.trabajos (
  id bigint generated by default as identity primary key,
  solicitud_id bigint not null references public.solicitudes_servicio(id) on delete restrict,
  cotizacion_id bigint references public.cotizaciones(id) on delete set null,
  prestador_id bigint not null references public.prestadores(id) on delete restrict,
  cliente_id uuid not null references public.users(id) on delete restrict,
  fecha_inicio timestamptz,
  fecha_fin timestamptz,
  fecha_programada timestamptz,
  estado public.estado_trabajo not null default 'programado',
  monto_final numeric,
  notas_prestador text,
  notas_cliente text,
  fotos_antes text[],
  fotos_durante text[],
  fotos_despues text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger para updated_at
create trigger set_timestamp_trabajos
before update on public.trabajos
for each row
execute function public.set_current_timestamp_updated_at();
```

#### 10. Crear Tabla calificaciones

```sql
-- Tabla calificaciones
create table if not exists public.calificaciones (
  id bigint generated by default as identity primary key,
  trabajo_id bigint not null references public.trabajos(id) on delete restrict,
  calificador_id uuid not null references public.users(id) on delete restrict,
  calificado_id uuid not null references public.users(id) on delete restrict,
  tipo_calificacion public.tipo_calificacion not null,
  puntuacion integer not null check (puntuacion >= 1 and puntuacion <= 5),
  puntualidad integer check (puntualidad >= 1 and puntualidad <= 5),
  calidad_trabajo integer check (calidad_trabajo >= 1 and calidad_trabajo <= 5),
  limpieza integer check (limpieza >= 1 and limpieza <= 5),
  comunicacion integer check (comunicacion >= 1 and comunicacion <= 5),
  relacion_precio_calidad integer check (relacion_precio_calidad >= 1 and relacion_precio_calidad <= 5),
  comentario text,
  respuesta text,
  fecha_calificacion timestamptz not null default now(),
  verificado boolean not null default false
);
```

#### 11. Crear Tablas de Mensajería (conversaciones, mensajes)

```sql
-- Tabla conversaciones
create table if not exists public.conversaciones (
  id bigint generated by default as identity primary key,
  solicitud_id bigint references public.solicitudes_servicio(id) on delete set null,
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
alter table public.conversaciones
add constraint fk_ultimo_mensaje
foreign key (ultimo_mensaje_id) references public.mensajes(id) on delete set null;
```

#### 12. Crear Tabla pagos

```sql
-- Tabla pagos
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
create trigger set_timestamp_pagos
before update on public.pagos
for each row
execute function public.set_current_timestamp_updated_at();
```

#### 13. Crear Tablas de Disponibilidad y Cobertura

```sql
-- Tabla disponibilidad_prestadores
create table if not exists public.disponibilidad_prestadores (
  id bigint generated by default as identity primary key,
  prestador_id bigint not null references public.prestadores(id) on delete cascade,
  dia_semana integer not null check (dia_semana >= 0 and dia_semana <= 6),
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
  centro_latitud numeric(10,7),
  centro_longitud numeric(10,7),
  recargo_porcentaje numeric default 0
);
```

#### 14. Crear Tablas de Reportes y Notificaciones

```sql
-- Tabla reportes
create table if not exists public.reportes (
  id bigint generated by default as identity primary key,
  reportante_id uuid not null references public.users(id) on delete restrict,
  reportado_id uuid not null references public.users(id) on delete restrict,
  trabajo_id bigint references public.trabajos(id) on delete set null,
  tipo public.tipo_reporte not null,
  descripcion text not null,
  evidencias_urls text[],
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
```

#### 15. Crear Tablas de Perfil (favoritos, certificaciones, portfolio)

```sql
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
  fotos_urls text[],
  fecha_trabajo date,
  destacado boolean not null default false,
  created_at timestamptz not null default now()
);
```

#### 16. Crear Tablas de Marketing (cupones, referidos, config)

```sql
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
  usuario_especifico_id uuid references public.users(id) on delete set null,
  valido_desde timestamptz not null,
  valido_hasta timestamptz not null,
  activo boolean not null default true,
  servicios_aplicables bigint[],
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
create trigger set_timestamp_config
before update on public.configuracion_sistema
for each row
execute function public.set_current_timestamp_updated_at();
```

#### 17. Crear Todos los Índices

```sql
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
```

---

## Datos Iniciales

### Insertar Categorías

```sql
-- Insertar todas las categorías
insert into public.categorias (id, nombre) values
  (1, 'Construcción y Albañilería'),
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
  (23, 'Otros Servicios')
on conflict (id) do nothing;
```

### Insertar Servicios

```sql
-- Insertar todos los servicios
insert into public.servicios (nombre, categoria_id) values
-- Construcción y Albañilería (1)
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
('Profesor particular (matemática, física, etc.)', 20),
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
('Lustrador de calzado', 23);
```

---

## Script SQL Completo (Todo en uno)

Para facilitar la replicación, puedes ejecutar todos los scripts anteriores en orden, o usar el script completo que incluye todo lo necesario (disponible en el repositorio como `database_schema.sql`).

### Orden de Ejecución Recomendado

1. Extensiones y funciones base
2. Crear todos los ENUMs
3. Crear tabla `users` con RLS y view
4. Crear tablas de catálogo (`categorias`, `servicios`)
5. Crear tabla `prestadores`
6. Crear tabla `prestador_servicios`
7. Crear tabla `solicitudes_servicio`
8. Crear tabla `cotizaciones`
9. Crear tabla `trabajos`
10. Crear tabla `calificaciones`
11. Crear tablas de mensajería (`conversaciones`, `mensajes`)
12. Crear tabla `pagos`
13. Crear tablas de disponibilidad y cobertura
14. Crear tablas de reportes y notificaciones
15. Crear tablas de perfil
16. Crear tablas de marketing
17. Crear todos los índices
18. Insertar datos iniciales (categorías y servicios)

---

## Notas Importantes

### Seguridad

- **RLS (Row Level Security)**: La tabla `users` tiene RLS habilitado. Asegúrate de configurar las políticas según tus necesidades de seguridad.
- **Passwords**: Los passwords se hashean automáticamente usando bcrypt mediante el trigger `hash_user_password`.
- **View pública**: Usa `users_public` en lugar de `users` para consultas que no requieren el password.

### Mantenimiento

- **Triggers de updated_at**: Varias tablas tienen triggers que actualizan automáticamente el campo `updated_at`. Asegúrate de mantener la función `set_current_timestamp_updated_at()`.
- **Índices**: Los índices están optimizados para las consultas más comunes. Revisa y ajusta según tus necesidades específicas.

### Migraciones

Para cambios futuros en el esquema, se recomienda usar migraciones versionadas (como las que usa Supabase) en lugar de modificar directamente las tablas en producción.

---

---

## Storage Buckets y Políticas

### Buckets Configurados

La aplicación utiliza 4 buckets de Storage para gestionar archivos:

#### 1. avatars (Público)
- **Propósito**: Fotos de perfil de usuarios
- **Público**: Sí
- **Tamaño máximo**: 2MB
- **Tipos permitidos**: image/jpeg, image/png, image/webp
- **Estructura**: `{user_id}/avatar.{ext}`

**Políticas**:
- ✅ Cualquiera puede VER las imágenes
- ✅ Solo el usuario autenticado puede SUBIR/ACTUALIZAR/ELIMINAR su propio avatar

#### 2. portfolios (Público)
- **Propósito**: Fotos de trabajos realizados por técnicos
- **Público**: Sí
- **Tamaño máximo**: 5MB
- **Tipos permitidos**: image/jpeg, image/png, image/webp
- **Estructura**: `{user_id}/{timestamp}_{filename}.{ext}`

**Políticas**:
- ✅ Cualquiera puede VER las imágenes
- ✅ Solo el técnico autenticado puede SUBIR/ACTUALIZAR/ELIMINAR sus imágenes

#### 3. certificados (Privado)
- **Propósito**: Certificados, matrículas y documentación
- **Público**: No
- **Tamaño máximo**: 10MB
- **Tipos permitidos**: image/jpeg, image/png, application/pdf
- **Estructura**: `{user_id}/certificados/{filename}.{ext}`

**Políticas**:
- ✅ Solo el técnico puede VER sus propios certificados
- ✅ Solo el técnico puede SUBIR/ACTUALIZAR/ELIMINAR sus certificados
- ℹ️ Los administradores pueden ver todos usando service_role (bypass RLS)

#### 4. servicios (Público)
- **Propósito**: Imágenes de categorías de servicios (uso interno/admin)
- **Público**: Sí
- **Tamaño máximo**: 1MB
- **Tipos permitidos**: image/jpeg, image/png, image/webp, image/svg+xml
- **Estructura**: `categorias/{categoria_nombre}.{ext}`

**Políticas**:
- ✅ Todos pueden VER las imágenes
- ✅ Solo usuarios autenticados pueden SUBIR/ACTUALIZAR/ELIMINAR (actualmente, ajustar según sistema de roles)

### Ejemplos de Uso

#### Subir Avatar de Usuario

```typescript
const userId = (await supabase.auth.getUser()).data.user?.id;

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file, {
    cacheControl: '3600',
    upsert: true
  });

// Obtener URL pública
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.jpg`);
```

#### Subir Imágenes al Portfolio

```typescript
const userId = (await supabase.auth.getUser()).data.user?.id;
const timestamp = Date.now();

const { data, error } = await supabase.storage
  .from('portfolios')
  .upload(`${userId}/${timestamp}_${filename}`, file, {
    cacheControl: '3600'
  });
```

#### Subir Certificado (Privado)

```typescript
const userId = (await supabase.auth.getUser()).data.user?.id;

const { data, error } = await supabase.storage
  .from('certificados')
  .upload(`${userId}/certificados/matricula.pdf`, file, {
    cacheControl: '3600'
  });

// Para obtener URL firmada (necesaria para buckets privados)
const { data: { signedUrl } } = await supabase.storage
  .from('certificados')
  .createSignedUrl(`${userId}/certificados/matricula.pdf`, 3600);
```

### Notas de Seguridad

- Los buckets públicos (avatars, portfolios, servicios) son accesibles sin autenticación para lectura
- El bucket certificados es privado y requiere autenticación
- Las políticas RLS garantizan que los usuarios solo puedan modificar sus propios archivos
- Para operaciones administrativas, usa el service_role key que bypass RLS

---

## Versión

**Versión del esquema**: 1.0.0  
**Última actualización**: Diciembre 2025  
**Total de tablas**: 22  
**Total de ENUMs**: 15  
**Total de índices**: 18  
**Total de Storage Buckets**: 4

---

## Contacto y Soporte

Para preguntas sobre el esquema de la base de datos, consulta la documentación del proyecto o contacta al equipo de desarrollo.

