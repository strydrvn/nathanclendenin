// Cloudflare Pages Function — POST /api/contact
// Receives the family portraits booking form, emails via Resend.
// Set RESEND_API_KEY secret via Cloudflare dashboard or:
//   npx wrangler pages secret put RESEND_API_KEY --project-name=familyportraits
export async function onRequestPost({ request, env }) {
  let form;
  try { form = await request.formData(); } catch {
    return json({ ok: false, error: 'Could not read form data' }, 400);
  }

  const name    = (form.get('name')    || '').toString().trim();
  const email   = (form.get('email')   || '').toString().trim();
  const phone   = (form.get('phone')   || '').toString().trim();
  const message = (form.get('message') || '').toString().trim();

  if (!name || !email || !message) {
    return json({ ok: false, error: 'Name, email, and message are required.' }, 400);
  }

  if (env.TURNSTILE_SECRET_KEY) {
    const tsToken = (form.get('cf-turnstile-response') || '').toString();
    if (!tsToken) return json({ ok: false, error: 'Human verification missing — please reload and try again.' }, 400);
    const tsResp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: tsToken,
        remoteip: request.headers.get('CF-Connecting-IP') || '',
      }),
    });
    const tsData = await tsResp.json().catch(() => ({ success: false }));
    if (!tsData.success) return json({ ok: false, error: 'Human verification failed — please reload and try again.' }, 400);
  }

  const replyTo = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null;

  const fields = [
    ['Name',    name],
    ['Email',   email],
    ...(phone ? [['Phone', phone]] : []),
    ['Message', message],
  ];

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rows = fields.map(([l, v]) =>
    `<tr><td style="padding:8px 16px 8px 0;color:#6b7280;font-weight:600;vertical-align:top;white-space:nowrap;">${esc(l)}</td>`
    + `<td style="padding:8px 0;color:#111827;white-space:pre-wrap;">${esc(v)}</td></tr>`).join('');

  const textBody = 'New family portrait inquiry — familyportraits.nathanclendenin.com\n\n'
    + fields.map(([l, v]) => `${l}: ${v}`).join('\n');
  const htmlBody = '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#111827;">'
    + '<h2 style="margin:0 0 2px;font-size:18px;">New family portrait inquiry</h2>'
    + '<p style="margin:0 0 16px;color:#6b7280;font-size:13px;">familyportraits.nathanclendenin.com</p>'
    + `<table style="border-collapse:collapse;font-size:15px;">${rows}</table></div>`;

  if (!env.RESEND_API_KEY || !env.CONTACT_TO) return json({ ok: false, error: 'Email not configured.' }, 500);

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    env.CONTACT_FROM || 'Family Portraits <onboarding@resend.dev>',
      to:      [env.CONTACT_TO],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: `Family portrait inquiry from ${name}`,
      text:    textBody,
      html:    htmlBody,
    }),
  });

  if (!resp.ok) return json({ ok: false, error: 'Email send failed.' }, 502);
  return json({ ok: true });
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
