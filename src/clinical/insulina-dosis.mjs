/** Cálculo explícito en DM2 adulta estable. No registra administración ni altera otros motores. */
import {FIELDS,fieldState,insulinDoseAssociationValid} from '../model.mjs';
import {auditCrossDomain} from './auditoria.mjs';
import {readMulti} from '../consultas.mjs';
export const INSULIN_DOSE_SOURCES=[
 {title:'ADA 2026 · §9, figura 9.4',url:'https://diabetesjournals.org/care/article/49/Supplement_1/S183/163934'},
 {title:'redGDPS 2026 · §5.5, tablas 2–3',url:'https://www.redgdps.org/vivir-con-diabetes-tipo-2/5-5-insulinizacion/'},
];
export const BASAL_PRODUCTS={
 'Glargina U100 · Lantus SoloStar':{name:'Insulina glargina U100 · Lantus SoloStar',max:80,days:3,url:'https://cima.aemps.es/cima/dochtml/ft/00134033/FT_00134033.html'},
 'Glargina U300 · Toujeo SoloStar':{name:'Insulina glargina U300 · Toujeo SoloStar',max:80,days:4,url:'https://cima.aemps.es/cima/dochtml/ft/100133034/FT_100133034.html'},
 'Degludec U100 · Tresiba FlexTouch':{name:'Insulina degludec U100 · Tresiba FlexTouch',max:80,days:4,url:'https://cima.aemps.es/cima/dochtml/ft/112807004/FT_112807004.html'},
};
const RAPID={name:'Insulina asparta U100 · NovoRapid FlexPen',max:60,url:'https://cima.aemps.es/cima/dochtml/ft/99119009/FT_99119009.html'};
const get=(d,k)=>fieldState(d,k)==='registrado'?d.values[k]:null;
const num=(d,k)=>get(d,k)===null?null:Number(get(d,k));
const multi=(d,k)=>readMulti(d.values[k]||'[]');
export function insulinDoseFields(d){
 const a=get(d,'ins_calc_accion'),p=get(d,'ins_calc_producto');
 const fields=['ins_calc_accion','ins_calc_contexto','ins_calc_producto'];
 if(a==='Iniciar basal'){
  fields.push('insulina_esquema');
  if(p?.startsWith('Glargina U100'))fields.push('ins_calc_metodo');
  if(p?.startsWith('Glargina U300')||(p?.startsWith('Glargina U100')&&['0,1 U/kg/día','0,2 U/kg/día'].includes(get(d,'ins_calc_metodo'))))fields.push('peso');
 }else if(a){fields.push('insulina_esquema','insulina_dosis_basal');}
 fields.push('tfge','ins_calc_hipo');
 if(a==='Ajustar basal')fields.push('ins_calc_dias','ins_calc_min','ins_calc_max','ins_calc_g1','ins_calc_g2','ins_calc_g3');
 if(a==='Añadir bolo en una comida')fields.push('ins_calc_patron','ins_calc_glp1','ins_calc_comida','ins_calc_rapida','ins_calc_bolo','hba1c');
 if(a==='Reducir basal')fields.push('ins_calc_causa','ins_calc_reduccion');
 fields.push('ins_calc_revision');return fields;
}
export function evaluateInsulinDose(d){
 const out={state:'datos_insuficientes',proposal:null,missing:[],blocks:[],steps:[],sources:[...INSULIN_DOSE_SOURCES],actionPerformed:false,prescription:null};
 const a=get(d,'ins_calc_accion'),key=get(d,'ins_calc_producto'),p=BASAL_PRODUCTS[key],scheme=get(d,'insulina_esquema'),hypo=get(d,'ins_calc_hipo');
 const required=insulinDoseFields(d);
 if(get(d,'ins_calc_revision')==='Indicación, seguridad y educación revisadas'&&!insulinDoseAssociationValid(d))out.missing.push('Reconfirmar revisión tras modificar los datos.');
 for(const id of required)if(!get(d,id))out.missing.push(FIELDS[id].label+(fieldState(d,id)==='revisar'?' · revisar valor':''));
 const block=t=>out.blocks.push(t);
 const audit=auditCrossDomain(d);for(const x of audit.critical)block(x.title||x.message||x.text||'Resolver alerta clínica transversal.');
 if(get(d,'ins_calc_contexto')&&get(d,'ins_calc_contexto')!=='Adulto con DM2 estable, sin gestación')block('Este cálculo requiere DM2 adulta estable y ausencia de gestación.');
 if(d.values.edad!==undefined&&(fieldState(d,'edad')!=='registrado'||num(d,'edad')<18))block('Edad incompatible o no válida: circuito específico.');
 if(get(d,'dm2')==='No'||get(d,'dm1')==='Sí'||get(d,'embarazo')==='Sí')block('Diagnóstico o gestación registrados incompatibles con el circuito DM2.');
 for(const id of ['dm1','embarazo','dm2'])if(fieldState(d,id)==='revisar')block('Revisar '+FIELDS[id].label+'.');
 if(get(d,'ins_calc_revision')&&get(d,'ins_calc_revision')!=='Indicación, seguridad y educación revisadas')block('Completar revisión de indicación, productos, medicación y educación antes de calcular.');
 if(key&&!p)block('Presentación no cubierta: no extrapolar unidades ni dispositivo.');
 if(p)out.sources.push({title:'CIMA · '+p.name,url:p.url});
 if(hypo==='Actual, grave o recurrente')block('Atender la hipoglucemia y revisar la pauta de forma prioritaria; no aplicar un ajuste rutinario.');
 if(hypo==='No revisada')out.missing.push('Revisar hipoglucemia antes del cálculo.');
 const e=num(d,'tfge');if(e!==null&&(e<30||e>180))block('TFGe fuera del intervalo de este calculador rutinario (30–180). Individualizar en ERC avanzada o revisar el dato.');
 const special=[...multi(d,'insulina_especiales'),...multi(d,'insulina_perfil'),...multi(d,'comorbilidades')];
 if(special.some(x=>/corticoides|intercurrente|sintomático|paliativos|Fragilidad/i.test(x))||get(d,'insulina_fragilidad')==='Sí')block('Corticoides, fragilidad/paliativos o proceso intercurrente requieren una pauta específica.');
 if(get(d,'hepatica_grave')==='Sí'||get(d,'insuficiencia_hepatica')==='Sí')block('Insuficiencia hepática: individualizar requerimiento y vigilancia.');
 if(get(d,'dm_adherencia')&&get(d,'dm_adherencia')!=='Adherencia adecuada confirmada'){
  // Solo las opciones negativas explícitas; no confundir vocabulario con ausencia de revisión.
  if(/Dudas|No |incumpl|Dificult/i.test(get(d,'dm_adherencia')))block('Conciliar adherencia y técnica antes de modificar dosis.');
 }
 if(get(d,'insulina_autocuidado')==='Requiere educación o apoyo')block('Completar educación o apoyo para administrar y vigilar insulina.');
 if((d.values.alergias||'').match(/insulin|glargin|deglud|aspart|lantus|toujeo|tresiba|novorapid/i))block('Alergia a insulina o producto registrada: conciliar antes de calcular.');
 if(num(d,'glucemia_actual')!==null&&num(d,'glucemia_actual')<70)block('Glucemia actual <70 mg/dL: atender y resolver hipoglucemia antes de calcular.');
 if(get(d,'dm_hipoglucemias')==='Leves'&&hypo==='Sin episodios confirmados')block('Hipoglucemias leves registradas: conciliar con ausencia de episodios antes de calcular.');
 if(a!=='Iniciar basal'&&get(d,'dm_dosis_confirmadas')==='No')block('La pauta actual consta como no verificada: conciliar antes de ajustar.');
 if(a==='Iniciar basal'&&scheme&&scheme!=='Sin insulina')block('Ya existe insulinización o no está conciliada: usar ajuste o revisar cambio, no inicio.');
 if(a&&a!=='Iniciar basal'&&scheme&&scheme!=='Solo basal')block('Este cálculo requiere una sola basal diaria; no convierte premezclas ni pautas múltiples.');
 if(a==='Iniciar basal'&&multi(d,'farmacos_clases').includes('Insulina'))block('Consta insulina en medicación: conciliar antes de iniciar.');
 const current=num(d,'insulina_dosis_basal');
 if(a==='Iniciar basal'&&current!==null&&current>0)block('Consta dosis basal positiva: no es un inicio sin insulina.');
 if(a&&a!=='Iniciar basal'&&current!==null&&(!Number.isInteger(current)||current<1||current>(p?.max||80)))block('Dosis actual fuera de los incrementos o capacidad de la pluma seleccionada.');
 if(a!=='Reducir basal'&&hypo==='Leve, resuelta y sin causa corregible identificada')block('Resolver primero el exceso de insulinización; usar reducción si se confirma origen basal.');
 if(a!=='Reducir basal'&&get(d,'insulina_hipo_nocturna')==='Sí')block('Hipoglucemia nocturna documentada: no iniciar ni aumentar por esta vía.');
 if(out.blocks.length){out.state='seguridad_prioritaria';return out;}
 if(out.missing.length)return out;
 const proposal=(dose,formula,schedule,extra={})=>{
  if(!Number.isInteger(dose)||dose<1||dose>(extra.max||p.max)){block('El resultado no es administrable en una inyección con esta pluma; requiere otra decisión.');return;}
  out.proposal={product:extra.product||p.name,units:dose,previousUnits:a==='Iniciar basal'?null:current,formula,schedule,rounding:'Unidades enteras; cálculo redondeado hacia abajo.',...extra};out.state='propuesta_calculada';
 };
 if(a==='Iniciar basal'){
  let raw,formula;
  if(key.startsWith('Degludec')){raw=10;formula='10 U/día · inicio CIMA Tresiba';}
  else if(key.startsWith('Glargina U300')){raw=.2*num(d,'peso');formula=`0,2 × ${num(d,'peso')} kg = ${Number(raw.toFixed(2))} U/día · inicio CIMA Toujeo`;}
  else {const m=get(d,'ins_calc_metodo');const rate=m==='0,1 U/kg/día'?.1:.2;raw=m==='10 U al día'?10:rate*num(d,'peso');formula=m==='10 U al día'?'10 U/día · estrategia ADA/redGDPS':`${rate.toString().replace('.',',')} × ${num(d,'peso')} kg = ${Number(raw.toFixed(2))} U/día · estrategia ADA/redGDPS`;}
  proposal(Math.floor(raw+1e-9),formula,'Vía subcutánea, una vez al día a la misma hora.');
  out.steps.push(`Controlar ayunas diariamente. Acordar objetivo individual y reevaluar a los ${p.days} días antes de aumentar; antes si aparece hipoglucemia.`);
 }else if(a==='Ajustar basal'){
  const gs=['ins_calc_g1','ins_calc_g2','ins_calc_g3'].map(id=>num(d,id)),lo=num(d,'ins_calc_min'),hi=num(d,'ins_calc_max');
  if(lo>=hi){block('El límite inferior debe ser menor que el superior.');}
  else if(gs.some(x=>x<70)){block('Hay una glucemia <70 mg/dL: revisar hipoglucemia y causa; no titular automáticamente.');}
  else if(gs.some(x=>x>=300)){block('Glucemia ≥300 mg/dL: valorar descompensación antes de titular.');}
  else if(gs.some(x=>x<lo)&&gs.some(x=>x>hi)){block('Patrón variable con valores bajos y altos: revisar causa y sobrebasalización, sin aumento automático.');}
  else if(gs.filter(x=>x<lo).length>=2){proposal(current-2,`${current} − 2 U = ${current-2} U/día`,'Misma basal, vía subcutánea una vez al día.');out.steps.push('Revisar el descenso de ayunas y su causa; no esperar varios días si aparecen hipoglucemias.');}
  else if(gs.every(x=>x>hi)){
   if(num(d,'ins_calc_dias')<p.days)block(`Aún no han transcurrido ${p.days} días completos con esta dosis; no acumular aumentos.`);
   else {proposal(current+2,`${current} + 2 U = ${current+2} U/día`,'Misma basal, vía subcutánea una vez al día.');out.steps.push(`Reevaluar ayunas y seguridad en ${p.days} días; no encadenar aumentos si cambia el patrón.`);}
  }else {out.state='mantener_y_revisar';out.steps.push('No hay hiperglucemia de ayunas sostenida en los tres días. Mantener la dosis registrada y revisar patrón; un valor aislado no justifica aumentar.');}
 }else if(a==='Añadir bolo en una comida'){
  if(get(d,'ins_calc_patron')!=='Ayunas en objetivo y elevación posprandial repetida')block('Verificar patrón: el bolo no sustituye la optimización de una basal con ayunas elevadas.');
  if(get(d,'ins_calc_glp1')!=='Ya utilizado o alternativa valorada y no adecuada')block('Valorar primero tratamiento basado en GLP-1 cuando sea apropiado.');
  if(get(d,'ins_calc_comida')==='No identificada o ingesta insegura')block('Identificar comida responsable y asegurar ingesta antes de calcular bolo.');
  if(get(d,'ins_calc_rapida')!=='Asparta U100 · NovoRapid FlexPen')block('Insulina rápida no cubierta; no extrapolar horario ni dispositivo.');
  if(get(d,'insulina_ayunas_objetivo')&&get(d,'insulina_ayunas_objetivo')!=='En objetivo individual')block('El dato compartido de ayunas contradice el patrón seleccionado.');
  const fasting=num(d,'insulina_ayunas');if(fasting!==null&&(fasting<70||fasting>=300))block('Ayunas documentadas fuera de seguridad (<70 o ≥300): revisar antes del bolo.');
  if(num(d,'dm_objetivo_valor')!==null&&num(d,'hba1c')<=num(d,'dm_objetivo_valor'))block('HbA1c en el objetivo individual registrado: reevaluar necesidad de intensificación antes del bolo.');
  if(get(d,'dm_hba1c_fiable')&&get(d,'dm_hba1c_fiable')!=='Fiable tras comprobación')block('HbA1c no fiable: no utilizarla para el ajuste basal asociado al bolo.');
  if(!out.blocks.length){
   const raw=get(d,'ins_calc_bolo')==='4 U'?4:current*.1,dose=Math.floor(raw+1e-9);
   proposal(dose,get(d,'ins_calc_bolo')==='4 U'?'Primer bolo de 4 U · ADA 2026':`10 % × ${current} U = ${Number(raw.toFixed(2))} U`, `Vía subcutánea inmediatamente antes de ${get(d,'ins_calc_comida').toLowerCase()}, con ingesta asegurada.`,{product:RAPID.name,max:RAPID.max,kind:'bolo',previousUnits:null});
   out.sources.push({title:'CIMA · '+RAPID.name,url:RAPID.url});
   if(num(d,'hba1c')<8){const basal=Math.floor(current*.9+1e-9);if(basal<1||(current-basal)/current>.2000001){block('Reducción basal asociada no administrable dentro del margen por pasos de la pluma; individualizar.');}else if(out.proposal){out.proposal.basalProposal={product:p.name,previousUnits:current,units:basal,formula:`${current} × 0,90 = ${Number((current*.9).toFixed(2))} U · alternativa de reducción del 10 % al añadir bolo con HbA1c <8 %`};}}
   out.steps.push('Medir perfil pre/posprandial y revisar en los primeros días. No usar este bolo como corrección aislada ni sumar dosis por una lectura puntual.');
  }
 }else if(a==='Reducir basal'){
  if(hypo!=='Leve, resuelta y sin causa corregible identificada')block('La reducción porcentual requiere hipoglucemia leve ya resuelta, sin causa corregible identificada. Para fragilidad o retirada de bolos, revisar esquema completo.');
  if(get(d,'ins_calc_causa')!=='Revisada: basal responsable, sin bolo ni causa corregible')block('Identificar la dosis responsable: no reducir basal por hipoglucemia atribuible a un bolo u otro factor.');
  if(!out.blocks.length){const percent=get(d,'ins_calc_reduccion')==='10 %'?10:20,raw=current*(1-percent/100);if((current-Math.floor(raw+1e-9))/current>.2000001){block('Con pasos de 1 U, el redondeo reduciría más del 20 %; individualizar sin redondeo automático.');}else proposal(Math.floor(raw+1e-9),`${current} × ${(1-percent/100).toFixed(2).replace('.',',')} = ${Number(raw.toFixed(2))} U/día · reducción elegida ${percent} %`,'Misma basal, vía subcutánea una vez al día.');out.steps.push('Vigilar glucosa desde el cambio y revisar causa y evolución en 24–72 horas. No implica retirar toda la insulina ni modificar bolos.');}
 }
 if(out.blocks.length){out.state='seguridad_prioritaria';out.proposal=null;}
 if(out.proposal)out.steps.push('Seleccionar las unidades en el contador de la pluma; no convertir a mL ni extraer a una jeringa. Revisar secretagogos, técnica, rotación de zonas, material y plan ante hipoglucemia con paciente o cuidador.');
 return out;
}
