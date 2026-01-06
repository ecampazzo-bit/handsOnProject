import * as Yup from 'yup';

export const emailSchema = Yup.string()
  .email('Email inválido')
  .required('El email es requerido');

export const passwordSchema = Yup.string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres')
  .required('La contraseña es requerida');

export const strongPasswordSchema = Yup.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'La contraseña debe contener al menos una mayúscula, un número y un símbolo'
  )
  .required('La contraseña es requerida');

export const phoneSchema = Yup.string()
  .matches(
    /^(\+54|0)?9?(\d{2,4})?\s?(\d{6,8})$/,
    'Formato de teléfono inválido (ej: +54 9 11 12345678)'
  )
  .required('El teléfono es requerido');

export const loginSchema = Yup.object().shape({
  email: emailSchema,
  password: passwordSchema,
});

export interface RegisterStep1FormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  confirmPassword: string;
}

export const registerStep1Schema = Yup.object().shape({
  nombre: Yup.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .required('El nombre es requerido'),
  apellido: Yup.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .required('El apellido es requerido'),
  email: emailSchema,
  telefono: phoneSchema,
  password: strongPasswordSchema,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Las contraseñas deben coincidir')
    .required('Confirma tu contraseña'),
});

export interface RegisterStep2FormData {
  tipoUsuario: 'cliente' | 'prestador' | 'ambos';
}

export const registerStep2Schema = Yup.object().shape({
  tipoUsuario: Yup.string()
    .oneOf(['cliente', 'prestador', 'ambos'], 'Selecciona un tipo de usuario')
    .required('Selecciona un tipo de usuario'),
});

export interface RegisterStep3FormData {
  direccion: string;
  latitud?: number | null;
  longitud?: number | null;
}

export const registerStep3Schema = Yup.object().shape({
  direccion: Yup.string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .required('La dirección es requerida'),
  latitud: Yup.number()
    .required('La ubicación es requerida. Por favor, obtén tu ubicación.')
    .typeError('La ubicación es requerida'),
  longitud: Yup.number()
    .required('La ubicación es requerida. Por favor, obtén tu ubicación.')
    .typeError('La ubicación es requerida'),
});

export const formatArgentinePhone = (phone: string): string => {
  const cleaned = phone.replace(/[^\d+]/g, '');

  if (!cleaned.startsWith('+54')) {
    if (cleaned.startsWith('0')) {
      return '+54' + cleaned.substring(1);
    }
    if (cleaned.startsWith('9')) {
      return '+54' + cleaned;
    }
    return '+54' + cleaned;
  }

  return cleaned;
};




