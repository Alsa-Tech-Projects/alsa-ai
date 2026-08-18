#!/usr/bin/env python3
"""
Alsa AI — Phone Bridge (Elite Only)
====================================
Run this inside Termux on your Android phone:

    pkg update && pkg upgrade -y
    pkg install python termux-api -y
    pip install flask flask-cors
    python phone-bridge.py

Then in Termux:app grant Termux:API permissions (Settings > Apps > Termux:API).
Alsa AI's Elite tier can now control THIS phone via voice/chat.

Endpoints (all JSON POST unless noted):
  GET  /status                    -> { ok: true, device: "phone" }
  POST /notify                    -> { title, content }
  POST /toast                     -> { text }
  POST /vibrate                   -> { duration }
  POST /torch                     -> { on: true|false }
  POST /brightness                -> { level: 0-255 }
  POST /volume                    -> { stream: "music|call|ring|notification", level: 0-15 }
  POST /battery                   -> {} -> returns battery status
  POST /location                  -> {} -> GPS coords (needs permission)
  POST /clipboard/get             -> {}
  POST /clipboard/set             -> { text }
  POST /sms/send                  -> { number, text }
  POST /sms/list                  -> { limit: 10 }
  POST /call/make                 -> { number }
  POST /call/end                  -> {}
  POST /contacts                  -> {} -> contact list
  POST /tts                       -> { text }
  POST /stt                       -> {} -> speech-to-text result
  POST /camera/photo              -> { path? }
  POST /camera/info               -> {}
  POST /app/open                  -> { package }
  POST /app/list                  -> {}
  POST /wifi/toggle               -> { on: true|false }
  POST /wifi/info                 -> {}
  POST /media/control             -> { action: play|pause|next|previous|stop }
  POST /sensors                   -> { name?: "accelerometer|gyroscope|..." }
  POST /storage/list              -> { path }
  POST /storage/read              -> { path }
  POST /storage/write             -> { path, content }
  POST /share                     -> { text, title? }
  POST /url/open                  -> { url }
  POST /shell                     -> { command }   (arbitrary shell command)

  # ── Messaging ──
  POST /send                      -> { platform: "whatsapp|telegram", number?, username?, text }
  POST /whatsapp/send-by-name     -> { name, text }
  POST /telegram/send-by-name     -> { name, text }
  POST /contacts/refresh          -> {}
  POST /contacts/search           -> { query }

  # ── yt-dlp ──
  POST /ytdlp/status              -> {}
  POST /ytdlp/download            -> { url, mode: "video|audio", quality? }

Port: 5002
"""
import subprocess
import json
import base64
import os
import re
import time
import urllib.parse
import shutil
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

PORT = 5002
HOME = os.path.expanduser("~")
CONTACTS_FILE = os.path.join(HOME, "alsa_contacts.json")
_SHARED = os.path.join(HOME, "storage", "shared")
_HAS_SHARED = os.path.isdir(_SHARED)
YTDLP_VIDEO_DIR = os.path.join(_SHARED, "DCIM", "Snapchat") if _HAS_SHARED else os.path.join(HOME, "Videos")
YTDLP_AUDIO_DIR = os.path.join(_SHARED, "Music")           if _HAS_SHARED else os.path.join(HOME, "Music")

APPS_DATABASE = {
    "youtube": "com.google.android.youtube/.app.honeycomb.Shell$HomeActivity",
    "whatsapp": "com.whatsapp/.Main",
    "whatsapp_business": "com.whatsapp.w4b/com.whatsapp.Main",
    "instagram": "com.instagram.android/.activity.MainTabActivity",
    "facebook": "com.facebook.katana/.LoginActivity",
    "telegram": "org.telegram.messenger/.DefaultIcon",
    "chrome": "com.android.chrome/com.google.android.apps.chrome.Main",
    "gmail": "com.google.android.gm/.ConversationListActivityGmail",
    "maps": "com.google.android.apps.maps/com.google.android.maps.MapsActivity",
    "settings": "com.android.settings/.Settings",
    "camera": "com.oppo.camera/.Camera"
}

