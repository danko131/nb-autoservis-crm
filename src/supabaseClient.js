import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://suqhnkkikuqduakwdbls.supabase.co'
const supabaseAnonKey = 'sb_publishable_lNUYl8vveo7-gTbrE3gGxg_OJ-xyPVJ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
