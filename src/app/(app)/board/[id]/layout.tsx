import { TaskDialogProvider } from '@/contexts/task-dialog-context';
import { SettingsContextProvider } from '@/providers/settings-context';

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function RootLayout({ children, params: _params }: RootLayoutProps) {
  return (
    <TaskDialogProvider>
      <SettingsContextProvider>
        {children}
      </SettingsContextProvider>
    </TaskDialogProvider>
  );
}
