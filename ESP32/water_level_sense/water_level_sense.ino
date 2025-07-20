/*
 * TankLens ESP32 Water Level Monitoring System v2.0 Optimized
 * 
 * Features:
 * - Firebase Realtime Database integration
 * - Smart 20cm minimum distance handling with trend estimation
 * - Enhanced sensor reliability
 * 
 * Hardware: ESP32 + AJ-SR04M Sensor
 * Pins: Trig=GPIO15, Echo=GPIO18
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <time.h>

#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// Include configuration
#include "config.h"

// AJ-SR04M Ultrasonic Sensor pins
const int trigPin = 15;    // GPIO15 for trigger (matches your working test)
const int echoPin = 18;    // GPIO18 for echo

// Tank calibration values (calculated from config)
const float emptyTankDistance = SENSOR_MOUNT_HEIGHT_CM + TANK_HEIGHT_CM;  // Distance when tank is empty
const float fullTankDistance = SENSOR_MOUNT_HEIGHT_CM + MIN_SENSOR_DISTANCE_CM;   // Distance when tank is full (min measurable)

// Measurement settings
const int measurementInterval = 1000; // Measure every 1 second
const int numReadingsForAverage = 5; // Number of readings to average
float distanceReadings[5];          // Array to store distance readings
int readingIndex = 0;                // Current position in the array
bool bufferFilled = false;           // Flag to track if buffer is filled
float distanceSum = 0;               // Sum of readings in the buffer

// Historical data for trend analysis (reduced size)
const int historySize = 10;          // Keep last 10 readings for trend analysis
float levelHistory[10];              // Historical water levels
unsigned long timeHistory[10];       // Historical timestamps
int historyIndex = 0;                // Current position in history array
bool historyFilled = false;          // Flag to track if history is filled

// Firebase settings
int uploadInterval = 30000; // Default upload interval is 30 seconds
unsigned long lastUploadTime = 0;
unsigned long lastMeasureTime = 0;

// Firebase objects
FirebaseData fbdo;
FirebaseConfig firebaseConfig;
FirebaseAuth firebaseAuth;

bool firebaseInitialized = false;

// Sensor reliability tracking
int consecutiveErrorReadings = 0;
const int maxConsecutiveErrors = 5;
float lastValidLevel = -1;
unsigned long lastValidReading = 0;

void setup() {
  // Initialize Serial Monitor
  Serial.begin(115200);
  delay(1000);
  Serial.println("TankLens Water Level Monitoring System v2.0");
  Serial.println("============================================");
  Serial.println("Device ID: " + String(DEVICE_ID));
  Serial.println("Configuration:");
  Serial.printf("  Tank Height: %d cm\n", TANK_HEIGHT_CM);
  Serial.printf("  Sensor Mount Height: %d cm\n", SENSOR_MOUNT_HEIGHT_CM);
  Serial.printf("  Min Sensor Distance: %d cm\n", MIN_SENSOR_DISTANCE_CM);
  Serial.printf("  Empty tank distance: %.1f cm\n", emptyTankDistance);
  Serial.printf("  Full tank distance: %.1f cm\n", fullTankDistance);
  Serial.println("============================================");
  
  // Initialize ultrasonic sensor pins
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  
  // Initialize historical data arrays
  for (int i = 0; i < historySize; i++) {
    levelHistory[i] = 0;
    timeHistory[i] = 0;
  }
  
  // Connect to Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWi-Fi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Initialize time synchronization
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Waiting for time sync");
  while (time(nullptr) < 8 * 3600 * 2) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("\nTime synchronized!");

  // Initialize Firebase
  initFirebase();
  
  // Initialize default interval in Firebase if needed
  if (firebaseInitialized) {
    initializeIntervalInFirebase();
  }
}

void initFirebase() {
  Serial.println("Initializing Firebase...");
  
  firebaseConfig.database_url = FIREBASE_HOST;
  firebaseConfig.signer.tokens.legacy_token = FIREBASE_AUTH;
  
  Firebase.setDoubleDigits(2);
  fbdo.setResponseSize(2048);
  
  Firebase.begin(&firebaseConfig, &firebaseAuth);
  Firebase.reconnectWiFi(true);
  
  if (Firebase.RTDB.setString(&fbdo, "/test", "OK")) {
    Serial.println("Firebase connected!");
    firebaseInitialized = true;
  } else {
    Serial.println("Firebase failed!");
    firebaseInitialized = false;
  }
}

void loop() {
  // Check Wi-Fi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected. Reconnecting...");
    WiFi.reconnect();
    delay(1000);
    return;
  }
  
  // If Firebase isn't initialized, try to initialize it again
  if (!firebaseInitialized) {
    initFirebase();
    if (!firebaseInitialized) {
      Serial.println("Firebase still not initialized. Retrying in 5 seconds...");
      delay(5000);
      return;
    }
  }
  
  unsigned long currentMillis = millis();
  
  // Check for update interval changes from Firebase
  checkUpdateInterval();
  
  // Take measurements at regular intervals
  if (currentMillis - lastMeasureTime >= measurementInterval) {
    lastMeasureTime = currentMillis;
    
    // Measure distance
    float currentDistance = measureDistance();
    
    // Check if distance reading is valid (not error and within reliable range)
    bool isValidReading = (currentDistance >= MIN_SENSOR_DISTANCE_CM && currentDistance <= 400 && currentDistance >= 0);
    
    float waterLevelPercentage;
    
    if (isValidReading) {
      // Reset error counter on valid reading
      consecutiveErrorReadings = 0;
      
      // Update the running average
      float averageDistance = updateMovingAverage(currentDistance);
      
      // Calculate water level percentage based on average distance
      waterLevelPercentage = calculateWaterLevelPercentage(averageDistance);
      
      // Store in history for trend analysis
      updateHistory(waterLevelPercentage, currentMillis);
      
      // Update last valid reading
      lastValidLevel = waterLevelPercentage;
      lastValidReading = currentMillis;
      
      Serial.printf("Raw: %.1f cm | Avg: %.1f cm | Level: %.1f%% | Empty: %.1f | Full: %.1f | VALID\n", 
                    currentDistance, averageDistance, waterLevelPercentage, emptyTankDistance, fullTankDistance);
    } else {
      // Invalid reading detected
      consecutiveErrorReadings++;
      Serial.printf("Distance: %.1f cm | Status: INVALID (out of range) | Errors: %d\n", 
                    currentDistance, consecutiveErrorReadings);
      
      if (consecutiveErrorReadings >= maxConsecutiveErrors) {
        // Use trend-based estimation
        waterLevelPercentage = estimateWaterLevelFromTrend(currentMillis);
        Serial.printf("Using trend estimation: %.1f%%\n", waterLevelPercentage);
      } else {
        // Use last valid reading
        waterLevelPercentage = lastValidLevel;
        Serial.printf("Using last valid reading: %.1f%%\n", waterLevelPercentage);
      }
    }
    
    // Upload to Firebase at specified intervals
    if (currentMillis - lastUploadTime >= uploadInterval) {
      lastUploadTime = currentMillis;
      Serial.println("=== Uploading to Firebase... ===");
      if (uploadToFirebase(currentDistance, waterLevelPercentage, !isValidReading)) {
        Serial.println("=== Upload successful! ===");
      } else {
        Serial.println("=== Upload failed! ===");
      }
    }
  }
}

// Function to initialize interval in Firebase
void initializeIntervalInFirebase() {
  if (!firebaseInitialized) {
    Serial.println("Cannot initialize interval - Firebase not initialized");
    return;
  }
  
  Serial.println("Setting default interval in Firebase...");
  // Set the default upload interval
  String intervalPath = String(DEVICE_ID) + "/interval";
  
  if (Firebase.RTDB.setInt(&fbdo, intervalPath, uploadInterval)) {
    Serial.println("Default interval set in Firebase successfully");
  } else {
    Serial.println("Failed to set default interval");
    Serial.println("REASON: " + fbdo.errorReason());
    Serial.println("PATH: " + fbdo.dataPath());
  }
}

// Function to check if the update interval has been changed in Firebase
void checkUpdateInterval() {
  if (!firebaseInitialized) return;
  
  String intervalPath = String(DEVICE_ID) + "/interval";
  
  if (Firebase.RTDB.getInt(&fbdo, intervalPath)) {
    if (fbdo.dataType() == "int") {
      int newInterval = fbdo.intData();
      
      // Only update if different from current value
      if (newInterval != uploadInterval && newInterval > 0) {
        uploadInterval = newInterval;
        Serial.print("Update interval changed to: ");
        Serial.print(uploadInterval);
        Serial.println(" ms");
      }
    }
  }
}


// Function to update historical data for trend analysis
void updateHistory(float level, unsigned long timestamp) {
  levelHistory[historyIndex] = level;
  timeHistory[historyIndex] = timestamp;
  
  historyIndex = (historyIndex + 1) % historySize;
  if (historyIndex == 0) {
    historyFilled = true;
  }
}

// Function to estimate water level based on historical trends
float estimateWaterLevelFromTrend(unsigned long currentTime) {
  if (!historyFilled && historyIndex < 3) {
    // Not enough data for trend analysis
    return lastValidLevel >= 0 ? lastValidLevel : 50.0; // Default to 50% if no valid data
  }
  
  // Calculate trend from recent data points
  int dataPoints = historyFilled ? historySize : historyIndex;
  float sumLevel = 0;
  float sumTime = 0;
  float sumLevelTime = 0;
  float sumTimeSquared = 0;
  
  // Use relative timestamps to avoid overflow
  unsigned long baseTime = timeHistory[0];
  
  for (int i = 0; i < dataPoints; i++) {
    float level = levelHistory[i];
    float relativeTime = (timeHistory[i] - baseTime) / 1000.0; // Convert to seconds
    
    sumLevel += level;
    sumTime += relativeTime;
    sumLevelTime += level * relativeTime;
    sumTimeSquared += relativeTime * relativeTime;
  }
  
  // Calculate linear regression coefficients
  float n = dataPoints;
  float slope = (n * sumLevelTime - sumTime * sumLevel) / (n * sumTimeSquared - sumTime * sumTime);
  float intercept = (sumLevel - slope * sumTime) / n;
  
  // Estimate current level based on trend
  float currentRelativeTime = (currentTime - baseTime) / 1000.0;
  float estimatedLevel = intercept + slope * currentRelativeTime;
  
  // Constrain to reasonable bounds
  estimatedLevel = constrain(estimatedLevel, 0, 100);
  
  Serial.printf("Trend analysis: slope=%.3f, intercept=%.1f, estimated=%.1f%%\n", 
                slope, intercept, estimatedLevel);
  
  return estimatedLevel;
}

// Function to upload data to Firebase
bool uploadToFirebase(float distance, float waterLevel, bool isEstimated) {
  if (!firebaseInitialized) {
    Serial.println("Cannot upload - Firebase not initialized");
    return false;
  }
  
  bool success = true;
  
  // Create timestamp
  time_t now = time(nullptr);
  String timestamp = String(now);
  
  // Set distance
  String distancePath = String(DEVICE_ID) + "/distance";
  if (Firebase.RTDB.setFloat(&fbdo, distancePath, distance)) {
    Serial.printf("Distance: %.1f cm\n", distance);
  } else {
    Serial.println("Distance update failed");
    success = false;
  }
  
  delay(50);
  
  // Set water level
  String waterLevelPath = String(DEVICE_ID) + "/waterLevel";
  if (Firebase.RTDB.setFloat(&fbdo, waterLevelPath, waterLevel)) {
    Serial.printf("Level: %.1f%%\n", waterLevel);
  } else {
    Serial.println("Level update failed");
    success = false;
  }
  
  delay(50);
  
  // Set timestamp
  String timestampPath = String(DEVICE_ID) + "/timestamp";
  if (Firebase.RTDB.setString(&fbdo, timestampPath, timestamp)) {
    Serial.println("Timestamp updated");
  } else {
    Serial.println("Timestamp update failed");
    success = false;
  }
  
  delay(50);
  
  // Set status
  String statusPath = String(DEVICE_ID) + "/status";
  String status = isEstimated ? "estimated" : "measured";
  if (Firebase.RTDB.setString(&fbdo, statusPath, status)) {
    Serial.println("Status: " + status);
  } else {
    Serial.println("Status update failed");
    success = false;
  }
  
  return success;
}

float updateMovingAverage(float newReading) {
  // Subtract the last reading from the sum
  distanceSum = distanceSum - distanceReadings[readingIndex] + newReading;
  
  // Store the new reading
  distanceReadings[readingIndex] = newReading;
  
  // Move to the next position in the array
  readingIndex = (readingIndex + 1) % numReadingsForAverage;
  
  // Set the buffer filled flag once we've gone through the array once
  if (readingIndex == 0) {
    bufferFilled = true;
  }
  
  // Calculate the average
  if (bufferFilled) {
    return distanceSum / numReadingsForAverage;
  } else {
    return distanceSum / (readingIndex == 0 ? numReadingsForAverage : readingIndex);
  }
}

float measureDistance() {
  // Use exact same approach as your working test code
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  long duration = pulseIn(echoPin, HIGH);
  float distance = (duration * 0.034) / 2;
  
  // Basic validation - return -1 if reading seems invalid
  if (duration == 0 || distance < 2 || distance > 400) {
    return -1;
  }
  
  return distance;
}

float calculateWaterLevelPercentage(float distance) {
  // Handle edge cases
  if (distance <= fullTankDistance) {
    return 100.0; // Tank is full or overfull
  }
  if (distance >= emptyTankDistance) {
    return 0.0; // Tank is empty
  }
  
  // Calculate percentage based on the calibration values
  // When distance equals emptyTankDistance -> 0%
  // When distance equals fullTankDistance -> 100%
  float percentage = map(distance, emptyTankDistance, fullTankDistance, 0, 100);
  
  // Ensure the percentage is between 0 and 100
  percentage = constrain(percentage, 0, 100);
  
  return percentage;
}

// Helper function to map float values (similar to Arduino's map function but for floats)
float map(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
