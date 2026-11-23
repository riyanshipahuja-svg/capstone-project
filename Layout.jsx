import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/useFetch';
import { Button } from './ui';

const NAV = {
  admin: [
    ['/admin', 'Dashboard', true], ['/admin/students', 'Students'], ['/admin/faculty', 'Faculty'],
    ['/admin/courses', 'Courses'], ['/admin/enrolments', 'Enrolments'],
    ['/admin/announcements', 'Announcements'], ['/admin/reports', 'Reports'],
  ],
  faculty: [
    ['/faculty', 'Dashboard', true], ['/faculty/courses', 'Assigned Courses'], ['/faculty/students', 'Student Lists'],
    ['/faculty/attendance', 'Mark Attendance'], ['/faculty/records', 'Attendance Records'],
    ['/faculty/announcements', 'Announcements'],
  ],
  student: [
    ['/student', 'Dashboard', true], ['/student/courses', 'My Courses'], ['/student/attendance', 'My Attendance'],
    ['/student/announcements', 'Announcements'], ['/student/profile', 'Profile'],
  ],
};

export default function Layout() {
  const { user, logout, notifications, clearNotifications } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="min-h-screen lg:flex">
      {open && <div className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-ink text-slate-200 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-lg font-semibold text-white">Campus Manager</p>
          <p className="text-xs text-slate-400 capitalize">{user.role} portal</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV[user.role].map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
              className={({ isActive }) => `block rounded px-3 py-2 text-sm ${isActive ? 'bg-brand text-white' : 'text-slate-300 hover:bg-ink-soft hover:text-white'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <button className="rounded p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5h14M3 10h14M3 15h14" /></svg>
          </button>
          <span className="hidden text-sm text-slate-500 lg:block">University Campus Management System</span>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setBell((b) => !b)} className="relative rounded p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" /></svg>
                {notifications.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">{notifications.length}</span>
                )}
              </button>
              {bell && (
                <div className="absolute right-0 mt-2 w-80 max-w-[85vw] rounded-lg border border-slate-200 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
                    <span className="text-sm font-semibold text-ink">Live notifications</span>
                    {notifications.length > 0 && <button className="text-xs text-brand underline" onClick={clearNotifications}>Clear</button>}
                  </div>
                  <ul className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No new notifications</li>}
                    {notifications.map((n) => (
                      <li key={n.id} className="border-b border-slate-100 px-4 py-2 text-sm last:border-0">
                        <p>{n.text}</p>
                        <p className="text-xs text-slate-400">{formatDateTime(n.time)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-ink">{user.name}</p>
              <p className="text-xs capitalize text-slate-500">{user.role}</p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
