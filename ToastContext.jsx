import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const STYLES = {
  success: 'border-green-600 bg-green-50 text-green-900',
  error: 'border-red-600 bg-red-50 text-red-900',
  info: 'border-brand bg-brand-tint text-ink',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => remove(id), 5000);
  }, [remove]);

  const api = useMemo(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-start justify-between gap-3 rounded border-l-4 px-4 py-3 text-sm shadow ${STYLES[t.type]}`}>
            <span>{t.message}</span>
            <button onClick={() => remove(t.id)} className="text-lg leading-none opacity-60 hover:opacity-100" aria-label="Dismiss">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
