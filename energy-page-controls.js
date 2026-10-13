import "./energy-meter.js";

(function setupEnergyPageControls() {
    const date = document.getElementById("energyDate");
    const save = document.getElementById("saveEnergy");
    const bar = document.getElementById("energySaveBar");
    const title = document.getElementById("energySaveTitle");
    const status = document.getElementById("energySaveStatus");
    const fullDate = document.getElementById("energyFullDate");
    const dialog = document.getElementById("energyUnsavedDialog");
    const message = document.getElementById("energyUnsavedMessage");
    const saveContinue = document.getElementById("energySaveContinue");
    const stay = document.getElementById("energyStayHere");
    const discard = document.getElementById("energyDiscardContinue");
    if (!bar || !dialog) return;
    let pending = null;
    let saving = false;
    let replayDate = false;
    let replayLogout = false;
    const access = () => window.energyPageAccess;
    window.energyNavigationGuardReady = true;

    function dateText(value) {
        return /^\d{4}-\d{2}-\d{2}$/.test(value || "")
            ? value.split("-").reverse().join("/") : "Select a date";
    }
    function update() {
        const state = access().state();
        const value = dateText(state.date);
        title.textContent = "ENERGY METER READINGS · " + value;
        fullDate.textContent = value;
        status.textContent = state.message;
        bar.dataset.dirty = String(state.dirty);
        save.textContent = state.operation === "saving" ? "Saving..." : "Save Readings";
        saveContinue.disabled = !state.ready || !state.canEdit || state.busy || saving;
    }
    function closeDialog() { pending = null; dialog.close(); update(); }
    function requestLeave(action) {
        if (access().state().busy || saving) return;
        if (!access().hasUnsaved()) { action(); return; }
        if (dialog.open) return;
        pending = action;
        message.textContent = "You have unsaved readings. Save before leaving?";
        dialog.showModal();
        update();
        stay.focus();
    }
    function go(url) { access().allowLeave(); window.location.assign(url); }

    date.addEventListener("change", event => {
        if (replayDate) { replayDate = false; return; }
        const state = access().state();
        if (state.busy) {
            event.stopImmediatePropagation();
            date.value = state.date || "";
            return;
        }
        if (!access().hasUnsaved()) return;
        event.stopImmediatePropagation();
        const selected = date.value;
        date.value = state.date;
        if (selected === state.date) return;
        requestLeave(() => {
            date.value = selected;
            replayDate = true;
            date.dispatchEvent(new Event("change", {bubbles:true}));
        });
    }, true);
    stay.addEventListener("click", closeDialog);
    dialog.addEventListener("cancel", event => {
        if (saving) event.preventDefault(); else pending = null;
    });
    discard.addEventListener("click", () => {
        if (saving) return;
        const action = pending;
        closeDialog();
        action?.();
    });
    saveContinue.addEventListener("click", async () => {
        if (saving || saveContinue.disabled) return;
        const action = pending;
        saving = true;
        stay.disabled = true;
        discard.disabled = true;
        saveContinue.textContent = "Saving...";
        update();
        let saved = false;
        try { saved = await access().save(); }
        catch (error) { console.error("Energy save before leaving failed:", error); }
        finally {
            saving = false;
            stay.disabled = false;
            discard.disabled = false;
            saveContinue.textContent = "Save & Continue";
            update();
        }
        if (saved && !access().hasUnsaved()) { closeDialog(); action?.(); }
        else message.textContent = access().state().message;
    });

    document.addEventListener("keydown", event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
            event.preventDefault();
            if (!dialog.open && !save.disabled) access().save();
            return;
        }
        const input = event.target;
        if (!(input instanceof HTMLInputElement) ||
            !input.matches("#energyTables .energy-start, #energyTables .energy-end") ||
            !["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.key) ||
            event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
        event.preventDefault();
        const grid = Array.from(document.querySelectorAll("#energyTables tr[data-meter]"))
            .map(row => [row.querySelector(".energy-start"),row.querySelector(".energy-end")]);
        let row = grid.findIndex(fields => fields.includes(input));
        if (row < 0) return;
        let column = grid[row].indexOf(input);
        if (event.key === "ArrowUp") row--;
        if (event.key === "ArrowDown") row++;
        if (event.key === "ArrowLeft") column--;
        if (event.key === "ArrowRight") column++;
        const target = grid[row]?.[column];
        if (!target || target.disabled) return;
        target.focus({preventScroll:true});
        target.scrollIntoView({block:"nearest",inline:"nearest",behavior:"auto"});
        target.select();
    });
    document.addEventListener("wheel", event => {
        const input = event.target;
        if (input instanceof HTMLInputElement &&
            input.matches("#energyTables input[type='number']") &&
            document.activeElement === input) input.blur();
    }, {capture:true,passive:true});
    document.addEventListener("click", event => {
        const link = event.target.closest("a[href]");
        if (!link || event.defaultPrevented || event.button !== 0 ||
            event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
            link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
        const url = new URL(link.href, location.href);
        if (url.origin !== location.origin ||
            (url.pathname === location.pathname && url.search === location.search)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        requestLeave(() => go(url.href));
    }, true);
    const logout = document.getElementById("logoutBtn");
    logout?.addEventListener("click", event => {
        if (replayLogout) {replayLogout=false;return;}
        if (!access().hasUnsaved() && !access().state().busy) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        requestLeave(() => {replayLogout=true;logout.click();});
    }, true);
    window.addEventListener("energy-page-state", update);
    new MutationObserver(update).observe(document.getElementById("energyMessage"), {
        childList:true,subtree:true,characterData:true
    });
    if (window.ResizeObserver) new ResizeObserver(() => {
        document.body.style.setProperty("--energy-save-space", (bar.getBoundingClientRect().height+24)+"px");
    }).observe(bar);
    update();
})();
