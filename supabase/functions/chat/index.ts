import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Wikipedia search function
async function searchWikipedia(query: string): Promise<string> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.query?.search?.length) {
      return "No results found on Wikipedia.";
    }

    const pageId = searchData.query.search[0].pageid;
    const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=extracts&exintro=true&explaintext=true&format=json&origin=*`;
    const contentResponse = await fetch(contentUrl);
    const contentData = await contentResponse.json();

    const page = contentData.query.pages[pageId];
    return `${page.title}\n\n${page.extract}`;
  } catch (error) {
    console.error("Wikipedia search error:", error);
    return "Failed to search Wikipedia.";
  }
}

async function generateProjectFiles(input: { project_type: string; description: string }): Promise<Record<string, string>> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  
  if (!LOVABLE_API_KEY && !GEMINI_API_KEY) {
    throw new Error("No AI API key configured");
  }

  const system = `Return ONLY valid JSON. Create a small but working project file map for the requested type.

Rules:
- Output JSON shape: {"files": {"relative/path": "file contents"}}
- No markdown fences, no extra text.
- Keep it compact; prefer fewer files.

Supported types:
- html: index.html, styles.css, script.js, README.md
- react: minimal Vite React app structure (src/main.tsx, src/App.tsx, index.html, package.json, vite.config.ts, tsconfig.json, README.md)
- node: minimal Express API (index.js, package.json, README.md)
- python: minimal CLI (main.py, requirements.txt, README.md)
`;

  const user = `Project type: ${input.project_type}\nDescription: ${input.description}`;

  let content = "";
  
  if (LOVABLE_API_KEY) {
    // Use Lovable AI gateway
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Project generation failed: ${resp.status} ${t}`);
    }

    const j = await resp.json();
    content = j.choices?.[0]?.message?.content ?? "";
  } else {
    // Fallback to Gemini API
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: `${system}\n\n${user}` }] }
        ],
        generationConfig: { temperature: 0.2 }
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Project generation failed: ${resp.status} ${t}`);
    }

    const j = await resp.json();
    content = j.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Project generation returned invalid JSON");

  const extracted = content.slice(start, end + 1);
  const parsed = JSON.parse(extracted);
  const files = parsed?.files ?? parsed;

  if (!files || typeof files !== "object") throw new Error("Project generation JSON has no files");

  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(files)) {
    if (typeof k !== "string" || typeof v !== "string") continue;
    if (k.length > 180) continue;
    if (v.length > 200_000) continue;
    normalized[k] = v;
  }

  if (Object.keys(normalized).length === 0) throw new Error("Project generation produced no usable files");
  return normalized;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, memory, ai_response_style, files } = body; // files = array of { name, type, data (base64) }
    
    // Use Lovable AI (auto-provisioned) - fallback to Gemini if available
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    const useLovableAI = !!LOVABLE_API_KEY;
    
    if (!LOVABLE_API_KEY && !GEMINI_API_KEY) {
      throw new Error("No AI API key configured. LOVABLE_API_KEY or GEMINI_API_KEY required.");
    }

    const systemPrompt = `You are ALSA - AI Lifestyle & Smart Assistant, a powerful AI assistant created by Mohd Eisa.

Core capabilities:
- General knowledge and conversation
- Web search via Wikipedia
- Music playback control (via Spotify/YouTube)
- Game integration (web-based multiplayer games)
- PC control and automation (execute commands, run files, install software, system power management)
- Android phone control via ADB (USB and wireless connections)
- **COMPLETE PROJECT GENERATION**: Create production-ready projects with proper structure, dependencies, and configuration
  - HTML/CSS/JS websites with responsive design
  - React applications with components, routing, state management
  - Node.js backends with Express, APIs, database integration
  - TypeScript projects with proper typing and configuration
  - Python projects with virtual environments and requirements
  - Database setup (MongoDB, PostgreSQL, MySQL)
  - Shadcn UI integration for React projects
  - E-commerce websites with product listings, cart, checkout
  - Portfolio websites with animations and modern design
  - Complete README with setup instructions
- **DOCUMENT CREATION**:
  - PowerPoint presentations with slides, themes (professional/modern/creative/minimal/dark), and formatting
  - Excel spreadsheets with data, formatting, colors, and auto-width columns
  - SQLite/Access databases with tables, columns, and sample data
- Screenshot capture (capture screen anytime user requests)
- Window management (close specific windows, open applications via Run command)

