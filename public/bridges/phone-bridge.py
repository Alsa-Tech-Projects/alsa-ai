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

  # ── WhatsApp automation (ADB-based, works via Termux OR via USB-ADB) ──
  POST /whatsapp/send             -> { number, text }            # sends to E.164 number
  POST /whatsapp/send-by-name     -> { name, text }              # looks up contacts.json
  POST /contacts/refresh          -> {}                          # rebuild contacts.json
  POST /contacts/search           -> { query }                   # fuzzy name → numbers

  # ── yt-dlp (YouTube / video / audio downloader) ──
  POST /ytdlp/status              -> {}
  POST /ytdlp/download            -> { url, mode: "video|audio", quality?, audio_format?,
                                        subtitles?, embed_thumbnail?, embed_metadata?,
                                        playlist?, output_dir? }

Port: 5002  (different from PC Bridge's 5001)
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
# Prefer real Android media folders (via termux-setup-storage). Fallback: HOME.
_SHARED = os.path.join(HOME, "storage", "shared")
_HAS_SHARED = os.path.isdir(_SHARED)
YTDLP_VIDEO_DIR = os.path.join(_SHARED, "DCIM", "Videos") if _HAS_SHARED else os.path.join(HOME, "Videos")
YTDLP_AUDIO_DIR = os.path.join(_SHARED, "Music")           if _HAS_SHARED else os.path.join(HOME, "Music")
YTDLP_DEFAULT_DIR = YTDLP_VIDEO_DIR  # legacy alias


def run(cmd, timeout=30, input_data=None):
    """Run a shell/termux-api command and return (ok, stdout|stderr, json?)."""
    try:
        r = subprocess.run(
            cmd,
            shell=isinstance(cmd, str),
            capture_output=True,
            text=True,
            timeout=timeout,
            input=input_data,
        )
        out = r.stdout.strip()
        err = r.stderr.strip()
        parsed = None
        if out:
            try:
                parsed = json.loads(out)
            except Exception:
                parsed = None
        return (r.returncode == 0, out or err, parsed)
    except subprocess.TimeoutExpired:
        return (False, "Command timeout", None)
    except FileNotFoundError:
        return (False, "termux-api not installed. Run: pkg install termux-api", None)
    except Exception as e:
        return (False, str(e), None)


# ─────────────────────────── Basic ───────────────────────────
@app.route("/status", methods=["GET"])
def status():
    return jsonify({"ok": True, "device": "phone", "bridge": "alsa-phone-bridge", "version": "1.0"})


@app.route("/notify", methods=["POST"])
def notify():
    d = request.get_json(force=True) or {}
    title = d.get("title", "Alsa AI")
    content = d.get("content", "")
    ok, out, _ = run(["termux-notification", "--title", title, "--content", content])
    return jsonify({"ok": ok, "output": out})


@app.route("/toast", methods=["POST"])
def toast():
    d = request.get_json(force=True) or {}
    text = d.get("text", "Hello from Alsa AI")
    ok, out, _ = run(["termux-toast", text])
    return jsonify({"ok": ok, "output": out})


@app.route("/vibrate", methods=["POST"])
def vibrate():
    d = request.get_json(force=True) or {}
    dur = int(d.get("duration", 1000))
    ok, out, _ = run(["termux-vibrate", "-d", str(dur)])
    return jsonify({"ok": ok, "output": out})


# ─────────────────────────── Hardware ────────────────────────
@app.route("/torch", methods=["POST"])
def torch():
    d = request.get_json(force=True) or {}
    on = "on" if d.get("on") else "off"
    ok, out, _ = run(["termux-torch", on])
    return jsonify({"ok": ok, "output": out})


@app.route("/brightness", methods=["POST"])
def brightness():
    d = request.get_json(force=True) or {}
    level = int(d.get("level", 128))
    ok, out, _ = run(["termux-brightness", str(level)])
    return jsonify({"ok": ok, "output": out})


@app.route("/volume", methods=["POST"])
def volume():
    d = request.get_json(force=True) or {}
    stream = d.get("stream", "music")
    level = int(d.get("level", 5))
    ok, out, _ = run(["termux-volume", stream, str(level)])
    return jsonify({"ok": ok, "output": out})


@app.route("/battery", methods=["POST"])
def battery():
    ok, out, j = run(["termux-battery-status"])
    return jsonify({"ok": ok, "data": j or out})


@app.route("/location", methods=["POST"])
def location():
    d = request.get_json(force=True) or {}
    provider = d.get("provider", "gps")
    ok, out, j = run(["termux-location", "-p", provider, "-r", "once"], timeout=60)
    return jsonify({"ok": ok, "data": j or out})


# ─────────────────────────── Clipboard ───────────────────────
@app.route("/clipboard/get", methods=["POST"])
def clip_get():
    ok, out, _ = run(["termux-clipboard-get"])
    return jsonify({"ok": ok, "text": out})


@app.route("/clipboard/set", methods=["POST"])
def clip_set():
    d = request.get_json(force=True) or {}
    ok, out, _ = run(["termux-clipboard-set"], input_data=d.get("text", ""))
    return jsonify({"ok": ok, "output": out})


# ─────────────────────────── SMS / Call ──────────────────────
@app.route("/sms/send", methods=["POST"])
def sms_send():
    d = request.get_json(force=True) or {}
    number = d.get("number")
    text = d.get("text", "")
    if not number:
        return jsonify({"ok": False, "error": "number required"}), 400
    ok, out, _ = run(["termux-sms-send", "-n", number], input_data=text)
    return jsonify({"ok": ok, "output": out})


@app.route("/sms/list", methods=["POST"])
def sms_list():
    d = request.get_json(force=True) or {}
    limit = int(d.get("limit", 10))
    ok, out, j = run(["termux-sms-list", "-l", str(limit)])
    return jsonify({"ok": ok, "messages": j or out})


@app.route("/call/make", methods=["POST"])
def call_make():
    d = request.get_json(force=True) or {}
    number = d.get("number")
    if not number:
        return jsonify({"ok": False, "error": "number required"}), 400
    ok, out, _ = run(["termux-telephony-call", number])
    return jsonify({"ok": ok, "output": out})


@app.route("/call/by-name", methods=["POST"])
def call_by_name():
    """Look up a contact by fuzzy name in contacts.json and place the call.
    Works in any language — client just sends the plain name string."""
    d = request.get_json(force=True) or {}
    name = (d.get("name") or "").strip().lower()
    if not name:
        return jsonify({"ok": False, "error": "name required"}), 400
    # ensure contacts.json exists
    if not os.path.exists(CONTACTS_FILE):
        _rebuild_contacts_file()
    matches = [c for c in _load_contacts() if name in c["name"].lower()]
    if not matches:
        return jsonify({
            "ok": False,
            "error": f"No contact named '{name}' found. Try 'contacts refresh'."
        }), 404
    if len(matches) > 1 and not d.get("first"):
        return jsonify({"ok": False, "error": "multiple_matches", "matches": matches[:10]}), 409
    chosen = matches[0]
    ok, out, _ = run(["termux-telephony-call", chosen["number"]])
    return jsonify({"ok": ok, "output": out, "contact": chosen})



@app.route("/call/end", methods=["POST"])
def call_end():
    # Requires cell_info hack — best-effort
    ok, out, _ = run(["input", "keyevent", "KEYCODE_ENDCALL"])
    return jsonify({"ok": ok, "output": out})


@app.route("/contacts", methods=["POST"])
def contacts():
    ok, out, j = run(["termux-contact-list"])
    return jsonify({"ok": ok, "contacts": j or out})


# ─────────────────────────── Voice ───────────────────────────
@app.route("/tts", methods=["POST"])
def tts():
    d = request.get_json(force=True) or {}
    text = d.get("text", "")
    ok, out, _ = run(["termux-tts-speak"], input_data=text)
    return jsonify({"ok": ok})


@app.route("/stt", methods=["POST"])
def stt():
    ok, out, _ = run(["termux-speech-to-text"], timeout=60)
    return jsonify({"ok": ok, "text": out})


# ─────────────────────────── Camera ──────────────────────────
@app.route("/camera/photo", methods=["POST"])
def camera_photo():
    d = request.get_json(force=True) or {}
    path = d.get("path") or "/sdcard/alsa_photo.jpg"
    camera = str(d.get("camera", 0))
    ok, out, _ = run(["termux-camera-photo", "-c", camera, path])
    b64 = None
    if ok and os.path.exists(path):
        try:
            with open(path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode()
        except Exception:
            pass
    return jsonify({"ok": ok, "path": path, "image_base64": b64})


@app.route("/camera/info", methods=["POST"])
def camera_info():
    ok, out, j = run(["termux-camera-info"])
    return jsonify({"ok": ok, "data": j or out})


# ─────────────────────────── Apps / Intents ──────────────────
@app.route("/app/open", methods=["POST"])
def app_open():
    d = request.get_json(force=True) or {}
    pkg = d.get("package")
    if not pkg:
        return jsonify({"ok": False, "error": "package required"}), 400
    ok, out, _ = run(["am", "start", "-n", pkg + "/.MainActivity"])
    if not ok:
        # fallback via monkey
        ok, out, _ = run(["monkey", "-p", pkg, "-c", "android.intent.category.LAUNCHER", "1"])
    return jsonify({"ok": ok, "output": out})


@app.route("/app/list", methods=["POST"])
def app_list():
    ok, out, _ = run(["pm", "list", "packages"])
    pkgs = [l.replace("package:", "") for l in out.splitlines()] if ok else []
    return jsonify({"ok": ok, "packages": pkgs})


@app.route("/url/open", methods=["POST"])
def url_open():
    d = request.get_json(force=True) or {}
    url = d.get("url")
    if not url:
        return jsonify({"ok": False, "error": "url required"}), 400
    ok, out, _ = run(["termux-open-url", url])
    return jsonify({"ok": ok, "output": out})


@app.route("/share", methods=["POST"])
def share():
    d = request.get_json(force=True) or {}
    title = d.get("title", "Share")
    ok, out, _ = run(["termux-share", "-t", title], input_data=d.get("text", ""))
    return jsonify({"ok": ok})


# ─────────────────────────── Wi-Fi ───────────────────────────
@app.route("/wifi/toggle", methods=["POST"])
def wifi_toggle():
    d = request.get_json(force=True) or {}
    on = "true" if d.get("on") else "false"
    ok, out, _ = run(["termux-wifi-enable", on])
    return jsonify({"ok": ok, "output": out})


@app.route("/wifi/info", methods=["POST"])
def wifi_info():
    ok, out, j = run(["termux-wifi-connectioninfo"])
    return jsonify({"ok": ok, "data": j or out})


# ─────────────────────────── Media ───────────────────────────
@app.route("/media/control", methods=["POST"])
def media_control():
    d = request.get_json(force=True) or {}
    action = d.get("action", "play")
    ok, out, _ = run(["termux-media-player", action])
    return jsonify({"ok": ok, "output": out})


# ─────────────────────────── Sensors ─────────────────────────
@app.route("/sensors", methods=["POST"])
def sensors():
    d = request.get_json(force=True) or {}
    name = d.get("name")
    cmd = ["termux-sensor", "-n", "1"]
    if name:
        cmd.extend(["-s", name])
    else:
        cmd.append("-a")
    ok, out, j = run(cmd, timeout=15)
    return jsonify({"ok": ok, "data": j or out})


# ─────────────────────────── Storage ─────────────────────────
@app.route("/storage/list", methods=["POST"])
def storage_list():
    d = request.get_json(force=True) or {}
    path = d.get("path", "/sdcard")
    try:
        items = os.listdir(path)
        return jsonify({"ok": True, "items": items})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)})


