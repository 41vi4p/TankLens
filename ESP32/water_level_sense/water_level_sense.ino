#include <Arduino.h>

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

unsigned long lastMeasureTime = 0;

void setup() {
  // Initialize Serial Monitor
  Serial.begin(115200);
  delay(1000);
  Serial.println("Water Level Measurement System");
  Serial.println("-------------------------------");
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
}

void loop() {
  unsigned long currentMillis = millis();
  
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
  }
}

// Function to update the moving average with a new reading
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
