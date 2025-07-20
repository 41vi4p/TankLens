'use client';

import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { UserCircleIcon, ChartBarIcon, Cog6ToothIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export function Header({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for glass morphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${
      scrolled 
        ? 'bg-background/80 backdrop-blur-md shadow-sm' 
        : 'bg-background/50 backdrop-blur-sm'
    }`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl flex items-center gap-1 hover:opacity-80 transition-opacity">
          <span className="text-primary">Tank</span>
          <span>Lens</span>
        </Link>

        {/* Mobile: Show theme toggle only */}
        <div className="md:hidden">
          <ThemeToggle />
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link
                href="/about"
                className={`px-3 py-2 rounded-full flex items-center gap-1.5 transition-all hover:bg-secondary/50 ${
                  pathname === '/about' ? 'bg-secondary/70 text-primary font-medium' : ''
                }`}
              >
                <InformationCircleIcon className="h-4 w-4" />
                <span>About</span>
              </Link>
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-full flex items-center gap-1.5 transition-all hover:bg-secondary/50 ${
                  pathname === '/dashboard' ? 'bg-secondary/70 text-primary font-medium' : ''
                }`}
              >
                <ChartBarIcon className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/settings"
                className={`px-3 py-2 rounded-full flex items-center gap-1.5 transition-all hover:bg-secondary/50 ${
                  pathname === '/settings' ? 'bg-secondary/70 text-primary font-medium' : ''
                }`}
              >
                <Cog6ToothIcon className="h-4 w-4" />
                <span>Settings</span>
              </Link>
              <div className="h-6 w-px bg-border/60 mx-1"></div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-full bg-secondary/60 hover:bg-secondary/90 transition-all flex items-center gap-1.5"
              >
                <UserCircleIcon className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/about"
                className={`px-3 py-2 rounded-full flex items-center gap-1.5 transition-all hover:bg-secondary/50 ${
                  pathname === '/about' ? 'bg-secondary/70 text-primary font-medium' : ''
                }`}
              >
                <InformationCircleIcon className="h-4 w-4" />
                <span>About</span>
              </Link>
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5"
              >
                <UserCircleIcon className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            </>
          )}
          <div className="ml-1">
            <ThemeToggle />
          </div>
        </nav>
      </div>

    </header>
  );
}