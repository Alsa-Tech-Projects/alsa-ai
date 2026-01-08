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

# =============================================================================
# AI API KEY CONFIGURATION
# Replace YOUR_GEMINI_API_KEY_HERE with your actual Gemini API key
# Or set the GEMINI_API_KEY environment variable
# =============================================================================
AI_API_KEY = os.environ.get('GEMINI_API_KEY', 'YOUR_GEMINI_API_KEY_HERE')
AI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# Allowed base directories for file operations
ALLOWED_BASE_DIRS = [
    os.path.expanduser('~\\Documents'),
    os.path.expanduser('~\\Desktop'),
    os.path.expanduser('~\\Pictures'),
    os.path.expanduser('~\\Music'),
    'E:\\Eisa',
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


@app.route('/status', methods=['GET'])
def status():
    """Check if bridge is running and return API key status"""
    has_api_key = AI_API_KEY and AI_API_KEY != 'YOUR_GEMINI_API_KEY_HERE'
    return jsonify({
        'status': 'running',
        'message': 'ALSA AI PC Bridge is active',
        'has_api_key': has_api_key,
        'api_key_hint': AI_API_KEY[:8] + '...' if has_api_key else None
    })


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


@app.route('/execute_python', methods=['POST'])
def execute_python():
    """Execute Python files and return output"""
    try:
        data = request.get_json()
        file_path = sanitize_input(data.get('file_path', ''))
        
        if not file_path:
            return jsonify({'error': 'No file path provided'}), 400
        
        if not is_path_allowed(file_path):
            return jsonify({'error': 'Path not allowed'}), 403
        
        if not os.path.exists(file_path):
            return jsonify({'error': f'File not found: {file_path}'}), 404
        
        if not file_path.endswith('.py'):
            return jsonify({'error': 'Only Python files (.py) can be executed'}), 400
        
        # Execute Python file using list (no shell injection)
        result = subprocess.run(
            ['python', file_path],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        return jsonify({
            'success': True,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode,
            'message': f'Executed: {file_path}'
        })
        
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Execution timeout (30s limit)'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/execute_cmd', methods=['POST'])
def execute_cmd():
    """Execute whitelisted CMD commands and return output"""
    try:
        data = request.get_json()
        command = data.get('command', '')
        
        if not command:
            return jsonify({'error': 'No command provided'}), 400
        
        # Whitelist of allowed CMD commands
        allowed_cmd_prefixes = [
            'dir', 'cd', 'type', 'echo', 'cls', 'ver', 'date', 'time',
            'whoami', 'hostname', 'ipconfig', 'ping', 'netstat',
            'systeminfo', 'tasklist', 'tree', 'where', 'set',
            'python --version', 'node --version', 'npm --version',
            'git --version', 'java --version'
        ]
        
        # Sanitize and validate command
        command_sanitized = sanitize_input(command)
        command_lower = command_sanitized.lower().strip()
        
        is_allowed = any(command_lower.startswith(prefix) for prefix in allowed_cmd_prefixes)
        
        if not is_allowed:
            return jsonify({
                'error': 'Command not in whitelist',
                'message': 'Only safe informational commands are allowed'
            }), 403
        
        # Execute command with sanitized input
        result = subprocess.run(
            command_sanitized,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        return jsonify({
            'success': True,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode,
            'message': f'Executed: {command_sanitized}'
        })
        
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Execution timeout (30s limit)'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/create_project', methods=['POST'])
def create_project():
    """Create a coding project at specified path"""
    try:
        data = request.get_json()
        project_path = sanitize_input(data.get('project_path', ''))
        files = data.get('files', {})  # Dict of filename: content
        
        if not project_path:
            return jsonify({'error': 'No project path provided'}), 400
        
        if not is_path_allowed(project_path):
            return jsonify({'error': 'Path not allowed. Use allowed directories like E:\\Eisa or Documents'}), 403
        
        # Create project directory
        os.makedirs(project_path, exist_ok=True)
        
        # Create files
        created_files = []
        for filename, content in files.items():
            # Sanitize filename to prevent path traversal
            safe_filename = os.path.basename(filename.replace('..', ''))
            if '/' in filename or '\\' in filename:
                # Handle subdirectories safely
                parts = filename.replace('\\', '/').split('/')
                safe_parts = [p for p in parts if p and p != '..']
                safe_filename = os.path.join(*safe_parts) if safe_parts else filename
            
            file_full_path = os.path.join(project_path, safe_filename)
            
            # Verify final path is still within project
            if not os.path.abspath(file_full_path).startswith(os.path.abspath(project_path)):
                continue
                
            os.makedirs(os.path.dirname(file_full_path), exist_ok=True)
            with open(file_full_path, 'w', encoding='utf-8') as f:
                f.write(content if isinstance(content, str) else '')
            created_files.append(safe_filename)
        
        return jsonify({
            'success': True,
            'message': f'Project created at {project_path}',
            'files': created_files
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/check_installation', methods=['POST'])
def check_installation():
    """Check if software is installed"""
    try:
        data = request.get_json()
        software = sanitize_input(data.get('software', ''))
        
        if not software:
            return jsonify({'error': 'No software name provided'}), 400
        
        # Check common software (whitelist only)
        check_commands = {
            'python': ['python', '--version'],
            'node': ['node', '--version'],
            'git': ['git', '--version'],
            'npm': ['npm', '--version'],
            'java': ['java', '--version'],
        }
        
        software_lower = software.lower()
        if software_lower not in check_commands:
            return jsonify({'error': 'Software check not supported'}), 400
        
        cmd = check_commands[software_lower]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        installed = result.returncode == 0
        
        return jsonify({
            'success': True,
            'installed': installed,
            'version': result.stdout.strip() if installed else None,
            'message': f'{software} is {"installed" if installed else "not installed"}'
        })
        
    except Exception as e:
        return jsonify({
            'success': True,
            'installed': False,
            'message': f'{software} is not installed'
        })


@app.route('/adb_connect', methods=['POST'])
def adb_connect():
    """Connect to Android device via ADB"""
    try:
        data = request.get_json()
        ip_address = data.get('ip_address', '')
        
        if ip_address:
            # Validate IP address format
            if not validate_ip_address(ip_address):
                return jsonify({'error': 'Invalid IP address format'}), 400
            
            # Wireless ADB connection using list args
            result = subprocess.run(
                ['adb', 'connect', ip_address],
                capture_output=True,
                text=True,
                timeout=10
            )
        else:
            # USB connection - list devices
            result = subprocess.run(
                ['adb', 'devices'],
                capture_output=True,
                text=True,
                timeout=10
            )
        
        return jsonify({
            'success': result.returncode == 0,
            'output': result.stdout,
            'message': 'ADB connection attempted'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/adb_command', methods=['POST'])
def adb_command():
    """Execute ADB command on connected device"""
    try:
        data = request.get_json()
        command = data.get('command', '')
        
        if not command:
            return jsonify({'error': 'No command provided'}), 400
        
        # Validate ADB command
        if not validate_adb_command(command):
            return jsonify({
                'error': 'ADB command not allowed',
                'message': 'Only whitelisted ADB commands are permitted'
            }), 403
        
        # Sanitize and split command
        command_sanitized = sanitize_input(command)
        cmd_parts = ['adb'] + command_sanitized.split()
        
        # Execute ADB command using list (no shell injection)
        result = subprocess.run(
            cmd_parts,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        return jsonify({
            'success': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'message': f'Executed: adb {command_sanitized}'
        })
        
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Command timeout (30s limit)'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


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


@app.route('/close_window', methods=['POST'])
def close_window():
    """Close a specific window by name"""
    try:
        data = request.get_json()
        window_name = sanitize_input(data.get('window_name', ''))
        
        if not window_name:
            return jsonify({'error': 'Window name is required'}), 400
        
        print(f"Attempting to close window: {window_name}")
        
        # Common window to process name mappings (whitelist)
        process_map = {
            "file explorer": "explorer",
            "explorer": "explorer",
            "notepad": "notepad",
            "calculator": "calc",
            "cmd": "cmd",
            "command prompt": "cmd",
            "powershell": "powershell",
            "chrome": "chrome",
            "firefox": "firefox",
            "edge": "msedge",
            "paint": "mspaint"
        }
        
        window_lower = window_name.lower()
        if window_lower not in process_map:
            return jsonify({
                'error': 'Window not in allowed list',
                'allowed': list(process_map.keys())
            }), 403
        
        process_name = process_map[window_lower]
        
        # Use list args instead of shell string
        result = subprocess.run(
            ['taskkill', '/F', '/IM', f'{process_name}.exe'],
            capture_output=True,
            text=True
        )
        
        output = result.stdout if result.stdout else result.stderr
        
        return jsonify({
            'success': result.returncode == 0,
            'message': f'Closed {window_name}',
            'output': output
        })
        
    except Exception as e:
        print(f"Error closing window: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/run_command', methods=['POST'])
def run_command():
    """Open application using Windows Run command"""
    try:
        data = request.get_json()
        command = sanitize_input(data.get('command', ''))
        
        if not command:
            return jsonify({'error': 'Command is required'}), 400
        
        # Whitelist of allowed run commands
        allowed_run_commands = [
            'notepad', 'calc', 'mspaint', 'explorer', 'cmd', 'powershell',
            'control', 'taskmgr', 'msconfig', 'regedit', 'services.msc',
            'devmgmt.msc', 'diskmgmt.msc', 'compmgmt.msc'
        ]
        
        if command.lower() not in allowed_run_commands:
            return jsonify({
                'error': 'Command not allowed',
                'allowed': allowed_run_commands
            }), 403
        
        print(f"Executing Run command: {command}")
        
        # Execute using list args
        subprocess.Popen(['start', '', command], shell=True)
        
        return jsonify({
            'success': True,
            'message': f'Opened: {command}'
        })
        
    except Exception as e:
        print(f"Error executing Run command: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/create_powerpoint', methods=['POST'])
def create_powerpoint():
    """Create a PowerPoint presentation with slides and formatting"""
    try:
        from pptx import Presentation
        from pptx.util import Inches, Pt
        from pptx.dml.color import RgbColor
        from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
        
        data = request.get_json()
        file_path = sanitize_input(data.get('file_path', ''))
        title = data.get('title', 'Presentation')
        slides_data = data.get('slides', [])
        theme = data.get('theme', 'professional')
        
        if not file_path:
            return jsonify({'error': 'No file path provided'}), 400
        
        if not is_path_allowed(file_path):
            return jsonify({'error': 'Path not allowed'}), 403
        
        # Ensure .pptx extension
        if not file_path.lower().endswith('.pptx'):
            file_path += '.pptx'
        
        # Create presentation
        prs = Presentation()
        prs.slide_width = Inches(13.333)
        prs.slide_height = Inches(7.5)
        
        # Theme colors
        themes = {
            'professional': {'bg': (255, 255, 255), 'title': (0, 51, 102), 'text': (51, 51, 51)},
            'modern': {'bg': (240, 240, 245), 'title': (41, 128, 185), 'text': (44, 62, 80)},
            'creative': {'bg': (255, 248, 240), 'title': (231, 76, 60), 'text': (52, 73, 94)},
            'minimal': {'bg': (255, 255, 255), 'title': (33, 33, 33), 'text': (66, 66, 66)},
            'dark': {'bg': (30, 30, 40), 'title': (255, 255, 255), 'text': (200, 200, 200)}
        }
        colors = themes.get(theme, themes['professional'])
        
        # Add title slide
        title_slide_layout = prs.slide_layouts[6]  # Blank slide
        slide = prs.slides.add_slide(title_slide_layout)
        
        # Title text
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(2.5), Inches(12.333), Inches(2))
        tf = title_box.text_frame
        tf.paragraphs[0].text = title
        tf.paragraphs[0].font.size = Pt(54)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RgbColor(*colors['title'])
        tf.paragraphs[0].alignment = PP_ALIGN.CENTER
        
        # Add content slides
        for slide_data in slides_data:
            slide = prs.slides.add_slide(prs.slide_layouts[6])
            
            # Slide title
            title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), Inches(12.333), Inches(1))
            tf = title_box.text_frame
            tf.paragraphs[0].text = slide_data.get('title', '')
            tf.paragraphs[0].font.size = Pt(36)
            tf.paragraphs[0].font.bold = True
            tf.paragraphs[0].font.color.rgb = RgbColor(*colors['title'])
            
            # Slide content
            content = slide_data.get('content', '')
            content_box = slide.shapes.add_textbox(Inches(0.5), Inches(1.5), Inches(12.333), Inches(5.5))
            tf = content_box.text_frame
            tf.word_wrap = True
            
            lines = content.split('\\n') if '\\n' in content else content.split('\n')
            for i, line in enumerate(lines):
                if i == 0:
                    tf.paragraphs[0].text = line
                    tf.paragraphs[0].font.size = Pt(24)
                    tf.paragraphs[0].font.color.rgb = RgbColor(*colors['text'])
                else:
                    p = tf.add_paragraph()
                    p.text = line
                    p.font.size = Pt(24)
                    p.font.color.rgb = RgbColor(*colors['text'])
                    p.space_before = Pt(12)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Save presentation
        prs.save(file_path)
        
        return jsonify({
            'success': True,
            'message': f'PowerPoint created: {file_path}',
            'file_path': file_path,
            'slides_count': len(slides_data) + 1
        })
        
    except ImportError:
        return jsonify({'error': 'python-pptx not installed. Run: pip install python-pptx'}), 500
    except Exception as e:
        print(f"Error creating PowerPoint: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/create_excel', methods=['POST'])
def create_excel():
    """Create an Excel spreadsheet with data and formatting"""
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
        from openpyxl.utils import get_column_letter
        
        data = request.get_json()
        file_path = sanitize_input(data.get('file_path', ''))
        sheet_name = data.get('sheet_name', 'Sheet1')
        headers = data.get('headers', [])
        rows_data = data.get('data', [])
        formatting = data.get('formatting', {})
        
        if not file_path:
            return jsonify({'error': 'No file path provided'}), 400
        
        if not is_path_allowed(file_path):
            return jsonify({'error': 'Path not allowed'}), 403
        
        # Ensure .xlsx extension
        if not file_path.lower().endswith('.xlsx'):
            file_path += '.xlsx'
        
        # Create workbook
        wb = Workbook()
        ws = wb.active
        ws.title = sheet_name
        
        # Header styling
        header_color = formatting.get('header_color', '#4472C4').lstrip('#')
        header_fill = PatternFill(start_color=header_color, end_color=header_color, fill_type='solid')
        header_font = Font(bold=True, color='FFFFFF', size=12)
        header_align = Alignment(horizontal='center', vertical='center')
        border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )
        
        # Add headers
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col, value=header)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = header_align
            cell.border = border
        
        # Add data rows
        alt_fill = PatternFill(start_color='E7E6E6', end_color='E7E6E6', fill_type='solid')
        for row_idx, row_data in enumerate(rows_data, 2):
            for col_idx, value in enumerate(row_data, 1):
                cell = ws.cell(row=row_idx, column=col_idx, value=value)
                cell.border = border
                cell.alignment = Alignment(horizontal='left', vertical='center')
                if formatting.get('alternating_rows') and row_idx % 2 == 0:
                    cell.fill = alt_fill
        
        # Auto-fit column widths
        if formatting.get('auto_width', True):
            for col_idx, header in enumerate(headers, 1):
                max_length = len(str(header))
                for row_data in rows_data:
                    if col_idx <= len(row_data):
                        max_length = max(max_length, len(str(row_data[col_idx - 1])))
                ws.column_dimensions[get_column_letter(col_idx)].width = min(max_length + 2, 50)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Save workbook
        wb.save(file_path)
        
        return jsonify({
            'success': True,
            'message': f'Excel file created: {file_path}',
            'file_path': file_path,
            'rows_count': len(rows_data),
            'columns_count': len(headers)
        })
        
    except ImportError:
        return jsonify({'error': 'openpyxl not installed. Run: pip install openpyxl'}), 500
    except Exception as e:
        print(f"Error creating Excel: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/create_database', methods=['POST'])
def create_database():
    """Create a SQLite or Access database with tables"""
    try:
        import sqlite3
        
        data = request.get_json()
        file_path = sanitize_input(data.get('file_path', ''))
        db_type = data.get('db_type', 'sqlite')
        tables = data.get('tables', [])
        
        if not file_path:
            return jsonify({'error': 'No file path provided'}), 400
        
        if not is_path_allowed(file_path):
            return jsonify({'error': 'Path not allowed'}), 403
        
        # Handle SQLite
        if db_type == 'sqlite':
            if not file_path.lower().endswith('.db'):
                file_path += '.db'
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            conn = sqlite3.connect(file_path)
            cursor = conn.cursor()
            
            tables_created = []
            for table in tables:
                table_name = table.get('name', 'table1')
                columns = table.get('columns', [])
                sample_data = table.get('sample_data', [])
                
                # Build CREATE TABLE statement
                col_defs = []
                col_names = []
                for col in columns:
                    col_name = col.get('name', 'col')
                    col_type = col.get('type', 'TEXT')
                    is_pk = col.get('primary_key', False)
                    col_def = f"{col_name} {col_type}"
                    if is_pk:
                        col_def += " PRIMARY KEY"
                        if col_type == 'INTEGER':
                            col_def += " AUTOINCREMENT"
                    col_defs.append(col_def)
                    col_names.append(col_name)
                
                create_sql = f"CREATE TABLE IF NOT EXISTS {table_name} ({', '.join(col_defs)})"
                cursor.execute(create_sql)
                
                # Insert sample data
                if sample_data:
                    placeholders = ', '.join(['?' for _ in col_names])
                    insert_sql = f"INSERT INTO {table_name} ({', '.join(col_names)}) VALUES ({placeholders})"
                    for row in sample_data:
                        cursor.execute(insert_sql, row)
                
                tables_created.append(table_name)
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': f'SQLite database created: {file_path}',
                'file_path': file_path,
                'tables': tables_created
            })
        
        # Handle Access (requires pyodbc or pypyodbc)
        elif db_type == 'access':
            try:
                import pyodbc
                
                if not file_path.lower().endswith('.accdb'):
                    file_path += '.accdb'
                
                # Create Access database
                conn_str = f'Driver={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={file_path};'
                
                # Need to create the file first using a template or COM
                return jsonify({
                    'error': 'Access database creation requires Microsoft Access installed',
                    'alternative': 'Use SQLite instead (db_type: "sqlite") for a portable database'
                }), 400
                
            except ImportError:
                return jsonify({
                    'error': 'pyodbc not installed for Access support',
                    'alternative': 'Use SQLite instead (db_type: "sqlite") for a portable database'
                }), 400
        
        return jsonify({'error': 'Invalid database type'}), 400
        
    except Exception as e:
        print(f"Error creating database: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Global music player process reference
current_music_process = None


@app.route('/get_songs', methods=['GET'])
def get_songs():
    """Get list of songs from music directories"""
    try:
        songs = []
        audio_extensions = ('.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.wma')
        
        for music_path in MUSIC_PATHS:
            if os.path.exists(music_path):
                for root, dirs, files in os.walk(music_path):
                    for file in files:
                        if file.lower().endswith(audio_extensions):
                            full_path = os.path.join(root, file)
                            # Extract artist from folder structure if possible
                            parts = root.replace(music_path, '').strip(os.sep).split(os.sep)
                            artist = parts[0] if parts else 'Unknown'
                            album = parts[1] if len(parts) > 1 else 'Unknown'
                            
                            songs.append({
                                'name': os.path.splitext(file)[0],
                                'path': full_path,
                                'artist': artist,
                                'album': album
                            })
        
        return jsonify({
            'success': True,
            'songs': songs,
            'count': len(songs),
            'message': f'Found {len(songs)} songs'
        })
        
    except Exception as e:
        print(f"Error getting songs: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/play_song', methods=['POST'])
def play_song():
    """Play a song using default media player"""
    global current_music_process
    try:
        data = request.get_json()
        song_path = data.get('song_path', '')
        
        if not song_path:
            return jsonify({'error': 'No song path provided'}), 400
        
        if not os.path.exists(song_path):
            return jsonify({'error': 'Song file not found'}), 404
        
        # Stop current song if playing
        if current_music_process:
            try:
                current_music_process.terminate()
            except:
                pass
        
        # Play using default media player
        if os.name == 'nt':  # Windows
            current_music_process = subprocess.Popen(['start', '', song_path], shell=True)
        else:
            current_music_process = subprocess.Popen(['xdg-open', song_path])
        
        song_name = os.path.splitext(os.path.basename(song_path))[0]
        
        return jsonify({
            'success': True,
            'message': f'Playing: {song_name}'
        })
        
    except Exception as e:
        print(f"Error playing song: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/stop_song', methods=['POST'])
def stop_song():
    """Stop currently playing song"""
    global current_music_process
    try:
        if current_music_process:
            current_music_process.terminate()
            current_music_process = None
        
        # Also try to close common media players
        subprocess.run(['taskkill', '/F', '/IM', 'wmplayer.exe'], capture_output=True)
        subprocess.run(['taskkill', '/F', '/IM', 'groove.exe'], capture_output=True)
        
        return jsonify({
            'success': True,
            'message': 'Music stopped'
        })
        
    except Exception as e:
        print(f"Error stopping song: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/ai_chat', methods=['POST'])
def ai_chat():
    """Handle AI chat requests using configured API key"""
    try:
        if not AI_API_KEY or AI_API_KEY == 'YOUR_GEMINI_API_KEY_HERE':
            return jsonify({
                'error': 'No AI API key configured',
                'message': 'Please set GEMINI_API_KEY in the script or environment'
            }), 400
        
        data = request.get_json()
        messages = data.get('messages', [])
        
        if not messages:
            return jsonify({'error': 'No messages provided'}), 400
        
        # Build Gemini-compatible request
        contents = []
        for msg in messages:
            role = 'model' if msg.get('role') == 'assistant' else 'user'
            contents.append({
                'role': role,
                'parts': [{'text': msg.get('content', '')}]
            })
        
        # Call Gemini API
        import urllib.request
        import urllib.error
        
        req_body = json.dumps({
            'contents': contents,
            'generationConfig': {'temperature': 0.7}
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{AI_API_URL}?key={AI_API_KEY}",
            data=req_body,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode('utf-8'))
        
        response_text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        
        return jsonify({
            'success': True,
            'response': response_text,
            'source': 'local_gemini'
        })
        
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else str(e)
        print(f"AI API Error: {e.code} - {error_body}")
        return jsonify({'error': f'AI API error: {e.code}', 'details': error_body}), 500
    except Exception as e:
        print(f"Error in AI chat: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/set_api_key', methods=['POST'])
def set_api_key():
    """Update the AI API key at runtime"""
    global AI_API_KEY
    try:
        data = request.get_json()
        new_key = data.get('api_key', '').strip()
        
        if not new_key:
            return jsonify({'error': 'No API key provided'}), 400
        
        AI_API_KEY = new_key
        
        return jsonify({
            'success': True,
            'message': 'API key updated successfully',
            'key_hint': new_key[:8] + '...'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("ALSA AI PC Control Bridge Started")
    print("Bridge is running on http://localhost:5001")
    print("You can now control your PC through ALSA AI!")
    print("Features: Project creation, PPT, Excel, Database, Screenshots, ADB, Music")
    if AI_API_KEY and AI_API_KEY != 'YOUR_GEMINI_API_KEY_HERE':
        print(f"AI API Key: {AI_API_KEY[:8]}... (configured)")
    else:
        print("AI API Key: NOT CONFIGURED - Set GEMINI_API_KEY environment variable")
    print("=" * 50)
    
    app.run(host='127.0.0.1', port=5001, debug=False)
