import { MindmapCanvas } from '@/widgets/mindmap/MindmapCanvas';
import { profileSchema } from './profile.schema';

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-neutral-50 pt-6">
      <MindmapCanvas schema={profileSchema} />
    </main>
  );
}