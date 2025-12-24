# HandsOn Web

Aplicación web para HandsOn que incluye:
- **Landing Page**: Página principal de presentación de la aplicación
- **Dashboard de Administración**: Panel de control para gestionar la plataforma

## 🚀 Tecnologías

- **Next.js 14**: Framework React con SSR/SSG
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos utilitarios
- **Supabase**: Backend y autenticación

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn
- Proyecto de Supabase configurado

## ⚙️ Configuración

### 1. Instalar Dependencias

```bash
cd web
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz de `web/`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

**Importante**: Reemplaza los valores con tus credenciales de Supabase.

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: http://localhost:3000

## 📁 Estructura del Proyecto

```
web/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx        # Landing page
│   │   ├── layout.tsx      # Layout principal
│   │   └── admin/          # Dashboard de administración
│   │       ├── page.tsx    # Dashboard principal
│   │       └── layout.tsx  # Layout del admin
│   ├── components/          # Componentes reutilizables
│   │   ├── landing/        # Componentes de landing page
│   │   └── admin/          # Componentes del dashboard
│   ├── lib/                # Utilidades y configuraciones
│   │   └── supabase.ts     # Cliente de Supabase
│   └── types/              # Tipos TypeScript
├── public/                  # Archivos estáticos
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 🌐 Rutas

- `/` - Landing page
- `/admin` - Dashboard de administración
- `/admin/login` - Login de administrador

## 📦 Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia servidor de producción
- `npm run lint` - Ejecuta el linter

## 🔐 Autenticación

El dashboard de administración requiere autenticación. Se puede implementar usando:
- Supabase Auth para usuarios admin
- Middleware de Next.js para proteger rutas
- Roles y permisos en la base de datos

## 📝 Próximos Pasos

1. Configurar autenticación de administradores
2. Implementar landing page completa
3. Crear componentes del dashboard
4. Integrar con APIs de Supabase
5. Agregar gráficos y estadísticas

## 📄 Licencia

Este proyecto es privado.

