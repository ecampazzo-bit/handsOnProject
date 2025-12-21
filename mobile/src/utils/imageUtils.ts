import { supabase } from "../services/supabaseClient";

/**
 * Obtiene una URL válida para una imagen del bucket de solicitudes
 * Intenta primero con URL pública, si falla usa URL firmada
 */
export const getImageUrl = async (url: string): Promise<string | null> => {
  try {
    if (!url || typeof url !== "string") {
      return null;
    }

    // Si la URL ya es una URL completa de Supabase Storage, intentar obtener URL firmada
    if (url.includes("supabase.co/storage/v1/object/public/solicitudes/")) {
      // Extraer la ruta del archivo desde la URL
      const urlParts = url.split("/solicitudes/");
      if (urlParts.length > 1) {
        let filePath = urlParts[1];

        // Limpiar cualquier parámetro de query o fragmento de la URL
        filePath = filePath.split("?")[0].split("#")[0];

        console.log(`Intentando obtener URL firmada para: ${filePath}`);
        console.log(`URL original completa: ${url}`);

        // Primero verificar que el archivo existe
        const pathParts = filePath.split("/");
        const fileName = pathParts[pathParts.length - 1];
        const folderPath = pathParts.slice(0, -1).join("/");

        console.log(`Verificando existencia del archivo: ${filePath}`);
        const { data: listData, error: listError } = await supabase.storage
          .from("solicitudes")
          .list(folderPath, { limit: 100 });

        if (listError) {
          console.error("Error al listar archivos:", listError);
        } else {
          const fileExists = listData?.some((f) => f.name === fileName);
          console.log(`¿Archivo existe? ${fileExists ? "Sí" : "No"}`);
          if (!fileExists) {
            console.error(
              `⚠️ El archivo ${fileName} no existe en ${folderPath}`
            );
            console.log(
              "Archivos disponibles en la carpeta:",
              listData?.map((f) => f.name)
            );
            return null;
          }
        }

        // Intentar obtener URL firmada (válida por 1 hora)
        const { data, error } = await supabase.storage
          .from("solicitudes")
          .createSignedUrl(filePath, 3600);

        if (!error && data?.signedUrl) {
          console.log(`✅ URL firmada obtenida exitosamente para: ${filePath}`);
          console.log(
            `URL firmada (primeros 100 chars): ${data.signedUrl.substring(
              0,
              100
            )}...`
          );
          return data.signedUrl;
        } else {
          console.error(
            `❌ Error al obtener URL firmada para ${filePath}:`,
            error
          );
          if (error) {
            console.error("Código de error:", error.message);
            console.error(
              "Detalles completos:",
              JSON.stringify(error, null, 2)
            );
          }

          // Retornar null para que se use la URL pública original
          return null;
        }
      }
    }

    // Si es una URL pública válida, retornarla directamente
    if (url.startsWith("http://") || url.startsWith("https://")) {
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
