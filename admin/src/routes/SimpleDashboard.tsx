import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '@/hooks';

export function SimpleDashboard() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-semibold">Rezom Admin</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button 
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
          <p className="text-gray-600 mb-6">Welcome to Rezom Admin Panel</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link 
              to="/questions"
              className="bg-blue-50 p-4 rounded-lg text-left hover:bg-blue-100 block transition-colors"
            >
              <h3 className="font-medium text-blue-900">Manage Questions</h3>
              <p className="text-sm text-blue-700">Create and edit questions</p>
            </Link>
            <Link 
              to="/top5"
              className="bg-green-50 p-4 rounded-lg text-left hover:bg-green-100 block transition-colors"
            >
              <h3 className="font-medium text-green-900">Top-5 Manager</h3>
              <p className="text-sm text-green-700">Manage featured questions</p>
            </Link>
            <button className="bg-purple-50 p-4 rounded-lg text-left hover:bg-purple-100">
              <h3 className="font-medium text-purple-900">System Status</h3>
              <p className="text-sm text-purple-700">View system health</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
