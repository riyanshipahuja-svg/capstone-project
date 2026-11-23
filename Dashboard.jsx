import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import useFetch, { formatDate } from '../utils/useFetch';
import { Badge, Card, ErrorBox, PageHeader, Spinner, StatCard, percentTone } from '../components/ui';

export default function Dashboard() {
  const { user, liveTick } = useAuth();
  const stats = useFetch(() => api.get('/reports/dashboard'), [liveTick]);
  const recent = useFetch(() => api.get('/announcements', { params: { limit: 4 } }), [liveTick]);
  const summary = useFetch(() => (user.role === 'student' ? api.get('/attendance/my') : Promise.resolve({ data: { data: null } })), [liveTick]);

  const d = stats.data;
  let cards = [];
  if (d?.role === 'admin') {
    cards = [
      ['Students', d.students], ['Faculty', d.faculty], ['Courses', d.courses],
      ['Enrolments', d.enrolments], ['Announcements', d.announcements],
      ['Overall attendance', `${d.overallAttendance}%`, percentTone(d.overallAttendance)],
    ];
  } else if (d?.role === 'faculty') {
    cards = [
      ['My courses', d.courses], ['My students', d.students], ['Classes held', d.classesHeld],
      ['Announcements posted', d.announcements], ['Average attendance', `${d.averageAttendance}%`, percentTone(d.averageAttendance)],
    ];
  } else if (d?.role === 'student') {
    cards = [
      ['Enrolled courses', d.courses], ['Total classes', d.totalClasses], ['Classes attended', d.classesAttended],
      ['Overall attendance', `${d.percentage}%`, percentTone(d.percentage)],
      ['Courses below 75%', d.coursesBelow75, d.coursesBelow75 ? 'red' : 'green'],
    ];
  }
  const toneOf = (t) => (t === 'green' ? 'green' : t === 'amber' ? 'amber' : t === 'red' ? 'red' : 'brand');

  return (
    <>
      <PageHeader title={`Welcome, ${user.name}`} subtitle="Live figures from the university database." />
      {stats.loading && <Spinner />}
      <ErrorBox message={stats.error} onRetry={stats.reload} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, tone]) => <StatCard key={label} label={label} value={value} tone={toneOf(tone)} />)}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {summary.data && (
          <Card title="Attendance by subject" action={<Link className="text-sm text-brand underline" to="/student/attendance">Details</Link>}>
            {summary.data.courses.length === 0 && <p className="text-sm text-slate-500">No attendance recorded yet.</p>}
            <ul className="space-y-3">
              {summary.data.courses.map((c) => (
                <li key={c.courseId}>
                  <div className="mb-1 flex justify-between text-sm"><span>{c.courseCode} {c.courseName}</span><Badge tone={percentTone(c.percentage)}>{c.percentage}%</Badge></div>
                  <div className="h-2 rounded bg-slate-100"><div className={`h-2 rounded ${c.percentage >= 75 ? 'bg-green-600' : c.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${c.percentage}%` }} /></div>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Card title="Latest announcements" action={<Link className="text-sm text-brand underline" to={`/${user.role}/announcements`}>View all</Link>}>
          {recent.loading && <Spinner />}
          <ErrorBox message={recent.error} />
          {recent.data?.length === 0 && <p className="text-sm text-slate-500">No announcements yet.</p>}
          <ul className="divide-y divide-slate-100">
            {recent.data?.map((a) => (
              <li key={a._id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{a.title}</p>
                  <Badge tone={a.target === 'university' ? 'brand' : 'amber'}>{a.target === 'university' ? 'University' : a.course?.courseCode}</Badge>
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{a.message}</p>
                <p className="mt-1 text-xs text-slate-400">{a.createdBy?.name} · {formatDate(a.createdAt)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
