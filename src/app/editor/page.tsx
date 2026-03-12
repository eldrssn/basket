'use client';

import dynamic from 'next/dynamic';

const LevelEditor = dynamic(
  () => import('@/widgets/level-editor/ui/LevelEditor'),
  { ssr: false },
);

export default function EditorPage() {
  return <LevelEditor />;
}
