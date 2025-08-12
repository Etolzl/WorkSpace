"use client"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { withAdminAuth } from "@/components/withAdminAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, Settings, Shield, Activity, Database } from "lucide-react"
import Link from "next/link"

function AdminDashboardPage({ user }: { user: any }) {
  const userName = user?.nombre ? `${user.nombre} ${user.apellido}` : "Administrador"

  const adminFeatures = [
    {
      title: "Analíticas del Sistema",
      description: "Monitoreo completo del rendimiento y uso del sistema",
      icon: BarChart3,
      href: "/dashboard/analytics",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Gestión de Usuarios",
      description: "Administrar usuarios, roles y permisos del sistema",
      icon: Users,
      href: "/dashboard/admin/users",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Configuración del Sistema",
      description: "Ajustes avanzados y configuración del servidor",
      icon: Settings,
      href: "/dashboard/admin/settings",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Seguridad y Auditoría",
      description: "Logs de seguridad y monitoreo de accesos",
      icon: Shield,
      href: "/dashboard/admin/security",
      color: "from-red-500 to-red-600"
    },
    {
      title: "Monitoreo en Tiempo Real",
      description: "Estado del sistema y métricas en vivo",
      icon: Activity,
      href: "/dashboard/admin/monitoring",
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "Base de Datos",
      description: "Gestión y respaldos de la base de datos",
      icon: Database,
      href: "/dashboard/admin/database",
      color: "from-indigo-500 to-indigo-600"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <DashboardHeader userName={userName} userRole="admin" />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Panel de Administración 👨‍💼
          </h1>
          <p className="text-gray-300 text-lg">
            Bienvenido, {userName}. Aquí puedes gestionar todo el sistema.
          </p>
        </div>

        {/* Admin Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminFeatures.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index} className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-3`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-300">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={feature.href}>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      variant="default"
                    >
                      Acceder
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid gap-6 md:grid-cols-4">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Usuarios Totales</p>
                  <p className="text-2xl font-bold">1,234</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Sesiones Activas</p>
                  <p className="text-2xl font-bold">89</p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Uso del Sistema</p>
                  <p className="text-2xl font-bold">78%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Alertas</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <Shield className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default withAdminAuth(AdminDashboardPage)
