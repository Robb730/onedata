// src/lib/supabaseClient.js
// ----------------------------------------------------------
// Replace the two placeholder values below with your actual
// Supabase project URL and anon key.
//
// Find them at:
//   Supabase Dashboard → Project Settings → API
// ----------------------------------------------------------

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kkwaxnahdltcpxjgltlh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_KZCPKA1uTHn4q2HP5wEBcw_dFX8KFHQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);