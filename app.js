(() => {
  const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const LS_PREFIX = "lunch-fitness-checks:";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function shanghaiNow() {
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai" })
    );
  }

  function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function formatDateCN(d) {
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  function loadChecks(dateKey) {
    try {
      return JSON.parse(localStorage.getItem(LS_PREFIX + dateKey) || "{}");
    } catch {
      return {};
    }
  }

  function saveChecks(dateKey, map) {
    localStorage.setItem(LS_PREFIX + dateKey, JSON.stringify(map));
  }

  function resolveTemplate(plan, date) {
    const key = ymd(date);
    const override = plan.overrides && plan.overrides[key];
    const id = override || plan.schedule[String(date.getDay())];
    return plan.templates[id];
  }

  function renderRow(item, checked) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "row" + (checked ? " checked" : "");
    btn.dataset.id = item.id;
    btn.innerHTML = `
      <span class="circle" aria-hidden="true"></span>
      <span class="row-main">
        <span class="row-title"><span class="emoji">${item.emoji || ""}</span>${escapeHtml(item.title)}</span>
        <span class="row-sub">${escapeHtml(item.subtitle || "")}</span>
      </span>
      <span class="row-duration">${escapeHtml(item.duration || "")}</span>
    `;
    return btn;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderToday(plan) {
    const today = shanghaiNow();
    const dateKey = ymd(today);
    const tpl = resolveTemplate(plan, today);
    const checks = loadChecks(dateKey);
    const doneInHistory = (plan.history || []).some(
      (h) => h.date === dateKey && h.status === "done"
    );

    $("#goal").textContent = tpl.goal || "";
    $("#date-line").textContent = `今天 · ${WEEKDAYS[today.getDay()]}（${formatDateCN(today)}）`;
    $("#session-title").textContent = tpl.title;
    const badge = $("#badge");
    if (doneInHistory) {
      badge.hidden = false;
      badge.textContent = "已完成";
      badge.className = "badge done";
    } else if (tpl.badge) {
      badge.hidden = false;
      badge.textContent = tpl.badge;
      badge.className = "badge";
    } else {
      badge.hidden = true;
    }
    $("#tip").textContent = tpl.tip || "";
    $("#footer-tip").textContent = tpl.footer || "";

    const list = $("#checklist");
    list.innerHTML = "";
    const items = [...(tpl.items || []), ...(tpl.flow || [])];
    if (tpl.type === "rest") {
      list.innerHTML = `
        <div class="rest-card">
          <div class="big">😴</div>
          <div class="session-title">${escapeHtml(tpl.title)}</div>
          <p class="tip" style="margin:10px 0 0">${escapeHtml(tpl.tip || "")}</p>
        </div>`;
      return;
    }

    items.forEach((item) => {
      const row = renderRow(item, !!checks[item.id]);
      row.addEventListener("click", () => {
        const map = loadChecks(dateKey);
        map[item.id] = !map[item.id];
        saveChecks(dateKey, map);
        row.classList.toggle("checked", !!map[item.id]);
      });
      list.appendChild(row);
    });
  }

  function renderHistory(plan) {
    const root = $("#history-list");
    const history = [...(plan.history || [])].sort((a, b) =>
      a.date < b.date ? 1 : -1
    );

    // Also surface upcoming scheduled days this week from overrides
    const todayKey = ymd(shanghaiNow());
    const upcoming = Object.entries(plan.overrides || {})
      .filter(([d]) => d > todayKey)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, tid]) => {
        const tpl = plan.templates[tid];
        const dt = new Date(date + "T12:00:00");
        return {
          date,
          weekday: WEEKDAYS[dt.getDay()],
          title: tpl ? tpl.title : tid,
          status: "planned",
          notes: tpl && tpl.type === "rest" ? "休息日" : "计划中",
        };
      });

    const all = [...history];
    if (!all.length && !upcoming.length) {
      root.innerHTML = `<div class="empty">还没有训练记录。练完告诉我，我会帮你记在这里。</div>`;
      return;
    }

    root.innerHTML = "";
    const meta = document.createElement("div");
    meta.className = "meta-bar";
    meta.innerHTML = `
      <span class="meta-pill">当前 ${plan.meta.weightKg} kg</span>
      <span class="meta-pill">目标 ~${plan.meta.goalWeightKg} kg</span>
      <span class="meta-pill">${escapeHtml(plan.meta.pattern)}</span>
    `;
    root.appendChild(meta);

    function card(h) {
      const el = document.createElement("article");
      el.className = "history-card";
      const statusClass = h.status === "done" ? "" : "planned";
      const statusText = h.status === "done" ? "已完成" : "计划中";
      const felt = h.felt ? ` · 感觉：${h.felt}` : "";
      el.innerHTML = `
        <div class="history-top">
          <div class="history-date">${escapeHtml(h.weekday || "")} · ${escapeHtml(h.date.slice(5).replace("-", "月"))}日</div>
          <span class="history-status ${statusClass}">${statusText}</span>
        </div>
        <div class="history-title">${escapeHtml(h.title)}</div>
        <div class="history-notes">${escapeHtml((h.notes || "") + felt)}</div>
      `;
      return el;
    }

    if (history.length) {
      const label = document.createElement("div");
      label.className = "section-label";
      label.textContent = "已完成";
      root.appendChild(label);
      history.forEach((h) => root.appendChild(card(h)));
    }
    if (upcoming.length) {
      const label = document.createElement("div");
      label.className = "section-label";
      label.textContent = "本周后续";
      root.appendChild(label);
      upcoming.forEach((h) => root.appendChild(card(h)));
    }
  }

  function setupTabs() {
    $$(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        $$(".tab").forEach((t) => t.classList.remove("active"));
        $$(".panel").forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        $(`#panel-${tab.dataset.tab}`).classList.add("active");
      });
    });
  }

  async function main() {
    setupTabs();
    try {
      const res = await fetch("./data/plan.json", { cache: "no-store" });
      if (!res.ok) throw new Error("无法加载计划数据");
      const plan = await res.json();
      $(".brand-title").textContent = plan.meta.title || "午休健身计划";
      $(".weight-chip").textContent = `${plan.meta.weightKg} → ${plan.meta.goalWeightKg} kg`;
      renderToday(plan);
      renderHistory(plan);
    } catch (err) {
      $("#tip").textContent = "加载失败：" + err.message;
    }
  }

  main();
})();
