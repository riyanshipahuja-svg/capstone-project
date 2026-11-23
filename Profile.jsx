import api from '../../api/client';
import useFetch, { formatDate } from '../../utils/useFetch';
import { Card, ErrorBox, PageHeader, Spinner } from '../../components/ui';

export default function Profile() {
  const me = useFetch(() => api.get('/auth/me'), []);
  const u = me.data;
  const rows = u && [
    ['Full name', u.name], ['Roll number', u.rollNumber], ['Email', u.email], ['Department', u.department],
    ['Phone', u.phone || '-'], ['Role', u.role], ['Member since', formatDate(u.createdAt)],
  ];
  return (
    <>
      <PageHeader title="My Profile" subtitle="Your account details. Contact the administrator to change them." />
      {me.loading && <Spinner />}
      <ErrorBox message={me.error} onRetry={me.reload} />
      {u && (
        <Card className="max-w-2xl">
          <dl className="divide-y divide-slate-100">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-3 gap-4 py-3 text-sm">
                <dt className="text-slate-500">{k}</dt>
                <dd className="col-span-2 font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}
    </>
  );
}
