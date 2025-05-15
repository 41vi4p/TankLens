#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// Provide the token generation process info
#include <addons/TokenHelper.h>
// Provide the RTDB payload printing info and other helper functions
#include <addons/RTDBHelper.h>

// Include configuration
#include "config.h"

// AJ-SR04M Ultrasonic Sensor pins
const int trigPin = 13;    // GPIO13 for trigger
const int echoPin = 18;    // GPIO18 for echo

// Tank calibration values
int emptyTankDistance = 70;  // Distance when tank is empty (cm)
int fullTankDistance = 21;   // Distance when tank is full (cm)

// Measurement settings
const int measurementInterval = 1000; // Measure every 1 second
const int numReadingsForAverage = 10; // Number of readings to average
float distanceReadings[10];          // Array to store distance readings
int readingIndex = 0;                // Current position in the array
bool bufferFilled = false;           // Flag to track if buffer is filled
float distanceSum = 0;               // Sum of readings in the buffer

// Firebase settings
int uploadInterval = 20000; // Default upload interval is 20 seconds
unsigned long lastUploadTime = 0;
unsigned long lastMeasureTime = 0;

// Firebase objects
FirebaseData fbdo;
FirebaseConfig firebaseConfig;
FirebaseAuth firebaseAuth;

bool firebaseInitialized = false;

void setup() {
  // Initialize Serial Monitor
  Serial.begin(115200);
  delay(1000);
  Serial.println("TankLens Water Level Monitoring System");
  Serial.println("-------------------------------");
  Serial.println("Device ID: " + String(DEVICE_ID));
  Serial.println("Calibration values:");
  Serial.print("Empty tank distance: ");
  Serial.print(emptyTankDistance);
  Serial.println(" cm");
  Serial.print("Full tank distance: ");
  Serial.print(fullTankDistance);
  Serial.println(" cm");
  Serial.println("-------------------------------");
  
  // Initialize ultrasonic sensor pins
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  
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

  // Initialize Firebase
  initFirebase();
  
  // Initialize default interval in Firebase if needed
  if (firebaseInitialized) {
    initializeIntervalInFirebase();
  }
}

void initFirebase() {
  Serial.println("Initializing Firebase connection...");
  
  // Set database URL and auth secret
  firebaseConfig.database_url = FIREBASE_HOST;
  firebaseConfig.signer.tokens.legacy_token = FIREBASE_AUTH;
  
  // Enable more debug info
  Firebase.setDoubleDigits(5);
  fbdo.setResponseSize(4096);
  
  // Initialize the library with the Firebase authentication and configuration
  Firebase.begin(&firebaseConfig, &firebaseAuth);
  
  // We can't get the initialization status directly from Firebase.begin(), so we'll test with a write
  Firebase.reconnectWiFi(true);
  
  // Try a simple test write to verify connection
  if (Firebase.RTDB.setString(&fbdo, "/test", "Connected")) {
    Serial.println("Test write successful!");
    firebaseInitialized = true;
  } else {
    Serial.println("Test write failed");
    Serial.println("REASON: " + fbdo.errorReason());
    Serial.println("PATH: " + fbdo.dataPath());
    Serial.println("EVENT: " + fbdo.eventType());
    firebaseInitialized = false;
  }
  
  if (firebaseInitialized) {
    Serial.println("Firebase successfully initialized!");
  } else {
    Serial.println("Firebase initialization failed!");
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
    
    // Update the running average
    float averageDistance = updateMovingAverage(currentDistance);
    
    // Calculate water level percentage based on average distance
    float waterLevelPercentage = calculateWaterLevelPercentage(averageDistance);
    
    // Print results
    Serial.print("Current Distance: ");
    Serial.print(currentDistance);
    Serial.print(" cm | Average Distance: ");
    Serial.print(averageDistance);
    Serial.print(" cm | Water Level: ");
    Serial.print(waterLevelPercentage);
    Serial.println("%");
    
    // Upload to Firebase at specified intervals
    if (currentMillis - lastUploadTime >= uploadInterval) {
      lastUploadTime = currentMillis;
      Serial.println("=== Uploading to Firebase... ===");
      if (uploadToFirebase(averageDistance, waterLevelPercentage)) {
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

// Function to upload data to Firebase
bool uploadToFirebase(float distance, float waterLevel) {
  if (!firebaseInitialized) {
    Serial.println("Cannot upload - Firebase not initialized");
    return false;
  }
  
  bool success = true;
  
  // Create timestamp
  unsigned long timestamp = millis();
  String timestampStr = String(timestamp);
  
  // Set distance
  String distancePath = String(DEVICE_ID) + "/distance";
  if (Firebase.RTDB.setFloat(&fbdo, distancePath, distance)) {
    Serial.println("Distance updated in Firebase: " + String(distance));
  } else {
    Serial.println("Failed to update distance");
    Serial.println("REASON: " + fbdo.errorReason());
    Serial.println("PATH: " + fbdo.dataPath());
    success = false;
  }
  
  // Add a small delay to prevent overwhelming the Firebase connection
  delay(200);
  
  // Set water level
  String waterLevelPath = String(DEVICE_ID) + "/waterLevel";
  if (Firebase.RTDB.setFloat(&fbdo, waterLevelPath, waterLevel)) {
    Serial.println("Water level updated in Firebase: " + String(waterLevel));
  } else {
    Serial.println("Failed to update water level");
    Serial.println("REASON: " + fbdo.errorReason());
    Serial.println("PATH: " + fbdo.dataPath());
    success = false;
  }
  
  // Add a small delay
  delay(200);
  
  // Set timestamp
  String timestampPath = String(DEVICE_ID) + "/timestamp";
  if (Firebase.RTDB.setString(&fbdo, timestampPath, timestampStr)) {
    Serial.println("Timestamp updated in Firebase: " + timestampStr);
  } else {
    Serial.println("Failed to update timestamp");
    Serial.println("REASON: " + fbdo.errorReason());
    Serial.println("PATH: " + fbdo.dataPath());
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
  // Clear the trigger pin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  
  // Send a 10µs pulse to the trigger pin
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  // Read the echo pin, returns the sound wave travel time in microseconds
  long duration = pulseIn(echoPin, HIGH);
  
  // Calculate the distance (in cm) based on the speed of sound
  float distance = duration * 0.034f / 2;
  
  return distance;
}

float calculateWaterLevelPercentage(float distance) {
  // Constrain distance to be within calibration range
  float constrainedDistance = constrain(distance, fullTankDistance, emptyTankDistance);
  
  // Calculate percentage based on the calibration values
  // When distance equals emptyTankDistance -> 0%
  // When distance equals fullTankDistance -> 100%
  float percentage = map(constrainedDistance, emptyTankDistance, fullTankDistance, 0, 100);
  
  // Ensure the percentage is between 0 and 100
  percentage = constrain(percentage, 0, 100);
  
  return percentage;
}

// Helper function to map float values (similar to Arduino's map function but for floats)
float map(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
