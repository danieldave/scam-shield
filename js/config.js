/* =====================================================================
   Scam Shield - site settings
   ---------------------------------------------------------------------
   AI HELPER
   The Verify page always gives the OFFLINE result first (our own red-flag
   list). Then, if "enabled" is true and the internet is on, it asks the AI
   helper in /api/check for a second opinion.

   The OpenAI key is NOT here. It lives on Vercel as OPENAI_API_KEY.
   NEVER paste a key into this file: anyone can read website files.
   ===================================================================== */
window.SS_CONFIG = {
  ai: {
    enabled: true,
    checkEndpoint: '/api/check',
    askEndpoint: '/api/ask',
    timeoutMs: 25000
  }
};