@app.route("/storage/read", methods=["POST"])
def storage_read():
    d = request.get_json(force=True) or {}
    path = d.get("path")
    if not path:
        return jsonify({"ok": False, "error": "path required"}), 400
    try:
        with open(path, "r", errors="ignore") as f:
            return jsonify({"ok": True, "content": f.read()})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)})


@app.route("/storage/write", methods=["POST"])
def storage_write():
    d = request.get_json(force=True) or {}
    path = d.get("path")
    content = d.get("content", "")
    if not path:
        return jsonify({"ok": False, "error": "path required"}), 400
    try:
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(path, "w") as f:
            f.write(content)
        return jsonify({"ok": True, "path": path})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)})


# ─────────────────────────── Shell (power user) ──────────────
@app.route("/shell", methods=["POST"])
def shell():
    d = request.get_json(force=True) or {}
    cmd = d.get("command")
    if not cmd:
        return jsonify({"ok": False, "error": "command required"}), 400
    ok, out, _ = run(cmd, timeout=60)
    return jsonify({"ok": ok, "output": out})


# ─────────────────────── Contacts (contacts.json) ────────────
def _normalize_num(n):
    if not n:
        return ""
    return re.sub(r"[^\d+]", "", str(n))


def _rebuild_contacts_file():
    """Dump termux-contact-list -> ~/alsa_contacts.json.
    Fallback: try `content query --uri content://contacts/phones/` if termux-api missing."""
    ok, out, j = run(["termux-contact-list"], timeout=45)
    contacts = []
    if ok and isinstance(j, list):
        for c in j:
            name = c.get("name") or ""
            number = _normalize_num(c.get("number"))
            if name and number:
                contacts.append({"name": name.strip(), "number": number})
    if not contacts:
        # ADB / non-Termux fallback
        ok2, out2, _ = run("content query --uri content://com.android.contacts/data/phones "
                           "--projection display_name:data1", timeout=30)
        if ok2 and out2:
            for line in out2.splitlines():
                m_name = re.search(r"display_name=([^,]+)", line)
                m_num = re.search(r"data1=([^,]+)", line)
                if m_name and m_num:
                    contacts.append({
                        "name": m_name.group(1).strip(),
                        "number": _normalize_num(m_num.group(1)),
                    })
    # de-dupe
    seen = set()
    uniq = []
    for c in contacts:
        key = (c["name"].lower(), c["number"])
        if key in seen:
            continue
        seen.add(key)
        uniq.append(c)
    try:
        with open(CONTACTS_FILE, "w") as f:
            json.dump({"updated_at": int(time.time()), "contacts": uniq}, f, indent=2)
    except Exception as e:
        return False, str(e), []
    return True, CONTACTS_FILE, uniq


