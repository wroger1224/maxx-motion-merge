import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Resend with API key
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    // Get the request body
    const body = await req.json()
    console.log('Received request body:', JSON.stringify(body))

    const { email, signInUrl } = body

    if (!email || !signInUrl) {
      throw new Error('Email and sign-in URL are required')
    }

    // Send the invitation email using Resend
    const { data, error } = await resend.emails.send({
      from: Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@maxxmotion.xyz',
      to: [email],
      subject: 'You\'re invited! 🎯',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 400px; margin: 40px auto; text-align: center;">
          <h2 style="color: #333; margin-bottom: 20px;">Ready to move? 🚀</h2>
          <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
            Someone challenged you to join the fun!
          </p>
          <a href="${signInUrl}" style="display: inline-block; padding: 14px 32px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Join Now
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            <a href="https://www.maxxmotion.xyz" style="color: #667eea; text-decoration: none;">maxxmotion.xyz</a>
          </p>
        </div>
      `
    })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ message: 'Invitation email sent successfully', id: data?.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 