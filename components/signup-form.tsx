"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Home, Mail, Lock, User, CalendarDays, Phone, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface FieldErrors {
  fullName?: string
  email?: string
  birthday?: string
  phoneNumber?: string
  password?: string
  confirmPassword?: string
  general?: string
}

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    birthday: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  })
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Limpiar el error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof FieldErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
        general: undefined,
      }))
    }
  }

  // Función para parsear errores del backend
  const parseBackendErrors = (errorData: any): FieldErrors => {
    const parsedErrors: FieldErrors = {}

    // Errores de validación de Mongoose (ValidationError)
    if (errorData.errors && typeof errorData.errors === 'object') {
      const fullNameErrors: string[] = []
      
      Object.keys(errorData.errors).forEach((field) => {
        const fieldError = errorData.errors[field]
        const fieldName = mapBackendFieldToFormField(field)
        
        if (fieldName) {
          const errorMessage = fieldError.message || fieldError.msg || `Error en ${field}`
          
          // Si es nombre o apellido, acumular los errores en un array
          if (field === 'nombre' || field === 'apellido') {
            fullNameErrors.push(errorMessage)
          } else {
            // Para otros campos, usar el mensaje directamente
            // Si ya hay un error en ese campo, combinarlo
            if (parsedErrors[fieldName]) {
              parsedErrors[fieldName] = `${parsedErrors[fieldName]}. ${errorMessage}`
            } else {
              parsedErrors[fieldName] = errorMessage
            }
          }
        }
      })
      
      // Combinar errores de nombre y apellido en un solo mensaje
      if (fullNameErrors.length > 0) {
        parsedErrors.fullName = fullNameErrors.join('. ')
      }
      
      return parsedErrors
    }

    // Error de duplicado (MongoDB E11000)
    const errorMessage = errorData.message || errorData.error || ''
    const errorString = JSON.stringify(errorData).toLowerCase()

    // Detectar errores de duplicado
    if (errorString.includes('duplicate') || errorString.includes('e11000')) {
      if (errorString.includes('correo') || errorString.includes('email')) {
        parsedErrors.email = 'Este correo electrónico ya está en uso'
        return parsedErrors
      } else if (errorString.includes('telefono') || errorString.includes('phone')) {
        parsedErrors.phoneNumber = 'Este número de teléfono ya está en uso'
        return parsedErrors
      }
    }

    // Si hay un mensaje de error, intentar mapearlo a campos específicos
    if (errorMessage) {
      const lowerMessage = errorMessage.toLowerCase()

      // Mapear errores comunes a campos específicos
      if (lowerMessage.includes('nombre') || lowerMessage.includes('name')) {
        parsedErrors.fullName = errorMessage
      } else if (lowerMessage.includes('apellido') || lowerMessage.includes('lastname')) {
        parsedErrors.fullName = errorMessage
      } else if (lowerMessage.includes('correo') || lowerMessage.includes('email')) {
        parsedErrors.email = errorMessage
      } else if (lowerMessage.includes('telefono') || lowerMessage.includes('phone')) {
        parsedErrors.phoneNumber = errorMessage
      } else if (lowerMessage.includes('fecha') || lowerMessage.includes('cumpleaños') || lowerMessage.includes('birthday') || lowerMessage.includes('futuro')) {
        parsedErrors.birthday = errorMessage
      } else if (lowerMessage.includes('contraseña') || lowerMessage.includes('password') || lowerMessage.includes('caracteres no permitidos')) {
        parsedErrors.password = errorMessage
      } else {
        parsedErrors.general = errorMessage
      }
    } else {
      parsedErrors.general = 'Error al crear la cuenta. Por favor, intenta de nuevo.'
    }

    return parsedErrors
  }

  // Mapear campos del backend a campos del formulario
  const mapBackendFieldToFormField = (backendField: string): keyof FieldErrors | null => {
    const fieldMap: Record<string, keyof FieldErrors> = {
      nombre: 'fullName',
      apellido: 'fullName',
      correo: 'email',
      telefono: 'phoneNumber',
      fechaCumpleanos: 'birthday',
      contrasena: 'password',
    }
    return fieldMap[backendField] || null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Limpiar errores previos
    setErrors({})

    // Validación de contraseñas
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "¡Las contraseñas no coinciden!" })
      return
    }

    // Validación de términos
    if (!agreeToTerms) {
      setErrors({ general: "Por favor acepta los términos y condiciones" })
      return
    }

    // Validación de nombre completo (debe tener nombre y apellido)
    const fullNameTrimmed = formData.fullName.trim()
    if (!fullNameTrimmed) {
      setErrors({ fullName: "El nombre completo es requerido" })
      return
    }

    // Separar nombre y apellido
    const nameParts = fullNameTrimmed.split(" ").filter(part => part.length > 0)
    if (nameParts.length < 2) {
      setErrors({ fullName: "Por favor ingresa tu nombre y apellido" })
      return
    }

    const nombre = nameParts[0]
    const apellido = nameParts.slice(1).join(" ")

    setIsLoading(true)

    try {
      const response = await fetch("https://workspaceapi-b81x.onrender.com/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          apellido,
          correo: formData.email,
          telefono: formData.phoneNumber,
          fechaCumpleanos: formData.birthday,
          contrasena: formData.password,
        }),
      })

      // Verificar si la respuesta es válida antes de parsear JSON
      let data;
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Error parseando JSON:', jsonError)
        setErrors({ general: "Error en la respuesta del servidor" })
        setIsLoading(false)
        return
      }

      // Verificar si es una respuesta offline (independientemente del status code)
      if (data.offline) {
        alert("¡Registro guardado offline! Se sincronizará cuando tengas conexión.")
        router.push("/")
        return
      }

      if (!response.ok) {
        // Parsear errores del backend
        const parsedErrors = parseBackendErrors(data)
        setErrors(parsedErrors)
        setIsLoading(false)
        return
      }

      // Registro exitoso
      alert("¡Usuario registrado exitosamente!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error('Error en registro:', error)
      // Verificar si es un error de red
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        alert("Sin conexión a internet. El registro se guardará para sincronización posterior.")
        router.push("/")
      } else {
        setErrors({ general: error.message || "Error al registrar usuario" })
      }
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

      {/* Tarjeta de registro */}
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
              <CardTitle className="text-2xl font-bold text-white">Crear Cuenta</CardTitle>
              <CardDescription className="text-gray-300">Únete a WorkSpace y comienza a automatizar</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mensaje de error general */}
              {errors.general && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              {/* Nombre completo */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white font-medium">
                  Nombre Completo
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Ingresa tu nombre completo"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15 ${
                      errors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                    required
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Correo electrónico */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">
                  Correo Electrónico
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Ingresa tu correo electrónico"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15 ${
                      errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                    required
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Fecha de nacimiento */}
              <div className="space-y-2">
                <Label htmlFor="birthday" className="text-white font-medium">
                  Fecha de Nacimiento
                </Label>
                <div className="relative group">
                  <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="birthday"
                    name="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={handleInputChange}
                    className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15 ${
                      errors.birthday ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                    required
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                {errors.birthday && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.birthday}
                  </p>
                )}
              </div>

              {/* Número de teléfono */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-white font-medium">
                  Número de Teléfono
                </Label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="Ingresa tu número de teléfono"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15 ${
                      errors.phoneNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                    required
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                {errors.phoneNumber && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">
                  Contraseña
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Crea una contraseña"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15 ${
                      errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
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
                {errors.password && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white font-medium">
                  Confirmar Contraseña
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirma tu contraseña"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15 ${
                      errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Aceptar términos */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  className="border-white/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600 data-[state=checked]:border-transparent mt-1"
                />
                <Label
                  htmlFor="terms"
                  className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors leading-relaxed"
                >
                  Acepto los{" "}
                  <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors underline">
                    Términos de Servicio
                  </Link>{" "}
                  y la{" "}
                  <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors underline">
                    Política de Privacidad
                  </Link>
                </Label>
              </div>

              {/* Botón de Registro */}
              <Button
                type="submit"
                disabled={isLoading || !agreeToTerms}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creando cuenta...</span>
                  </div>
                ) : (
                  "Registrarse"
                )}
              </Button>
            </form>

            {/* Enlace para Iniciar Sesión */}
            <div className="text-center">
              <p className="text-gray-300 text-sm">
                ¿Ya tienes una cuenta?{" "}
                <Link
                  href="/login"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline"
                >
                  Inicia Sesión
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-xs">
            Al crear una cuenta, te unes a miles de usuarios que confían en WorkSpace para sus necesidades de automatización.
          </p>
        </div>
      </div>
    </div>
  )
}