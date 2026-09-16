const { ipcMain } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

function registerAgentHandlers() {

    // 1. Junk Files & Temp Cleaner
    ipcMain.handle('agent:cleanJunk', async () => {
        const tempPath = os.tmpdir();
        let cleanedSize = 0;
        let fileCount = 0;

        try {
            const files = await fs.readdir(tempPath);
            for (const file of files) {
                const curPath = path.join(tempPath, file);
                try {
                    const stats = await fs.stat(curPath);
                    cleanedSize += stats.size;
                    await fs.remove(curPath);
                    fileCount++;
                } catch (e) {
                    // Skip locked files
                }
            }
            return {
                success: true,
                freedMB: (cleanedSize / (1024 * 1024)).toFixed(2),
                filesRemoved: fileCount
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // 2. MS Paint Live Mouse Drawing Automation
    ipcMain.handle('agent:drawInPaint', async (_, shape = 'box') => {
        try {
            const { mouse, straightTo, Point, Button } = require('@nut-tree-fork/nut-js');

            exec('start mspaint');
            await new Promise(r => setTimeout(r, 2000));

            const startX = 500, startY = 400;
            await mouse.setPosition(new Point(startX, startY));
            await mouse.pressButton(Button.LEFT);

            if (shape === 'box') {
                await mouse.move(straightTo(new Point(startX + 200, startY)));
                await mouse.move(straightTo(new Point(startX + 200, startY + 200)));
                await mouse.move(straightTo(new Point(startX, startY + 200)));
                await mouse.move(straightTo(new Point(startX, startY)));
            }

            await mouse.releaseButton(Button.LEFT);
            return { success: true, message: 'Painting completed on MS Paint!' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // 3. Live PowerPoint Presentation Automation
    ipcMain.handle('agent:createPPT', async (_, data) => {
        const title = data?.title || "ALSA AI Autonomous Generated Presentation";
        const slideText = data?.content || "This presentation was generated live by ALSA AI Agent.";

        const psScript = `
      $pptx = New-Object -ComObject PowerPoint.Application;
      $pptx.Visible = [MsoTriState]::msoTrue;
      $pres = $pptx.Presentations.Add();
      $slide = $pres.Slides.Add(1, 1);
      $slide.Shapes.Title.TextFrame.TextRange.Text = "${title}";
      $slide.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text = "${slideText}";
    `;

        return new Promise((resolve) => {
            exec(`powershell -Command "${psScript.replace(/\n/g, '')}"`, (err) => {
                if (err) {
                    resolve({ success: false, error: err.message });
                } else {
                    resolve({ success: true, message: 'PowerPoint slide generated live!' });
                }
            });
        });
    });

    // 4. App & URL Opening Automation
    ipcMain.handle('agent:openApp', async (_, target) => {
        try {
            exec(`start "" "${target}"`);
            return { success: true, message: `Opened target: ${target}` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // 5. CMD Commands Execution
    ipcMain.handle('agent:runCmd', async (_, command) => {
        return new Promise((resolve) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    resolve({ success: false, error: stderr || error.message });
                } else {
                    resolve({ success: true, output: stdout });
                }
            });
        });
    });

    // 6. Python Script Execution & Debugging
    ipcMain.handle('agent:runPython', async (_, filePath) => {
        return new Promise((resolve) => {
            exec(`python "${filePath}"`, (error, stdout, stderr) => {
                if (error || stderr) {
                    resolve({ success: false, error: stderr || error.message, output: stdout });
                } else {
                    resolve({ success: true, output: stdout });
                }
            });
        });
    });

    // 7. WhatsApp Message Automation (Via Web Browser URI Scheme)
    ipcMain.handle('agent:sendWhatsApp', async (_, { phone, message }) => {
        try {
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            const encodedMsg = encodeURIComponent(message);
            const waUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
            exec(`start "" "${waUrl}"`);
            return { success: true, message: `WhatsApp target launched for ${cleanPhone}` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // 8. Telegram Message Automation
    ipcMain.handle('agent:sendTelegram', async (_, { username, message }) => {
        try {
            const cleanUsername = username.replace('@', '');
            const tgUrl = `https://t.me/${cleanUsername}`;
            exec(`start "" "${tgUrl}"`);
            return { success: true, message: `Telegram chat launched for ${cleanUsername}` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // 9. Email Automation (Default Mail Client Trigger)
    ipcMain.handle('agent:sendEmail', async (_, { to, subject, body }) => {
        try {
            const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;
            exec(`start "" "${mailtoUrl}"`);
            return { success: true, message: `Default mail app launched for ${to}` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // 10. System Debugging & Info Scan
    ipcMain.handle('agent:getSystemInfo', async () => {
        try {
            return {
                success: true,
                platform: os.platform(),
                arch: os.arch(),
                totalMemoryMB: (os.totalmem() / (1024 * 1024)).toFixed(2),
                freeMemoryMB: (os.freemem() / (1024 * 1024)).toFixed(2),
                uptimeSec: os.uptime()
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerAgentHandlers };