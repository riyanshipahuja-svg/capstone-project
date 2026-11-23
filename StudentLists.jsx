import { useEffect, useState } from 'react';
import api from '../../api/client';
import useFetch from '../../utils/useFetch';
import { Card, DataTable, ErrorBox, PageHeader, SearchBox, Spinner, inputClass } from '../../components/ui';

export default function StudentLists() {
  const [courseId, setCourseId] = useState('');
  const [q, setQ] = useState('');
  const courses = useFetch(() => api.get('/courses', { params: { limit: 100 } }), []);
  const students = useFetch(() => (courseId ? api.get(`/courses/${courseId}/students`) : Promise.resolve({ data: { data: [] } })), [courseId]);

  useEffect(() => { if (!courseId && courses.data?.length) setCourseId(courses.data[0]._id); }, [courses.data, courseId]);

  const rows = (students.data || []).filter((s) => `${s.name} ${s.rollNumber} ${s.email}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Student Lists" subtitle="Students enrolled in each of your courses." />
      {courses.loading && <Spinner />}
      <ErrorBox message={courses.error || students.error} />
      {courses.data?.length === 0 && <Card><p className="text-center text-sm text-slate-500">No courses are assigned to you.</p></Card>}
      {courses.data?.length > 0 && (
        <Card>
          <div className="mb-4 flex flex-wrap gap-3">
            <select className={`${inputClass} sm:w-80`} value={courseId} onChange={(e) => setCourseId(e.target.value)} aria-label="Course">
              {courses.data.map((c) => <option key={c._id} value={c._id}>{c.courseCode} - {c.courseName}</option>)}
            </select>
            <SearchBox value={q} onChange={setQ} placeholder="Search students" />
          </div>
          <DataTable rows={rows} loading={students.loading} empty="No students found."
            columns={[
              { header: 'Roll no.', key: 'rollNumber' }, { header: 'Name', render: (s) => <span className="font-medium text-ink">{s.name}</span> },
              { header: 'Email', key: 'email' }, { header: 'Department', key: 'department' }, { header: 'Phone', render: (s) => s.phone || '-' },
            ]} />
        </Card>
      )}
    </>
  );
}
