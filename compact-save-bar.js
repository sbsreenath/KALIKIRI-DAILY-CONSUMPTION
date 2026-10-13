/* Presentation only: existing save, calculations and date guards remain in control. */
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = new URL('./compact-save-bar.css', import.meta.url).href;
document.head.appendChild(style);

function setupCompactSaveBar() {
 const configurations = [
  {bar:'dailySaveBar',input:'reportDate',title:'dailySaveTitle',label:'Report date',type:'date'},
  {bar:'energySaveBar',input:'energyDate',title:'energySaveTitle',label:'Readings date',type:'date'},
  {bar:'monthlySaveBar',input:'registerMonth',title:'monthlySaveTitle',label:'Register month',type:'month'}
 ];
 for (const config of configurations) {
  const bar=document.getElementById(config.bar), original=document.getElementById(config.input);
  if(!bar || !original || bar.dataset.compactReady)continue;
  bar.dataset.compactReady='true';bar.classList.add('compact-report-bar');
  const ticker=document.createElement('div');ticker.className='compact-report-ticker';
  const text=document.createElement('span');
  text.textContent=config.type==='month'
   ? 'Select a saved register month below, then choose Print / PDF.'
   : 'Select a saved report date below, then choose Print / PDF.';
  ticker.appendChild(text);
  const row=document.createElement('div');row.className='compact-report-row';
  while(bar.firstChild)row.appendChild(bar.firstChild);
  if(config.type==='month'){
   const actions=document.createElement('div');actions.className='monthly-save-actions';
   const quickSave=document.getElementById('monthlyQuickSave');
   const print=document.getElementById('printMonthly');
   if(quickSave)actions.appendChild(quickSave);
   if(print)actions.appendChild(print);
   row.appendChild(actions);
  }
  const picker=document.createElement('div');picker.className='compact-report-picker';
  const label=document.createElement('label');label.textContent=config.label;label.htmlFor=config.bar+'Picker';
  const bottom=document.createElement('input');bottom.type=config.type;bottom.id=label.htmlFor;
  picker.append(label,bottom);row.insertBefore(picker,row.firstChild);
  bar.append(ticker,row);
  function sync(){
   bottom.value=original.value;bottom.disabled=original.disabled;
   bottom.min=original.min;bottom.max=original.max;bottom.step=original.step;
  }
  bottom.addEventListener('change',()=>{
   if(original.disabled){sync();return;}
   if(!bottom.value || !bottom.checkValidity()){sync();return;}
   original.value=bottom.value;
   original.dispatchEvent(new Event('change',{bubbles:true}));
   sync();
  });
  original.addEventListener('change',()=>queueMicrotask(sync));
  new MutationObserver(sync).observe(original,{attributes:true,attributeFilter:['disabled','min','max','step','value']});
  const title=document.getElementById(config.title);
  if(title)new MutationObserver(sync).observe(title,{childList:true,characterData:true,subtree:true});
  for(const event of ['daily-cloud-changed','dashboard-access-changed','energy-page-state','monthly-register-state','pageshow'])window.addEventListener(event,sync);
  sync();
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupCompactSaveBar,{once:true});
else setupCompactSaveBar();
