"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Check,
  X,
  ChevronDown,
  CreditCard,
  Wallet,
  Bitcoin,
  Calendar,
  Download,
  Edit,
  Star,
  Smartphone,
  BarChart3,
} from "lucide-react"

const pricingPlans = [
  {
    id: "free",
    name: "Gratis",
    price: "$0",
    period: "/mes",
    description: "Perfecto para comenzar con automatización básica",
    features: ["Hasta 5 dispositivos", "Programación básica", "Acceso a app móvil", "Soporte por email"],
    notIncluded: ["Analíticas avanzadas", "Control por voz", "Soporte prioritario", "Integraciones personalizadas"],
    buttonText: "Plan Actual",
    popular: false,
    current: true,
    icon: Smartphone,
  },
  {
    id: "standard",
    name: "Estándar",
    price: "$19",
    period: "/mes",
    description: "Ideal para hogares inteligentes con necesidades completas de automatización",
    features: [
      "Hasta 25 dispositivos",
      "Programación avanzada",
      "Integración con control por voz",
      "Analíticas básicas",
      "Soporte prioritario por email",
      "Acceso multi-usuario (3 usuarios)",
    ],
    notIncluded: ["Integraciones personalizadas", "Soporte telefónico 24/7", "Funciones de seguridad avanzadas"],
    buttonText: "Mejorar a Estándar",
    popular: true,
    current: false,
    icon: Calendar,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$49",
    period: "/mes",
    description: "Solución completa para usuarios avanzados y hogares grandes",
    features: [
      "Dispositivos ilimitados",
      "Automatización con IA",
      "Analíticas y estadísticas avanzadas",
      "Integraciones personalizadas",
      "Soporte prioritario 24/7",
      "Acceso multi-usuario (ilimitado)",
      "Funciones de seguridad avanzadas",
      "Acceso a API",
    ],
    notIncluded: [],
    buttonText: "Mejorar a Premium",
    popular: false,
    current: false,
    icon: BarChart3,
  },
]

const comparisonFeatures = [
  { feature: "Dispositivos Conectados", free: "5", standard: "25", premium: "Ilimitados" },
  { feature: "Cuentas de Usuario", free: "1", standard: "3", premium: "Ilimitadas" },
  { feature: "Programación Básica", free: true, standard: true, premium: true },
  { feature: "Programación Avanzada", free: false, standard: true, premium: true },
  { feature: "Control por Voz", free: false, standard: true, premium: true },
  { feature: "App Móvil", free: true, standard: true, premium: true },
  { feature: "Panel de Analíticas", free: false, standard: "Básico", premium: "Avanzado" },
  { feature: "Integraciones Personalizadas", free: false, standard: false, premium: true },
  { feature: "Acceso a API", free: false, standard: false, premium: true },
  { feature: "Soporte Prioritario", free: false, standard: "Email", premium: "Teléfono 24/7" },
  { feature: "Seguridad Avanzada", free: false, standard: false, premium: true },
]

const billingHistory = [
  { id: 1, date: "2024-01-15", plan: "Gratis", amount: "$0.00", status: "Activo", invoice: "FAC-2024-001" },
  { id: 2, date: "2023-12-15", plan: "Gratis", amount: "$0.00", status: "Completado", invoice: "FAC-2023-012" },
  { id: 3, date: "2023-11-15", plan: "Gratis", amount: "$0.00", status: "Completado", invoice: "FAC-2023-011" },
  { id: 4, date: "2023-10-15", plan: "Gratis", amount: "$0.00", status: "Completado", invoice: "FAC-2023-010" },
]

