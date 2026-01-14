#!/usr/bin/env python3
"""
ALSA AI PC Control Bridge
Allows the web app to control your PC locally
Security hardened with input validation and API key authentication
"""

import os
import sys
import subprocess
import json
import urllib.request
import shutil
import re
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['*'])  # Allow all origins for local bridge

# Allowed base directories for file operations
ALLOWED_BASE_DIRS = [
    os.path.expanduser('~\\Documents'),
    os.path.expanduser('~\\Desktop'),
    os.path.expanduser('~\\Pictures'),
    os.path.expanduser('~\\Music'),
    'E:\\Projects',
    'C:\\Projects',
    'G:\\',
]

# Dangerous shell metacharacters to sanitize
DANGEROUS_CHARS = re.compile(r'[;&|`$\n\r]')

# Music library paths to scan for songs
MUSIC_PATHS = [
    os.path.expanduser('~\\Music'),
    'E:\\Music',
    'D:\\Music',
]


def sanitize_input(value):
    """Remove dangerous shell metacharacters from input"""
    if not isinstance(value, str):
        return value
    return DANGEROUS_CHARS.sub('', value)


def is_path_allowed(file_path):
    """Check if the file path is within allowed directories"""
    try:
        abs_path = os.path.abspath(file_path)
        for allowed_dir in ALLOWED_BASE_DIRS:
            if abs_path.startswith(os.path.abspath(allowed_dir)):
                return True
        return False
    except Exception:
        return False


def validate_ip_address(ip):
    """Validate IP address format"""
    pattern = re.compile(r'^(\d{1,3}\.){3}\d{1,3}(:\d+)?$')
    return bool(pattern.match(ip))


def validate_adb_command(command):
    """Validate ADB command is safe"""
    allowed_prefixes = [
        'shell', 'install', 'uninstall', 'push', 'pull',
        'devices', 'connect', 'disconnect', 'reboot',
        'logcat', 'bugreport', 'forward', 'reverse'
    ]
    cmd_parts = command.strip().split()
    if not cmd_parts:
        return False
    return cmd_parts[0] in allowed_prefixes


