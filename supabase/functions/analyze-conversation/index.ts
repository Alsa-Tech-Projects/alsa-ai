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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Prepare conversation summary for analysis
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
${conversationText.slice(0, 4000)}`; // Limit to avoid token limits

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.6-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Analyze this conversation and suggest relevant tags.' }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_tags",
              description: "Return 3-5 relevant tags for the conversation.",
              parameters: {
                type: "object",
                properties: {
                  tags: {
                    type: "array",
                    items: {
                      type: "string"
                    },
                    minItems: 3,
                    maxItems: 5
                  }
                },
                required: ["tags"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_tags" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error('Failed to analyze conversation');
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data, null, 2));

    // Extract tags from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'suggest_tags') {
      throw new Error('Invalid response format from AI');
    }

    const tags = JSON.parse(toolCall.function.arguments).tags;

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