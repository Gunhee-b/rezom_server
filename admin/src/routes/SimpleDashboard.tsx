import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';

export function SimpleDashboard() {
  const dashboardItems = [
    {
      title: 'Manage Questions',
      description: 'Create and edit questions',
      href: '/questions',
      color: 'blue',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Top-5 Manager',
      description: 'Manage featured questions',
      href: '/top5',
      color: 'green',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    {
      title: 'System Status',
      description: 'View system health and metrics',
      href: '#',
      color: 'purple',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-900',
    green: 'bg-green-50 hover:bg-green-100 text-green-900',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-900',
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600 mb-8">Welcome to Rezom Admin Panel</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className={`${colorClasses[item.color as keyof typeof colorClasses]} p-6 rounded-lg transition-colors block group`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium group-hover:text-current">{item.title}</h3>
                  <p className="text-sm opacity-75 mt-1">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">-</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">-</div>
              <div className="text-sm text-gray-600">Featured Questions</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">Online</div>
              <div className="text-sm text-gray-600">System Status</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
