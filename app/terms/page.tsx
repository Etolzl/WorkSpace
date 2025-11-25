import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
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
            <CardTitle className="text-3xl font-bold text-white">Términos de Servicio</CardTitle>
            <p className="text-gray-400 text-sm mt-2">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Aceptación de los Términos</h2>
              <p className="leading-relaxed">
                Al acceder y utilizar WorkSpace, aceptas cumplir con estos Términos de Servicio y todas las leyes y 
                regulaciones aplicables. Si no estás de acuerdo con alguno de estos términos, no debes usar nuestro servicio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Descripción del Servicio</h2>
              <p className="leading-relaxed">
                WorkSpace es una plataforma de gestión de hogar automatizado que permite a los usuarios controlar y 
                monitorear sus dispositivos y ambientes inteligentes a través de un panel de control centralizado.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Cuenta de Usuario</h2>
              <p className="leading-relaxed">
                Para utilizar nuestros servicios, debes crear una cuenta proporcionando información precisa y completa. 
                Eres responsable de mantener la confidencialidad de tus credenciales y de todas las actividades que ocurran 
                bajo tu cuenta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Uso Aceptable</h2>
              <p className="leading-relaxed">
                Te comprometes a utilizar WorkSpace únicamente para fines legales y de acuerdo con estos términos. 
                No debes:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                <li>Violar ninguna ley o regulación aplicable</li>
                <li>Interferir con el funcionamiento del servicio</li>
                <li>Intentar acceder a cuentas de otros usuarios</li>
                <li>Transmitir virus, malware o código malicioso</li>
                <li>Realizar ingeniería inversa del servicio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Propiedad Intelectual</h2>
              <p className="leading-relaxed">
                Todo el contenido, diseño, funcionalidades y tecnología de WorkSpace son propiedad de sus respectivos 
                propietarios y están protegidos por leyes de propiedad intelectual. No puedes copiar, modificar, distribuir 
                o crear trabajos derivados sin autorización.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Limitación de Responsabilidad</h2>
              <p className="leading-relaxed">
                WorkSpace se proporciona "tal cual" sin garantías de ningún tipo. No garantizamos que el servicio 
                esté libre de errores, interrupciones o que cumpla con todos tus requisitos. No seremos responsables 
                por daños indirectos, incidentales o consecuentes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Modificaciones del Servicio</h2>
              <p className="leading-relaxed">
                Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del servicio en 
                cualquier momento, con o sin previo aviso. No seremos responsables ante ti o cualquier tercero por 
                tales modificaciones.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Terminación</h2>
              <p className="leading-relaxed">
                Podemos terminar o suspender tu cuenta y acceso al servicio inmediatamente, sin previo aviso, por 
                cualquier motivo, incluyendo el incumplimiento de estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Cambios a los Términos</h2>
              <p className="leading-relaxed">
                Podemos actualizar estos Términos de Servicio ocasionalmente. Los cambios entrarán en vigor cuando se 
                publiquen en esta página. Tu uso continuado del servicio después de los cambios constituye tu aceptación 
                de los nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Ley Aplicable</h2>
              <p className="leading-relaxed">
                Estos términos se rigen por las leyes aplicables. Cualquier disputa relacionada con estos términos o 
                el servicio será resuelta en los tribunales competentes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Contacto</h2>
              <p className="leading-relaxed">
                Si tienes preguntas sobre estos Términos de Servicio, puedes contactarnos a través de los canales de 
                soporte disponibles en la aplicación.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

