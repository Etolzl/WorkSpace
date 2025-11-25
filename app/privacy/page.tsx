import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <Link href="/login">
            <Button variant="ghost" className="text-white hover:text-blue-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-white">Política de Privacidad</CardTitle>
            <p className="text-gray-400 text-sm mt-2">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Información que Recopilamos</h2>
              <p className="leading-relaxed">
                WorkSpace recopila información que nos proporcionas directamente, como tu nombre, correo electrónico, 
                y datos relacionados con la gestión de tu hogar automatizado. También recopilamos información de uso 
                de la aplicación para mejorar nuestros servicios.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Uso de la Información</h2>
              <p className="leading-relaxed">
                Utilizamos la información recopilada para:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                <li>Proporcionar y mantener nuestros servicios</li>
                <li>Mejorar la experiencia del usuario</li>
                <li>Enviar notificaciones importantes sobre tu cuenta</li>
                <li>Detectar y prevenir fraudes o abusos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Compartir Información</h2>
              <p className="leading-relaxed">
                No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto cuando:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                <li>Es necesario para proporcionar nuestros servicios</li>
                <li>Está requerido por ley</li>
                <li>Con tu consentimiento explícito</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Seguridad</h2>
              <p className="leading-relaxed">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal 
                contra acceso no autorizado, alteración, divulgación o destrucción.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Tus Derechos</h2>
              <p className="leading-relaxed">
                Tienes derecho a acceder, rectificar, eliminar o portar tus datos personales. También puedes oponerte 
                al procesamiento de tus datos o solicitar la limitación del mismo. Para ejercer estos derechos, 
                contáctanos a través de los canales de soporte.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Cookies y Tecnologías Similares</h2>
              <p className="leading-relaxed">
                Utilizamos cookies y tecnologías similares para mejorar tu experiencia, analizar el uso de la aplicación 
                y personalizar el contenido. Puedes gestionar tus preferencias de cookies en la configuración de tu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Cambios a esta Política</h2>
              <p className="leading-relaxed">
                Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos sobre cambios significativos 
                publicando la nueva política en esta página y actualizando la fecha de "Última actualización".
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Contacto</h2>
              <p className="leading-relaxed">
                Si tienes preguntas sobre esta Política de Privacidad, puedes contactarnos a través de los canales de soporte 
                disponibles en la aplicación.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