def run(cmd, timeout=30, input_data=None):
    try:
        r = subprocess.run(
            cmd, shell=isinstance(cmd, str), capture_output=True, text=True, timeout=timeout, input=input_data
        )
        out = r.stdout.strip()
        err = r.stderr.strip()
        parsed = None
        if out:
            try: parsed = json.loads(out)
            except: parsed = None
        return (r.returncode == 0, out or err, parsed)
    except Exception as e:
        return (False, str(e), None)

@app.route("/status", methods=["GET"])
def status():
    return jsonify({"ok": True, "device": "phone", "bridge": "alsa-phone-bridge", "version": "1.1"})

@app.route("/notify", methods=["POST"])
def notify():
    d = request.get_json(force=True) or {}
    ok, out, _ = run(["termux-notification", "--title", d.get("title", "Alsa AI"), "--content", d.get("content", "")])
    return jsonify({"ok": ok, "output": out})

@app.route("/toast", methods=["POST"])
def toast():
    d = request.get_json(force=True) or {}
    ok, out, _ = run(["termux-toast", d.get("text", "Hello")])
    return jsonify({"ok": ok, "output": out})

@app.route("/vibrate", methods=["POST"])
def vibrate():
    d = request.get_json(force=True) or {}
    ok, out, _ = run(["termux-vibrate", "-d", str(d.get("duration", 1000))])
    return jsonify({"ok": ok, "output": out})

@app.route("/torch", methods=["POST"])
def torch():
    d = request.get_json(force=True) or {}
    ok, out, _ = run(["termux-torch", "on" if d.get("on") else "off"])
    return jsonify({"ok": ok, "output": out})

@app.route("/brightness", methods=["POST"])
def brightness():
    d = request.get_json(force=True) or {}
    ok, out, _ = run(["termux-brightness", str(d.get("level", 128))])
    return jsonify({"ok": ok, "output": out})

@app.route("/volume", methods=["POST"])
def volume():
    d = request.get_json(force=True) or {}
    ok, out, _ = run(["termux-volume", d.get("stream", "music"), str(d.get("level", 5))])
    return jsonify({"ok": ok, "output": out})

@app.route("/battery", methods=["POST"])
def battery():
    ok, out, j = run(["termux-battery-status"])
    return jsonify({"ok": ok, "data": j or out})

@app.route("/location", methods=["POST"])
def location():
    ok, out, j = run(["termux-location", "-p", "gps", "-r", "once"], timeout=60)
    return jsonify({"ok": ok, "data": j or out})

@app.route("/clipboard/get", methods=["POST"])
def clip_get():
    ok, out, _ = run(["termux-clipboard-get"])
    return jsonify({"ok": ok, "text": out})

@app.route("/clipboard/set", methods=["POST"])
def clip_set():
    d = request.get_json(force=True) or {}
    ok, out, _ = run(["termux-clipboard-set"], input_data=d.get("text", ""))
    return jsonify({"ok": ok, "output": out})

@app.route("/sms/send", methods=["POST"])
def sms_send():
    d = request.get_json(force=True) or {}
    if not d.get("number"): return jsonify({"ok": False, "error": "number required"}), 400
    ok, out, _ = run(["termux-sms-send", "-n", d["number"]], input_data=d.get("text", ""))
    return jsonify({"ok": ok, "output": out})

@app.route("/sms/list", methods=["POST"])
def sms_list():
    d = request.get_json(force=True) or {}
    ok, out, j = run(["termux-sms-list", "-l", str(d.get("limit", 10))])
    return jsonify({"ok": ok, "messages": j or out})

@app.route("/call/make", methods=["POST"])
def call_make():
    d = request.get_json(force=True) or {}
    if not d.get("number"): return jsonify({"ok": False, "error": "number required"}), 400
    ok, out, _ = run(["termux-telephony-call", d["number"]])
    return jsonify({"ok": ok, "output": out})

