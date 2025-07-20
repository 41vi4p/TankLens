# TankLens Data Sync Server

Python server that fetches water level data from Firebase Realtime Database and stores it in Firestore on an hourly basis. This historical data is used to display graphs on the user dashboard.

## Setup Instructions

### Prerequisites
- Python 3.7 or higher
- Firebase project with Realtime Database and Firestore
- Firebase service account credentials

### Installation

1. Clone the repository or navigate to this directory
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

### Firebase Setup

1. Go to your Firebase project settings in the Firebase Console
2. Navigate to "Service accounts" tab
3. Click "Generate new private key" button
4. Save the JSON file as `firebase-credentials.json` in this directory

### Configuration

1. Copy the `.env.template` file to `.env`:
   ```
   cp .env.template .env
   ```
2. Edit the `.env` file with your Firebase configuration:
   - `FIREBASE_DATABASE_URL`: Your Firebase Realtime Database URL
   - `FIREBASE_CREDENTIALS_PATH`: Path to your Firebase credentials JSON file (default: firebase-credentials.json)

## Running the Server

To start the server:
```
python tanklens_sync.py
```

The server will:
- Run in the background
- Sync data from Realtime Database to Firestore every hour
- Also sync immediately on startup
- Log all activities to console and `tanklens_sync.log` file

## Running as a System Service

### Linux (systemd)

1. Create a service file:
   ```
   sudo nano /etc/systemd/system/tanklens-sync.service
   ```

2. Add the following content (modify paths as needed):
   ```
   [Unit]
   Description=TankLens Data Sync Service
   After=network.target

   [Service]
   User=your_username
   WorkingDirectory=/path/to/tanklens-server
   ExecStart=/usr/bin/python3 /path/to/tanklens-server/tanklens_sync.py
   Restart=always
   RestartSec=10
   StandardOutput=syslog
   StandardError=syslog
   SyslogIdentifier=tanklens-sync

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```
   sudo systemctl enable tanklens-sync
   sudo systemctl start tanklens-sync
   ```

### Windows

1. Install NSSM (Non-Sucking Service Manager):
   - Download from: https://nssm.cc/download
   
2. Install as a service:
   ```
   nssm install TankLensSync
   ```
   
3. In the GUI that appears, set:
   - Path: path to your Python executable
   - Startup directory: path to tanklens-server directory
   - Arguments: tanklens_sync.py

4. Start the service:
   ```
   nssm start TankLensSync
   ```

## Logs

Logs are stored in `tanklens_sync.log` in the application directory. You can monitor logs with:

```
tail -f tanklens_sync.log
```

## Troubleshooting

If the server isn't connecting to Firebase:
1. Check that your credentials file is valid and has the correct permissions
2. Verify the database URL in your .env file
3. Ensure your Firebase project has Realtime Database and Firestore enabled