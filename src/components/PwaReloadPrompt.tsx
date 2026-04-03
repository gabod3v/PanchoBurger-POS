import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

const PwaReloadPrompt = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast.success('App lista para usar sin conexión', {
        duration: 5000,
      });
    }
  }, [offlineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast.info('Nueva actualización disponible', {
        action: {
          label: 'Actualizar',
          onClick: () => updateServiceWorker(true),
        },
        duration: 10000,
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
};

export default PwaReloadPrompt;
