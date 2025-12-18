import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/navigation';

const USER_SESSION_KEY = '@handson_user_session';

interface SignUpUserData {
  nombre: string;
  apellido: string;
  telefono: string;
  direccion?: string;
  latitud?: number | null;
  longitud?: number | null;
  tipoUsuario: 'cliente' | 'prestador' | 'ambos';
}

interface ServiceInput {
  nombre: string;
  categoria: string;
}

interface SignUpParams {
  email: string;
  password: string;
  userData: SignUpUserData;
}

export const signUp = async (
  params: SignUpParams | string,
  password?: string,
  userData?: SignUpUserData
): Promise<{ user: User | null; error: { message: string } | null }> => {
  try {
    // Manejar dos formas de llamar la función: objeto único o parámetros separados
    let email: string;
    let passwordParam: string;
    let userDataParam: SignUpUserData;

    if (typeof params === 'object' && params !== null && 'email' in params) {
      // Llamada con objeto único
      email = params.email;
      passwordParam = params.password;
      userDataParam = params.userData;
    } else if (typeof params === 'string') {
      // Llamada con parámetros separados (compatibilidad hacia atrás)
      email = params;
      passwordParam = password || '';
      userDataParam = userData || {} as SignUpUserData;
    } else {
      console.error('ERROR: Formato de parámetros inválido');
      return {
        user: null,
        error: { message: 'Formato de parámetros inválido' },
      };
    }

    // Logging extensivo para debugging
    console.log('=== signUp INICIO ===');
    console.log('Parámetros recibidos:');
    console.log('  email:', email, typeof email);
    console.log('  password:', passwordParam ? '***' : 'undefined', typeof passwordParam);
    console.log('  userData:', userDataParam, typeof userDataParam);
    console.log('  userData es null?', userDataParam === null);
    console.log('  userData es undefined?', userDataParam === undefined);
    
    // Validar que los parámetros sean del tipo correcto
    if (typeof email !== 'string' || !email) {
      console.error('ERROR: email inválido:', email);
      return {
        user: null,
        error: { message: 'Email inválido' },
      };
    }

    if (typeof passwordParam !== 'string' || !passwordParam) {
      console.error('ERROR: password inválido');
      return {
        user: null,
        error: { message: 'Password inválido' },
      };
    }

    // Validar que userData tenga todos los campos requeridos
    if (!userDataParam || typeof userDataParam !== 'object') {
      console.error('ERROR: userData es undefined, null o no es un objeto');
      console.error('userData recibido:', userDataParam);
      console.error('Tipo de userData:', typeof userDataParam);
      return {
        user: null,
        error: { message: 'Faltan datos requeridos del usuario: userData es inválido' },
      };
    }

    // Validar campos requeridos (incluyendo strings vacíos)
    const nombre = userDataParam.nombre?.trim();
    const apellido = userDataParam.apellido?.trim();
    const telefono = userDataParam.telefono?.trim();
    const tipoUsuario = userDataParam.tipoUsuario;

    if (!nombre || !apellido || !telefono || !tipoUsuario) {
      console.error('Datos faltantes o vacíos en userData:', {
        nombre: nombre || 'VACÍO',
        apellido: apellido || 'VACÍO',
        telefono: telefono || 'VACÍO',
        tipoUsuario: tipoUsuario || 'VACÍO',
        userDataCompleto: JSON.stringify(userDataParam, null, 2),
      });
      return {
        user: null,
        error: { 
          message: `Faltan datos requeridos del usuario. nombre="${nombre || 'VACÍO'}", apellido="${apellido || 'VACÍO'}", telefono="${telefono || 'VACÍO'}", tipoUsuario="${tipoUsuario || 'VACÍO'}"` 
        },
      };
    }

    console.log('=== signUp - Creando usuario en Supabase Auth ===');
    console.log('Email:', email);
    console.log('Password:', passwordParam ? '***' : 'undefined');
    console.log('Supabase URL:', supabase.supabaseUrl);
    
    let authData, authError;
    
    try {
      const result = await supabase.auth.signUp({
        email,
        password: passwordParam,
        options: {
          // Deshabilitar confirmación de email para desarrollo
          emailRedirectTo: undefined,
        },
      });
      
      authData = result.data;
      authError = result.error;
      
      console.log('Resultado de signUp:', {
        hasUser: !!authData?.user,
        hasSession: !!authData?.session,
        hasError: !!authError,
        errorMessage: authError?.message,
        errorCode: authError?.code,
        errorStatus: authError?.status,
        userId: authData?.user?.id,
        emailConfirmed: !!authData?.user?.email_confirmed_at,
      });
    } catch (networkError: any) {
      console.error('Error de red en signUp:', networkError);
      console.error('Tipo de error:', typeof networkError);
      console.error('Mensaje:', networkError?.message);
      console.error('Stack:', networkError?.stack);
      
      // Si es un error de red, proporcionar un mensaje más descriptivo
      if (networkError?.message?.includes('Network') || networkError?.message?.includes('network')) {
        return {
          user: null,
          error: {
            message: 'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.',
            code: 'NETWORK_ERROR',
          },
        };
      }
      
      return {
        user: null,
        error: {
          message: networkError?.message || 'Error de conexión. Por favor, intenta nuevamente.',
          code: networkError?.code || 'UNKNOWN_ERROR',
        },
      };
    }

    if (authError) {
      console.error('Error de autenticación:', authError);
      return { user: null, error: authError };
    }

    if (!authData.user) {
      return { user: null, error: { message: 'No se pudo crear el usuario' } };
    }

    // Asegurar que la sesión esté establecida antes de insertar
    if (authData.session) {
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(authData.session));
      // Establecer la sesión en el cliente de Supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession(authData.session);
      
      if (sessionError) {
        console.error('Error al establecer sesión:', sessionError);
        // No retornar error aquí, continuar de todas formas
        // La función insert_user_profile verificará si el usuario existe en auth.users
      } else {
        console.log('Sesión establecida:', {
          userId: authData.user.id,
          sessionUserId: sessionData?.user?.id,
        });
      }
      
      // Esperar y verificar que el usuario exista en auth.users antes de continuar
      let retries = 0;
      const maxRetries = 10;
      let userExistsInAuth = false;
      
      while (retries < maxRetries && !userExistsInAuth) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verificar que el usuario exista en auth.users
        const { data: { user: checkUser }, error: checkError } = await supabase.auth.getUser();
        if (checkUser && checkUser.id === authData.user.id) {
          userExistsInAuth = true;
          console.log(`Usuario verificado en auth.users después de ${retries + 1} intentos`);
          break;
        }
        
        retries++;
        console.log(`Intento ${retries}/${maxRetries} de verificar usuario en auth.users...`);
      }
      
      if (!userExistsInAuth) {
        console.warn('Advertencia: No se pudo verificar usuario en auth.users después de varios intentos');
        // Continuar de todas formas, la función insert_user_profile lo verificará
      }
    } else {
      // Si no hay sesión, esperar un momento de todas formas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Verificar que el usuario existe en auth.users antes de llamar a la función
    const { data: { user: verifyUser }, error: verifyError } = await supabase.auth.getUser();
    console.log('Verificación de usuario antes de insert_user_profile:', {
      hasUser: !!verifyUser,
      userId: verifyUser?.id,
      expectedUserId: authData.user.id,
      match: verifyUser?.id === authData.user.id,
      error: verifyError,
    });

    // Usar la función SECURITY DEFINER para insertar el usuario
    // Esto evita problemas de RLS durante el registro
    console.log('Llamando a insert_user_profile con:', {
      p_id: authData.user.id,
      p_email: email,
      p_password: passwordParam ? '***' : 'undefined',
      p_nombre: nombre,
      p_apellido: apellido,
      p_telefono: telefono,
      p_direccion: userDataParam.direccion || null,
      p_latitud: userDataParam.latitud || null,
      p_longitud: userDataParam.longitud || null,
      p_tipo_usuario: userDataParam.tipoUsuario,
    });
    
    const { data: userDataResult, error: userError } = await supabase.rpc(
      'insert_user_profile',
      {
        p_id: authData.user.id,
        p_email: email,
        p_password: passwordParam,
        p_nombre: nombre,
        p_apellido: apellido,
        p_telefono: telefono,
        p_direccion: userDataParam.direccion || null,
        p_latitud: userDataParam.latitud || null,
        p_longitud: userDataParam.longitud || null,
        p_tipo_usuario: userDataParam.tipoUsuario,
      }
    );
    
    console.log('Resultado de insert_user_profile:', {
      hasResult: !!userDataResult,
      hasError: !!userError,
      error: userError ? JSON.stringify(userError, null, 2) : null,
    });

    if (userError) {
      console.error('Error al insertar usuario:', userError);
      return { user: null, error: userError };
    }

    // La función retorna un jsonb, necesitamos convertirlo
    // Supabase RPC retorna el valor directamente, no en un objeto data
    const userData = userDataResult as any;

    if (!userData) {
      return { user: null, error: { message: 'No se recibieron datos del usuario' } };
    }

    // Crear registro en prestadores si el usuario es prestador o ambos
    // Usar función SECURITY DEFINER para evitar problemas de RLS durante el registro inicial
    if (userDataParam.tipoUsuario === 'prestador' || userDataParam.tipoUsuario === 'ambos') {
      console.log('Creando prestador para usuario:', authData.user.id);
      
      // Esperar un momento para asegurar que el usuario esté en la BD antes de crear el prestador
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Intentar crear el prestador con retry
      let prestadorCreated = false;
      let retries = 0;
      const maxRetries = 5;
      
      while (retries < maxRetries && !prestadorCreated) {
        const { data: prestadorResult, error: prestadorError } = await supabase.rpc(
          'insert_prestador',
          {
            p_usuario_id: authData.user.id,
            p_descripcion_profesional: null,
          }
        );

        if (prestadorError) {
          console.error(`Error al crear prestador (intento ${retries + 1}/${maxRetries}):`, prestadorError);
          retries++;
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } else {
          console.log('Prestador creado exitosamente:', prestadorResult);
          prestadorCreated = true;
        }
      }
      
      if (!prestadorCreated) {
        console.warn('No se pudo crear el prestador después de varios intentos, pero el usuario fue creado');
        // No retornar error aquí, el usuario ya fue creado
        // El prestador se puede crear más tarde cuando se guarden los servicios
      }
    }

    // La función ya retorna los datos sin password, así que podemos usarlos directamente
    return { user: userData as User, error: null };
  } catch (error) {
    return {
      user: null,
      error: { message: error instanceof Error ? error.message : 'Error desconocido' },
    };
  }
};

