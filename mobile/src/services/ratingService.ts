import { supabase } from './supabaseClient';

export interface Calificacion {
  id: number;
  trabajo_id: number;
  calificador_id: string;
  calificado_id: string;
  tipo_calificacion: 'cliente_a_prestador' | 'prestador_a_cliente';
  puntuacion: number;
  puntualidad: number | null;
  calidad_trabajo: number | null;
  limpieza: number | null;
  comunicacion: number | null;
  relacion_precio_calidad: number | null;
  comentario: string | null;
  respuesta: string | null;
  fecha_calificacion: string;
  verificado: boolean;
  calificador?: {
    id: string;
    nombre: string;
    apellido: string;
    foto_perfil_url: string | null;
  };
  trabajo?: {
    id: number;
    estado: string;
  };
}

export interface CreateCalificacionParams {
  trabajoId: number;
  calificadoId: string;
  tipoCalificacion: 'cliente_a_prestador' | 'prestador_a_cliente';
  puntuacion: number;
  comentario?: string;
  detalles?: {
    puntualidad?: number;
    calidadTrabajo?: number;
    limpieza?: number;
    comunicacion?: number;
    relacionPrecioCalidad?: number;
  };
}

/**
 * Crea una nueva calificación
 */
export const createCalificacion = async (
  params: CreateCalificacionParams
): Promise<{ data: Calificacion | null; error: { message: string } | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        error: { message: 'Usuario no autenticado' },
      };
    }

    // Insertar directamente en la tabla calificaciones
    const { data: result, error } = await supabase
      .from('calificaciones')
      .insert({
        trabajo_id: params.trabajoId,
        calificador_id: user.id,
        calificado_id: params.calificadoId,
        tipo_calificacion: params.tipoCalificacion,
        puntuacion: params.puntuacion,
        comentario: params.comentario || null,
        puntualidad: params.detalles?.puntualidad || null,
        calidad_trabajo: params.detalles?.calidadTrabajo || null,
        limpieza: params.detalles?.limpieza || null,
        comunicacion: params.detalles?.comunicacion || null,
        relacion_precio_calidad: params.detalles?.relacionPrecioCalidad || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear calificación:', error);
      return { data: null, error };
    }

    // Actualizar el promedio y cantidad de calificaciones del usuario calificado
    try {
      // Obtener todas las calificaciones del usuario calificado
      const { data: todasCalificaciones, error: califError } = await supabase
        .from('calificaciones')
        .select('puntuacion')
        .eq('calificado_id', params.calificadoId);

      if (!califError && todasCalificaciones && todasCalificaciones.length > 0) {
        // Calcular el promedio
        const suma = todasCalificaciones.reduce((acc, cal) => acc + cal.puntuacion, 0);
        const promedio = Math.round((suma / todasCalificaciones.length) * 100) / 100; // Redondear a 2 decimales
        const cantidad = todasCalificaciones.length;

        // Intentar actualizar usando la función RPC (recomendado)
        const { error: rpcError } = await supabase.rpc('actualizar_calificacion_usuario', {
          p_usuario_id: params.calificadoId,
          p_promedio: promedio,
          p_cantidad: cantidad,
        });

        if (rpcError) {
          console.warn('No se pudo actualizar el promedio mediante RPC (la función puede no existir aún):', rpcError);
          // Intentar actualizar directamente como fallback (probablemente fallará por RLS)
          const { error: updateError } = await supabase
            .from('users')
            .update({
              calificacion_promedio: promedio,
              cantidad_calificaciones: cantidad,
            })
            .eq('id', params.calificadoId);

          if (updateError) {
            console.warn('No se pudo actualizar el promedio de calificaciones:', updateError);
            console.warn('Por favor, ejecuta el archivo actualizar_calificacion_usuario.sql en Supabase para habilitar esta funcionalidad.');
          } else {
            console.log('Promedio de calificaciones actualizado correctamente');
          }
        } else {
          console.log('Promedio de calificaciones actualizado correctamente mediante RPC');
        }
      }
    } catch (updateError) {
      console.warn('Error al actualizar promedio de calificaciones:', updateError);
      // Continuar de todas formas, la calificación ya se creó exitosamente
    }

    return { data: result as Calificacion, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
    };
  }
};

/**
 * Obtiene todas las calificaciones de un usuario
 */
export const getCalificacionesByUser = async (
  userId: string
): Promise<{ data: Calificacion[] | null; error: { message: string } | null }> => {
  try {
    const { data, error } = await supabase
      .from('calificaciones')
      .select(`
        *,
        calificador:users!calificaciones_calificador_id_fkey(
          id,
          nombre,
          apellido,
          foto_perfil_url
        ),
        trabajo:trabajos(id, estado)
      `)
      .eq('calificado_id', userId)
      .order('fecha_calificacion', { ascending: false });

    if (error) {
      console.error('Error al obtener calificaciones:', error);
      return { data: null, error };
    }

    return { data: data as Calificacion[], error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
    };
  }
};

/**
 * Obtiene las calificaciones de un trabajo específico
 */
export const getCalificacionesByTrabajo = async (
  trabajoId: number
): Promise<{ data: Calificacion[] | null; error: { message: string } | null }> => {
  try {
    const { data, error } = await supabase
      .from('calificaciones')
      .select(`
        *,
        calificador:users!calificaciones_calificador_id_fkey(
          id,
          nombre,
          apellido,
          foto_perfil_url
        )
      `)
      .eq('trabajo_id', trabajoId)
      .order('fecha_calificacion', { ascending: false });

    if (error) {
      console.error('Error al obtener calificaciones del trabajo:', error);
      return { data: null, error };
    }

    return { data: data as Calificacion[], error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
    };
  }
};

/**
 * Responde a una calificación
 */
export const respondToCalificacion = async (
  calificacionId: number,
  respuesta: string
): Promise<{ error: { message: string } | null }> => {
  try {
    // Primero verificar que el usuario es el calificado
    const { data: calificacion, error: fetchError } = await supabase
      .from('calificaciones')
      .select('calificado_id')
      .eq('id', calificacionId)
      .single();

    if (fetchError) {
      return { error: fetchError };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== calificacion.calificado_id) {
      return {
        error: { message: 'No autorizado para responder a esta calificación' },
      };
    }

    // Actualizar la respuesta
    const { error: updateError } = await supabase
      .from('calificaciones')
      .update({ respuesta })
      .eq('id', calificacionId)
      .eq('calificado_id', user.id);

    if (updateError) {
      return { error: updateError };
    }

    return { error: null };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
    };
  }
};

/**
 * Obtiene el promedio de calificaciones de un usuario
 */
export const getUserRatingAverage = async (
  userId: string
): Promise<{ promedio: number; cantidad: number } | null> => {
  try {
    const { data, error } = await supabase
      .from('users_public')
      .select('calificacion_promedio, cantidad_calificaciones')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      promedio: data.calificacion_promedio || 0,
      cantidad: data.cantidad_calificaciones || 0,
    };
  } catch (error) {
    console.error('Error al obtener promedio de calificaciones:', error);
    return null;
  }
};

