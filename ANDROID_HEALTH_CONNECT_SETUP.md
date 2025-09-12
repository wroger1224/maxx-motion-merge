# Android Health Connect Integration Guide

## Overview
This app uses Health Connect to access fitness data from Google Fit and other health apps on Android devices. Health Connect is Android's unified health data platform that provides a secure way to share health and fitness data between apps.

## Prerequisites

### 1. Android Device Requirements
- Android 8.0 (API level 26) or higher
- Real Android device (not emulator/simulator)
- Health Connect app installed from Google Play Store

### 2. Install Health Connect
1. Open Google Play Store on your Android device
2. Search for "Health Connect"
3. Install the app by Google LLC
4. Open Health Connect and complete the initial setup

## Setup Instructions

### Step 1: Connect Google Fit to Health Connect
1. Open the Google Fit app on your Android device
2. Go to Settings → Manage connected apps
3. Find and select "Health Connect"
4. Enable data sharing with Health Connect
5. Select the data types you want to share (workouts, steps, etc.)

### Step 2: Grant Permissions to Our App
1. In the MAXX Motion app, tap "Activity Tracking"
2. Tap "Connect Tracker"
3. Select "Google Fit"
4. When prompted, grant the following permissions:
   - Steps
   - Distance
   - Exercise Sessions
   - Calories Burned
   - Heart Rate (if available)

### Step 3: Sync Your Data
After granting permissions, the app will automatically:
1. Fetch your workout data from the last 30 days
2. Import it into your MAXX Motion account
3. Display a success message with the number of activities imported

## Troubleshooting

### "Health Connect not installed" Error
**Solution:** Install Health Connect from the Google Play Store using the link provided in the error message.

### "No Data Found" Message
This can happen for several reasons:

1. **Google Fit hasn't synced to Health Connect:**
   - Open Google Fit app
   - Check if you have any workouts recorded
   - Go to Settings → Manage connected apps → Health Connect
   - Ensure data sharing is enabled

2. **No recent workout data:**
   - The app looks for data from the last 30 days
   - If you haven't recorded any workouts recently, try manual entry instead

3. **Permissions not fully granted:**
   - Open Health Connect app
   - Go to "App permissions"
   - Find MAXX Motion and ensure all requested permissions are granted

### "Permission Denied" Error
1. Open Health Connect app directly
2. Navigate to "App permissions"
3. Find MAXX Motion in the list
4. Tap on it and grant all requested permissions
5. Return to MAXX Motion and try again

### Data Not Syncing from Google Fit
1. **Ensure Google Fit is connected to Health Connect:**
   - Open Google Fit → Settings → Manage connected apps
   - Check that Health Connect is listed and enabled

2. **Force sync Google Fit:**
   - Open Google Fit app
   - Pull down to refresh
   - Wait a few moments for sync to complete

3. **Check Health Connect data:**
   - Open Health Connect app
   - Go to "Data and access"
   - Check if Google Fit data is visible there

## Understanding the Health Connect Screen

When you see the Health Connect interface:
- **"Recent access"** shows which apps have recently read your data
- **"App permissions"** shows which apps have access to your health data
- **"Data and access"** lets you see and manage your health data
- **"Manage data"** provides options for data backup and deletion

## Privacy and Security

- Health Connect keeps your health data private and secure
- Data is stored locally on your device
- You control which apps can access your data
- You can revoke permissions at any time through Health Connect
- MAXX Motion only reads data; it never writes or modifies your health data

## Supported Data Types

MAXX Motion can import the following data from Health Connect:
- **Workouts/Exercise Sessions:** Running, walking, cycling, swimming, etc.
- **Steps:** Daily step counts
- **Distance:** Distance covered during activities
- **Calories:** Active calories burned
- **Heart Rate:** Average heart rate during activities (if available)

## Manual Entry Alternative

If you prefer not to connect to Health Connect or don't have fitness data to sync:
1. Tap "Manual Entry" instead of "Connect Tracker"
2. Select your activity type
3. Enter the duration in minutes
4. Select the date
5. Submit to log your activity

## Additional Tips

1. **Keep Health Connect Updated:** Regularly update Health Connect from the Play Store for the best experience
2. **Multiple Fitness Apps:** Health Connect can aggregate data from multiple fitness apps, not just Google Fit
3. **Data Freshness:** It may take a few minutes for new workouts to appear in Health Connect after recording them in Google Fit
4. **Battery Usage:** Health Connect is designed to be battery-efficient and won't significantly impact your device's battery life

## Need Help?

If you continue to experience issues:
1. Check that your Android version is 8.0 or higher (Settings → About phone → Android version)
2. Ensure you're using a real device (not an emulator)
3. Try restarting your device
4. Reinstall Health Connect if problems persist