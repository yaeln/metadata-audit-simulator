// =====================================================================
// class_proxy_worker.js
// A tiny Cloudflare Worker that holds ONE billing-enabled Google API key
// so your students never need their own key (or their own billing).
//
// The app sends { model, api, prompt, code } here; this Worker adds the
// secret key and forwards the request to Google, then returns the image.
// The key stays on the server and is never exposed to students' browsers.
// ---------------------------------------------------------------------
//
// SETUP — no command line needed, all in the Cloudflare website:
//
// 1. Make a free account at  https://dash.cloudflare.com
// 2. Left menu: "Workers & Pages"  →  Create  →  Workers  →  "Start with Hello World"
//    →  give it a name (e.g. audit-proxy)  →  Deploy.
// 3. Click "Edit code", delete the sample, PASTE THIS WHOLE FILE, then Deploy.
// 4. Go to the Worker's  Settings  →  "Variables and Secrets"  →  add two:
//        Name: GEMINI_API_KEY   Value: <your billing-enabled Google key>   Type: Secret
//        Name: CLASS_CODE       Value: <a word you pick, e.g. esu2026>     Type: Secret
//    (Click "Encrypt"/Secret so they aren't shown in plain text. Then Deploy again.)
// 5. Copy the Worker URL — it looks like:
//        https://audit-proxy.YOURNAME.workers.dev
//    Give students that URL + the class code. That's all they type into the app.
//
// PROTECT YOUR SPEND: in Google Cloud, set a billing BUDGET + alert (e.g. $10)
// on the project that owns GEMINI_API_KEY. The CLASS_CODE keeps strangers out
// if the URL leaks; rotate it (and the key) after the workshop.
// =====================================================================

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405, cors);

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'Bad JSON request.' }, 400, cors); }

    const { model, api, prompt, code } = body || {};

    if (env.CLASS_CODE && code !== env.CLASS_CODE) {
      return json({ error: 'Wrong or missing class code.' }, 403, cors);
    }
    if (!model || !prompt) return json({ error: 'Missing model or prompt.' }, 400, cors);
    if (!env.GEMINI_API_KEY) return json({ error: 'Server is missing GEMINI_API_KEY — check Worker secrets.' }, 500, cors);

    try {
      let image;

      if (api === 'imagen') {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${env.GEMINI_API_KEY}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1 } }) }
        );
        const d = await r.json().catch(() => ({}));
        if (!r.ok || d.error) return json({ error: (d.error && d.error.message) || `Google error ${r.status}` }, r.status, cors);
        const b64 = d.predictions && d.predictions[0] && d.predictions[0].bytesBase64Encoded;
        if (!b64) {
          const p0 = (d.predictions && d.predictions[0]) || {};
          return json({ refusal: p0.raiFilteredReason || p0.raiReason || 'No image returned — model blocked/filtered this record (safety refusal).' }, 200, cors);
        }
        image = `data:image/png;base64,${b64}`;

      } else {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
            }) }
        );
        const d = await r.json().catch(() => ({}));
        if (!r.ok || d.error) return json({ error: (d.error && d.error.message) || `Google error ${r.status}` }, r.status, cors);
        const parts = (d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || [];
        const part = parts.find(p => (p.inlineData && p.inlineData.data) || (p.inline_data && p.inline_data.data));
        const inline = part && (part.inlineData || part.inline_data);
        if (!inline || !inline.data) {
          const cand = (d.candidates && d.candidates[0]) || {};
          const textOut = parts.map(p => p.text).filter(Boolean).join(' ').trim();
          const reason = (cand.finishReason && cand.finishReason !== 'STOP')
            ? `Blocked/refused (finishReason: ${cand.finishReason})`
            : (textOut ? `Text-only response: ${textOut.slice(0, 300)}` : 'No image returned (likely refusal).');
          return json({ refusal: reason }, 200, cors);
        }
        image = `data:${inline.mimeType || inline.mime_type || 'image/png'};base64,${inline.data}`;
      }

      return json({ image }, 200, cors);
    } catch (e) {
      return json({ error: String(e && e.message ? e.message : e) }, 500, cors);
    }
  }
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });
}
