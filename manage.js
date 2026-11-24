/* =====================================================
   LogiTrack – Manage Deliveries
   Data store • sort • search highlight • pagination • modals
   bulk actions • undo • CSV export • live simulation
===================================================== */
(() => {
"use strict";

const KEY = "logitrack_shipments_v2", PER = 6;
const STATUSES = ["Pending", "In Transit", "Delivered", "Delayed"];
const DRIVERS = ["Ravi Kumar", "Maria Lopez", "Tom Becker", "Aisha Khan", "Liam Chen"];
const STEPS = ["Order placed", "Picked up", "In transit", "Out for delivery", "Delivered"];
const STEP_AT = { "Pending": 0, "In Transit": 2, "Delivered": 4, "Delayed": 2 };

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const cls = s => s.toLowerCase().replace(/\s+/g, "-");
const iso = d => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return iso(d); };

/* ---------- DATA ---------- */
function seed() {
    const rows = [
        ["SW123456", "Amazon Warehouse", "John Doe", "San Francisco, CA", "New York, NY", "2026-06-05", 2.5, "In Transit"],
        ["SW123457", "Apple Store", "Jane Smith", "Cupertino, CA", "Los Angeles, CA", "2026-06-04", 1.2, "Delivered"],
        ["SW123458", "eBay Seller", "Bob Johnson", "Seattle, WA", "Chicago, IL", "2026-06-06", 3.8, "Pending"],
        ["SW123459", "Walmart", "Alice Brown", "Dallas, TX", "Houston, TX", "2026-06-05", 5.0, "In Transit"],
        ["SW123460", "Target", "Michael Lee", "Boston, MA", "Miami, FL", "2026-06-03", 4.1, "Delivered"],
        ["SW123461", "Samsung", "Emily Davis", "Denver, CO", "Phoenix, AZ", "2026-06-02", 3.0, "Delayed"]
    ];
    const senders = ["Best Buy", "IKEA", "Nike Store", "Costco", "Home Depot", "Dell", "Sony", "Zara"];
    const names = ["Sara Khan", "Mark Wilson", "Priya Patel", "Chris Evans", "Laura Kim", "Omar Ali", "Nina Rossi", "Dan Moore"];
    const cities = ["Austin, TX", "Portland, OR", "Atlanta, GA", "Detroit, MI", "Las Vegas, NV", "Nashville, TN", "Orlando, FL", "Salt Lake City, UT"];
    let r = 7;
    const rnd = () => (r = r * 16807 % 2147483647) / 2147483647;
    const pick = a => a[Math.floor(rnd() * a.length)];
    for (let i = 0; i < 18; i++) {
        const a = pick(cities);
        let b = pick(cities);
        if (a === b) b = cities[(cities.indexOf(a) + 1) % cities.length];
        rows.push(["SW" + (123462 + i), pick(senders), pick(names), a, b,
            addDays("2026-05-20", Math.floor(rnd() * 18)), Math.round((0.5 + rnd() * 9) * 10) / 10, pick(STATUSES)]);
    }
    return rows.map((x, i) => ({ id: x[0], sender: x[1], receiver: x[2], from: x[3], to: x[4],
        date: x[5], weight: x[6], status: x[7], driver: DRIVERS[i % DRIVERS.length] }));
}

function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(d) && d.length) return d; } catch (e) {}
    return seed();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S.data)); } catch (e) {} }

const S = { data: load(), q: "", status: "all", date: "all", sort: "date", dir: -1,
            page: 1, bulk: false, sel: new Set(), flash: null };
const find = id => S.data.find(s => s.id === id);
const commit = () => { save(); render(); };

