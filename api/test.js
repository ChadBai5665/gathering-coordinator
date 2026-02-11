export default function handler(req, res) {
  res.json({ 
    success: true, 
    message: 'API is working',
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      nodeVersion: process.version
    }
  });
}