export function PlansBilling() {
  const [showComparison, setShowComparison] = useState(false)
  const [activeTab, setActiveTab] = useState("plans")
  const [showPaypal, setShowPaypal] = useState<{plan: string, price: string} | null>(null)
  const paypalRef = useRef<HTMLDivElement>(null)

  const currentPlan = pricingPlans.find((plan) => plan.current)
  const nextBillingDate = "15 de Febrero, 2024"
  const paymentMethod = {
    type: "PayPal",
    email: "john.doe@email.com",
    brand: "PayPal",
    icon: Wallet,
  }

  useEffect(() => {
    if (showPaypal && paypalRef.current) {
      // Limpia el contenedor antes de renderizar un nuevo botón
      paypalRef.current.innerHTML = ""
      // @ts-ignore
      if (window.paypal) {
        // @ts-ignore
        window.paypal.Buttons({
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: showPaypal.price,
                  currency_code: "USD"
                },
                description: `Suscripción al Plan ${showPaypal.plan}`
              }]
            })
          },
          onApprove: (data: any, actions: any) => {
            return actions.order.capture().then(function(details: any) {
              alert("Pago realizado con éxito por " + details.payer.name.given_name)
              setShowPaypal(null)
            })
          },
          onCancel: () => setShowPaypal(null),
          onError: (err: any) => {
            alert("Error en el pago")
            setShowPaypal(null)
          }
        }).render(paypalRef.current)
      }
    }
  }, [showPaypal])

  useEffect(() => {
    // Carga el script de PayPal solo una vez
    if (!document.getElementById("paypal-sdk")) {
      const script = document.createElement("script")
      script.id = "paypal-sdk"
      script.src = "https://www.paypal.com/sdk/js?client-id=Afwz-bkNOf7pYglG3qRPBAjiWHJVM6HTcspx5bgFDK84HZ7JVs3QmOOTQsUKXT2QtQGm2kewB3qK1om1&currency=USD"
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl lg:text-4xl font-bold text-white">
          Planes &
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Facturación</span>
        </h1>
        <p className="text-gray-300 text-lg">Administra tu suscripción e información de facturación</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-md border border-white/20">
          <TabsTrigger
            value="plans"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-300"
          >
            Selección de Planes
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-300"
          >
            Información de Facturación
          </TabsTrigger>
        </TabsList>

        {/* Plan Selection Tab */}
        <TabsContent value="plans" className="space-y-8">
          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            {pricingPlans.map((plan) => {
              const IconComponent = plan.icon
              return (
                <Card
                  key={plan.id}
                  className={`relative bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 ${
                    plan.popular ? "ring-2 ring-blue-500/50 scale-105" : ""
                  } ${plan.current ? "ring-2 ring-green-500/50" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1">
                        Más Popular
                      </Badge>
                    </div>
                  )}

                  {plan.current && (
                    <div className="absolute -top-4 right-4">
                      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>Actual</span>
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
                    {/* Features */}
                    <div className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-3">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </div>
                      ))}
                      {plan.notIncluded.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-3 opacity-50">
                          <X className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-500">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Button */}
                    <Button
                      className={`w-full font-semibold py-3 transition-all duration-300 ${
                        plan.current
                          ? "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 cursor-default"
                          : plan.popular
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25"
                            : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      }`}
                      disabled={plan.current}
                      onClick={() => {
                        if (plan.id === "standard" || plan.id === "premium") {
                          setShowPaypal({plan: plan.name, price: plan.price.replace("$", "")})
                        }
                      }}
                    >
                      {plan.buttonText}
                    </Button>
                    {/* PayPal Button */}
                    {showPaypal && showPaypal.plan === plan.name && (
                      <div ref={paypalRef} className="mt-4" />
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Collapsible Comparison Table */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-4">Comparación de Funciones</h3>
                <Button
                  onClick={() => setShowComparison(!showComparison)}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  {showComparison ? "Ocultar Comparación" : "Comparar Todas las Funciones"}
                  <ChevronDown
                    className={`ml-2 w-4 h-4 transition-transform duration-300 ${showComparison ? "rotate-180" : ""}`}
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
                        <th className="text-left py-4 px-4 text-white font-semibold">Funciones</th>
                        <th className="text-center py-4 px-4 text-white font-semibold">Gratis</th>
                        <th className="text-center py-4 px-4 text-white font-semibold">Estándar</th>
                        <th className="text-center py-4 px-4 text-white font-semibold">Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonFeatures.map((row, index) => (
                        <tr key={index} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 text-gray-300">{row.feature}</td>
                          <td className="py-4 px-4 text-center">
                            {typeof row.free === "boolean" ? (
                              row.free ? (
                                <Check className="w-5 h-5 text-green-400 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-gray-500 mx-auto" />
                              )
                            ) : (
                              <span className="text-gray-300">{row.free}</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            {typeof row.standard === "boolean" ? (
                              row.standard ? (
                                <Check className="w-5 h-5 text-green-400 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-gray-500 mx-auto" />
                              )
                            ) : (
                              <span className="text-gray-300">{row.standard}</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            {typeof row.premium === "boolean" ? (
                              row.premium ? (
                                <Check className="w-5 h-5 text-green-400 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-gray-500 mx-auto" />
                              )
                            ) : (
                              <span className="text-gray-300">{row.premium}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Information Tab */}
        <TabsContent value="billing" className="space-y-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Current Subscription */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>Suscripción Actual</span>
                </CardTitle>
                <CardDescription className="text-gray-300">Detalles de tu plan activo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h3 className="text-white font-medium">Plan</h3>
                      <p className="text-gray-300">{currentPlan?.name}</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Activo</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h3 className="text-white font-medium">Próxima Facturación</h3>
                      <p className="text-gray-300 flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{nextBillingDate}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h3 className="text-white font-medium">Monto</h3>
                      <p className="text-gray-300 text-2xl font-bold">
                        {currentPlan?.price}
                        {currentPlan?.period}
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Cambiar de Plan
                </Button>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <span>Método de Pago</span>
                </CardTitle>
                <CardDescription className="text-gray-300">Administra tu información de pago</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <paymentMethod.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Cuenta {paymentMethod.brand}</h3>
                        <p className="text-gray-400 text-sm">{paymentMethod.email}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Principal</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-white font-medium">Métodos de Pago Disponibles</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center space-y-2 hover:bg-white/10 transition-colors cursor-pointer">
                      <CreditCard className="w-6 h-6 text-blue-400" />
                      <span className="text-gray-300 text-sm">Tarjeta de Crédito</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center space-y-2 hover:bg-white/10 transition-colors cursor-pointer">
                      <Wallet className="w-6 h-6 text-yellow-400" />
                      <span className="text-gray-300 text-sm">PayPal</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center space-y-2 hover:bg-white/10 transition-colors cursor-pointer">
                      <Bitcoin className="w-6 h-6 text-orange-400" />
                      <span className="text-gray-300 text-sm">Criptomonedas</span>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Edit className="w-4 h-4 mr-2" />
                  Actualizar Método de Pago
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Billing History */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Historial de Facturación</CardTitle>
              <CardDescription className="text-gray-300">Tus facturas y pagos anteriores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 text-white font-semibold">Fecha</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">Plan</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">Monto</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">Estado</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">Factura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingHistory.map((record) => (
                      <tr key={record.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-gray-300">{record.date}</td>
                        <td className="py-3 px-4 text-gray-300">{record.plan}</td>
                        <td className="py-3 px-4 text-gray-300 font-medium">{record.amount}</td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              record.status === "Activo"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            }
                          >
                            {record.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            {record.invoice}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 text-center">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Cargar Más Historial
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}