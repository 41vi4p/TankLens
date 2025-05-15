'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={isAuthenticated} />
      
      <main className="flex-1 pt-16"> {/* Added pt-16 to account for fixed header */}
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/20">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-primary">Tank</span>Lens
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-foreground/80">
              Smart IoT-based Water Level Monitoring Tool
            </p>
            <p className="text-lg mb-12 max-w-2xl mx-auto">
              Monitor your water tanks in real-time, get insights about water usage, 
              and never run out of water again.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {isAuthenticated ? (
                <Link 
                  href="/dashboard" 
                  className="px-8 py-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-lg font-medium shadow-lg shadow-primary/30 animate-pulse hover:animate-none relative ring-2 ring-primary/50 group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75c-1.036 0-1.875-.84-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75C3.84 21.75 3 20.91 3 19.875v-6.75z" />
                    </svg>
                    Go to Dashboard
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></span>
                </Link>
              ) : (
                <Link 
                  href="/auth/login" 
                  className="px-8 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-lg font-medium"
                >
                  Get Started
                </Link>
              )}
              <a 
                href="#features" 
                className="px-8 py-3 rounded-md border border-border hover:bg-secondary transition-colors text-lg font-medium"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-20 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16">Key Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-8 w-8 text-primary" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Real-time Monitoring</h3>
                <p className="text-foreground/70">
                  Track water levels in real-time and visualize the data with interactive charts.
                </p>
              </div>
              
              <div className="card text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-8 w-8 text-primary" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Easy Management</h3>
                <p className="text-foreground/70">
                  Add, calibrate, and manage multiple water tanks from a single dashboard.
                </p>
              </div>
              
              <div className="card text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-8 w-8 text-primary" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Secure Authentication</h3>
                <p className="text-foreground/70">
                  Secure your data with Google Sign-in authentication.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-20 px-4 bg-secondary/30">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
            
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <div className="absolute left-9 top-0 h-full w-1 bg-border"></div>
                
                <div className="mb-12 relative">
                  <div className="absolute left-0 top-0 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold">
                    1
                  </div>
                  <div className="ml-16">
                    <h3 className="text-xl font-bold mb-2">Install Sensor</h3>
                    <p className="text-foreground/70">
                      Set up your IoT water level sensor on your water tank. It's simple and requires no technical expertise.
                    </p>
                  </div>
                </div>
                
                <div className="mb-12 relative">
                  <div className="absolute left-0 top-0 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold">
                    2
                  </div>
                  <div className="ml-16">
                    <h3 className="text-xl font-bold mb-2">Connect to TankLens</h3>
                    <p className="text-foreground/70">
                      Register your device in the TankLens dashboard by entering its unique ID and specifying tank details.
                    </p>
                  </div>
                </div>
                
                <div className="mb-12 relative">
                  <div className="absolute left-0 top-0 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold">
                    3
                  </div>
                  <div className="ml-16">
                    <h3 className="text-xl font-bold mb-2">Monitor Your Tanks</h3>
                    <p className="text-foreground/70">
                      Start monitoring your water levels in real-time. Refresh data at any time to get the latest readings.
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute left-0 top-0 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold">
                    4
                  </div>
                  <div className="ml-16">
                    <h3 className="text-xl font-bold mb-2">Manage and Calibrate</h3>
                    <p className="text-foreground/70">
                      Easily manage your devices, update information, and calibrate sensors for accurate readings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center max-w-2xl">
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl mb-8">
              Join TankLens today and take control of your water management.
            </p>
            
            {isAuthenticated ? (
              <Link 
                href="/dashboard" 
                className="inline-block px-10 py-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-lg font-medium shadow-lg shadow-primary/30 transform hover:scale-105 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75c-1.036 0-1.875-.84-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75C3.84 21.75 3 20.91 3 19.875v-6.75z" />
                  </svg>
                  Go to Dashboard
                </span>
                <span className="absolute bottom-0 left-0 h-1 w-full bg-white transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform"></span>
              </Link>
            ) : (
              <Link 
                href="/auth/login" 
                className="px-8 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-lg font-medium"
              >
                Sign Up Now
              </Link>
            )}
          </div>
        </section>
      </main>
      
      
    </div>
  );
}
