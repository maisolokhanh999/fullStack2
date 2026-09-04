const sendResendEmail = async ({ to, subject, text }) => {
  if (!process.env.RESEND_API_KEY || !to) return { sent: false, provider: "resend" };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.NOTIFICATION_FROM_EMAIL,
      to: [to],
      subject,
      text,
    }),
  });

  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
  return { sent: true, provider: "resend" };
};

const sendTwilioSms = async ({ to, text }) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER || !to) {
    return { sent: false, provider: "twilio" };
  }

  const body = new URLSearchParams({ To: to, From: TWILIO_FROM_NUMBER, Body: text });
  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    { method: "POST", headers: { Authorization: `Basic ${credentials}` }, body },
  );

  if (!response.ok) throw new Error(`SMS provider returned ${response.status}`);
  return { sent: true, provider: "twilio" };
};

export const notifyReservationCreated = async ({ email, phone, reservationCode, checkInTime }) => {
  const text = `Đặt bàn ${reservationCode} đã được tiếp nhận. Thời gian dự kiến: ${checkInTime}.`;
  const results = await Promise.allSettled([
    sendResendEmail({ to: email, subject: `Xác nhận đặt bàn ${reservationCode}`, text }),
    sendTwilioSms({ to: phone, text }),
  ]);

  return results.map((result) => (result.status === "fulfilled" ? result.value : { sent: false, error: result.reason.message }));
};