'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export type TankData = {
  timestamp: string;
  level: number; // percentage 0-100
};

export type SensorDevice = {
  id: string;
  name: string;
  location: string;
  maxCapacity: number; // in liters
  data: TankData[];
  lastUpdated: string;
};

// Function to fetch data from IoT device
export async function fetchSensorData(deviceId: string): Promise<TankData | null> {
  try {
    // In a real application, this would make an HTTP request to your IoT API
    // For demo purposes, we're generating random data
    return {
      timestamp: new Date().toISOString(),
      level: Math.floor(Math.random() * 100)
    };
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return null;
  }
}

export function TankLevelDisplay({ device, onRefresh }: { 
  device: SensorDevice, 
  onRefresh: (deviceId: string) => Promise<void> 
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    await onRefresh(device.id);
    setIsRefreshing(false);
  };

  // Format water level display
  const formatWaterLevel = () => {
    const lastReading = device.data[device.data.length - 1]?.level || 0;
    const liters = (lastReading / 100) * device.maxCapacity;
    return {
      percentage: lastReading,
      liters: Math.round(liters),
      lastUpdated: new Date(device.lastUpdated).toLocaleString()
    };
  };

  const levelInfo = formatWaterLevel();
  
  // Set color based on water level
  const getLevelColor = () => {
    const level = levelInfo.percentage;
    if (level < 20) return 'text-error';
    if (level < 40) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{device.name}</h3>
          <p className="text-sm text-foreground/70">{device.location}</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
          aria-label="Refresh data"
        >
          <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="flex justify-between mb-6">
        <div>
          <p className="text-sm text-foreground/70">Current Level</p>
          <p className={`text-2xl font-bold ${getLevelColor()}`}>
            {levelInfo.percentage}%
          </p>
        </div>
        <div>
          <p className="text-sm text-foreground/70">Volume</p>
          <p className="text-2xl font-bold">
            {levelInfo.liters} L
          </p>
        </div>
        <div>
          <p className="text-sm text-foreground/70">Capacity</p>
          <p className="text-2xl font-bold">
            {device.maxCapacity} L
          </p>
        </div>
      </div>
      
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={device.data}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              stroke="var(--foreground)"
              fontSize={12}
            />
            <YAxis 
              label={{ value: '%', position: 'insideLeft', offset: -5 }}
              domain={[0, 100]}
              stroke="var(--foreground)"
              fontSize={12}
            />
            <Tooltip 
              formatter={(value) => [`${value}%`, 'Water Level']}
              labelFormatter={(label) => new Date(label).toLocaleString()}
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--card-foreground)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="level" 
              stroke="var(--primary)" 
              fill="var(--primary)" 
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <p className="text-xs text-foreground/50 mt-2">
        Last updated: {levelInfo.lastUpdated}
      </p>
    </div>
  );
}