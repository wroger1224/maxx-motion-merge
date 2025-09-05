 // @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let email
  try {
    const body = await req.json()
    email = body.email
    if (!email) throw new Error('Missing email')
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON or missing email' }), { status: 400, headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Query the user by email in the auth.users table
  const { data: users, error: fetchError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500, headers: corsHeaders })
  }
  if (!users || users.length === 0) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: corsHeaders })
  }

  const userId = users[0].id

  // Delete the user from Auth
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ message: 'User deleted' }), { status: 200, headers: corsHeaders })
})