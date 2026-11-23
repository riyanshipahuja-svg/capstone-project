import api from '../../api/client';
import useFetch from '../../utils/useFetch';
import { Card, ErrorBox, PageHeader, Spinner } from '../../components/ui';

export default function StudentCourses() {
  const courses = useFetch(() => api.get('/courses', { params: { limit: 100 } }), []);
  return (
    <>
      <PageHeader title="My Courses" subtitle="Courses you are enrolled in." />
      {courses.loading && <Spinner />}
      <ErrorBox message={courses.error} onRetry={courses.reload} />
      {courses.data?.length === 0 && <Card><p className="text-center text-sm text-slate-500">You are not enrolled in any course yet.</p></Card>}
      <div className="grid gap-4 md:grid-cols-2">
        {courses.data?.map((c) => (
          <Card key={c._id}>
            <p className="text-xs font-semibold text-brand">{c.courseCode}</p>
            <h3 className="text-lg font-semibold text-ink">{c.courseName}</h3>
            <p className="mt-1 text-sm text-slate-600">{c.description || 'No description provided.'}</p>
            <p className="mt-3 text-sm text-slate-500">Faculty: {c.faculty ? `${c.faculty.name} (${c.faculty.department})` : 'Not assigned yet'}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
