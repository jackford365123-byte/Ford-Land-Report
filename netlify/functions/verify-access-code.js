// Verifies an access code server-side, so the actual code VALUES never appear in the page's client-side
// source at all. Before this, every code (including the owner's personal unlimited-access code) sat in
// plain, readable text in the HTML/JS anyone could see via "View Page Source" - a completely normal,
// one-click action, not a sophisticated attack. Moving the actual code strings here means someone would
// need real access to this codebase (GitHub/Netlify account) to see them, not just a browser.
//
// The owner code specifically is stored as an environment variable (OWNER_ACCESS_CODE) for the extra
// layer that gives - the most sensitive one, since it grants permanent free full access. The other codes
// (demo/testing, customer-service) are defined below in this file instead of an env var per code, which
// would add real setup friction for codes that are inherently meant to be shared with other people
// anyway (a demo code you use yourself, or a code you hand to a specific customer) - still a large
// security improvement over client-side exposure, just not quite as tightly locked down as the owner's.
//
// To add/change/remove a customer-service or demo code: edit the ACCESS_CODES object below and redeploy
// (through GitHub, same as any other change) - these are NOT env vars, they live in this file.
const ACCESS_CODES = {
  "solo19-demo": { tier: "single", brokerName: null },
  "unlimited39-demo": { tier: "monthly", brokerName: null },
  "GrA3O47q8pQx5JNC": { tier: "single", brokerName: null },
  "IaQOSGiKsFVt9OrA": { tier: "monthly", brokerName: null },
};

exports.handler = async function (event) {
  let code;
  try {
    code = JSON.parse(event.body || "{}").code;
  } catch (e) {
    code = null;
  }

  if (!code || typeof code !== "string") {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valid: false, error: "Missing code" }),
    };
  }

  const trimmed = code.trim();

  const ownerCode = process.env.OWNER_ACCESS_CODE;
  if (ownerCode && trimmed === ownerCode) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valid: true, tier: "monthly", brokerName: null, isOwner: true }),
    };
  }

  const entry = ACCESS_CODES[trimmed];
  if (entry) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valid: true, tier: entry.tier, brokerName: entry.brokerName, isOwner: false }),
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valid: false }),
  };
};