IMPORTANT INSTRUCTIONS:
1. When users request system commands (shutdown, restart, sleep), execute them immediately using the system_power_command tool
2. When users want to create a project:
   - **ASK FOR DETAILS**: What to build, tech stack (HTML/CSS/JS, React, Node.js, TypeScript, Python, etc.), and directory path
   - **ALWAYS ASK FOR PATH**: Ask user where to save (e.g., E:\\Eisa\\ProjectName or C:\\Users\\Mohd Eisa\\Documents\\Projects)
   - **CREATE COMPLETE STRUCTURE**: Full project with all files, proper folder structure, dependencies
   - **INCLUDE**: package.json/requirements.txt, configuration files, README, proper imports, responsive styling
   - **MAKE IT PRODUCTION-READY**: Working code, error handling, best practices, modern patterns
3. When users want to create documents (PPT/Excel/Database):
   - **ASK FOR PATH**: Where to save the file (e.g., E:\\Eisa\\presentation.pptx)
   - **ASK FOR CONTENT**: What should be in the document
   - For PowerPoint: Ask for title, slide content, and theme preference
   - For Excel: Ask for column headers and data to include
   - For Database: Ask for table names, columns, and sample data
4. For screenshots, use capture_screenshot tool when user requests
5. For window management:
   - Use close_window to close specific applications (File Explorer, Chrome, Notepad, etc.)
   - Use run_application to open applications via Windows Run command (notepad, calc, mspaint, control, etc.)
6. For Android phone control, use adb_connect then adb_command
7. **ALWAYS SHOW COMPLETE OUTPUT**: Display full command output, file contents, errors in the chat
8. Be proactive in offering solutions and automations

PERSONAL QUESTIONS:
- If asked about your religion: "I am an AI, so I don't have a religion. However, I have great respect for Islam and all peaceful beliefs."
- Always respond respectfully to questions about faith, culture, or beliefs.

MEMORY ACCESS:
${memory ? `You have access to user's saved memories: ${JSON.stringify(memory)}. Use this information naturally in conversation.` : 'No memories saved yet.'}

MULTILINGUAL SUPPORT:
- You can understand and respond in multiple languages including English, Hindi, Urdu, Arabic, Spanish, French, German, Chinese, Japanese, and more
- Detect the user's language automatically and respond in the same language
- If user speaks in Hindi/Urdu/Hinglish, respond naturally in that language
- For code and technical content, use English but explain in user's preferred language

