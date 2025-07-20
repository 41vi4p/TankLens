# TankLens ESP32 Water Level Sensor v2.0 Optimized

## Overview

This memory-optimized ESP32 firmware provides intelligent water level monitoring with Firebase Realtime Database integration. The system handles sensor limitations gracefully and provides trend-based estimations when needed.

## Key Features

- **Firebase Realtime Database Integration**: Direct data uploads to Firebase
- **Intelligent Sensor Handling**: Manages 20cm minimum distance limitation  
- **Trend-Based Estimation**: Uses historical data to estimate levels during sensor errors
- **Enhanced Reliability**: Multiple sensor readings with averaging
- **Error Recovery**: Graceful handling of sensor failures and network issues
- **Memory Optimized**: Fits within ESP32 program storage limits

## Hardware Setup

### Components Required
- ESP32 Development Board
- AJ-SR04M Waterproof Ultrasonic Sensor
- Jumper wires
- Power supply (5V recommended)

### Pin Connections
```
AJ-SR04M Sensor    ESP32
VCC                5V
GND                GND
Trig               GPIO15
Echo               GPIO18
```

### Tank Installation
1. Mount sensor at the top of the tank
2. Ensure sensor faces straight down
3. Minimum 20cm clearance from sensor to maximum water level
4. Waterproof all connections

## Software Setup

### Required Libraries
Install these libraries via Arduino IDE Library Manager:
1. **Firebase ESP Client** by Mobizt (v4.3.0 or later)

**Note**: ArduinoJson has been removed in the optimized version to reduce memory usage.

### Configuration

1. **Update config.h with your credentials:**
```cpp
// Wi-Fi credentials
#define WIFI_SSID "your-wifi-network"
#define WIFI_PASSWORD "your-wifi-password"

// Firebase Realtime Database
#define FIREBASE_HOST "your-project.firebaseio.com"
#define FIREBASE_AUTH "your-database-secret"

// Device identification
#define DEVICE_ID "your-unique-device-id"

// Tank calibration
#define TANK_HEIGHT_CM 100          // Total tank height
#define SENSOR_MOUNT_HEIGHT_CM 5    // Sensor mount height from tank top
#define MIN_SENSOR_DISTANCE_CM 20   // Minimum reliable sensor distance
```

2. **Calculate Calibration Values:**
   - **Empty Tank Distance** = SENSOR_MOUNT_HEIGHT_CM + TANK_HEIGHT_CM
   - **Full Tank Distance** = SENSOR_MOUNT_HEIGHT_CM + MIN_SENSOR_DISTANCE_CM

### Firebase Setup

1. **Realtime Database Structure:**
```json
{
  "your-device-id": {
    "distance": 45.2,
    "waterLevel": 75.5,
    "timestamp": "2024-01-15T10:30:00Z",
    "status": "measured",
    "interval": 30000
  }
}
```

2. **Firestore Structure:**
```
/devices/{deviceId}/history/{timestamp}
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": 75.5,
  "distance": 45.2,
  "status": "measured",
  "deviceId": "your-device-id"
}
```

## System Behavior

### Normal Operation
- Takes 3 sensor readings every second
- Uses median filtering to reduce noise
- Uploads to RTDB every 30 seconds
- Syncs to Firestore every 5 minutes

### Error Handling

#### Invalid Sensor Readings (< 20cm or > 400cm)
1. **First 5 errors**: Uses last valid reading
2. **After 5+ consecutive errors**: Uses trend-based estimation
3. **Marks data as "estimated"** in Firebase

#### Trend-Based Estimation
- Analyzes last 20 valid readings
- Calculates linear regression trend
- Estimates current level based on historical pattern
- Provides reasonable fallback during sensor issues

### Status Indicators

| Status | Description |
|--------|-------------|
| `measured` | Direct sensor reading within valid range |
| `estimated` | Calculated from historical trends due to sensor error |

## Installation Steps

1. **Hardware Assembly:**
   - Connect sensor to ESP32 as per pin diagram
   - Mount sensor in tank with proper clearance
   - Ensure waterproof connections

2. **Software Configuration:**
   - Install required libraries
   - Update config.h with your settings
   - Upload firmware to ESP32

3. **Calibration:**
   - Measure actual tank dimensions
   - Update TANK_HEIGHT_CM in config.h
   - Verify sensor mount height
   - Test with known water levels

4. **Firebase Setup:**
   - Configure Realtime Database and Firestore
   - Set up security rules
   - Verify device appears in database

## Monitoring and Troubleshooting

### Serial Monitor Output
- Connect at 115200 baud to view detailed logs
- Monitor sensor readings and Firebase uploads
- Track error conditions and recovery

### Common Issues

**Sensor reads > 20cm when tank has water:**
- Check sensor mounting angle
- Verify water surface is reflective
- Clean sensor face of debris

**Firebase upload failures:**
- Verify network connectivity
- Check Firebase credentials
- Ensure proper time synchronization

**Inconsistent readings:**
- Check for sensor interference
- Verify stable power supply
- Review tank installation

## Maintenance

- Clean sensor face monthly
- Monitor serial output for errors
- Update firmware as needed
- Check mounting stability periodically

## Version History

**v2.0 (Current)**
- Direct Firestore integration
- Trend-based estimation
- Enhanced error handling
- Improved sensor reliability

**v1.0**
- Basic RTDB integration
- Simple distance measurement
- Required external sync server