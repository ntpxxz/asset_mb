import '../globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';


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

    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>


  );
}