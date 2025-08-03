import { ReactNode } from 'react';


interface RenderIfProps {
    condition: boolean;
    children: ReactNode;
}

export function RenderIf(props: RenderIfProps) {
  const { condition, children } = props;
  return condition ? children : null;
}