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
              v1.4
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
                with waterproof ultrasonic sensors (A02YYUW) to provide real-time water level tracking. The system uses 
                UART communication for reliable data transmission to Firebase for instant updates and historical analysis.
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
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-4">
                    <a 
                      href="https://github.com/41vi4p/TankLens" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                      </svg>
                      View on GitHub
                    </a>
                    <a 
                      href="https://github.com/41vi4p/TankLens/issues" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Report Issues
                    </a>
                  </div>
                  <p className="text-xs text-foreground/50 text-center">
                    TankLens v1.4 © 2025 - Open Source MIT License
                  </p>
                </div>
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
                    <p className="text-sm text-foreground/70">Live water level tracking with 5-second updates</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary">📊</span>
                  <div>
                    <h3 className="font-semibold">Interactive Charts</h3>
                    <p className="text-sm text-foreground/70">Historical data synced every 10 minutes + real-time data visualization</p>
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

          {/* Sensor Specifications */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">📏</span>
              A02YYUW Sensor Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-primary">Measurement</h3>
                <ul className="space-y-1 text-sm text-foreground/70">
                  <li>• <strong>Range:</strong> 3-450 cm</li>
                  <li>• <strong>Blind Zone:</strong> 3 cm</li>
                  <li>• <strong>Accuracy:</strong> ±1% (at 25°C)</li>
                  <li>• <strong>Resolution:</strong> 1 mm</li>
                  <li>• <strong>Sensing Angle:</strong> 60°</li>
                  <li>• <strong>Response Time:</strong> 100ms</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-primary">Technical</h3>
                <ul className="space-y-1 text-sm text-foreground/70">
                  <li>• <strong>Communication:</strong> UART (9600 bps)</li>
                  <li>• <strong>Operating Voltage:</strong> 3.3-5V</li>
                  <li>• <strong>Current:</strong> ≤8mA (avg), ≤5mA (standby)</li>
                  <li>• <strong>Frequency:</strong> 40kHz ±1kHz</li>
                  <li>• <strong>Waterproof Rating:</strong> IP67</li>
                  <li>• <strong>Operating Temp:</strong> -15°C to 60°C</li>
                </ul>
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
                  <li>• A02YYUW Waterproof Ultrasonic Sensor</li>
                  <li>• UART Serial Communication (9600 baud)</li>
                  <li>• IP67 Waterproof Rating</li>
                  <li>• 3-450cm Measurement Range</li>
                  <li>• Wi-Fi Connectivity</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Open Source & Repository */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🔓</span>
              Open Source Project
            </h2>
            <div className="space-y-4">
              <p className="text-foreground/80">
                TankLens is completely open source and available under the MIT License. You can explore the code, 
                contribute improvements, or report issues on our GitHub repository.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a 
                  href="https://github.com/41vi4p/TankLens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 border border-border rounded-lg hover:bg-secondary/30 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">Source Code</h3>
                  </div>
                  <p className="text-sm text-foreground/70">
                    View and download the complete source code
                  </p>
                </a>
                
                <a 
                  href="https://github.com/41vi4p/TankLens/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 border border-border rounded-lg hover:bg-secondary/30 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">Issues & Bugs</h3>
                  </div>
                  <p className="text-sm text-foreground/70">
                    Report bugs or request new features
                  </p>
                </a>
                
                <a 
                  href="https://github.com/41vi4p/TankLens/blob/main/version_changelog.md" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 border border-border rounded-lg hover:bg-secondary/30 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">Changelog</h3>
                  </div>
                  <p className="text-sm text-foreground/70">
                    View detailed version history and updates
                  </p>
                </a>
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
                    The A02YYUW waterproof ultrasonic sensor measures distance to water surface using 40kHz ultrasonic waves with IP67 protection.
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
                    ESP32 receives UART data from sensor, applies moving average filtering, and calculates water level percentages.
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
                    Processed data is sent to Firebase Realtime Database via Wi-Fi, with dashboard updates every 5 seconds.
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