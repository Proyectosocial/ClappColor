'use strict';
const RECIPES=window.RECIPES||{}, CFG=window.CFG||{};
const $=id=>document.getElementById(id);
const norm=s=>s.trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');


// ===== Catálogo MySQL de colores =====
let PAINT_CATALOG=[];
let ACTIVE_CATALOG_COLOR=null;
let MIX_COLOR_A={name:'Vainilla',code:'PM-101',hex:'#F3E5AB',source:'Receta ColorLab'};
let MIX_COLOR_B={name:'Color B',code:'#00AEEF',hex:'#00AEEF',source:'Manual'};
function catalogColorLabel(c){return c?`${c.codigo_comercial} · ${c.nombre_color}`:'Sin color seleccionado'}
function fillRoomColorSelect(select){
  if(!select)return;
  const current=select.value;
  select.innerHTML='<option value="">Sin color asignado</option>'+PAINT_CATALOG.map(c=>`<option value="${c.id}">${escapeHtml(c.codigo_comercial)} · ${escapeHtml(c.nombre_color)}</option>`).join('');
  if(current)select.value=current;
}
function fillAllRoomColorSelects(){document.querySelectorAll('.room-color').forEach(fillRoomColorSelect)}
function selectCatalogColor(c, syncColorA=true){
  ACTIVE_CATALOG_COLOR=c;
  const chip=$('catalogSelectedChip'),name=$('catalogSelectedName'),code=$('catalogSelectedCode');
  if(chip)chip.style.background=c.codigo_hex;
  if(name)name.textContent=c.nombre_color;
  if(code)code.textContent=`${c.codigo_comercial} · ${c.codigo_hex} · RGB(${c.rgb_r}, ${c.rgb_g}, ${c.rgb_b})`;
  document.querySelectorAll('.catalog-color').forEach(b=>b.classList.toggle('active',Number(b.dataset.id)===Number(c.id)));
  if(typeof photoPaint!=='undefined'){
    photoPaint.selected={name:catalogColorLabel(c),hex:c.codigo_hex};
    if($('paintColorChip'))$('paintColorChip').style.background=c.codigo_hex;
    if($('paintColorName'))$('paintColorName').textContent=catalogColorLabel(c);
  }
  if(syncColorA){
    const target=$('catalogMixTarget')?.value||'A';
    const meta={name:c.nombre_color,code:c.codigo_comercial,hex:c.codigo_hex,source:'Catálogo técnico',catalogId:Number(c.id)};
    if(target==='B') activateColorB(meta); else activateColorA(meta);
  }
}
function renderCatalog(){
  const host=$('catalogGrid'); if(!host)return;
  const q=norm($('catalogSearch')?.value||'');
  const cat=$('catalogCategory')?.value||'';
  const fam=$('catalogFamily')?.value||'';
  const filtered=PAINT_CATALOG.filter(c=>(!cat||c.categoria_paleta===cat)&&(!fam||c.familia_color===fam)&&(!q||norm(`${c.codigo_comercial} ${c.nombre_color} ${c.codigo_hex} ${c.familia_color||''} ${c.temperatura||''} ${c.clasificacion_cromatica||''}`).includes(q)));
  host.replaceChildren();
  const frag=document.createDocumentFragment();
  filtered.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='catalog-color';b.dataset.id=c.id;b.title=`${c.codigo_comercial} · ${c.nombre_color} · ${c.codigo_hex}`;b.innerHTML=`<span class="catalog-color-swatch" style="background:${c.codigo_hex}"></span><span class="catalog-color-meta"><strong>${escapeHtml(c.nombre_color)}</strong><small>${escapeHtml(c.codigo_comercial)} · ${escapeHtml(c.codigo_hex)}</small><small>${escapeHtml(c.familia_color||'')} · ${escapeHtml(c.temperatura||'')} · ${escapeHtml(c.clasificacion_cromatica||'')}</small></span>`;b.onclick=()=>selectCatalogColor(c);frag.appendChild(b)});
  host.appendChild(frag);
  if($('catalogStatus'))$('catalogStatus').textContent=`${filtered.length} de ${PAINT_CATALOG.length} colores`;
}
async function loadPaintCatalog(){
  const status=$('catalogStatus');
  try{
    const res=await fetch(CFG.api||'api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'listar_pinturas_catalogo',limite:1500})});
    const json=await res.json();
    if(!res.ok||!json.ok)throw new Error(json.mensaje||'No se pudo cargar el catálogo.');
    PAINT_CATALOG=Array.isArray(json.data?.colores)?json.data.colores:[];
    const cat=$('catalogCategory'); if(cat){(json.data?.categorias||[]).forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;cat.appendChild(o)});}
    const fam=$('catalogFamily'); if(fam){[...new Set(PAINT_CATALOG.map(c=>c.familia_color).filter(Boolean))].sort().forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;fam.appendChild(o)});}
    fillAllRoomColorSelects(); renderCatalog();
    if(PAINT_CATALOG.length)selectCatalogColor(PAINT_CATALOG[0], false);
  }catch(err){if(status)status.textContent=`Catálogo no disponible: ${err.message} Importá database/pinturas_catalogo.sql en ${CFG.db_name||'MySQL'}.`;}
}

