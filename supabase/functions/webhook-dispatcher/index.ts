// @ts-expect-error: Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-expect-error: Deno imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Vérification de l'authentification (Protection SSRF)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // @ts-expect-error: Deno is available in Edge Functions
    const supabaseClient = createClient(
      // @ts-expect-error: Deno env
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-expect-error: Deno env
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Traitement de la requête
    const { event, task, webhookUrl } = await req.json()

    if (!webhookUrl || !task) {
      return new Response(
        JSON.stringify({ error: 'Missing webhookUrl or task payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Optionnel : on pourrait ajouter une validation du format de webhookUrl ici (ex: doit commencer par https://)
    if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhookUrl protocol' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      app: 'UrsUle',
      task
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Target responded with status: ${response.status}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook dispatched successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
