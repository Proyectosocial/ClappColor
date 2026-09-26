'use strict';
window.ColorLabStrategies = window.ColorLabStrategies || {};
window.ColorLabStrategies.affiliate = {
  render(cfg, data){
    if(!cfg?.enabled || !cfg.url) return null;
    const el=document.createElement('div'); el.className='monetization-card';
    const h=document.createElement('h3'); h.textContent='Materiales para este presupuesto';
    const liters=Number(data?.totales?.latex_litros||0)+Number(data?.totales?.sintetico_litros||0);
    const p=document.createElement('p'); p.textContent=`Tu cálculo estima ${liters.toFixed(2)} L de pintura. El enlace siguiente es opcional y puede generar una comisión para ColorLab sin cambiar el precio del cálculo.`;
    const actions=document.createElement('div'); actions.className='monetization-actions';
    const a=document.createElement('a'); a.className='monetization-btn monetization-btn-primary';
    a.href=cfg.url; a.target='_blank'; a.rel='noopener sponsored'; a.textContent=cfg.label||'Ver materiales';
    actions.append(a); el.append(h,p,actions); return el;
  }
};
