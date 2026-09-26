'use strict';
window.ColorLabStrategies = window.ColorLabStrategies || {};
window.ColorLabStrategies.support = {
  render(cfg){
    if(!cfg?.enabled) return null;
    const el=document.createElement('div'); el.className='monetization-card';
    const h=document.createElement('h3'); h.textContent=cfg.title||'Apoyar ColorLab';
    const p=document.createElement('p'); p.textContent=cfg.text||'';
    el.append(h,p);
    if(cfg.url){
      const actions=document.createElement('div'); actions.className='monetization-actions';
      const a=document.createElement('a'); a.className='monetization-btn monetization-btn-primary action-btn-with-icon';
      a.href=cfg.url; a.target='_blank'; a.rel='noopener';
      const icon=document.createElement('img');
      icon.src='assets/icons/icon-support.png'; icon.alt=''; icon.className='action-icon'; icon.width=22; icon.height=22;
      const text=document.createElement('span'); text.textContent=cfg.label||'Apoyar';
      a.append(icon,text);
      actions.append(a); el.append(actions);
    }
    return el;
  }
};
