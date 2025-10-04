import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PromptRequest {
  question: string;
  goals?: string[];
  context?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.subscription_tier !== 'premium') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI prompts are a premium feature',
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { question, goals, context }: PromptRequest = await req.json();

    const systemPrompt = `You are a thoughtful money mindset coach helping users reflect on their financial journey.
Generate a single insightful reflection prompt based on the user's question and context.
The prompt should be personal, thought-provoking, and encourage self-awareness about money habits and beliefs.
Keep the response to 1-2 sentences maximum.`;

    let userPrompt = `User's question: ${question}`;
    if (goals && goals.length > 0) {
      userPrompt += `\nTheir financial goals: ${goals.join(', ')}`;
    }
    if (context) {
      userPrompt += `\nAdditional context: ${context}`;
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 100,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error('OpenAI API request failed');
    }

    const openaiData = await openaiResponse.json();
    const aiPrompt = openaiData.choices[0]?.message?.content?.trim();

    if (!aiPrompt) {
      throw new Error('No response from AI');
    }

    await supabase.from('ai_prompt_history').insert({
      user_id: user.id,
      question_asked: question,
      ai_response: aiPrompt,
    });

    return new Response(
      JSON.stringify({
        success: true,
        prompt: aiPrompt,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in generate-ai-prompt function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
