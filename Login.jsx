import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { Button, ErrorBox, Field, inputClass } from '../components/ui';
import { homeFor } from '../components/ProtectedRoute';

const DEMO = [
  { role: 'Admin', email: 'admin@campus.edu', password: 'Admin@123' },
  { role: 'Faculty', email: 'rajesh.verma@campus.edu', password: 'Faculty@123' },
  { role: 'Student', email: 'aarav.mehta@campus.edu', password: 'Student@123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(form.email.trim(), form.password);
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-ink">Campus Management System</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">Sign in with the account issued by your administrator.</p>
        <form onSubmit={submit} className="space-y-4">
          <ErrorBox message={error} />
          <Field label="Email">
            <input type="email" required autoFocus className={inputClass} value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Password">
            <input type="password" required className={inputClass} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</Button>
        </form>
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="mb-2 text-xs text-slate-500">Demo accounts (after running the seed script). Click to fill the form:</p>
          <div className="flex gap-2">
            {DEMO.map((d) => (
              <Button key={d.role} variant="secondary" className="flex-1" onClick={() => setForm({ email: d.email, password: d.password })}>{d.role}</Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
