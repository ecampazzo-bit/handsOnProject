import { supabase } from './supabaseClient';
import * as ImagePicker from 'expo-image-picker';

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
 * Convierte una URI de imagen a Blob para subir
 */
const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
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
      const blob = await uriToBlob(uri);
      
      // Determinar extensión
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/${timestamp}_${i}.${fileExt}`;

      // Subir a Storage
      const { data, error } = await supabase.storage
        .from('portfolios')
        .upload(fileName, blob, {
          cacheControl: '3600',
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
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
    const { data: result, error } = await supabase.rpc('upsert_portfolio_item', {
      p_portfolio_id: null,
      p_prestador_id: params.prestadorId,
      p_servicio_id: params.servicioId,
      p_titulo: params.titulo,
      p_descripcion: params.descripcion || null,
      p_fotos_urls: params.fotosUrls || null,
      p_fecha_trabajo: params.fechaTrabajo || null,
      p_destacado: params.destacado || false,
    });

    if (error) {
      console.error('Error al crear portfolio item:', error);
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

