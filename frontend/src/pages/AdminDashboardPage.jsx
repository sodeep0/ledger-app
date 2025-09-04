import { useEffect, useMemo, useState } from 'react';
import { adminListUsers, adminUpdateUserApproval } from '../services/apiService';
import AlertDialog from '../components/AlertDialog';

const badgeClass = (status) => {
  if (status === 'approved') return 'bg-green-100 text-green-800';
  if (status === 'rejected') return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
};

const AdminDashboardPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [alert, setAlert] = useState({ open: false, title: '', message: '' });

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminListUsers();
      setUsers(data);
    } catch (e) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    return users
      .filter((u) => u.role !== 'admin')
      .filter((u) => {
        const matchesText = `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' ? true : u.approvalStatus === filter;
        return matchesText && matchesFilter;
      });
  }, [users, search, filter]);

  const updateApproval = async (id, status) => {
    setUpdatingId(id);
    try {
      const { data } = await adminUpdateUserApproval(id, status);
      await fetchUsers();
      try {
        const el = document.createElement('div');
        const emailMsg = data?.emailNotification === 'sent' ? ' Email sent.' : (data?.emailNotification === 'failed' ? ' Email failed to send.' : '');
        el.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50';
        el.textContent = `Status updated to "${status}".${emailMsg}`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
      } catch {}
    } catch (e) {
      setAlert({ open: true, title: 'Update Failed', message: 'Failed to update user status. Please try again.' });
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="border rounded-md px-3 py-2 text-sm"
          />
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button onClick={fetchUsers} className="px-3 py-2 text-sm bg-gray-100 rounded-md">Refresh</button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-500">Loading users...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-500">No users found</td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{u.role}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${badgeClass(u.approvalStatus)}`}>{u.approvalStatus}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex gap-2 justify-end">
                      <button
                        disabled={updatingId === u._id || u.approvalStatus === 'approved'}
                        onClick={() => updateApproval(u._id, 'approved')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium text-white ${updatingId === u._id ? 'bg-green-300' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-50`}
                      >
                        Approve
                      </button>
                      <button
                        disabled={updatingId === u._id || u.approvalStatus === 'pending'}
                        onClick={() => updateApproval(u._id, 'pending')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium text-white ${updatingId === u._id ? 'bg-yellow-300' : 'bg-yellow-600 hover:bg-yellow-700'} disabled:opacity-50`}
                      >
                        Set Pending
                      </button>
                      <button
                        disabled={updatingId === u._id || u.approvalStatus === 'rejected'}
                        onClick={() => updateApproval(u._id, 'rejected')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium text-white ${updatingId === u._id ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <AlertDialog
        isOpen={alert.open}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ open: false, title: '', message: '' })}
      />
    </div>
  );
};

export default AdminDashboardPage;


