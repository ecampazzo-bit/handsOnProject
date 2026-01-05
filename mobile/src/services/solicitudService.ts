import { supabase } from "./supabaseClient";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
// Usar la API legacy de expo-file-system porque readAsStringAsync de la API nueva está deprecado
// y lanza error en lugar de solo warning en Expo 54.
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { requestImagePermissions } from "./profileService";
import { createPortfolioItem } from "./portfolioService";

/**
 * Convierte una imagen a formato JPG compatible con React Native
 * Esto asegura que formatos como HEIC se conviertan a JPG
 *
 * IMPORTANTE: Especialmente para fotos de cámara, el archivo temporal
 * necesita tiempo para escribirse completamente en disco
 */
const convertToJPG = async (uri: string): Promise<string> => {
  try {
    console.log(`🔄 Convirtiendo imagen a JPG: ${uri.substring(0, 40)}...`);

    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [], // No aplicar transformaciones, solo convertir formato
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG, // Forzar formato JPEG
      }
    );

    const newUri = manipResult.uri;
    console.log(`✅ Convertido a JPG: ${newUri.substring(0, 40)}...`);

    // ⚠️ IMPORTANTE: Esperar un poco para que el archivo se escriba completamente
    // Esto es especialmente importante para fotos de cámara en React Native
    // Android necesita más tiempo que iOS para escribir archivos temporales
    const waitTime = Platform.OS === "android" ? 500 : 300;
    console.log(
      `⏳ Esperando ${waitTime}ms para que el archivo se escriba completamente...`
    );
    await new Promise((resolve) => setTimeout(resolve, waitTime));

    // Verificar que el archivo exista antes de continuar
    const fileInfo = await FileSystem.getInfoAsync(newUri);
    if (!fileInfo.exists) {
      console.warn(
        `⚠️ Archivo temporal no existe después de conversión: ${newUri}`
      );
      // Si el archivo no existe, intentar de nuevo con la URI original
      return uri;
    }

    console.log(`✅ Archivo JPG verificado: ${fileInfo.size} bytes`);

    return newUri;
  } catch (error) {
    console.error("❌ Error al convertir imagen a JPG:", error);
    // Si falla la conversión, devolver la URI original
    return uri;
  }
};

/**
 * Convierte una URI de imagen a ArrayBuffer para React Native
 * Usa expo-file-system para leer el archivo correctamente en React Native
 * Retorna ArrayBuffer que es compatible con supabase-js en React Native
 *
 * ⚠️ Reintentos internos para archivos recién creados (especialmente de cámara)
 * En Android usa más reintentos porque el sistema de archivos es más lento
 */
const uriToArrayBuffer = async (
  uri: string,
  maxRetries: number = Platform.OS === "android" ? 5 : 3
): Promise<ArrayBuffer> => {
  const tryRead = async (attempt: number): Promise<ArrayBuffer> => {
    try {
      console.log(
        `📤 Leyendo archivo (intento ${attempt}/${maxRetries}): ${uri.substring(
          0,
          40
        )}...`
      );

      // Obtener información del archivo
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists) {
        throw new Error(`El archivo no existe: ${uri}`);
      }

      console.log(`📁 Archivo encontrado: ${fileInfo.size} bytes`);

      // Si el archivo está vacío, esperar un poco y reintentar
      // Android necesita más tiempo entre reintentos
      if (fileInfo.size === 0 && attempt < maxRetries) {
        const waitMs = Platform.OS === "android" ? 800 : 500;
        console.warn(
          `⚠️ Archivo vacío (0 bytes), esperando ${waitMs}ms e intentando de nuevo...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        return tryRead(attempt + 1);
      }

      if (fileInfo.size === 0) {
        throw new Error(
          `El archivo está vacío (0 bytes) después de ${maxRetries} intentos`
        );
      }

      // Leer el archivo como base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64" as any,
      });

      if (!base64 || base64.length === 0) {
        if (attempt < maxRetries) {
          const waitMs = Platform.OS === "android" ? 800 : 500;
          console.warn(
            `⚠️ Base64 vacío, esperando ${waitMs}ms e intentando de nuevo...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          return tryRead(attempt + 1);
        }
        throw new Error(
          `El archivo está vacío o no se pudo leer después de ${maxRetries} intentos`
        );
      }

      console.log(`✅ Archivo leído: ${base64.length} caracteres base64`);

      // Convertir base64 a ArrayBuffer
      // Usar atob si está disponible, sino hacerlo manualmente
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

      // Convertir string binario a ArrayBuffer
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log(`✅ ArrayBuffer creado: ${bytes.buffer.byteLength} bytes`);

      return bytes.buffer;
    } catch (error) {
      if (attempt < maxRetries) {
        console.warn(
          `⚠️ Error en intento ${attempt}: ${
            error instanceof Error ? error.message : error
          }`
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
        return tryRead(attempt + 1);
      }

      console.error(
        `❌ Error final al leer archivo después de ${maxRetries} intentos:`,
        error
      );
      console.error(`URI problemática: ${uri}`);
      if (error instanceof Error) {
        console.error(`Mensaje de error:`, error.message);
      }
      throw error;
    }
  };

  return tryRead(1);
};

