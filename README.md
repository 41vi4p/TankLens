# TankLens 🌊

**IoT-based Water Level Monitoring System v1.4**

TankLens is a comprehensive water level monitoring solution that combines ESP32 IoT sensors, waterproof ultrasonic sensors, real-time data synchronization, and a modern web dashboard to help you monitor your water tanks remotely with precision and ease.

![Version](https://img.shields.io/badge/version-1.4-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![Status](https://img.shields.io/badge/status-active-brightgreen.svg)

## 🚀 Features

- **Real-time Water Level Monitoring**: ESP32-based sensors with A02YYUW waterproof ultrasonic sensor
- **Smart Calibration**: Configurable tank parameters for accurate percentage calculations
- **Live Dashboard**: Modern React/Next.js web interface with interactive charts and real-time metrics
- **User Authentication**: Secure Google OAuth integration
- **Device Sharing**: Share tank monitoring access with multiple users
- **Historical Data**: Automated data collection with 10-minute sync intervals
- **Dual Data Sources**: Historical data from Firestore + real-time data from Firebase RTDB
- **Waterproof Design**: IP67-rated A02YYUW sensor for reliable tank monitoring
- **UART Communication**: Reliable serial communication (9600 baud) instead of trigger/echo
- **Enhanced Performance**: Faster measurements with improved sensor reliability
- **Responsive Design**: Mobile-friendly interface with dark/light theme support

## 🏗️ System Architecture

### Components

1. **ESP32 Sensor Module** (`/ESP32/`) - Hardware sensor with WiFi connectivity
2. **Next.js Web Application** (`/tanklens/`) - User dashboard and interface
3. **Python Sync Server** (`/tanklens-server/`) - Data synchronization service
4. **Firebase Functions** (`/tanklens-functions/`) - Cloud functions for backend logic

### Data Flow

```
ESP32 Sensor → Firebase RTDB → Python Sync Server → Firestore → Web Dashboard
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Arduino IDE with ESP32 support
- Firebase project with Firestore and Realtime Database enabled

### 1. ESP32 Sensor Setup

1. Install required Arduino libraries:
   - Firebase ESP Client
   - WiFi library

2. Configure sensor settings in `ESP32/water_level_sense/config.h`:
   ```cpp
   #define WIFI_SSID "your-wifi-network"
   #define WIFI_PASSWORD "your-wifi-password"
   #define FIREBASE_HOST "your-project.firebaseio.com"
   #define FIREBASE_AUTH "your-database-secret"
   #define DEVICE_ID "tank001"
   ```

3. Calibrate tank measurements by adjusting:
   - `emptyTankDistance`: Distance when tank is empty (cm)
   - `fullTankDistance`: Distance when tank is full (cm)

4. Upload code to ESP32 and connect A02YYUW waterproof ultrasonic sensor:
   - RX Pin: D15 (GPIO15) - connects to sensor TX
   - TX Pin: D18 (GPIO18) - connects to sensor RX
   - Communication: UART Serial (9600 baud)
   - Power: 3.3-5V, IP67 waterproof rating

### 2. Web Application Setup

1. Navigate to the frontend directory:
   ```bash
   cd tanklens
   npm install
   ```

2. Create `.env.local` with Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### 3. Python Sync Server Setup

1. Navigate to server directory:
   ```bash
   cd tanklens-server
   pip install -r requirements.txt
   ```

2. Create `.env` file:
   ```
   FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
   FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
   ```

3. Add Firebase service account credentials as `firebase-credentials.json`

4. Run the sync server:
   ```bash
   python tanklens_sync.py
   ```

## 📊 Usage

### Adding a New Device

1. Log in to the web dashboard using Google OAuth
2. Click "Add New Device" 
3. Enter device details:
   - Device ID (must match ESP32 configuration)
   - Tank name and location
   - Maximum capacity in liters

### Monitoring Water Levels

- View real-time water level percentages and volume
- Monitor historical data with interactive charts
- Refresh data manually or wait for automatic updates
- Share device access with other users via email

### Device Calibration

Water level percentages are calculated based on ultrasonic distance measurements:
- **Empty Tank**: Sensor reads maximum distance
- **Full Tank**: Sensor reads minimum distance
- **Percentage**: `(emptyDistance - currentDistance) / (emptyDistance - fullDistance) × 100`

## 🔧 Configuration

### ESP32 Settings

- **Measurement Interval**: 1 second for distance readings
- **Dashboard Refresh**: 5 seconds for real-time updates
- **Upload Interval**: 30 seconds (configurable via Firebase)
- **Moving Average**: 5 readings for stability
- **Sensor Communication**: UART Serial (9600 baud)
- **Sensor Range**: 3-450cm with IP67 waterproof protection
- **WiFi Auto-reconnect**: Enabled for reliability
- **Data Sync**: Real-time to Firebase RTDB, historical sync every 10 minutes to Firestore

### Firebase Structure

```
Realtime Database:
├── {deviceId}/
│   ├── distance: float
│   ├── waterLevel: float
│   ├── timestamp: string
│   └── interval: int

Firestore:
├── devices/
│   └── {deviceId}/
│       ├── name: string
│       ├── location: string
│       ├── maxCapacity: number
│       ├── data: array
│       └── lastUpdated: string
└── device_access/
    └── {deviceId}_{userId}/
        ├── deviceId: string
        ├── userId: string
        └── accessType: string
```

## 🚦 Development

### Frontend Technology Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts for data visualization
- **Authentication**: Firebase Auth with Google OAuth
- **Database**: Firestore for user data
- **State Management**: Zustand for client state
- **Icons**: Heroicons and React Icons

### Backend Services

- **Language**: Python 3.8+
- **Scheduler**: APScheduler for automated tasks
- **Database**: Firebase Admin SDK
- **Logging**: Comprehensive logging to file and console

### Available Scripts

Frontend:
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

Backend:
```bash
python tanklens_sync.py  # Start sync server
```

## 📋 Version History

See [CHANGELOG.md](https://github.com/41vi4p/TankLens/blob/main/version_changelog.md) for detailed version history and release notes.

**Latest Version**: v1.4 (Current)
- A02YYUW waterproof sensor integration
- Enhanced UART communication
- 10-minute historical data sync
- Improved dashboard with dual data sources

## 🔒 Security

- Google OAuth for secure authentication
- Firebase security rules for data access control
- Environment variables for sensitive configuration
- Device-level access control with owner/viewer permissions

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

**TankLens** - Monitor your water levels with confidence 💧