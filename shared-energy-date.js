/* Shared report date for the Energy pages. No reading values are stored here. */
(function () {
  "use strict";
  const key = "kalikiriSelectedEnergyDate";
  let memoryDate = "";
  function valid(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
    const parsed = new Date(value + "T00:00:00Z");
    return Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === value;
  }
  function today() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date());
    const part = type => parts.find(item => item.type === type).value;
    return part("year") + "-" + part("month") + "-" + part("day");
  }
  function get() {
    try {
      const saved = localStorage.getItem(key);
      if (valid(saved)) return saved;
    } catch (_) { /* Date selection still works when browser storage is blocked. */ }
    return valid(memoryDate) ? memoryDate : today();
  }
  function set(value) {
    if (!valid(value)) return false;
    memoryDate = value;
    try { localStorage.setItem(key, value); } catch (_) {}
    window.dispatchEvent(new CustomEvent("energy-report-date-changed", {detail: {date: value}}));
    return true;
  }
  window.energyReportDate = Object.freeze({get, set, valid});
})();
