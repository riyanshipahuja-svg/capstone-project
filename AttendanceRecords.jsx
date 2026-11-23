import { useState } from 'react';
import api, { getErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import useFetch, { formatDate } from '../../utils/useFetch';
import { Badge, Button, Card, ConfirmDialog, DataTable, ErrorBox, Modal, PageHeader, Pagination, percentTone, inputClass } from '../../components/ui';

export default function AttendanceRecords() {
  const toast = useToast();
  const [course, setCourse] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [newStatus, setNewStatus] = useState('Present');
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const courses = useFetch(() => api.get('/courses', { params: { limit: 100 } }), []);
  const records = useFetch(
    () => api.get('/attendance', { params: { page, limit: 10, course: course || undefined, status: status || undefined, from: from || undefined, to: to || undefined } }),
    [page, course, status, from, to]
  );
  const summary = useFetch(() => api.get('/reports/attendance/students', { params: { course: course || undefined } }), [course]);

  const resetPage = (setter) => (e) => { setter(e.target.value); setPage(1); };

  const saveEdit = async () => {
    setBusy(true);
    try {
      await api.put(`/attendance/${editing._id}`, { status: newStatus });
      toast.success('Attendance updated');
      setEditing(null);
      records.reload();
      summary.reload();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/attendance/${toDelete._id}`);
      toast.success('Attendance record deleted');
      setToDelete(null);
      records.reload();
      summary.reload();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Attendance Records" subtitle="Review, correct or delete attendance you have marked." />
      <Card className="mb-6">
        <div className="mb-4 flex flex-wrap gap-3">
          <select className={`${inputClass} sm:w-64`} value={course} onChange={resetPage(setCourse)} aria-label="Course">
            <option value="">All my courses</option>
            {courses.data?.map((c) => <option key={c._id} value={c._id}>{c.courseCode} - {c.courseName}</option>)}
          </select>
          <select className={`${inputClass} sm:w-40`} value={status} onChange={resetPage(setStatus)} aria-label="Status">
            <option value="">Any status</option><option>Present</option><option>Absent</option>
          </select>
          <input type="date" className={`${inputClass} sm:w-44`} value={from} onChange={resetPage(setFrom)} aria-label="From date" />
          <input type="date" className={`${inputClass} sm:w-44`} value={to} onChange={resetPage(setTo)} aria-label="To date" />
          {(course || status || from || to) && <Button variant="secondary" onClick={() => { setCourse(''); setStatus(''); setFrom(''); setTo(''); setPage(1); }}>Clear filters</Button>}
        </div>
        <ErrorBox message={records.error} onRetry={records.reload} />
        <DataTable rows={records.data || []} loading={records.loading} empty="No attendance records found."
          columns={[
            { header: 'Date', render: (r) => formatDate(r.date) },
            { header: 'Course', render: (r) => r.course?.courseCode },
            { header: 'Roll no.', render: (r) => r.student?.rollNumber },
            { header: 'Student', render: (r) => r.student?.name },
            { header: 'Status', render: (r) => <Badge tone={r.status === 'Present' ? 'green' : 'red'}>{r.status}</Badge> },
            { header: 'Actions', className: 'whitespace-nowrap', render: (r) => (
              <div className="flex gap-1">
                <Button variant="ghost" onClick={() => { setEditing(r); setNewStatus(r.status); }}>Edit</Button>
                <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(r)}>Delete</Button>
              </div>
            ) },
          ]} />
        <Pagination meta={records.meta} onChange={setPage} />
      </Card>

      <Card title="Attendance percentage by student">
        <ErrorBox message={summary.error} />
        <DataTable loading={summary.loading} rows={(summary.data || []).map((r, i) => ({ ...r, _k: i }))} rowKey="_k" empty="No attendance data yet."
          columns={[
            { header: 'Roll no.', key: 'rollNumber' }, { header: 'Student', key: 'studentName' }, { header: 'Course', key: 'courseCode' },
            { header: 'Attended / Total', render: (r) => `${r.attended} / ${r.totalClasses}` },
            { header: 'Percentage', render: (r) => <Badge tone={percentTone(r.percentage)}>{r.percentage}%</Badge> },
          ]} />
      </Card>

      {editing && (
        <Modal title="Edit attendance" onClose={() => setEditing(null)}>
          <p className="mb-3 text-sm text-slate-600">{editing.student?.name} · {editing.course?.courseCode} · {formatDate(editing.date)}</p>
          <select className={inputClass} value={newStatus} onChange={(e) => setNewStatus(e.target.value)} aria-label="Status">
            <option>Present</option><option>Absent</option>
          </select>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
          </div>
        </Modal>
      )}
      {toDelete && <ConfirmDialog message={`Delete the record for ${toDelete.student?.name} on ${formatDate(toDelete.date)}?`} busy={busy} onConfirm={remove} onCancel={() => setToDelete(null)} />}
    </>
  );
}
