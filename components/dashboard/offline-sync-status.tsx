'use client';

import { usePWAContext } from '@/components/pwa-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { offlineStorage } from '@/lib/offline-storage';

export function OfflineSyncStatus() {
  const { 
    isOnline, 
    pendingRequests, 
    syncPendingRequests, 
    isSyncing 
  } = usePWAContext();

  const handleCleanCorrupted = async () => {
    try {
      const cleanedCount = await offlineStorage.cleanCorruptedRequests();
      if (cleanedCount > 0) {
        alert(`🧹 Limpieza completada: ${cleanedCount} peticiones corruptas eliminadas`);
        // Recargar la página para actualizar el estado
        window.location.reload();
      } else {
        alert('✅ No se encontraron peticiones corruptas');
      }
    } catch (error) {
      console.error('Error limpiando peticiones corruptas:', error);
      alert('❌ Error al limpiar peticiones corruptas');
    }
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar TODAS las ${pendingRequests.length} peticiones pendientes?\n\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmed) return;

    try {
      await offlineStorage.clearAllPendingRequests();
      alert(`✅ Se eliminaron todas las peticiones pendientes (${pendingRequests.length})`);
      // Recargar la página para actualizar el estado
      window.location.reload();
    } catch (error) {
      console.error('Error eliminando todas las peticiones:', error);
      alert('❌ Error al eliminar las peticiones');
    }
  };

  if (!pendingRequests.length && isOnline) {
    return null;
  }

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4 text-red-500" />;
    if (isSyncing) return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    if (pendingRequests.length > 0) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Sin conexión';
    if (isSyncing) return 'Sincronizando peticiones...';
    if (pendingRequests.length > 0) return `${pendingRequests.length} petición${pendingRequests.length !== 1 ? 'es' : ''} pendiente${pendingRequests.length !== 1 ? 's' : ''}`;
    return 'Todo sincronizado';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'destructive';
    if (isSyncing) return 'default';
    if (pendingRequests.length > 0) return 'secondary';
    return 'default';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          Estado de Sincronización
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {getStatusText()}
          </span>
          <Badge variant={getStatusColor()}>
            {isOnline ? 'En línea' : 'Offline'}
          </Badge>
        </div>

        {pendingRequests.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Peticiones pendientes:
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {pendingRequests.slice(0, 5).map((request, index) => (
                <div 
                  key={request.id || index}
                  className="flex items-center justify-between text-xs bg-muted p-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="font-mono text-xs">
                      {request.method} {new URL(request.url).pathname}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(request.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {pendingRequests.length > 5 && (
                <div className="text-xs text-muted-foreground text-center">
                  ... y {pendingRequests.length - 5} más
                </div>
              )}
            </div>
          </div>
        )}

        {pendingRequests.length > 0 && isOnline && !isSyncing && (
          <div className="space-y-2">
            <Button 
              onClick={syncPendingRequests}
              size="sm" 
              className="w-full"
              disabled={isSyncing}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Sincronizar Ahora
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleCleanCorrupted}
                size="sm" 
                variant="outline"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar Corruptas
              </Button>
              
              <Button 
                onClick={handleClearAll}
                size="sm" 
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar Todas
              </Button>
            </div>
          </div>
        )}

        {!isOnline && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span>Las peticiones se guardarán automáticamente cuando se recupere la conexión</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