/* ---------- FILTER + SORT ---------- */
function list() {
    const maxD = S.data.reduce((m, s) => s.date > m ? s.date : m, "");
    const cut = maxD ? addDays(maxD, -2) : "";           // "Recent" = within 2 days of newest shipment
    const q = S.q.toLowerCase();
    const out = S.data.filter(s =>
        (!q || [s.id, s.sender, s.receiver, s.from, s.to, s.status, s.driver].join(" ").toLowerCase().includes(q)) &&
        (S.status === "all" || s.status === S.status) &&
        (S.date === "all" || (S.date === "recent" ? s.date >= cut : s.date < cut)));
    const val = s => S.sort === "route" ? s.from + s.to : s[S.sort];
    out.sort((a, b) => { const x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * S.dir; });
    return out;
}

const hl = t => {
    if (!S.q) return esc(t);
    const re = new RegExp("(" + S.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
    return String(t).split(re).map((p, i) => i % 2 ? `<mark>${esc(p)}</mark>` : esc(p)).join("");
};

/* ---------- RENDER ---------- */
const tbody = $("#shipmentTable");

function rowHTML(s) {
    const on = S.sel.has(s.id);
    return `<tr data-id="${s.id}" class="${on ? "selected" : ""}">
        <td class="bulk-col"><input type="checkbox" class="rowchk" ${on ? "checked" : ""}></td>
        <td><a class="tracking-number" title="Click to copy">${hl(s.id)}</a></td>
        <td>${hl(s.sender)}</td><td>${hl(s.receiver)}</td>
        <td>${hl(s.from)} → ${hl(s.to)}</td>
        <td>${s.date}</td><td>${Number(s.weight).toFixed(1)} kg</td>
        <td><p class="status ${cls(s.status)}">${s.status}</p></td>
        <td><button class="view-button" data-act="view">View</button><button class="more-button" data-act="more">⋮</button></td></tr>`;
}

function count(el, to) {
    const from = +el.dataset.v || 0; el.dataset.v = to;
    const t0 = performance.now();
    (function f(t) {
        const k = Math.min(1, (t - t0) / 500);
        el.textContent = Math.round(from + (to - from) * k);
        if (k < 1) requestAnimationFrame(f);
    })(t0);
}

function render() {
    const all = list(), pages = Math.max(1, Math.ceil(all.length / PER));
    S.page = Math.min(S.page, pages);
    const rows = all.slice((S.page - 1) * PER, S.page * PER);
    tbody.innerHTML = rows.length ? rows.map(rowHTML).join("")
        : `<tr><td colspan="9" class="empty">🔍 No shipments match your filters.</td></tr>`;

    const a = (S.page - 1) * PER + 1;
    $(".table-bottom p").textContent = all.length ? `Showing ${a}–${a + rows.length - 1} of ${all.length} shipments` : "No shipments found";

    let h = `<button data-p="${S.page - 1}" ${S.page === 1 ? "disabled" : ""}>‹</button>`, prev = 0;
    for (let p = 1; p <= pages; p++) {
        if (p !== 1 && p !== pages && Math.abs(p - S.page) > 1) continue;
        if (p - prev > 1) h += "<span>…</span>";
        h += `<button data-p="${p}" class="${p === S.page ? "page-active" : ""}">${p}</button>`; prev = p;
    }
    $("#pagination").innerHTML = h + `<button data-p="${S.page + 1}" ${S.page === pages ? "disabled" : ""}>›</button>`;

    const n = st => S.data.filter(s => st.includes(s.status)).length;
    count($("#totalShipments"), S.data.length);
    count($("#transitShipments"), n(["In Transit"]));
    count($("#deliveredShipments"), n(["Delivered"]));
    count($("#pendingShipments"), n(["Pending", "Delayed"]));

    document.querySelectorAll("th.sortable").forEach(th => th.classList.remove("asc", "desc"));
    const th = $(`th[data-key="${S.sort}"]`); if (th) th.classList.add(S.dir > 0 ? "asc" : "desc");

    $("#selCount").textContent = S.sel.size + " selected";
    $("#selAll").checked = all.length > 0 && all.every(s => S.sel.has(s.id));

    if (S.flash) { const r = $(`tr[data-id="${S.flash}"]`); if (r) r.classList.add("flash"); S.flash = null; }
}

/* ---------- TOASTS + MODALS ---------- */
function toast(msg, label, fn) {
    const box = $(".toasts") || document.body.appendChild(Object.assign(document.createElement("div"), { className: "toasts" }));
    const t = document.createElement("div");
    t.className = "toast"; t.innerHTML = `<span>${esc(msg)}</span>`;
    if (label) { const b = document.createElement("button"); b.textContent = label; b.onclick = () => { fn(); t.remove(); }; t.appendChild(b); }
    box.appendChild(t); setTimeout(() => t.remove(), 5000);
}

const closeModal = () => { const m = $(".modal-back"); if (m) m.remove(); };
const closeMenu = () => { const m = $(".menu"); if (m) m.remove(); };

function modal(html) {
    closeModal();
    const b = document.createElement("div");
    b.className = "modal-back";
    b.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    b.addEventListener("click", e => { if (e.target === b || e.target.closest("[data-close]")) closeModal(); });
    document.body.appendChild(b);
    const f = $("input,select", b); if (f) f.focus();
    return b;
}

/* ---------- ACTIONS ---------- */
function setStatus(ids, status) {
    S.data.forEach(s => { if (ids.includes(s.id)) s.status = status; });
    S.flash = ids[0]; commit();
    toast(`${ids.length} shipment${ids.length > 1 ? "s" : ""} marked ${status}`);
}

const actions = {
    copy(id) {
        if (navigator.clipboard) navigator.clipboard.writeText(id).then(() => toast("Copied " + id), () => toast("Copy failed"));
    },
    deliver: id => setStatus([id], "Delivered"),
    delay: id => setStatus([id], "Delayed"),
    dup(id) {
        const s = find(id), n = nextId();
        S.data.splice(S.data.indexOf(s) + 1, 0, { ...s, id: n, status: "Pending" });
        S.flash = n; commit(); toast("Duplicated as " + n);
    },
    del(id) {
        const i = S.data.findIndex(s => s.id === id), [s] = S.data.splice(i, 1);
        S.sel.delete(id); commit();
        toast("Deleted " + id, "Undo", () => { S.data.splice(i, 0, s); commit(); });
    }
};

const nextId = () => "SW" + (Math.max(123455, ...S.data.map(s => +s.id.slice(2))) + 1);

function moreOptions(id, btn) {
    closeMenu();
    const r = btn.getBoundingClientRect(), m = document.createElement("div");
    m.className = "menu";
    m.innerHTML = [["copy", "📋 Copy tracking no."], ["deliver", "✓ Mark delivered"], ["delay", "⚠ Mark delayed"],
                   ["dup", "⧉ Duplicate"], ["del", "🗑 Delete"]].map(([a, t]) => `<button data-a="${a}">${t}</button>`).join("");
    m.style.top = Math.min(r.bottom + 4, innerHeight - 210) + "px";
    m.style.left = Math.max(8, r.right - 170) + "px";
    m.addEventListener("click", e => { const a = e.target.dataset.a; if (a) { closeMenu(); actions[a](id); } });
    document.body.appendChild(m);
}

function viewShipment(id) {
    const s = find(id); if (!s) return;
    const at = STEP_AT[s.status];
    const eta = s.status === "Delivered" ? "Delivered ✓" : addDays(s.date, 3) + (s.status === "Delayed" ? " (delayed)" : "");
    const d = (k, v) => `<dt>${k}</dt><dd>${esc(v)}</dd>`;
    const m = modal(`<h3>${s.id} <span class="status ${cls(s.status)}">${s.status}</span></h3>
        <div class="timeline ${s.status === "Delayed" ? "bad" : ""}">${STEPS.map((t, i) =>
            `<div class="step ${i <= at ? "done" : ""}"><i></i><span>${t}</span></div>`).join("")}</div>
        <dl class="details">${d("Sender", s.sender)}${d("Receiver", s.receiver)}${d("Route", s.from + " → " + s.to)}
            ${d("Ship date", s.date)}${d("Weight", Number(s.weight).toFixed(1) + " kg")}${d("Driver", s.driver)}${d("Estimated delivery", eta)}</dl>
        <div class="actions"><select id="vs">${STATUSES.map(x => `<option ${x === s.status ? "selected" : ""}>${x}</option>`).join("")}</select>
        <button class="btn primary" data-save>Update status</button><button class="btn" data-close>Close</button></div>`);
    $("[data-save]", m).onclick = () => { setStatus([id], $("#vs", m).value); closeModal(); };
}

function addShipment() {
    const m = modal(`<h3>Add Shipment</h3><form novalidate>
        <div class="grid2">
        <label>Sender<input name="sender"></label><label>Receiver<input name="receiver"></label>
        <label>From<input name="from" placeholder="City, ST"></label><label>To<input name="to" placeholder="City, ST"></label>
        <label>Weight (kg)<input name="weight" type="number" step="0.1" min="0.1"></label>
        <label>Ship date<input name="date" type="date" value="${iso(new Date())}"></label></div>
        <label>Driver<select name="driver">${DRIVERS.map(x => `<option>${x}</option>`).join("")}</select></label>
        <p class="err"></p>
        <div class="actions"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Create shipment</button></div></form>`);
    $("form", m).addEventListener("submit", e => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.target)), w = parseFloat(f.weight);
        const bad = ["sender", "receiver", "from", "to", "date"].filter(k => !f[k].trim());
        if (!(w > 0)) bad.push("weight");
        e.target.querySelectorAll("input").forEach(i => i.classList.toggle("bad", bad.includes(i.name)));
        $(".err", m).textContent = bad.length ? "Please fill in the highlighted fields (weight must be above 0)." : "";
        if (bad.length) return;
        const id = nextId();
        S.data.unshift({ id, sender: f.sender.trim(), receiver: f.receiver.trim(), from: f.from.trim(), to: f.to.trim(),
            date: f.date, weight: w, status: "Pending", driver: f.driver });
        Object.assign(S, { q: "", status: "all", date: "all", sort: "date", dir: -1, page: 1, flash: id });
        $("#searchInput").value = ""; $("#statusFilter").value = "all"; $("#dateFilter").value = "all";
        closeModal(); commit(); toast("Shipment " + id + " created");
    });
}

