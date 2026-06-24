/* TPC Practice — prototype (vanilla JS).
   Stand-ins for production: Google sign-in is simulated; data persists locally
   and is mirrored to the Cloud Run SheetsBackend when apiUrl is configured. */
(function () {
  "use strict";
  var app = document.getElementById("app");
  var LEVELS = ["K2", "K3", "P1", "P2", "P3", "P4", "P5", "P6"];
  var QS = [], SETS = [], HAS = {}, TOPICS_BY_LEVEL = {}, DATA_SOURCE = "bundled";
  function setData(questions, sets) {
    QS = questions || []; SETS = sets || []; HAS = {}; TOPICS_BY_LEVEL = {};
    QS.forEach(function (q) {
      HAS[q.level] = true;
      (TOPICS_BY_LEVEL[q.level] = TOPICS_BY_LEVEL[q.level] || {})[q.topic] = q.domain;
    });
  }

  // ---- state (localStorage) ----
  var KEY = "tpc_proto_v1";
  var S = load();
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function bi(s) { // split "中文 / English" stem into two lines
    var p = String(s).split(" / ");
    return p.length === 2 ? esc(p[0]) + "<br><span class='hint'>" + esc(p[1]) + "</span>" : esc(s);
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // ---- router ----
  function go(screen, ctx) { S._ctx = ctx || {}; render(screen); }
  function render(screen) {
    if (!S.user && screen !== "signin" && screen !== "setupAccount") return render("signin");
    ({ signin: signin, setupAccount: setupAccount, home: home, setup: setup, quiz: quiz, result: result, report: report, profile: profile }[screen] || home)();
    app.scrollTop = 0;
  }

  // ---- shared UI ----
  function bar(title, opts) {
    opts = opts || {};
    return '<div class="topbar">' +
      (opts.back ? '<button class="iconbtn" data-go="' + opts.back + '">‹</button>' : '') +
      (opts.avatar ? '<div class="avatar">' + esc(opts.avatar) + '</div>' : '') +
      '<div class="title">' + esc(title) + '</div>' +
      (opts.badge ? '<span class="badge">' + esc(opts.badge) + '</span>' : '') +
      (opts.right || '') + '</div>';
  }
  function bind() {
    app.querySelectorAll("[data-go]").forEach(function (el) {
      el.onclick = function () { go(el.getAttribute("data-go")); };
    });
  }

  // ---- 1. Sign in (simulated Google) ----
  function signin() {
    app.innerHTML =
      '<div class="screen center" style="justify-content:center;gap:20px">' +
      '<div class="spacer"></div>' +
      '<div class="bigstat" style="font-size:34px">▲ The Pyramid Challenge</div>' +
      '<div class="muted">香港兒童數學及運算邏輯挑戰賽<br>網上練習平台 (prototype)</div>' +
      '<div class="spacer"></div>' +
      '<button class="btn primary big" id="gsi"><span>使用 Google 登入<span class="sub">Sign in with Google</span></span></button>' +
      '<div class="note">原型示範：以 Google 登入為模擬。Prototype simulates Google sign-in.</div>' +
      '<div class="spacer"></div></div>';
    document.getElementById("gsi").onclick = function () {
      if (S.user) return go("home");
      go("setupAccount");
    };
  }

  // ---- 2. First-login setup (one email, one child, one level) ----
  function setupAccount() {
    var name = (S._draft && S._draft.name) || "";
    var lvl = (S._draft && S._draft.level) || "";
    app.innerHTML = bar("開始 Get started") +
      '<div class="screen">' +
      '<div class="label">學生姓名 Student name</div>' +
      '<input id="nm" value="' + esc(name) + '" placeholder="例：陳小明 / Chan Siu Ming" ' +
      'style="padding:14px;border-radius:12px;border:1.5px solid var(--line);font-size:16px;font-family:inherit">' +
      '<div class="label">年級 Year level（一個帳戶一個年級 · one level）</div>' +
      '<div class="chips" id="lvls">' + LEVELS.map(function (L) {
        var on = L === lvl ? " sel" : ""; var dim = HAS[L] ? "" : " ";
        return '<div class="chip' + on + '" data-l="' + L + '">' + L +
          (HAS[L] ? "" : "<span class='hint'> </span>") + '</div>';
      }).join("") + '</div>' +
      '<div class="hint">提示：此原型只有 K2 及 K3 題目。Only K2 & K3 have questions in this prototype.</div>' +
      '<div class="spacer"></div>' +
      '<button class="btn primary" id="done">完成 Continue</button></div>';
    S._draft = S._draft || {};
    app.querySelector("#nm").oninput = function (e) { S._draft.name = e.target.value; };
    app.querySelectorAll("#lvls .chip").forEach(function (c) {
      c.onclick = function () {
        app.querySelectorAll("#lvls .chip").forEach(function (x) { x.classList.remove("sel"); });
        c.classList.add("sel"); S._draft.level = c.getAttribute("data-l");
      };
    });
    document.getElementById("done").onclick = function () {
      var n = (S._draft.name || "").trim(), L = S._draft.level;
      if (!n) { alert("請輸入姓名 Please enter a name"); return; }
      if (!L) { alert("請選擇年級 Please pick a year level"); return; }
      S.user = { uid: "student@demo", name: n, level: L, email: "student@demo", notif: true };
      S.sessions = S.sessions || []; S.bookmarks = S.bookmarks || [];
      delete S._draft; save();
      // mirror to live Customers workbook (no-op offline)
      TPC.backend.upsertUser({ uid: S.user.uid, email: S.user.email, displayName: n, studentName: n, yearLevel: L });
      go("home");
    };
    bind();
  }

  // ---- 3. Home ----
  function home() {
    var u = S.user, recent = (S.sessions || []).slice(-3).reverse();
    app.innerHTML = bar("你好，" + u.name, { avatar: u.name[0], badge: u.level,
      right: '<button class="iconbtn" data-go="profile">⚙</button>' }) +
      '<div class="screen">' +
      '<div class="actions">' +
      '<button class="btn primary big" data-go="setup"><span>▶ 練習<span class="sub">Practice</span></span></button>' +
      '<button class="btn big" data-go="report"><span>📊 報告<span class="sub">Report</span></span></button></div>' +
      '<div class="label">最近 Recent</div>' +
      (recent.length ? recent.map(function (s) {
        return '<div class="list-row"><span>🕘</span><span style="flex:1">' + esc(s.topic) +
          ' · ' + s.date + '</span><b style="color:var(--green)">' + s.accuracy + '%</b></div>';
      }).join("") : '<div class="hint">還沒有練習記錄。No practice yet — tap Practice!</div>') +
      '<div class="spacer"></div>' +
      '<div class="list-row" data-go="report" style="cursor:pointer"><span>🔖</span>' +
      '<span style="flex:1">我的標記 Bookmarks</span><span class="badge gray">' + (S.bookmarks || []).length + '</span></div>' +
      '</div>' +
      '<div class="src">題庫來源 Data: ' + (DATA_SOURCE === "live" ? "Google Sheets（即時 live）" : "範例 bundled") +
      ' · ' + QS.filter(function (q) { return q.level === S.user.level; }).length + ' 題 @ ' + esc(S.user.level) + '</div>';
    bind();
  }

  // ---- 4. Practice setup ----
  function setup() {
    var lvl = S.user.level;
    var topics = Object.keys(TOPICS_BY_LEVEL[lvl] || {});
    var sel = S._ctx.sel || { topic: "__mix", count: 10, fb: "end" };
    S._ctx.sel = sel;
    if (!HAS[lvl]) {
      app.innerHTML = bar("練習設定", { back: "home" }) +
        '<div class="screen"><div class="card">此年級 (' + lvl + ') 暫無題目。' +
        '<br>No questions for ' + lvl + ' in this prototype — try K2 or K3 via Settings.</div>' +
        '<button class="btn" data-go="profile">前往設定 Settings</button></div>';
      bind(); return;
    }
    function chips() {
      return '<div class="chip' + (sel.topic === "__mix" ? " sel" : "") + '" data-t="__mix">混合 Mixed</div>' +
        topics.map(function (t) { return '<div class="chip' + (sel.topic === t ? " sel" : "") + '" data-t="' + esc(t) + '">' + esc(t) + '</div>'; }).join("");
    }
    app.innerHTML = bar("練習設定 Practice setup", { back: "home", badge: lvl }) +
      '<div class="screen">' +
      '<div class="label">範疇 Topic</div><div class="chips" id="tp">' + chips() + '</div>' +
      '<div class="label">題數 Questions</div><div class="seg" id="cnt">' +
      [5, 10, 15, 20].map(function (n) { return '<button class="' + (sel.count === n ? "sel" : "") + '" data-c="' + n + '">' + n + '</button>'; }).join("") + '</div>' +
      '<div class="label">回饋 Feedback</div><div class="seg" id="fb">' +
      '<button data-f="instant" class="' + (sel.fb === "instant" ? "sel" : "") + '">即時 Instant</button>' +
      '<button data-f="end" class="' + (sel.fb === "end" ? "sel" : "") + '">完成後 At end</button></div>' +
      '<div class="spacer"></div>' +
      '<button class="btn primary big" id="start"><span>▶ 開始 Start</span></button></div>';
    app.querySelectorAll("#tp .chip").forEach(function (c) { c.onclick = function () { sel.topic = c.getAttribute("data-t"); setup(); }; });
    app.querySelectorAll("#cnt button").forEach(function (b) { b.onclick = function () { sel.count = +b.getAttribute("data-c"); setup(); }; });
    app.querySelectorAll("#fb button").forEach(function (b) { b.onclick = function () { sel.fb = b.getAttribute("data-f"); setup(); }; });
    document.getElementById("start").onclick = startQuiz;
    bind();
  }

  function startQuiz() {
    var sel = S._ctx.sel, lvl = S.user.level;
    var pool = QS.filter(function (q) { return q.level === lvl && (sel.topic === "__mix" || q.topic === sel.topic); });
    pool = shuffle(pool).slice(0, sel.count);
    if (!pool.length) { alert("沒有題目 No questions"); return; }
    go("quiz", { sel: sel, pool: pool, i: 0, answers: [], time: pool.length * 30, flags: {} });
  }

  // ---- 5. Question runner ----
  var timerId = null;
  function quiz() {
    var c = S._ctx, q = c.pool[c.i], answered = false;
    clearInterval(timerId);
    function tick() {
      c.time--; var el = document.getElementById("tmr");
      if (el) { el.textContent = fmt(c.time); el.classList.toggle("warn", c.time <= 15); }
      if (c.time <= 0) { clearInterval(timerId); finish(); }
    }
    timerId = setInterval(tick, 1000);

    var pct = Math.round((c.i) / c.pool.length * 100);
    var html = '<div class="topbar">' +
      '<button class="iconbtn" id="exit">✕</button>' +
      '<div class="progress"><i style="width:' + pct + '%"></i></div>' +
      '<span class="hint">' + (c.i + 1) + '/' + c.pool.length + '</span>' +
      '<span class="timer" id="tmr">' + fmt(c.time) + '</span></div>' +
      '<div class="screen">' +
      '<div class="row" style="justify-content:flex-end"><span class="flag' + (c.flags[q.id] ? " on" : "") + '" id="flag">🔖 標記</span></div>';
    if (q.payload.image) html += '<img class="qimg" src="' + esc(q.payload.image) + '" alt="">';
    html += '<div class="stem">' + bi(q.payload.stem) + '</div>';

    if (q.type === "tap_select") {
      var total = q.payload.totalItems || 10, val = 0;
      html += '<div class="hint center">' + bi(q.payload.instruction || "") + '</div>' +
        '<div class="stepper"><button id="dec">−</button><span class="val" id="val">0</span><button id="inc">＋</button></div>' +
        '<div class="spacer"></div><button class="btn primary" id="submit">確定 Done</button></div>';
      app.innerHTML = html;
      var vEl = function () { return document.getElementById("val"); };
      document.getElementById("inc").onclick = function () { if (val < total) { val++; vEl().textContent = val; } };
      document.getElementById("dec").onclick = function () { if (val > 0) { val--; vEl().textContent = val; } };
      document.getElementById("submit").onclick = function () {
        var ok = val === q.answer.selectCount; record(q, ok, val);
        if (c.sel.fb === "instant") afterAnswer(ok, q); else finish.advance();
      };
    } else { // multiple_choice
      html += '<div class="choices" id="ch">' + q.payload.choices.map(function (ch, idx) {
        return '<button class="choice" data-i="' + idx + '">' + esc(ch) + '</button>';
      }).join("") + '</div><div id="fbbox"></div></div>';
      app.innerHTML = html;
      app.querySelectorAll("#ch .choice").forEach(function (b) {
        b.onclick = function () {
          if (answered) return; answered = true;
          var idx = +b.getAttribute("data-i"), ok = idx === q.answer.index;
          record(q, ok, idx);
          var btns = app.querySelectorAll("#ch .choice");
          if (c.sel.fb === "instant") {
            btns.forEach(function (x) { x.disabled = true; });
            b.classList.add(ok ? "correct" : "wrong");
            if (!ok) btns[q.answer.index].classList.add("correct");
            afterAnswer(ok, q);
          } else { finish.advance(); }
        };
      });
    }
    document.getElementById("flag").onclick = function () {
      c.flags[q.id] = !c.flags[q.id];
      this.classList.toggle("on", c.flags[q.id]);
      toggleBookmark(q.id, c.flags[q.id]);
    };
    document.getElementById("exit").onclick = function () {
      if (confirm("離開練習？進度不會保存。Exit practice? Progress is lost.")) { clearInterval(timerId); go("home"); }
    };
    bind();
  }
  function afterAnswer(ok, q) { // instant-feedback panel + Next
    var box = document.getElementById("fbbox") || (function () {
      var d = document.createElement("div"); document.querySelector(".screen").appendChild(d); return d;
    })();
    box.innerHTML = '<div class="fb ' + (ok ? "ok" : "no") + '">' + (ok ? "✓ 正確 Correct！" : "✗ 再試 Not quite。") +
      (q.explanation ? "<br>" + esc(q.explanation) : "") + '</div>' +
      '<button class="btn primary" id="next" style="margin-top:12px">下一題 Next ›</button>';
    document.getElementById("next").onclick = finish.advance;
  }
  function record(q, ok, given) {
    S._ctx.answers.push({ id: q.id, topic: q.topic, domain: q.domain, ok: ok, given: given, marks: q.marks });
  }
  // advance to next question or results
  var finish = function () {
    var c = S._ctx;
    var got = c.answers.reduce(function (s, a) { return s + (a.ok ? a.marks : 0); }, 0);
    var max = c.pool.reduce(function (s, q) { return s + q.marks; }, 0);
    var acc = Math.round(c.answers.filter(function (a) { return a.ok; }).length / c.pool.length * 100);
    var sess = {
      date: new Date().toLocaleDateString("zh-HK"), level: S.user.level,
      topic: c.sel.topic === "__mix" ? "混合 Mixed" : c.sel.topic, fb: c.sel.fb,
      score: got, max: max, accuracy: isFinite(acc) ? acc : 0, answers: c.answers
    };
    S.sessions = S.sessions || []; S.sessions.push(sess); save();
    // mirror to live Results workbook (Sessions + Attempts); graded server-side. No-op offline.
    TPC.backend.saveSession(
      { uid: S.user.uid, mode: "practice", refType: "set",
        refId: c.sel.topic === "__mix" ? "mixed" : c.sel.topic,
        feedbackMode: c.sel.fb, startedAt: c.startedAt || new Date().toISOString() },
      c.answers.map(function (a) {
        return { questionId: a.id, givenAnswer: a.given, isCorrect: a.ok, timeTakenSec: 0 };
      })
    );
    go("result", { sess: sess, pool: c.pool });
  };
  finish.advance = function () {
    clearInterval(timerId);
    var c = S._ctx; c.i++;
    if (c.i >= c.pool.length) finish(); else quiz();
  };
  function fmt(s) { s = Math.max(0, s); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }

  // ---- 6. Result ----
  function result() {
    var ss = S._ctx.sess, pool = S._ctx.pool || [], byId = {}; pool.forEach(function (q) { byId[q.id] = q; });
    var stars = ss.accuracy >= 90 ? 3 : ss.accuracy >= 60 ? 2 : 1;
    app.innerHTML = bar("結果 Result") +
      '<div class="screen">' +
      '<div class="center"><div class="label">準確度 Accuracy</div>' +
      '<div class="bigstat" id="accNum">' + ss.accuracy + '%</div>' +
      '<div class="muted">得分 Score ' + ss.score + ' / ' + ss.max + '</div>' +
      '<div class="stars">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= stars ? "" : "off") + '">★</i>'; }).join("") + '</div></div>' +
      '<div class="label">重溫 Review</div>' +
      ss.answers.map(function (a, n) {
        var on = (S.bookmarks || []).indexOf(a.id) >= 0;
        return '<div class="list-row"><span>' + (a.ok ? "✅" : "❌") + '</span>' +
          '<span style="flex:1">第 ' + (n + 1) + ' 題 · ' + esc(a.topic) + '</span>' +
          '<span class="flag' + (on ? " on" : "") + '" data-bk="' + a.id + '">🔖</span></div>';
      }).join("") +
      '<div class="spacer"></div>' +
      '<div class="row" style="gap:10px">' +
      '<button class="btn sm ghost" style="flex:1" data-go="setup">↻ 再玩</button>' +
      '<button class="btn sm ghost" style="flex:1" data-go="home">🏠 主頁</button>' +
      '<button class="btn sm ghost" style="flex:1" data-go="report">📊 報告</button></div></div>';
    app.querySelectorAll("[data-bk]").forEach(function (el) {
      el.onclick = function () { var id = el.getAttribute("data-bk"); var on = (S.bookmarks || []).indexOf(id) < 0; toggleBookmark(id, on); el.classList.toggle("on", on); };
    });
    countUp(document.getElementById("accNum"), ss.accuracy);
    bind();
  }
  function countUp(el, target) {
    if (!el) return;
    if (!window.requestAnimationFrame) { el.textContent = target + "%"; return; }
    el.textContent = "0%"; var t0 = null;
    (function step(ts) { if (t0 === null) t0 = ts; var p = Math.min(1, (ts - t0) / 650);
      el.textContent = Math.round(target * p) + "%"; if (p < 1) requestAnimationFrame(step); }
    )(window.performance && window.performance.now ? window.performance.now() : 0);
  }

  // ---- 7. Report ----
  function report() {
    var ss = S.sessions || [], att = [];
    ss.forEach(function (s) { att = att.concat(s.answers || []); });
    var byTopic = {};
    att.forEach(function (a) { var t = byTopic[a.topic] = byTopic[a.topic] || { ok: 0, n: 0 }; t.n++; if (a.ok) t.ok++; });
    var topics = Object.keys(byTopic).sort(function (a, b) { return byTopic[b].n - byTopic[a].n; });
    function colour(p) { return p >= 80 ? "var(--green)" : p >= 60 ? "var(--teal-mid)" : "#EF9F27"; }
    app.innerHTML = bar("報告 Report", { back: "home" }) +
      '<div class="screen">' +
      '<div class="label">各範疇準確度 By topic</div>' +
      (topics.length ? topics.map(function (t) {
        var p = Math.round(byTopic[t].ok / byTopic[t].n * 100);
        return '<div class="bar"><span style="width:96px">' + esc(t) + '</span>' +
          '<span class="track"><i style="width:' + p + '%;background:' + colour(p) + '"></i></span>' +
          '<b style="color:' + colour(p) + '">' + p + '%</b></div>';
      }).join("") : '<div class="hint">完成練習後顯示。Shows after you practise.</div>') +
      '<div class="label">歷史 History</div>' +
      (ss.length ? ss.slice().reverse().map(function (s) {
        return '<div class="list-row"><span>🕘</span><span style="flex:1">' + esc(s.topic) + ' · ' + s.date + '</span>' +
          '<span>' + s.score + '/' + s.max + ' · ' + s.accuracy + '%</span></div>';
      }).join("") : '<div class="hint">沒有記錄。No history yet.</div>') +
      '<div class="label">標記題目 Bookmarked</div>' +
      ((S.bookmarks || []).length ? S.bookmarks.map(function (id) {
        var q = QS.filter(function (x) { return x.id === id; })[0]; if (!q) return "";
        return '<div class="list-row"><span>🔖</span><span style="flex:1">' + esc(q.payload.stem.split(" / ")[0]) + '</span>' +
          '<span class="flag on" data-bk="' + id + '">✕</span></div>';
      }).join("") : '<div class="hint">未有標記。No bookmarks.</div>') +
      '</div>';
    app.querySelectorAll("[data-bk]").forEach(function (el) {
      el.onclick = function () { toggleBookmark(el.getAttribute("data-bk"), false); report(); };
    });
    bind();
  }

  // ---- 8. Profile & settings ----
  function profile() {
    var u = S.user;
    app.innerHTML = bar("設定 Settings", { back: "home" }) +
      '<div class="screen">' +
      '<div class="row"><div class="avatar">' + esc(u.name[0]) + '</div>' +
      '<div style="flex:1"><b>' + esc(u.name) + '</b><div class="hint">✉ ' + esc(u.email) + ' · 唯讀</div></div></div>' +
      '<div class="label">年級 Year level</div>' +
      '<div class="row"><span class="badge">' + esc(u.level) + '</span>' +
      '<span class="hint" style="margin-left:8px">一個帳戶一個年級 · cannot be changed</span></div>' +
      '<div class="list-row"><span style="flex:1">通知 In-app notifications</span>' +
      '<button class="chip ' + (u.notif ? "sel" : "") + '" id="nt">' + (u.notif ? "開 On" : "關 Off") + '</button></div>' +
      '<div class="label">語言 Language</div><div class="seg"><button class="sel">中文</button><button>EN</button></div>' +
      '<div class="card" style="color:var(--hint);margin-top:6px">👑 升級 Upgrade · 即將推出 coming soon</div>' +
      '<div class="spacer"></div>' +
      '<button class="btn danger" id="out">登出 Sign out</button></div>';
    document.getElementById("nt").onclick = function () { S.user.notif = !S.user.notif; save(); profile(); };
    document.getElementById("out").onclick = function () { if (confirm("登出？Sign out?")) { delete S.user; save(); go("signin"); } };
    bind();
  }

  function toggleBookmark(id, on) {
    S.bookmarks = S.bookmarks || [];
    var i = S.bookmarks.indexOf(id);
    if (on && i < 0) {
      S.bookmarks.push(id);
      // mirror to live Results.Bookmarks (no-op offline). Adds only; prototype keeps the toggle local.
      TPC.backend.addBookmark(S.user.uid, { refType: "question", refId: id });
    }
    if (!on && i >= 0) S.bookmarks.splice(i, 1);
    save();
  }

  // ---- data loading: live Google Sheets (gviz CSV) with bundled fallback ----
  function parseCsv(text) {
    var rows = [], row = [], val = "", q = false, i = 0, c;
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    for (; i < text.length; i++) {
      c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { val += '"'; i++; } else q = false; }
        else val += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(val); val = ""; }
      else if (c === "\n") { row.push(val); rows.push(row); row = []; val = ""; }
      else val += c;
    }
    if (val !== "" || row.length) { row.push(val); rows.push(row); }
    return rows;
  }
  function rowsToObjects(rows) {
    if (!rows.length) return [];
    var head = rows[0];
    return rows.slice(1).filter(function (r) { return r.some(function (x) { return x !== ""; }); })
      .map(function (r) { var o = {}; head.forEach(function (h, i) { o[h] = r[i] != null ? r[i] : ""; }); return o; });
  }
  function gvizUrl(id, tab) {
    return "https://docs.google.com/spreadsheets/d/" + id + "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(tab);
  }
  function fetchSheet(id, tab) {
    return fetch(gvizUrl(id, tab)).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(function (t) { return rowsToObjects(parseCsv(t)); });
  }
  function mapQuestion(r) {
    return { id: r.questionId, domain: r.domain, topic: r.topic, level: r.level, type: r.type,
      payload: JSON.parse(r.payload || "{}"), answer: JSON.parse(r.correctAnswer || "{}"),
      explanation: r.explanation, difficulty: +r.difficulty || 1, marks: +r.marks || 0 };
  }
  function mapApiQuestion(q) {
    return { id: q.questionId || q.id, domain: q.domain, topic: q.topic, level: q.level, type: q.type,
      payload: q.payload || {}, answer: q.correctAnswer || q.answer || {},
      explanation: q.explanation, difficulty: +q.difficulty || 1, marks: +q.marks || 0 };
  }
  function mapSet(r) {
    return { setId: r.setId, title: r.title, mode: r.mode,
      questionIds: (r.questionIds || "").split(";"), timeLimitSec: +r.timeLimitSec || 0, yearLevel: r.yearLevel };
  }
  function loadData() {
    var cfg = window.TPC_CONFIG || {};
    if (cfg.apiUrl && window.TPC && TPC.backend && TPC.backend.listQuestions) {
      return TPC.backend.listQuestions({ active: true })
        .then(function (rows) {
          var qs = (rows || []).map(mapApiQuestion);
          if (!qs.length) throw new Error("no api rows");
          DATA_SOURCE = "live";
          return { questions: qs, sets: [] };
        })
        .catch(function (e) {
          console.warn("Backend API load failed; trying public Sheets CSV —", e.message);
          return loadSheetsCsvData(cfg);
        });
    }
    return loadSheetsCsvData(cfg);
  }
  function loadSheetsCsvData(cfg) {
    if (cfg.sheetId) {
      return Promise.all([fetchSheet(cfg.sheetId, cfg.questionsTab || "Questions"),
                          fetchSheet(cfg.sheetId, cfg.setsTab || "QuestionSets").catch(function () { return []; })])
        .then(function (res) {
          var qs = res[0].filter(function (r) { return (r.active || "TRUE").toString().toUpperCase() === "TRUE"; }).map(mapQuestion);
          if (!qs.length) throw new Error("no rows");
          DATA_SOURCE = "live";
          return { questions: qs, sets: res[1].map(mapSet) };
        })
        .catch(function (e) {
          console.warn("Live Sheets load failed; using bundled data.js —", e.message);
          DATA_SOURCE = "bundled";
          return { questions: window.TPC_QUESTIONS || [], sets: window.TPC_SETS || [] };
        });
    }
    DATA_SOURCE = "bundled";
    return Promise.resolve({ questions: window.TPC_QUESTIONS || [], sets: window.TPC_SETS || [] });
  }

  // ---- boot ----
  loadData().then(function (d) {
    setData(d.questions, d.sets);
    render(S.user ? "home" : "signin");
  });
})();
