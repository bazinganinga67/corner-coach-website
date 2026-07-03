import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export default async function handler(
  req: { method: string; body: { email?: string } },
  res: {
    status: (code: number) => {
      json: (data: Record<string, unknown>) => void;
    };
  },
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    await resend.emails.send({
      from: 'Corner Coach <onboarding@resend.dev>',
      to: email,
      subject: "You're on the list — Corner Coach",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#050506;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050506;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">
          <tr>
            <td style="padding:32px 32px 0 32px;text-align:center">
              <span style="font-size:28px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;font-family:'Inter Tight',-apple-system,sans-serif">
                CORNER<span style="color:#FF2E3E">COACH</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px 32px 32px;background:#0b0b0e;border-radius:16px;border:1px solid rgba(255,255,255,0.08)">
              <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;font-family:'Inter Tight',-apple-system,sans-serif">
                You're on the list.
              </h1>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#8A8F9C">
                Thanks for signing up, <strong style="color:#ffffff">${email}</strong>. We'll send you one email — the day Corner Coach lands on the App Store. Nothing else, ever.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:16px 0;border-top:1px solid rgba(255,255,255,0.06)">
                    <p style="margin:0;font-size:13px;color:#5A5F6C">
                      No spam. No newsletters. Just the one email when it's real.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;text-align:center">
              <p style="margin:0;font-size:12px;color:#3A3F4C">
                Corner Coach &bull; Voice-led shadowboxing
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    console.log(`[Waitlist] Confirmed ${email}`);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Waitlist] Error:', error);
    return res.status(500).json({ error: 'Failed to send confirmation' });
  }
}