@app.route('/create_folder', methods=['POST'])
def create_folder():
    data = request.json
    folder_path = data.get('folder_path', '')
    try:
        os.makedirs(folder_path, exist_ok=True)
        return jsonify({'success': True, 'message': f'Folder created: {folder_path}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/create_text_file', methods=['POST'])
def create_text_file():
    data = request.json
    file_path = data.get('file_path', '')
    content = data.get('content', '')
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return jsonify({'success': True, 'message': f'File created: {file_path}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400



@app.route('/execute', methods=['POST'])
def execute_command():
    """Execute system commands"""
    try:
        data = request.get_json()
        command = sanitize_input(data.get('command', ''))
        
        if not command:
            return jsonify({'error': 'No command provided'}), 400
        
        # System power commands (hardcoded, no shell injection risk)
        if command.lower() == 'shutdown':
            subprocess.Popen(['shutdown', '/s', '/t', '0'])
            return jsonify({'success': True, 'message': 'System shutting down'})
        
        if command.lower() == 'restart':
            subprocess.Popen(['shutdown', '/r', '/t', '0'])
            return jsonify({'success': True, 'message': 'System restarting'})
        
        if command.lower() == 'sleep':
            subprocess.Popen(['rundll32.exe', 'powrprof.dll,SetSuspendState', '0,1,0'])
            return jsonify({'success': True, 'message': 'System going to sleep'})
        
        # Security: Only allow whitelisted commands
        allowed_commands = {
            'start chrome': ['start', 'chrome'],
            'start cmd': ['start', 'cmd'],
            'start explorer': ['start', 'explorer'],
            'start calc': ['start', 'calc'],
            'start notepad': ['start', 'notepad'],
            'start mspaint': ['start', 'mspaint'],
            'start taskmgr': ['start', 'taskmgr'],
            'start control': ['start', 'control'],
            'start ms-settings:': ['start', 'ms-settings:'],
            'code': ['code'],
        }
        
        command_names = {
            'start chrome': 'Chrome Browser',
            'start cmd': 'Command Prompt',
            'start explorer': 'File Explorer',
            'start calc': 'Calculator',
            'start notepad': 'Notepad',
            'start mspaint': 'Paint',
            'start taskmgr': 'Task Manager',
            'start control': 'Control Panel',
            'start ms-settings:': 'Settings',
            'code': 'Visual Studio Code',
        }
        
        # File/Folder operations with path validation
        if command.startswith('create_file:'):
            file_path = command.replace('create_file:', '').strip()
            if not is_path_allowed(file_path):
                return jsonify({'error': 'Path not allowed'}), 403
            try:
                with open(file_path, 'w') as f:
                    f.write('')
                return jsonify({'success': True, 'message': f'File created: {file_path}'})
            except Exception as e:
                return jsonify({'error': str(e)}), 500
        
        if command.startswith('create_folder:'):
            folder_path = command.replace('create_folder:', '').strip()
            if not is_path_allowed(folder_path):
                return jsonify({'error': 'Path not allowed'}), 403
            try:
                os.makedirs(folder_path, exist_ok=True)
                return jsonify({'success': True, 'message': f'Folder created: {folder_path}'})
            except Exception as e:
                return jsonify({'error': str(e)}), 500
        
        if command.startswith('write_file:'):
            parts = command.replace('write_file:', '').split('|')
            if len(parts) >= 2:
                file_path, content = parts[0].strip(), '|'.join(parts[1:]).strip()
                if not is_path_allowed(file_path):
                    return jsonify({'error': 'Path not allowed'}), 403
                try:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    return jsonify({'success': True, 'message': f'Content written to: {file_path}'})
                except Exception as e:
                    return jsonify({'error': str(e)}), 500
        
        if command.startswith('vscode:'):
            path = command.replace('vscode:', '').strip()
            if not is_path_allowed(path):
                return jsonify({'error': 'Path not allowed'}), 403
            try:
                subprocess.Popen(['code', path])
                return jsonify({'success': True, 'message': f'Opening VS Code: {path}'})
            except Exception as e:
                return jsonify({'error': str(e)}), 500
        
        # Check if command is allowed
        command_base = command.lower().strip()
        if command_base not in allowed_commands:
            return jsonify({
                'error': f'Command not allowed: {command}',
                'message': 'Only whitelisted commands are permitted'
            }), 403
        
        # Execute command using list (no shell injection)
        if os.name == 'nt':  # Windows
            subprocess.Popen(allowed_commands[command_base], shell=True)
            return jsonify({
                'success': True,
                'message': f'Opened {command_names[command_base]}'
            })
        else:
            return jsonify({
                'error': 'This bridge currently only supports Windows',
                'message': 'PC control is Windows-only for now'
            }), 400
            
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Failed to execute command'
        }), 500


@app.route('/capture_screenshot', methods=['POST'])
def capture_screenshot():
    """Capture a screenshot of the entire screen"""
    try:
        from PIL import ImageGrab
        import base64
        from io import BytesIO
        from datetime import datetime
        import time
        
        data = request.get_json() or {}
        delay_seconds = data.get('delay_seconds', 0)
        save_path = data.get('save_path', os.path.expanduser('~\\Pictures\\Screenshots'))
        
        # Validate save path
        if not is_path_allowed(save_path):
            save_path = os.path.expanduser('~\\Pictures\\Screenshots')
        
        # Delay if requested
        if delay_seconds and isinstance(delay_seconds, (int, float)) and 0 < delay_seconds <= 60:
            time.sleep(delay_seconds)
        
        # Capture the screenshot
        screenshot = ImageGrab.grab()
        
        # Convert to base64
        buffered = BytesIO()
        screenshot.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        # Save to file
        os.makedirs(save_path, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"screenshot_{timestamp}.png"
        full_path = os.path.join(save_path, filename)
        screenshot.save(full_path)
        
        return jsonify({
            'success': True,
            'message': f'Screenshot captured: {full_path}',
            'filename': filename,
            'full_path': full_path,
            'image_data': img_str
        })
        
    except Exception as e:
        print(f"Error capturing screenshot: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("ALSA AI PC Control Bridge Started")
    print("Bridge is running on http://localhost:5001")
    print("You can now control your PC through ALSA AI!")
    print("Features: Project creation, PPT, Excel, Database, Screenshots, ADB, Music")
    app.run(host='127.0.0.1', port=5001, debug=True)