def _load_contacts():
    if not os.path.exists(CONTACTS_FILE):
        _rebuild_contacts_file()
    try:
        with open(CONTACTS_FILE) as f:
            return json.load(f).get("contacts", [])
    except Exception:
        return []


@app.route("/contacts/refresh", methods=["POST"])
def contacts_refresh():
    ok, path, uniq = _rebuild_contacts_file()
    return jsonify({"ok": ok, "path": path, "count": len(uniq)})


@app.route("/contacts/search", methods=["POST"])
def contacts_search():
    d = request.get_json(force=True) or {}
    q = (d.get("query") or "").strip().lower()
    if not q:
        return jsonify({"ok": False, "error": "query required"}), 400
    matches = [c for c in _load_contacts() if q in c["name"].lower()]
    return jsonify({"ok": True, "matches": matches[:20]})


# ─────────────────────── WhatsApp via ADB intent ─────────────
def _whatsapp_send_number(number, text):
    """Open wa.me chat and press ENTER via ADB. Works when phone is USB-connected
    to a PC running adb, OR from within Termux if `adb` binary is installed and
    the device is set as its own host (rare — usually PC does this)."""
    if not shutil.which("adb"):
        return False, "adb binary not found on PATH. Install: pkg install android-tools (Termux) or run from PC."
    number = _normalize_num(number).lstrip("+")
    encoded = urllib.parse.quote(text or "")
    url = f"https://wa.me/{number}?text={encoded}"
    ok1, out1, _ = run(["adb", "shell", "am", "start", "-a",
                        "android.intent.action.VIEW", "-d", url, "com.whatsapp"], timeout=20)
    if not ok1:
        return False, f"adb open failed: {out1}"
    time.sleep(8)  # wait for chat to load
    ok2, out2, _ = run(["adb", "shell", "input", "keyevent", "66"], timeout=15)
    return (ok1 and ok2), out2 or out1


