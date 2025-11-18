'use client';

import React, { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, Send, Users, Settings, CheckCircle, XCircle } from 'lucide-react';

interface PushNotificationSettingsProps {
  userRole?: string;
}

export const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({ 
  userRole = 'usuario' 
}) => {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendNotification,
    sendNotificationToAll,
    getSubscriptions
  } = usePushNotifications();

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    body: '',
    icon: '/favicon/favicon-96x96.png',
    url: '/dashboard'
  });
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  // Cargar suscripciones al montar el componente
  useEffect(() => {
    if (isSubscribed) {
      loadSubscriptions();
    }
  }, [isSubscribed, getSubscriptions]);

  const loadSubscriptions = async () => {
    try {
      const subs = await getSubscriptions();
      setSubscriptions(subs);
    } catch (error) {
      console.error('Error cargando suscripciones:', error);
    }
  };

  const handleToggleSubscription = async () => {
    if (isSubscribed) {
      await unsubscribe();
      setSubscriptions([]);
    } else {
      await subscribe();
    }
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.body) {
      setSendResult('Título y mensaje son requeridos');
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const success = await sendNotification(notificationForm);
      if (success) {
        setSendResult('Notificación enviada exitosamente');
        setNotificationForm(prev => ({ ...prev, title: '', body: '' }));
      } else {
        setSendResult('Error enviando notificación');
      }
    } catch (error) {
      setSendResult('Error enviando notificación');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToAll = async () => {
    if (!notificationForm.title || !notificationForm.body) {
      setSendResult('Título y mensaje son requeridos');
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const success = await sendNotificationToAll(notificationForm);
      if (success) {
        setSendResult('Notificación masiva enviada exitosamente');
        setNotificationForm(prev => ({ ...prev, title: '', body: '' }));
      } else {
        setSendResult('Error enviando notificación masiva');
      }
    } catch (error) {
      setSendResult('Error enviando notificación masiva');
    } finally {
      setIsSending(false);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificaciones Push
          </CardTitle>
          <CardDescription>
            Las notificaciones push no son compatibles con este navegador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Tu navegador no soporta notificaciones push. 
              Por favor, usa un navegador moderno como Chrome, Firefox o Edge.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuración de Suscripción */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Notificaciones
          </CardTitle>
          <CardDescription>
            Gestiona tu suscripción a notificaciones push
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="push-toggle">Notificaciones Push</Label>
              <p className="text-sm text-muted-foreground">
                {isSubscribed 
                  ? 'Recibes notificaciones push de la aplicación'
                  : 'No recibes notificaciones push'
                }
              </p>
            </div>
            <Switch
              id="push-toggle"
              checked={isSubscribed}
              onCheckedChange={handleToggleSubscription}
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isSubscribed && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">
                  Suscrito a notificaciones push
                </span>
              </div>
              <Badge variant="secondary">
                {subscriptions.length} dispositivo(s) suscrito(s)
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Envío de Notificaciones */}
      {isSubscribed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Enviar Notificación
            </CardTitle>
            <CardDescription>
              Envía una notificación push a tus dispositivos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-title">Título</Label>
              <Input
                id="notification-title"
                placeholder="Título de la notificación"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm(prev => ({ 
                  ...prev, 
                  title: e.target.value 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-body">Mensaje</Label>
              <Textarea
                id="notification-body"
                placeholder="Mensaje de la notificación"
                value={notificationForm.body}
                onChange={(e) => setNotificationForm(prev => ({ 
                  ...prev, 
                  body: e.target.value 
                }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-url">URL (opcional)</Label>
              <Input
                id="notification-url"
                placeholder="/dashboard"
                value={notificationForm.url}
                onChange={(e) => setNotificationForm(prev => ({ 
                  ...prev, 
                  url: e.target.value 
                }))}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSendNotification}
                disabled={isSending || !notificationForm.title || !notificationForm.body}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar a Mí
              </Button>

              {userRole === 'admin' && (
                <Button 
                  onClick={handleSendToAll}
                  disabled={isSending || !notificationForm.title || !notificationForm.body}
                  variant="outline"
                  className="flex-1"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Enviar a Todos
                </Button>
              )}
            </div>

            {sendResult && (
              <Alert variant={sendResult.includes('exitosamente') ? 'default' : 'destructive'}>
                <AlertDescription>{sendResult}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Información de Suscripciones */}
      {isSubscribed && subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Dispositivos Suscritos
            </CardTitle>
            <CardDescription>
              Dispositivos que reciben notificaciones push
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subscriptions.map((sub, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Dispositivo {index + 1}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sub.userAgent || 'Información no disponible'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Suscrito: {new Date(sub.fechaCreacion).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">Activo</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
