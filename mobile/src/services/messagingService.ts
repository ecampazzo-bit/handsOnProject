import { supabase } from './supabaseClient';

export interface Conversacion {
  id: number;
  solicitud_id: number | null;
  participante_1_id: string;
  participante_2_id: string;
  ultimo_mensaje_id: number | null;
  ultimo_mensaje_fecha: string | null;
  created_at: string;
  participante_1?: {
    id: string;
    nombre: string;
    apellido: string;
    foto_perfil_url: string | null;
  };
  participante_2?: {
    id: string;
    nombre: string;
    apellido: string;
    foto_perfil_url: string | null;
  };
  ultimo_mensaje?: Mensaje;
}

export interface Mensaje {
  id: number;
  conversacion_id: number;
  remitente_id: string;
  contenido: string;
  tipo: 'texto' | 'imagen' | 'archivo' | 'cotizacion' | 'sistema';
  leido: boolean;
  fecha_lectura: string | null;
  created_at: string;
  remitente?: {
    id: string;
    nombre: string;
    apellido: string;
    foto_perfil_url: string | null;
  };
}

export interface SendMessageParams {
  conversacionId: number;
  contenido: string;
  tipo?: 'texto' | 'imagen' | 'archivo' | 'cotizacion' | 'sistema';
}

/**
 * Obtiene o crea una conversación entre dos usuarios
 */
export const getOrCreateConversation = async (
  participante1Id: string,
  participante2Id: string,
  solicitudId?: number
): Promise<{ data: Conversacion | null; error: { message: string } | null }> => {
  try {
    const { data: result, error } = await supabase.rpc('get_or_create_conversacion', {
      p_participante_1_id: participante1Id,
      p_participante_2_id: participante2Id,
      p_solicitud_id: solicitudId || null,
    });

    if (error) {
      console.error('Error al obtener/crear conversación:', error);
      return { data: null, error };
    }

    // Obtener datos completos de la conversación
    const { data: conversacion, error: fetchError } = await supabase
      .from('conversaciones')
      .select(`
        *,
        participante_1:users!conversaciones_participante_1_id_fkey(
          id,
          nombre,
          apellido,
          foto_perfil_url
        ),
        participante_2:users!conversaciones_participante_2_id_fkey(
          id,
          nombre,
          apellido,
          foto_perfil_url
        ),
        ultimo_mensaje:mensajes(*)
      `)
      .eq('id', result.id)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    return { data: conversacion as Conversacion, error: null };
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
 * Obtiene todas las conversaciones del usuario autenticado
 */
export const getConversations = async (): Promise<{
  data: Conversacion[] | null;
  error: { message: string } | null;
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        error: { message: 'Usuario no autenticado' },
      };
    }

    const { data, error } = await supabase
      .from('conversaciones')
      .select(`
        *,
        participante_1:users!conversaciones_participante_1_id_fkey(
          id,
          nombre,
          apellido,
          foto_perfil_url
        ),
        participante_2:users!conversaciones_participante_2_id_fkey(
          id,
          nombre,
          apellido,
          foto_perfil_url
        ),
        ultimo_mensaje:mensajes(*)
      `)
      .or(`participante_1_id.eq.${user.id},participante_2_id.eq.${user.id}`)
      .order('ultimo_mensaje_fecha', { ascending: false, nullsLast: true });

    if (error) {
      console.error('Error al obtener conversaciones:', error);
      return { data: null, error };
    }

    return { data: data as Conversacion[], error: null };
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
 * Envía un mensaje en una conversación
 */
export const sendMessage = async (
  params: SendMessageParams
): Promise<{ data: Mensaje | null; error: { message: string } | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        error: { message: 'Usuario no autenticado' },
      };
    }

    const { data: result, error } = await supabase.rpc('send_message', {
      p_conversacion_id: params.conversacionId,
      p_remitente_id: user.id,
      p_contenido: params.contenido,
      p_tipo: params.tipo || 'texto',
    });

    if (error) {
      console.error('Error al enviar mensaje:', error);
      return { data: null, error };
    }

    // Obtener datos completos del mensaje
    const { data: mensaje, error: fetchError } = await supabase
      .from('mensajes')
      .select(`
        *,
        remitente:users!mensajes_remitente_id_fkey(
          id,
          nombre,
          apellido,
          foto_perfil_url
        )
      `)
      .eq('id', result.id)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    return { data: mensaje as Mensaje, error: null };
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
 * Obtiene los mensajes de una conversación
 */
export const getMessages = async (
  conversacionId: number,
  limit: number = 50
): Promise<{ data: Mensaje[] | null; error: { message: string } | null }> => {
  try {
    const { data, error } = await supabase
      .from('mensajes')
      .select(`
        *,
        remitente:users!mensajes_remitente_id_fkey(
          id,
          nombre,
          apellido,
          foto_perfil_url
        )
      `)
      .eq('conversacion_id', conversacionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error al obtener mensajes:', error);
      return { data: null, error };
    }

    // Invertir para mostrar del más antiguo al más nuevo
    return { data: (data as Mensaje[]).reverse(), error: null };
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
 * Marca mensajes como leídos
 */
export const markMessagesAsRead = async (
  conversacionId: number
): Promise<{ error: { message: string } | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: { message: 'Usuario no autenticado' } };
    }

    // Marcar como leídos los mensajes que no son del usuario actual
    const { error } = await supabase
      .from('mensajes')
      .update({
        leido: true,
        fecha_lectura: new Date().toISOString(),
      })
      .eq('conversacion_id', conversacionId)
      .neq('remitente_id', user.id)
      .eq('leido', false);

    if (error) {
      console.error('Error al marcar mensajes como leídos:', error);
      return { error };
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
 * Obtiene el conteo de mensajes no leídos
 */
export const getUnreadMessagesCount = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return 0;
    }

    // Obtener conversaciones del usuario
    const { data: conversaciones } = await supabase
      .from('conversaciones')
      .select('id')
      .or(`participante_1_id.eq.${user.id},participante_2_id.eq.${user.id}`);

    if (!conversaciones || conversaciones.length === 0) {
      return 0;
    }

    const conversacionIds = conversaciones.map(c => c.id);

    // Contar mensajes no leídos (excluyendo los del usuario)
    const { count, error } = await supabase
      .from('mensajes')
      .select('*', { count: 'exact', head: true })
      .in('conversacion_id', conversacionIds)
      .neq('remitente_id', user.id)
      .eq('leido', false);

    if (error) {
      console.error('Error al contar mensajes no leídos:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error en getUnreadMessagesCount:', error);
    return 0;
  }
};