@app.route("/whatsapp/send", methods=["POST"])
def whatsapp_send():
    d = request.get_json(force=True) or {}
    number = d.get("number")
    text = d.get("text", "")
    if not number:
        return jsonify({"ok": False, "error": "number required"}), 400
    ok, msg = _whatsapp_send_number(number, text)
    return jsonify({"ok": ok, "message": msg, "number": number})


@app.route("/whatsapp/send-by-name", methods=["POST"])
def whatsapp_send_by_name():
    d = request.get_json(force=True) or {}
    name = (d.get("name") or "").strip().lower()
    text = d.get("text", "")
    if not name:
        return jsonify({"ok": False, "error": "name required"}), 400
    matches = [c for c in _load_contacts() if name in c["name"].lower()]
    if not matches:
        return jsonify({"ok": False, "error": f"No contact named '{name}' in contacts.json. Try /contacts/refresh."}), 404
    if len(matches) > 1 and not d.get("first"):
        return jsonify({"ok": False, "error": "multiple_matches", "matches": matches[:10]}), 409
    chosen = matches[0]
    ok, msg = _whatsapp_send_number(chosen["number"], text)
    return jsonify({"ok": ok, "message": msg, "contact": chosen})


# ─────────────────────── yt-dlp (video / audio) ──────────────
@app.route("/ytdlp/status", methods=["POST"])
def ytdlp_status():
    ok, out, _ = run(["yt-dlp", "--version"], timeout=15)
    if not ok:
        # try to auto-install
        run(["pip", "install", "-U", "yt-dlp"], timeout=120)
        ok, out, _ = run(["yt-dlp", "--version"], timeout=15)
    return jsonify({"ok": ok, "installed": ok, "version": out if ok else None})


