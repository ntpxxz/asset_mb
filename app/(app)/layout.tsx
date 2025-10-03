import '../globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

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

    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
          <Toaster position="top-center" richColors closeButton />
        </main>
      </div>
    </div>


  );
}