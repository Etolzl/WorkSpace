"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Home, Settings, Smartphone, CreditCard, LogOut, Bell, Menu, X, User, HelpCircle, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { jwtDecode } from 'jwt-decode'

interface DashboardHeaderProps {
  userName: string
}

interface JwtPayload {
  idobject: string
  // Agrega aquí otras propiedades que contenga tu token JWT
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userIdObject, setUserIdObject] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token)
        setUserIdObject(decoded.idobject)
      } catch (err) {
        console.error("Error decoding token:", err)
        setUserIdObject(null)
      }
    }
  }, [])

  const navigationItems = [
    { name: "Panel de Control", href: "/dashboard", icon: Home },
    { name: "Gestionar Escenarios", href: "/dashboard/environments", icon: Settings },
    { name: "Planes y Facturación", href: "/dashboard/billing", icon: CreditCard },
    { name: "Analíticas", href: "/dashboard/analytics", icon: BarChart3 },
  ]

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/")
  }

  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">WorkSpace</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              const isActive = item.href === "/dashboard" 
                ? pathname === "/dashboard" 
                : pathname.startsWith(item.href)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? "bg-white/20 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
                  <Bell className="w-5 h-5" />
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-red-500 text-white text-xs flex items-center justify-center">
                    3
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-slate-800 border-white/20">
                <DropdownMenuLabel className="text-white">Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/20" />
                <DropdownMenuItem className="text-gray-300 hover:bg-white/10">
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">Temperatura de la sala ajustada</span>
                    <span className="text-xs text-gray-400">Hace 2 minutos</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-white/10">
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">Sistema de seguridad activado</span>
                    <span className="text-xs text-gray-400">Hace 1 hora</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-white/10">
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">Reporte de uso listo</span>
                    <span className="text-xs text-gray-400">Hace 3 horas</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
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
                <DropdownMenuItem className="text-gray-300 hover:bg-white/10">
                  <User className="mr-2 w-4 h-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-white/10">
                  <Settings className="mr-2 w-4 h-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-white/10">
                  <HelpCircle className="mr-2 w-4 h-4" />
                  Ayuda y Soporte
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

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon
                const isActive = item.href === "/dashboard" 
                  ? pathname === "/dashboard" 
                  : pathname.startsWith(item.href)
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive ? "bg-white/20 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}