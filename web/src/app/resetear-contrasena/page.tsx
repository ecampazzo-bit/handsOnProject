"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";

function ResetearContrasenaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    let timeoutId: NodeJS.Timeout;
    
    const validateRecoveryToken = async () => {
      try {
        // Verificar tanto el hash como los query params
        // Supabase puede enviar el token de diferentes maneras
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        // Intentar obtener el token del hash primero (método preferido)
        let type = hashParams.get("type");
        let accessToken = hashParams.get("access_token");
        let token = hashParams.get("token");
        
        // Si no está en el hash, verificar query params (fallback)
        if (!accessToken && !token) {
          type = searchParams.get("type") || type;
          accessToken = searchParams.get("access_token") || accessToken;
          token = searchParams.get("token") || token;
        }

        console.log("Validando token de recuperación:", { 
          hasHash: !!hash,
          hash: hash.substring(0, 100),
          searchParams: window.location.search,
          type, 
          hasAccessToken: !!accessToken,
          hasToken: !!token
        });

        // Si hay un token en query params pero no en hash, Supabase lo procesará automáticamente
        // Esto pasa cuando Supabase redirige desde /auth/v1/verify
        // El token en query params será procesado por Supabase cuando detectSessionInUrl está habilitado
        if (token && type === "recovery" && !hash.includes("access_token")) {
          console.log("📧 Token encontrado en query params, Supabase lo procesará automáticamente");
          console.log("⚠️ Esperando a que Supabase procese el token (puede tardar unos segundos)...");
          // Continuar con el flujo normal, Supabase procesará el token automáticamente
        } else if (!accessToken && !token) {
          console.warn("❌ No se encontró token de recuperación en hash ni query params");
          setError(
            "Enlace inválido o expirado. Por favor, solicita un nuevo enlace de recuperación."
          );
          setValidating(false);
          return;
        } else if (type !== "recovery") {
          console.warn("❌ Tipo de token incorrecto:", type);
          setError(
            "Enlace inválido o expirado. Por favor, solicita un nuevo enlace de recuperación."
          );
          setValidating(false);
          return;
        }

        // Escuchar cambios en el estado de autenticación
        // Supabase procesará automáticamente el token cuando detectSessionInUrl está habilitado
        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("🔐 Auth state change:", { event, hasSession: !!session, userId: session?.user?.id });

          if (event === "PASSWORD_RECOVERY") {
            console.log("✅ Evento PASSWORD_RECOVERY detectado");
            // Verificar la sesión después del evento
            const { data: { session: recoverySession } } = await supabase.auth.getSession();
            if (recoverySession) {
              console.log("✅ Sesión de recuperación establecida correctamente");
              setValidating(false);
              if (subscription) {
                subscription.unsubscribe();
              }
            }
          } else if (event === "SIGNED_IN" && session) {
            console.log("✅ Usuario autenticado con sesión de recuperación");
            setValidating(false);
            if (subscription) {
              subscription.unsubscribe();
            }
          } else if (event === "TOKEN_REFRESHED" && session) {
            console.log("✅ Token refrescado, sesión válida");
            setValidating(false);
            if (subscription) {
              subscription.unsubscribe();
            }
          }
        });

        subscription = authSubscription;

        // Verificar la sesión inmediatamente (puede que ya esté procesada)
        const initialCheck = await supabase.auth.getSession();
        if (initialCheck.data.session) {
          console.log("✅ Sesión ya disponible en carga inicial");
          setValidating(false);
          if (subscription) {
            subscription.unsubscribe();
          }
          return;
        }

        // También verificar la sesión periódicamente (fallback)
        let attempts = 0;
        const maxAttempts = 30; // 15 segundos máximo (aumentado para dar más tiempo)
        
        const checkSessionPeriodically = async () => {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          console.log(`Intento ${attempts + 1}/${maxAttempts}:`, { 
            hasSession: !!session, 
            sessionError: sessionError?.message,
            userId: session?.user?.id,
            email: session?.user?.email,
            hash: window.location.hash.substring(0, 50),
            search: window.location.search
          });

          if (session) {
            console.log("✅ Sesión de recuperación encontrada");
            setValidating(false);
            if (subscription) {
              subscription.unsubscribe();
            }
            return;
          }

          attempts++;
          if (attempts < maxAttempts) {
            timeoutId = setTimeout(checkSessionPeriodically, 500);
          } else {
            console.error("❌ No se pudo establecer sesión después de múltiples intentos");
            console.error("Estado final:", {
              hash: window.location.hash,
              search: window.location.search,
              url: window.location.href,
              hasToken: !!token,
              hasAccessToken: !!accessToken
            });
            setError(
              "No se pudo validar el enlace. Por favor, solicita un nuevo enlace de recuperación."
            );
            setValidating(false);
            if (subscription) {
              subscription.unsubscribe();
            }
          }
        };

        // Esperar más tiempo antes de empezar a verificar (dar tiempo a Supabase para procesar)
        // Si el token viene de /auth/v1/verify, puede tardar más en procesarse
        setTimeout(() => {
          checkSessionPeriodically();
        }, 2000); // Aumentado a 2 segundos

        // Timeout de seguridad (30 segundos)
        const safetyTimeout = setTimeout(() => {
          console.warn("⏱️ Timeout de validación alcanzado");
          if (subscription) {
            subscription.unsubscribe();
          }
          setError(
            "El enlace tardó demasiado en validarse. Por favor, intenta nuevamente."
          );
          setValidating(false);
        }, 30000);
        
        // Guardar el timeout para cleanup
        timeoutId = safetyTimeout;

      } catch (err: any) {
        console.error("❌ Error al validar sesión:", err);
        setError(
          "Error al validar el enlace de recuperación. Por favor, intenta nuevamente."
        );
        setValidating(false);
        if (subscription) {
          subscription.unsubscribe();
        }
      }
    };

    validateRecoveryToken();

    // Cleanup
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    // Validar longitud mínima
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      // Verificar que hay una sesión válida antes de actualizar
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error(
          "No hay una sesión válida. Por favor, solicita un nuevo enlace de recuperación."
        );
      }

      console.log("Actualizando contraseña para sesión:", session.user.id);

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error("Error al actualizar contraseña:", updateError);
        throw updateError;
      }

      setSuccess(true);

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push("/admin/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validando enlace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <Image
              src="/logo-color.png"
              alt="ofiSí Logo"
              width={150}
              height={90}
              className="h-auto"
              loading="eager"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Restablecer Contraseña
          </h1>
          <p className="text-gray-600 mt-2">Ingresa tu nueva contraseña</p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">¡Contraseña actualizada!</p>
              <p className="text-sm mt-1">
                Tu contraseña ha sido actualizada correctamente. Serás
                redirigido al login en unos segundos.
              </p>
            </div>
            <Link
              href="/"
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Ir al Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Nueva Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Repite la contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Actualizando..." : "Actualizar Contraseña"}
            </button>

            <div className="text-center">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Volver al inicio
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetearContrasena() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <ResetearContrasenaContent />
    </Suspense>
  );
}
