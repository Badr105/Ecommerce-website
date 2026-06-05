require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Normal JSON body parsing for /pay
app.use(express.json());
// parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// POST /pay: build payload and return payload + signature + paywallUrl
app.post('/pay', (req, res) => {
  try {
    const { items = [], total = 0, customerId, orderId } = req.body || {};

    const payload = {
      merchantAccount: process.env.MERCHANT_ACCOUNT || 'Test',
      timestamp: Math.floor(Date.now() / 1000),
      skin: process.env.SKIN || 'vps-1-vue',
      // Customer parameters
      customerId: customerId || 'payplus-paywall-poc',
      customerLocale: 'en_US',
      chargeId: String(Math.floor(Date.now() / 1000)),
      orderId: orderId || `order-${Date.now()}`,
      price: String(Number(total || 0).toFixed(2)),
      currency: process.env.CURRENCY || 'MAD',
      description: 'Order from test_web',
      mode: 'DEEP_LINK',
      paymentMethod: 'CREDIT_CARD',
      showPaymentProfiles: false,
      callbackUrl: process.env.CALLBACK_URL || '',
      successUrl: process.env.SUCCESS_URL || '',
      failureUrl: process.env.FAILURE_URL || '',
      cancelUrl: process.env.CANCEL_URL || ''
    };

    const jsonPayload = JSON.stringify(payload);
    const paywallSecretKey = process.env.PAYWALL_SECRET_KEY || '';
    const signature = crypto.createHash('sha256').update(paywallSecretKey + jsonPayload).digest('hex');

    // Use provided PAYWALL_URL or fall back to a local mock endpoint for testing
    let paywallUrl = process.env.PAYWALL_URL && process.env.PAYWALL_URL.indexOf('test-paywall.url.ma') === -1
      ? process.env.PAYWALL_URL
      : `${req.protocol}://${req.get('host')}/mock-paywall`;

    res.json({ payload: jsonPayload, signature, paywallUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// POST /callback - receive raw body to validate HMAC signature
app.post('/callback', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const input = req.body; // Buffer
    const notificationKey = process.env.NOTIFICATION_KEY || '';
    const signature = crypto.createHmac('sha256', notificationKey).update(input).digest('hex');
    const callbackSignature = (req.headers['x-callback-signature'] || '').toString();

    if (signature.toLowerCase() === callbackSignature.toLowerCase()) {
      console.log('Notification validated successfully');
      // Here you would process the notification payload (JSON.parse(input))
      res.status(200).send('Notification processed');
    } else {
      console.log('Invalid signature');
      res.status(400).send('Invalid signature');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Local mock paywall endpoint to receive form POSTs for testing
app.post('/mock-paywall', (req, res) => {
  // payload and signature will come as form fields
  const { payload, signature } = req.body || {};
  let parsed = null;
  try {
    parsed = payload ? JSON.parse(payload) : null;
  } catch (e) {
    parsed = null;
  }

  res.send(`
    <html><head><title>Mock Paywall</title></head><body>
      <h1>Mock Paywall Received</h1>
      <h2>Signature</h2>
      <pre>${signature || ''}</pre>
      <h2>Payload (raw)</h2>
      <pre>${payload || ''}</pre>
      <h2>Payload (parsed)</h2>
      <pre>${JSON.stringify(parsed, null, 2)}</pre>
      <p><a href="/">Back</a></p>
    </body></html>
  `);
});

// Serve public static files (Vite serves frontend during dev, but this helps when previewing server)
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
