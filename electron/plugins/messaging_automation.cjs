// Pure Node WhatsApp/Telegram launcher — no nut-js keyboard automation.
// Opens the chat with the message pre-filled via the web send URL; the user presses
// Enter to actually send (auto-sending would require OS-level keystroke injection,
// which is fragile and can need elevated permissions — intentionally left out).
'use strict';
const { exec } = require('child_process');

const openUrl = (url) => new Promise((resolve) => {
  exec(`start "" "${url}"`, (err) => resolve(!err));
});

async function sendWhatsApp(payload = {}) {
  const { phone, message = '' } = payload;
  if (!phone) return { success: false, message: 'phone is required' };
  const cleanPhone = String(phone).replace(/[^0-9]/g, '');
  const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  const opened = await openUrl(url);
  return {
    success: opened,
    message: opened
      ? `WhatsApp chat opened for ${cleanPhone} with your message pre-filled. Press Enter in the chat to send it.`
      : 'Failed to open WhatsApp Web',
  };
}

async function sendTelegram(payload = {}) {
  const { username, link, message = '' } = payload;
  const handle = String(username || link || '').replace('@', '').replace(/^https?:\/\/t\.me\//i, '');
  if (!handle) return { success: false, message: 'username or link is required' };
  const url = message
    ? `https://t.me/${handle}?text=${encodeURIComponent(message)}`
    : `https://t.me/${handle}`;
  const opened = await openUrl(url);
  return {
    success: opened,
    message: opened
      ? `Telegram chat opened for @${handle}${message ? '. Press Enter in the chat to send your pre-filled message.' : '.'}`
      : 'Failed to open Telegram',
  };
}

module.exports = { sendWhatsApp, sendTelegram };

if (require.main === module) {
  const [action, payloadJson] = process.argv.slice(2);
  const payload = JSON.parse(payloadJson || '{}');
  const fn = action === 'sendTelegram' ? sendTelegram : sendWhatsApp;
  fn(payload).then((r) => {
    console.log(JSON.stringify(r));
    process.exitCode = r.success ? 0 : 1;
  });
}