// ===== Eventos públicos opcionales (sin dependencia de monetización) =====
window.AppEvents = window.AppEvents || new EventTarget();
function emitAppEvent(name, detail={}){ window.AppEvents.dispatchEvent(new CustomEvent(name,{detail})); }
function activateColorA(color){
  if(!color||!/^#[0-9A-F]{6}$/i.test(color.hex||''))return;
  const hex=String(color.hex).toUpperCase();
  MIX_COLOR_A={...color,hex};
  if($('colorA'))$('colorA').value=hex;
  if($('swatch'))$('swatch').style.background=hex;
  if($('swatchName'))$('swatchName').textContent=`${color.name||'Color A'} · ${hex}`;
  if($('tonalColorMeta'))$('tonalColorMeta').textContent=`${color.code||hex}${color.source?' · '+color.source:''}`;
  if($('colorALabel'))$('colorALabel').textContent=color.code||'Selección tonal';
  if($('colorAName'))$('colorAName').textContent=color.name||hex;
  if($('activeColorFooter'))$('activeColorFooter').textContent=`Color A activo: ${color.name||'Color'} · ${color.code||hex} · ${hex}`;
  updateMixer();
}
function activateColorB(color){
  if(!color||!/^#[0-9A-F]{6}$/i.test(color.hex||''))return;
  const hex=String(color.hex).toUpperCase();
  MIX_COLOR_B={...color,hex};
  if($('colorB'))$('colorB').value=hex;
  if($('colorBLabel'))$('colorBLabel').textContent=color.code||'Selección catálogo';
  if($('colorBName'))$('colorBName').textContent=color.name||hex;
  updateMixer();
}
function rgbDistanceHex(h1,h2){
  const a=hexRgb(h1),b=hexRgb(h2); return Math.sqrt((a.r-b.r)**2+(a.g-b.g)**2+(a.b-b.b)**2);
}
function nearestCatalogColor(hex){
  let best=null,bestD=Infinity;
  for(const c of PAINT_CATALOG){
    if(!c.codigo_hex)continue;
    const d=rgbDistanceHex(hex,c.codigo_hex);
    if(d<bestD){bestD=d;best=c;if(d===0)break;}
  }
  return best?{color:best,distance:bestD}:null;
}
function recipeEntries(){return Object.values(RECIPES).filter(r=>r&&r.hex&&Array.isArray(r.tints));}
function recipeForMeta(meta){
  const list=recipeEntries(); if(!list.length)return null;
  const exact=list.find(r=>String(r.hex).toUpperCase()===String(meta?.hex||'').toUpperCase() || norm(r.code||'')===norm(meta?.code||'') || norm(r.name||'')===norm(meta?.name||''));
  if(exact)return{recipe:exact,exact:true,distance:0};
  if(!meta?.hex)return null;
  let best=null,bestD=Infinity;
  list.forEach(r=>{const d=rgbDistanceHex(meta.hex,r.hex);if(d<bestD){bestD=d;best=r;}});
  return best?{recipe:best,exact:false,distance:bestD}:null;
}
function buildMixedTintFormula(percentA,liters){
  const a=recipeForMeta(MIX_COLOR_A),b=recipeForMeta(MIX_COLOR_B);
  if(!a&&!b)return{rows:[],mode:'none',source:'No hay recetas base disponibles.'};
  const fa=percentA/100,fb=1-fa,map=new Map();
  const add=(info,factor)=>{
    if(!info||factor<=0)return;
    info.recipe.tints.forEach(t=>{
      const key=norm(t.name||'entonador');
      const prev=map.get(key)||{name:t.name||'Entonador',hex:t.hex||'#777777',ml:0};
      prev.ml+=(Number(t.ml)||0)*liters*factor; map.set(key,prev);
    });
  };
  add(a,fa); add(b,fb);
  const rows=[...map.values()].filter(x=>x.ml>.001).sort((x,y)=>y.ml-x.ml);
  const total=rows.reduce((s,x)=>s+x.ml,0);
  rows.forEach(x=>x.pct=total?x.ml/total*100:0);
  const exactA=a?.exact||false,exactB=b?.exact||false;
  const mode=(a&&b&&exactA&&exactB)?'exact-combination':'estimated';
  const srcA=a?`${a.recipe.name}${a.exact?'':' (aprox.)'}`:'sin fórmula';
  const srcB=b?`${b.recipe.name}${b.exact?'':' (aprox.)'}`:'sin fórmula';
  return{rows,mode,source:`A: ${srcA} · B: ${srcB}`};
}
function renderMixAnalysis(mixed,p){
  const near=nearestCatalogColor(mixed);
  if($('mixResultName'))$('mixResultName').textContent=near?near.color.nombre_color:'Sin nombre de catálogo';
  if($('mixResultCode'))$('mixResultCode').textContent=near?`${near.color.codigo_comercial} · ${near.distance<0.5?'coincidencia exacta':'tono más cercano'}`:'Catálogo no cargado';
  const liters=Number($('mixVolume')?.value||$('base')?.value||4);
  const formula=buildMixedTintFormula(p,liters);
  if($('mixFormulaSource'))$('mixFormulaSource').textContent=near?`${near.color.nombre_color} · ${near.color.codigo_comercial} · ${mixed}`:`Resultado ${mixed}`;
  const host=$('mixFormulaRows');
  if(host){
    host.innerHTML=formula.rows.length?formula.rows.map(t=>`<div class="mix-formula-row"><span><i class="dot" style="background:${escapeHtml(t.hex)}"></i>${escapeHtml(t.name)}</span><strong>${t.ml.toFixed(1)} ml · ${t.pct.toFixed(1)}%</strong></div>`).join(''):'<div class="small">No hay datos suficientes para calcular entonadores.</div>';
  }
  if($('mixFormulaNote')){
    $('mixFormulaNote').textContent=formula.mode==='exact-combination'
      ?`Preparación combinada a partir de fórmulas cargadas (${formula.source}). Recalcular y probar antes de producción.`
      :`Preparación orientativa basada en las recetas ColorLab más cercanas (${formula.source}). Para producción comercial debe calibrarse con pigmentos y base reales.`;
  }
}

function findRecipe(){
  const input=$('search'), out=$('recipe');
  const q=norm(input?.value||'');
  const liters=parseFloat($('base')?.value||4);
  const catalog=$('tonalCatalog')?.value||'todos';
  const baseType=$('tonalBaseType')?.value||'latex';
  if(!q){out.textContent='Ingresá un nombre, código o HEX.';return;}

  const recipeEntry=Object.entries(RECIPES).find(([k,r])=>{
    const hay=norm(`${k} ${r.name||''} ${r.code||''} ${r.hex||''}`);
    return hay.includes(q);
  });
  const technical=PAINT_CATALOG.find(c=>norm(`${c.codigo_comercial} ${c.nombre_color} ${c.codigo_hex}`).includes(q));
  const useRecipe=(catalog==='recetas' || catalog==='todos') && recipeEntry;
  const useTechnical=(catalog==='tecnico' || catalog==='todos') && technical;

  if(useRecipe){
    const r=recipeEntry[1];
    out.replaceChildren();
    const head=document.createElement('p');
    head.innerHTML=`<strong>${escapeHtml(r.name)}</strong> · ${escapeHtml(r.code)} · ${escapeHtml(r.hex.toUpperCase())}<br><span class="small">Base: ${baseType==='acrilico'?'Acrílico':'Látex'} · Envase: ${liters} L</span>`;
    out.append(head);
    const quantities=r.tints.map(t=>({...t,calcMl:t.ml*liters}));
    const total=quantities.reduce((sum,t)=>sum+t.calcMl,0);
    quantities.forEach(t=>{
      const pct=total>0?t.calcMl/total*100:0;
      const d=document.createElement('div');
      d.className='tint';
      d.innerHTML=`<span><i class="dot" style="background:${t.hex}"></i>${escapeHtml(t.name)}</span><strong>${t.calcMl.toFixed(0)} ml · ${pct.toFixed(1)}%</strong>`;
      out.append(d);
    });
    const totalRow=document.createElement('p');
    totalRow.innerHTML=`<strong>Total de entonadores:</strong> ${total.toFixed(0)} ml para ${liters} L.`;
    out.append(totalRow);
    activateColorA({name:r.name,code:r.code,hex:r.hex,source:'Receta ColorLab'});
    return;
  }

  if(useTechnical){
    out.innerHTML=`<p><strong>${escapeHtml(technical.nombre_color)}</strong> · ${escapeHtml(technical.codigo_comercial)}</p><p>HEX ${escapeHtml(technical.codigo_hex)} · RGB(${technical.rgb_r}, ${technical.rgb_g}, ${technical.rgb_b})</p><p class="small">Este tono tiene equivalencia técnica en el catálogo, pero no posee una fórmula de entonadores cargada. El Color A sí se actualizó para usarlo en el mezclador.</p>`;
    activateColorA({name:technical.nombre_color,code:technical.codigo_comercial,hex:technical.codigo_hex,source:'Catálogo técnico'});
    selectCatalogColor(technical,false);
    return;
  }

  out.textContent='No se encontró el color en el catálogo seleccionado.';
  if($('swatch'))$('swatch').style.background='#fff';
  if($('swatchName'))$('swatchName').textContent='Color no encontrado';
  if($('tonalColorMeta'))$('tonalColorMeta').textContent='Probá otro nombre, código o HEX.';
}
function hexRgb(h){h=h.replace('#','');return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)}}
function rgbHex(r,g,b){return'#'+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('').toUpperCase()}
function updateMixer(){const a=$('colorA').value,b=$('colorB').value,p=parseInt($('ratio').value,10),ra=hexRgb(a),rb=hexRgb(b),fa=p/100,fb=1-fa,m=rgbHex(ra.r*fa+rb.r*fb,ra.g*fa+rb.g*fb,ra.b*fa+rb.b*fb);$('bowl').style.background=m;$('streamA').style.background=a;$('streamB').style.background=b;$('streamA').style.opacity=Math.max(.15,fa);$('streamB').style.opacity=Math.max(.15,fb);$('ratioLabel').textContent=`${p}% A / ${100-p}% B`;$('hex').textContent=m;renderMixAnalysis(m,p);}
let n=0;
function addRoom(vals={}){
  n++;
  const o=CFG.openings||{};
  const d=document.createElement('div');
  d.className='room';
  d.innerHTML=`<div class="room-head"><h3>Ambiente ${n}</h3><button type="button" class="danger remove">Eliminar</button></div>
  <div class="room-grid">
    <div class="field"><label>Nombre</label><input class="name" value="${vals.name||'Ambiente '+n}"></div>
    <div class="field"><label>Largo (m)</label><input class="length" type="number" step="0.01" min="0.01" value="${vals.length||''}"></div>
    <div class="field"><label>Ancho (m)</label><input class="width" type="number" step="0.01" min="0.01" value="${vals.width||''}"></div>
    <div class="field"><label>Alto (m)</label><input class="height" type="number" step="0.01" min="0.01" value="${vals.height||2.4}"></div>
    <div class="field"><label>Puertas</label><input class="doors" type="number" min="0" step="1" value="${vals.doors??1}"></div>
    <div class="field"><label>Ancho puerta (m)</label><input class="door-width" type="number" min="0.1" step="0.01" value="${vals.doorWidth??o.door_width??0.8}"></div>
    <div class="field"><label>Alto puerta (m)</label><input class="door-height" type="number" min="0.1" step="0.01" value="${vals.doorHeight??o.door_height??2}"></div>
    <div class="field"><label>Ventanas</label><input class="windows" type="number" min="0" step="1" value="${vals.windows??1}"></div>
    <div class="field"><label>Ancho ventana (m)</label><input class="window-width" type="number" min="0.1" step="0.01" value="${vals.windowWidth??o.window_width??1.2}"></div>
    <div class="field"><label>Alto ventana (m)</label><input class="window-height" type="number" min="0.1" step="0.01" value="${vals.windowHeight??o.window_height??1.2}"></div>
    <div class="field room-color-field"><label>Color de pintura</label><select class="room-color"><option value="">Sin color asignado</option></select></div>
  </div>`;
  $('rooms').append(d);
  fillRoomColorSelect(d.querySelector('.room-color'));
  d.querySelector('.remove').onclick=()=>{if($('rooms').children.length>1)d.remove();};
}
function projectType(){
  if($('project').value==='single'){
    while($('rooms').children.length>1)$('rooms').lastElementChild.remove();
    $('addRoom').style.display='none';
  } else $('addRoom').style.display='';
}
function money(v){return new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(v)||0)}
function collectRooms(){
  return [...document.querySelectorAll('.room')].map(c=>({
    nombre:c.querySelector('.name').value.trim()||'Ambiente',
    largo:parseFloat(c.querySelector('.length').value),
    ancho:parseFloat(c.querySelector('.width').value),
    alto:parseFloat(c.querySelector('.height').value),
    puertas:parseInt(c.querySelector('.doors').value||0,10),
    ancho_puerta:parseFloat(c.querySelector('.door-width').value),
    alto_puerta:parseFloat(c.querySelector('.door-height').value),
    ventanas:parseInt(c.querySelector('.windows').value||0,10),
    ancho_ventana:parseFloat(c.querySelector('.window-width').value),
    alto_ventana:parseFloat(c.querySelector('.window-height').value),
    color_catalogo_id:parseInt(c.querySelector('.room-color')?.value||0,10)||null
  }));
}
function renderBudget(data){
  const t=data.totales,c=data.costos;
  const rows=data.ambientes.map(a=>`<tr>
    <td>${escapeHtml(a.nombre)}</td><td>${a.color_catalogo?`<span class="budget-color-dot" style="background:${a.color_catalogo.codigo_hex}"></span>${escapeHtml(a.color_catalogo.codigo_comercial)} · ${escapeHtml(a.color_catalogo.nombre_color)}`:'—'}</td><td>${a.pared_bruta_m2.toFixed(2)}</td><td>${a.aberturas_m2.toFixed(2)}</td>
    <td>${a.pared_neta_m2.toFixed(2)}</td><td>${a.latex_litros.toFixed(2)}</td><td>${a.sintetico_litros.toFixed(2)}</td>
    <td>${money(a.subtotal_materiales)}</td><td>${money(a.subtotal_mano_obra)}</td><td>${money(a.subtotal)}</td>
  </tr>`).join('');
  $('budget').innerHTML=`<div class="summary">
    <div><div class="small">Pared neta</div><strong>${t.pared_neta_m2.toFixed(2)} m²</strong></div>
    <div><div class="small">Látex</div><strong>${t.latex_litros.toFixed(2)} L</strong></div>
    <div><div class="small">Sintético</div><strong>${t.sintetico_litros.toFixed(2)} L</strong></div>
    <div class="total"><div class="small budget-total-label">Presupuesto final</div><strong>${money(c.presupuesto_final)}</strong></div>
  </div>
  <div class="summary">
    <div><div class="small">Aberturas descontadas</div><strong>${t.aberturas_m2.toFixed(2)} m²</strong></div>
    <div><div class="small">Materiales calculados</div><strong>${money(c.material_calculado)}</strong></div>
    <div><div class="small">Gastos adicionales</div><strong>${money(c.gastos_adicionales)}</strong></div>
    <div><div class="small">Mano de obra</div><strong>${money(c.mano_obra)}</strong></div>
  </div>
  <div class="budget-table-wrap"><table class="budget-table"><thead><tr>
    <th>Ambiente</th><th>Color</th><th>Pared bruta m²</th><th>Aberturas m²</th><th>Pared neta m²</th>
    <th>Látex L</th><th>Sintético L</th><th>Materiales</th><th>Mano de obra</th><th>Subtotal</th>
  </tr></thead><tbody>${rows}</tbody></table></div>`;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
async function calc(){
  const rooms=collectRooms();
  if(rooms.some(r=>!(r.largo>0&&r.ancho>0&&r.alto>0))){alert('Completá largo, ancho y alto en todos los ambientes.');return;}
  const btn=$('calc'); btn.disabled=true; btn.textContent='Calculando...';
  $('budget').innerHTML='<div class="budget-loading">Calculando presupuesto en PHP...</div>';
  try{
    const res=await fetch(CFG.api||'api.php',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        action:'calcular_presupuesto',
        ambientes:rooms,
        incluir_sintetico:$('synthetic').checked,
        gastos_materiales:parseFloat($('extraMaterials').value||0),
        precios:{
          latex_litro:parseFloat($('priceLatex').value||0),
          sintetico_litro:parseFloat($('priceSynthetic').value||0),
          mano_obra_latex_m2:parseFloat($('priceLabor').value||0),
          mano_obra_sintetico_m2:parseFloat($('priceSyntheticLabor').value||0)
        }
      })
    });
    const json=await res.json();
    if(!res.ok||!json.ok)throw new Error(json.mensaje||'No se pudo calcular el presupuesto.');
    renderBudget(json.data);
    emitAppEvent('budget:generated', json.data);
  }catch(err){
    $('budget').innerHTML=`<div class="budget-error">${escapeHtml(err.message||'Error al calcular.')}</div>`;
  }finally{
    btn.disabled=false; btn.textContent='Calcular presupuesto completo';
  }
}
$('catalogSearch')?.addEventListener('input',renderCatalog);$('catalogCategory')?.addEventListener('change',renderCatalog);$('catalogFamily')?.addEventListener('change',renderCatalog);loadPaintCatalog();
$('find').onclick=findRecipe;$('base').onchange=()=>{if($('search').value.trim())findRecipe();updateMixer()};$('mixVolume')?.addEventListener('change',updateMixer);$('tonalBaseType')?.addEventListener('change',()=>{if($('search').value.trim())findRecipe()});$('tonalCatalog')?.addEventListener('change',()=>{if($('search').value.trim())findRecipe()});$('search').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();findRecipe()}};$('ratio').oninput=updateMixer;$('colorA').addEventListener('input',()=>{const h=$('colorA').value.toUpperCase();MIX_COLOR_A={name:'Color A manual',code:h,hex:h,source:'Manual'};if($('swatch'))$('swatch').style.background=h;if($('swatchName'))$('swatchName').textContent=`Color A manual · ${h}`;if($('tonalColorMeta'))$('tonalColorMeta').textContent='Selección manual del mezclador';if($('colorALabel'))$('colorALabel').textContent='Manual';if($('colorAName'))$('colorAName').textContent=h;if($('activeColorFooter'))$('activeColorFooter').textContent=`Color A activo: Manual · ${h}`;updateMixer();});$('colorB').addEventListener('input',()=>{const h=$('colorB').value.toUpperCase();MIX_COLOR_B={name:'Color B manual',code:h,hex:h,source:'Manual'};if($('colorBLabel'))$('colorBLabel').textContent='Manual';if($('colorBName'))$('colorBName').textContent=h;updateMixer();});$('chooseCatalogA')?.addEventListener('click',()=>{if($('catalogMixTarget'))$('catalogMixTarget').value='A';$('catalogoColoresCard')?.scrollIntoView({behavior:'smooth',block:'start'});});$('chooseCatalogB')?.addEventListener('click',()=>{if($('catalogMixTarget'))$('catalogMixTarget').value='B';$('catalogoColoresCard')?.scrollIntoView({behavior:'smooth',block:'start'});});$('addRoom').onclick=()=>addRoom({height:2.4,doors:1,windows:1});$('project').onchange=projectType;$('calc').onclick=calc;addRoom({name:'Habitación Principal',height:2.4,doors:1,windows:1});projectType();if($('search'))$('search').value='Vainilla';findRecipe();activateColorB(MIX_COLOR_B);updateMixer();