/**
 * Valida que el usuario esté autenticado y tiene sesión válida
 */
const validateUserSession = async (): Promise<string> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("❌ CRÍTICO: Usuario no autenticado");
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("❌ CRÍTICO: No hay sesión activa");
    }

    console.log(`✅ Sesión validada para usuario: ${user.id}`);
    return user.id;
  } catch (error) {
    console.error("Error validando sesión:", error);
    throw error;
  }
};

/**
 * Sube múltiples imágenes de solicitud a Supabase Storage con reintentos
 */
export const uploadSolicitudImages = async (
  solicitudId: number,
  imageUris: string[],
  maxRetries: number = 2
): Promise<{ urls: string[]; error: { message: string } | null }> => {
  try {
    // Validar que hay imágenes
    if (!imageUris || imageUris.length === 0) {
      console.log("ℹ️ No hay imágenes para subir");
      return {
        urls: [],
        error: null,
      };
    }

    console.log(`📸 Iniciando subida de ${imageUris.length} imagen(es)...`);

    // ✅ VALIDACIÓN CRÍTICA: Verificar sesión ANTES de intentar cualquier operación
    let userId: string;
    try {
      userId = await validateUserSession();
    } catch (sessionError) {
      console.error("❌ FATAL: No se pudo validar la sesión", sessionError);
      return {
        urls: [],
        error: {
          message:
            "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
        },
      };
    }

    const uploadedUrls: string[] = [];
    const failedImages: Array<{ index: number; reason: string }> = [];

    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      let retryCount = 0;
      let uploadSuccess = false;

      while (retryCount <= maxRetries && !uploadSuccess) {
        try {
          if (retryCount > 0) {
            console.log(
              `🔄 Reintentando imagen ${
                i + 1
              } (intento ${retryCount}/${maxRetries})...`
            );
            // Pequeña pausa antes de reintentar
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          // Asegurar que la imagen esté en formato JPG antes de subir
          console.log(
            `🔄 Procesando imagen ${i + 1}/${imageUris.length}... (intento ${
              retryCount + 1
            })`
          );
          const jpgUri = await convertToJPG(uri);
          console.log(
            `✅ Imagen ${i + 1} convertida a JPG: ${jpgUri.substring(0, 40)}...`
          );

          // Leer el archivo como ArrayBuffer
          const arrayBuffer = await uriToArrayBuffer(jpgUri);

          // Validar que el ArrayBuffer tenga contenido
          if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error(
              `ArrayBuffer vacío (0 bytes). URI: ${jpgUri.substring(0, 60)}...`
            );
          }

          console.log(
            `✅ ArrayBuffer validado: ${arrayBuffer.byteLength} bytes`
          );

          // Siempre usar extensión .jpg ya que convertimos todas las imágenes
          const timestamp = Date.now() + i; // Agregar índice para evitar colisiones

          // Nueva ruta: solicitudes/{user_id}/{solicitud_id}/{timestamp}_{i}.jpg
          const fileName = `${userId}/${solicitudId}/${timestamp}_${i}.jpg`;

          console.log(
            `📤 Subiendo imagen ${i + 1} a: ${fileName} (${
              arrayBuffer.byteLength
            } bytes)`
          );

          // Subir a Storage usando ArrayBuffer directamente
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("solicitudes")
              .upload(fileName, arrayBuffer, {
                cacheControl: "3600",
                contentType: "image/jpeg", // Siempre JPEG
                upsert: false, // No sobrescribir si existe
              });

          if (uploadError) {
            console.error(`❌ Error al subir imagen ${i + 1}:`, uploadError);

            // Detectar si es error de sesión/RLS
            if (
              uploadError.message?.includes("row-level security") ||
              uploadError.message?.includes("JWT") ||
              uploadError.message?.includes("unauthorized")
            ) {
              throw new Error(
                `Error de seguridad/sesión: ${uploadError.message}`
              );
            }

            throw new Error(
              `Error de Supabase: ${uploadError.message || "Error desconocido"}`
            );
          }

          if (!uploadData) {
            throw new Error("No se recibió confirmación de carga");
          }

          console.log(`✅ Imagen ${i + 1} subida exitosamente: ${fileName}`);

          // Verificar que el archivo se subió correctamente consultando su metadata
          const { data: fileInfo, error: infoError } = await supabase.storage
            .from("solicitudes")
            .list(`${userId}/${solicitudId}`, {
              search: `${timestamp}_${i}.jpg`,
            });

          if (infoError) {
            console.warn(`⚠️ No se pudo verificar el archivo:`, infoError);
          } else if (fileInfo && fileInfo.length > 0) {
            const fileData = fileInfo[0];
            const fileSize = fileData.metadata?.size || 0;

            console.log(
              `✅ Archivo verificado: ${fileData.name} (${fileSize} bytes)`
            );

            if (fileSize === 0 || fileSize === "0") {
              throw new Error(
                "El archivo subido está vacío (0 bytes) - corrupto"
              );
            }
          }

          // Obtener URL pública
          const {
            data: { publicUrl },
          } = supabase.storage.from("solicitudes").getPublicUrl(fileName);

          console.log(
            `✅ URL pública generada para imagen ${i + 1}: ${publicUrl}`
          );

          uploadedUrls.push(publicUrl);
          uploadSuccess = true;
        } catch (error) {
          retryCount++;
          const errorMessage =
            error instanceof Error ? error.message : "Error desconocido";

          if (retryCount > maxRetries) {
            console.error(
              `❌ Imagen ${i + 1} falló después de ${maxRetries} reintentos`
            );
            failedImages.push({
              index: i + 1,
              reason: errorMessage,
            });
          } else {
            console.warn(
              `⚠️ Error en imagen ${i + 1}: ${errorMessage}. Reintentando...`
            );
          }
        }
      }
    }

    // Reportar si hubo fallos
    if (failedImages.length > 0) {
      const failureMessage = failedImages
        .map((f) => `Imagen ${f.index}: ${f.reason}`)
        .join("\n");

      console.warn(
        `⚠️ Se subieron ${uploadedUrls.length}/${imageUris.length} imágenes. Fallos:\n${failureMessage}`
      );

      // Si algunas imágenes fallaron pero otras tuvieron éxito, continuar
      if (uploadedUrls.length === 0) {
        return {
          urls: [],
          error: {
            message: `No se pudieron subir las imágenes:\n${failureMessage}`,
          },
        };
      }
    }

    console.log(
      `✅ Subida completada: ${uploadedUrls.length}/${imageUris.length} imágenes`
    );

    return {
      urls: uploadedUrls,
      error: null,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    console.error("❌ CRÍTICO - Error en uploadSolicitudImages:", errorMessage);

    return {
      urls: [],
      error: {
        message: `Error al subir imágenes: ${errorMessage}`,
      },
    };
  }
};