@app.route("/call/by-name", methods=["POST"])
def call_by_name():
    d = request.get_json(force=True) or {}
    name = (d.get("name") or "").strip().lower()
    if not name: return jsonify({"ok": False, "error": "name required"}), 400
    matches = [c for c in _load_contacts() if name in c["name"].lower()]
    if not matches: return jsonify({"ok": False, "error": "Contact not found"}), 404
    chosen = matches[0]
    ok, out, _ = run(["termux-telephony-call", chosen["number"]])
    return jsonify({"ok": ok, "output": out, "contact": chosen})

@app.route("/contacts", methods=["POST"])
def contacts():
    ok, out, j = run(["termux-contact-list"])
    return jsonify({"ok": ok, "contacts": j or out})

@app.route("/tts", methods=["POST"])
def tts():
    d = request.get_json(force=True) or {}
    ok, out, _ = run(["termux-tts-speak"], input_data=d.get("text", ""))
    return jsonify({"ok": ok})

@app.route("/stt", methods=["POST"])
def stt():
    ok, out, _ = run(["termux-speech-to-text"], timeout=60)
    return jsonify({"ok": ok, "text": out})

@app.route("/camera/photo", methods=["POST"])
def camera_photo():
    d = request.get_json(force=True) or {}
    path = d.get("path") or "/sdcard/alsa_photo.jpg"
    ok, out, _ = run(["termux-camera-photo", "-c", str(d.get("camera", 0)), path])
    return jsonify({"ok": ok, "path": path})

@app.route("/app/open", methods=["POST"])
def app_open():
    d = request.get_json(force=True) or {}
    pkg = d.get("package")
    if not pkg: return jsonify({"ok": False, "error": "package required"}), 400
    target = APPS_DATABASE.get(pkg.lower(), pkg + "/.MainActivity")
    ok, out, _ = run(["am", "start", "--user", "0", "-n", target])
    return jsonify({"ok": ok, "output": out})

@app.route("/url/open", methods=["POST"])
def url_open():
    d = request.get_json(force=True) or {}
    ok, out, _ = run(["termux-open-url", d.get("url", "")])
    return jsonify({"ok": ok})

@app.route("/shell", methods=["POST"])
def shell():
    d = request.get_json(force=True) or {}
    ok, out, _ = run(d.get("command", ""), timeout=60)
    return jsonify({"ok": ok, "output": out})

# --- Messaging Logic ---

def _normalize_num(n):
    return re.sub(r"[^\d+]", "", str(n or ""))

def _rebuild_contacts_file():
    ok, out, j = run(["termux-contact-list"], timeout=45)
    contacts = []
    if ok and isinstance(j, list):
        for c in j:
            name = c.get("name") or c.get("display_name") or ""
            number = _normalize_num(c.get("number") or c.get("phone") or "")
            if name and number: contacts.append({"name": name.strip(), "number": number})
    seen = set()
    uniq = []
    for c in contacts:
        if c["number"] not in seen:
            seen.add(c["number"])
            uniq.append(c)
    with open(CONTACTS_FILE, "w") as f:
        json.dump({"updated_at": int(time.time()), "contacts": uniq}, f)
    return True, CONTACTS_FILE, uniq

def _load_contacts():
    if not os.path.exists(CONTACTS_FILE): _rebuild_contacts_file()
    try:
        with open(CONTACTS_FILE) as f: return json.load(f).get("contacts", [])
    except: return []

def _whatsapp_send_number(number, text):
    if not shutil.which("adb"): return False, "adb not found"
    num = _normalize_num(number).lstrip("+")
    url = f"https://wa.me/{num}?text={urllib.parse.quote(text)}"
    run(["adb", "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", url, "com.whatsapp"])
    time.sleep(3) # Reduced sleep for speed
    run(["adb", "shell", "input", "keyevent", "66"])
    return True, "WhatsApp pre-filled"

