# Firestore Rules Fix for DeviceForm

## The Problem
The error `Missing or insufficient permissions` occurs when trying to add a device because the Firestore rules are too restrictive.

## Quick Fix - Copy These Rules

**Go to Firebase Console → Firestore → Rules and replace with:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow authenticated users to read and write device access records for themselves
    match /device_access/{accessId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
    }
    
    // Allow authenticated users to create, read, and manage devices
    match /devices/{deviceId} {
      // Anyone authenticated can create a new device
      allow create: if request.auth != null;
      
      // Anyone authenticated can read any device (for now - can be restricted later)
      allow read: if request.auth != null;
      
      // Anyone authenticated can update any device (for now - can be restricted later)  
      allow update: if request.auth != null;
      
      // Only authenticated users can delete devices
      allow delete: if request.auth != null;
    }
  }
}
```

## Steps to Apply:

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com/
   - Select your "tanklens" project

2. **Navigate to Firestore**
   - Click "Firestore Database" in the left sidebar
   - Click the "Rules" tab

3. **Replace Current Rules**
   - Delete everything in the rules editor
   - Copy and paste the rules above
   - Click "Publish"

## Alternative: Open Rules for Development

If you're still having issues, use these completely open rules for development:

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

## Testing the Fix

After updating the Firestore rules:

1. **Refresh your web application**
2. **Try adding a new device:**
   - Click "Add New Device"
   - Fill in Device ID: "DEV_01" 
   - Fill in Device Name: "Test Tank"
   - Fill in Location: "Kitchen"
   - Set Capacity: 1000
   - Click "Add Device"

3. **Check for success:**
   - Should see device appear in dashboard
   - No error messages in console
   - Device should be clickable and show data

## Expected Behavior After Fix

✅ **Device Creation**: Should work without permission errors  
✅ **Device Access**: Should create proper access records  
✅ **Device Display**: Should appear in dashboard immediately  
✅ **Device Deletion**: Should work with the delete button  

## If Still Having Issues

### Clear Browser Cache
- Hard refresh: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)
- Or clear all browser data for localhost:3000

### Check Authentication
- Make sure you're logged in via Google OAuth
- Check browser console for any auth errors

### Verify Rules Applied
- In Firebase Console, check that rules were published successfully
- Look for green "Published" status

## Production Rules (Use Later)

Once everything works, you can use more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    match /device_access/{accessId} {
      allow read: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null 
        && request.auth.uid == resource.data.userId 
        && resource.data.accessType == 'owner';
    }
    
    match /devices/{deviceId} {
      allow read: if request.auth != null 
        && exists(/databases/$(database)/documents/device_access/$(deviceId + '_' + request.auth.uid));
      allow create: if request.auth != null;
      allow update: if request.auth != null 
        && exists(/databases/$(database)/documents/device_access/$(deviceId + '_' + request.auth.uid));
      allow delete: if request.auth != null 
        && exists(/databases/$(database)/documents/device_access/$(deviceId + '_' + request.auth.uid))
        && get(/databases/$(database)/documents/device_access/$(deviceId + '_' + request.auth.uid)).data.accessType == 'owner';
    }
  }
}
```

But use the simpler rules first to get everything working!