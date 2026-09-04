async function testVercelWebhook() {
  const payload = {
    event: 'transcript.data',
    data: {
      bot_id: 'd9ba1e80-68e7-48b0-8d61-5a913187f391',
      transcript: {
        speaker: 'Praneeth',
        text: 'What are the main features of DealFlow AI?',
        is_final: true,
      },
    },
  };

  const secret = process.env.RECALL_WEBHOOK_SECRET || '';
  const res = await fetch('https://dealsflowai.vercel.app/api/meeting/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { 'X-Webhook-Secret': secret } : {}),
    },
    body: JSON.stringify(payload),
  });

  console.log('Webhook Response Status:', res.status);
  const text = await res.text();
  console.log('Webhook Response Body:', text);
}

testVercelWebhook().catch(console.error);
