import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import useFetch from '../../utils/useFetch';
import { Button, Card, ConfirmDialog, DataTable, ErrorBox, PageHeader, SearchBox, Spinner, inputClass } from '../../components/ui';

export default function Enrolments() {
  const toast = useToast();
  const [courseId, setCourseId] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [toRemove, setToRemove] = useState(null);

  const courses = useFetch(() => api.get('/courses', { params: { limit: 100 } }), []);
  const enrolled = useFetch(() => (courseId ? api.get(`/courses/${courseId}/students`) : Promise.resolve({ data: { data: [] } })), [courseId]);
  const allStudents = useFetch(() => api.get('/students', { params: { limit: 100 } }), []);

  useEffect(() => { if (!courseId && courses.data?.length) setCourseId(courses.data[0]._id); }, [courses.data, courseId]);
  useEffect(() => setSelected([]), [courseId]);

  const enrolledIds = new Set((enrolled.data || []).map((s) => s._id));
  const available = (allStudents.data || []).filter(
    (s) => !enrolledIds.has(s._id) && `${s.name} ${s.rollNumber} ${s.department}`.toLowerCase().includes(q.toLowerCase())
  );

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const enroll = async () => {
    setBusy(true);
    try {
      await api.post(`/courses/${courseId}/enroll`, { studentIds: selected });
      toast.success(`${selected.length} student(s) enrolled`);
      setSelected([]);
      enrolled.reload();
      courses.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const unenroll = async () => {
    setBusy(true);
    try {
      await api.delete(`/courses/${courseId}/enroll/${toRemove._id}`);
      toast.success(`${toRemove.name} removed from the course`);
      setToRemove(null);
      enrolled.reload();
      courses.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { header: 'Roll no.', key: 'rollNumber' },
    { header: 'Name', render: (s) => <span className="font-medium text-ink">{s.name}</span> },
    { header: 'Department', key: 'department' },
    { header: '', render: (s) => <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setToRemove(s)}>Remove</Button> },
  ];

  return (
    <>
      <PageHeader title="Manage Enrolments" subtitle="Enrol students in courses or remove them." />
      <ErrorBox message={courses.error || allStudents.error} />
      {courses.loading ? <Spinner /> : (
        <div className="mb-4 max-w-md">
          <label className="mb-1 block text-sm font-medium text-slate-700">Course</label>
          <select className={inputClass} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.data?.map((c) => <option key={c._id} value={c._id}>{c.courseCode} - {c.courseName} ({c.studentCount} enrolled)</option>)}
          </select>
        </div>
      )}
      {courseId && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title={`Enrolled students (${enrolled.data?.length ?? 0})`}>
            <ErrorBox message={enrolled.error} onRetry={enrolled.reload} />
            <DataTable columns={columns} rows={enrolled.data || []} loading={enrolled.loading} empty="No students enrolled yet." />
          </Card>
          <Card title="Add students" action={<Button disabled={!selected.length || busy} onClick={enroll}>{busy ? 'Enrolling...' : `Enrol selected (${selected.length})`}</Button>}>
            <div className="mb-3"><SearchBox value={q} onChange={setQ} placeholder="Search students" /></div>
            {allStudents.loading ? <Spinner /> : (
              <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto rounded border border-slate-200">
                {available.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">No students available to enrol.</li>}
                {available.map((s) => (
                  <li key={s._id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50">
                      <input type="checkbox" checked={selected.includes(s._id)} onChange={() => toggle(s._id)} className="h-4 w-4 accent-[#1f6f78]" />
                      <span className="font-medium text-ink">{s.name}</span>
                      <span className="text-slate-500">{s.rollNumber} · {s.department}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
      {toRemove && <ConfirmDialog title="Remove student" confirmLabel="Remove" message={`Remove ${toRemove.name} from this course?`} busy={busy} onConfirm={unenroll} onCancel={() => setToRemove(null)} />}
    </>
  );
}
