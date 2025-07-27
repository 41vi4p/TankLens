#!/usr/bin/env python3
"""
TankLens Data Sync Server

This script fetches data from Firebase Realtime Database and stores it in Firestore
every 10 minutes for graph visualization on the user dashboard.
"""

import os
import time
import logging
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore, db
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("tanklens_sync.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Path to service account credentials - will need to be created
CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-credentials.json')

def initialize_firebase():
    """Initialize Firebase Admin SDK with credentials."""
    try:
        # Initialize Firebase
        cred = credentials.Certificate(CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred, {
            'databaseURL': os.getenv('FIREBASE_DATABASE_URL'),
        })
        logger.info("Firebase initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        return False

def get_all_devices():
    """Get all devices from Firestore that have owner access."""
    try:
        # Get Firestore client
        firestore_db = firestore.client()
        
        # Query device_access collection for all devices with owner access
        device_refs = firestore_db.collection('device_access').where('accessType', '==', 'owner').stream()
        
        # Extract unique device IDs
        device_ids = set()
        for doc in device_refs:
            device_data = doc.to_dict()
            device_ids.add(device_data.get('deviceId'))
        
        logger.info(f"Found {len(device_ids)} devices with owner access")
        return list(device_ids)
    except Exception as e:
        logger.error(f"Error getting devices: {e}")
        return []

def process_device(device_id):
    """Process a single device - get RTDB data and store in Firestore."""
    try:
        logger.info(f"Processing device: {device_id}")
        
        # Get reference to RTDB
        rtdb_ref = db.reference(f'/{device_id}')
        rtdb_data = rtdb_ref.get()
        
        if not rtdb_data:
            logger.warning(f"No data found in RTDB for device: {device_id}")
            return False
        
        # Get current timestamp
        now = datetime.now()
        iso_timestamp = now.isoformat()
        
        # Extract values from RTDB
        water_level = rtdb_data.get('waterLevel', 0)
        distance = rtdb_data.get('distance', 0)
        rtdb_timestamp = rtdb_data.get('timestamp', '')
        
        # Create tank data object
        tank_data = {
            'timestamp': iso_timestamp,
            'level': water_level
        }
        
        # Get Firestore client
        firestore_db = firestore.client()
        
        # Reference to device document
        device_ref = firestore_db.collection('devices').document(device_id)
        device_doc = device_ref.get()
        
        if not device_doc.exists:
            logger.warning(f"Device document doesn't exist in Firestore for: {device_id}")
            return False
        
        # Update device data in Firestore
        device_ref.update({
            'data': firestore.ArrayUnion([tank_data]),
            'lastUpdated': iso_timestamp
        })
        
        # Store historical data in separate collection
        history_ref = device_ref.collection('history').document(iso_timestamp.replace(':', '_').replace('.', '_'))
        history_ref.set({
            'timestamp': iso_timestamp,
            'level': water_level,
            'distance': distance
        })
        
        logger.info(f"Successfully updated Firestore for device: {device_id}")
        return True
    except Exception as e:
        logger.error(f"Error processing device {device_id}: {e}")
        return False

def sync_tank_data():
    """Main function to sync tank data from RTDB to Firestore."""
    logger.info("Starting tank data synchronization")
    
    # Get all devices
    device_ids = get_all_devices()
    
    if not device_ids:
        logger.warning("No devices found to process")
        return
    
    # Process each device
    success_count = 0
    for device_id in device_ids:
        success = process_device(device_id)
        if success:
            success_count += 1
    
    logger.info(f"Completed synchronization. Processed {success_count}/{len(device_ids)} devices successfully")

def main():
    """Main entry point for the application."""
    logger.info("Starting TankLens Data Sync Server")
    
    # Initialize Firebase
    if not initialize_firebase():
        logger.error("Failed to initialize Firebase. Exiting.")
        return
    
    # Create scheduler
    scheduler = BackgroundScheduler()
    
    # Schedule sync task to run every 10 minutes
    scheduler.add_job(
        sync_tank_data,
        trigger=CronTrigger(minute='*/10'),  # Run every 10 minutes
        id='sync_tank_data',
        name='Sync tank data from RTDB to Firestore'
    )
    
    # Also run once immediately on startup
    scheduler.add_job(
        sync_tank_data,
        trigger='date',
        run_date=datetime.now(),
        id='initial_sync',
        name='Initial tank data sync'
    )
    
    # Start the scheduler
    scheduler.start()
    logger.info("Scheduler started. Synchronization will occur every 10 minutes.")
    
    try:
        # Keep the script running
        while True:
            time.sleep(60)
    except (KeyboardInterrupt, SystemExit):
        # Shut down the scheduler gracefully
        scheduler.shutdown()
        logger.info("Scheduler shut down. Exiting application.")

if __name__ == "__main__":
    main()