import { SettingsContextProvider } from '@/providers/settings-context';

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  return (
    <SettingsContextProvider>
      {children}
    </SettingsContextProvider>
  );
}
