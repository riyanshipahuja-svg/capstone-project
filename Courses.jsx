import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import useFetch from '../../utils/useFetch';
import { Badge, Button, Card, ConfirmDialog, DataTable, ErrorBox, Field, Modal, PageHeader, Pagination, SearchBox, inputClass } from '../../components/ui';

function CourseForm({ existing, faculty, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    courseCode: existing?.courseCode || '',
    courseName: existing?.courseName || '',
    description: existing?.description || '',
    faculty: existing?.faculty?._id || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (existing) {
        await api.put(`/courses/${existing._id}`, { courseCode: form.courseCode, courseName: form.courseName, description: form.description });
        if ((existing.faculty?._id || '') !== form.faculty) await api.put(`/courses/${existing._id}/faculty`, { facultyId: form.faculty || null });
      } else {
        await api.post('/courses', { courseCode: form.courseCode, courseName: form.courseName, description: form.description, faculty: form.faculty || undefined });
      }
      toast.success(`Course ${existing ? 'updated' : 'created'} successfully`);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={existing ? 'Edit course' : 'Add course'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Course code"><input required className={inputClass} value={form.courseCode} onChange={set('courseCode')} /></Field>
          <div className="sm:col-span-2"><Field label="Course name"><input required className={inputClass} value={form.courseName} onChange={set('courseName')} /></Field></div>
        </div>
        <Field label="Description"><textarea rows={3} maxLength={1000} className={inputClass} value={form.description} onChange={set('description')} /></Field>
        <Field label="Assigned faculty">
          <select className={inputClass} value={form.faculty} onChange={set('faculty')}>
            <option value="">Unassigned</option>
            {faculty.map((f) => <option key={f._id} value={f._id}>{f.name} ({f.department})</option>)}
          </select>
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Courses() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [form, setForm] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);
  const list = useFetch(() => api.get('/courses', { params: { page, limit: 8, q: debouncedQ || undefined } }), [page, debouncedQ]);
  const faculty = useFetch(() => api.get('/faculty', { params: { limit: 100 } }), []);

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/courses/${toDelete._id}`);
      toast.success(`${toDelete.courseCode} deleted`);
      setToDelete(null);
      list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { header: 'Code', render: (c) => <span className="font-medium text-ink">{c.courseCode}</span> },
    { header: 'Course name', key: 'courseName' },
    { header: 'Faculty', render: (c) => (c.faculty ? c.faculty.name : <Badge tone="amber">Unassigned</Badge>) },
    { header: 'Students', render: (c) => c.studentCount },
    { header: 'Actions', className: 'whitespace-nowrap', render: (c) => (
      <div className="flex gap-1">
        <Button variant="ghost" onClick={() => setForm(c)}>Edit</Button>
        <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(c)}>Delete</Button>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title="Manage Courses" subtitle="Create courses and assign faculty members." action={<Button onClick={() => setForm('new')}>Add course</Button>} />
      <Card>
        <div className="mb-4"><SearchBox value={q} onChange={setQ} placeholder="Search by code or name" /></div>
        <ErrorBox message={list.error} onRetry={list.reload} />
        <DataTable columns={columns} rows={list.data || []} loading={list.loading} empty="No courses found." />
        <Pagination meta={list.meta} onChange={setPage} />
      </Card>
      {form && <CourseForm existing={form === 'new' ? null : form} faculty={faculty.data || []} onClose={() => setForm(null)} onSaved={() => { setForm(null); list.reload(); }} />}
      {toDelete && <ConfirmDialog message={`Delete ${toDelete.courseCode} - ${toDelete.courseName}? Its attendance records and announcements will also be removed.`} busy={deleting} onConfirm={remove} onCancel={() => setToDelete(null)} />}
    </>
  );
}