export const signIn = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: { message: string } | null }> => {
  try {
    console.log('=== signIn INICIO ===');
    console.log('Email:', email);
    console.log('Password recibido:', password ? '***' : 'undefined');
    console.log('Password length:', password?.length);
    
    // Limpiar email y password de espacios en blanco
    const cleanEmail = email?.trim();
    const cleanPassword = password?.trim();
    
    if (!cleanEmail || !cleanPassword) {
      return {
        user: null,
        error: { message: 'Email y contraseña son requeridos' },
      };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    console.log('Resultado de signInWithPassword:', {
      hasData: !!data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      userId: data?.user?.id,
      emailConfirmed: !!data?.user?.email_confirmed_at,
    });

    if (error) {
      console.error('Error completo en signIn:', JSON.stringify(error, null, 2));
      
      // Proporcionar mensajes de error más descriptivos
      let errorMessage = error.message || 'Credenciales inválidas';
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos. Por favor, verifica tus credenciales.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Por favor, confirma tu email antes de iniciar sesión.';
      }
      
      return { user: null, error: { ...error, message: errorMessage } };
    }

    if (data.session) {
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(data.session));
    }

    // Usar la vista users_public que excluye el campo password
    const { data: userData, error: userError } = await supabase
      .from('users_public')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      return { user: null, error: userError };
    }

    return { user: userData as User, error: null };
  } catch (error) {
    return {
      user: null,
      error: { message: error instanceof Error ? error.message : 'Error desconocido' },
    };
  }
};

