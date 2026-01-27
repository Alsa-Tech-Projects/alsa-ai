# 🤖 JARVIS PC Control Bridge Setup

This guide will help you set up the local bridge that allows JARVIS to control your PC.

## 📋 Prerequisites

- Python 3.7 or higher installed on your PC
- Windows OS (currently only Windows is supported)

## 🚀 Quick Setup

### Step 1: Install Python Dependencies

Open Command Prompt (CMD) and run:

```bash
pip install flask flask-cors
```

### Step 2: Run the Bridge Script

1. Navigate to your project folder in CMD:
```bash
cd path\to\your\project
```

2. Run the bridge script:
```bash
python pc-control-bridge.py
```

You should see:
```
==================================================
JARVIS PC Control Bridge Started
==================================================
Bridge is running on http://localhost:5000
You can now control your PC through JARVIS!
==================================================
```

### Step 3: Keep the Bridge Running

⚠️ **IMPORTANT**: Keep this CMD window open while using JARVIS for PC control!

The bridge needs to be running for JARVIS to control your PC. When you close the CMD window, PC control will stop working (but web controls will still work).

## 🎮 Available PC Commands

Once the bridge is running, you can use these commands:

### Voice or Text Commands:
- "Open Chrome" / "Open browser"
- "Open CMD" / "Open command prompt"
- "Open Explorer" / "Open file explorer"
- "Open Calculator"
- "Open Notepad"
- "Open Paint"
- "Open Task Manager"
- "Open Control Panel"
- "Open Settings"

### Using Quick Action Buttons:
Click the PC Control buttons in JARVIS interface for instant access.

## 🔍 NEW: Smart System Scanning

The bridge now automatically scans your PC for applications, folders, and files!

### Features:
- **Auto-scan on connection**: Scans your system when bridge connects
- **Smart suggestions**: Type any text and see matching apps, folders, files
- **Quick commands**: Click suggestions to auto-fill commands
- **Real-time filtering**: Suggestions update as you type

### Enable Scanning Feature:

Add this endpoint to your `pc-control-bridge.py` file (after the other routes):

```python
@app.route('/scan', methods=['GET'])
def scan_system():
    """Scan system for applications, folders, and files"""
    try:
        import os
        
        # Scan for common applications
        applications = []
        common_apps = {
            'chrome': 'Chrome',
            'firefox': 'Firefox',
            'vscode': 'VS Code',
            'code': 'VS Code',
            'notepad++': 'Notepad++',
            'spotify': 'Spotify',
            'discord': 'Discord',
            'slack': 'Slack',
            'zoom': 'Zoom',
            'calculator': 'Calculator',
            'notepad': 'Notepad',
            'paint': 'Paint',
        }
        
        # Check common application paths
        program_files = os.environ.get('PROGRAMFILES', 'C:\\Program Files')
        program_files_x86 = os.environ.get('PROGRAMFILES(X86)', 'C:\\Program Files (x86)')
        
        for path in [program_files, program_files_x86]:
            if os.path.exists(path):
                try:
                    for folder in os.listdir(path):
                        folder_lower = folder.lower()
                        for key, name in common_apps.items():
                            if key in folder_lower and name not in applications:
                                applications.append(name)
                except:
                    pass
        
        # Add system apps
        system_apps = ['Calculator', 'Notepad', 'Paint', 'Task Manager', 'CMD', 'Explorer']
        for app in system_apps:
            if app not in applications:
                applications.append(app)
        
        # Common system folders
        user_profile = os.environ.get('USERPROFILE', '')
        common_folders = [
            os.path.join(user_profile, 'Desktop'),
            os.path.join(user_profile, 'Documents'),
            os.path.join(user_profile, 'Downloads'),
            os.path.join(user_profile, 'Pictures'),
            os.path.join(user_profile, 'Videos'),
            os.path.join(user_profile, 'Music'),
        ]
        
        # Recent files from Desktop
        recent_files = []
        desktop = os.path.join(user_profile, 'Desktop')
        if os.path.exists(desktop):
            try:
                files = [f for f in os.listdir(desktop) if os.path.isfile(os.path.join(desktop, f))]
                recent_files = [os.path.join(desktop, f) for f in files[:10]]
            except:
                pass
        
        return jsonify({
            'status': 'success',
            'data': {
                'applications': applications,
                'commonFolders': common_folders,
                'recentFiles': recent_files
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

After adding this code, restart the bridge script to enable scanning!

## 🔒 Security Notes

1. **Whitelist Protection**: The bridge only allows pre-approved commands for security
2. **Local Only**: Runs on localhost (127.0.0.1) - not accessible from internet
3. **No Remote Access**: Only your local JARVIS web app can communicate with it

## 🐛 Troubleshooting

### Bridge Not Connecting
1. Make sure Python is installed: `python --version`
2. Check if dependencies are installed: `pip show flask flask-cors`
3. Verify the bridge script is running (CMD window should be open)
4. Make sure no firewall is blocking port 5000

### Commands Not Working
1. Check if the bridge CMD window shows any errors
2. Refresh your JARVIS web app
3. Try clicking the status indicator to check connection

### Port Already in Use
If you get "Port 5000 is already in use":
1. Close any other applications using port 5000
2. Or edit `pc-control-bridge.py` and change the port number

## 💡 Tips

- **Auto-start**: Add the bridge script to your Windows startup folder for automatic start
- **Minimize**: You can minimize the CMD window - just don't close it
- **Status Check**: Look for the connection indicator in JARVIS to see if bridge is connected

## 🆘 Need Help?

If something isn't working:
1. Check the CMD window running the bridge for error messages
2. Make sure your antivirus isn't blocking Python
3. Try running CMD as Administrator

---

**Ready to use JARVIS?** Start the bridge script and enjoy full PC control! 🚀
