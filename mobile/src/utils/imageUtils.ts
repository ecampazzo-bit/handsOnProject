import { supabase } from "../services/supabaseClient";

/**
 * Obtiene una URL válida para una imagen del bucket de solicitudes
 * Como el bucket es público, primero intenta usar la URL pública directamente
 * Solo usa URL firmada si la pública falla
 */
export const getImageUrl = async (url: string): Promise<string | null> => {
  try {
    if (!url || typeof url !== "string") {
      return null;
    }

    // Si es una URL pública válida, retornarla directamente primero
    // El bucket "solicitudes" está configurado como público, así que las URLs públicas deberían funcionar
    if (url.startsWith("http://") || url.startsWith("https://")) {
      // Si es una URL pública de Supabase Storage para el bucket "solicitudes",
      // intentar usarla directamente primero (el bucket es público)
      if (url.includes("supabase.co/storage/v1/object/public/solicitudes/")) {
        console.log(
          `📷 Usando URL pública directamente: ${url.substring(0, 100)}...`
        );
        return url;
      }

      // Para otras URLs públicas, retornarlas directamente
      return url;
    }

    return null;
  } catch (error) {
    console.error("Error al obtener URL de imagen:", error);
    // En caso de error, retornar la URL original si es válida
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      return url;
    }
    return null;
  }
};

/**
 * Verifica si una URL de imagen es válida
 */
export const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://");
};
