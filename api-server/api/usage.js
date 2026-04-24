// Usage tracking endpoint - records device usage for abuse prevention
// In production, this would write to Supabase

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { deviceId, minutesUsed, event } = req.body ?? {};

  if (!deviceId || !event) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // TODO: Write to Supabase
  // await supabase.from('usage_logs').insert({ device_id: deviceId, event, minutes_used: minutesUsed, created_at: new Date() })

  return res.status(200).json({ success: true });
};