/**
 * Selecciona múltiples imágenes de la galería y las convierte a JPG
 */
export const pickMultipleImages = async (): Promise<string[]> => {
  const hasPermission = await requestImagePermissions();
  if (!hasPermission) {
    throw new Error("No se otorgaron permisos para acceder a la galería");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.8,
  });

  if (result.canceled || !result.assets) {
    return [];
  }

  // Convertir todas las imágenes a JPG
  const convertedUris = await Promise.all(
    result.assets.map((asset: ImagePicker.ImagePickerAsset) =>
      convertToJPG(asset.uri)
    )
  );

  return convertedUris;
};

/**
 * Toma una foto con la cámara y la convierte a JPG
 *
 * ⚠️ IMPORTANTE: Las fotos de cámara tienen características especiales:
 * - Pueden venir en HEIC (iPhone) o JPEG (Android)
 * - El archivo temporal se crea lentamente
 * - Necesita mas tiempo para escribirse que las de galería
 */
export const takePhoto = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      throw new Error("No se otorgaron permisos para acceder a la cámara");
    }

    console.log("📸 Abriendo cámara...");

    // En Android, usar allowsEditing para forzar que se copie el archivo a una ubicación segura
    // Esto evita problemas con archivos temporales en el directorio de caché
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      exif: false, // No incluir datos EXIF (pueden causar problemas en React Native)
      allowsEditing: Platform.OS === "android", // Forzar copia en Android
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      console.log("ℹ️ Usuario canceló la captura de foto");
      return null;
    }

    console.log(
      `✅ Foto capturada: ${result.assets[0].uri.substring(0, 50)}...`
    );

    // En Android, esperar un poco después de que la cámara cierre
    // antes de intentar procesar la foto
    if (Platform.OS === "android") {
      console.log(`⏳ Android: esperando 200ms después de captura...`);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Convertir la foto a JPG
    // Las fotos de cámara necesitan más tiempo para convertirse (especialmente en Android)
    const convertedUri = await convertToJPG(result.assets[0].uri);

    if (!convertedUri) {
      throw new Error("No se pudo convertir la foto a JPG");
    }

    console.log(
      `✅ Foto lista para subir: ${convertedUri.substring(0, 50)}...`
    );
    return convertedUri;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error al tomar foto: ${errorMsg}`);
    throw error;
  }
};

/**
 * Crea una solicitud de servicio
 */
export const createSolicitud = async (
  clienteId: string,
  servicioId: number,
  descripcion: string,
  prestadorIds: number[],
  fotosUrls: string[] = []
): Promise<{
  solicitudId: number | null;
  error: { message: string } | null;
}> => {
  try {
    // Crear la solicitud
    const { data: solicitudData, error: solicitudError } = await supabase
      .from("solicitudes_servicio")
      .insert({
        cliente_id: clienteId,
        servicio_id: servicioId,
        descripcion_problema: descripcion,
        estado: "pendiente",
        fotos_urls: fotosUrls.length > 0 ? fotosUrls : null,
      })
      .select("id")
      .single();

    if (solicitudError || !solicitudData) {
      console.error("Error al crear solicitud:", solicitudError);
      return {
        solicitudId: null,
        error: {
          message:
            "Error al crear la solicitud: " +
            (solicitudError?.message || "Error desconocido"),
        },
      };
    }

    const solicitudId = solicitudData.id;

    // Obtener el nombre del servicio para la notificación
    const { data: servicioData } = await supabase
      .from("servicios")
      .select("nombre")
      .eq("id", servicioId)
      .single();

    const servicioNombre = servicioData?.nombre || "el servicio";

    // Obtener información del cliente (nombre y calificación)
    const { data: clienteData, error: clienteError } = await supabase
      .from("users")
      .select(
        "nombre, apellido, calificacion_promedio, cantidad_calificaciones"
      )
      .eq("id", clienteId)
      .single();

    const clienteNombre = clienteData
      ? `${clienteData.nombre} ${clienteData.apellido}`
      : "Un cliente";
    const clienteCalificacion = clienteData?.calificacion_promedio || null;
    const cantidadCalificaciones = clienteData?.cantidad_calificaciones || 0;

    // Formatear la calificación para mostrar en la notificación
    let calificacionTexto = "";
    if (clienteCalificacion !== null && cantidadCalificaciones > 0) {
      const estrellas = "⭐".repeat(Math.round(clienteCalificacion));
      calificacionTexto = ` (${clienteCalificacion.toFixed(
        1
      )} ${estrellas} - ${cantidadCalificaciones} ${
        cantidadCalificaciones === 1 ? "calificación" : "calificaciones"
      })`;
    } else {
      calificacionTexto = " (Sin calificaciones aún)";
    }

    // Obtener los usuario_ids de los prestadores seleccionados
    const { data: prestadoresData, error: prestadoresError } = await supabase
      .from("prestadores")
      .select("id, usuario_id")
      .in("id", prestadorIds);

    if (prestadoresError || !prestadoresData) {
      console.error("Error al obtener prestadores:", prestadoresError);
      return {
        solicitudId,
        error: {
          message:
            "La solicitud se creó pero no se pudieron enviar las notificaciones",
        },
      };
    }

    console.log(
      `Prestadores encontrados: ${prestadoresData.length} de ${prestadorIds.length} solicitados`
    );
    console.log("Prestadores data:", JSON.stringify(prestadoresData, null, 2));

    // Filtrar prestadores que tengan usuario_id válido
    const prestadoresValidos = prestadoresData.filter(
      (p) => p.usuario_id && p.usuario_id.trim() !== ""
    );

    if (prestadoresValidos.length === 0) {
      console.error("No se encontraron prestadores con usuario_id válido");
      return {
        solicitudId,
        error: {
          message:
            "La solicitud se creó pero no se encontraron prestadores válidos para notificar",
        },
      };
    }

    console.log(
      `Prestadores válidos para notificar: ${prestadoresValidos.length}`
    );

    // Crear notificaciones para cada prestador válido
    const notificaciones = prestadoresValidos.map((prestador) => ({
      usuario_id: prestador.usuario_id,
      tipo: "nueva_solicitud" as const,
      titulo: "Nueva solicitud de presupuesto",
      contenido: `${clienteNombre}${calificacionTexto} solicita un presupuesto para ${servicioNombre}.`,
      referencia_id: Number(solicitudId), // Asegurar que sea número
      referencia_tipo: "solicitud_servicio",
      leida: false,
      enviada_push: false,
      enviada_email: false,
    }));

    console.log(
      `Creando ${notificaciones.length} notificaciones para solicitud ${solicitudId}`
    );
    console.log(
      "Notificaciones a crear:",
      JSON.stringify(notificaciones, null, 2)
    );

    const { data: notificacionesInsertadas, error: notificacionesError } =
      await supabase.from("notificaciones").insert(notificaciones).select();

    if (notificacionesError) {
      console.error("Error al crear notificaciones:", notificacionesError);
      console.error(
        "Detalles del error:",
        JSON.stringify(notificacionesError, null, 2)
      );
      return {
        solicitudId,
        error: {
          message:
            "La solicitud se creó pero no se pudieron enviar las notificaciones: " +
            (notificacionesError.message || "Error desconocido"),
        },
      };
    }

    console.log(
      `✅ ${
        notificacionesInsertadas?.length || 0
      } notificaciones creadas exitosamente`
    );

    return {
      solicitudId,
      error: null,
    };
  } catch (error) {
    console.error("Error en createSolicitud:", error);
    return {
      solicitudId: null,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Error desconocido al crear solicitud",
      },
    };
  }
};

/**
 * Crea una cotización para una solicitud usando RPC
 */
export const createCotizacion = async (params: {
  solicitudId: number;
  prestadorId: number;
  precio: number;
  tiempoEstimado: number;
  descripcion: string;
  fechaProgramada?: string; // Fecha en formato YYYY-MM-DD
  incluyeMateriales?: boolean; // Si incluye materiales
}): Promise<{ error: { message: string } | null }> => {
  try {
    console.log("Iniciando RPC crear_cotizacion_v1 con:", params);

    const { data, error: rpcError } = await supabase.rpc(
      "crear_cotizacion_v1",
      {
        p_solicitud_id: params.solicitudId,
        p_prestador_id: params.prestadorId,
        p_precio: params.precio,
        p_tiempo: params.tiempoEstimado,
        p_descripcion: params.descripcion,
      }
    );

    if (rpcError) {
      console.error("Error en el RPC:", rpcError);
      throw rpcError;
    }

    if (data && data.success === false) {
      console.error("Error devuelto por la función DB:", data.error);
      throw new Error(data.error || "Falla desconocida en la base de datos");
    }

    console.log("Cotización creada exitosamente via RPC:", data);

    // Actualizar campos adicionales si se proporcionan
    const updateData: any = {};
    if (params.fechaProgramada) {
      updateData.fecha_disponible = params.fechaProgramada;
    }
    if (params.incluyeMateriales !== undefined) {
      updateData.materiales_incluidos = params.incluyeMateriales;
    }

    // Si hay datos para actualizar y se obtuvo el ID de la cotización
    if (Object.keys(updateData).length > 0 && data && data.cotizacion_id) {
      const { error: updateError } = await supabase
        .from("cotizaciones")
        .update(updateData)
        .eq("id", data.cotizacion_id);

      if (updateError) {
        console.error("Error al actualizar campos adicionales:", updateError);
        // No lanzar error, solo loguear, ya que la cotización ya se creó
      } else {
        console.log("Campos adicionales actualizados exitosamente");
      }
    } else if (params.fechaProgramada || params.incluyeMateriales !== undefined) {
      // Si no se obtuvo el ID de la cotización del RPC, intentar buscarlo
      const { data: cotizacionesData, error: findError } = await supabase
        .from("cotizaciones")
        .select("id")
        .eq("solicitud_id", params.solicitudId)
        .eq("prestador_id", params.prestadorId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!findError && cotizacionesData) {
        const updateDataFallback: any = {};
        if (params.fechaProgramada) {
          updateDataFallback.fecha_disponible = params.fechaProgramada;
        }
        if (params.incluyeMateriales !== undefined) {
          updateDataFallback.materiales_incluidos = params.incluyeMateriales;
        }

        if (Object.keys(updateDataFallback).length > 0) {
          const { error: updateError } = await supabase
            .from("cotizaciones")
            .update(updateDataFallback)
            .eq("id", cotizacionesData.id);

          if (updateError) {
            console.error("Error al actualizar campos adicionales:", updateError);
          } else {
            console.log("Campos adicionales actualizados exitosamente");
          }
        }
      }
    }

    // Obtener información de la solicitud para crear la notificación al cliente
    const { data: solicitudData, error: solicitudError } = await supabase
      .from("solicitudes_servicio")
      .select("cliente_id, servicios(nombre)")
      .eq("id", params.solicitudId)
      .single();

    if (solicitudError) {
      console.error("Error al obtener datos de la solicitud:", solicitudError);
      // Continuar de todas formas, la cotización ya se creó
    } else if (solicitudData) {
      // Obtener información del prestador para la notificación
      const { data: prestadorData, error: prestadorError } = await supabase
        .from("prestadores")
        .select("users_public(nombre, apellido)")
        .eq("id", params.prestadorId)
        .single();

      const prestadorInfo = prestadorData?.users_public as
        | { nombre: string; apellido: string }
        | null
        | undefined;
      const prestadorNombre = prestadorInfo
        ? `${prestadorInfo.nombre} ${prestadorInfo.apellido}`
        : "un prestador";
      const servicioNombre =
        (solicitudData.servicios as any)?.nombre || "el servicio";

      // Crear notificación para el cliente
      const { data: notificacionInsertada, error: notifError } = await supabase
        .from("notificaciones")
        .insert({
          usuario_id: solicitudData.cliente_id,
          tipo: "nueva_cotizacion",
          titulo: "Nueva cotización recibida",
          contenido: `${prestadorNombre} ha enviado una cotización para ${servicioNombre}.`,
          referencia_id: Number(params.solicitudId), // Asegurar que sea número
          referencia_tipo: "solicitud_servicio",
          leida: false,
          enviada_push: false,
          enviada_email: false,
        })
        .select();

      if (notifError) {
        console.error("Error al crear notificación de cotización:", notifError);
        console.error(
          "Detalles del error:",
          JSON.stringify(notifError, null, 2)
        );
        // Continuar de todas formas, la cotización ya se creó
      } else {
        console.log(
          `✅ Notificación de cotización creada para cliente ${solicitudData.cliente_id}`
        );
      }
    }

    return { error: null };
  } catch (error) {
    console.error("Error al crear cotización:", error);
    return {
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Error desconocido al enviar cotización",
      },
    };
  }
};

/**
 * Acepta una cotización y rechaza las demás para la misma solicitud
 * - La cotización aceptada pasa a estado "aceptada"
 * - Las demás cotizaciones de la misma solicitud pasan a estado "rechazada" (desestimadas)
 * - La solicitud pasa a estado "aceptada"
 * - Se crea un registro de trabajo
 */
export const aceptarCotizacion = async (
  cotizacionId: number,
  solicitudId: number
): Promise<{ error: { message: string } | null }> => {
  try {
    console.log(
      `Aceptando cotización ${cotizacionId} para solicitud ${solicitudId}`
    );

    // 1. Obtener datos de la cotización y solicitud
    const { data: cotiz, error: cotizError } = await supabase
      .from("cotizaciones")
      .select("*, prestadores(usuario_id)")
      .eq("id", cotizacionId)
      .single();

    if (cotizError || !cotiz) {
      throw new Error("No se encontró la cotización");
    }

    // Verificar que la cotización no esté ya aceptada o rechazada
    if (cotiz.estado === "aceptada") {
      return {
        error: { message: "Esta cotización ya fue aceptada anteriormente" },
      };
    }

    if (cotiz.estado === "rechazada") {
      return {
        error: { message: "Esta cotización ya fue rechazada" },
      };
    }

    // 2. Marcar la cotización elegida como aceptada
    const { error: aceptarError } = await supabase
      .from("cotizaciones")
      .update({ estado: "aceptada" })
      .eq("id", cotizacionId);

    if (aceptarError) {
      throw new Error(`Error al aceptar cotización: ${aceptarError.message}`);
    }

    console.log(`Cotización ${cotizacionId} marcada como aceptada`);

    // 3. Rechazar (desestimar) las demás cotizaciones de esta solicitud
    const { error: rechazarError } = await supabase
      .from("cotizaciones")
      .update({ estado: "rechazada" })
      .eq("solicitud_id", solicitudId)
      .neq("id", cotizacionId)
      .neq("estado", "rechazada"); // Solo actualizar las que no están ya rechazadas

    if (rechazarError) {
      console.error("Error al rechazar otras cotizaciones:", rechazarError);
      // No lanzamos error aquí para permitir que la aceptación continúe
    } else {
      console.log("Otras cotizaciones marcadas como rechazadas");
    }

    // 4. Actualizar estado de la solicitud a "aceptada"
    const { data: solicitud, error: solicitudError } = await supabase
      .from("solicitudes_servicio")
      .update({ estado: "aceptada" })
      .eq("id", solicitudId)
      .select("cliente_id, servicio_id")
      .single();

    if (solicitudError || !solicitud) {
      throw new Error(
        `Error al actualizar solicitud: ${
          solicitudError?.message || "Error desconocido"
        }`
      );
    }

    console.log(`Solicitud ${solicitudId} marcada como aceptada`);

    // 5. Crear el registro de Trabajo
    // Si la cotización tiene fecha_disponible, usarla como fecha_programada
    const trabajoData: any = {
      solicitud_id: solicitudId,
      cotizacion_id: cotizacionId,
      prestador_id: cotiz.prestador_id,
      cliente_id: solicitud.cliente_id,
      estado: "programado",
      monto_final: cotiz.precio_ofrecido,
    };

    // Transferir fecha_disponible de la cotización a fecha_programada del trabajo
    if (cotiz.fecha_disponible) {
      trabajoData.fecha_programada = cotiz.fecha_disponible;
      console.log(
        `Estableciendo fecha_programada del trabajo: ${cotiz.fecha_disponible}`
      );
    }

    const { error: trabajoError } = await supabase
      .from("trabajos")
      .insert(trabajoData);

    if (trabajoError) {
      console.error("Error al crear trabajo:", trabajoError);
      throw new Error(`Error al crear trabajo: ${trabajoError.message}`);
    }

    console.log("Trabajo creado exitosamente");

    // 6. Notificar al prestador que su cotización fue aceptada
    const prestadorUsuarioId = (cotiz as any).prestadores?.usuario_id;
    if (prestadorUsuarioId) {
      // Obtener información del cliente para la notificación
      const { data: clienteData } = await supabase
        .from("users_public")
        .select("nombre, apellido, telefono")
        .eq("id", solicitud.cliente_id)
        .single();

      const clienteNombre = clienteData
        ? `${clienteData.nombre} ${clienteData.apellido}`
        : "el cliente";
      const clienteTelefono = clienteData?.telefono || "";
      const precioCotizacion = cotiz.precio_ofrecido || 0;

      const contenidoTrabajo = clienteTelefono
        ? `¡Tu presupuesto de $${precioCotizacion} fue aceptado! Contacta a ${clienteNombre} (${clienteTelefono}) para coordinar. Ve a "Mis Trabajos" para comunicarte.`
        : `¡Tu presupuesto de $${precioCotizacion} fue aceptado por ${clienteNombre}! Ve a "Mis Trabajos" para ver los detalles y contactar al cliente.`;

      console.log("Creando notificación de trabajo aceptado:");
      console.log("- Prestador usuario_id:", prestadorUsuarioId);
      console.log("- Contenido:", contenidoTrabajo);

      // Crear notificación sobre el trabajo aceptado
      const { data: notifTrabajoInsertada, error: notifError } = await supabase
        .from("notificaciones")
        .insert({
          usuario_id: prestadorUsuarioId,
          tipo: "trabajo_aceptado",
          titulo: "¡Presupuesto aceptado!",
          contenido: contenidoTrabajo,
          referencia_id: solicitudId,
          referencia_tipo: "trabajo",
          leida: false,
          enviada_push: false,
          enviada_email: false,
        })
        .select();

      if (notifError) {
        console.error("Error al crear notificación de trabajo:", notifError);
        console.error("Detalles:", JSON.stringify(notifError, null, 2));
      } else {
        console.log(
          "✅ Notificación de trabajo enviada al prestador:",
          JSON.stringify(notifTrabajoInsertada, null, 2)
        );
      }

      // Nota: Se eliminó la notificación duplicada de tipo "sistema" 
      // La notificación de tipo "trabajo_aceptado" es suficiente y evita duplicación
    }

    // 7. Notificar a TODOS los prestadores que recibieron la solicitud
    try {
      // Obtener el nombre del servicio para la notificación
      const { data: servicioData } = await supabase
        .from("servicios")
        .select("nombre")
        .eq("id", solicitud.servicio_id)
        .single();

      const servicioNombre = servicioData?.nombre || "el servicio";

      // Obtener información del prestador aceptado para el mensaje
      const { data: prestadorAceptadoData } = await supabase
        .from("users_public")
        .select("nombre, apellido")
        .eq("id", prestadorUsuarioId)
        .single();

      const prestadorAceptadoNombre = prestadorAceptadoData
        ? `${prestadorAceptadoData.nombre} ${prestadorAceptadoData.apellido}`
        : "otro prestador";

      // Obtener todos los prestadores que recibieron notificación de esta solicitud
      const { data: notificacionesSolicitud } = await supabase
        .from("notificaciones")
        .select("usuario_id")
        .eq("referencia_id", solicitudId)
        .eq("referencia_tipo", "solicitud_servicio")
        .eq("tipo", "nueva_solicitud");

      if (notificacionesSolicitud && notificacionesSolicitud.length > 0) {
        const usuarioIdsNotificados = notificacionesSolicitud.map(
          (n) => n.usuario_id
        );

        // Obtener todas las cotizaciones para esta solicitud con información del prestador
        const { data: cotizacionesData } = await supabase
          .from("cotizaciones")
          .select("id, prestador_id, estado, prestadores(usuario_id)")
          .eq("solicitud_id", solicitudId);

        // Crear mapas para identificar prestadores
        const prestadoresQueCotizaronRechazadas = new Set<string>(); // usuario_ids con cotizaciones rechazadas

        if (cotizacionesData) {
          cotizacionesData.forEach((cotiz) => {
            const usuarioId = (cotiz as any).prestadores?.usuario_id;
            if (usuarioId && cotiz.estado === "rechazada") {
              prestadoresQueCotizaronRechazadas.add(usuarioId);
            }
          });
        }

        console.log(
          `Prestadores que recibieron notificación: ${usuarioIdsNotificados.length}`
        );
        console.log(`Prestador aceptado: ${prestadorUsuarioId}`);
        console.log(
          `Prestadores que cotizaron (rechazadas): ${prestadoresQueCotizaronRechazadas.size}`
        );

        // Crear notificaciones para cada prestador según su situación
        const notificaciones = [];

        for (const usuarioId of usuarioIdsNotificados) {
          if (usuarioId === prestadorUsuarioId) {
            // El prestador cuya cotización fue aceptada - ya se notificó arriba, no duplicar
            continue;
          } else if (prestadoresQueCotizaronRechazadas.has(usuarioId)) {
            // Prestador que cotizó pero fue rechazada
            notificaciones.push({
              usuario_id: usuarioId,
              tipo: "sistema" as const,
              titulo: "Cotización rechazada",
              contenido: `Tu cotización para ${servicioNombre} fue rechazada. El cliente eligió a ${prestadorAceptadoNombre}.`,
              referencia_id: solicitudId,
              referencia_tipo: "solicitud_servicio",
              leida: false,
              enviada_push: false,
              enviada_email: false,
            });
          } else {
            // Prestador que recibió la solicitud pero NO cotizó
            notificaciones.push({
              usuario_id: usuarioId,
              tipo: "sistema" as const,
              titulo: "Solicitud ya no está vigente",
              contenido: `La solicitud de presupuesto para ${servicioNombre} que recibiste ya fue asignada a ${prestadorAceptadoNombre}. El trabajo ya no está disponible.`,
              referencia_id: solicitudId,
              referencia_tipo: "solicitud_servicio",
              leida: false,
              enviada_push: false,
              enviada_email: false,
            });
          }
        }

        if (notificaciones.length > 0) {
          const { error: notifError } = await supabase
            .from("notificaciones")
            .insert(notificaciones);

          if (notifError) {
            console.error("Error al notificar prestadores:", notifError);
          } else {
            console.log(
              `✅ ${notificaciones.length} prestadores notificados sobre el estado de la solicitud`
            );
          }
        }
      }
    } catch (error) {
      console.error("Error al notificar prestadores:", error);
      // No lanzamos error aquí, la aceptación ya se completó exitosamente
    }

    console.log("✅ Cotización aceptada exitosamente");
    return { error: null };
  } catch (error) {
    console.error("Error al aceptar cotización:", error);
    return {
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Error al procesar la aceptación",
      },
    };
  }
};

/**
 * Rechaza una cotización individual (cuando el cliente dice "no interesa")
 */
export const rechazarCotizacion = async (
  cotizacionId: number
): Promise<{ error: { message: string } | null }> => {
  try {
    console.log(`Rechazando cotización ${cotizacionId}`);

    // Verificar que la cotización existe y no está ya rechazada o aceptada
    const { data: cotiz, error: cotizError } = await supabase
      .from("cotizaciones")
      .select("estado")
      .eq("id", cotizacionId)
      .single();

    if (cotizError || !cotiz) {
      throw new Error("No se encontró la cotización");
    }

    if (cotiz.estado === "rechazada") {
      return { error: { message: "Esta cotización ya fue rechazada" } };
    }

    if (cotiz.estado === "aceptada") {
      return {
        error: {
          message: "No se puede rechazar una cotización que ya fue aceptada",
        },
      };
    }

    // Marcar como rechazada
    const { error: updateError } = await supabase
      .from("cotizaciones")
      .update({ estado: "rechazada" })
      .eq("id", cotizacionId);

    if (updateError) {
      throw new Error(`Error al rechazar cotización: ${updateError.message}`);
    }

    console.log(`✅ Cotización ${cotizacionId} rechazada exitosamente`);
    return { error: null };
  } catch (error) {
    console.error("Error al rechazar cotización:", error);
    return {
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Error al procesar el rechazo",
      },
    };
  }
};

/**
 * Marca un trabajo como finalizado
 */
export const finalizarTrabajo = async (
  trabajoId: number,
  fotosPortfolio?: string[],
  servicioId?: number,
  prestadorId?: number,
  servicioNombre?: string
): Promise<{ error: { message: string } | null }> => {
  try {
    const { data: trabajo, error: fetchError } = await supabase
      .from("trabajos")
      .select(
        "cliente_id, prestador_id, solicitudes_servicio(servicios(nombre))"
      )
      .eq("id", trabajoId)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from("trabajos")
      .update({
        estado: "completado",
        fecha_fin: new Date().toISOString(),
      })
      .eq("id", trabajoId);

    if (updateError) throw updateError;

    const servicioNombre =
      (trabajo.solicitudes_servicio as any)?.servicios?.nombre || "servicio";

    // Notificar al cliente para que califique al prestador
    await supabase.from("notificaciones").insert({
      usuario_id: trabajo.cliente_id,
      tipo: "sistema",
      titulo: "Trabajo finalizado",
      contenido: `El prestador ha marcado como finalizado el trabajo de ${servicioNombre}. Ya puedes calificarlo en "Mis Trabajos".`,
      referencia_id: trabajoId,
      referencia_tipo: "trabajo",
      leida: false,
    });

    // Obtener el usuario_id del prestador
    const { data: prestadorData } = await supabase
      .from("prestadores")
      .select("usuario_id")
      .eq("id", trabajo.prestador_id)
      .single();

    if (prestadorData) {
      // Obtener información del cliente para la notificación
      const { data: clienteData } = await supabase
        .from("users_public")
        .select("nombre, apellido")
        .eq("id", trabajo.cliente_id)
        .single();

      const clienteNombre = clienteData
        ? `${clienteData.nombre} ${clienteData.apellido}`
        : "el cliente";

      // Notificar al prestador para que califique al cliente
      await supabase.from("notificaciones").insert({
        usuario_id: prestadorData.usuario_id,
        tipo: "calificacion",
        titulo: "Califica a tu cliente",
        contenido: `Has finalizado el trabajo de ${servicioNombre} con ${clienteNombre}. Califica tu experiencia con el cliente en "Mis Trabajos".`,
        referencia_id: trabajoId,
        referencia_tipo: "trabajo",
        leida: false,
      });

      // Si hay fotos del portfolio, crear un item en el portfolio
      if (
        fotosPortfolio &&
        fotosPortfolio.length > 0 &&
        servicioId &&
        prestadorId
      ) {
        try {
          const nombreServicioFinal = servicioNombre || "servicio";
          await createPortfolioItem({
            prestadorId: prestadorId,
            servicioId: servicioId,
            titulo: `${nombreServicioFinal} - ${new Date().toLocaleDateString(
              "es-AR"
            )}`,
            descripcion: `Trabajo finalizado el ${new Date().toLocaleDateString(
              "es-AR",
              {
                day: "2-digit",
                month: "long",
                year: "numeric",
              }
            )}`,
            fotosUrls: fotosPortfolio,
            fechaTrabajo: new Date().toISOString().split("T")[0],
            destacado: false,
          });
          console.log("✅ Item agregado al portfolio");
        } catch (portfolioError) {
          console.error("Error al agregar item al portfolio:", portfolioError);
          // No lanzar error, ya que el trabajo se finalizó correctamente
        }
      }
    }

    return { error: null };
  } catch (error) {
    console.error("Error al finalizar trabajo:", error);
    return {
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Error al finalizar el trabajo",
      },
    };
  }
};