// ===== Pintar una foto =====
const photoPaint={
  canvas:null,
  ctx:null,
  original:null,
  history:[],
  selected:{name:'Color activo del catálogo',hex:'#FFFFFF'},
  cameraStream:null
};
function paintDist(a,b){const dr=a[0]-b[0],dg=a[1]-b[1],db=a[2]-b[2];return Math.sqrt(dr*dr+dg*dg+db*db)}
function paintHexRgb(h){h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
function loadPaintImage(im){
  const max=1600,scale=Math.min(1,max/Math.max(im.width,im.height));
  const c=photoPaint.canvas;
  c.width=Math.max(1,Math.round(im.width*scale));
  c.height=Math.max(1,Math.round(im.height*scale));
  photoPaint.ctx.clearRect(0,0,c.width,c.height);
  photoPaint.ctx.drawImage(im,0,0,c.width,c.height);
  photoPaint.original=photoPaint.ctx.getImageData(0,0,c.width,c.height);
  photoPaint.history=[];
  $('paintStage').classList.add('has-photo');
  $('paintUndo').disabled=true;
  $('paintReset').disabled=false;
}
function loadPaintPhoto(file){
  if(!file)return;
  const rd=new FileReader();
  rd.onload=()=>{const im=new Image();im.onload=()=>loadPaintImage(im);im.src=rd.result};
  rd.readAsDataURL(file);
}
function savePaintHistory(){if(!photoPaint.ctx)return;photoPaint.history.push(photoPaint.ctx.getImageData(0,0,photoPaint.canvas.width,photoPaint.canvas.height));if(photoPaint.history.length>8)photoPaint.history.shift();$('paintUndo').disabled=false}
function paintWallAt(ev){if(!photoPaint.original||!photoPaint.ctx)return;const c=photoPaint.canvas,r=c.getBoundingClientRect();const clientX=ev.clientX??ev.touches?.[0]?.clientX,clientY=ev.clientY??ev.touches?.[0]?.clientY;if(clientX==null||clientY==null)return;const x=Math.max(0,Math.min(c.width-1,Math.floor((clientX-r.left)*c.width/r.width))),y=Math.max(0,Math.min(c.height-1,Math.floor((clientY-r.top)*c.height/r.height)));const img=photoPaint.ctx.getImageData(0,0,c.width,c.height),d=img.data,idx=(y*c.width+x)*4,seed=[d[idx],d[idx+1],d[idx+2]];if(seed[0]<28&&seed[1]<28&&seed[2]<28)return;savePaintHistory();const target=paintHexRgb(photoPaint.selected.hex),visited=new Uint8Array(c.width*c.height),queue=new Int32Array(c.width*c.height),threshold=48;let head=0,tail=0;queue[tail++]=y*c.width+x;visited[y*c.width+x]=1;while(head<tail){const p=queue[head++],px=p%c.width,i=p*4,current=[d[i],d[i+1],d[i+2]];if(paintDist(current,seed)>threshold)continue;const lum=(current[0]*.2126+current[1]*.7152+current[2]*.0722)/255;const shade=.45+.72*lum;d[i]=Math.min(255,target[0]*shade);d[i+1]=Math.min(255,target[1]*shade);d[i+2]=Math.min(255,target[2]*shade);const ns=[p-1,p+1,p-c.width,p+c.width];for(const n of ns){if(n<0||n>=c.width*c.height||visited[n])continue;const nx=n%c.width;if((n===p-1||n===p+1)&&Math.abs(nx-px)!==1)continue;visited[n]=1;queue[tail++]=n}}photoPaint.ctx.putImageData(img,0,0)}
function undoPaint(){const prev=photoPaint.history.pop();if(!prev)return;photoPaint.ctx.putImageData(prev,0,0);$('paintUndo').disabled=photoPaint.history.length===0}
function resetPaint(){if(!photoPaint.original)return;photoPaint.ctx.putImageData(photoPaint.original,0,0);photoPaint.history=[];$('paintUndo').disabled=true}
function stopPaintCamera(){
  if(photoPaint.cameraStream){photoPaint.cameraStream.getTracks().forEach(t=>t.stop());photoPaint.cameraStream=null}
  const video=$('paintCameraVideo');if(video)video.srcObject=null;
  const panel=$('paintCameraPanel');if(panel)panel.hidden=true;
}
async function startPaintCamera(){
  const panel=$('paintCameraPanel'),video=$('paintCameraVideo'),status=$('paintCameraStatus');
  if(!navigator.mediaDevices?.getUserMedia){if(status)status.textContent='La cámara no está disponible en este navegador.';if(panel)panel.hidden=false;return}
  stopPaintCamera();
  if(panel)panel.hidden=false;
  if(status)status.textContent='Solicitando permiso para usar la cámara…';
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});
    photoPaint.cameraStream=stream;
    video.srcObject=stream;
    await video.play();
    if(status)status.textContent='Cámara lista. Encuadrá la habitación y presioná “Capturar foto”.';
  }catch(err){
    if(status)status.textContent=`No se pudo abrir la cámara: ${err.message||'permiso rechazado'}. En PC usá localhost/HTTPS y permití el acceso a la cámara.`;
  }
}
function capturePaintCamera(){
  const video=$('paintCameraVideo'),status=$('paintCameraStatus');
  if(!video||!photoPaint.cameraStream||!video.videoWidth||!video.videoHeight){if(status)status.textContent='La cámara todavía no está lista.';return}
  const shot=document.createElement('canvas');shot.width=video.videoWidth;shot.height=video.videoHeight;
  shot.getContext('2d').drawImage(video,0,0,shot.width,shot.height);
  const im=new Image();
  im.onload=()=>{loadPaintImage(im);stopPaintCamera()};
  im.src=shot.toDataURL('image/jpeg',.92);
}
function initPhotoPainter(){
  photoPaint.canvas=$('paintCanvas');if(!photoPaint.canvas)return;
  photoPaint.ctx=photoPaint.canvas.getContext('2d',{willReadFrequently:true});
  $('paintPhotoInput').onchange=e=>loadPaintPhoto(e.target.files?.[0]);
  $('paintCameraStart')?.addEventListener('click',startPaintCamera);
  $('paintCameraCapture')?.addEventListener('click',capturePaintCamera);
  $('paintCameraCancel')?.addEventListener('click',stopPaintCamera);
  $('paintChooseCatalog')?.addEventListener('click',()=>document.getElementById('catalogGrid')?.scrollIntoView({behavior:'smooth',block:'center'}));
  $('paintCanvas').addEventListener('click',paintWallAt);
  $('paintUndo').onclick=undoPaint;
  $('paintReset').onclick=resetPaint;
  window.addEventListener('pagehide',stopPaintCamera);
}
initPhotoPainter();


