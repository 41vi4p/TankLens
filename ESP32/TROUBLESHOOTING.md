# ESP32 TankLens Troubleshooting Guide

## Compilation Issues

### Error: 'FirebaseConfig' has no member named 'project_id'
**Solution**: This indicates an older version of Firebase ESP Client library.
- Update to Firebase ESP Client v4.3.0 or later
- The fixed code uses REST API for Firestore instead of native client

### Error: 'access_token' member not found
**Solution**: The code has been updated to use API key authentication instead of access tokens.
- No action needed - this is fixed in the current version

### Multiple libraries found for "SD.h"
**Solution**: This is a warning, not an error. The ESP32 will use the correct SD library automatically.

### ArduinoJson compilation errors
**Solution**: 
- Install ArduinoJson v6.21.0 or later
- If using v7, ensure compatibility with your ESP32 core version

## Runtime Issues

### WiFi Connection Problems
**Symptoms**: Device cannot connect to WiFi
**Solutions**:
1. Verify SSID and password in config.h
2. Check WiFi signal strength
3. Ensure 2.4GHz network (ESP32 doesn't support 5GHz)

### Firebase Connection Failed
**Symptoms**: "RTDB connection failed" in serial monitor
**Solutions**:
1. Verify FIREBASE_HOST URL format: `project-id-rtdb.region.firebasedatabase.app`
2. Check FIREBASE_AUTH secret (database secret, not web API key)
3. Ensure Realtime Database is enabled in Firebase console
4. Verify database rules allow writes

### Firestore Sync Failed
**Symptoms**: "Firestore sync failed" with HTTP error codes
**Solutions**:
- **Error 400**: Check FIREBASE_API_KEY and FIREBASE_PROJECT_ID
- **Error 403**: Verify Firestore security rules allow writes
- **Error 404**: Check project ID and ensure Firestore is enabled

### Time Sync Issues
**Symptoms**: "Waiting for time sync" never completes
**Solutions**:
1. Check internet connectivity
2. Verify NTP servers are accessible
3. Add longer timeout or different NTP servers

### Sensor Reading Issues

#### Readings Always -1 or Invalid
**Causes**:
1. Sensor wiring incorrect
2. Power supply insufficient
3. Sensor damaged

**Solutions**:
1. Verify pin connections (Trig: GPIO13, Echo: GPIO18)
2. Use 5V power supply for sensor
3. Test sensor with simple sketch

#### Readings > 20cm When Tank Has Water
**Causes**:
1. Sensor mounted at wrong angle
2. Water surface not reflective
3. Interference from tank walls

**Solutions**:
1. Mount sensor perpendicular to water surface
2. Ensure sensor has clear line of sight
3. Clean sensor face regularly

#### Inconsistent Readings
**Causes**:
1. Vibrations affecting sensor
2. Temperature variations
3. Electrical interference

**Solutions**:
1. Secure sensor mounting
2. Add shielding if near electrical components
3. Increase averaging samples in code

## Configuration Issues

### Wrong Water Level Calculations
**Solution**: Verify calibration values in config.h:
```cpp
#define TANK_HEIGHT_CM 100          // Actual tank height
#define SENSOR_MOUNT_HEIGHT_CM 5    // Distance from tank top to sensor
#define MIN_SENSOR_DISTANCE_CM 20   // Keep at 20 for reliability
```

### Upload Interval Not Changing
**Solution**: 
1. Check if interval path exists in Firebase: `DEVICE_ID/interval`
2. Ensure value is positive integer (milliseconds)
3. Verify device has read access to the path

## Debugging Tips

### Enable Verbose Logging
Add to setup():
```cpp
Serial.setDebugOutput(true);
Firebase.setDoubleDigits(2);
```

### Monitor Serial Output
Connect at 115200 baud to see:
- WiFi connection status
- Firebase connection attempts
- Sensor readings and status
- Upload success/failure messages

### Test Firebase Connectivity
Use Firebase console to manually verify:
1. Data appears in Realtime Database under your DEVICE_ID
2. Historical data appears in Firestore under devices/DEVICE_ID/history

### Verify Time Synchronization
Check serial output for proper ISO timestamps like:
`2024-01-15T10:30:00Z`

## Hardware Troubleshooting

### Power Issues
- Use 5V power supply with at least 500mA capacity
- Ensure stable power (brownouts cause erratic behavior)
- Add capacitors if power is noisy

### Sensor Installation
- Mount sensor at least 5cm from tank top
- Ensure clear path to water surface
- Protect from direct weather exposure
- Use appropriate cable length (max 5m recommended)

### Environmental Factors
- Temperature: Operate within -10°C to +70°C
- Humidity: Use waterproof enclosure for electronics
- Vibration: Secure all connections and mounting

## Performance Optimization

### Reduce Power Consumption
- Increase upload intervals
- Use deep sleep between measurements (requires code modification)
- Reduce WiFi transmission power if signal is strong

### Improve Reliability
- Add watchdog timer for automatic reset
- Implement over-the-air (OTA) updates
- Add local storage for offline operation

## Getting Help

### Check Serial Monitor First
Most issues can be diagnosed from serial output at 115200 baud.

### Common Log Messages
- `"VALID"`: Normal sensor operation
- `"INVALID"`: Sensor reading out of range
- `"Using trend estimation"`: Fallback mode active
- `"Firebase connection successful"`: All systems working

### Collect Debug Information
When reporting issues, include:
1. Full serial monitor output
2. Hardware setup photos
3. Configuration values (redact sensitive keys)
4. Firebase console screenshots
5. Library versions used

### Reset Procedures

#### Soft Reset
Press ESP32 reset button or power cycle

#### Factory Reset
1. Erase flash: `esptool.py erase_flash`
2. Re-upload firmware
3. Reconfigure all settings

#### Firebase Reset
1. Clear device data in Firebase console
2. Restart ESP32 to reinitialize