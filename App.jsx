import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute, { homeFor } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import UserManager from './pages/admin/UserManager';
import Courses from './pages/admin/Courses';
import Enrolments from './pages/admin/Enrolments';
import Reports from './pages/admin/Reports';
import FacultyCourses from './pages/faculty/FacultyCourses';
import StudentLists from './pages/faculty/StudentLists';
import MarkAttendance from './pages/faculty/MarkAttendance';
import AttendanceRecords from './pages/faculty/AttendanceRecords';
import StudentCourses from './pages/student/StudentCourses';
import MyAttendance from './pages/student/MyAttendance';
import Profile from './pages/student/Profile';

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={homeFor(user.role)} replace /> : <Login />} />

      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/students" element={<UserManager key="student" role="student" />} />
          <Route path="/admin/faculty" element={<UserManager key="faculty" role="faculty" />} />
          <Route path="/admin/courses" element={<Courses />} />
          <Route path="/admin/enrolments" element={<Enrolments />} />
          <Route path="/admin/announcements" element={<Announcements />} />
          <Route path="/admin/reports" element={<Reports />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="faculty" />}>
        <Route element={<Layout />}>
          <Route path="/faculty" element={<Dashboard />} />
          <Route path="/faculty/courses" element={<FacultyCourses />} />
          <Route path="/faculty/students" element={<StudentLists />} />
          <Route path="/faculty/attendance" element={<MarkAttendance />} />
          <Route path="/faculty/records" element={<AttendanceRecords />} />
          <Route path="/faculty/announcements" element={<Announcements />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="student" />}>
        <Route element={<Layout />}>
          <Route path="/student" element={<Dashboard />} />
          <Route path="/student/courses" element={<StudentCourses />} />
          <Route path="/student/attendance" element={<MyAttendance />} />
          <Route path="/student/announcements" element={<Announcements />} />
          <Route path="/student/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={user ? homeFor(user.role) : '/login'} replace />} />
    </Routes>
  );
}
