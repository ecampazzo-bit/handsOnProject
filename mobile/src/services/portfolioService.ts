import { supabase } from './supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export interface PortfolioItem {
  id: number;
  prestador_id: number;
  servicio_id: number;
  titulo: string;
  descripcion: string | null;
  fotos_urls: string[] | null;
  fecha_trabajo: string | null;
  destacado: boolean;
  created_at: string;
  servicio?: {
    id: number;
    nombre: string;
    categoria_id: number;
  };
}

export interface CreatePortfolioItemParams {
  prestadorId: number;
  servicioId: number;
  titulo: string;
  descripcion?: string;
  fotosUrls?: string[];
  fechaTrabajo?: string;
  destacado?: boolean;
}

export interface UpdatePortfolioItemParams extends CreatePortfolioItemParams {
  portfolioId: number;
}

/**
 * Convierte una URI de imagen a ArrayBuffer para React Native
 */
const uriToArrayBuffer = async (
  uri: string,
  maxRetries: number = Platform.OS === "android" ? 5 : 3
): Promise<ArrayBuffer> => {
  const tryRead = async (attempt: number): Promise<ArrayBuffer> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error(`El archivo no existe: ${uri}`);
      }

      // Si el archivo está vacío, reintentar
      if (fileInfo.size === 0 && attempt < maxRetries) {
        const waitMs = Platform.OS === "android" ? 800 : 500;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        return tryRead(attempt + 1);
      }

      if (fileInfo.size === 0) {
        throw new Error(
          `El archivo está vacío (0 bytes) después de ${maxRetries} intentos`
        );
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64" as any,
      });

      if (!base64 || base64.length === 0) {
        if (attempt < maxRetries) {
          const waitMs = Platform.OS === "android" ? 800 : 500;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          return tryRead(attempt + 1);
        }
        throw new Error(
          `El archivo está vacío o no se pudo leer después de ${maxRetries} intentos`
        );
      }

      // Convertir base64 a ArrayBuffer
      const binaryString =
        typeof atob !== "undefined"
          ? atob(base64)
          : (() => {
              const chars =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
              let output = "";
              let i = 0;
              const cleanBase64 = base64.replace(/[^A-Za-z0-9\+\/\=]/g, "");
              while (i < cleanBase64.length) {
                const enc1 = chars.indexOf(cleanBase64.charAt(i++));
                const enc2 = chars.indexOf(cleanBase64.charAt(i++));
                const enc3 = chars.indexOf(cleanBase64.charAt(i++));
                const enc4 = chars.indexOf(cleanBase64.charAt(i++));
                const chr1 = (enc1 << 2) | (enc2 >> 4);
                const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                const chr3 = ((enc3 & 3) << 6) | enc4;
                output += String.fromCharCode(chr1);
                if (enc3 !== 64) output += String.fromCharCode(chr2);
                if (enc4 !== 64) output += String.fromCharCode(chr3);
              }
              return output;
            })();

      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return bytes.buffer;
    } catch (error) {
      if (attempt < maxRetries) {
        const waitMs = Platform.OS === "android" ? 800 : 500;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        return tryRead(attempt + 1);
      }
      throw error;
    }
  };

  return tryRead(1);
};

/**
 * Sube múltiples fotos al portfolio
 */
