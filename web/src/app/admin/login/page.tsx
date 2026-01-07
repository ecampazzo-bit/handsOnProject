"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) throw signInError;

      if (data.user) {
        // Verificar si el usuario está activo
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("activo")
          .eq("id", data.user.id)
          .single();

        if (userError) {
          await supabase.auth.signOut();
          setError("Error al verificar el estado del usuario");
          setLoading(false);
          return;
        }

        if (userData && userData.activo === false) {
          await supabase.auth.signOut();
          setError("Tu cuenta ha sido desactivada. Por favor, contacta al administrador.");
          setLoading(false);
          return;
        }

        // Verificar si el usuario es administrador
        // Usar el email del usuario autenticado (más confiable que el input)
        const inputEmail = email.toLowerCase().trim();
        const authEmail = data.user.email?.toLowerCase().trim() || "";
        const userEmail = authEmail || inputEmail;
        
        // Validar si es admin: email contiene @admin. O es exactamente admin@ofisi.ar
        const isAdmin = 
          userEmail.includes("@admin.") || 
          userEmail === "admin@ofisi.ar" ||
          userEmail === "admin@ofisi.com"; // Mantener compatibilidad temporal

        if (!isAdmin) {
          await supabase.auth.signOut();
          setError(`No tienes permisos de administrador. Email: ${userEmail}`);
          setLoading(false);
          return;
        }

        // Guardar en sessionStorage
        sessionStorage.setItem("admin_authenticated", "true");
        sessionStorage.setItem("admin_user_id", data.user.id);

        router.push("/admin");
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
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
          <h1 className="text-3xl font-bold text-black">
            Panel de Administración
          </h1>
          <p className="text-black mt-2">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-black px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-black mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
              placeholder="admin@ofisi.ar"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-black mb-2"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>

          <div className="text-center mt-4">
            <Link
              href="/recuperar-contrasena"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
