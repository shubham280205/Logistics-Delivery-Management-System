/* LogiTrack – Track Shipment page
   Handles: tracking lookup, example chips, ?id= links, status card, results panel.
   Demo data lives in SHIPMENTS below; swap lookupShipment() for a fetch() call
   when a real backend is available. */

(function () {
    "use strict";

    var STAGES = ["Picked Up", "In Transit", "Out for Delivery", "Delivered"];

    var SHIPMENTS = {
        SW123456: {
            from: "Mumbai, MH",
            to: "Jaipur, RJ",
            service: "Express",
            weight: "2.4 kg",
            courier: "Rahul Verma",
            stage: 2,
            status: "Out for Delivery",
            eta: "Today, by 4:30 PM",
            events: [
                { stage: 0, when: "22 Nov, 10:24 AM", where: "Mumbai Pickup Hub", note: "Shipment picked up from sender." },
                { stage: 1, when: "22 Nov, 09:40 PM", where: "Mumbai Sorting Centre", note: "Departed for Jaipur." },
                { stage: 1, when: "23 Nov, 01:15 PM", where: "Udaipur Transit Hub", note: "Arrived and scanned." },
                { stage: 2, when: "24 Nov, 09:05 AM", where: "Jaipur Delivery Depot", note: "Out for delivery with Rahul Verma." }
            ]
        },
        LG10234: {
            from: "New Delhi, DL",
            to: "Bengaluru, KA",
            service: "Standard",
            weight: "6.8 kg",
            courier: "Anita Rao",
            stage: 3,
            status: "Delivered",
            eta: "Delivered 23 Nov, 5:42 PM",
            events: [
                { stage: 0, when: "20 Nov, 11:10 AM", where: "Delhi Pickup Hub", note: "Shipment picked up from sender." },
                { stage: 1, when: "21 Nov, 06:30 AM", where: "Delhi Sorting Centre", note: "Departed for Bengaluru." },
                { stage: 1, when: "22 Nov, 08:20 PM", where: "Bengaluru Gateway", note: "Arrived and scanned." },
                { stage: 2, when: "23 Nov, 10:00 AM", where: "Bengaluru Delivery Depot", note: "Out for delivery with Anita Rao." },
                { stage: 3, when: "23 Nov, 05:42 PM", where: "Bengaluru, KA", note: "Delivered. Signed for by R. Nair." }
            ]
        },
        TRK78901: {
            from: "Kolkata, WB",
            to: "Pune, MH",
            service: "Economy",
            weight: "12.0 kg",
            courier: "Assigned at next depot",
            stage: 1,
            status: "In Transit",
            delayed: true,
            alert: "Held at the Nagpur hub because of heavy rain. Your parcel will move on as soon as roads clear.",
            eta: "New estimate: 27 Nov",
            events: [
                { stage: 0, when: "21 Nov, 02:45 PM", where: "Kolkata Pickup Hub", note: "Shipment picked up from sender." },
                { stage: 1, when: "22 Nov, 07:10 AM", where: "Kolkata Sorting Centre", note: "Departed for Pune." },
                { stage: 1, when: "24 Nov, 06:50 AM", where: "Nagpur Transit Hub", note: "Delayed due to weather. Waiting for onward transport." }
            ]
        }
    };

    var form = document.getElementById("trackingForm");
    var input = document.getElementById("trackingInput");
    var button = document.getElementById("trackButton");
    var message = document.getElementById("trackMessage");
    var statusCard = document.getElementById("statusCard");
    var results = document.getElementById("trackResults");
    var examples = document.querySelectorAll(".example[data-id]");

    if (!form || !input || !button) { return; }

    var pending = null;

    function normalise(value) {
        return String(value || "").replace(/\s+/g, "").toUpperCase();
    }

    function lookupShipment(id) {
        return Object.prototype.hasOwnProperty.call(SHIPMENTS, id) ? SHIPMENTS[id] : null;
    }

    function setMessage(text, isError) {
        message.textContent = text;
        message.classList.toggle("error", !!isError);
    }

    function setBusy(busy) {
        button.disabled = busy;
        button.textContent = busy ? "Tracking…" : "Track →";
    }

    function text(id, value) {
        var el = document.getElementById(id);
        if (el) { el.textContent = value; }
    }

    function el(tag, className, content) {
        var node = document.createElement(tag);
        if (className) { node.className = className; }
        if (content !== undefined) { node.textContent = content; }
        return node;
    }

    /* Latest event recorded for a stage, or null if that stage hasn't happened. */
    function stageEvent(shipment, stage) {
        var found = null;
        shipment.events.forEach(function (ev) { if (ev.stage === stage) { found = ev; } });
        return found;
    }

    function renderStatusCard(shipment) {
        if (!statusCard) { return; }
        statusCard.textContent = "";

        STAGES.forEach(function (name, i) {
            var reached = i <= shipment.stage;
            var ev = stageEvent(shipment, i);
            var sub;

            if (reached && ev) {
                sub = ev.when;
            } else if (i === shipment.stage + 1 && shipment.stage === 2) {
                sub = shipment.eta.replace(/^Today, by /, "Expected ");
            } else {
                sub = "Pending";
            }

            var item = el("div", "status-item");
            item.appendChild(el("div", "status-dot" + (reached ? "" : " gray")));

            var info = el("div", "status-text");
            info.appendChild(el("strong", "", name));
            info.appendChild(el("span", "", sub));
            item.appendChild(info);

            statusCard.appendChild(item);
        });
    }

    function renderResults(id, shipment) {
        text("resId", id);
        text("resFrom", shipment.from);
        text("resTo", shipment.to);
        text("resService", shipment.service);
        text("resWeight", shipment.weight);
        text("resCourier", shipment.courier);
        text("resEta", shipment.eta);
        text("resUpdated", shipment.events[shipment.events.length - 1].when);

        var badge = document.getElementById("resBadge");
        badge.textContent = shipment.delayed ? "Delayed · " + shipment.status : shipment.status;
        badge.className = "badge" + (shipment.delayed ? " delayed" : shipment.stage === 3 ? " delivered" : "");

        var alertBox = document.getElementById("resAlert");
        if (shipment.alert) {
            alertBox.textContent = shipment.alert;
            alertBox.hidden = false;
        } else {
            alertBox.hidden = true;
        }

        var stepper = document.getElementById("resStepper");
        stepper.textContent = "";
        STAGES.forEach(function (name, i) {
            var ev = stageEvent(shipment, i);
            var cls = "step";
            if (i <= shipment.stage) { cls += " done"; }
            if (i < shipment.stage) { cls += " linked"; }
            if (i === shipment.stage) { cls += " current"; }

            var li = el("li", cls);
            if (i === shipment.stage) { li.setAttribute("aria-current", "step"); }
            li.appendChild(el("strong", "", name));
            li.appendChild(el("span", "", ev ? ev.when : "Pending"));
            stepper.appendChild(li);
        });

        var list = document.getElementById("resActivity");
        list.textContent = "";
        shipment.events.slice().reverse().forEach(function (ev) {
            var li = el("li");
            li.appendChild(el("strong", "", ev.where));
            li.appendChild(el("span", "", ev.note));
            li.appendChild(el("span", "", ev.when));
            list.appendChild(li);
        });

        results.hidden = false;
        renderStatusCard(shipment);
    }

    function syncUrl(id) {
        try {
            var url = new URL(window.location.href);
            if (id) { url.searchParams.set("id", id); } else { url.searchParams.delete("id"); }
            window.history.replaceState(null, "", url);
        } catch (e) { /* file:// and some sandboxes block this; safe to ignore */ }
    }

    function track(rawValue, options) {
        options = options || {};
        var id = normalise(rawValue);
        input.value = id;

        if (!id) {
            results.hidden = true;
            setMessage("Enter a tracking number to see where your shipment is.", true);
            input.focus();
            return;
        }

        if (!/^[A-Z0-9-]{5,20}$/.test(id)) {
            results.hidden = true;
            setMessage("Tracking numbers use 5–20 letters and numbers, like SW123456.", true);
            input.focus();
            return;
        }

        setMessage("");
        setBusy(true);
        clearTimeout(pending);

        // Short delay so the lookup feels like a real request.
        pending = setTimeout(function () {
            var shipment = lookupShipment(id);
            setBusy(false);

            if (!shipment) {
                results.hidden = true;
                setMessage("We couldn’t find " + id + ". Check the number and try again, or pick one of the examples.", true);
                return;
            }

            setMessage("");
            renderResults(id, shipment);
            syncUrl(id);

            if (!options.silent) {
                results.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
            }
        }, options.silent ? 0 : 450);
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        track(input.value);
    });

    Array.prototype.forEach.call(examples, function (chip) {
        chip.addEventListener("click", function () {
            track(chip.getAttribute("data-id"));
        });
    });

    // Open straight to a shipment from a link like tracking.html?id=SW123456
    var initial = new URLSearchParams(window.location.search).get("id");
    if (initial) { track(initial, { silent: true }); }
})();
