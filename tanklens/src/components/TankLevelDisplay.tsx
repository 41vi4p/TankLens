'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export type TankData = {
  timestamp: string;
  level: number; // percentage 0-100
  status?: string; // 'measured', 'estimated', or 'offline'
};

type TimeRange = '5min' | '15min' | '30min' | '1hr' | '12hrs' | '24hr' | 'week' | 'monthly';
type ChartType = 'area' | 'line' | 'bar';

const TIME_RANGES: { value: TimeRange; label: string; minutes: number }[] = [
  { value: '5min', label: 'Last 5 minutes', minutes: 5 },
  { value: '15min', label: 'Last 15 minutes', minutes: 15 },
  { value: '30min', label: 'Last 30 minutes', minutes: 30 },
  { value: '1hr', label: 'Last 1 hour', minutes: 60 },
  { value: '12hrs', label: 'Last 12 hours', minutes: 720 },
  { value: '24hr', label: 'Last 24 hours', minutes: 1440 },
  { value: 'week', label: 'Last week', minutes: 10080 },
  { value: 'monthly', label: 'Last month', minutes: 43200 }
];

const CHART_TYPES: { value: ChartType; label: string; icon: string }[] = [
  { value: 'area', label: 'Area Chart', icon: '📈' },
  { value: 'line', label: 'Line Chart', icon: '📊' },
  { value: 'bar', label: 'Bar Chart', icon: '📶' }
];

export type SensorDevice = {
  id: string;
  name: string;
  location: string;
  maxCapacity: number; // in liters
  data: TankData[];
  lastUpdated: string;
};

import { fetchRealTimeSensorData } from '@/lib/firebase';

