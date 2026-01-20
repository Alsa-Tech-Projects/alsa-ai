import os
import re
import base64
import subprocess
import winapps
from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO
from PIL import ImageGrab
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=[
    'https://www.alsa-ai.in', 
    'https://alsa-ai.in'
])

# Allowed base directories for file operations
ALLOWED_BASE_DIRS = [
    os.path.expanduser('~\\Documents'),
    os.path.expanduser('~\\Desktop'),
    os.path.expanduser('~\\Pictures'),
    'E:\\Projects',
    'C:\\Projects',
]

# Dangerous shell metacharacters to sanitize
DANGEROUS_CHARS = re.compile(r'[;&|`$\n\r]')

def sanitize_input(value):
    """Remove dangerous characters"""
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

@app.route('/status', methods=['GET'])
def status():
    """Check if bridge is running"""
    return jsonify({
        'status': 'running',
        'message': 'ALSA AI PC Bridge is active'
    })

@app.route('/scan', methods=['GET'])
def scan_system():
    """Scan for apps and common folders"""
    try:
        # Installed Applications Scan
        apps = []
        for app_info in winapps.list_installed():
            apps.append(app_info.name)
        
        common_folders = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Videos']
        
        return jsonify({
            'success': True,
            'data': {
                'applications': apps[:50],
                'commonFolders': common_folders
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/capture_screenshot', methods=['POST'])
def capture_screenshot():
    """Take a screenshot and return base64 + save locally"""
    try:
        screenshot = ImageGrab.grab()
        
        # Convert to base64 for immediate preview
        buffered = BytesIO()
        screenshot.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        # Save to Pictures folder
        save_path = os.path.expanduser('~\\Pictures\\Screenshots')
        os.makedirs(save_path, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"screenshot_{timestamp}.png"
        full_path = os.path.join(save_path, filename)
        screenshot.save(full_path)
        
        return jsonify({
            'success': True,
            'message': f'Screenshot saved to {full_path}',
            'image_data': img_str,
            'file_path': full_path
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/create_project', methods=['POST'])
def create_project():
    """Create HTML/CSS/JS files only"""
    try:
        data = request.get_json()
        project_path = sanitize_input(data.get('project_path', ''))
        files = data.get('files', {}) # Dictionary: {'index.html': 'content'}
        
        if not project_path or not is_path_allowed(project_path):
            return jsonify({'error': 'Invalid or restricted path'}), 403
        
        os.makedirs(project_path, exist_ok=True)
        
        created_files = []
        for filename, content in files.items():
            # Security: Only allow web files
            if not filename.lower().endswith(('.html', '.css', '.js', '.json')):
                continue
                
            safe_name = os.path.basename(filename)
            file_full_path = os.path.join(project_path, safe_name)
            
            with open(file_full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            created_files.append(safe_name)
            
        return jsonify({
            'success': True,
            'message': f'Project created with {len(created_files)} files',
            'path': project_path,
            'files': created_files
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("ALSA AI Free Tier Bridge  started on http://localhost:5001")
    print("Features: Scan, Status, Screenshot, Web Coding")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5001)
