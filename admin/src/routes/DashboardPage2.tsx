import { AdminLayout } from '@/components/AdminLayout';

export function DashboardPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to Rezom Admin Panel</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm font-medium text-gray-600">Total Questions</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm font-medium text-gray-600">Active Keywords</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Admin Panel Status</h2>
          <p className="text-green-600">✓ Admin panel is working</p>
          <p className="text-green-600">✓ Authentication system active</p>
          <p className="text-green-600">✓ Ready for content management</p>
        </div>
      </div>
    </AdminLayout>
  );
}
