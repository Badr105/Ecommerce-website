const merchantAccount = "Test_integration";
const paywallSecretKey = "9uhPPPQH14ThccEn";
const payload = {
    // Authentication parameters
    merchantAccount: merchantAccount,
    timestamp: Math.floor(Date.now() / 1000),
    skin: "vps-1-vue",
    // Customer parameters
    customerId: "payplus-paywall-poc", // must be unique for each custumer
    customerCountry: "MA",
    customerLocale: "en_US",
    chargeId: Math.floor(Date.now() / 1000), // Optional, if defined, it must be unique for each redirection to the payment page
    orderId: "order1", // Optional, to identify the cart
    price: "10",
    currency: "MAD",
    description: "A Big Hat",
    mode: "DEEP_LINK", // Fixed value
    paymentMethod: "CREDIT_CARD", // Fixed value
    showPaymentProfiles: false,
    callbackUrl: "https://test-merchant.ma/callback",
    successUrl: "https://test-merchant.ma/success",
    failureUrl: "https://test-merchant.ma/failure",
    cancelUrl: "https://test-merchant.ma/cancel",
};

const jsonPayload = JSON.stringify(payload);
const signature = crypto
.createHash("sha256")
.update(paywallSecretKey + jsonPayload)
.digest("hex");
res.json({ payload: jsonPayload, signature })