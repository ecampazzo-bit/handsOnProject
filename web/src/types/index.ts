// Tipos compartidos para la aplicación web

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  tipo_usuario: 'cliente' | 'prestador' | 'ambos';
  created_at: string;
}

export interface Prestador {
  id: number;
  usuario_id: string;
  descripcion_profesional: string | null;
  años_experiencia: number | null;
  created_at: string;
}

export interface Servicio {
  id: number;
  nombre: string;
  categoria_id: number;
  created_at: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  url: string | null;
  created_at: string;
}

