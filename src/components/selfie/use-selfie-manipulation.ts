import { useRef, useState } from 'react';

export interface Offset {
  x: number;
  y: number;
}

export function useSelfieManipulation(initialOffset: Offset = { x: 0, y: 0 }, initialScale = 1) {
  const [offset, setOffset] = useState<Offset>(initialOffset);
  const [scale, setScale] = useState(initialScale);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, lastX: 0, lastY: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    dragState.current.dragging = true;
    dragState.current.startX = e.clientX;
    dragState.current.startY = e.clientY;
    dragState.current.lastX = offset.x;
    dragState.current.lastY = offset.y;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset({
      x: dragState.current.lastX + dx,
      y: dragState.current.lastY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    dragState.current.dragging = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return {
    offset,
    setOffset,
    scale,
    setScale,
    dragRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
