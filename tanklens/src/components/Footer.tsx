'use client';

import Link from 'next/link';
import { HeartIcon } from '@heroicons/react/24/solid';

export function Footer() {
  return (
    <footer className="py-6 mt-auto bg-secondary/5 backdrop-blur-sm">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <p className="text-sm font-medium text-foreground/80">
            <span className="inline-flex items-center gap-1">
              Made with <HeartIcon className="h-4 w-4 text-red-500" /> by
              <Link 
                href="https://github.com/41vi4p" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors font-semibold ml-1"
              >
                David Porathur
              </Link>
            </span>
          </p>
          <p className="text-xs text-foreground/60">
             {new Date().getFullYear()} • TankLens IoT Water Monitoring Solution
          </p>
        </div>
      </div>
    </footer>
  );
}