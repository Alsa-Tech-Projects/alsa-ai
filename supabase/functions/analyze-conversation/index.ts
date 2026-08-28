import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationTitle } = await req.json();
    
    // Updated: GEMINI Secret Key fetch karna
    const GEMINI_API_KEY = Deno.env.get('CONVERSATIONS_GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('CONVERSATIONS_GEMINI_API_KEY not configured');
    }

    const conversationText = messages
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const systemPrompt = `You are a conversation analyzer. Analyze the following conversation and suggest 3-5 relevant tags that categorize the main topics discussed. 

Tags should be:
- Short (1-2 words)
- Descriptive of the main topics
- Lowercase
- Common categories like: work, personal, code, debugging, design, data, ai, learning, planning, creative, productivity, entertainment, health, finance, travel, education, technology, business, etc.

Conversation Title: ${conversationTitle}

Conversation:
${conversationText.slice(0, 4000)}`;

    // Updated: Direct Google Gemini REST API (gemini-1.5-flash) Endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nAnalyze this conversation and suggest relevant tags.` }] }
        ],
        tools: [
          {
            functionDeclarations: [
              {
                name: "suggest_tags",
                description: "Return 3-5 relevant tags for the conversation.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    tags: {
                      type: "ARRAY",
                      items: { type: "STRING" },
                      description: "List of 3-5 tag names"
                    }
                  },
                  required: ["tags"]
                }
              }
            ]
          }
        ],
        toolConfig: {
          functionCallingConfig: {
            mode: "ANY",
            allowedFunctionNames: ["suggest_tags"]
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error('Failed to analyze conversation with Gemini API');
    }

    const data = await response.json();
    console.log('Gemini Response:', JSON.stringify(data, null, 2));

    // Updated: Gemini Function Call output parse karna
    const candidate = data.candidates?.[0];
    const functionCall = candidate?.content?.parts?.find((part: any) => part.functionCall)?.functionCall;

    if (!functionCall || functionCall.name !== 'suggest_tags') {
      throw new Error('Invalid response format from Gemini API');
    }

    const tags = functionCall.args?.tags;

    return new Response(
      JSON.stringify({ tags }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing conversation:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to analyze conversation' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});