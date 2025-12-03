import './globals.css';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google'; // Added Outfit for more modern look
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { I18nProvider } from '@/lib/i18n-context';

const inter = Inter({ subsets: ['latin'] });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'AssetFlow - IT Asset Management',
  description: 'Complete IT Asset Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${outfit.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            {children}
            <Toaster position="top-center" richColors closeButton />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}