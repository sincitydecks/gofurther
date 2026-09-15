const ALLOWED_SECTIONS = {
  WA: 'Western Australia',
  SA_NT: 'SA / NT',
  QLD: 'Queensland',
  NSW: 'New South Wales',
  VIC: 'Victoria',
  TAS: 'Tasmania'
};

function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function clean(value, max = 2000) {
  return String(value ?? '').trim().slice(0, max);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

module.exports = async function handler(req, res) {
  // This endpoint is intended to be called by the same-origin conference site.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    if (!body || typeof body !== 'object') {
      return sendJson(res, 400, { ok: false, error: 'Invalid request.' });
    }

    // Existing honeypot field. Bots get a successful-looking response but no row is stored.
    if (clean(body.website, 200)) {
      return sendJson(res, 200, { ok: true });
    }

    const firstName = clean(body.firstName, 100);
    const lastName = clean(body.lastName, 100);
    const email = clean(body.email, 320).toLowerCase();
    const phone = clean(body.phone, 100);
    const role = clean(body.role, 200);
    const why = clean(body.why, 5000);
    const stateId = clean(body.stateId, 20);
    const sourceUrl = clean(body.sourceUrl, 1000);

    if (!firstName || !lastName || !validEmail(email) || !role || !ALLOWED_SECTIONS[stateId]) {
      return sendJson(res, 400, {
        ok: false,
        error: 'Please complete your name, email address and preferred role.'
      });
    }

    const whyWords = why ? why.split(/\s+/).filter(Boolean) : [];
    if (whyWords.length > 100) {
      return sendJson(res, 400, {
        ok: false,
        error: 'Please keep your response to 100 words or fewer.'
      });
    }

    const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error('EOI backend is missing SUPABASE_URL or SUPABASE_SECRET_KEY');
      return sendJson(res, 500, { ok: false, error: 'Submission service is not configured.' });
    }

    const record = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      role,
      why: why || null,
      state_id: stateId,
      state_name: ALLOWED_SECTIONS[stateId],
      source_url: sourceUrl || null,
      user_agent: clean(req.headers['user-agent'], 1000) || null
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/rfds_eois`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': supabaseSecretKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(record)
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      console.error('Supabase insert failed:', response.status, details);
      return sendJson(res, 502, { ok: false, error: 'We could not save your details. Please try again.' });
    }

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('EOI backend error:', error);
    return sendJson(res, 500, { ok: false, error: 'We could not save your details. Please try again.' });
  }
};
