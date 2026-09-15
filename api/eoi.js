const crypto = require('crypto');

const ALLOWED_SECTIONS = {
  WA: 'Western Australia',
  SA_NT: 'SA / NT',
  QLD: 'Queensland',
  NSW: 'New South Wales',
  VIC: 'Victoria',
  TAS: 'Tasmania'
};

const MAX = {
  fullName: 200,
  email: 320,
  phone: 100,
  role: 200,
  stateId: 20,
  sourceUrl: 1000,
  website: 200,
  userAgent: 1000,
  clientId: 100
};

function sendJson(res, status, body) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function clean(value, max) {
  if (value === null || value === undefined) return '';
  return String(value).trim().slice(0, max);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return sendJson(res, 400, { ok: false, error: 'Invalid request.' });
      }
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return sendJson(res, 400, { ok: false, error: 'Invalid request.' });
    }

    // Existing honeypot. Bots that populate this field get a harmless success response
    // without creating a database record.
    const website = clean(body.website, MAX.website);
    if (website) return sendJson(res, 200, { ok: true });

    const fullName = clean(body.fullName, MAX.fullName);
    const email = clean(body.email, MAX.email).toLowerCase();
    const phone = clean(body.phone, MAX.phone);
    const role = clean(body.role, MAX.role);
    const stateId = clean(body.stateId, MAX.stateId);
    const sourceUrl = clean(body.sourceUrl, MAX.sourceUrl);
    const stateName = ALLOWED_SECTIONS[stateId];

    if (!fullName || !validEmail(email) || !role || !stateName) {
      return sendJson(res, 400, {
        ok: false,
        error: 'Please complete your full name, email address and preferred role.'
      });
    }

    const supabaseUrl = 'https://pzpymyhudenvdfvqkebg.supabase.co';
    const supabaseSecretKey = clean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY, 2000);
    const clientId = clean(process.env.RFDS_EOI_CLIENT_ID || 'RFDS-CAREERS-CONFERENCE-2026', MAX.clientId);

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error('EOI backend missing SUPABASE_SECRET_KEY');
      return sendJson(res, 500, {
        ok: false,
        error: 'Submission service is not configured.'
      });
    }

    // The existing table uses text IDs, so generate them here.
    const record = {
      id: crypto.randomUUID(),
      client_id: clientId,
      submitted_at: new Date().toISOString(),
      full_name: fullName,
      email,
      phone: phone || null,
      role,
      state_id: stateId,
      state_name: stateName,
      source_url: sourceUrl || null,
      user_agent: clean(req.headers['user-agent'], MAX.userAgent) || null
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/pin_to_win_eois`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': supabaseSecretKey,
        'Authorization': `Bearer ${supabaseSecretKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(record)
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      console.error('Supabase insert failed:', response.status, details);
      return sendJson(res, 502, {
        ok: false,
        error: 'We could not save your details. Please try again.'
      });
    }

    return sendJson(res, 200, { ok: true, id: record.id });
  } catch (error) {
    console.error('EOI backend error:', error);
    return sendJson(res, 500, {
      ok: false,
      error: 'We could not save your details. Please try again.'
    });
  }
};
