import React from 'react';

interface SelfiePreviewProps {
  src: string;
  offset: { x: number; y: number };
  scale: number;
  size?: number; // pixel size of the circular frame
  className?: string;
}

export const SelfiePreview: React.FC<SelfiePreviewProps> = ({
  src,
  offset,
  scale,
  size = 256,
  className = '',
}) => {
  return (
    <div
      className={`relative rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt="Selfie preview"
          className="w-full h-full object-cover pointer-events-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: 'transform 0.1s',
          }}
        />
      ) : null}
    </div>
  );
};
