import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertTriangle, Info, CheckCircle, X } from "lucide-react"

export function NotificationsPanel() {
  const notifications = [
    {
      id: 1,
      type: "alert",
      title: "Alerta del Sistema de Seguridad",
      message: "Movimiento detectado en el jardín a las 2:30 PM",
      time: "hace 30 minutos",
      priority: "high",
      read: false,
    },
    {
      id: 2,
      type: "info",
      title: "Reporte Listo",
      message: "Tu reporte mensual de uso ya está disponible",
      time: "hace 2 horas",
      priority: "medium",
      read: false,
    },
    {
      id: 3,
      type: "success",
      title: "Automatización Completada",
      message: "Rutina matutina ejecutada exitosamente",
      time: "hace 6 horas",
      priority: "low",
      read: true,
    },
    {
      id: 4,
      type: "info",
      title: "Actualización Disponible",
      message: "Actualización de firmware del termostato lista para instalar",
      time: "hace 1 día",
      priority: "medium",
      read: true,
    },
    {
      id: 5,
      type: "alert",
      title: "Advertencia de Batería Baja",
      message: "La batería del detector de humo de la recámara está baja",
      time: "hace 2 días",
      priority: "high",
      read: false,
    },
  ]

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      default:
        return <Info className="w-4 h-4 text-blue-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "alta"
      case "medium":
        return "media"
      default:
        return "baja"
    }
  }

  return (
    <div className="space-y-6">
      {/* Notifications Header Card */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-white">Notificaciones</CardTitle>
            </div>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              {notifications.filter((n) => !n.read).length} nuevas
            </Badge>
          </div>
          <CardDescription className="text-gray-300">Alertas del sistema y recordatorios</CardDescription>
        </CardHeader>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.slice(0, 3).map((notification) => (
          <Card
            key={notification.id}
            className={`bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-colors ${
              !notification.read ? "ring-1 ring-blue-500/30" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={`font-medium ${notification.read ? "text-gray-300" : "text-white"}`}>
                        {notification.title}
                      </h4>
                      <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                        {getPriorityText(notification.priority)}
                      </Badge>
                    </div>
                    <p className={`text-sm ${notification.read ? "text-gray-400" : "text-gray-300"}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View All Button */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
            Ver Todas las Notificaciones
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
