
// Verifies a real Stripe Checkout Session server-side, using the secret key (which never touches the
// browser). This is the actual fix for the vulnerability: the tier and paid status are read from
// Stripe's own records for this exact session ID, not trusted from anything in the URL. A session ID
// is a long, unique, unguessable identifier Stripe generates only when a real Checkout Session is
// created — nobody can just make one up or reuse someone else's the way they could with ?paid=true.
exports.handler = async function (event) {
  const sessionId = event.queryStringParameters && event.queryStringParameters.session_id;

  if (!sessionId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: false, error: "Missing session_id" }),
    };
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: false, error: "Server not configured" }),
    };
  }

  try {
    const stripeRes = await fetch(
      "https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(sessionId),
      { headers: { Authorization: "Bearer " + secretKey } }
    );

    if (!stripeRes.ok) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: false }),
      };
    }

    const session = await stripeRes.json();

    const actuallyPaid = session.payment_status === "paid" || session.status === "complete";
    if (!actuallyPaid) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: false }),
      };
    }

    const tier = session.mode === "subscription" ? "monthly" : "single";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: true, tier: tier }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: false, error: "Verification request failed" }),
    };
  }
};
