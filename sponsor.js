'use strict';
window.ColorLabStrategies = window.ColorLabStrategies || {};
window.ColorLabStrategies.sponsor = {
  render(cfg){
    if(!cfg?.enabled) return null;
    const el=document.createElement('div'); el.className='monetization-card';
    const label=document.createElement('span'); label.className='sponsor-label'; label.textContent='Patrocinio';
    const h=document.createElement('h3'); h.textContent=cfg.name || 'Patrocinador';
    const p=document.createElement('p'); p.textContent=cfg.text || '';
    el.append(label,h,p);
    if(cfg.url){
      const actions=document.createElement('div'); actions.className='monetization-actions';
      const a=document.createElement('a'); a.className='monetization-btn monetization-btn-secondary';
      a.href=cfg.url; a.target='_blank'; a.rel='noopener sponsored'; a.textContent='Conocer patrocinador';
      actions.append(a); el.append(actions);
    }
    return el;
  }
};
