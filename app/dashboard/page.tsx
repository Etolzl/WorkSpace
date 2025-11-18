"use client"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { AutomationScenarios } from "@/components/dashboard/automation-scenarios"
import { QuickControls } from "@/components/dashboard/quick-controls"
import { OfflineSyncStatus } from "@/components/dashboard/offline-sync-status"
import { PeriodicSyncStatus } from "@/components/dashboard/periodic-sync-status"
import { PushNotificationStatus } from "@/components/dashboard/push-notification-status"
import { PushNotificationPrompt } from "@/components/push-notification-prompt"
import { withAuth } from "@/components/withAuth"
import { EnvironmentsProvider } from "@/components/dashboard/environments-context"
import { SensorsProvider } from "@/components/dashboard/sensors-context"
import { useEffect, useState } from "react"

function DashboardPage({ user }: { user: any }) {
  const userName = user?.nombre ? `${user.nombre} ${user.apellido}` : "Usuario"
  const userId = user?._id || user?.id || user?.userId || null
  const [hasCheckedAutoSubscribe, setHasCheckedAutoSubscribe] = useState(false)

  // Intentar suscribirse automáticamente cuando el usuario tiene permisos pero no está suscrito
  useEffect(() => {
    // Solo verificar una vez después de que la página cargue
    if (hasCheckedAutoSubscribe) return;

    const checkAndAutoSubscribe = async () => {
      try {
        // Esperar un poco para que todo esté listo
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Verificar si el usuario acaba de iniciar sesión
        const justLoggedIn = sessionStorage.getItem('just-logged-in');
        
        // Solo intentar suscripción automática si:
        // 1. El usuario acaba de iniciar sesión O
        // 2. Tiene permisos de notificación otorgados pero no está suscrito
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const permission = Notification.permission;
          
          if (permission === 'granted' || (justLoggedIn === 'true' && permission === 'default')) {
            const { autoSubscribeToPushNotifications } = await import("@/lib/auto-subscribe-push");
            const result = await autoSubscribeToPushNotifications();
            
            if (result.success) {
              console.log('✅ Suscripción automática a notificaciones push:', result.message);
            } else if (!result.alreadySubscribed) {
              console.log('ℹ️ Suscripción automática no realizada:', result.message);
            }
          }
        }
      } catch (error) {
        console.warn('Error en verificación automática de suscripción:', error);
      } finally {
        setHasCheckedAutoSubscribe(true);
      }
    };

    checkAndAutoSubscribe();
  }, [hasCheckedAutoSubscribe]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PushNotificationPrompt />
      <DashboardHeader userName={userName} userRole={user?.rol} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            ¡Bienvenido de vuelta, {userName}! 👋
          </h1>
          <p className="text-gray-300 text-lg">
            Aquí está lo que está pasando en tu hogar inteligente hoy.
          </p>
        </div>
        {/* Main Dashboard Grid */}
        <EnvironmentsProvider userId={userId}>
          <SensorsProvider>
            <div className="space-y-8">
              <DashboardStats />
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                  <AutomationScenarios userId={userId} />
                </div>
                <div className="space-y-8">
                  <QuickControls userId={userId} />
                  <PushNotificationStatus />
                  <OfflineSyncStatus />
                  <PeriodicSyncStatus />
                  {/* <NotificationsPanel />  <-- Elimina o comenta esta línea */}
                </div>
              </div>
            </div>
          </SensorsProvider>
        </EnvironmentsProvider>
      </main>
    </div>
  )
}

export default withAuth(DashboardPage)
