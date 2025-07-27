# TankLens Version Changelog

All notable changes to the TankLens IoT Water Level Monitoring System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.4] - 2025-07-27

### 🎯 Major Hardware Upgrade
**A02YYUW Waterproof Sensor Integration**

### Added
- **A02YYUW Waterproof Ultrasonic Sensor Support**
  - IP67 waterproof rating for reliable tank monitoring
  - 3-450cm measurement range (extended from previous sensor)
  - UART serial communication (9600 baud) for improved reliability
  - 40kHz ±1kHz ultrasonic frequency with 60° sensing angle
  - 100ms response time with ±1% accuracy

- **Enhanced Data Architecture**
  - Dual data source system: Historical data from Firestore + Real-time from Firebase RTDB
  - Historical data sync interval reduced from 60 minutes to 10 minutes
  - Combined data visualization in dashboard charts
  - Data source indicators: "📊 Historical + 📡 Live"

- **Improved ESP32 Communication**
  - UART protocol implementation with checksum validation
  - Pin configuration: RX=D15 (GPIO15), TX=D18 (GPIO18)
  - Enhanced error handling and sensor timeout management
  - Moving average filtering optimized for UART data

### Changed
- **ESP32 Code Overhaul**
  - Replaced trigger/echo pins with UART serial communication
  - Updated measurement function for A02YYUW protocol
  - Improved sensor initialization and timing parameters
  - Enhanced measurement interval from 2 seconds to 1 second

- **Dashboard Enhancements**
  - Historical data now fetched from Firestore subcollections
  - Real-time data continues from Firebase RTDB for current status
  - Combined data rendering in charts with deduplication
  - Improved data loading with better error handling

- **Server Performance**
  - tanklens-server sync interval optimized to 10 minutes
  - Improved data consistency across historical and real-time sources
  - Enhanced logging for sync operations

### Fixed
- Sensor communication reliability issues
- Data synchronization gaps between historical and real-time data
- Chart rendering performance with larger datasets
- Sensor timeout and error recovery mechanisms

### Technical Details
- **Sensor Specifications**: Range 3-450cm, IP67, UART 9600 baud
- **Communication Protocol**: 4-byte UART frames with checksum validation
- **Power Requirements**: 3.3-5V, ≤8mA average current
- **Data Sync**: Every 10 minutes (server) + Every 5 seconds (dashboard refresh)

---

## [v1.3] - 2025-07-20

### Added
- **Enhanced Chart Visualization**
  - Multiple chart types: Area, Line, and Bar charts
  - Time range selection: 5min, 15min, 30min, 1hr, 12hrs, 24hr, week, monthly
  - Interactive chart controls with dropdown menus
  - Responsive chart design for mobile devices

- **Auto-refresh System**
  - Automatic data refresh every 5 seconds
  - Pause/resume auto-refresh functionality
  - Visibility-based refresh management
  - Last refresh timestamp display

- **Device Management**
  - Device sharing functionality with modal interface
  - Device deletion with confirmation dialog
  - User-friendly device cards with action buttons
  - Device access control (owner/viewer permissions)

### Changed
- **UI/UX Improvements**
  - Enhanced device card layout with better spacing
  - Improved color coding for water level status
  - Better responsive design for tablet and mobile
  - Updated typography and visual hierarchy

- **Data Visualization**
  - Chart tooltips with formatted timestamps
  - Custom color scheme matching app theme
  - Improved data point rendering and performance
  - Better handling of empty data states

### Fixed
- Chart rendering issues on smaller screens
- Data refresh synchronization problems
- Memory leaks in auto-refresh intervals
- Firebase authentication edge cases

---

## [v1.2] - 2025-07-15

### Added
- **Advanced Sensor Features**
  - Trend-based water level estimation for sensor errors
  - Smart 20cm minimum distance handling
  - Consecutive error tracking and fallback mechanisms
  - Moving average filtering for stable readings

- **Firebase Integration Enhancement**
  - Firestore integration for historical data storage
  - Device access control system
  - User device association management
  - Real-time database optimizations

### Changed
- **ESP32 Code Improvements**
  - Enhanced error handling and recovery
  - Improved WiFi connectivity management
  - Optimized measurement algorithms
  - Better memory management

- **Web Dashboard**
  - User greeting system with time-based messages
  - Enhanced device status indicators
  - Improved loading states and error handling
  - Better mobile responsiveness

### Fixed
- Sensor accuracy issues in edge cases
- Firebase connection stability
- Data synchronization timing issues
- UI rendering bugs on various devices

---

## [v1.1] - 2025-07-10

### Added
- **User Authentication System**
  - Google OAuth integration
  - Secure user sessions
  - User-specific device management
  - Authentication state management

- **Device Configuration**
  - Tank calibration settings
  - Device naming and location
  - Maximum capacity configuration
  - Custom device IDs

### Changed
- **Web Interface Redesign**
  - Modern React/Next.js architecture
  - Tailwind CSS styling system
  - Responsive design implementation
  - Dark/light theme support

- **Data Management**
  - Structured Firestore database
  - Real-time data synchronization
  - Historical data retention
  - Improved data queries

### Fixed
- Initial beta testing issues
- Performance optimizations
- Cross-browser compatibility
- Mobile device support

---

## [v1.0] - 2025-05-15

### Added
- **Initial Release**
  - ESP32-based water level monitoring
  - AJ-SR04M ultrasonic sensor support
  - Basic Firebase Realtime Database integration
  - Simple web dashboard
  - Real-time data updates

- **Core Features**
  - Water level percentage calculation
  - Distance measurement
  - WiFi connectivity
  - Basic data visualization

### Technical Foundation
- ESP32 microcontroller platform
- Arduino IDE development environment
- Firebase backend services
- Next.js frontend framework

---


## 📊 Version Statistics

| Version | Release Date | Major Features | Sensor Type | Sync Interval |
|---------|-------------|----------------|-------------|---------------|
| v1.4    | 2025-07-27  | A02YYUW Sensor, UART, Dual Data | A02YYUW | 10 minutes |
| v1.3    | 2025-07-20  | Advanced Charts, Auto-refresh | AJ-SR04M | 60 minutes |
| v1.2    | 2025-07-15  | Trend Analysis, Firestore | AJ-SR04M | 60 minutes |
| v1.1    | 2025-07-10  | Authentication, Device Management | AJ-SR04M | Manual |
| v1.0    | 2025-05-15  | Initial Release | AJ-SR04M | Manual |

---

## 🤝 Contributing

We welcome contributions! Please visit our [GitHub repository](https://github.com/41vi4p/TankLens) to submit pull requests, report issues, and suggest improvements.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**TankLens** - Smart Water Level Monitoring © 2025