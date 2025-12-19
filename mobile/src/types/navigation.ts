export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ServiceSelection: {
    userId: string;
  };
  Home: undefined;
};

export type RegisterFormData = {
  // Paso 1
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  confirmPassword: string;
  // Paso 2
  tipoUsuario: "cliente" | "prestador" | "ambos";
  // Paso 3 (solo para prestadores)
  direccion?: string;
  latitud?: number;
  longitud?: number;
};

export type User = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  tipo_usuario: "cliente" | "prestador" | "ambos";
  direccion?: string;
  latitud?: number;
  longitud?: number;
  foto_perfil_url?: string;
  verificado: boolean;
  activo: boolean;
  created_at: string;
};

export type Service = {
  id: string;
  name: string;
  category: string;
};
