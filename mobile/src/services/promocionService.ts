import { supabase } from "./supabaseClient";

export interface Promocion {
  id: string;
  titulo: string;
  descripcion: string | null;
  codigo_cupon: string | null;
  imagen_url: string | null;
  imagen_mobile_url: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  publico_objetivo: "general" | "clientes" | "prestadores" | "categoria_prestadores";
  categoria_id: number | null;
  servicio_id: number | null;
  estado: "borrador" | "activa" | "pausada" | "finalizada" | "cancelada";
  activa: boolean;
  orden_display: number;
  empresa_nombre: string | null;
  empresa_contacto: string | null;
  whatsapp: string | null;
  latitud: number | null;
  longitud: number | null;
  radio_cobertura_km: number | null;
}

export const getPromocionesActivas = async (
  tipoUsuario: "cliente" | "prestador" | "ambos" | null = null
): Promise<Promocion[]> => {
  try {
    const now = new Date().toISOString();
    console.log("🔍 Buscando promociones activas:", { tipoUsuario, now });
    console.log("🔍 Fecha actual (ISO):", now);

    // Primero intentar obtener todas las promociones para debug
    const { data: allPromociones, error: allError } = await supabase
      .from("promociones")
      .select("*")
      .limit(10);
    
    if (allError) {
      console.error("❌ Error al obtener todas las promociones (debug):", allError);
    } else {
      console.log(`📊 Total de promociones en BD: ${allPromociones?.length || 0}`);
      if (allPromociones && allPromociones.length > 0) {
        console.log("📊 Ejemplo de promoción:", {
          id: allPromociones[0].id,
          activa: allPromociones[0].activa,
          estado: allPromociones[0].estado,
          fecha_inicio: allPromociones[0].fecha_inicio,
          fecha_fin: allPromociones[0].fecha_fin,
          publico_objetivo: allPromociones[0].publico_objetivo,
        });
      }
    }

    // Construir la query base
    let query = supabase
      .from("promociones")
      .select("*")
      .eq("activa", true)
      .eq("estado", "activa")
      .lte("fecha_inicio", now)
      .gte("fecha_fin", now);

    // Si se especifica el tipo de usuario, filtrar por público objetivo
    if (tipoUsuario) {
      if (tipoUsuario === "cliente") {
        query = query.in("publico_objetivo", ["general", "clientes"]);
      } else if (tipoUsuario === "prestador") {
        query = query.in("publico_objetivo", [
          "general",
          "prestadores",
          "categoria_prestadores",
        ]);
      }
      // Si es "ambos", mostrar todas las promociones generales
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error al obtener promociones:", error);
      console.error("Código de error:", error.code);
      console.error("Mensaje:", error.message);
      console.error("Detalles:", JSON.stringify(error, null, 2));
      
      // Si es error de RLS, intentar sin filtros de fecha primero
      if (error.code === "PGRST301" || error.message?.includes("permission denied") || error.message?.includes("RLS")) {
        console.log("⚠️ Posible problema de RLS, intentando query más simple...");
        const simpleQuery = supabase
          .from("promociones")
          .select("*")
          .eq("activa", true)
          .limit(50);
        
        const { data: simpleData, error: simpleError } = await simpleQuery;
        if (!simpleError && simpleData) {
          console.log(`✅ Query simple funcionó, encontradas ${simpleData.length} promociones`);
          // Filtrar manualmente por fecha y estado
          const filtered = simpleData.filter((p: any) => {
            const inicio = new Date(p.fecha_inicio);
            const fin = new Date(p.fecha_fin);
            const ahora = new Date();
            return p.estado === "activa" && inicio <= ahora && fin >= ahora;
          });
          console.log(`✅ Después de filtrar por fecha: ${filtered.length} promociones`);
          return filtered as Promocion[];
        }
      }
      
      throw error;
    }

    console.log(`✅ Promociones encontradas: ${data?.length || 0}`);
    if (data && data.length > 0) {
      console.log("📋 Primeras promociones:", data.slice(0, 3).map((p: any) => ({
        id: p.id,
        titulo: p.titulo,
        activa: p.activa,
        estado: p.estado,
      })));
    }

    // Ordenar resultados: primero por orden_display, luego por fecha_creacion descendente
    const promociones = (data || []) as Promocion[];
    promociones.sort((a, b) => {
      // Primero ordenar por orden_display (ascendente)
      if (a.orden_display !== b.orden_display) {
        return a.orden_display - b.orden_display;
      }
      // Si tienen el mismo orden_display, ordenar por fecha_creacion (descendente)
      const fechaA = new Date(a.fecha_inicio).getTime();
      const fechaB = new Date(b.fecha_inicio).getTime();
      return fechaB - fechaA;
    });

    return promociones;
  } catch (error) {
    console.error("Error en getPromocionesActivas:", error);
    throw error;
  }
};

