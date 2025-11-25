"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, User, MessageSquare, Send, MapPin, Phone, Clock, Navigation } from "lucide-react"

interface LocationData {
  city: string
  country: string
  region: string
}

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    const getLocation = async () => {
      setLocationLoading(true)
      setLocationError(null)

      const latitude = 20.676589
      const longitude = -103.347709

      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`,
        )

        if (response.ok) {
          const data = await response.json()
          setLocation({
            city: data.city || data.locality || "Ciudad desconocida",
            country: data.countryName || "País desconocido",
            region: data.principalSubdivision || "",
          })
        } else {
          setLocationError("No se pudo obtener la ubicación")
        }
      } catch (error) {
        setLocationError("Error al obtener la ubicación")
      } finally {
        setLocationLoading(false)
      }
    }

    getLocation()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    setFormData({ name: "", email: "", message: "" })
  }

  return (
    <section id="contact" className="py-24 bg-gradient-to-b from-white/5 to-transparent">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-white">
            PONTE EN
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> CONTACTO</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            ¿Tienes preguntas? Nos encantaría escucharte. Envíanos un mensaje y te responderemos lo antes posible.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">ENVÍANOS UN MENSAJE</CardTitle>
              <CardDescription className="text-gray-300">
                Completa el siguiente formulario y te responderemos en menos de 24 horas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white font-medium">
                    Nombre
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">
                    Correo electrónico
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu.correo@ejemplo.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white font-medium">
                    Mensaje
                  </Label>
                  <div className="relative group">
                    <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Cuéntanos sobre tu proyecto o déjanos una pregunta..."
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={5}
                      className="pl-10 pt-3 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15 resize-none"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="w-4 h-4" />
                      <span>Enviar</span>
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <Navigation className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium text-sm">Tu ubicación</span>
                </div>

                {locationLoading && (
                  <div className="flex items-center space-x-2 text-gray-300 text-sm">
                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span>Detectando ubicación...</span>
                  </div>
                )}

                {location && !locationLoading && (
                  <>
                    <p className="text-gray-300 text-sm">
                      📍 {location.city}
                      {location.region && `, ${location.region}`}, {location.country}
                    </p>
                    <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                      <iframe
                        title="Mapa de ubicación"
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${-103.357709},${20.666589},${-103.337709},${20.686589}&layer=mapnik&marker=20.676589,-103.347709`}
                        allowFullScreen
                      />
                    </div>
                  </>
                )}

                {locationError && !locationLoading && <p className="text-gray-400 text-sm">⚠️ {locationError}</p>}

                <p className="text-gray-400 text-xs mt-2">
                  Usamos tu ubicación para brindarte un mejor soporte e información local.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-white mb-6">INFORMACIÓN DE CONTACTO</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">DIRECCIÓN</h4>
                      <p className="text-gray-300">
                        Avenida Hogar Inteligente 123
                        <br />
                        Guadalajara, TC 44100
                        <br />
                        México
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">TELÉFONO</h4>
                      <p className="text-gray-300">+52 (333) 123-4567</p>
                      <p className="text-gray-400 text-sm">Lun-Vie 9AM-6PM EST</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">CORREO</h4>
                      <p className="text-gray-300">soporte@hogarinteligente.com</p>
                      <p className="text-gray-400 text-sm">Respondemos en menos de 24 horas</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">HORARIO DE ATENCIÓN</h4>
                      <p className="text-gray-300">
                        Lunes a Viernes: 9:00 AM - 6:00 PM
                        <br />
                        Sábado: 10:00 AM - 4:00 PM
                        <br />
                        Domingo: Cerrado
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-white mb-4">SOPORTE RÁPIDO</h3>
                <p className="text-gray-300 mb-6">¿Necesitas ayuda inmediata? Revisa nuestros recursos o inicia un chat en vivo.</p>
                <div className="space-y-3">
                  <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border border-white/20">
                    <MessageSquare className="mr-2 w-4 h-4" />
                    Iniciar chat en vivo
                  </Button>
                  <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border border-white/20">
                    <Mail className="mr-2 w-4 h-4" />
                    Centro de ayuda
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
