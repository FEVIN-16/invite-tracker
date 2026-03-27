import { useUIStore } from '../../store/uiStore';
import { Toast } from './Toast';

export function ToastContainer() {
  const { toasts } = useUIStore();
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 md:right-6 flex flex-col gap-2 z-[100]">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
