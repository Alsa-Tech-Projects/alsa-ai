// Pure Node local music lister/player — hands playback off to the OS default player.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const AUDIO_EXT = new Set(['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.wma']);

function scanMusicFolder() {
  const musicDir = path.join(os.homedir(), 'Music');
  const songs = [];
  try {
    for (const file of fs.readdirSync(musicDir)) {
      const ext = path.extname(file).toLowerCase();
      if (AUDIO_EXT.has(ext)) {
        songs.push({ name: path.basename(file, ext), path: path.join(musicDir, file) });
      }
    }
  } catch {
    // Music folder may not exist — return empty list
  }
  return songs;
}

async function getSongList() {
  const songs = scanMusicFolder();
  return { success: true, songs, message: songs.length ? `${songs.length} songs found` : 'No songs found in Music folder' };
}

async function playSong(payload = {}) {
  const { song_path } = payload;
  if (!song_path || !fs.existsSync(song_path)) {
    return { success: false, message: 'Song file not found' };
  }
  exec(`start "" "${song_path}"`);
  return { success: true, message: `Playing ${path.basename(song_path)}` };
}

async function stopSong() {
  return { success: true, message: 'Playback is handled by your default media player — stop it from there.' };
}

module.exports = { getSongList, playSong, stopSong };
