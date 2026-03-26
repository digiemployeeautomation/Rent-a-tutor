import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.https://sasfhopjvpoklsaptbej.supabase.co
const supabaseAnonKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhc2Zob3BqdnBva2xzYXB0YmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDQ0ODYsImV4cCI6MjA5MDAyMDQ4Nn0.IJT7e5CR5OkRvoCDzQBNTB-FjUUXmEeQ3wSw0sXNEn0

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