/* ===== Cotizador regional integrado por zona y servicio ===== */
const COLORLAB_SERVICES=[
{name:'Revoque tarquini',unit:'m2',min:7413.11,max:39296.12},{name:'Colocación empapelado',unit:'m2',min:7840,max:9856},{name:'Pintura de piscinas',unit:'m2',min:59574.77,max:259045},{name:'Impermeabilización de techos',unit:'m2',min:12974.02,max:77116.71},{name:'Colocación de membranas',unit:'m2',min:13793.88,max:25232.88},{name:'Colocación de revestimientos plásticos',unit:'m2',min:4254.75,max:14549.67},{name:'Colocación de revestimientos cementícios',unit:'m2',min:11368.06,max:43909.05},{name:'Pintura en altura',unit:'m2',min:33067.54,max:26671.69},{name:'Jornal de Pintor por reparaciones varias',unit:'dia',min:81991.84,max:145705.57},{name:'Pintura cielo raso',unit:'m2',min:5016.30,max:12496.95},{name:'Remoción empapelado',unit:'m2',min:12407,max:21195.31},{name:'Reparacion de paredes',unit:'m2',min:8307.96,max:29371.96},{name:'Pintura epoxica',unit:'m2',min:9115.64,max:15690.31},{name:'Pintura sintética',unit:'m2',min:6720,max:18400},{name:'Pintura exterior',unit:'m2',min:5600,max:11200},{name:'Pintura interior',unit:'m2',min:5584,max:17642}
];
/* Coeficientes regionales ColorLab: CABA=base. Son parámetros editables, no tarifas oficiales. */
const COLORLAB_ZONE_FACTORS={
 'Ciudad de Buenos Aires':1.00,'Zona Norte Gran Buenos Aires':1.06,'Zona Sur Gran Buenos Aires':0.94,'Zona Oeste Gran Buenos Aires':0.92,'La Plata':0.95,'Zarate - Campana':0.98,'Rosario':0.88,'Mar del Plata':0.93,'Cordoba':0.90
};
const quoteMoney=new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',minimumFractionDigits:2,maximumFractionDigits:2});
function quoteBaseRange(s){return{min:Math.min(s.min,s.max),max:Math.max(s.min,s.max)}}
function quoteZoneRange(s,zone){const b=quoteBaseRange(s),f=COLORLAB_ZONE_FACTORS[zone]||1;return{min:b.min*f,max:b.max*f,factor:f}}
function quoteSuggested(r){
 /* Si el rango intersecta $5.000-$12.000, prioriza un sugerido dentro de esa banda; si no, usa punto medio. */
 const lo=Math.max(r.min,5000),hi=Math.min(r.max,12000);
 return lo<=hi ? (lo+hi)/2 : (r.min+r.max)/2;
}
function initServiceQuote(){
 const sel=$('quoteService'),zoneSel=$('quoteZone'); if(!sel||!zoneSel)return;
 COLORLAB_SERVICES.forEach((s,i)=>{const r=quoteBaseRange(s),o=document.createElement('option'),u=s.unit==='dia'?'día':'m²';o.value=i;o.textContent=`${s.name} — base ${quoteMoney.format(r.min)} a ${quoteMoney.format(r.max)} / ${u}`;sel.appendChild(o)});
 const recalc=()=>{
   if(sel.value===''){$('quoteQuantityWrap').hidden=true;$('quoteUnitRange').hidden=true;$('quoteResult').hidden=true;return}
   const s=COLORLAB_SERVICES[Number(sel.value)],zone=zoneSel.value,r=quoteZoneRange(s,zone),suggested=quoteSuggested(r),q=Number($('quoteQuantity').value),unit=s.unit==='dia'?'día':'m²';
   $('quoteQuantityWrap').hidden=false;$('quoteUnitRange').hidden=false;
   $('quoteQuantityLabel').textContent=s.unit==='dia'?'Días de trabajo':'Metros cuadrados (m²)';$('quoteQuantity').step=s.unit==='dia'?'1':'0.01';$('quoteQuantity').min=s.unit==='dia'?'1':'0.01';$('quoteQuantity').placeholder=s.unit==='dia'?'Ej: 2':'Ej: 50';
   $('quoteUnitText').textContent=zone?`${quoteMoney.format(r.min)} · sugerido ${quoteMoney.format(suggested)} · ${quoteMoney.format(r.max)} por ${unit}`:`Elegí una zona para aplicar el precio regional.`;
   if(!(q>0)||!zone){$('quoteResult').hidden=true;return}
   $('quoteMin').textContent=quoteMoney.format(r.min*q);$('quoteSuggested').textContent=quoteMoney.format(suggested*q);$('quoteMax').textContent=quoteMoney.format(r.max*q);
   $('quoteDetail').textContent=`${s.name} · ${q.toLocaleString('es-AR')} ${s.unit==='dia'?(q===1?'día':'días'):'m²'} · ${zone}`;
   $('quoteZoneNote').textContent=`Precio sugerido ColorLab: ${quoteMoney.format(suggested)} por ${unit}. Referencia orientativa según zona; puede variar por estado de superficie, preparación, altura, acceso y complejidad.`;
   $('quoteResult').hidden=false;
 };
 sel.addEventListener('change',()=>{$('quoteQuantity').value='';recalc()});zoneSel.addEventListener('change',recalc);$('quoteQuantity').addEventListener('input',recalc);
 $('quoteContinue').addEventListener('click',()=>{
   const zone=zoneSel.value,locality=$('quoteLocality').value.trim();if(!zone){alert('Seleccioná una zona de referencia.');zoneSel.focus();return}if(sel.value===''){alert('Seleccioná un servicio de pintura.');sel.focus();return}
   const q=Number($('quoteQuantity').value);if(!(q>0)){alert('Ingresá una cantidad válida.');$('quoteQuantity').focus();return}
   const s=COLORLAB_SERVICES[Number(sel.value)],r=quoteZoneRange(s,zone),suggested=quoteSuggested(r);
   window.COLORLAB_SERVICE_QUOTE={zone,locality,service:s.name,unit:s.unit,quantity:q,zoneFactor:r.factor,unitMin:r.min,unitSuggested:suggested,unitMax:r.max,totalMin:r.min*q,totalSuggested:suggested*q,totalMax:r.max*q};
   $('quoteStatus').textContent=`Cotización preparada: ${s.name} · sugerido ${quoteMoney.format(suggested*q)} (${quoteMoney.format(r.min*q)} a ${quoteMoney.format(r.max*q)}).`;
   /* Entrelaza con el cotizador general mediante estado global + evento para presupuesto formal/PDF. */
   window.dispatchEvent(new CustomEvent('colorlab:serviceQuote',{detail:window.COLORLAB_SERVICE_QUOTE}));$('rooms')?.scrollIntoView({behavior:'smooth',block:'start'});
 });
}
initServiceQuote();
