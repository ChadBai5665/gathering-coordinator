export default function handler(req, res) {
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  res.json({ 
    hasKey: !!anonKey,
    keyLength: anonKey.length,
    keyPrefix: anonKey.substring(0, 20),
    keySuffix: anonKey.substring(anonKey.length - 20)
  });
}
