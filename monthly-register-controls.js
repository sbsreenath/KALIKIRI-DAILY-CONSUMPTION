/* MONTHLY REGISTER NAVIGATION — DOES NOT CHANGE CALCULATIONS */
(function setupRegisterNavigation() {
  const toolbar = document.getElementById("monthlyRegisterToolbar");
  if (!toolbar) return;
  const monthInput = document.getElementById("registerMonth");
  const panel = document.getElementById("registerPanel");
  const back = document.getElementById("monthlyBackButton");
  const feeder = document.getElementById("monthlyFeederSelect");
  const previous = document.getElementById("monthlyPreviousFeeder");
  const next = document.getElementById("monthlyNextFeeder");
  const bar = document.getElementById("monthlySaveBar");
  const barTitle = document.getElementById("monthlySaveTitle");
  const barStatus = document.getElementById("monthlySaveStatus");
  const quickSave = document.getElementById("monthlyQuickSave");
  const dialog = document.getElementById("monthlyUnsavedDialog");
  const dialogMessage = document.getElementById("monthlyUnsavedMessage");
  const saveContinue = document.getElementById("monthlySaveContinue");
  const stay = document.getElementById("monthlyStayHere");
  const discard = document.getElementById("monthlyDiscardContinue");
  let pendingAction = null;
  let savingForNavigation = false;
  let leaving = false;
  let replayLogout = false;
  const initial = new URLSearchParams(window.location.search);
  let currentFeeder = initial.get("feeder") || "";
  let currentMonth = monthInput.value || initial.get("month") || "";
  const indiaDate = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit"
  }).formatToParts(new Date());
  monthInput.max = indiaDate.find(part => part.type === "year").value + "-" +
    indiaDate.find(part => part.type === "month").value;

  function access() { return window.monthlyRegisterAccess; }
  function monthText(value) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value || "")) return "Select month";
    return new Date(value + "-01T00:00:00Z").toLocaleDateString("en-US", {
      month: "long", year: "numeric", timeZone: "UTC"
    });
  }
  function update() {
    const state = access()?.state();
    if (state?.feeder) currentFeeder = state.feeder;
    if (state?.month) currentMonth = state.month;
    feeder.value = currentFeeder;
    const index = Array.from(feeder.options).findIndex(option => option.value === currentFeeder);
    const blocked = Boolean(state?.busy || savingForNavigation);
    back.disabled = blocked;
    feeder.disabled = blocked;
    previous.disabled = blocked || index <= 0;
    next.disabled = blocked || index < 0 || index === feeder.options.length - 1;
    monthInput.disabled = blocked;
    quickSave.disabled = !state?.ready || !state?.canEdit || blocked;
    quickSave.textContent = state?.busy ? "Saving..." : "Save Readings";
    barTitle.textContent = (feeder.selectedOptions[0]?.textContent || "Monthly register") +
      " · " + monthText(currentMonth);
    barStatus.textContent = state?.message || "Loading readings...";
    bar.dataset.dirty = String(Boolean(state?.dirty));
    bar.hidden = panel.hidden;
    if (dialog.open) saveContinue.disabled = !state?.ready || !state?.canEdit || blocked;
  }
  function closeDialog() {
    pendingAction = null;
    dialog.close();
    update();
  }
  function requestLeave(action) {
    if (access()?.state().busy || savingForNavigation) return;
    if (!access()?.hasUnsaved()) { action(); return; }
    if (dialog.open) return;
    pendingAction = action;
    dialogMessage.textContent = "You have unsaved readings. Save before leaving?";
    update();
    dialog.showModal();
    update();
    stay.focus();
  }
  function go(url) {
    leaving = true;
    window.location.assign(url);
  }
  function feederUrl(key, month) {
    return "monthly-register.html?" + new URLSearchParams({feeder: key, month}).toString();
  }
  back.addEventListener("click", () => requestLeave(() => {
    go("monthly-energy.html?" + new URLSearchParams({month: currentMonth}).toString());
  }));
  feeder.addEventListener("change", () => {
    const chosen = feeder.value;
    feeder.value = currentFeeder;
    if (chosen !== currentFeeder) requestLeave(() => go(feederUrl(chosen, currentMonth)));
  });
  function move(amount) {
    const options = Array.from(feeder.options);
    const index = options.findIndex(option => option.value === currentFeeder);
    const target = options[index + amount];
    if (target) requestLeave(() => go(feederUrl(target.value, currentMonth)));
  }
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));

  /* Capture before the existing handlers can recreate the table. */
  monthInput.addEventListener("change", event => {
    event.stopImmediatePropagation();
    const chosen = monthInput.value;
    monthInput.value = currentMonth;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(chosen) || chosen === currentMonth) return;
    if (monthInput.max && chosen > monthInput.max) {
      document.getElementById("registerStatus").textContent = "Future months are unavailable.";
      return;
    }
    requestLeave(() => go(feederUrl(currentFeeder, chosen)));
  }, true);

  stay.addEventListener("click", closeDialog);
  dialog.addEventListener("cancel", event => {
    if (savingForNavigation) event.preventDefault();
    else pendingAction = null;
  });
  discard.addEventListener("click", () => {
    if (savingForNavigation) return;
    const action = pendingAction;
    closeDialog();
    action?.();
  });
  saveContinue.addEventListener("click", async () => {
    if (savingForNavigation || saveContinue.disabled) return;
    const action = pendingAction;
    savingForNavigation = true;
    saveContinue.disabled = true;
    stay.disabled = true;
    discard.disabled = true;
    saveContinue.textContent = "Saving...";
    let saved = false;
    try { saved = await access().save(); }
    catch (error) { console.error("Save before leaving failed:", error); }
    finally {
      savingForNavigation = false;
      stay.disabled = false;
      discard.disabled = false;
      saveContinue.textContent = "Save & Continue";
      update();
    }
    if (saved && !access().hasUnsaved()) {
      closeDialog();
      action?.();
    } else {
      dialogMessage.textContent = access().state().message ||
        "Readings could not be saved. Stay here and try again.";
    }
  });
  quickSave.addEventListener("click", () => {
    if (!quickSave.disabled) access()?.save();
  });
  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (!dialog.open && !quickSave.disabled) access()?.save();
    }
  });
  document.addEventListener("click", event => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 ||
      event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
      link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    requestLeave(() => go(url.href));
  }, true);
  const logout = document.getElementById("logoutBtn");
  logout?.addEventListener("click", event => {
    if (replayLogout) { replayLogout = false; return; }
    if (!access()?.hasUnsaved() && !access()?.state().busy) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    requestLeave(() => {replayLogout = true; logout.click();});
  }, true);
  window.addEventListener("beforeunload", event => {
    if (!leaving && (access()?.hasUnsaved() || access()?.state().busy)) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  window.addEventListener("monthly-register-state", update);
  new MutationObserver(update).observe(panel, {attributes:true, attributeFilter:["hidden"]});
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      const height = bar.hidden ? 0 : bar.getBoundingClientRect().height;
      document.body.style.setProperty("--monthly-save-bar-space", (height + 28) + "px");
    }).observe(bar);
  }
  update();
})();
