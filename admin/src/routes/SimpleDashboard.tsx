import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';

export function SimpleDashboard() {
  const dashboardItems = [
    {
      title: 'Manage Questions',
      description: 'Create and edit questions',
      href: '/questions',
      color: 'blue'
    },
    {
      title: 'Language Definition Top-5',
      description: 'Manage top-5 language definition questions',
      href: '/language-definition-top5',
      color: 'blue'
    },
    {
      title: 'Analyze World Top-5',
      description: 'Manage top-5 analyze world questions',
      href: '/analyze-world-top5',
      color: 'purple'
    },
    {
      title: "Today's Question",
      description: 'Set and manage daily questions',
      href: '/todays-question',
      color: 'green'
    },
    {
      title: 'Analyze World Questions',
      description: 'Manage analysis questions',
      href: '/analyze-world',
      color: 'orange'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-900',
    green: 'bg-green-50 hover:bg-green-100 text-green-900',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-900',
    orange: 'bg-orange-50 hover:bg-orange-100 text-orange-900',
    gray: 'bg-gray-50 hover:bg-gray-100 text-gray-900',
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
              <div className="flex items-start">
                <div className="flex-1">
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