/* ---------- BULK MODE ---------- */
function manageBulk() {
    S.bulk = !S.bulk;
    document.body.classList.toggle("bulk", S.bulk);
    $("#bulkPanel").hidden = !S.bulk;
    if (!S.bulk) S.sel.clear();
    render();
    if (S.bulk) {
        $(".shipment-section").scrollIntoView({ behavior: "smooth", block: "start" });
        toast("Bulk mode on – tick rows, then pick an action");
    }
}

function exportCSV(selectedOnly) {
    const rows = selectedOnly && S.sel.size ? S.data.filter(s => S.sel.has(s.id)) : list();
    const head = ["Tracking", "Sender", "Receiver", "From", "To", "Date", "Weight (kg)", "Status", "Driver"];
    const q = v => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [head, ...rows.map(s => [s.id, s.sender, s.receiver, s.from, s.to, s.date, s.weight, s.status, s.driver])]
        .map(r => r.map(q).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "logitrack-shipments.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`Exported ${rows.length} shipments`);
}

/* ---------- LIVE SIMULATION ---------- */
let timer = null;
function tick() {
    const flow = { "Pending": "In Transit", "In Transit": "Delivered", "Delayed": "In Transit" };
    const c = S.data.filter(s => flow[s.status]); if (!c.length) return;
    const s = c[Math.floor(Math.random() * c.length)];
    s.status = s.status === "In Transit" && Math.random() < 0.15 ? "Delayed" : flow[s.status];
    S.flash = s.id; commit(); toast(`${s.id} is now ${s.status}`);
}

/* ---------- GLOBAL HANDLERS (used by inline onclick in HTML) ---------- */
let debounce;
function filterShipments() {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
        S.q = $("#searchInput").value.trim();
        S.status = $("#statusFilter").value;
        S.date = $("#dateFilter").value;
        S.page = 1; render();
    }, 120);
}
function resetFilters() {
    $("#searchInput").value = ""; $("#statusFilter").value = "all"; $("#dateFilter").value = "all";
    Object.assign(S, { q: "", status: "all", date: "all", page: 1 }); render();
}
Object.assign(window, { filterShipments, resetFilters, addShipment, manageBulk });

