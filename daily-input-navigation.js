/* Arrow keys navigate editable reading boxes without changing their numbers. */
export function nextReadingIndex(rects, index, key) {
  const direction={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[key];
  if(!direction || !rects[index])return -1;
  const center=rect=>({x:rect.left+rect.width/2,y:rect.top+rect.height/2});
  const origin=center(rects[index]);let target=-1,score=Infinity;
  rects.forEach((rect,i)=>{
    if(i===index)return;
    const point=center(rect),dx=point.x-origin.x,dy=point.y-origin.y;
    const forward=dx*direction[0]+dy*direction[1];
    if(forward<=1)return;
    const sideways=Math.abs(direction[0]?dy:dx);
    const candidate=forward+sideways*4;
    if(candidate<score){score=candidate;target=i;}
  });return target;
}
if(typeof document!=='undefined') {
  document.addEventListener('keydown',event=>{
    const input=event.target;
    if(!input.matches('.readings-grid input') || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key) ||
      event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||input.disabled||input.readOnly)return;
    event.preventDefault();
    const fields=Array.from(document.querySelectorAll('.readings-grid input')).filter(item=>
      !item.disabled&&!item.readOnly&&item.getClientRects().length);
    const next=nextReadingIndex(fields.map(item=>item.getBoundingClientRect()),fields.indexOf(input),event.key);
    if(next<0)return;const target=fields[next];target.focus({preventScroll:true});
    target.scrollIntoView({block:'nearest',inline:'nearest'});
    if(target.type!=='time')target.select();
  });
  document.addEventListener('wheel',event=>{
    if(event.target.matches('.readings-grid input[type="number"]'))event.preventDefault();
  },{passive:false});
}