def _telegram_send(target, text, is_username=True):
    if not shutil.which("adb"): return False, "adb not found"
    if is_username:
        url = f"tg://resolve?domain={target.lstrip('@')}"
    else:
        url = f"tg://resolve?phone={_normalize_num(target).lstrip('+')}"
    run(["adb", "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", url, "org.telegram.messenger"])
    time.sleep(3)
    if text:
        run(["adb", "shell", "input", "text", f'"{text}"'])
        time.sleep(0.5)
        run(["adb", "shell", "input", "keyevent", "66"])
    return True, "Telegram command sent"

@app.route("/send", methods=["POST"])
def send_unified():
    d = request.get_json(force=True) or {}
    platform = d.get("platform", "whatsapp").lower()
    text = d.get("text", "")
    if platform == "whatsapp":
        return jsonify(_whatsapp_send_number(d.get("number"), text))
    elif platform == "telegram":
        return jsonify(_telegram_send(d.get("username") or d.get("number"), text, is_username=bool(d.get("username"))))
    return jsonify({"ok": False, "error": "Invalid platform"}), 400

@app.route("/whatsapp/send-by-name", methods=["POST"])
def whatsapp_send_by_name():
    d = request.get_json(force=True) or {}
    name = d.get("name", "").lower()
    matches = [c for c in _load_contacts() if name in c["name"].lower()]
    if not matches: return jsonify({"ok": False, "error": "Contact not found"}), 404
    return jsonify(_whatsapp_send_number(matches[0]["number"], d.get("text", "")))

@app.route("/telegram/send-by-name", methods=["POST"])
def telegram_send_by_name():
    d = request.get_json(force=True) or {}
    name = d.get("name", "").lower()
    matches = [c for c in _load_contacts() if name in c["name"].lower()]
    if not matches: return jsonify({"ok": False, "error": "Contact not found"}), 404
    # For Telegram, we usually only have phone numbers in contacts.json
    return jsonify(_telegram_send(matches[0]["number"], d.get("text", ""), is_username=False))

@app.route("/whatsapp/send", methods=["POST"])
def whatsapp_send_direct():
    """Alias for /send with platform=whatsapp (frontend compatibility)."""
    d = request.get_json(force=True) or {}
    ok, msg = _whatsapp_send_number(d.get("number"), d.get("text", ""))
    return jsonify({"ok": ok, "success": ok, "message": msg})


@app.route("/telegram/send", methods=["POST"])
def telegram_send_direct():
    d = request.get_json(force=True) or {}
    target = d.get("username") or d.get("number")
    if not target:
        return jsonify({"ok": False, "error": "username or number required"}), 400
    ok, msg = _telegram_send(target, d.get("text", ""), is_username=bool(d.get("username")))
    return jsonify({"ok": ok, "success": ok, "message": msg})


# ── EMAIL AUTOMATION (SMTP via app password) ─────────────────────────
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

EMAIL_FILE = os.path.join(HOME, "alsa_email.json")

SMTP_PRESETS = {
    "gmail.com":     ("smtp.gmail.com", 587),
    "googlemail.com": ("smtp.gmail.com", 587),
    "outlook.com":   ("smtp-mail.outlook.com", 587),
    "hotmail.com":   ("smtp-mail.outlook.com", 587),
    "live.com":      ("smtp-mail.outlook.com", 587),
    "yahoo.com":     ("smtp.mail.yahoo.com", 587),
    "zoho.com":      ("smtp.zoho.com", 587),
}


def _load_email_cfg():
    try:
        with open(EMAIL_FILE) as f:
            return json.load(f)
    except Exception:
        return {}


