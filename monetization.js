'use strict';
(()=>{
  if(!window.CFG?.monetization?.enabled || !window.AppEvents) return;
  const host=document.getElementById('monetizationHost');
  if(!host) return;
  const cfg=window.ColorLabMonetizationConfig||{};
  const strategies=window.ColorLabStrategies||{};
  function render(data){
    host.replaceChildren();
    ['sponsor','affiliate','support'].forEach(name=>{
      try{
        const node=strategies[name]?.render?.(cfg[name],data);
        if(node) host.append(node);
      }catch(err){ console.warn(`[Monetization:${name}]`,err); }
    });
  }
  window.AppEvents.addEventListener('budget:generated',e=>render(e.detail));
})();
