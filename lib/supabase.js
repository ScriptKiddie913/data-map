import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjhqpefqmvcnlierfwvz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqaHFwZWZxbXZjbmxpZXJmd3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDUzNzIsImV4cCI6MjA4Nzc4MTM3Mn0.bG_x3zw2iNNn3-UYvS9C0hk5R9iHP2JYRmOeRwdhGSk' 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