/* ---------- INIT ---------- */
const keys = ["id", "sender", "receiver", "route", "date", "weight", "status"];
const headRow = $("thead tr");
[...headRow.children].forEach((th, i) => {
    if (!keys[i]) return;
    th.classList.add("sortable"); th.dataset.key = keys[i]; th.title = "Click to sort";
    th.onclick = () => { S.dir = S.sort === keys[i] ? -S.dir : 1; S.sort = keys[i]; render(); };
});
headRow.insertAdjacentHTML("afterbegin", `<th class="bulk-col"><input type="checkbox" id="selAll" title="Select all filtered"></th>`);

$("#selAll").onchange = e => { list().forEach(s => e.target.checked ? S.sel.add(s.id) : S.sel.delete(s.id)); render(); };
$("#pagination").onclick = e => { const p = +e.target.dataset.p; if (p && !e.target.disabled) { S.page = p; render(); } };
$("#exportBtn").onclick = () => exportCSV(false);
$("#liveBtn").onclick = e => {
    if (timer) { clearInterval(timer); timer = null; } else timer = setInterval(tick, 5000);
    e.target.classList.toggle("on", !!timer);
    e.target.textContent = timer ? "● Live updates: ON" : "○ Live updates: OFF";
};

$("#bulkPanel").addEventListener("click", e => {
    const k = e.target.dataset.bulk; if (!k) return;
    if (k === "exit") return manageBulk();
    const ids = [...S.sel];
    if (!ids.length) return toast("Select at least one shipment first");
    if (k === "status") setStatus(ids, $("#bulkStatus").value);
    if (k === "export") exportCSV(true);
    if (k === "delete") {
        const snap = [...S.data];
        S.data = S.data.filter(s => !S.sel.has(s.id)); S.sel.clear(); commit();
        toast(`Deleted ${ids.length} shipments`, "Undo", () => { S.data = snap; commit(); });
    }
});

tbody.addEventListener("click", e => {
    const tr = e.target.closest("tr[data-id]"); if (!tr) return;
    const id = tr.dataset.id;
    if (e.target.matches(".rowchk")) {
        e.target.checked ? S.sel.add(id) : S.sel.delete(id);
        tr.classList.toggle("selected", e.target.checked);
        $("#selCount").textContent = S.sel.size + " selected"; return;
    }
    const b = e.target.closest("[data-act]");
    if (b) { e.stopPropagation(); b.dataset.act === "view" ? viewShipment(id) : moreOptions(id, b); return; }
    if (e.target.closest(".tracking-number")) actions.copy(id);
});

document.addEventListener("click", e => { if (!e.target.closest(".menu")) closeMenu(); });
window.addEventListener("scroll", closeMenu, { passive: true });
document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeModal(); closeMenu(); return; }
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.metaKey || e.ctrlKey || $(".modal-back")) return;
    if (e.key === "/") { e.preventDefault(); $("#searchInput").focus(); }
    if (e.key.toLowerCase() === "n") { e.preventDefault(); addShipment(); }
});

render();
})();
