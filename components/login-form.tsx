"use client"

import type React from "react"
import { jwtDecode } from 'jwt-decode'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Home, Mail, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:4001/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: email.toLowerCase(),
          contrasena: password,
          recordar: rememberMe, // <-- Agrega esto
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error en el inicio de sesión")
      }

      // Guarda el token en localStorage
      if (data.token) {
        localStorage.setItem("token", data.token)
        console.log("JWT recibido:", data.token)

        // Decodifica el token y guarda el userId
        try {
          const decoded: any = jwtDecode(data.token)
          // Cambia "userId" por el nombre real del campo, por ejemplo "_id" si tu backend lo envía así
          localStorage.setItem("userId", decoded.userId || decoded._id || decoded.id)
          console.log("User ID guardado:", decoded.userId || decoded._id || decoded.id)
        } catch (err) {
          console.error("Error decodificando el token:", err)
        }

        // Guardar datos del usuario para uso offline
        if (data.user) {
          const { authOffline } = await import("@/lib/auth-offline")
          authOffline.saveUserData(data.user)
        }
      }

      // Marcar que el usuario acaba de iniciar sesión para mostrar el prompt de notificaciones
      sessionStorage.setItem('just-logged-in', 'true')
      
      // Intentar suscribirse automáticamente a notificaciones push si tiene permisos
      // Esto se hace en segundo plano sin bloquear el flujo de login
      setTimeout(async () => {
        try {
          const { autoSubscribeToPushNotifications } = await import("@/lib/auto-subscribe-push");
          const result = await autoSubscribeToPushNotifications();
          if (result.success) {
            console.log('✅ Suscripción automática a notificaciones push:', result.message);
          } else if (!result.alreadySubscribed) {
            console.log('ℹ️ Suscripción automática no realizada:', result.message);
          }
        } catch (error) {
          console.warn('Error en suscripción automática:', error);
          // No mostrar error al usuario, es opcional
        }
      }, 2000); // Esperar 2 segundos después del login
      
      alert("Inicio de sesión exitoso")
      router.push("/dashboard")
    } catch (error: any) {
      alert(error.message || "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Tarjeta de inicio de sesión */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Home className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-white">Bienvenido de vuelta</CardTitle>
              <CardDescription className="text-gray-300">Inicia sesión en tu cuenta de SmartHome</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo de Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">
                  Correo electrónico
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ingresa tu correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15"
                    required
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </div>

              {/* Campo de Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">
                  Contraseña
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </div>

              {/* Recordarme y Olvidé contraseña */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-white/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600 data-[state=checked]:border-transparent"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors"
                  >
                    Recordar mi cuenta
                  </Label>
                </div>

                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Botón de Iniciar Sesión */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            {/* Enlace para Crear Cuenta */}
            <div className="text-center">
              <p className="text-gray-300 text-sm">
                ¿No tienes una cuenta?{" "}
                <Link
                  href="/signup"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline"
                >
                  Crear una cuenta
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-xs">
            Al iniciar sesión, aceptas nuestros{" "}
            <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">
              Términos de Servicio
            </Link>{" "}
            y{" "}
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
              Política de Privacidad
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}