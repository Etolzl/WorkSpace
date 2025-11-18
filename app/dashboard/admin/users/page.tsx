"use client"
import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { withAdminAuth } from "@/components/withAdminAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Users, Search, Plus, Edit, Trash2, Shield, User, Bell, BellOff, Send } from "lucide-react"

interface User {
  _id: string
  nombre: string
  apellido: string
  correo: string
  telefono: string
  rol: string
  fechaCreacion: string
}

interface UserSubscriptions {
  [userId: string]: {
    count: number
    subscriptions: any[]
  }
}

function UsersManagementPage({ user }: { user: any }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("todos")
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscriptions>({})
  const [notificationDialog, setNotificationDialog] = useState<{ open: boolean; userId: string | null; userName: string }>({
    open: false,
    userId: null,
    userName: ''
  })
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationBody, setNotificationBody] = useState("")
  const [sendingNotification, setSendingNotification] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    // Obtener suscripciones de todos los usuarios cuando se cargan los usuarios
    if (users.length > 0) {
      fetchAllUserSubscriptions()
    }
  }, [users])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:4001/users", {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.usuarios || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUserSubscriptions = async () => {
    try {
      const token = localStorage.getItem("token")
      const subscriptionsMap: UserSubscriptions = {}

      // Obtener suscripciones de cada usuario
      for (const userItem of users) {
        try {
          const response = await fetch(`http://localhost:4001/push/subscriptions/${userItem._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (response.ok) {
            const data = await response.json()
            subscriptionsMap[userItem._id] = {
              count: data.subscriptions?.length || 0,
              subscriptions: data.subscriptions || []
            }
          } else {
            subscriptionsMap[userItem._id] = {
              count: 0,
              subscriptions: []
            }
          }
        } catch (error) {
          console.error(`Error obteniendo suscripciones para usuario ${userItem._id}:`, error)
          subscriptionsMap[userItem._id] = {
            count: 0,
            subscriptions: []
          }
        }
      }

      setUserSubscriptions(subscriptionsMap)
    } catch (error) {
      console.error("Error obteniendo suscripciones:", error)
    }
  }

  const sendNotificationToUser = async (userId: string) => {
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      alert("Por favor, completa el título y el mensaje de la notificación")
      return
    }

    setSendingNotification(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:4001/push/send-to-user/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: notificationTitle,
          body: notificationBody,
          icon: "/favicon/favicon-96x96.png",
          url: "/dashboard"
        })
      })

      if (response.ok) {
        alert("Notificación enviada exitosamente")
        setNotificationDialog({ open: false, userId: null, userName: '' })
        setNotificationTitle("")
        setNotificationBody("")
      } else {
        const errorData = await response.json()
        alert(`Error enviando notificación: ${errorData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error("Error enviando notificación:", error)
      alert("Error al enviar la notificación")
    } finally {
      setSendingNotification(false)
    }
  }

  const filteredUsers = users.filter(user => {
    // Validar que los campos existan antes de usar toLowerCase
    const nombre = user.nombre || ''
    const apellido = user.apellido || ''
    const correo = user.correo || ''
    
    const matchesSearch = nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         correo.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === "todos" || user.rol === filterRole
    
    return matchesSearch && matchesRole
  })

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:4001/users/${userId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rol: newRole })
      })
      
      if (response.ok) {
        fetchUsers() // Recargar usuarios
      }
    } catch (error) {
      console.error("Error updating user role:", error)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) return
    
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:4001/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        fetchUsers() // Recargar usuarios
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <DashboardHeader userName={`${user?.nombre} ${user?.apellido}`} userRole="admin" />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Gestión de Usuarios 👥
          </h1>
          <p className="text-gray-300 text-lg">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Total Usuarios</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Administradores</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.rol === 'admin').length}</p>
                </div>
                <Shield className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Usuarios Regulares</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.rol === 'usuario').length}</p>
                </div>
                <User className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Nuevos Hoy</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => {
                      const today = new Date().toDateString()
                      const userDate = new Date(u.fechaCreacion).toDateString()
                      return today === userDate
                    }).length}
                  </p>
                </div>
                <Plus className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/10 border-white/20 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar usuarios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Filtrar por rol" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="todos">Todos los roles</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                    <SelectItem value="usuario">Usuarios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Lista de Usuarios</CardTitle>
            <CardDescription className="text-gray-300">
              {filteredUsers.length} usuarios encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-300">Cargando usuarios...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20 hover:bg-white/5">
                    <TableHead className="text-white">Usuario</TableHead>
                    <TableHead className="text-white">Contacto</TableHead>
                    <TableHead className="text-white">Rol</TableHead>
                    <TableHead className="text-white">Suscripción Push</TableHead>
                    <TableHead className="text-white">Fecha de Registro</TableHead>
                    <TableHead className="text-white">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((userItem) => (
                    <TableRow key={userItem._id} className="border-white/20 hover:bg-white/5">
                      <TableCell className="text-white">
                        <div>
                          <div className="font-medium">
                            {userItem.nombre || 'Sin nombre'} {userItem.apellido || ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="space-y-1">
                          <div className="text-sm">{userItem.correo || 'Sin correo'}</div>
                          <div className="text-sm text-gray-300">{userItem.telefono || 'Sin teléfono'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={userItem.rol === 'admin' ? 'destructive' : 'secondary'}
                          className={userItem.rol === 'admin' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}
                        >
                          {userItem.rol === 'admin' ? 'Administrador' : 'Usuario'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userSubscriptions[userItem._id]?.count > 0 ? (
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-green-400" />
                            <Badge variant="default" className="bg-green-500/20 text-green-300 border-green-500/30">
                              {userSubscriptions[userItem._id].count} activa{userSubscriptions[userItem._id].count !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <BellOff className="w-4 h-4 text-gray-400" />
                            <Badge variant="secondary" className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                              No suscrito
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-white">
                        {new Date(userItem.fechaCreacion).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Select 
                            value={userItem.rol} 
                            onValueChange={(newRole) => updateUserRole(userItem._id, newRole)}
                          >
                            <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/20">
                              <SelectItem value="usuario">Usuario</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setNotificationDialog({
                                open: true,
                                userId: userItem._id,
                                userName: `${userItem.nombre || ''} ${userItem.apellido || ''}`.trim() || userItem.correo || 'Usuario'
                              })
                            }}
                            disabled={!userSubscriptions[userItem._id] || userSubscriptions[userItem._id].count === 0}
                            className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={userSubscriptions[userItem._id]?.count > 0 ? "Enviar notificación" : "Usuario no suscrito"}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(userItem._id)}
                            className="bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog para enviar notificación */}
      <Dialog open={notificationDialog.open} onOpenChange={(open) => {
        if (!sendingNotification) {
          setNotificationDialog({ open, userId: null, userName: '' })
          setNotificationTitle("")
          setNotificationBody("")
        }
      }}>
        <DialogContent className="bg-slate-800 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Enviar Notificación Push</DialogTitle>
            <DialogDescription className="text-gray-300">
              Enviar notificación personalizada a {notificationDialog.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notification-title" className="text-white">Título</Label>
              <Input
                id="notification-title"
                placeholder="Título de la notificación"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                disabled={sendingNotification}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-body" className="text-white">Mensaje</Label>
              <Textarea
                id="notification-body"
                placeholder="Mensaje de la notificación"
                value={notificationBody}
                onChange={(e) => setNotificationBody(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 min-h-[100px]"
                disabled={sendingNotification}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNotificationDialog({ open: false, userId: null, userName: '' })
                setNotificationTitle("")
                setNotificationBody("")
              }}
              disabled={sendingNotification}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => notificationDialog.userId && sendNotificationToUser(notificationDialog.userId)}
              disabled={sendingNotification || !notificationTitle.trim() || !notificationBody.trim()}
              className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30"
            >
              {sendingNotification ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enviando...</span>
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Notificación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withAdminAuth(UsersManagementPage)
