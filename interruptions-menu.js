import {GROUPS} from './interruptions-core.js';
// Home remains a normal link. The interruption tab belongs to the Home page.
const isHome=decodeURIComponent(location.pathname).split('/').pop()==='home.html';
const main=document.querySelector('main');
if(isHome&&main){
 const wrap=document.createElement('section');wrap.className='int-portal-menu';wrap.setAttribute('aria-label','Interruptions');
 const toggle=document.createElement('button');toggle.type='button';toggle.className='int-portal-toggle';toggle.textContent='INTERRUPTIONS ▸';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','intPortalPanel');wrap.append(toggle);
 const menu=document.createElement('div');menu.className='int-portal-panel';menu.id='intPortalPanel';
 menu.innerHTML=`${GROUPS.map((g,i)=>`<div class="int-menu-branch" data-group="${i}"><button type="button" aria-expanded="false">${g.name} ▸</button><div class="int-submenu">${g.items.map(e=>`<a data-family="${e.split('-')[0].toLowerCase()}" href="interruptions.html?equipment=${encodeURIComponent(e)}">${e}</a>`).join('')}</div></div>`).join('')}<a href="interruptions.html?view=month">Month-wise Interruptions</a><a href="interruptions.html">All / Review needed</a>`;
 wrap.append(menu);
 const homeLink=document.querySelector('.main-nav a[href="home.html"]');
 function fitHome(){if(!homeLink)return;const r=homeLink.getBoundingClientRect();wrap.style.width=r.width+'px';toggle.style.height=r.height+'px';toggle.style.borderRadius=getComputedStyle(homeLink).borderRadius;const mr=main.getBoundingClientRect();const pad=parseFloat(getComputedStyle(main).paddingLeft)||0;wrap.style.marginLeft=(r.left-mr.left-pad)+'px';}
 requestAnimationFrame(fitHome);window.addEventListener('resize',fitHome);
 if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(fitHome);observer.observe(homeLink);}
 const grid=main.querySelector('.readings-grid');if(grid)grid.before(wrap);else main.append(wrap);
 const close=()=>{wrap.classList.remove('int-open');toggle.setAttribute('aria-expanded','false');menu.querySelectorAll('.int-open').forEach(e=>e.classList.remove('int-open'));menu.querySelectorAll('button').forEach(e=>e.setAttribute('aria-expanded','false'));};
 toggle.onclick=()=>{const open=wrap.classList.toggle('int-open');toggle.setAttribute('aria-expanded',String(open));};
 menu.querySelectorAll('button').forEach(button=>button.onclick=()=>{const open=button.parentElement.classList.toggle('int-open');button.setAttribute('aria-expanded',String(open));});
 document.addEventListener('click',event=>{if(!wrap.contains(event.target))close();});
 wrap.addEventListener('keydown',event=>{if(event.key==='Escape'){close();toggle.focus();}});
}