export const signOut = async (): Promise<{ error: { message: string } | null }> => {
  try {
    await AsyncStorage.removeItem(USER_SESSION_KEY);
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return {
      error: { message: error instanceof Error ? error.message : 'Error desconocido' },
    };
  }
};

export const resendVerificationEmail = async (
  email: string
): Promise<{ error: { message: string } | null }> => {
  try {
    console.log('=== resendVerificationEmail INICIO ===');
    console.log('Email:', email);
    
    const cleanEmail = email?.trim();
    
    if (!cleanEmail) {
      return {
        error: { message: 'Email es requerido' },
      };
    }

    // Usar resend para reenviar el email de confirmación
    // Nota: Esto requiere que el usuario haya intentado registrarse primero
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: undefined, // No redirigir después de confirmar
      },
    });

    console.log('Resultado de resend:', {
      hasData: !!data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
    });

    if (error) {
      console.error('Error al reenviar email de verificación:', error);
      
      let errorMessage = error.message || 'No se pudo enviar el email de verificación';
      if (error.message?.includes('rate limit')) {
        errorMessage = 'Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.';
      } else if (error.message?.includes('already confirmed')) {
        errorMessage = 'Este email ya está confirmado.';
      }
      
      return { error: { ...error, message: errorMessage } };
    }

    console.log('Email de verificación enviado exitosamente');
    return { error: null };
  } catch (error) {
    console.error('Error inesperado en resendVerificationEmail:', error);
    return {
      error: { message: error instanceof Error ? error.message : 'Error desconocido' },
    };
  }
};

