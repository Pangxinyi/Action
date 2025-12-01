# Data Import/Export Guide

## Overview

The Action app now supports batch importing and exporting your data (projects, events, links, and categories) as JSON files. This allows you to:

- **Backup** your data locally
- **Share** configurations with team members
- **Migrate** data between devices
- **Automate** data setup with JSON imports

## Features

### 1. Auto-Save to Local Storage
- Your data is automatically saved to the device's local storage whenever you make changes
- No manual save needed - it works in the background
- Data persists across app restarts

### 2. Export Data
Navigate to the **Data** tab and click "📥 Export as JSON" to:
- Generate a JSON file containing all your projects, events, links, and categories
- Download the file for backup or sharing
- The export includes metadata (export date, version)

### 3. Import Data
In the **Data** tab, paste your JSON data into the import field to:
- Load projects, events, links, and categories from a JSON file
- Replace all current data with imported data
- Validate the JSON format automatically

## JSON Format

Your data must follow this structure:

```json
{
  "projects": [
    {
      "id": 101,
      "name": "Project Alpha",
      "time": "12h 30m",
      "percent": 45,
      "hexColor": "#BFA2DB",
      "category": "Work",
      "x": 80,
      "y": 100
    }
  ],
  "events": [
    {
      "id": 1,
      "title": "Deep Work: Project Alpha",
      "start": 540,
      "duration": 90,
      "hexColor": "#BFA2DB"
    }
  ],
  "links": [
    {
      "source": 101,
      "target": 102
    }
  ],
  "categories": {
    "Work": "#BFA2DB",
    "Personal": "#D1D9F2"
  },
  "exportDate": "2025-12-01T10:30:00.000Z"
}
```

### Field Descriptions

**Projects:**
- `id`: Unique identifier (number)
- `name`: Project name (string)
- `time`: Time spent (string, e.g., "12h 30m")
- `percent`: Completion percentage (0-100)
- `hexColor`: Color hex code (string)
- `category`: Category name (string or null)
- `x`, `y`: Position coordinates (numbers)

**Events:**
- `id`: Unique identifier (number)
- `title`: Event name (string)
- `start`: Start time in minutes from midnight (number)
- `duration`: Event duration in minutes (number)
- `hexColor`: Color hex code (string)

**Links:**
- `source`: Source project ID (number)
- `target`: Target project ID (number)

**Categories:**
- Key: Category name (string)
- Value: Color hex code (string)

## How to Use

### Exporting Data

1. Open the app and go to the **Data** tab
2. Click **"📥 Export as JSON"**
3. Copy the generated JSON data
4. Save it to a file (e.g., `action-backup-2025-12-01.json`)

### Importing Data

1. Open the app and go to the **Data** tab
2. Open your JSON file in a text editor
3. Copy the entire JSON content
4. Paste it into the import field in the app
5. The app will automatically validate and import the data
6. Check the status message to confirm success

### Bulk Setup

To set up the app with multiple projects/events:

1. Prepare a JSON file with all your data
2. Open the app and go to the **Data** tab
3. Paste your JSON into the import field
4. All data will be loaded and automatically saved

## Supported Formats

- **JSON**: Standard JavaScript Object Notation
- Character encoding: UTF-8
- File size: Recommended < 1MB for optimal performance

## Troubleshooting

### Import Failed - Invalid Format

Make sure your JSON includes all required fields:
- `projects` array
- `events` array
- `links` array

Optional fields:
- `categories` object
- `exportDate` timestamp

### Data Not Appearing

1. Check that project IDs in events match project IDs in projects array
2. Verify color codes are valid hex values (e.g., `#BFA2DB`)
3. Ensure coordinates (x, y) are positive numbers

### Lost Data After Import

Before importing, make sure to export your current data as a backup:

1. Go to **Data** tab
2. Click **"📥 Export as JSON"**
3. Save the backup file
4. Now you can safely import new data

## Local Storage Details

- **Storage Location**: Device's local storage (AsyncStorage)
- **Storage Key**: `action_app_data`
- **Automatic Save**: Triggered on any data change
- **Persistence**: Data persists across app restarts and updates

### Clear Local Storage

To reset all data:
1. Go to **Data** tab
2. Check "Current Data" section
3. Export a backup first (important!)
4. Then proceed with new import

## API Integration (Future)

The storage utilities are prepared for backend integration:

```typescript
// Backend API endpoints (to be implemented)
POST /api/data/export    // Export data to server
POST /api/data/import    // Import data from server
GET  /api/data/backup    // Fetch backup
POST /api/data/merge     // Merge strategies
```

Current implementation uses local-only storage, but can be extended to sync with a backend server.

## Best Practices

1. **Regular Backups**: Export your data weekly
2. **Version Control**: Name exports with dates (e.g., `action-2025-12-01.json`)
3. **Validation**: After importing, verify all data in the app
4. **Gradual Import**: Start with smaller datasets to test
5. **Keep Backups**: Never delete backup files until confirmed safe

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the JSON format specification
3. Ensure your JSON is valid using a JSON validator
4. Check app version matches your data version
