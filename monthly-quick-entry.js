import { app, auth, watchDashboardAccess } from './auth-guard.js';
import { getFirestore, doc, getDocFromServer, runTransaction, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { channels, rowValues, changedValues, prepareDayUpdate } from './monthly-quick-core.js';

async function startQuickEntry() {
  if (!location.pathname.endsWith('/monthly-energy.html')) return;
  const config = window.monthlyMeterConfiguration;
  if (!config) return;
  const db = getFirestore(app);
  const coarse = matchMedia('(hover: none)').matches;
  let access = {ready:false, canEdit:false, user:null};
  let current = null, sequence = 0, closeTimer;
  const panel = document.createElement('section');
  panel.className = 'monthly-quick-entry'; panel.hidden = true;
  panel.setAttribute('aria-label', 'Selected date meter readings');
  panel.innerHTML = `<strong class="quick-date"></strong><table><thead><tr><th></th><th class="quick-first-end"></th><th class="quick-second-end"></th></tr></thead><tbody>
    <tr><th>Import</th><td><input type="number" min="0" step="any" inputmode="decimal" data-quick-channel="firstImport"></td><td><input type="number" min="0" step="any" inputmode="decimal" data-quick-channel="secondImport"></td></tr>
    <tr><th>Export</th><td><input type="number" min="0" step="any" inputmode="decimal" data-quick-channel="firstExport"></td><td><input type="number" min="0" step="any" inputmode="decimal" data-quick-channel="secondExport"></td></tr>
    </tbody></table><small class="quick-state" role="status" aria-live="polite"></small>`;
  const inputs = Object.fromEntries(channels.map(key => [key, panel.querySelector(`[data-quick-channel="${key}"]`)]));
  const status = panel.querySelector('.quick-state');
  function place() {
    if(panel.hidden||!current)return;
    const anchor=current.button.parentElement.getBoundingClientRect();
    const width=panel.getBoundingClientRect().width;
    panel.style.left=Math.min(0,Math.max(16-anchor.left,innerWidth-16-width-anchor.left))+'px';
    const footer=document.querySelector('.report-action-bar')?.getBoundingClientRect().height||0;
    const above=anchor.bottom+panel.getBoundingClientRect().height+12>innerHeight-footer;
    panel.style.top=above?'auto':'calc(100% + 8px)';
    panel.style.bottom=above?'calc(100% + 8px)':'auto';
  }
  window.addEventListener('resize',place);
  function canEdit() {return access.ready && access.canEdit && access.user?.uid === auth.currentUser?.uid;}
  function draft() {return Object.fromEntries(channels.map(key => [key, inputs[key].value]));}
  function dirty(state = current) {return Boolean(state?.ready && Object.keys(changedValues(state.baseline, draft())).length);}
  function lock() {Object.values(inputs).forEach(input => input.disabled = !current?.ready || !canEdit() || current.uid !== auth.currentUser?.uid);}
  function message(text, error=false) {status.textContent = text; status.classList.toggle('quick-error', error);}
  watchDashboardAccess(next => {access=next;lock();});
  function reference(state) {return doc(db, 'monthlyEnergyRegisters', state.month + '_' + state.feeder);}

  async function flush() {
    const state = current;
    if (!state) return true;
    if (state.saving) return state.saving;
    if (!dirty(state)) return true;
    if (!canEdit() || auth.currentUser?.uid !== state.uid) {message('View-only access. Your entry has not been saved.',true);return false;}
    state.saving = Promise.resolve().then(async () => {
      try {
        while (current === state && dirty(state)) {
          const captured = draft(), baseline = {...state.baseline};
          for (const input of Object.values(inputs)) {
            if (!input.checkValidity()) {input.reportValidity();throw new Error('Please correct the highlighted reading.');}
          }
          message('Saving…');
          const savedRow = await runTransaction(db, async transaction => {
            if (!canEdit() || auth.currentUser?.uid !== state.uid) throw new Error('Login or edit access changed.');
            const snapshot = await transaction.get(reference(state));
            const data = snapshot.exists() ? snapshot.data() : {};
            const update = prepareDayUpdate(data, state.day, baseline, captured);
            if (Object.keys(update.patch).length) transaction.set(reference(state), {
              feeder:state.feeder, month:state.month,
              days:{[String(state.day)]:update.patch}, savedBy:state.uid, savedAt:serverTimestamp()
            }, {merge:true});
            return update.row;
          });
          if (current !== state) return false;
          channels.forEach(key => {
            // Keep any edits made while the network write was running.
            if (inputs[key].value === captured[key]) inputs[key].value = savedRow[key];
          });
          state.baseline = savedRow;
          message('Saved ✓');
        }
        return true;
      } catch (error) {message(error.message || 'Save failed. Your readings are retained.',true);return false;}
      finally {state.saving=null;lock();}
    });
    return state.saving;
  }

  async function open(button) {
    clearTimeout(closeTimer);
    const date = window.energyReportDate.get();
    if (current?.button === button && current.date === date && !panel.hidden && (current.ready || current.loading)) return;
    const ticket = ++sequence;
    if (current?.saving || dirty()) {if (!await flush()) return;}
    if (ticket !== sequence) return;
    const feeder = button.dataset.feeder, settings = config.settings[feeder];
    const state = {button,feeder,date,month:date.slice(0,7),day:Number(date.slice(8)),uid:auth.currentUser?.uid,ready:false,loading:true,baseline:{},saving:null};
    current=state;
    button.parentElement.append(panel); panel.hidden=false;
    document.querySelectorAll('[data-feeder]').forEach(item => item.setAttribute('aria-expanded',String(item===button)));
    panel.querySelector('.quick-date').textContent = settings.name + ' · ' + date.split('-').reverse().join('/');
    panel.querySelector('.quick-first-end').textContent = settings.firstEnd === 'HV' ? 'HV' : settings.firstEnd + ' End';
    panel.querySelector('.quick-second-end').textContent = settings.secondEnd === 'LV' ? 'LV' : settings.secondEnd === 'Other End' ? 'Other End' : settings.secondEnd + ' End';
    config.channels(settings).forEach(channel => inputs[channel.key].setAttribute('aria-label', channel.label));
    Object.values(inputs).forEach(input => input.value='');lock();message('Loading…');place();
    try {
      await auth.authStateReady();
      state.uid=auth.currentUser?.uid;
      if (!state.uid) throw new Error('Login required.');
      const maxMonth=document.getElementById('registerMonth').max;
      if(maxMonth && state.month>maxMonth)throw new Error('Future months are unavailable.');
      const snapshot = await getDocFromServer(reference(state));
      if (ticket !== sequence || current !== state) return;
      state.baseline=rowValues(snapshot.exists()?snapshot.data():{},state.day);
      channels.forEach(key => inputs[key].value=state.baseline[key]);state.ready=true;state.loading=false;lock();message('');place();
    } catch(error) {state.loading=false;if(current===state)message('Could not load readings. '+error.message,true);}
  }
  async function close() {
    if (current?.saving || dirty()) {if(!await flush())return;}
    sequence++;panel.hidden=true;current=null;
    document.querySelectorAll('[data-feeder]').forEach(button => button.setAttribute('aria-expanded','false'));
  }
  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer=setTimeout(()=>{
      if (!panel.contains(document.activeElement) && !current?.button.parentElement.matches(':hover')) close();
    },350);
  }
  document.querySelectorAll('[data-feeder]').forEach(button => {
    const host=document.createElement('div');host.className='monthly-quick-host';button.replaceWith(host);host.append(button);
    button.setAttribute('aria-expanded','false');
    button.title='Hover to enter readings. Click to open saved register. On mobile, tap to enter; tap again to open register.';
    host.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')open(button);});
    host.addEventListener('pointerleave',scheduleClose);
    button.addEventListener('focus',()=>{if(!coarse)open(button);});
    button.addEventListener('click',async event=>{
      event.preventDefault();event.stopImmediatePropagation();
      if (coarse && (current?.button!==button || panel.hidden)) {await open(button);return;}
      if (current?.saving || dirty()) {if(!await flush())return;}
      const month=current?.button===button ? current.month : document.getElementById('registerMonth').value;
      location.assign('monthly-register.html?'+new URLSearchParams({feeder:button.dataset.feeder,month}).toString());
    },true);
  });
  panel.addEventListener('pointerenter',()=>clearTimeout(closeTimer));
  panel.addEventListener('pointerleave',scheduleClose);
  panel.addEventListener('input',()=>{if(current?.ready)message('');});
  panel.addEventListener('change',()=>flush());
  panel.addEventListener('focusout',()=>{flush();scheduleClose();});
  panel.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();close();return;}
    if(event.key==='Enter'){event.preventDefault();flush();return;}
    if(!event.target.matches('[data-quick-channel]') || event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    const grid=[[inputs.firstImport,inputs.secondImport],[inputs.firstExport,inputs.secondExport]];
    let row=grid.findIndex(items=>items.includes(event.target)),column=grid[row]?.indexOf(event.target);
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='ArrowUp')row--;if(event.key==='ArrowDown')row++;
    if(event.key==='ArrowLeft')column--;if(event.key==='ArrowRight')column++;
    const target=grid[row]?.[column];if(target&&!target.disabled){target.focus();target.select();}
  });
  panel.addEventListener('wheel',event=>{if(event.target.matches('input[type="number"]'))event.preventDefault();},{passive:false});
  document.addEventListener('click',event=>{if(current&&!current.button.parentElement.contains(event.target))close();});
  // Retain pending entries before leaving the page or changing the common date.
  document.addEventListener('click',async event=>{
    const link=event.target.closest('a[href]');
    if(!link||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||link.target==='_blank'||link.hasAttribute('download'))return;
    if(!dirty()&&!current?.saving)return;
    event.preventDefault();event.stopImmediatePropagation();if(await flush())location.assign(link.href);
  },true);
  let replayDate=false;
  const dateInput=document.getElementById('consolidatedDate');
  dateInput?.addEventListener('change',async event=>{
    if(replayDate){replayDate=false;return;}
    if(!dirty()&&!current?.saving)return;
    event.stopImmediatePropagation();
    const chosen=dateInput.value;dateInput.value=current.date;
    if(await flush()){
      dateInput.value=chosen;replayDate=true;
      dateInput.dispatchEvent(new Event('change',{bubbles:true}));
    }
  },true);
  window.addEventListener('energy-report-date-changed',()=>{if(current)open(current.button);});
  window.addEventListener('beforeunload',event=>{if(dirty()||current?.saving){event.preventDefault();event.returnValue='';}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startQuickEntry,{once:true});else startQuickEntry();
