import { MindmapCanvas } from '@/widgets/mindmap/MindmapCanvas';
import { writingHubSchema } from './writing.schema';

export default function WritingHubPage() {
  return (
    <main className="min-h-screen bg-neutral-50 pt-6">
      <MindmapCanvas schema={writingHubSchema} />
    </main>
  );
}