@app.route("/ytdlp/download", methods=["POST"])
def ytdlp_download():
    d = request.get_json(force=True) or {}
    url = d.get("url")
    if not url:
        return jsonify({"ok": False, "error": "url required"}), 400
    mode = d.get("mode", "video")
    quality = str(d.get("quality", "best"))
    audio_fmt = d.get("audio_format", "mp3")
    # Route by mode: audio → Music, video → DCIM/Videos (client can override with output_dir)
    default_dir = YTDLP_AUDIO_DIR if mode == "audio" else YTDLP_VIDEO_DIR
    outdir = d.get("output_dir") or default_dir
    os.makedirs(outdir, exist_ok=True)

    cmd = ["yt-dlp", "--no-warnings", "-o", os.path.join(outdir, "%(title)s.%(ext)s")]
    if d.get("playlist"):
        cmd.append("--yes-playlist")
    else:
        cmd.append("--no-playlist")
    if d.get("subtitles"):
        cmd += ["--write-subs", "--write-auto-subs", "--sub-langs", "en.*,hi.*"]
    if d.get("embed_thumbnail"):
        cmd.append("--embed-thumbnail")
    if d.get("embed_metadata"):
        cmd.append("--embed-metadata")

    if mode == "audio":
        cmd += ["-x", "--audio-format", audio_fmt, "--audio-quality", "0"]
    else:
        if quality in {"144", "240", "360", "480", "720", "1080", "1440", "2160"}:
            cmd += ["-f", f"bestvideo[height<={quality}]+bestaudio/best[height<={quality}]", "--merge-output-format", "mp4"]
        else:
            cmd += ["-f", "bestvideo+bestaudio/best", "--merge-output-format", "mp4"]

    cmd.append(url)
    ok, out, _ = run(cmd, timeout=600)
    files = []
    try:
        files = sorted(os.listdir(outdir))[-15:]
    except Exception:
        pass
    return jsonify({
        "ok": ok,
        "success": ok,
        "output_dir": outdir,
        "count": len(files),
        "files": files,
        "log_tail": (out or "")[-1500:],
    })


if __name__ == "__main__":
    print(f"📱 Alsa AI Phone Bridge running on http://0.0.0.0:{PORT}")
    print("Elite users only. Make sure Termux:API app is installed and permissions granted.")
    # Auto-dump contacts on start (best-effort)
    try:
        okc, pathc, uniqc = _rebuild_contacts_file()
        if okc:
            print(f"✅ Contacts cached: {len(uniqc)} entries → {pathc}")
        else:
            print(f"⚠️  Contacts cache skipped: {pathc}")
    except Exception as e:
        print(f"⚠️  Contacts cache error: {e}")
    app.run(host="0.0.0.0", port=PORT, debug=False)

