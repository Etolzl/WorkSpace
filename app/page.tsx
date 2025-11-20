"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Smartphone,
  Calendar,
  BarChart3,
  Zap,
  Shield,
  Clock,
  Users,
  ArrowRight,
  Play,
  Menu,
  Home,
  Settings,
  Activity,
  Thermometer,
  Lightbulb,
  Lock,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { PricingSection } from "@/components/pricing-section"
import { ContactSection } from "@/components/contact-section"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Home as HomeIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (token) {
      setIsLoggedIn(true)
      // Obtener el nombre del usuario desde la API
      fetch("http://https://workspaceapi-b81x.onrender.com/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error()
          const data = await res.json()
          setUserName(data.user?.nombre ? `${data.user.nombre} ${data.user.apellido}` : "Usuario")
        })
        .catch(() => {
          setIsLoggedIn(false)
          setUserName("")
          localStorage.removeItem("token")
        })
    } else {
      setIsLoggedIn(false)
      setUserName("")
    }
  }, [])

  const handleLogout = async () => {
    localStorage.removeItem("token")
    // Limpiar datos del usuario guardados
    const { authOffline } = await import("@/lib/auth-offline")
    authOffline.clearUserData()
    setIsLoggedIn(false)
    setUserName("")
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y Nombre */}
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-white">WorkSpace</span>
            </div>

            {/* Enlaces de Navegación */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                Características
              </Link>
              <Link href="#dashboard" className="text-gray-300 hover:text-white transition-colors">
                Panel de Control
              </Link>
              <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">
                Precios
              </Link>
              <Link href="#contact" className="text-gray-300 hover:text-white transition-colors">
                Contacto
              </Link>
            </div>

            {/* Botones de Inicio de Sesión y Registro / Menú de Usuario */}
            <div className="flex items-center space-x-4">
              {!isLoggedIn ? (
                <>
                  <Button variant="ghost" className="text-white hover:bg-white/10" asChild>
                    <Link href="/login">Iniciar Sesión</Link>
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    asChild
                  >
                    <Link href="/signup">Comenzar</Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="md:hidden text-white">
                    <Menu className="w-5 h-5" />
                  </Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 text-white hover:bg-white/10">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block">{userName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-800 border-white/20">
                    <DropdownMenuLabel className="text-white">Mi Cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/20" />
                    <DropdownMenuItem
                      className="text-gray-300 hover:bg-white/10"
                      onClick={() => router.push("/dashboard")}
                    >
                      <HomeIcon className="mr-2 w-4 h-4" />
                      Ir a mi Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/20" />
                    <DropdownMenuItem
                      className="text-red-400 hover:bg-red-500/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 w-4 h-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  🚀 Ahora con automatización inteligente
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                  Automatización
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {" "}
                    del Hogar
                  </span>
                  <br />
                  Hecha Simple
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Transforma tu espacio de vida en un ambiente inteligente. Controla todo desde la iluminación hasta el
                  clima con nuestra plataforma IoT de vanguardia.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8"
                  >
                    Comenzar Prueba Gratuita
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                {isLoggedIn ? (
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 text-lg px-8 bg-transparent"
                    >
                      <Play className="mr-2 w-5 h-5" />
                      Ir al Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 text-lg px-8 bg-transparent"
                    >
                      <Play className="mr-2 w-5 h-5" />
                      Ver Demo
                    </Button>
                  </Link>
                )}
              </div>

              <div className="flex items-center space-x-8 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>99.9% Tiempo Activo</span>
                </div>
                <div>500K+ Dispositivos Conectados</div>
                <div>Seguridad Nivel Empresarial</div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-600/30 rounded-3xl blur-3xl" />
              <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <Image
                  src="/room.jpg?height=400&width=500"
                  alt="Panel de Control WorkSpace"
                  width={700}
                  height={400}
                  className="rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-transparent to-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-white">
              Características Poderosas para
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}
                Vida Inteligente
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Todo lo que necesitas para crear la experiencia perfecta de hogar inteligente
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Control de Dispositivos IoT</CardTitle>
                <CardDescription className="text-gray-300">
                  Conecta y controla todos tus dispositivos inteligentes desde una interfaz única e intuitiva.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    <span>Compatibilidad universal de dispositivos</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    <span>Monitoreo de estado en tiempo real</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    <span>Integración de control por voz</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Programación Inteligente</CardTitle>
                <CardDescription className="text-gray-300">
                  Crea horarios inteligentes que se adaptan automáticamente a tu estilo de vida y preferencias.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    <span>Automatización avanzada</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    <span>Ajustes basados en el clima</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    <span>Optimización de recursos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Análisis Inteligente</CardTitle>
                <CardDescription className="text-gray-300">
                  Obtén información detallada sobre el rendimiento de tu hogar con análisis avanzados y reportes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    <span>Seguimiento de uso de dispositivos</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    <span>Información de optimización</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    <span>Mantenimiento predictivo</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section id="dashboard" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-white">
              Vista Previa del
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}
                Panel de Control
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Ve todo tu ecosistema de hogar inteligente de un vistazo
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-3xl blur-3xl" />
            <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Dashboard */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-white text-lg font-semibold mb-4">Resumen de Habitaciones</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-300">Sala</span>
                          <Thermometer className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">22°C</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-300">Recámara</span>
                          <Lightbulb className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">18°C</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-white text-lg font-semibold mb-4">Estado de Dispositivos</h3>
                    <div className="h-32 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl flex items-end justify-center">
                      <div className="text-white text-center">
                        <div className="text-3xl font-bold">24</div>
                        <div className="text-sm text-gray-300">Dispositivos Activos</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-white text-lg font-semibold mb-4">Acciones Rápidas</h3>
                    <div className="space-y-3">
                      <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-white/20">
                        <Lock className="mr-2 w-4 h-4" />
                        Cerrar Todas las Puertas
                      </Button>
                      <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-white/20">
                        <Lightbulb className="mr-2 w-4 h-4" />
                        Apagar Luces
                      </Button>
                      <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-white/20">
                        <Settings className="mr-2 w-4 h-4" />
                        Modo Nocturno
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-white text-lg font-semibold mb-4">Estado del Sistema</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Seguridad</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="text-green-400 text-sm">Activo</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Red</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="text-green-400 text-sm">En Línea</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Dispositivos</span>
                        <span className="text-white text-sm">24/24</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Use It Section */}
      <section className="py-24 bg-gradient-to-b from-white/5 to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-white">
              ¿Por Qué Elegir
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}
                WorkSpace?
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Únete a miles de clientes satisfechos que han transformado sus hogares
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">Súper Rápido</h3>
              <p className="text-gray-300">
                Tiempos de respuesta instantáneos con nuestra infraestructura IoT optimizada
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">Seguridad Bancaria</h3>
              <p className="text-gray-300">Cifrado de extremo a extremo protege tus datos y privacidad</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">Monitoreo 24/7</h3>
              <p className="text-gray-300">Monitoreo del sistema y soporte las 24 horas del día</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">Soporte Experto</h3>
              <p className="text-gray-300">Equipo de soporte dedicado listo para ayudarte a tener éxito</p>
            </div>
          </div>

          <div className="text-center mt-16">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8"
            >
              Comienza tu Viaje de Hogar Inteligente
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Mobile App Download Section */}
      <section className="py-24 bg-gradient-to-b from-transparent to-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-3xl blur-3xl" />
              <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 lg:p-12 border border-white/20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        📱 Disponible en Aptoide
                      </Badge>
                      <h2 className="text-3xl lg:text-5xl font-bold text-white leading-tight">
                        Descarga Nuestra
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                          {" "}
                          App Móvil
                        </span>
                      </h2>
                      <p className="text-xl text-gray-300 leading-relaxed">
                        Lleva todo el poder de WorkSpace contigo. Nuestra aplicación móvil ofrece prácticamente la misma
                        funcionalidad que los dashboards de escritorio, permitiéndote controlar tu hogar inteligente desde
                        cualquier lugar.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-white">Características de la App:</h3>
                      <ul className="space-y-3 text-gray-300">
                        <li className="flex items-start space-x-3">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                          <span>Control completo de todos tus dispositivos IoT en tiempo real</span>
                        </li>
                        <li className="flex items-start space-x-3">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                          <span>Gestión de ambientes y automatizaciones desde tu móvil</span>
                        </li>
                        <li className="flex items-start space-x-3">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                          <span>Notificaciones push para eventos importantes del hogar</span>
                        </li>
                        <li className="flex items-start space-x-3">
                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                          <span>Sincronización offline para uso sin conexión</span>
                        </li>
                        <li className="flex items-start space-x-3">
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                          <span>Acceso a estadísticas y análisis desde cualquier lugar</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-4">
                      <p className="text-gray-300 mb-4">Descarga ahora desde Aptoide:</p>
                      <a
                        href="https://www.aptoide.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block transition-transform hover:scale-105"
                      >
                        <Image
                          src="/Aptoide_badge_white.svg"
                          alt="Descargar desde Aptoide"
                          width={195}
                          height={60}
                          className="h-auto"
                        />
                      </a>
                    </div>
                  </div>

                  <div className="relative flex justify-center lg:justify-end items-center">
                    {/* Phone Frame */}
                    <div className="relative w-full max-w-[340px] transform hover:scale-105 transition-transform duration-300">
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/40 to-purple-600/40 rounded-[3rem] blur-3xl scale-110 animate-pulse" />
                      
                      {/* Device Frame */}
                      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-[3rem] p-3 shadow-2xl border-4 border-slate-700/80 backdrop-blur-sm">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-10" />
                        
                        {/* Screen */}
                        <div className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden">
                          {/* Status Bar */}
                          <div className="bg-slate-800/50 px-6 py-2 flex justify-between items-center text-white text-xs">
                            <span>9:41</span>
                            <div className="flex items-center space-x-1">
                              <div className="w-4 h-2 border border-white/50 rounded-sm">
                                <div className="w-3/4 h-full bg-white rounded-sm" />
                              </div>
                            </div>
                          </div>

                          {/* App Interface */}
                          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-[500px] p-4 space-y-4">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-white font-bold text-lg">WorkSpace</h3>
                                <p className="text-gray-400 text-xs">Mi Hogar</p>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <Home className="w-4 h-4 text-white" />
                              </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                  <Thermometer className="w-4 h-4 text-blue-400" />
                                  <span className="text-green-400 text-xs">●</span>
                                </div>
                                <div className="text-2xl font-bold text-white">22°C</div>
                                <div className="text-gray-400 text-xs">Sala</div>
                              </div>
                              <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                                  <span className="text-green-400 text-xs">●</span>
                                </div>
                                <div className="text-2xl font-bold text-white">8/12</div>
                                <div className="text-gray-400 text-xs">Luces ON</div>
                              </div>
                            </div>

                            {/* Devices Grid */}
                            <div>
                              <h4 className="text-white font-semibold text-sm mb-3">Dispositivos</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                  <Lock className="w-5 h-5 text-green-400 mb-2" />
                                  <div className="text-white text-xs font-medium">Seguridad</div>
                                  <div className="text-gray-400 text-xs">Activo</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                  <Activity className="w-5 h-5 text-purple-400 mb-2" />
                                  <div className="text-white text-xs font-medium">Sensores</div>
                                  <div className="text-gray-400 text-xs">24 activos</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                  <Settings className="w-5 h-5 text-blue-400 mb-2" />
                                  <div className="text-white text-xs font-medium">Automatización</div>
                                  <div className="text-gray-400 text-xs">5 escenarios</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                  <BarChart3 className="w-5 h-5 text-orange-400 mb-2" />
                                  <div className="text-white text-xs font-medium">Analíticas</div>
                                  <div className="text-gray-400 text-xs">Ver reportes</div>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div>
                              <h4 className="text-white font-semibold text-sm mb-3">Acciones Rápidas</h4>
                              <div className="flex space-x-2">
                                <button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg py-2.5 px-3 text-white text-xs font-medium">
                                  Modo Hogar
                                </button>
                                <button className="flex-1 bg-white/10 rounded-lg py-2.5 px-3 text-white text-xs font-medium border border-white/20">
                                  Apagar Todo
                                </button>
                              </div>
                            </div>

                            {/* Sync Status */}
                            <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span className="text-gray-300 text-xs">Sincronizado</span>
                              </div>
                              <span className="text-gray-400 text-xs">Hace 2 min</span>
                            </div>

                            {/* Bottom Navigation */}
                            <div className="absolute bottom-0 left-0 right-0 bg-slate-800/80 backdrop-blur-sm border-t border-white/10 px-4 py-2">
                              <div className="flex justify-around items-center">
                                <div className="flex flex-col items-center">
                                  <Home className="w-5 h-5 text-blue-400 mb-1" />
                                  <div className="w-1 h-1 bg-blue-400 rounded-full" />
                                </div>
                                <Activity className="w-5 h-5 text-gray-500" />
                                <BarChart3 className="w-5 h-5 text-gray-500" />
                                <Settings className="w-5 h-5 text-gray-500" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">WorkSpace</span>
              </div>
              <p className="text-gray-300">
                Transformando hogares en espacios de vida inteligentes con tecnología de automatización de vanguardia.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <Activity className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Características
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Integraciones
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Acerca de
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Carreras
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Centro de Ayuda
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Documentación
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Comunidad
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Estado
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              © {new Date().getFullYear()} WorkSpace. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                Política de Privacidad
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                Términos de Servicio
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                Política de Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