RESPONSE STYLE:
- Match the user's language preference
- When providing code, use markdown code blocks with language identifiers
- **ALWAYS show complete output from executions in code blocks**
- Format: \`\`\`language\ncode/output here\n\`\`\`

PERSONALITY MODE (from Settings): ${ai_response_style || 'balanced'}
- caring: supportive + empathetic
- comedian: light jokes, but still do tasks correctly
- roast: playful roast, no hate/abuse/slurs
- concise/balanced/detailed/creative: follow normally`;


    const tools = [
      {
        type: "function",
        function: {
          name: "search_wikipedia",
          description: "Search Wikipedia for factual information about any topic. Use this whenever you need to research people, places, events, scientific concepts, historical facts, or any other knowledge.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query for Wikipedia"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "play_music",
          description: "Play a song from YouTube in the background. Use when user asks to play music.",
          parameters: {
            type: "object",
            properties: {
              song: {
                type: "string",
                description: "The name of the song to play"
              }
            },
            required: ["song"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "launch_game",
          description: "Launch an online multiplayer game. Use when user wants to play games.",
          parameters: {
            type: "object",
            properties: {
              game: {
                type: "string",
                description: "The type of game (ludo, carrom, chess, tic-tac-toe, pool, cards, Flappy Bird)"
              }
            },
            required: ["game"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "execute_python_file",
          description: "Execute a Python file and return its output. Use when user asks to run Python scripts.",
          parameters: {
            type: "object",
            properties: {
              file_path: {
                type: "string",
                description: "Full path to the Python file to execute"
              }
            },
            required: ["file_path"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "execute_cmd_command",
          description: "Execute a CMD command and return output. Use for system commands, installations checks, etc.",
          parameters: {
            type: "object",
            properties: {
              command: {
                type: "string",
                description: "The CMD command to execute"
              }
            },
            required: ["command"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_coding_project",
          description: "Create a complete coding project with multiple files at specified path. USE THIS TOOL when user asks to create projects, websites, apps, applications, portfolios, e-commerce sites, etc. DO NOT use capture_screenshot for project creation - that tool is ONLY for taking pictures of the screen. IMPORTANT: Ask user for 1) project path (e.g., E:\\Projects\\MyApp), 2) project type (react/html/node/python), 3) what the project should do.",
          parameters: {
            type: "object",
            properties: {
              project_path: {
                type: "string",
                description: "Full Windows path where project should be created (e.g., E:\\Eisa\\MyProject or C:\\Users\\Mohd Eisa\\Documents\\Projects\\MyApp). ALWAYS ask user for this path first."
              },
              description: {
                type: "string",
                description: "Detailed description of what the project should do, including all features and requirements"
              },
              project_type: {
                type: "string",
                enum: ["react", "html", "node", "python", "todo", "weather", "portfolio", "ecommerce", "backend"],
                description: "Type of project to create"
              }
            },
            required: ["project_path", "description", "project_type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_powerpoint",
          description: "Create a PowerPoint presentation with slides, animations, and formatting. Use when user asks to create PPT, presentation, slides.",
          parameters: {
            type: "object",
            properties: {
              file_path: {
                type: "string",
                description: "Full Windows path where the .pptx file should be saved (e.g., E:\\Eisa\\presentation.pptx)"
              },
              title: {
                type: "string",
                description: "Title of the presentation"
              },
              slides: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Slide title" },
                    content: { type: "string", description: "Slide content/bullet points (use \\n for new lines)" },
                    layout: { type: "string", enum: ["title", "content", "two_column", "image"], description: "Slide layout" }
                  }
                },
                description: "Array of slide objects with title, content, and layout"
              },
              theme: {
                type: "string",
                enum: ["professional", "modern", "creative", "minimal", "dark"],
                description: "Presentation theme/style"
              }
            },
            required: ["file_path", "title", "slides"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_excel",
          description: "Create an Excel spreadsheet with data, formatting, and formulas. Use when user asks to create Excel, spreadsheet, .xlsx file.",
          parameters: {
            type: "object",
            properties: {
              file_path: {
                type: "string",
                description: "Full Windows path where the .xlsx file should be saved (e.g., E:\\Eisa\\data.xlsx)"
              },
              sheet_name: {
                type: "string",
                description: "Name of the worksheet"
              },
              headers: {
                type: "array",
                items: { type: "string" },
                description: "Column headers"
              },
              data: {
                type: "array",
                items: {
                  type: "array",
                  items: { type: "string" }
                },
                description: "2D array of data rows"
              },
              formatting: {
                type: "object",
                properties: {
                  header_color: { type: "string", description: "Header background color (e.g., #4472C4)" },
                  alternating_rows: { type: "boolean", description: "Apply alternating row colors" },
                  auto_width: { type: "boolean", description: "Auto-fit column widths" }
                },
                description: "Formatting options"
              }
            },
            required: ["file_path", "sheet_name", "headers", "data"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_database",
          description: "Create an Access database (.accdb) or SQLite database with tables and sample data. Use when user asks to create database, Access DB.",
          parameters: {
            type: "object",
            properties: {
              file_path: {
                type: "string",
                description: "Full Windows path where the database should be saved (e.g., E:\\Eisa\\mydb.accdb or E:\\Eisa\\mydb.db)"
              },
              db_type: {
                type: "string",
                enum: ["sqlite", "access"],
                description: "Type of database to create"
              },
              tables: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Table name" },
                    columns: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          type: { type: "string", enum: ["TEXT", "INTEGER", "REAL", "DATE", "BOOLEAN"] },
                          primary_key: { type: "boolean" }
                        },
                        required: ["name", "type"]
                      }
                    },
                    sample_data: {
                      type: "array",
                      items: { 
                        type: "array",
                        items: { type: "string" }
                      },
                      description: "Sample data rows to insert (2D array of strings)"
                    }
                  },
                  required: ["name", "columns"]
                },
                description: "Array of table definitions"
              }
            },
            required: ["file_path", "db_type", "tables"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_software",
          description: "Check if software is installed on the system. Use when user asks if something is installed.",
          parameters: {
            type: "object",
            properties: {
              software: {
                type: "string",
                description: "Name of the software to check (python, node, git, etc.)"
              }
            },
            required: ["software"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "system_power_command",
          description: "Execute system power commands (shutdown, restart, sleep). Use when user asks to shutdown, restart, or put system to sleep.",
          parameters: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["shutdown", "restart", "sleep"],
                description: "The power action to execute"
              }
            },
            required: ["action"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "adb_connect",
          description: "Connect to Android phone via ADB (USB or wireless). Use when user wants to connect their phone.",
          parameters: {
            type: "object",
            properties: {
              ip_address: {
                type: "string",
                description: "IP address for wireless connection (optional, leave empty for USB)"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "adb_command",
          description: "Execute ADB command on connected Android phone. Use for phone control operations.",
          parameters: {
            type: "object",
            properties: {
              command: {
                type: "string",
                description: "The ADB command to execute (without 'adb' prefix)"
              }
            },
            required: ["command"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "capture_screenshot",
          description: "Capture a screenshot of the user's computer screen and save it as an image file. ONLY use this tool when user explicitly asks to take a screenshot, screen capture, or save what's on their screen. DO NOT use for project creation, document creation, or any other task - those have their own dedicated tools.",
          parameters: {
            type: "object",
            properties: {
              delay_seconds: {
                type: "number",
                description: "Optional delay in seconds before taking the screenshot (e.g., 5, 10, 30)"
              },
              save_path: {
                type: "string",
                description: "Optional custom path to save screenshot. Default: user's Screenshots folder"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "close_window",
          description: "Close a specific window or application. Use when user wants to close apps like File Explorer, Chrome, Notepad, etc.",
          parameters: {
            type: "object",
            properties: {
              window_name: {
                type: "string",
                description: "Name of the window/application to close (e.g., 'File Explorer', 'Chrome', 'Notepad')"
              }
            },
            required: ["window_name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "run_application",
          description: "Open an application using Windows Run command. IMPORTANT: Pass ONLY the simple command name like 'notepad', 'calc', 'mspaint', 'chrome', 'cmd', 'explorer', 'control'. Do NOT include any extra text or descriptions.",
          parameters: {
            type: "object",
            properties: {
              command: {
                type: "string",
                description: "Simple Windows command name ONLY (examples: 'notepad', 'calc', 'mspaint', 'chrome', 'cmd', 'explorer', 'control', 'taskmgr')"
              }
            },
            required: ["command"]
          }
        }
      }
    ];

    // Build message contents including files (images/docs) for multimodal Gemini
    const geminiContents: any[] = [];

    // System message
    geminiContents.push({ role: "user", parts: [{ text: `SYSTEM: ${systemPrompt}` }] });
    geminiContents.push({ role: "model", parts: [{ text: "Understood. I'm ALSA, ready to assist." }] });

    // Conversation messages
    for (const msg of messages) {
      const parts: any[] = [];

      // Text content
      if (msg.content) {
        parts.push({ text: msg.content });
      }

      // Attached files (images/docs as base64)
      if (msg.files && Array.isArray(msg.files)) {
        for (const f of msg.files) {
          if (f.data && f.type) {
            // Extract base64 data (remove data:...;base64, prefix if present)
            let base64Data = f.data;
            if (base64Data.includes(',')) {
              base64Data = base64Data.split(',')[1];
            }
            parts.push({
              inlineData: {
                mimeType: f.type,
                data: base64Data
              }
            });
          }
        }
      }

      if (parts.length > 0) {
        geminiContents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts
        });
      }
    }

    // Call AI API - prefer Lovable AI, fallback to Gemini
    let response: Response;
    let isLovableAI = false;
    
    if (useLovableAI) {
      isLovableAI = true;
      // Use Lovable AI gateway with OpenAI-compatible format
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m: { role: string; content?: string }) => ({
              role: m.role,
              content: m.content || "Hello"
            }))
          ],
          tools: tools,
          stream: true,
        }),
      });
    } else {
      // Fallback to Gemini API directly
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { 
              parts: [{ text: systemPrompt }] 
            },
            contents: messages.map((m: { role: string; content?: string }) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content || "Hello" }]
            })),
            tools: [{ functionDeclarations: tools.map((t: any) => t.function) }],
            generationConfig: { 
              temperature: 0.7,
              topP: 0.95,
              topK: 40
            }
          }),
        }
      );
    }

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      // Handle rate limits
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API quota exceeded. Please check your plan." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `AI API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the response with SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let toolCalls: any[] = [];
        let currentToolCall: any = null;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (let line of lines) {
              line = line.trim();
              if (!line || line.startsWith(':')) continue;
              if (!line.startsWith('data: ')) continue;

              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                
                if (isLovableAI) {
                  // OpenAI-compatible format from Lovable AI
                  const choice = parsed.choices?.[0];
                  const delta = choice?.delta;
                  
                  if (delta?.content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', delta: delta.content })}\n\n`));
                  }
                  
                  // Handle tool calls
                  if (delta?.tool_calls) {
                    for (const tc of delta.tool_calls) {
                      if (tc.function?.name) {
                        currentToolCall = { function: { name: tc.function.name, arguments: '' } };
                      }
                      if (tc.function?.arguments && currentToolCall) {
                        currentToolCall.function.arguments += tc.function.arguments;
                      }
                    }
                  }
                  
                  // Check if this is the final chunk with complete tool call
                  if (choice?.finish_reason === 'tool_calls' && currentToolCall) {
                    toolCalls.push(currentToolCall);
                    currentToolCall = null;
                  }
                } else {
                  // Gemini streaming format: { candidates: [{ content: { parts: [{ text, functionCall }] } }] }
                  const candidate = parsed.candidates?.[0];
                  const parts = candidate?.content?.parts || [];

                  for (const part of parts) {
                    // Handle text content
                    if (part.text) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', delta: part.text })}\n\n`));
                    }

                    // Handle function calls
                    if (part.functionCall) {
                      toolCalls.push({
                        function: {
                          name: part.functionCall.name,
                          arguments: JSON.stringify(part.functionCall.args || {})
                        }
                      });
                    }
                  }
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }

          // Execute tool calls if any
          if (toolCalls.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tool_start' })}\n\n`));

            for (const toolCall of toolCalls) {
              const args = JSON.parse(toolCall.function.arguments);

              if (toolCall.function.name === 'search_wikipedia') {
                const result = await searchWikipedia(args.query);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tool_result', tool: 'search_wikipedia', result })}\n\n`));
              } else if (toolCall.function.name === 'play_music') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'play_music', song: args.song })}\n\n`));
              } else if (toolCall.function.name === 'launch_game') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'launch_game', game: args.game })}\n\n`));
              } else if (toolCall.function.name === 'execute_python_file') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'execute_python', file_path: args.file_path })}\n\n`));
              } else if (toolCall.function.name === 'execute_cmd_command') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'execute_cmd', command: args.command })}\n\n`));
              } else if (toolCall.function.name === 'create_coding_project') {
                // The backend can't create files on the user's PC directly.
                // We ask the model to generate a file-map (JSON) and send it to the client to write via PC Bridge.
                const files = await generateProjectFiles({
                  project_type: args.project_type || 'html',
                  description: args.description,
                });
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'create_project',
                      project_path: args.project_path,
                      files,
                    })}\n\n`
                  )
                );
              } else if (toolCall.function.name === 'create_powerpoint') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'create_powerpoint', file_path: args.file_path, title: args.title, slides: args.slides, theme: args.theme || 'professional' })}\n\n`));
              } else if (toolCall.function.name === 'create_excel') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'create_excel', file_path: args.file_path, sheet_name: args.sheet_name, headers: args.headers, data: args.data, formatting: args.formatting })}\n\n`));
              } else if (toolCall.function.name === 'create_database') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'create_database', file_path: args.file_path, db_type: args.db_type, tables: args.tables })}\n\n`));
              } else if (toolCall.function.name === 'check_software') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'check_software', software: args.software })}\n\n`));
              } else if (toolCall.function.name === 'system_power_command') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'system_power', action: args.action })}\n\n`));
              } else if (toolCall.function.name === 'adb_connect') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'adb_connect', ip_address: args.ip_address || '' })}\n\n`));
              } else if (toolCall.function.name === 'adb_command') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'adb_command', command: args.command })}\n\n`));
              } else if (toolCall.function.name === 'capture_screenshot') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'capture_screenshot',
                  delay_seconds: args.delay_seconds || 0,
                  save_path: args.save_path || 'C:\\Users\\Mohd Eisa\\Pictures\\Screenshots'
                })}\n\n`));
              } else if (toolCall.function.name === 'close_window') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'close_window', window_name: args.window_name })}\n\n`));
              } else if (toolCall.function.name === 'run_application') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'run_application', command: args.command })}\n\n`));
              }
            }

            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          } else {
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Stream error' })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
