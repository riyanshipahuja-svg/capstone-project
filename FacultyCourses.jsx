import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import useFetch from '../../utils/useFetch';
import { Button, Card, DataTable, ErrorBox, Modal, PageHeader, Spinner } from '../../components/ui';

export default function FacultyCourses() {
  const courses = useFetch(() => api.get('/courses', { params: { limit: 100 } }), []);
  const [viewing, setViewing] = useState(null);
  const students = useFetch(() => (viewing ? api.get(`/courses/${viewing._id}/students`) : Promise.resolve({ data: { data: [] } })), [viewing?._id]);

  return (
    <>
      <PageHeader title="Assigned Courses" subtitle="Courses you teach this semester." />
      {courses.loading && <Spinner />}
      <ErrorBox message={courses.error} onRetry={courses.reload} />
      {courses.data?.length === 0 && <Card><p className="text-center text-sm text-slate-500">No courses have been assigned to you yet.</p></Card>}
      <div className="grid gap-4 md:grid-cols-2">
        {courses.data?.map((c) => (
          <Card key={c._id}>
            <p className="text-xs font-semibold text-brand">{c.courseCode}</p>
            <h3 className="text-lg font-semibold text-ink">{c.courseName}</h3>
            <p className="mt-1 text-sm text-slate-600">{c.description || 'No description provided.'}</p>
            <p className="mt-3 text-sm text-slate-500">{c.studentCount} enrolled student(s)</p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => setViewing(c)}>View students</Button>
              <Link to={`/faculty/attendance?course=${c._id}`}><Button>Mark attendance</Button></Link>
            </div>
          </Card>
        ))}
      </div>
      {viewing && (
        <Modal title={`${viewing.courseCode} - enrolled students`} onClose={() => setViewing(null)} wide>
          <ErrorBox message={students.error} />
          <DataTable rows={students.data || []} loading={students.loading} empty="No students enrolled."
            columns={[{ header: 'Roll no.', key: 'rollNumber' }, { header: 'Name', key: 'name' }, { header: 'Email', key: 'email' }, { header: 'Department', key: 'department' }]} />
        </Modal>
      )}
    </>
  );
}
