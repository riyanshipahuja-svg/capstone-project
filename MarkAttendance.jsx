import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import useFetch, { todayISO } from '../../utils/useFetch';
import { Badge, Button, Card, ErrorBox, PageHeader, Spinner, inputClass } from '../../components/ui';

export default function MarkAttendance() {
  const toast = useToast();
  const [params] = useSearchParams();
  const [courseId, setCourseId] = useState(params.get('course') || '');
  const [date, setDate] = useState(todayISO());
  const [choices, setChoices] = useState({});
  const [saving, setSaving] = useState(false);

  const courses = useFetch(() => api.get('/courses', { params: { limit: 100 } }), []);
  const sheet = useFetch(
    () => (courseId && date ? api.get('/attendance/sheet', { params: { course: courseId, date } }) : Promise.resolve({ data: { data: null } })),
    [courseId, date]
  );

  useEffect(() => { if (!courseId && courses.data?.length) setCourseId(courses.data[0]._id); }, [courses.data, courseId]);

  // Pre-fill the form: already recorded students show their saved status, others default to Present.
  useEffect(() => {
    if (!sheet.data) return;
    setChoices(Object.fromEntries(sheet.data.rows.map((r) => [r.studentId, r.status || 'Present'])));
  }, [sheet.data]);

  const rows = sheet.data?.rows || [];
  const setAll = (status) => setChoices(Object.fromEntries(rows.map((r) => [r.studentId, status])));
  const counts = Object.values(choices).reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {});

  const save = async () => {
    setSaving(true);
    try {
      const fresh = rows.filter((r) => !r.attendanceId);
      const changed = rows.filter((r) => r.attendanceId && choices[r.studentId] !== r.status);
      if (fresh.length) {
        await api.post('/attendance', {
          courseId, date, records: fresh.map((r) => ({ studentId: r.studentId, status: choices[r.studentId] })),
        });
      }
      await Promise.all(changed.map((r) => api.put(`/attendance/${r.attendanceId}`, { status: choices[r.studentId] })));
      toast.success(`Attendance saved (${fresh.length} new, ${changed.length} updated)`);
      sheet.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const unsaved = rows.filter((r) => !r.attendanceId).length + rows.filter((r) => r.attendanceId && choices[r.studentId] !== r.status).length;

  return (
    <>
      <PageHeader title="Mark Attendance" subtitle="Select a course and date, then mark each student present or absent." />
      <ErrorBox message={courses.error} />
      {courses.data?.length === 0 && <Card><p className="text-center text-sm text-slate-500">No courses are assigned to you.</p></Card>}
      {courses.data?.length > 0 && (
        <Card>
          <div className="mb-5 flex flex-wrap items-end gap-4">
            <label className="text-sm font-medium text-slate-700">Course
              <select className={`${inputClass} mt-1 sm:w-80`} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                {courses.data.map((c) => <option key={c._id} value={c._id}>{c.courseCode} - {c.courseName}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">Date
              <input type="date" max={todayISO()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className={`${inputClass} mt-1`} />
            </label>
          </div>

          {sheet.loading && <Spinner />}
          <ErrorBox message={sheet.error} onRetry={sheet.reload} />
          {sheet.data && !sheet.loading && (
            <>
              {rows.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No students are enrolled in this course.</p> : (
                <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">
                      Present: <strong>{counts.Present || 0}</strong> · Absent: <strong>{counts.Absent || 0}</strong>
                    </p>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setAll('Present')}>All present</Button>
                      <Button variant="secondary" onClick={() => setAll('Absent')}>All absent</Button>
                    </div>
                  </div>
                  <ul className="divide-y divide-slate-100 rounded border border-slate-200">
                    {rows.map((r) => (
                      <li key={r.studentId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <p className="font-medium text-ink">{r.name}</p>
                          <p className="text-xs text-slate-500">{r.rollNumber} {r.attendanceId && <Badge tone="brand">Already recorded</Badge>}</p>
                        </div>
                        <div className="inline-flex overflow-hidden rounded border border-slate-300 text-sm" role="group" aria-label={`Attendance for ${r.name}`}>
                          {['Present', 'Absent'].map((s) => (
                            <button key={s} type="button" aria-pressed={choices[r.studentId] === s}
                              onClick={() => setChoices({ ...choices, [r.studentId]: s })}
                              className={`px-4 py-1.5 ${choices[r.studentId] === s ? (s === 'Present' ? 'bg-green-600 text-white' : 'bg-red-600 text-white') : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{s}</button>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-end gap-3">
                    <span className="text-sm text-slate-500">{unsaved ? `${unsaved} change(s) to save` : 'Everything is saved'}</span>
                    <Button onClick={save} disabled={saving || unsaved === 0}>{saving ? 'Saving...' : 'Save attendance'}</Button>
                  </div>
                </>
              )}
            </>
          )}
        </Card>
      )}
    </>
  );
}