export interface PromocionConDistancia extends Promocion {
  distancia_km?: number | null;
}

export const getPromocionesActivasPorProximidad = async (
  latitud: number,
  longitud: number,
  tipoUsuario: "cliente" | "prestador" | "ambos" | null = null,
  categoriaId: number | null = null,
  radioKm: number = 50
): Promise<PromocionConDistancia[]> => {
  try {
    console.log("📍 Obteniendo promociones por proximidad:", {
      latitud,
      longitud,
      tipoUsuario,
      categoriaId,
      radioKm,
    });

    const { data, error } = await supabase.rpc("get_promociones_por_proximidad", {
      p_latitud: latitud,
      p_longitud: longitud,
      p_radio_km: radioKm,
      p_tipo_usuario: tipoUsuario,
      p_categoria_id: categoriaId,
    });

    if (error) {
      console.error("Error al obtener promociones por proximidad:", error);
      // Si falla la RPC, intentar con el método tradicional
      console.log("⚠️ Fallback a método tradicional sin geolocalización");
      return await getPromocionesActivas(tipoUsuario);
    }

    const promociones = (data || []) as PromocionConDistancia[];
    console.log(`✅ Se encontraron ${promociones.length} promociones dentro del radio de ${radioKm}km`);

    return promociones;
  } catch (error) {
    console.error("Error en getPromocionesActivasPorProximidad:", error);
    // Si hay error, intentar con el método tradicional
    console.log("⚠️ Fallback a método tradicional sin geolocalización");
    return await getPromocionesActivas(tipoUsuario);
  }
};

export const registrarVistaPromocion = async (promocionId: string): Promise<void> => {
  try {
    console.log("📊 Registrando vista de promoción:", promocionId);
    const { data, error } = await supabase.rpc("incrementar_vista_promocion", {
      p_promocion_id: promocionId,
    });

    if (error) {
      console.error("❌ Error al registrar vista de promoción:", error);
      console.error("Código de error:", error.code);
      console.error("Mensaje:", error.message);
      console.error("Detalles:", JSON.stringify(error, null, 2));
      
      if (
        error.code === "PGRST202" ||
        error.message?.includes("Could not find the function")
      ) {
        console.error(
          "⚠️ Función incrementar_vista_promocion no encontrada. Ejecuta scripts/funciones_rpc_promociones.sql en Supabase SQL Editor"
        );
      }
    } else {
      console.log("✅ Vista registrada exitosamente");
    }
  } catch (error) {
    console.error("❌ Excepción en registrarVistaPromocion:", error);
  }
};

export const registrarClickPromocion = async (promocionId: string): Promise<void> => {
  try {
    console.log("🖱️ Registrando click de promoción:", promocionId);
    const { data, error } = await supabase.rpc("incrementar_click_promocion", {
      p_promocion_id: promocionId,
    });

    if (error) {
      console.error("❌ Error al registrar click de promoción:", error);
      console.error("Código de error:", error.code);
      console.error("Mensaje:", error.message);
      console.error("Detalles:", JSON.stringify(error, null, 2));
      
      if (
        error.code === "PGRST202" ||
        error.message?.includes("Could not find the function")
      ) {
        console.error(
          "⚠️ Función incrementar_click_promocion no encontrada. Ejecuta scripts/funciones_rpc_promociones.sql en Supabase SQL Editor"
        );
      }
    } else {
      console.log("✅ Click registrado exitosamente");
    }
  } catch (error) {
    console.error("❌ Excepción en registrarClickPromocion:", error);
  }
};

