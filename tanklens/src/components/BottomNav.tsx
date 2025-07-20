'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { HomeIcon, ChartBarIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, ChartBarIcon as ChartBarIconSolid, Cog6ToothIcon as Cog6ToothIconSolid, InformationCircleIcon as InformationCircleIconSolid } from '@heroicons/react/24/solid';

export function BottomNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: HomeIcon,
      activeIcon: HomeIconSolid
    },
    {
      href: '/about',
      label: 'About',
      icon: InformationCircleIcon,
      activeIcon: InformationCircleIconSolid
    },
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: ChartBarIcon,
      activeIcon: ChartBarIconSolid
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Cog6ToothIcon,
      activeIcon: Cog6ToothIconSolid
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 shadow-lg">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = isActive ? item.activeIcon : item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px] ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-foreground/70 hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <IconComponent className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px] text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}