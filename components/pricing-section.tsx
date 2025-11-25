"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  X,
  BarChart3,
  Smartphone,
  Calendar,
  ChevronDown,
  ArrowRight,
  CreditCard,
  Wallet,
  Coins,
} from "lucide-react"
import Link from "next/link"

const pricingPlans = [
  {
    name: "Gratis",
    price: "$0",
    period: "/mes",
    description: "Perfecto para comenzar con automatización básica",
    features: [
      "Hasta 5 dispositivos",
      "Programación básica",
      "Acceso desde la app móvil",
      "Soporte por correo electrónico",
      "Seguridad estándar",
    ],
    notIncluded: [
      "Análisis avanzados",
      "Control por voz",
      "Soporte prioritario",
      "Integraciones personalizadas",
      "Acceso multiusuario",
    ],
    buttonText: "Comenzar Gratis",
    popular: false,
    icon: Smartphone,
  },
  {
    name: "Estándar",
    price: "$19",
    period: "/mes",
    description: "Ideal para hogares inteligentes con necesidades más amplias",
    features: [
      "Hasta 25 dispositivos",
      "Programación avanzada",
      "Integración con control por voz",
      "Análisis básico",
      "Soporte prioritario por email",
      "Acceso multiusuario (3 usuarios)",
    ],
    notIncluded: [
      "Integraciones personalizadas",
      "Soporte telefónico 24/7",
      "Funciones de seguridad avanzadas",
      "Acceso a API",
    ],
    buttonText: "Comenzar Estándar",
    popular: true,
    icon: Calendar,
  },
  {
    name: "Premium",
    price: "$49",
    period: "/mes",
    description: "Solución completa para usuarios avanzados y hogares grandes",
    features: [
      "Dispositivos ilimitados",
      "Automatización con IA",
      "Análisis y reportes avanzados",
      "Integraciones personalizadas",
      "Soporte prioritario 24/7",
      "Acceso multiusuario (ilimitado)",
      "Funciones de seguridad avanzadas",
      "Acceso a API",
      "Opciones de marca blanca",
    ],
    notIncluded: [],
    buttonText: "Comenzar Premium",
    popular: false,
    icon: BarChart3,
  },
]

const comparisonFeatures = [
  { feature: "Dispositivos conectados", free: "5", standard: "25", premium: "Ilimitado" },
  { feature: "Cuentas de usuario", free: "1", standard: "3", premium: "Ilimitado" },
  { feature: "Programación básica", free: true, standard: true, premium: true },
  { feature: "Programación avanzada", free: false, standard: true, premium: true },
  { feature: "Control por voz", free: false, standard: true, premium: true },
  { feature: "App móvil", free: true, standard: true, premium: true },
  { feature: "Panel de análisis", free: false, standard: "Básico", premium: "Avanzado" },
  { feature: "Integraciones personalizadas", free: false, standard: false, premium: true },
  { feature: "Acceso a API", free: false, standard: false, premium: true },
  { feature: "Soporte prioritario", free: false, standard: "Correo", premium: "Teléfono 24/7" },
  { feature: "Seguridad avanzada", free: false, standard: false, premium: true },
]

export function PricingSection() {
  const [showComparison, setShowComparison] = useState(false)

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-transparent to-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-white">
            PRECIOS
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {" "}
              SIMPLES
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Elige el plan perfecto para automatizar tu hogar inteligente
          </p>
        </div>

        {/* Tarjetas de precios */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan) => {
            const IconComponent = plan.icon
            return (
              <Card
                key={plan.name}
                className={`relative bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 ${
                  plan.popular ? "ring-2 ring-blue-500/50 scale-105" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1">
                      Más popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-300">{plan.period}</span>
                  </div>
                  <CardDescription className="text-gray-300 mt-2">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((feature, i) => (
                      <div key={i} className="flex items-center space-x-3 opacity-50">
                        <X className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-500">{feature}</span>
                      </div>
                    ))}
                  </div>

                                     <Link href="/signup">
                    <Button
                      className={`w-full font-semibold py-3 transition-all duration-300 ${
                        plan.popular
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25"
                          : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      }`}
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Comparación de características */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-4">COMPARACIÓN DE CARACTERÍSTICAS</h3>
              <Button
                onClick={() => setShowComparison(!showComparison)}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                {showComparison ? "Ocultar comparación" : "Mostrar comparación detallada"}
                <ChevronDown
                  className={`ml-2 w-4 h-4 transition-transform duration-300 ${
                    showComparison ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </div>

            <div
              className={`transition-all duration-500 ease-in-out ${
                showComparison ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-4 px-4 text-white font-semibold">Característica</th>
                      <th className="text-center py-4 px-4 text-white font-semibold">Gratis</th>
                      <th className="text-center py-4 px-4 text-white font-semibold">Estándar</th>
                      <th className="text-center py-4 px-4 text-white font-semibold">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((row, index) => (
                      <tr key={index} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 text-gray-300">{row.feature}</td>
                        {[row.free, row.standard, row.premium].map((value, i) => (
                          <td key={i} className="py-4 px-4 text-center">
                            {typeof value === "boolean" ? (
                              value ? (
                                <Check className="w-5 h-5 text-green-400 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-gray-500 mx-auto" />
                              )
                            ) : (
                              <span className="text-gray-300">{value}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Métodos de pago */}
        <div className="text-center mt-12">
          <p className="text-gray-300 mb-6">Aceptamos pagos con:</p>
          <div className="flex justify-center items-center space-x-8">
            <div className="flex items-center space-x-2 text-gray-300">
              <CreditCard className="w-5 h-5" />
              <span>Tarjeta de crédito</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Wallet className="w-5 h-5" />
              <span>PayPal</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Coins className="w-5 h-5" />
              <span>Criptomonedas</span>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-white mb-4">
            ¿NO ESTÁS SEGURO DE QUÉ PLAN ELEGIR?
          </h3>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Comienza con el plan gratuito y actualiza cuando lo necesites. No hay compromisos a largo plazo.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8"
            >
              Comenzar Prueba Gratuita
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
