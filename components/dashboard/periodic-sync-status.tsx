'use client';

import { usePWAContext } from '@/components/pwa-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function PeriodicSyncStatus() {
  const { isOnline, pendingRequests } = usePWAContext();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncCount, setSyncCount] = useState(0);

  // Simular actualización del tiempo de última sincronización
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && pendingRequests.length === 0) {
        setLastSyncTime(new Date());
        setSyncCount(prev => prev + 1);
      }
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [isOnline, pendingRequests.length]);

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4 text-red-500" />;
    if (pendingRequests.length > 0) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Sin conexión';
    if (pendingRequests.length > 0) return `${pendingRequests.length} petición${pendingRequests.length !== 1 ? 'es' : ''} pendiente${pendingRequests.length !== 1 ? 's' : ''}`;
    return 'Todo sincronizado';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'destructive';
    if (pendingRequests.length > 0) return 'secondary';
    return 'default';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          Verificación Periódica
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

        {isOnline && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              <span>Verificación cada 30 segundos</span>
            </div>
            
            {lastSyncTime && (
              <div className="text-xs text-muted-foreground">
                Última sincronización: {lastSyncTime.toLocaleTimeString()}
              </div>
            )}
            
            {syncCount > 0 && (
              <div className="text-xs text-muted-foreground">
                Sincronizaciones completadas: {syncCount}
              </div>
            )}
          </div>
        )}

        {!isOnline && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span>La verificación se reanudará cuando se recupere la conexión</span>
          </div>
        )}

        {isOnline && pendingRequests.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Las peticiones se sincronizarán automáticamente</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
