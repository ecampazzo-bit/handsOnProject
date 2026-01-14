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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

        // Si hay un token en query params pero no en hash, Supabase lo procesará automáticamente
        // Esto pasa cuando Supabase redirige desde /auth/v1/verify
        // El token en query params será procesado por Supabase cuando detectSessionInUrl está habilitado
        if (token && type === "recovery" && !hash.includes("access_token")) {
          // Continuar con el flujo normal, Supabase procesará el token automáticamente
        } else if (!accessToken && !token) {
          setError(
            "Enlace inválido o expirado. Por favor, solicita un nuevo enlace de recuperación."
          );
          setValidating(false);
          return;
        } else if (type !== "recovery") {
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
          if (event === "PASSWORD_RECOVERY") {
            // Verificar la sesión después del evento
            const { data: { session: recoverySession } } = await supabase.auth.getSession();
            if (recoverySession) {
              setValidating(false);
              if (subscription) {
                subscription.unsubscribe();
              }
            }
          } else if (event === "SIGNED_IN" && session) {
            setValidating(false);
            if (subscription) {
              subscription.unsubscribe();
            }
          } else if (event === "TOKEN_REFRESHED" && session) {
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

          if (session) {
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
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      setLoading(false);
      return;
    }

    // Validar que tenga al menos una mayúscula
    if (!/[A-Z]/.test(password)) {
      setError("La contraseña debe contener al menos una letra mayúscula");
      setLoading(false);
      return;
    }

    // Validar que tenga al menos un número
    if (!/\d/.test(password)) {
      setError("La contraseña debe contener al menos un número");
      setLoading(false);
      return;
    }

    // Validar que tenga al menos un carácter especial permitido
    if (!/[@$!%*?&]/.test(password)) {
      setError("La contraseña debe contener al menos un carácter especial (@$!%*?&)");
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

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
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
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-center">
              <div className="mb-3">
                <svg className="w-16 h-16 mx-auto text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-lg mb-2">¡Contraseña válida!</p>
              <p className="text-sm">
                Tu contraseña ha sido actualizada correctamente. Ya puedes usar tu nueva contraseña para iniciar sesión.
              </p>
            </div>
            <Link
              href="/"
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Ir a la página principal
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="Repite la contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Criterios de contraseña válida:
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Mínimo 8 caracteres</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Al menos una letra mayúscula (A-Z)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Al menos un número (0-9)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Al menos un carácter especial permitido: <strong>@ $ ! % * ? &</strong></span>
                </li>
              </ul>
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
