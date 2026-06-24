/* TPC — Backend interface (data-access adapter)   [WS1]
 * -----------------------------------------------------------------------------
 * The app/prototype calls THIS, never storage directly (docs/ARCHITECTURE.md §0).
 *   - If TPC_CONFIG.apiUrl is set → "SheetsBackend": calls the Cloud Run API
 *     (cloud-run/server.js) → live Questions, Customers, and Results workbooks.
 *   - Else → offline no-op stubs; the prototype keeps using localStorage as before.
 * Swapping to FirestoreBackend/SupabaseBackend later = replace this file only.
 *
 * POST keeps text/plain for compatibility with the first prototype backend; Cloud
 * Run also supports proper CORS preflight.
 */
window.TPC = window.TPC || {};
(function () {
  var cfg = window.TPC_CONFIG || {};
  var API = cfg.apiUrl || "";
  var live = !!API;

  function get(action, params) {
    var qs = Object.keys(params || {})
      .map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); }).join("&");
    return fetch(API + (API.indexOf("?") < 0 ? "?" : "&") + "action=" + action + (qs ? "&" + qs : ""))
      .then(unwrap);
  }
  function post(action, payload) {
    return fetch(API, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: action, payload: payload })
    }).then(unwrap);
  }
  function unwrap(r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json().then(function (j) { if (!j.ok) throw new Error(j.error || "api error"); return j.data; });
  }
  // Live calls are best-effort: a failure must never break the prototype UI.
  function safe(promise, fallback) {
    return promise.catch(function (e) {
      console.warn("[backend] live call failed, continuing —", e.message);
      return fallback;
    });
  }

  window.TPC.backend = {
    live: live,

    // reads
    getQuestionSet:  function (setId) { return live ? safe(get("getQuestionSet", { setId: setId }), null) : Promise.resolve(null); },
    listQuestions:   function (filter) { return live ? safe(get("listQuestions", filter || {}), []) : Promise.resolve([]); },
    getUser:         function (p)   { return live ? safe(get("getUser", p), null) : Promise.resolve(null); },
    listUserHistory: function (uid) { return live ? safe(get("listUserHistory", { uid: uid }), null) : Promise.resolve(null); },
    listBookmarks:   function (uid) { return live ? safe(get("listBookmarks", { uid: uid }), []) : Promise.resolve([]); },
    listNotifications:function (uid){ return live ? safe(get("listNotifications", { uid: uid }), []) : Promise.resolve([]); },

    // writes
    upsertUser:      function (u)   { return live ? safe(post("upsertUser", u), u) : Promise.resolve(u); },
    saveSession:     function (session, attempts) {
      return live ? safe(post("saveSession", { session: session, attempts: attempts }), null) : Promise.resolve(null);
    },
    addBookmark:     function (uid, ref) {
      return live ? safe(post("addBookmark", { uid: uid, refType: ref.refType, refId: ref.refId, note: ref.note }), null)
                  : Promise.resolve(null);
    }
  };
})();
