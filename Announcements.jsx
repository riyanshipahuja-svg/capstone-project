import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useFetch, { formatDateTime } from '../utils/useFetch';
import { Badge, Button, Card, ConfirmDialog, ErrorBox, Field, Modal, PageHeader, Pagination, SearchBox, Spinner, inputClass } from '../components/ui';

function AnnouncementForm({ existing, courses, role, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: existing?.title || '',
    message: existing?.message || '',
    target: existing ? existing.target : role === 'faculty' ? 'course' : 'university',
    course: existing?.course?._id || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (existing) {
        await api.put(`/announcements/${existing._id}`, { title: form.title, message: form.message });
        toast.success('Announcement updated');
      } else {
        await api.post('/announcements', { ...form, course: form.target === 'course' ? form.course : undefined });
        toast.success('Announcement published');
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={existing ? 'Edit announcement' : 'New announcement'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        {!existing && (
          <>
            {role === 'admin' && (
              <Field label="Audience">
                <select className={inputClass} value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
                  <option value="university">Whole university</option>
                  <option value="course">A specific course</option>
                </select>
              </Field>
            )}
            {form.target === 'course' && (
              <Field label="Course">
                <select required className={inputClass} value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
                  <option value="">Select a course</option>
                  {courses.map((c) => <option key={c._id} value={c._id}>{c.courseCode} - {c.courseName}</option>)}
                </select>
              </Field>
            )}
          </>
        )}
        <Field label="Title"><input required minLength={3} maxLength={150} className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Message"><textarea required minLength={3} maxLength={2000} rows={5} className={inputClass} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving...' : existing ? 'Save changes' : 'Publish'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Announcements() {
  const { user, liveTick } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [target, setTarget] = useState('');
  const [form, setForm] = useState(null); // null | 'new' | announcement being edited
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const canPublish = user.role === 'admin' || user.role === 'faculty';

  useEffect(() => { const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);

  const list = useFetch(
    () => api.get('/announcements', { params: { page, limit: 6, q: debouncedQ || undefined, target: target || undefined } }),
    [page, debouncedQ, target, liveTick]
  );
  const courses = useFetch(() => (canPublish ? api.get('/courses', { params: { limit: 100 } }) : Promise.resolve({ data: { data: [] } })), []);

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/announcements/${toDelete._id}`);
      toast.success('Announcement deleted');
      setToDelete(null);
      list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const canEdit = (a) => user.role === 'admin' || (user.role === 'faculty' && a.createdBy?._id === user._id);

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle={user.role === 'student' ? 'University-wide notices and updates from your courses.' : 'Publish and manage announcements.'}
        action={canPublish && <Button onClick={() => setForm('new')}>New announcement</Button>}
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search announcements" />
        <select className={`${inputClass} sm:w-48`} value={target} onChange={(e) => { setTarget(e.target.value); setPage(1); }} aria-label="Filter by audience">
          <option value="">All audiences</option>
          <option value="university">University-wide</option>
          <option value="course">Course</option>
        </select>
      </div>
      {list.loading && <Spinner />}
      <ErrorBox message={list.error} onRetry={list.reload} />
      {list.data?.length === 0 && <Card><p className="text-center text-sm text-slate-500">No announcements found.</p></Card>}
      <div className="space-y-4">
        {list.data?.map((a) => (
          <Card key={a._id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-ink">{a.title}</h3>
                  <Badge tone={a.target === 'university' ? 'brand' : 'amber'}>{a.target === 'university' ? 'University' : `${a.course?.courseCode || 'Course'}`}</Badge>
                </div>
                <p className="text-xs text-slate-400">{a.createdBy?.name} ({a.createdBy?.role}) · {formatDateTime(a.createdAt)}</p>
              </div>
              {canEdit(a) && (
                <div className="flex gap-1">
                  <Button variant="ghost" onClick={() => setForm(a)}>Edit</Button>
                  <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(a)}>Delete</Button>
                </div>
              )}
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{a.message}</p>
          </Card>
        ))}
      </div>
      <Pagination meta={list.meta} onChange={setPage} />

      {form && (
        <AnnouncementForm existing={form === 'new' ? null : form} courses={courses.data || []} role={user.role}
          onClose={() => setForm(null)} onSaved={() => { setForm(null); list.reload(); }} />
      )}
      {toDelete && <ConfirmDialog message={`Delete the announcement "${toDelete.title}"?`} busy={deleting} onConfirm={remove} onCancel={() => setToDelete(null)} />}
    </>
  );
}
