// src/lib/supabaseClient.js
// ----------------------------------------------------------
// Replace the two placeholder values below with your actual
// Supabase project URL and anon key.
//
// Find them at:
//   Supabase Dashboard → Project Settings → API
// ----------------------------------------------------------

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);