export const uploadPortfolioPhotos = async (
  userId: string,
  imageUris: string[]
): Promise<string[]> => {
  const uploadedUrls: string[] = [];
  const timestamp = Date.now();

  for (let i = 0; i < imageUris.length; i++) {
    try {
      const uri = imageUris[i];
      
      // Determinar extensión
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/${timestamp}_${i}.${fileExt}`;

      // Convertir URI a ArrayBuffer
      const arrayBuffer = await uriToArrayBuffer(uri);

      // Subir a Storage usando el ArrayBuffer
      const { data, error } = await supabase.storage
        .from('portfolios')
        .upload(fileName, arrayBuffer, {
          cacheControl: '3600',
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: false,
        });

      if (error) {
        console.error(`Error al subir foto ${i + 1}:`, error);
        continue;
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('portfolios')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    } catch (error) {
      console.error(`Error procesando foto ${i + 1}:`, error);
      // Continuar con la siguiente foto
    }
  }

  return uploadedUrls;
};

/**
 * Crea un nuevo item del portfolio
 */
export const createPortfolioItem = async (
  params: CreatePortfolioItemParams
): Promise<{ data: PortfolioItem | null; error: { message: string } | null }> => {
  try {
    console.log('Creando portfolio item con parámetros:', {
      prestadorId: params.prestadorId,
      servicioId: params.servicioId,
      titulo: params.titulo,
      fotosUrls: params.fotosUrls?.length || 0,
    });

    // Intentar primero con la función RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc('upsert_portfolio_item', {
      p_portfolio_id: null,
      p_prestador_id: params.prestadorId,
      p_servicio_id: params.servicioId,
      p_titulo: params.titulo,
      p_descripcion: params.descripcion || null,
      p_fotos_urls: params.fotosUrls || null,
      p_fecha_trabajo: params.fechaTrabajo || null,
      p_destacado: params.destacado || false,
    });

    if (rpcError) {
      console.warn('Error con función RPC, intentando inserción directa:', rpcError);
      
      // Si la función RPC falla, intentar inserción directa
      const { data: insertData, error: insertError } = await supabase
        .from('portfolio')
        .insert({
          prestador_id: params.prestadorId,
          servicio_id: params.servicioId,
          titulo: params.titulo,
          descripcion: params.descripcion || null,
          fotos_urls: params.fotosUrls || null,
          fecha_trabajo: params.fechaTrabajo || null,
          destacado: params.destacado || false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error al crear portfolio item (inserción directa):', insertError);
        return { 
          data: null, 
          error: {
            message: insertError.message || 'Error al crear el item del portfolio',
          }
        };
      }

      console.log('Portfolio item creado exitosamente (inserción directa):', insertData.id);
      return { data: insertData as PortfolioItem, error: null };
    }

    // La función RPC retorna un jsonb, necesitamos parsearlo
    let portfolioItem: PortfolioItem;
    if (typeof rpcResult === 'string') {
      portfolioItem = JSON.parse(rpcResult) as PortfolioItem;
    } else if (rpcResult && typeof rpcResult === 'object') {
      portfolioItem = rpcResult as PortfolioItem;
    } else {
      throw new Error('Formato de respuesta inesperado de la función RPC');
    }

    console.log('Portfolio item creado exitosamente (RPC):', portfolioItem.id);
    return { data: portfolioItem, error: null };
  } catch (error) {
    console.error('Error inesperado al crear portfolio item:', error);
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Error desconocido al crear el portfolio',
      },
    };
  }
};

/**
 * Actualiza un item del portfolio existente
 */
export const updatePortfolioItem = async (
  params: UpdatePortfolioItemParams
): Promise<{ data: PortfolioItem | null; error: { message: string } | null }> => {
  try {
    const { data: result, error } = await supabase.rpc('upsert_portfolio_item', {
      p_portfolio_id: params.portfolioId,
      p_prestador_id: params.prestadorId,
      p_servicio_id: params.servicioId,
      p_titulo: params.titulo,
      p_descripcion: params.descripcion || null,
      p_fotos_urls: params.fotosUrls || null,
      p_fecha_trabajo: params.fechaTrabajo || null,
      p_destacado: params.destacado || false,
    });

    if (error) {
      console.error('Error al actualizar portfolio item:', error);
      return { data: null, error };
    }

    return { data: result as PortfolioItem, error: null };
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
 * Obtiene todos los items del portfolio de un prestador
 */
export const getPortfolioByPrestador = async (
  prestadorId: number
): Promise<{ data: PortfolioItem[] | null; error: { message: string } | null }> => {
  try {
    const { data, error } = await supabase
      .from('portfolio')
      .select(`
        *,
        servicio:servicios(id, nombre, categoria_id)
      `)
      .eq('prestador_id', prestadorId)
      .order('destacado', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener portfolio:', error);
      return { data: null, error };
    }

    return { data: data as PortfolioItem[], error: null };
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
 * Obtiene un item específico del portfolio
 */
export const getPortfolioItem = async (
  portfolioId: number
): Promise<{ data: PortfolioItem | null; error: { message: string } | null }> => {
  try {
    const { data, error } = await supabase
      .from('portfolio')
      .select(`
        *,
        servicio:servicios(id, nombre, categoria_id)
      `)
      .eq('id', portfolioId)
      .single();

    if (error) {
      console.error('Error al obtener portfolio item:', error);
      return { data: null, error };
    }

    return { data: data as PortfolioItem, error: null };
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
 * Elimina un item del portfolio
 */
export const deletePortfolioItem = async (
  portfolioId: number,
  prestadorId: number
): Promise<{ error: { message: string } | null }> => {
  try {
    // Primero obtener las URLs de las fotos para eliminarlas del storage
    const { data: item, error: fetchError } = await supabase
      .from('portfolio')
      .select('fotos_urls')
      .eq('id', portfolioId)
      .eq('prestador_id', prestadorId)
      .single();

    if (fetchError) {
      return { error: fetchError };
    }

    // Eliminar fotos del storage si existen
    if (item?.fotos_urls && item.fotos_urls.length > 0) {
      // Extraer nombres de archivo de las URLs
      const filePaths = item.fotos_urls
        .map(url => {
          const match = url.match(/portfolios\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter((path): path is string => path !== null);

      if (filePaths.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from('portfolios')
          .remove(filePaths);

        if (deleteError) {
          console.warn('Error al eliminar fotos del storage:', deleteError);
          // Continuar de todas formas para eliminar el registro
        }
      }
    }

    // Eliminar el registro de la base de datos
    const { error: deleteError } = await supabase
      .from('portfolio')
      .delete()
      .eq('id', portfolioId)
      .eq('prestador_id', prestadorId);

    if (deleteError) {
      return { error: deleteError };
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
 * Selecciona múltiples imágenes de la galería
 */
export const pickMultipleImages = async (): Promise<string[]> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('No se otorgaron permisos para acceder a la galería');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.8,
    selectionLimit: 10, // Máximo 10 fotos
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map(asset => asset.uri);
};

