# TankLens WebApp - Real Firebase Integration

## Overview

Updated the TankLens web application to fetch real sensor data from Firebase instead of using random values. The system now integrates with both Firebase Realtime Database (for live sensor data) and Firestore (for device management and historical data).

## Changes Made

### 1. Firebase Configuration Updates

**File: `tanklens/src/lib/firebase.ts`**
- ✅ Added Firebase Realtime Database import
- ✅ Added `databaseURL` to Firebase config
- ✅ Initialized `realtimeDb` service
- ✅ Created `fetchRealTimeSensorData()` function

**File: `tanklens/.env.local`**
- ✅ Added `NEXT_PUBLIC_FIREBASE_DATABASE_URL` environment variable
- ✅ Set to match ESP32 configuration: `https://tanklens-default-rtdb.asia-southeast1.firebasedatabase.app`

### 2. Real Data Integration

**File: `tanklens/src/components/TankLevelDisplay.tsx`**
- ❌ **Removed**: Random data generation (`Math.floor(Math.random() * 100)`)
- ✅ **Added**: Real Firebase Realtime Database integration
- ✅ **Added**: Sensor status display (measured/estimated)
- ✅ **Added**: Better error handling and no-data state
- ✅ **Added**: 1 decimal place precision for water levels

**File: `tanklens/src/app/dashboard/page.tsx`**
- ✅ **Enhanced**: Device loading to fetch current real-time data
- ✅ **Added**: Combining historical Firestore data with live RTDB data
- ✅ **Added**: Status tracking for sensor readings

### 3. Data Flow Architecture

```
ESP32 Sensor → Firebase RTDB → Web App Dashboard
     ↓                              ↑
Device Management ← Firestore ← Historical Data
```

**Current Data Flow:**
1. **ESP32** uploads live data to Firebase Realtime Database every 30 seconds
2. **Dashboard** loads device info from Firestore (device names, capacity, etc.)
3. **Dashboard** fetches current sensor data from Realtime Database
4. **Refresh button** pulls latest sensor readings from RTDB
5. **Historical data** combines Firestore records with current RTDB data

### 4. Enhanced User Experience

**Live Data Display:**
- 📡 **Live data**: Shows when reading is from actual sensor
- 🔮 **Estimated**: Shows when ESP32 is using trend-based estimation
- ❓ **Unknown**: Shows when status is unclear
- 🔄 **Refresh**: Fetches real-time data from Firebase RTDB

**Graph Improvements:**
- Real sensor data plotted instead of random values
- Shows historical trends from actual device readings
- Handles empty data states gracefully
- Better timestamp formatting

## Data Structure

### Firebase Realtime Database (ESP32 → Web App)
```json
{
  "DEV_01": {
    "distance": 25.3,
    "waterLevel": 75.5,
    "timestamp": "1704123456",
    "status": "measured",
    "interval": 30000
  }
}
```

### Firestore (Device Management)
```json
{
  "devices": {
    "DEV_01": {
      "name": "Main Water Tank",
      "location": "Rooftop",
      "maxCapacity": 1000,
      "data": [
        {
          "timestamp": "2024-01-15T10:30:00Z",
          "level": 75.5,
          "status": "measured"
        }
      ],
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  }
}
```

## Testing the Integration

### 1. Verify ESP32 Data
1. Check Firebase Realtime Database console
2. Look for your `DEVICE_ID` (e.g., "DEV_01")
3. Verify data updates every 30 seconds

### 2. Test Web App
1. Start development server: `npm run dev`
2. Login with Google OAuth
3. Add a device with matching ESP32 `DEVICE_ID`
4. Click refresh button to fetch live data

### 3. Debug Connection Issues

**Check Console Logs:**
```javascript
// Firebase connection test
import { fetchRealTimeSensorData } from '@/lib/firebase';

// In browser console:
fetchRealTimeSensorData('DEV_01').then(console.log);
```

**Expected Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": 75.5,
  "distance": 25.3,
  "status": "measured",
  "lastUpdated": "1704123456"
}
```

## Troubleshooting

### No Data Showing
1. **Check ESP32**: Verify device is uploading to Firebase RTDB
2. **Check Device ID**: Ensure web app device ID matches ESP32 `DEVICE_ID`
3. **Check Permissions**: Verify Firebase database rules allow reads
4. **Check Network**: Ensure ESP32 has internet connectivity

### Random Data Still Showing
1. **Clear Cache**: Hard refresh browser (Ctrl+F5)
2. **Check Implementation**: Verify `fetchSensorData()` is calling real Firebase function
3. **Check Imports**: Ensure `fetchRealTimeSensorData` is properly imported

### Graph Not Updating
1. **Click Refresh**: Manual refresh fetches latest data
2. **Check Historical Data**: Verify Firestore has device data
3. **Check Data Format**: Ensure timestamps are valid ISO strings

## Environment Setup

**Required Environment Variables:**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tanklens.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tanklens
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tanklens.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://tanklens-default-rtdb.asia-southeast1.firebasedatabase.app
```

## Future Enhancements

1. **Real-time Updates**: Add Firebase listeners for live data streaming
2. **Data Persistence**: Store more historical data in Firestore
3. **Offline Support**: Cache recent data for offline viewing
4. **Multiple Devices**: Support multiple ESP32 devices per user
5. **Alerts**: Notifications for low water levels or sensor issues

## Status

✅ **Real Firebase Integration**: Complete  
✅ **Live Sensor Data**: Fetching from RTDB  
✅ **Graph Plotting**: Real data instead of random  
✅ **Status Indicators**: Shows measured vs estimated  
✅ **Error Handling**: Graceful fallbacks for no data  

The web application now displays actual sensor data from your ESP32 device via Firebase, providing real-time water level monitoring with proper status indication and historical trend analysis.