// Function to fetch data from IoT device
export async function fetchSensorData(deviceId: string): Promise<TankData | null> {
  try {
    // Fetch real data from Firebase Realtime Database
    const sensorData = await fetchRealTimeSensorData(deviceId);
    
    if (sensorData) {
      return {
        timestamp: sensorData.timestamp,
        level: Math.round(sensorData.level * 10) / 10, // Round to 1 decimal place
        status: sensorData.status
      };
    }
    
    return null;
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
  const [timeRange, setTimeRange] = useState<TimeRange>('24hr');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showChartDropdown, setShowChartDropdown] = useState(false);
  
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    await onRefresh(device.id);
    setIsRefreshing(false);
  };

  // Filter data based on selected time range
  const getFilteredData = () => {
    if (!device.data || device.data.length === 0) return [];
    
    const selectedRange = TIME_RANGES.find(r => r.value === timeRange);
    if (!selectedRange) return device.data;
    
    const cutoffTime = new Date(Date.now() - selectedRange.minutes * 60 * 1000);
    return device.data.filter(reading => 
      new Date(reading.timestamp).getTime() >= cutoffTime.getTime()
    );
  };

  // Format water level display
  const formatWaterLevel = () => {
    const lastReading = device.data[device.data.length - 1];
    const level = lastReading?.level || 0;
    const liters = (level / 100) * device.maxCapacity;
    const status = lastReading?.status || 'unknown';
    
    return {
      percentage: level,
      liters: Math.round(liters),
      status: status,
      isOffline: status === 'offline',
      lastUpdated: new Date(device.lastUpdated).toLocaleString()
    };
  };

  const levelInfo = formatWaterLevel();
  const selectedTimeRange = TIME_RANGES.find(r => r.value === timeRange);
  const selectedChartType = CHART_TYPES.find(c => c.value === chartType);
  
  // Set color based on water level and status
  const getLevelColor = () => {
    if (levelInfo.isOffline) return 'text-gray-500';
    const level = levelInfo.percentage;
    if (level < 20) return 'text-error';
    if (level < 40) return 'text-warning';
    return 'text-success';
  };

  // Render chart based on selected type
  const renderChart = (data: TankData[]) => {
    const chartProps = {
      data,
      margin: { top: 10, right: 0, left: 0, bottom: 0 }
    };

    const commonElements = (
      <>
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
          content={(props) => {
            if (!props.active || !props.payload || !props.payload[0]) {
              return null;
            }
            
            const data = props.payload[0].payload;
            const level = props.payload[0].value as number;
            const liters = Math.round((level / 100) * device.maxCapacity);
            const status = data?.status || 'unknown';
            const timestamp = data?.timestamp;
            
            if (!timestamp) return null;
            
            const date = new Date(timestamp);
            
            return (
              <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
                {/* Date & Time */}
                <div className="border-b border-border pb-2 mb-2">
                  <div className="font-semibold text-foreground">
                    {date.toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {date.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
                
                {/* Water Level Details */}
                <div className="space-y-2">
                  <div>
                    <div className="text-lg font-bold text-primary">{level.toFixed(1)}%</div>
                    <div className="text-xs text-foreground/60">Water Level</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-foreground/70">Volume</div>
                      <div className="font-semibold">{liters}L</div>
                    </div>
                    <div>
                      <div className="text-foreground/70">Capacity</div>
                      <div className="font-semibold">{device.maxCapacity}L</div>
                    </div>
                  </div>
                  
                  <div className="pt-1">
                    <div className="text-foreground/70 text-xs">Status</div>
                    <div className={`text-sm font-medium ${
                      status === 'measured' ? 'text-green-600' : 
                      status === 'estimated' ? 'text-yellow-600' :
                      status === 'offline' ? 'text-red-600' : 
                      'text-gray-500'
                    }`}>
                      {status === 'measured' ? '📡 Live Data' :
                       status === 'estimated' ? '🔮 Estimated' :
                       status === 'offline' ? '❌ Offline' :
                       '❓ Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
          cursor={{ strokeDasharray: '3 3', stroke: 'var(--primary)', strokeWidth: 1 }}
        />
      </>
    );

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...chartProps}>
            {commonElements}
            <Line 
              type="monotone" 
              dataKey="level" 
              stroke="var(--primary)" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart {...chartProps}>
            {commonElements}
            <Bar 
              dataKey="level" 
              fill="var(--primary)" 
              fillOpacity={0.8}
            />
          </BarChart>
        );
      default: // area
        return (
          <AreaChart {...chartProps}>
            {commonElements}
            <Area 
              type="monotone" 
              dataKey="level" 
              stroke="var(--primary)" 
              fill="var(--primary)" 
              fillOpacity={0.2}
            />
          </AreaChart>
        );
    }
  };

  const filteredData = getFilteredData();

  return (
    <div className="card h-full flex flex-col">
      <div className="mb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold truncate">{device.name}</h3>
              {levelInfo.isOffline && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full flex-shrink-0">
                  🔴 Offline
                </span>
              )}
            </div>
            <p className="text-sm text-foreground/70 truncate">{device.location}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-sm text-foreground/70">Current Level</p>
          <p className={`text-xl md:text-2xl font-bold ${getLevelColor()}`}>
            {levelInfo.isOffline ? '--' : levelInfo.percentage.toFixed(1)}%
          </p>
          <p className={`text-xs ${
            levelInfo.status === 'measured' ? 'text-green-600' : 
            levelInfo.status === 'estimated' ? 'text-yellow-600' :
            levelInfo.status === 'offline' ? 'text-red-600' :
            'text-gray-500'
          }`}>
            {levelInfo.status === 'measured' ? '📡 Live' :
             levelInfo.status === 'estimated' ? '🔮 Est.' :
             levelInfo.status === 'offline' ? '❌ Offline' :
             '❓ Unknown'}
          </p>
        </div>
        <div>
          <p className="text-sm text-foreground/70">Volume</p>
          <p className="text-xl md:text-2xl font-bold">
            {levelInfo.isOffline ? '--' : levelInfo.liters} L
          </p>
        </div>
        <div>
          <p className="text-sm text-foreground/70">Capacity</p>
          <p className="text-xl md:text-2xl font-bold">
            {device.maxCapacity} L
          </p>
        </div>
      </div>
      
      {/* Chart Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Mobile: Time Range and Chart Icons on first row, Refresh on second row */}
        <div className="sm:hidden">
          <div className="flex gap-3 mb-3">
            {/* Time Range Dropdown */}
            <div className="relative flex-1">
              <button
                onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-200 flex items-center justify-between text-foreground/80 hover:text-foreground"
                type="button"
              >
                <span className="text-left truncate">{selectedTimeRange?.label}</span>
                <ChevronDownIcon className="h-4 w-4 ml-2 flex-shrink-0" />
              </button>
              {showTimeDropdown && (
                <div className="absolute top-full left-0 w-full mt-1 bg-card rounded-lg shadow-lg border border-border/50 backdrop-blur-sm z-10 max-h-48 overflow-y-auto">
                  {TIME_RANGES.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => {
                        setTimeRange(range.value);
                        setShowTimeDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors ${
                        timeRange === range.value ? 'bg-primary/10 text-primary' : ''
                      }`}
                      type="button"
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Chart Type Icons */}
            <div className="flex gap-1">
              {CHART_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setChartType(type.value)}
                  className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 flex items-center justify-center min-w-[2.5rem] ${
                    chartType === type.value 
                      ? 'bg-primary/15 text-primary shadow-sm' 
                      : 'bg-secondary/50 text-foreground/70 hover:bg-secondary hover:text-foreground'
                  }`}
                  title={type.label}
                  type="button"
                >
                  <span className="text-lg">{type.icon}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Mobile Refresh Button - Rightmost on second row */}
          <div className="flex justify-end">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all duration-200 text-primary hover:text-primary border border-primary/20 hover:border-primary/30 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              aria-label="Refresh data"
              title="Refresh device data"
              type="button"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex sm:flex-row gap-3 w-full">
          {/* Time Range Dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowTimeDropdown(!showTimeDropdown)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-200 flex items-center justify-between text-foreground/80 hover:text-foreground"
              type="button"
            >
              <span className="text-left truncate">{selectedTimeRange?.label}</span>
              <ChevronDownIcon className="h-4 w-4 ml-2 flex-shrink-0" />
            </button>
            {showTimeDropdown && (
              <div className="absolute top-full left-0 w-full mt-1 bg-card rounded-lg shadow-lg border border-border/50 backdrop-blur-sm z-10 max-h-48 overflow-y-auto">
                {TIME_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => {
                      setTimeRange(range.value);
                      setShowTimeDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors ${
                      timeRange === range.value ? 'bg-primary/10 text-primary' : ''
                    }`}
                    type="button"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Chart Type Icons */}
          <div className="flex gap-2">
            {CHART_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setChartType(type.value)}
                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 flex items-center justify-center min-w-[2.5rem] ${
                  chartType === type.value 
                    ? 'bg-primary/15 text-primary shadow-sm' 
                    : 'bg-secondary/50 text-foreground/70 hover:bg-secondary hover:text-foreground'
                }`}
                title={type.label}
                type="button"
              >
                <span className="text-lg">{type.icon}</span>
              </button>
            ))}
          </div>
          
          {/* Desktop Refresh Button */}
          <div className="flex">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all duration-200 text-primary hover:text-primary border border-primary/20 hover:border-primary/30 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              aria-label="Refresh data"
              title="Refresh device data"
              type="button"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>
      </div>

      <div className="h-60 relative">
        {filteredData && filteredData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(filteredData)}
            </ResponsiveContainer>
            {levelInfo.isOffline && (
              <div className="absolute top-2 right-2 bg-red-100/90 backdrop-blur-sm border border-red-300 rounded-lg px-3 py-2 text-red-700 text-sm font-medium shadow-sm">
                🔴 Offline
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-foreground/50">
            <div className="text-center">
              <p className="text-lg mb-2">📊</p>
              <p className="text-sm">No data in selected time range</p>
              <p className="text-xs">Try selecting a longer time period or refresh data</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center mt-2 text-xs text-foreground/50">
        <span>Last updated: {levelInfo.lastUpdated}</span>
        {filteredData.length > 0 && (
          <div className="flex items-center gap-2">
            <span>{filteredData.length} data points</span>
            <span className="text-blue-600">📊 Historical + 📡 Live</span>
          </div>
        )}
      </div>
    </div>
  );
}