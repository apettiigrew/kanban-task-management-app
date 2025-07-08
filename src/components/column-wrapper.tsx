import React from 'react';

interface ColumnWrapperProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ref?: React.Ref<HTMLDivElement>; // Avoid conflict with reserved `ref` prop
}

export function ColumnWrapper(props: ColumnWrapperProps) {
  const { children, className = '', style, ref } = props;

  return (
    <div
      className={`
        bg-gray-50 text-[#1d1d1d] shadow-none rounded-[20px] p-4
        flex flex-col gap-4 border border-gray-200
        max-w-[260px] w-full max-h-[90vh] h-min
        ${className}
      `}
      style={style}
      ref={ref}
    >
      {children}
    </div>
  );
}