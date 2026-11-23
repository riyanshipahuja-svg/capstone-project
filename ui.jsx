import { useEffect } from 'react';

export function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-slate-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
      <span>{message}</span>
      {onRetry && <button onClick={onRetry} className="font-medium underline">Retry</button>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-brand text-white hover:bg-brand-dark',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-brand hover:bg-brand-tint',
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    />
  );
}

export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, tone = 'brand' }) {
  const bar = { brand: 'border-brand', amber: 'border-amber-500', red: 'border-red-500', green: 'border-green-600' }[tone];
  return (
    <div className={`rounded-lg border border-slate-200 border-l-4 bg-white p-5 ${bar}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Badge({ tone = 'slate', children }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    amber: 'bg-amber-100 text-amber-800',
    brand: 'bg-brand-tint text-brand-dark',
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function percentTone(p) {
  if (p >= 75) return 'green';
  if (p >= 60) return 'amber';
  return 'red';
}

export function Field({ label, error, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:bg-slate-100';

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-lg bg-white shadow-xl`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-700" aria-label="Close">×</button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title = 'Confirm', message, confirmLabel = 'Delete', onConfirm, onCancel, busy }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>{busy ? 'Working...' : confirmLabel}</Button>
      </div>
    </Modal>
  );
}

export function DataTable({ columns, rows, loading, empty = 'No records found.', rowKey = '_id' }) {
  if (loading) return <Spinner />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            {columns.map((c) => <th key={c.header} className={`px-3 py-2 font-medium ${c.className || ''}`}>{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-3 py-10 text-center text-slate-500">{empty}</td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={row[rowKey] ?? i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              {columns.map((c) => (
                <td key={c.header} className={`px-3 py-2.5 align-middle ${c.className || ''}`}>{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ meta, onChange }) {
  if (!meta || meta.pages <= 1) return meta ? <p className="mt-3 text-xs text-slate-500">{meta.total} record(s)</p> : null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-slate-500">Page {meta.page} of {meta.pages} ({meta.total} records)</span>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={meta.page <= 1} onClick={() => onChange(meta.page - 1)}>Previous</Button>
        <Button variant="secondary" disabled={meta.page >= meta.pages} onClick={() => onChange(meta.page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search...' }) {
  return (
    <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`${inputClass} sm:w-64`} aria-label={placeholder} />
  );
}
