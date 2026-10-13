/* Calendar presentation only; saving and calculations are unchanged. */
function setupCalendarSaveStatus() {
  if (document.getElementById('calendar-partial-status-style')) return;
  const style = document.createElement('style'); style.id = 'calendar-partial-status-style';
  style.textContent = `
 #calendarDays button.calendar-partial-saved,
 #energyCalendarDays button.calendar-partial-saved {
  background:linear-gradient(135deg,#f0d58e 0%,#f0d58e 50%,#fff1f5 50%,#fff1f5 100%) !important;
  color:#102c54 !important;border:1px solid #bca576 !important;
  animation:calendarPartialBlink 4s ease-in-out infinite;
 }
 #calendarDays button.calendar-partial-saved:hover,
 #energyCalendarDays button.calendar-partial-saved:hover {
  background:linear-gradient(135deg,#dfb54f 0%,#dfb54f 50%,#ffe7ef 50%,#ffe7ef 100%) !important;
 }
 .calendar-partial-key {display:flex;align-items:center;gap:7px;margin:7px 0;color:#31516d;font:12px/1.5 Arial,sans-serif;}
 .calendar-partial-key span {width:18px;height:18px;border:1px solid #bca576;border-radius:4px;background:linear-gradient(135deg,#f0d58e 50%,#fff1f5 50%);}
 @keyframes calendarPartialBlink {0%,100%{opacity:1;}50%{opacity:0.55;}}
 @media(prefers-reduced-motion:reduce){#calendarDays button.calendar-partial-saved,#energyCalendarDays button.calendar-partial-saved{animation:none;}}
 `; document.head.appendChild(style);
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  function dailyKey(button) {
    const heading = document.getElementById('calendarMonth')?.textContent.toLowerCase() || '';
    const year = heading.match(/\b\d{4}\b/)?.[0];
    const month = months.findIndex(name => heading.includes(name));
    const day = Number(button.textContent.trim());
    return year && month >= 0 && day >= 1 && day <= 31
      ? year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0') : '';
  }
  function paint() {
    for (const [id, map, daily] of [
      ['calendarDays', window.dailySavedCompletion, true],
      ['energyCalendarDays', window.energySavedCompletion, false]
    ]) {
      const box = document.getElementById(id); if (!box) continue;
      for (const button of box.querySelectorAll('button')) {
        const key = daily ? dailyKey(button) : button.title.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
        const saved = button.classList.contains(daily ? 'hasReport' : 'has-readings');
        const partial = saved && map?.[key] === false;
        button.classList.toggle('calendar-partial-saved', partial);
        const base = button.title.replace(/ — Partial readings saved$/, '');
        button.title = base + (partial ? ' — Partial readings saved' : '');
        if (partial || !daily) button.setAttribute('aria-label', button.title);
      }
    }
  }
  for (const id of ['calendarDays', 'energyCalendarDays']) {
    const box = document.getElementById(id); if (!box) continue;
    new MutationObserver(paint).observe(box, { childList: true, subtree: true });
    const legend = document.createElement('p'); legend.className = 'calendar-partial-key';
    const swatch = document.createElement('span'); swatch.setAttribute('aria-hidden', 'true'); legend.append(swatch, 'Partially saved'); box.insertAdjacentElement('afterend', legend);
  }
  for (const event of ['daily-cloud-changed', 'energy-calendar-completion', 'energy-page-state']) window.addEventListener(event, () => queueMicrotask(paint));
  window.addEventListener('dashboard-access-changed', event => {
    if (event.detail && !event.detail.user) { window.energySavedCompletion = {}; window.dailySavedCompletion = {}; }
    queueMicrotask(paint);
  });
  paint();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupCalendarSaveStatus, { once: true }); else setupCalendarSaveStatus();
