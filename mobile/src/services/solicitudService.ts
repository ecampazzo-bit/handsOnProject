import { supabase } from "./supabaseClient";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { requestImagePermissions } from "./profileService";

/**
 * Convierte una imagen a formato JPG compatible con React Native
 * Esto asegura que formatos como HEIC se conviertan a JPG
 */
const convertToJPG = async (uri: string): Promise<string> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [], // No aplicar transformaciones, solo convertir formato
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG, // Forzar formato JPEG
      }
    );
    return manipResult.uri;
  } catch (error) {
    console.error("Error al convertir imagen a JPG:", error);
    // Si falla la conversión, devolver la URI original
    return uri;
  }
};

/**
 * Convierte una URI de imagen a un objeto File/Blob para subir
 */
const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
};

/**
 * Sube múltiples imágenes de solicitud a Supabase Storage
 */
export const uploadSolicitudImages = async (
  solicitudId: number,
  imageUris: string[]
): Promise<{ urls: string[]; error: { message: string } | null }> => {
  try {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];

      // Asegurar que la imagen esté en formato JPG antes de subir
      const jpgUri = await convertToJPG(uri);
      const blob = await uriToBlob(jpgUri);

      // Siempre usar extensión .jpg ya que convertimos todas las imágenes
      const timestamp = Date.now();

      // Obtener el ID del usuario para la ruta (requerido por políticas RLS)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Nueva ruta: solicitudes/{user_id}/{solicitud_id}/{timestamp}_{i}.jpg
      const fileName = `${user.id}/${solicitudId}/${timestamp}_${i}.jpg`;

      // Subir a Storage (usando el nuevo bucket 'solicitudes')
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("solicitudes")
        .upload(fileName, blob, {
          cacheControl: "3600",
          contentType: "image/jpeg", // Siempre JPEG
        });

      if (uploadError) {
        console.error(`Error al subir imagen ${i}:`, uploadError);
        console.error(
          "Detalles del error:",
          JSON.stringify(uploadError, null, 2)
        );
        continue;
      }

      if (!uploadData) {
        console.error(`No se recibió data después de subir imagen ${i}`);
        continue;
      }

      console.log(`✅ Imagen ${i} subida exitosamente: ${fileName}`);

      // Obtener URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("solicitudes").getPublicUrl(fileName);

      console.log(`URL pública generada para imagen ${i}: ${publicUrl}`);

      uploadedUrls.push(publicUrl);
    }

    return {
      urls: uploadedUrls,
      error: null,
    };
  } catch (error) {
    console.error("Error en uploadSolicitudImages:", error);
    return {
      urls: [],
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Error desconocido al subir imágenes",
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
 */
export const takePhoto = async (): Promise<string | null> => {
  const hasPermission = await requestImagePermissions();
  if (!hasPermission) {
    throw new Error("No se otorgaron permisos para acceder a la cámara");
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  // Convertir la foto a JPG
  const convertedUri = await convertToJPG(result.assets[0].uri);
  return convertedUri;
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
      contenido: `Un cliente solicita un presupuesto para ${servicioNombre}.`,
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
    const { error: trabajoError } = await supabase.from("trabajos").insert({
      solicitud_id: solicitudId,
      cotizacion_id: cotizacionId,
      prestador_id: cotiz.prestador_id,
      cliente_id: solicitud.cliente_id,
      estado: "programado",
      monto_final: cotiz.precio_ofrecido,
    });

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

      // Crear notificación adicional sobre la cotización aceptada
      // Esto permite que aparezca en la pantalla de Mis Cotizaciones
      const contenidoCotizacion = `Tu presupuesto de $${precioCotizacion} fue aceptado por ${clienteNombre}. Ve a "Mis Cotizaciones" para ver los detalles y comunicarte con el cliente.`;

      console.log("Creando notificación de cotización aceptada:");
      console.log("- Prestador usuario_id:", prestadorUsuarioId);
      console.log("- Precio:", precioCotizacion);
      console.log("- Cliente:", clienteNombre);
      console.log("- Contenido:", contenidoCotizacion);

      const { data: notifCotizInsertada, error: notifCotizError } =
        await supabase
          .from("notificaciones")
          .insert({
            usuario_id: prestadorUsuarioId,
            tipo: "sistema",
            titulo: "¡Tu cotización fue aceptada!",
            contenido: contenidoCotizacion,
            referencia_id: cotizacionId,
            referencia_tipo: "cotizacion",
            leida: false,
            enviada_push: false,
            enviada_email: false,
          })
          .select();

      if (notifCotizError) {
        console.error(
          "Error al crear notificación de cotización:",
          notifCotizError
        );
        console.error("Detalles:", JSON.stringify(notifCotizError, null, 2));
        // No lanzamos error aquí, la aceptación ya se completó
      } else {
        console.log(
          "✅ Notificación de cotización enviada al prestador:",
          JSON.stringify(notifCotizInsertada, null, 2)
        );
      }
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
  trabajoId: number
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
