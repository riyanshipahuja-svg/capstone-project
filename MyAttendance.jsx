import { useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import useFetch, { formatDate } from '../../utils/useFetch';
import { Badge, Card, DataTable, ErrorBox, PageHeader, Pagination, Spinner, StatCard, inputClass, percentTone } from '../../components/ui';

export default function MyAttendance() {
  const { liveTick } = useAuth();
  const [course, setCourse] = useState('');
  const [page, setPage] = useState(1);
  const summary = useFetch(() => api.get('/attendance/my'), [liveTick]);
  const records = useFetch(() => api.get('/attendance', { params: { page, limit: 10, course: course || undefined } }), [page, course, liveTick]);

  const o = summary.data?.overall;
  return (
    <>
      <PageHeader title="My Attendance" subtitle="Subject-wise attendance, calculated by the server." />
      {summary.loading && <Spinner />}
      <ErrorBox message={summary.error} onRetry={summary.reload} />
      {o && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total classes" value={o.totalClasses} />
          <StatCard label="Classes attended" value={o.classesAttended} />
          <StatCard label="Overall attendance" value={`${o.percentage}%`} tone={percentTone(o.percentage) === 'green' ? 'green' : percentTone(o.percentage) === 'amber' ? 'amber' : 'red'} />
        </div>
      )}
      {summary.data && (
        <Card title="Subject-wise attendance" className="mb-6">
          <DataTable rowKey="courseId" rows={summary.data.courses} empty="No attendance has been recorded yet."
            columns={[
              { header: 'Course', render: (c) => `${c.courseCode} - ${c.courseName}` },
              { header: 'Total classes', key: 'totalClasses' }, { header: 'Attended', key: 'classesAttended' },
              { header: 'Percentage', render: (c) => <Badge tone={percentTone(c.percentage)}>{c.percentage}%</Badge> },
              { header: 'Status', render: (c) => (c.percentage >= 75 ? 'Satisfactory' : 'Below 75% requirement') },
            ]} />
        </Card>
      )}
      <Card title="Attendance history" action={
        <select className={`${inputClass} w-56`} value={course} onChange={(e) => { setCourse(e.target.value); setPage(1); }} aria-label="Filter by course">
          <option value="">All courses</option>
          {summary.data?.courses.map((c) => <option key={c.courseId} value={c.courseId}>{c.courseCode}</option>)}
        </select>}>
        <ErrorBox message={records.error} onRetry={records.reload} />
        <DataTable rows={records.data || []} loading={records.loading} empty="No attendance records yet."
          columns={[
            { header: 'Date', render: (r) => formatDate(r.date) }, { header: 'Course', render: (r) => `${r.course?.courseCode} - ${r.course?.courseName}` },
            { header: 'Marked by', render: (r) => r.faculty?.name },
            { header: 'Status', render: (r) => <Badge tone={r.status === 'Present' ? 'green' : 'red'}>{r.status}</Badge> },
          ]} />
        <Pagination meta={records.meta} onChange={setPage} />
      </Card>
    </>
  );
}
