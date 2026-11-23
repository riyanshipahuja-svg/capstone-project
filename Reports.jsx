import { useState } from 'react';
import api from '../../api/client';
import useFetch from '../../utils/useFetch';
import { Badge, Card, DataTable, ErrorBox, PageHeader, Spinner, StatCard, inputClass, percentTone } from '../../components/ui';

const TABS = [['students', 'Student-wise attendance'], ['courses', 'Course-wise attendance'], ['enrolment', 'Enrolment statistics']];

export default function Reports() {
  const [tab, setTab] = useState('students');
  const [course, setCourse] = useState('');
  const [lowOnly, setLowOnly] = useState(false);

  const courses = useFetch(() => api.get('/courses', { params: { limit: 100 } }), []);
  const students = useFetch(
    () => api.get('/reports/attendance/students', { params: { course: course || undefined, below: lowOnly ? 75 : undefined } }),
    [course, lowOnly]
  );
  const courseWise = useFetch(() => api.get('/reports/attendance/courses'), []);
  const enrolment = useFetch(() => api.get('/reports/enrollment'), []);

  const pct = (p) => <Badge tone={percentTone(p)}>{p}%</Badge>;

  return (
    <>
      <PageHeader title="Reports" subtitle="Generated from MongoDB aggregation pipelines." />
      <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === key ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{label}</button>
        ))}
      </div>

      {tab === 'students' && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <select className={`${inputClass} sm:w-64`} value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Filter by course">
              <option value="">All courses</option>
              {courses.data?.map((c) => <option key={c._id} value={c._id}>{c.courseCode} - {c.courseName}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="h-4 w-4 accent-[#1f6f78]" />
              Show only students below 75%
            </label>
          </div>
          <ErrorBox message={students.error} onRetry={students.reload} />
          <DataTable rowKey="_k" loading={students.loading} rows={(students.data || []).map((r, i) => ({ ...r, _k: i }))}
            empty="No attendance data for this filter."
            columns={[
              { header: 'Roll no.', key: 'rollNumber' }, { header: 'Student', key: 'studentName' },
              { header: 'Course', render: (r) => `${r.courseCode} - ${r.courseName}` },
              { header: 'Classes', key: 'totalClasses' }, { header: 'Attended', key: 'attended' },
              { header: 'Percentage', render: (r) => pct(r.percentage) },
            ]} />
        </Card>
      )}

      {tab === 'courses' && (
        <Card>
          <ErrorBox message={courseWise.error} onRetry={courseWise.reload} />
          <DataTable loading={courseWise.loading} rows={courseWise.data || []} rowKey="courseId" empty="No attendance has been recorded yet."
            columns={[
              { header: 'Course', render: (r) => `${r.courseCode} - ${r.courseName}` },
              { header: 'Sessions', key: 'totalSessions' }, { header: 'Students tracked', key: 'studentsTracked' },
              { header: 'Present / Total', render: (r) => `${r.presentRecords} / ${r.totalRecords}` },
              { header: 'Average attendance', render: (r) => pct(r.averagePercentage) },
            ]} />
        </Card>
      )}

      {tab === 'enrolment' && (
        <>
          <ErrorBox message={enrolment.error} onRetry={enrolment.reload} />
          {enrolment.loading && <Spinner />}
          {enrolment.data && (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Courses" value={enrolment.data.summary.totalCourses} />
                <StatCard label="Total enrolments" value={enrolment.data.summary.totalEnrolments} />
                <StatCard label="Average per course" value={enrolment.data.summary.averagePerCourse} />
                <StatCard label="Courses without faculty" value={enrolment.data.summary.unassignedCourses} tone={enrolment.data.summary.unassignedCourses ? 'amber' : 'green'} />
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                <Card title="Enrolment by course" className="lg:col-span-2">
                  <DataTable rowKey="courseId" rows={enrolment.data.courses}
                    columns={[
                      { header: 'Course', render: (r) => `${r.courseCode} - ${r.courseName}` }, { header: 'Faculty', key: 'faculty' },
                      { header: 'Enrolled', render: (r) => <span className="font-semibold">{r.enrolledStudents}</span> },
                    ]} />
                </Card>
                <Card title="Enrolments by student department">
                  <DataTable rowKey="department" rows={enrolment.data.byDepartment}
                    columns={[{ header: 'Department', key: 'department' }, { header: 'Enrolments', key: 'enrolments' }]} />
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
