import React, { useEffect, useRef, useState } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

interface PlaceholderCardProps {
  columnId: string;
  className?: string;
}

export function PlaceholderCard({ columnId, className }: PlaceholderCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isAboutToDrop, setIsAboutToDrop] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    dropTargetForElements({
      element,
      getData() {
        return {
          id: 'placeholder',
          position: 0,
          columnId: columnId,
        };
      },
      onDragEnter: () => setIsAboutToDrop(true),
      onDragLeave: () => setIsAboutToDrop(false),
      onDrop: () => setIsAboutToDrop(false),
    });
  }, [columnId]);

  return (
    <div
      ref={ref}
      data-test-id={columnId}
      className={`rounded-md h-[50px] w-full transition-all duration-200 ${
        isAboutToDrop ? 'bg-gray-200 opacity-100' : 'opacity-0'
      } ${className || ''}`}
    >
      <div className="w-full h-full" />
    </div>
  );
}