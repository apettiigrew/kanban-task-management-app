'use client';

import { DeviceInfoProvider } from "./device-info-provider";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { MarkdownEditorProvider } from './markdown-editor-provider';


export function Providers({ children }: { children: React.ReactNode }) {
  // Create a client for each request in client components
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <DeviceInfoProvider>
        <MarkdownEditorProvider>
          {children}
        </MarkdownEditorProvider>
      </DeviceInfoProvider>
    </QueryClientProvider>
  );
} 