export const getCurrentUser = async (): Promise<{
  user: User | null;
  error: { message: string } | null;
}> => {
  try {
    // Verificar primero que haya una sesión activa
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { user: null, error: { message: 'No hay sesión activa' } };
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { user: null, error: authError || { message: 'Usuario no autenticado' } };
    }

    // Usar la vista users_public que excluye el campo password
    const { data: userData, error } = await supabase
      .from('users_public')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('Error al obtener usuario:', error);
      return { user: null, error };
    }

    return { user: userData as User, error: null };
  } catch (error) {
    console.error('Error en getCurrentUser:', error);
    return {
      user: null,
      error: { message: error instanceof Error ? error.message : 'Error desconocido' },
    };
  }
};

export const saveUserServices = async (
  userId: string,
  servicios: ServiceInput[]
): Promise<{ error: { message: string } | null }> => {
  try {
    console.log('=== saveUserServices INICIO ===');
    console.log('userId recibido:', userId);
    console.log('servicios recibidos:', servicios);
    
    // Verificar que el usuario existe en auth.users antes de llamar a la función
    const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser();
    console.log('Usuario autenticado:', {
      hasUser: !!authUser,
      userId: authUser?.id,
      requestedUserId: userId,
      match: authUser?.id === userId,
      error: authUserError,
    });

    // Verificar si el prestador existe, si no, crearlo
    const { data: prestador, error: prestadorError } = await supabase
      .from('prestadores')
      .select('id')
      .eq('usuario_id', userId)
      .single();

    console.log('Verificación de prestador:', {
      hasPrestador: !!prestador,
      prestadorId: prestador?.id,
      error: prestadorError,
    });

    // Si el prestador no existe, crearlo usando la función RPC
    if (prestadorError || !prestador) {
      console.log('Prestador no encontrado, creándolo...');
      const { data: prestadorResult, error: createPrestadorError } = await supabase.rpc(
        'insert_prestador',
        {
          p_usuario_id: userId,
          p_descripcion_profesional: null,
        }
      );

      if (createPrestadorError) {
        console.error('Error al crear prestador:', createPrestadorError);
        return { error: { message: 'No se pudo crear el prestador. Por favor, intenta nuevamente.' } };
      }

      console.log('Prestador creado exitosamente:', prestadorResult);
    }
    
    // Obtener todos los servicios para mapear nombres a IDs
    const { data: allServices, error: servicesError } = await supabase
      .from('servicios')
      .select('id, nombre, categoria_id');

    if (servicesError) {
      console.error('Error al obtener servicios:', servicesError);
      return { error: servicesError };
    }

    console.log('Servicios obtenidos de la BD:', allServices?.length);

    // Crear mapa de nombre de servicio a ID
    const serviceMap: Record<string, number> = {};
    allServices?.forEach((service) => {
      serviceMap[service.nombre] = service.id;
    });

    // Convertir servicios a formato para la función RPC
    const serviciosParaRPC = servicios
      .map((servicio) => {
        const servicioId = serviceMap[servicio.nombre];
        if (!servicioId) {
          console.warn(`Servicio no encontrado: ${servicio.nombre}`);
          return null;
        }
        return { servicio_id: servicioId };
      })
      .filter((s) => s !== null) as Array<{ servicio_id: number }>;

    if (serviciosParaRPC.length === 0) {
      return { error: { message: 'No se encontraron servicios válidos' } };
    }

    console.log('Servicios para guardar:', JSON.stringify(serviciosParaRPC, null, 2));
    console.log('Llamando a save_prestador_servicios con:', {
      p_usuario_id: userId,
      p_servicios_count: serviciosParaRPC.length,
    });

    // Usar la función SECURITY DEFINER para guardar servicios
    // Esto permite guardar servicios durante el registro inicial sin depender de auth.uid() estricto
    const { data: result, error: rpcError } = await supabase.rpc(
      'save_prestador_servicios',
      {
        p_usuario_id: userId,
        p_servicios: serviciosParaRPC,
      }
    );

    console.log('Resultado de save_prestador_servicios:', {
      hasResult: !!result,
      result: result,
      hasError: !!rpcError,
      error: rpcError,
    });

    if (rpcError) {
      console.error('Error completo al guardar servicios:', JSON.stringify(rpcError, null, 2));
      
      // Si el error es que no se encontró el prestador, intentar crearlo nuevamente
      if (rpcError.message?.includes('Prestador no encontrado')) {
        console.log('Intentando crear prestador nuevamente...');
        const { data: prestadorResult, error: createPrestadorError } = await supabase.rpc(
          'insert_prestador',
          {
            p_usuario_id: userId,
            p_descripcion_profesional: null,
          }
        );

        if (createPrestadorError) {
          return { error: { message: 'No se pudo crear el prestador. Por favor, intenta nuevamente.' } };
        }

        // Reintentar guardar servicios después de crear el prestador
        const { data: retryResult, error: retryError } = await supabase.rpc(
          'save_prestador_servicios',
          {
            p_usuario_id: userId,
            p_servicios: serviciosParaRPC,
          }
        );

        if (retryError) {
          return { error: retryError };
        }

        console.log('Servicios guardados exitosamente después de crear prestador:', retryResult);
        return { error: null };
      }
      
      return { error: rpcError };
    }

    console.log('Servicios guardados exitosamente:', result);
    return { error: null };
  } catch (error) {
    console.error('Error inesperado en saveUserServices:', error);
    return {
      error: { message: error instanceof Error ? error.message : 'Error desconocido' },
    };
  }
};




