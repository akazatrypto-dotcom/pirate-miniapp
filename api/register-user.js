import { createClient } from '@supabase/supabase-js';

// ⚠️ تأكد أن المتغيرات موجودة في Vercel Environment Variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { telegram_id, username } = req.body;

  if (!telegram_id) {
    return res.status(400).json({ error: 'telegram_id is required' });
  }

  try {
    // تحقق إذا المستخدم موجود بالفعل في جدول Users
    const { data, error } = await supabase
      .from('Users')  // ← تم تعديل الاسم ليناسب جدولك
      .select('*')
      .eq('telegram_id', telegram_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      // المستخدم غير موجود → أضفه
      const { error: insertError } = await supabase
        .from('Users')  // ← تم تعديل الاسم هنا أيضًا
        .insert([
          {
            telegram_id,
            username,
            points: 0,
            ton_balance: 0,
          },
        ]);

      if (insertError) {
        return res.status(500).json({ error: insertError.message });
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
