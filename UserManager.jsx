import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import useFetch from '../../utils/useFetch';
import { Button, Card, ConfirmDialog, DataTable, ErrorBox, Field, Modal, PageHeader, Pagination, SearchBox, inputClass } from '../../components/ui';

const EMPTY = { name: '', email: '', password: '', rollNumber: '', department: '', phone: '' };

function UserForm({ role, existing, onClose, onSaved }) {
  const toast = useToast();
  const label = role === 'student' ? 'student' : 'faculty member';
  const [form, setForm] = useState(existing ? { ...EMPTY, ...existing, password: '' } : EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = { name: form.name, email: form.email, department: form.department };
    if (form.phone) body.phone = form.phone;
    if (role === 'student') body.rollNumber = form.rollNumber;
    if (form.password) body.password = form.password; // blank password on edit = keep current
    try {
      if (existing) await api.put(`/${role === 'student' ? 'students' : 'faculty'}/${existing._id}`, body);
      else await api.post(`/${role === 'student' ? 'students' : 'faculty'}`, body);
      toast.success(`${label[0].toUpperCase() + label.slice(1)} ${existing ? 'updated' : 'created'} successfully`);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`${existing ? 'Edit' : 'Add'} ${label}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><input required minLength={2} className={inputClass} value={form.name} onChange={set('name')} /></Field>
          <Field label="Email"><input required type="email" className={inputClass} value={form.email} onChange={set('email')} /></Field>
          <Field label={existing ? 'New password (optional)' : 'Password'}>
            <input type="password" minLength={6} required={!existing} className={inputClass} value={form.password} onChange={set('password')} autoComplete="new-password" />
          </Field>
          {role === 'student' && <Field label="Roll number"><input required className={inputClass} value={form.rollNumber} onChange={set('rollNumber')} /></Field>}
          <Field label="Department"><input required className={inputClass} value={form.department} onChange={set('department')} /></Field>
          <Field label="Phone"><input pattern="[0-9+\-\s]{7,15}" title="7-15 digits" className={inputClass} value={form.phone || ''} onChange={set('phone')} /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function UserManager({ role }) {
  const toast = useToast();
  const path = role === 'student' ? 'students' : 'faculty';
  const title = role === 'student' ? 'Students' : 'Faculty';
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const [filters, setFilters] = useState({ q: '', dept: '' });
  const [form, setForm] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { const t = setTimeout(() => { setFilters({ q, dept }); setPage(1); }, 350); return () => clearTimeout(t); }, [q, dept]);

  const list = useFetch(
    () => api.get(`/${path}`, { params: { page, limit: 8, q: filters.q || undefined, department: filters.dept || undefined } }),
    [page, filters, path]
  );

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/${path}/${toDelete._id}`);
      toast.success(`${toDelete.name} deleted`);
      setToDelete(null);
      list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { header: 'Name', render: (u) => <span className="font-medium text-ink">{u.name}</span> },
    ...(role === 'student' ? [{ header: 'Roll no.', key: 'rollNumber' }] : []),
    { header: 'Email', key: 'email' },
    { header: 'Department', key: 'department' },
    { header: 'Phone', render: (u) => u.phone || '-' },
    { header: 'Actions', className: 'whitespace-nowrap', render: (u) => (
      <div className="flex gap-1">
        <Button variant="ghost" onClick={() => setForm(u)}>Edit</Button>
        <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(u)}>Delete</Button>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title={`Manage ${title}`} subtitle={`Create, update and remove ${title.toLowerCase()} accounts.`}
        action={<Button onClick={() => setForm('new')}>Add {role === 'student' ? 'student' : 'faculty'}</Button>} />
      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <SearchBox value={q} onChange={setQ} placeholder={`Search ${title.toLowerCase()}`} />
          <input className={`${inputClass} sm:w-52`} placeholder="Filter by department" value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Filter by department" />
        </div>
        <ErrorBox message={list.error} onRetry={list.reload} />
        <DataTable columns={columns} rows={list.data || []} loading={list.loading} empty={`No ${title.toLowerCase()} found.`} />
        <Pagination meta={list.meta} onChange={setPage} />
      </Card>
      {form && <UserForm role={role} existing={form === 'new' ? null : form} onClose={() => setForm(null)} onSaved={() => { setForm(null); list.reload(); }} />}
      {toDelete && (
        <ConfirmDialog message={`Delete ${toDelete.name}? ${role === 'student' ? 'Their enrolments and attendance records will also be removed.' : 'Their courses will become unassigned.'}`}
          busy={deleting} onConfirm={remove} onCancel={() => setToDelete(null)} />
      )}
    </>
  );
}
