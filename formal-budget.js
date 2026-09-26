'use strict';

(() => {
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'colorlab.formalBudget.parties.v1';
  const LOGO_STORAGE_KEY = 'colorlab.formalBudget.logo.v1';

  const state = {
    prestador: { nombre: '', cuit: '', domicilio: '', telefono: '' },
    consorcio: { edificio: '', direccion: '', localidad: '' },
    modelo: { nombre: '', descripcion: '', volquetes: '', andamios: '', materiales: '', total: '' },
    condiciones: {
      plazo: 'El trabajo completo será realizado en un período estimado de entre 5 y 7 días hábiles.',
      validez: '30 días a partir de la fecha de emisión.',
      garantia: 'Todo el trabajo estructural y de pintura cuenta con garantía de aplicación profesional.'
    },
    branding: { logoDataUrl: '', logoName: '', width: 0, height: 0 },
    modelos: []
  };

  window.FormalBudgetForm = state;

  const bindings = {
    prestadorNombre: ['prestador', 'nombre'], prestadorCuit: ['prestador', 'cuit'],
    prestadorDomicilio: ['prestador', 'domicilio'], prestadorTelefono: ['prestador', 'telefono'],
    consorcioEdificio: ['consorcio', 'edificio'], consorcioDireccion: ['consorcio', 'direccion'],
    consorcioLocalidad: ['consorcio', 'localidad'], modeloDescripcion: ['modelo', 'descripcion'],
    modeloVolquetes: ['modelo', 'volquetes'], modeloAndamios: ['modelo', 'andamios'],
    modeloMateriales: ['modelo', 'materiales'], modeloTotal: ['modelo', 'total'],
    condPlazo: ['condiciones', 'plazo'], condValidez: ['condiciones', 'validez'],
    condGarantia: ['condiciones', 'garantia']
  };

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }

  function money(v) {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return '-';
    return new Intl.NumberFormat('es-AR', {style:'currency', currency:'ARS', maximumFractionDigits:2}).format(n);
  }

  function setStatus(text, type='') {
    const el = $('formalExportStatus');
    if (!el) return;
    el.textContent = text || '';
    el.dataset.type = type;
  }

  function saveParties() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({prestador:state.prestador, consorcio:state.consorcio}));
  }

  function loadParties() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.prestador) Object.assign(state.prestador, saved.prestador);
      if (saved?.consorcio) Object.assign(state.consorcio, saved.consorcio);
    } catch (_) {}
  }

  function saveLogo() {
    try {
      if (!state.branding.logoDataUrl) { localStorage.removeItem(LOGO_STORAGE_KEY); return; }
      const payload = JSON.stringify(state.branding);
      if (payload.length < 1_500_000) localStorage.setItem(LOGO_STORAGE_KEY, payload);
    } catch (_) {}
  }

  function loadLogo() {
    try {
      const raw = localStorage.getItem(LOGO_STORAGE_KEY); if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.logoDataUrl?.startsWith('data:image/')) Object.assign(state.branding, saved);
    } catch (_) {}
  }

  function syncInputsFromState() {
    Object.entries(bindings).forEach(([id,[group,key]]) => { const el=$(id); if(el) el.value=state[group][key] ?? ''; });
  }

  function updateLogoControls() {
    const wrap=$('formalLogoPreviewWrap'), img=$('formalLogoPreview'), name=$('formalLogoName'), remove=$('removeFormalLogo');
    const has=Boolean(state.branding.logoDataUrl);
    if (wrap) wrap.hidden=!has;
    if (img) img.src=has ? state.branding.logoDataUrl : '';
    if (name) name.textContent=has ? state.branding.logoName : '';
    if (remove) remove.disabled=!has;
  }

  function renderPreview() {
    const host=$('formalPreview'); if(!host) return;
    const logo = state.branding.logoDataUrl
      ? `<div class="formal-preview-logo"><img src="${state.branding.logoDataUrl}" alt="Logo de la empresa"></div>` : '';
    host.innerHTML = `
      <div class="formal-preview-header">${logo}<div class="formal-preview-title">PRESUPUESTO FORMAL</div></div>
      <div class="formal-preview-parties">
        <div><strong>PRESTADOR:</strong><span>Nombre: ${esc(state.prestador.nombre)||'________________'}</span><span>CUIT: ${esc(state.prestador.cuit)||'________________'}</span><span>Domicilio: ${esc(state.prestador.domicilio)||'________________'}</span><span>Teléfono: ${esc(state.prestador.telefono)||'________________'}</span></div>
        <div><strong>CONSORCIO DESTINATARIO:</strong><span>Edificio: ${esc(state.consorcio.edificio)||'________________'}</span><span>Dirección: ${esc(state.consorcio.direccion)||'________________'}</span><span>Localidad: ${esc(state.consorcio.localidad)||'________________'}</span></div>
      </div>
      <div class="formal-preview-section-title">Detalle de las Tareas</div>
      <div class="formal-preview-table"><div class="formal-preview-th">Descripción del Trabajo / Servicio</div><div class="formal-preview-th">Total</div><div class="formal-preview-cell"><strong>${esc(state.modelo.nombre)||'Modelo / servicio'}</strong><div>${esc(state.modelo.descripcion)||'Descripción pendiente de completar.'}</div>${state.modelo.volquetes?`<div><b>Volquetes:</b> ${esc(state.modelo.volquetes)}</div>`:''}${state.modelo.andamios?`<div><b>Andamios:</b> ${esc(state.modelo.andamios)}</div>`:''}${state.modelo.materiales?`<div><b>Materiales:</b> ${esc(state.modelo.materiales)}</div>`:''}</div><div class="formal-preview-cell formal-preview-money">${money(state.modelo.total)}</div></div>
      <div class="formal-preview-section-title">Condiciones Comerciales</div>
      <ul class="formal-preview-conditions"><li><b>Plazo de ejecución:</b> ${esc(state.condiciones.plazo)}</li><li><b>Validez de la oferta:</b> ${esc(state.condiciones.validez)}</li><li><b>Garantía:</b> ${esc(state.condiciones.garantia)}</li></ul>
      <div class="formal-signatures"><div><div class="signature-line"></div><strong>${esc(state.prestador.nombre)||'Prestador'}</strong><span>Firma del Prestador</span></div><div><div class="signature-line"></div><strong>Administración del Consorcio</strong><span>Firma de Conformidad</span></div></div>`;
  }

  function pdfSafeName() {
    const base=(state.consorcio.edificio||state.consorcio.direccion||'presupuesto').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
    return `Presupuesto_${base||'ColorLab'}.pdf`;
  }

  function splitPdfText(doc,text,width){ return doc.splitTextToSize(String(text||''),width); }

  function addPdfLogo(doc, pageW, margin) {
    if (!state.branding.logoDataUrl) return;
    const iw=Number(state.branding.width)||1, ih=Number(state.branding.height)||1;
    const maxW=38, maxH=22, ratio=Math.min(maxW/iw,maxH/ih);
    const w=iw*ratio, h=ih*ratio;
    const format=state.branding.logoDataUrl.startsWith('data:image/jpeg')?'JPEG':'PNG';
    try { doc.addImage(state.branding.logoDataUrl, format, pageW-margin-w, 10, w, h, undefined, 'FAST'); } catch(e) { console.warn('Logo PDF:',e); }
  }

  async function buildPdfBlob() {
    if (!window.jspdf?.jsPDF) throw new Error('PDF_LIB_UNAVAILABLE');
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
    const pageW=210, margin=16, contentW=pageW-margin*2; let y=18;
    const ensure=(needed=12)=>{if(y+needed>282){doc.addPage();y=18;}};
    const line=(x1,y1,x2,y2)=>doc.line(x1,y1,x2,y2);

    addPdfLogo(doc,pageW,margin);
    doc.setTextColor(23,55,94); doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.text('PRESUPUESTO FORMAL',margin,y); y+=14;
    doc.setTextColor(30,30,30); doc.setFontSize(10);
    const colGap=10,colW=(contentW-colGap)/2,rightX=margin+colW+colGap;
    doc.setFont('helvetica','bold'); doc.text('PRESTADOR:',margin,y); doc.text('CONSORCIO DESTINATARIO:',rightX,y); y+=6; doc.setFont('helvetica','normal');
    const left=[`Nombre: ${state.prestador.nombre||''}`,`CUIT: ${state.prestador.cuit||''}`,`Domicilio: ${state.prestador.domicilio||''}`,`Teléfono: ${state.prestador.telefono||''}`];
    const right=[`Edificio: ${state.consorcio.edificio||''}`,`Dirección: ${state.consorcio.direccion||''}`,`Localidad: ${state.consorcio.localidad||''}`];
    const rows=Math.max(left.length,right.length);
    for(let i=0;i<rows;i++){ if(left[i]) doc.text(splitPdfText(doc,left[i],colW),margin,y); if(right[i]) doc.text(splitPdfText(doc,right[i],colW),rightX,y); y+=6; }
    y+=5;
    doc.setTextColor(35,103,163); doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.text('Detalle de las Tareas',margin,y); y+=7;
    doc.setFillColor(45,111,167); doc.setTextColor(255,255,255); doc.setFontSize(9); doc.rect(margin,y,contentW-35,8,'F'); doc.rect(margin+contentW-35,y,35,8,'F'); doc.text('Descripción del Trabajo / Servicio',margin+3,y+5.4); doc.text('Total',margin+contentW-32,y+5.4); y+=12;
    doc.setTextColor(30,30,30); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text(splitPdfText(doc,state.modelo.nombre||'Servicio / trabajo',contentW-43),margin+2,y); y+=6; doc.setFont('helvetica','normal'); doc.setFontSize(9);
    const detailParts=[]; if(state.modelo.descripcion) detailParts.push(state.modelo.descripcion); if(state.modelo.volquetes) detailParts.push(`Volquetes: ${state.modelo.volquetes}`); if(state.modelo.andamios) detailParts.push(`Andamios: ${state.modelo.andamios}`); if(state.modelo.materiales) detailParts.push(`Materiales: ${state.modelo.materiales}`);
    const detailLines=splitPdfText(doc,detailParts.join('\n')||'Descripción pendiente de completar.',contentW-43); doc.text(detailLines,margin+2,y);
    const total=Number(state.modelo.total); doc.setFont('helvetica','bold'); doc.text(Number.isFinite(total)&&total>0?money(total):'-',margin+contentW-33,y); y+=Math.max(18,detailLines.length*4.5+5);
    ensure(42); doc.setTextColor(35,103,163); doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.text('Condiciones Comerciales',margin,y); y+=7; doc.setTextColor(30,30,30); doc.setFontSize(9); doc.setFont('helvetica','normal');
    const conds=[['Plazo de ejecución',state.condiciones.plazo],['Validez de la oferta',state.condiciones.validez],['Garantía',state.condiciones.garantia]];
    for(const [label,value] of conds){ensure(12);doc.setFont('helvetica','bold');doc.text(`${label}:`,margin,y);doc.setFont('helvetica','normal');const lines=splitPdfText(doc,value,contentW-34);doc.text(lines,margin+34,y);y+=Math.max(6,lines.length*4.5);}
    ensure(38); y+=18; const sigW=68; line(margin,y,margin+sigW,y); line(pageW-margin-sigW,y,pageW-margin,y); y+=5; doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text(state.prestador.nombre||'Prestador',margin,y); doc.text('Administración del Consorcio',pageW-margin-sigW,y); y+=5; doc.setFont('helvetica','normal'); doc.text('Firma del Prestador',margin,y); doc.text('Firma de Conformidad',pageW-margin-sigW,y);
    return doc.output('blob');
  }

  function downloadBlob(blob, filename) {
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  async function exportPdf() {
    const mode=$('formalPdfAction')?.value||'auto';
    try {
      setStatus('Generando PDF...');
      const blob=await buildPdfBlob(); const filename=pdfSafeName();
      const file=new File([blob],filename,{type:'application/pdf'});
      const canShare=Boolean(navigator.share && navigator.canShare && navigator.canShare({files:[file]}));
      const wantsShare=mode==='share'||(mode==='auto'&&canShare);
      if(wantsShare && canShare){
        try { await navigator.share({title:'Presupuesto',text:'Presupuesto generado con ColorLab',files:[file]}); setStatus('PDF generado y enviado al menú de compartir.','ok'); return; }
        catch(err){ if(err?.name==='AbortError'){setStatus('Compartir cancelado. El PDF no se eliminó; podés elegir Descargar PDF.');return;} throw err; }
      }
      if(mode==='share'&&!canShare){ downloadBlob(blob,filename); setStatus('Este navegador no admite compartir archivos directamente. El PDF se descargó para que puedas compartirlo manualmente.','ok'); return; }
      downloadBlob(blob,filename); setStatus('PDF generado y descargado correctamente.','ok');
    } catch(err){
      console.error(err);
      if(err?.message==='PDF_LIB_UNAVAILABLE'){
        setStatus('No se pudo cargar el generador PDF. Se abrirá la vista de impresión para que elijas “Guardar como PDF”.','error');
        setTimeout(()=>window.print(),350);
      } else setStatus('No se pudo generar el PDF. Revisá el logo y los datos e intentá nuevamente.','error');
    }
  }

  function readLogoFile(file) {
    return new Promise((resolve,reject)=>{
      if(!file || !/^image\/(png|jpeg|webp)$/i.test(file.type)){reject(new Error('LOGO_TYPE'));return;}
      if(file.size>8*1024*1024){reject(new Error('LOGO_SIZE'));return;}
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error('LOGO_READ'));
      reader.onload=()=>{
        const img=new Image(); img.onerror=()=>reject(new Error('LOGO_IMAGE'));
        img.onload=()=>{
          const maxW=1200,maxH=600,ratio=Math.min(1,maxW/img.naturalWidth,maxH/img.naturalHeight);
          const w=Math.max(1,Math.round(img.naturalWidth*ratio)),h=Math.max(1,Math.round(img.naturalHeight*ratio));
          const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h; const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,w,h);
          const type=file.type==='image/jpeg'?'image/jpeg':'image/png';
          const dataUrl=canvas.toDataURL(type,type==='image/jpeg'?0.9:undefined);
          resolve({logoDataUrl:dataUrl,logoName:file.name,width:w,height:h});
        };
        img.src=String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  function initLogo() {
    const input=$('formalLogoInput'), remove=$('removeFormalLogo');
    input?.addEventListener('change',async()=>{
      const file=input.files?.[0]; if(!file) return;
      try { Object.assign(state.branding,await readLogoFile(file)); saveLogo(); updateLogoControls(); renderPreview(); setStatus('Logo cargado. Se incluirá en el próximo PDF.','ok'); }
      catch(err){ console.error(err); setStatus(err?.message==='LOGO_SIZE'?'El logo supera 8 MB. Elegí una imagen más liviana.':'No se pudo leer el logo. Usá PNG, JPG o WebP.','error'); }
      finally { input.value=''; }
    });
    remove?.addEventListener('click',()=>{ state.branding={logoDataUrl:'',logoName:'',width:0,height:0}; saveLogo(); updateLogoControls(); renderPreview(); setStatus('Logo quitado del presupuesto.'); });
  }

  function bindInputs(){Object.entries(bindings).forEach(([id,[group,key]])=>{const el=$(id);if(!el)return;el.addEventListener('input',()=>{state[group][key]=el.value;if(group==='prestador'||group==='consorcio')saveParties();renderPreview();});});}
  function detectDelimiter(line){const commas=(line.match(/,/g)||[]).length,semis=(line.match(/;/g)||[]).length;return semis>commas?';':',';}
  function parseCsvLine(line,delimiter){const out=[];let cur='',quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++;}else quoted=!quoted;}else if(ch===delimiter&&!quoted){out.push(cur.trim());cur='';}else cur+=ch;}out.push(cur.trim());return out;}
  function normalizeHeader(v){return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'_');}
  function pick(row,keys){for(const k of keys){if(row[k]!=null&&row[k]!=='')return row[k];}return '';}
  function parseCsv(text){const clean=String(text||'').replace(/^\uFEFF/,'');const lines=clean.split(/\r?\n/).filter(l=>l.trim()!=='');if(lines.length<2)return[];const delimiter=detectDelimiter(lines[0]),headers=parseCsvLine(lines[0],delimiter).map(normalizeHeader);return lines.slice(1).map(line=>{const values=parseCsvLine(line,delimiter),row={};headers.forEach((h,i)=>row[h]=values[i]??'');return{nombre:pick(row,['modelo','nombre','servicio','titulo']),descripcion:pick(row,['descripcion','detalle','tareas','trabajo']),volquetes:pick(row,['volquetes','volquete']),andamios:pick(row,['andamios','andamio']),materiales:pick(row,['materiales','material']),total:pick(row,['total','importe','precio','monto'])};}).filter(m=>Object.values(m).some(v=>String(v).trim()!==''));}
  function fillModelSelect(){const sel=$('modeloPresupuesto');if(!sel)return;sel.replaceChildren();const first=document.createElement('option');first.value='';first.textContent=state.modelos.length?'Seleccionar modelo...':'Sin modelo cargado';sel.append(first);state.modelos.forEach((m,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=m.nombre||`Modelo ${i+1}`;sel.append(o);});}
  function applyModel(model){state.modelo={nombre:model?.nombre||'',descripcion:model?.descripcion||'',volquetes:model?.volquetes||'',andamios:model?.andamios||'',materiales:model?.materiales||'',total:model?.total||''};syncInputsFromState();renderPreview();}
  function resetModel(){state.modelo={nombre:'',descripcion:'',volquetes:'',andamios:'',materiales:'',total:''};const sel=$('modeloPresupuesto');if(sel)sel.value='';syncInputsFromState();renderPreview();}
  function resetParties(){state.prestador={nombre:'',cuit:'',domicilio:'',telefono:''};state.consorcio={edificio:'',direccion:'',localidad:''};localStorage.removeItem(STORAGE_KEY);syncInputsFromState();renderPreview();}
  function initCsv(){const input=$('modeloCsvInput'),sel=$('modeloPresupuesto');if(!input||!sel)return;input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file)return;const text=await file.text();state.modelos=parseCsv(text);fillModelSelect();resetModel();});sel.addEventListener('change',()=>{if(sel.value===''){resetModel();return;}const model=state.modelos[Number(sel.value)];if(model)applyModel(model);});}

  function init(){
    if(!$('formalBudgetCard')) return;
    loadParties(); loadLogo(); bindInputs(); initCsv(); initLogo();
    $('resetModeloFormal')?.addEventListener('click',resetModel);
    $('resetDatosFormales')?.addEventListener('click',resetParties);
    $('exportFormalPdf')?.addEventListener('click',exportPdf);
    syncInputsFromState(); updateLogoControls(); renderPreview();
  }
  init();
})();
