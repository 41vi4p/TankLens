# Firebase Security Rules Setup for TankLens

## Current Permission Error

The error `"Permission denied"` when accessing Firebase Realtime Database occurs because the default security rules don't allow read access. Here's how to fix it:

## 1. Firebase Realtime Database Rules

Go to Firebase Console > Realtime Database > Rules and update to:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "$deviceId": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

**For Development/Testing (Temporary):**
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

⚠️ **Warning**: The development rules allow public access. Use only for testing!

## 2. Firestore Security Rules

Go to Firebase Console > Firestore > Rules and update to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own device access records
    match /device_access/{document} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    // Device owners can read/write device data
    match /devices/{deviceId} {
      allow read, write: if request.auth != null 
        && exists(/databases/$(database)/documents/device_access/$(deviceId + '_' + request.auth.uid));
    }
  }
}
```

**For Development/Testing (Temporary):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 3. Production-Ready Rules

### Realtime Database (Production)
```json
{
  "rules": {
    "$deviceId": {
      // ESP32 can write sensor data (uses database secret)
      ".write": true,
      // Authenticated users can read if they have access
      ".read": "auth != null && root.child('device_access').child($deviceId + '_' + auth.uid).exists()"
    }
  }
}
```

### Firestore (Production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Device access control
    match /device_access/{accessId} {
      allow read: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null 
        && request.auth.uid == resource.data.userId 
        && resource.data.accessType == 'owner';
    }
    
    // Device data
    match /devices/{deviceId} {
      allow read: if request.auth != null 
        && exists(/databases/$(database)/documents/device_access/$(deviceId + '_' + request.auth.uid));
      allow create: if request.auth != null;
      allow update: if request.auth != null 
        && exists(/databases/$(database)/documents/device_access/$(deviceId + '_' + request.auth.uid));
      allow delete: if request.auth != null 
        && get(/databases/$(database)/documents/device_access/$(deviceId + '_' + request.auth.uid)).data.accessType == 'owner';
    }
  }
}
```

## 4. Quick Fix for Immediate Testing

1. **Go to Firebase Console**
2. **Select your "tanklens" project**
3. **Navigate to Realtime Database > Rules**
4. **Replace current rules with:**
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
5. **Click "Publish"**

6. **Navigate to Firestore > Rules**
7. **Replace current rules with:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
8. **Click "Publish"**

## 5. ESP32 Authentication

The ESP32 uses a database secret for authentication. Make sure:

1. **Database secret is correct** in your ESP32 config.h
2. **Database URL matches** the one in your .env.local
3. **Device writes to the correct path**: `/DEV_01/waterLevel`, `/DEV_01/distance`, etc.

## 6. Testing the Fix

After updating the rules, test in your web app:

```javascript
// Open browser console and run:
import { fetchRealTimeSensorData } from '@/lib/firebase';
fetchRealTimeSensorData('DEV_01').then(console.log);
```

Expected result: Either real sensor data or `null` (no error).

## 7. Verification Steps

1. **Check ESP32 Serial Monitor**: Verify it's uploading data successfully
2. **Check Firebase Realtime Database Console**: Verify data appears under your device ID
3. **Check Web App Console**: Should see no permission errors
4. **Test Delete Function**: Try deleting and re-adding a device
5. **Test Refresh**: Click refresh button to fetch new data

## 8. Common Issues

### "Permission denied" errors:
- Ensure user is authenticated before database calls
- Check that rules allow authenticated users
- Verify device access records exist in Firestore

### ESP32 can't write:
- Check database secret in config.h
- Verify database URL format
- Check ESP32 serial output for Firebase errors

### Data not appearing:
- Verify ESP32 device ID matches web app device ID
- Check that data structure matches expected format
- Ensure timestamps are properly formatted

## 9. Security Considerations

**Development**: Use open rules for quick testing  
**Production**: Use strict rules with proper access control  
**ESP32**: Uses database secret (different from web API key)  
**Web App**: Uses Firebase Auth with Google OAuth

## 10. Rollback Plan

If issues occur, revert to these minimal working rules:

**Realtime Database:**
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": true
  }
}
```

**Firestore:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This setup allows authenticated users full access while keeping ESP32 write access open.