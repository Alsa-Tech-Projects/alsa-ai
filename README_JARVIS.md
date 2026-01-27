# 🤖 JARVIS - Your Personal AI Assistant

A fully-featured AI voice assistant inspired by Iron Man's JARVIS, with both web controls and local PC control capabilities.

## ✨ Features

### 🌐 Web Controls (Always Available)
- **Voice & Text Input** - Speak or type commands
- **AI-Powered** - Gemini 2.5 Flash for intelligent responses
- **Text-to-Speech** - JARVIS speaks back to you
- **Quick Actions**:
  - Open YouTube and search
  - Open Spotify
  - Open Google and search
  - Open Gmail
  - Open Google Maps
  - Check weather

### 💻 PC Controls (Requires Bridge Setup)
When you set up the PC Bridge, you can:
- Open Chrome browser
- Open Command Prompt (CMD)
- Open File Explorer
- Open Calculator
- Open Notepad
- Open Paint
- Open Task Manager
- Open Control Panel
- Open Windows Settings

## 🚀 Quick Start

### Using Web Controls Only
Just open the app and start using it! All web controls work immediately.

### Setting Up PC Controls

#### Step 1: Install Python Dependencies
```bash
pip install flask flask-cors
```

Or use the requirements file:
```bash
pip install -r requirements.txt
```

#### Step 2: Run the Bridge
Open a new Command Prompt and run:
```bash
python pc-control-bridge.py
```

Keep this window open while using JARVIS!

#### Step 3: Use JARVIS
Once the bridge is running, you'll see a "PC Bridge" indicator in the app showing it's connected.

## 🎮 Usage Examples

### Voice Commands
- "Open YouTube"
- "Search Google for Python tutorials"
- "Open Gmail"
- "Open Chrome" (requires bridge)
- "Open Calculator" (requires bridge)
- "What's the weather like?"

### Quick Action Buttons
Click any button for instant access to that service or application.

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── VoiceOrb.tsx        # Animated voice indicator
│   │   ├── ChatMessage.tsx     # Chat message display
│   │   └── QuickActions.tsx    # Quick action buttons
│   ├── hooks/
│   │   ├── useSpeechRecognition.ts  # Voice input
│   │   └── useTextToSpeech.ts       # Voice output
│   ├── utils/
│   │   └── pcBridge.ts         # PC bridge communication
│   └── pages/
│       └── Index.tsx           # Main application
├── supabase/functions/
│   └── chat/                   # Gemini AI integration
├── pc-control-bridge.py        # Local PC control server
├── BRIDGE_SETUP.md            # Detailed bridge setup guide
└── requirements.txt           # Python dependencies
```

## 🔒 Security

- **Whitelisted Commands**: Only pre-approved commands can be executed
- **Local Only**: Bridge runs on localhost, not accessible from internet
- **CORS Protected**: Web app communication is secured
- **No Remote Access**: Only your local browser can communicate with bridge

## 🐛 Troubleshooting

### Bridge Not Connecting
1. Make sure Python is installed: `python --version`
2. Install dependencies: `pip install -r requirements.txt`
3. Check if bridge is running (CMD window should show "Bridge Started")
4. Look at the connection indicator in the app

### Commands Not Working
- Verify the CMD window running the bridge is still open
- Check for error messages in the bridge CMD window
- Try refreshing the web app

### Port Conflicts
If port 5000 is already in use, edit `pc-control-bridge.py` and change:
```python
app.run(host='localhost', port=5000)  # Change 5000 to another port
```

## 📖 Documentation

- **Bridge Setup**: See [BRIDGE_SETUP.md](BRIDGE_SETUP.md) for detailed instructions
- **Edge Function**: Check `supabase/functions/chat/` for AI integration

## 🎨 Customization

### Adding New Commands

#### Web Commands
Edit `src/pages/Index.tsx` in the `handleSubmit` function to add new web URLs.

#### PC Commands
Edit `pc-control-bridge.py` to add new system commands to the `allowed_commands` dictionary.

### Styling
All colors and animations are defined in:
- `src/index.css` - Design system tokens
- `tailwind.config.ts` - Tailwind configuration

## 💡 Tips

- **Auto-start Bridge**: Add the bridge script to Windows startup folder
- **Keep Bridge Running**: Minimize the CMD window instead of closing it
- **Check Status**: Look at the connection indicator to verify bridge status
- **Voice Commands**: Speak clearly and naturally for best results

## 🆘 Need Help?

If you encounter issues:
1. Check the bridge CMD window for errors
2. Verify Python and dependencies are installed
3. Make sure your firewall isn't blocking port 5000
4. Try running CMD as Administrator

---

**Enjoy your JARVIS assistant!** 🚀
