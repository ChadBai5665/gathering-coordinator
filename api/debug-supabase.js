export default function handler(req, res) {
  res.json({ 
    url: process.env.SUPABASE_URL,
    hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKeyLength: (process.env.SUPABASE_ANON_KEY || '').length
  });
}
