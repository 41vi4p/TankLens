'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Header isAuthenticated={!!user} />
      
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-primary">Tank</span>Lens
            </h1>
            <p className="text-xl text-foreground/70 mb-3">
              Smart IoT-based Water Level Monitoring System
            </p>
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full border border-primary/20">
              v1.0
            </span>
          </div>
          
          {/* System Overview */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🌊</span>
              About the System
            </h2>
            <div className="text-foreground/80">
              <p>
                TankLens is an advanced IoT-based water level monitoring solution that combines ESP32 microcontrollers 
                with ultrasonic sensors (AJ-SR04M) to provide real-time water level tracking. The system transmits data 
                to Firebase for instant updates and historical analysis through a modern web interface.
              </p>
            </div>
          </div>

          {/* Credits */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">👨‍💻</span>
              Credits & Acknowledgments
            </h2>
            <div className="space-y-4 text-foreground/80">
              <div>
                <h3 className="font-semibold mb-2">Developer</h3>
                <p className="text-sm text-foreground/70 mb-2">
                  <strong className="text-primary">David Porathur</strong>
                </p>
              </div>
              
          

              <div>
                <h3 className="font-semibold mb-2">Special Thanks</h3>
                <div className="text-sm text-foreground/70">
                  <p>
                    Thanks to the open-source community for providing the tools and libraries that made this project possible.
                    Special appreciation for the Firebase team for their excellent real-time database platform.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/30">
                <p className="text-xs text-foreground/50 text-center">
                  TankLens v1.0 © 2025 - Built with ❤️ for efficient water management
                </p>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-primary">📡</span>
                  <div>
                    <h3 className="font-semibold">Real-time Monitoring</h3>
                    <p className="text-sm text-foreground/70">Live water level tracking with 30-second updates</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary">📊</span>
                  <div>
                    <h3 className="font-semibold">Interactive Charts</h3>
                    <p className="text-sm text-foreground/70">Multiple chart types with customizable time ranges</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary">🔄</span>
                  <div>
                    <h3 className="font-semibold">Auto-refresh</h3>
                    <p className="text-sm text-foreground/70">Automatic data updates with offline detection</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-primary">🎯</span>
                  <div>
                    <h3 className="font-semibold">Smart Estimation</h3>
                    <p className="text-sm text-foreground/70">Trend-based water level prediction when sensor is out of range</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary">📱</span>
                  <div>
                    <h3 className="font-semibold">Responsive Design</h3>
                    <p className="text-sm text-foreground/70">Optimized for desktop and mobile devices</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary">🔐</span>
                  <div>
                    <h3 className="font-semibold">Secure Authentication</h3>
                    <p className="text-sm text-foreground/70">Google OAuth integration for data security</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Stack */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🔧</span>
              Technical Stack
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-primary">Frontend</h3>
                <ul className="space-y-1 text-sm text-foreground/70">
                  <li>• Next.js 15 (App Router)</li>
                  <li>• React 18 with TypeScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• Recharts for data visualization</li>
                  <li>• Heroicons for UI icons</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-primary">Backend & Database</h3>
                <ul className="space-y-1 text-sm text-foreground/70">
                  <li>• Firebase Realtime Database</li>
                  <li>• Firebase Firestore</li>
                  <li>• Firebase Authentication</li>
                  <li>• Google OAuth 2.0</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-primary">Hardware</h3>
                <ul className="space-y-1 text-sm text-foreground/70">
                  <li>• ESP32 Microcontroller</li>
                  <li>• AJ-SR04M Ultrasonic Sensor</li>
                  <li>• Wi-Fi Connectivity</li>
                  <li>• Real-time data transmission</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">⚙️</span>
              How It Works
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Sensor Measurement</h3>
                  <p className="text-sm text-foreground/70">
                    The AJ-SR04M ultrasonic sensor measures the distance to the water surface using sound waves.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Data Processing</h3>
                  <p className="text-sm text-foreground/70">
                    ESP32 processes the sensor data, applies filtering, and calculates water level percentages.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Cloud Transmission</h3>
                  <p className="text-sm text-foreground/70">
                    Processed data is sent to Firebase Realtime Database via Wi-Fi every 30 seconds.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-semibold">Real-time Visualization</h3>
                  <p className="text-sm text-foreground/70">
                    The web application fetches and displays data with interactive charts and status indicators.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
      
      <BottomNav isAuthenticated={!!user} />
    </div>
  );
}