@app.route("/email/config", methods=["POST"])
def email_config():
    """Save the user's email + app password once. { email, app_password, smtp_host?, smtp_port? }"""
    d = request.get_json(force=True) or {}
    email_addr = (d.get("email") or "").strip()
    app_password = (d.get("app_password") or "").replace(" ", "")
    if not email_addr or not app_password:
        return jsonify({"ok": False, "error": "email and app_password required"}), 400
    domain = email_addr.split("@")[-1].lower()
    host, port = SMTP_PRESETS.get(domain, ("smtp." + domain, 587))
    cfg = {
        "email": email_addr,
        "app_password": app_password,
        "smtp_host": d.get("smtp_host") or host,
        "smtp_port": int(d.get("smtp_port") or port),
        "display_name": d.get("display_name") or "",
    }
    with open(EMAIL_FILE, "w") as f:
        json.dump(cfg, f)
    return jsonify({"ok": True, "success": True, "message": f"Email connected: {email_addr}"})


@app.route("/email/status", methods=["POST", "GET"])
def email_status():
    cfg = _load_email_cfg()
    return jsonify({"ok": True, "configured": bool(cfg.get("email")), "email": cfg.get("email", "")})


@app.route("/email/send", methods=["POST"])
def email_send():
    """
    { to, subject, body, html?: bool|string, cc?, bcc?, from_name? }
    If `html` is true (or body contains HTML), the mail is sent as text/html.
    """
    d = request.get_json(force=True) or {}
    cfg = _load_email_cfg()
    if not cfg.get("email"):
        return jsonify({"ok": False, "success": False,
                        "error": "Email not connected. Save your email + app password first."}), 400

    to = d.get("to") or d.get("email")
    if not to:
        return jsonify({"ok": False, "success": False, "error": "to (recipient) required"}), 400
    recipients = [x.strip() for x in (to if isinstance(to, list) else str(to).split(",")) if x.strip()]

    subject = (d.get("subject") or "").strip() or "(no subject)"
    body = d.get("body") or d.get("text") or d.get("message") or ""
    is_html = bool(d.get("html")) or bool(re.search(r"<\s*(html|body|div|p|table|h[1-6]|br)\b", str(body), re.I))

    msg = MIMEMultipart("alternative")
    from_name = d.get("from_name") or cfg.get("display_name") or ""
    msg["From"] = f"{from_name} <{cfg['email']}>" if from_name else cfg["email"]
    msg["To"] = ", ".join(recipients)
    msg["Subject"] = subject

    cc = d.get("cc")
    if cc:
        cc_list = [x.strip() for x in (cc if isinstance(cc, list) else str(cc).split(",")) if x.strip()]
        msg["Cc"] = ", ".join(cc_list)
        recipients += cc_list
    bcc = d.get("bcc")
    if bcc:
        recipients += [x.strip() for x in (bcc if isinstance(bcc, list) else str(bcc).split(",")) if x.strip()]

    if is_html:
        plain = re.sub(r"<[^>]+>", "", str(body))
        msg.attach(MIMEText(plain, "plain", "utf-8"))
        msg.attach(MIMEText(str(body), "html", "utf-8"))
    else:
        msg.attach(MIMEText(str(body), "plain", "utf-8"))

    try:
        with smtplib.SMTP(cfg["smtp_host"], cfg["smtp_port"], timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.login(cfg["email"], cfg["app_password"])
            server.sendmail(cfg["email"], recipients, msg.as_string())
        return jsonify({"ok": True, "success": True,
                        "message": f"Email sent to {', '.join(recipients)}",
                        "subject": subject, "html": is_html})
    except Exception as e:
        return jsonify({"ok": False, "success": False, "error": f"SMTP error: {e}"}), 500


@app.route("/contacts/refresh", methods=["POST"])
def contacts_refresh():
    ok, path, uniq = _rebuild_contacts_file()
    return jsonify({"ok": ok, "count": len(uniq)})

@app.route("/contacts/search", methods=["POST"])
def contacts_search():
    d = request.get_json(force=True) or {}
    q = (d.get("query") or "").lower()
    matches = [c for c in _load_contacts() if q in c["name"].lower()]
    return jsonify({"ok": True, "matches": matches[:20]})

if __name__ == "__main__":
    _rebuild_contacts_file()
    app.run(host="0.0.0.0", port=PORT)
