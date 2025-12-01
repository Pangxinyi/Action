# Quick Start: Data Import/Export

## One-Minute Overview

The Action app now has a **Data** tab where you can:

1. **📥 Export** - Download all your projects, events, and categories as JSON
2. **📤 Import** - Upload JSON data to populate the app
3. **💾 Auto-save** - Everything is automatically saved to your device

## Getting Started

### Step 1: Export Your First Backup

```
1. Tap the "Data" tab at the bottom
2. Click "📥 Export as JSON"
3. Copy the JSON text
4. Paste it somewhere safe (Notes, Cloud, etc.)
```

### Step 2: Import Sample Data

We've included `example-data.json` with sample projects. To try it:

```
1. Open example-data.json
2. Copy all the text
3. Go to Data tab → Paste into the import field
4. See "✓ Data imported successfully" message
5. All sample data now appears in your app!
```

### Step 3: Create Your Own Data

You can now:
- Add projects, events, categories in the app
- Everything saves automatically
- Export anytime to backup

## Common Tasks

### Backup Your Data
```
Data tab → "📥 Export as JSON" → Save the file
```

### Restore from Backup
```
Data tab → Paste JSON → Import happens automatically
```

### Switch Devices
```
Device 1: Export JSON → Device 2: Paste JSON in Data tab
```

### Batch Create Projects
```
1. Create JSON file with multiple projects
2. Paste into Data tab
3. All projects appear instantly
```

## File Format (Quick Reference)

Minimal valid JSON:
```json
{
  "projects": [{"id": 1, "name": "My Project", "time": "0h 0m", "percent": 0, "hexColor": "#BFA2DB", "category": null, "x": 100, "y": 100}],
  "events": [],
  "links": [],
  "categories": {}
}
```

See `example-data.json` for full example.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid format" error | Make sure JSON has `projects`, `events`, `links` arrays |
| Data not appearing | Restart app and check Data tab summary |
| Import lost my data | Export a backup first! Paste backup to restore |
| JSON looks broken | Validate it at jsonlint.com first |

## Next Steps

1. ✅ Understand the import/export flow
2. 📚 Read `/DATA_IMPORT_EXPORT.md` for details
3. 🔧 Check `/IMPLEMENTATION_NOTES.md` for technical info
4. 🚀 Start building your data!

## Auto-Save Details

- Your data saves automatically whenever you make changes
- No "Save" button needed - it works in background
- Data persists even if you close and reopen the app
- Backup before importing to be safe

---

**That's it!** You're ready to import/export data in the Action app! 🎉
