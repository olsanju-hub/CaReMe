import {fieldState,setValue} from '../model.mjs';
import {SEQUENCE_MEDS} from '../sequence-fields.mjs';
import {reviewFinerenoneContinuation} from './continuidad.mjs';
const g=(d,k)=>fieldState(d,k)==='registrado'?d.values[k]:null;
const n=(d,k)=>g(d,k)===null?null:Number(g(d,k));
const result=()=>({missing:[],steps:[],followup:[],sources:[],questionContext:''});
const review=(r,title,reason)=>r.steps.push({action:'review',title,reason,when:'Ahora',key:null,operation:'start'});
export function planHtaReduction(d,ids){
 const r=result(),need=(...keys)=>keys.forEach(k=>{if(g(d,k)===null&&!r.missing.includes(k))r.missing.push(k);});
 need('seq_retirada_motivo');if(r.missing.length)return r;
 const cause=g(d,'seq_retirada_motivo'),controlled=n(d,'pas')<n(d,'seq_pa_objetivo')&&n(d,'pad')<n(d,'seq_pad_objetivo');
 if(n(d,'pas')<90){review(r,'Valorar hipotensión de forma prioritaria','PAS <90 mmHg: comprobar perfusión, síntomas y causa antes de una desintensificación rutinaria.');return r;}
 if(cause==='Otra causa o sin aclarar'){review(r,'Aclarar el motivo de reducción','No reducir una pauta solo por seleccionar desintensificación.');return r;}
 if(cause==='Carga terapéutica con PA en objetivo'){
  need('edad');if(r.missing.length)return r;
  if(n(d,'edad')<80||ids.length<2||!controlled||n(d,'pas')>=150){review(r,'Revisar elegibilidad para retirada por carga terapéutica','La vía de retirada por carga se limita a mayores de 80 años con al menos dos fármacos y PA controlada; no extrapolarla a hipertensión no controlada.');return r;}
 }
 if(cause==='PA baja u ortostatismo sintomático'&&!controlled&&g(d,'hta_ortostatismo')!=='Sí'){need('hta_ortostatismo');if(!r.missing.length)review(r,'Confirmar el motivo hemodinámico','La PA no está por debajo del objetivo y no se confirma ortostatismo sintomático.');return r;}
 if(!controlled){review(r,'Revisar sustitución y objetivos antes de una reducción rutinaria','La PA no está dentro del objetivo acordado. Si hay edema u ortostatismo, revisar una estrategia que mantenga el control y valorar PA de pie; esta vía no propone una retirada aislada con hipertensión no controlada.');return r;}
 const med=cause==='Edema atribuido a amlodipino tras revisión'?(ids.includes('amlodipino')?'amlodipino':null):['indapamida','amlodipino','losartan'].find(k=>ids.includes(k));
 if(!med){review(r,'Revisar un fármaco concreto antes de retirarlo','No hay un candidato identificado de esta vía. No retirar betabloqueantes, ARNI o un diurético de congestión de forma brusca.');return r;}
 r.sources.push({amlodipino:'https://cima.aemps.es/cima/dochtml/ft/65460/FichaTecnica_65460.html',losartan:'https://cima.aemps.es/cima/dochtml/ft/89364/FT_89364.html',indapamida:'https://cima.aemps.es/cima/dochtml/ft/69391/FichaTecnica_69391.html'}[med]);
 r.questionContext='Candidato de esta revisión: '+SEQUENCE_MEDS[med].label+'. Se modifica un solo medicamento cada vez.';
 need('seq_dosis_'+med,'seq_hta_una_toma','seq_indicacion_solo_hta','seq_control_retirada');if(r.missing.length)return r;
 if(g(d,'seq_hta_una_toma')!=='Una toma diaria confirmada'||g(d,'seq_indicacion_solo_hta')!=='Solo HTA, sin otra indicación del candidato'||g(d,'seq_control_retirada')!=='Cambio acordado y seguimiento disponible'){
  review(r,'Confirmar indicación y seguimiento antes de reducir','No retirar el candidato si también trata angina, congestión u otra enfermedad o si no se puede vigilar el cambio.');return r;
 }
 if(med==='losartan'&&(g(d,'ic')==='Sí'||g(d,'erc')==='Sí'||n(d,'cac')>=30)){review(r,'Conservar el bloqueo RAAS hasta revisar su otra indicación','Constan IC o marcadores renales: una respuesta de uso exclusivo en HTA no puede ignorarlos.');return r;}
 const dose=n(d,'seq_dosis_'+med),high={amlodipino:10,losartan:100},low={amlodipino:5,losartan:50,indapamida:1.5};
 if(dose===high[med])r.steps.push({action:'reduce',title:'Reducir '+SEQUENCE_MEDS[med].label,reason:`Proponer ${low[med]} mg cada 24 h en lugar de ${dose} mg; usar la presentación de la nueva dosis, sin fraccionar comprimidos no divisibles.`,key:med,operation:'reduce',currentMed:med,when:'Tras confirmar la revisión de la pauta'});
 else if(dose===low[med]&&ids.length>=2)r.steps.push({action:'withdraw',title:'Retirar un solo fármaco: '+SEQUENCE_MEDS[med].label,reason:`Retirada propuesta de ${dose} mg cada 24 h tras la revisión acordada. ${med==='indapamida'?'No partir el comprimido retard para simular una dosis menor.':''} Mantener los demás fármacos mientras se evalúa el efecto.`,key:null,when:'Cambio propuesto, no registrado como realizado',operation:'start'});
 else review(r,'Revisar dosis o retirada del último fármaco','La dosis no coincide con los escalones verificados o se trata del único antihipertensivo. No aplicar una reducción porcentual indiscriminada.');
 r.followup.push('Registrar PA domiciliaria y síntomas tras el cambio. Revisar antes si hay mareo, síncope, disnea o elevación importante de PA.','Reevaluar a las 4 semanas como máximo; antes si el motivo fue hipotensión o efectos adversos. Si se supera de forma persistente el objetivo acordado, revisar y considerar restablecer la pauta tolerada.','No retirar el siguiente medicamento hasta comprobar respuesta y estabilidad del primero.');
 return r;
}
export function finerenoneControlDraft(d){
 let out=d;const dose=g(d,'seq_dosis_finerenona');
 if(dose!==null&&['10','20','40'].includes(String(dose)))out=setValue(out,'fin_dosis_actual',String(dose));
 return setValue(out,'fin_estado','En tratamiento');
}
export function planFinerenoneControl(d){
 const r=result(),need=(...keys)=>keys.forEach(k=>{if(g(d,k)===null)r.missing.push(k);});
 r.sources.push('https://cima.aemps.es/cima/dochtml/ft/1211616002/FT_1211616002.html');
 need('seq_fin_indicacion','seq_dosis_finerenona','seq_semanas_finerenona','seq_mra_control','tfge','potasio');if(r.missing.length)return r;
 const ind=g(d,'seq_fin_indicacion'),dose=n(d,'seq_dosis_finerenona');
 if(ind==='Sin confirmar'||![10,20,40].includes(dose)){review(r,'Confirmar indicación y dosis de finerenona','No intercambiar la tabla de ERC-DM2 con la de IC ni interpretar una dosis no verificada.');return r;}
 const cardiac=ind==='IC con FEVI ≥40 %';
 need(...(cardiac?['ic','ic_sintomatica','fevi','fin_tfge_inicio']:['dm2','erc','persistencia']));if(r.missing.length)return r;
 if(cardiac&&n(d,'fin_tfge_inicio')<25){review(r,'Confirmar TFGe al inicio','La TFGe inicial declarada es inferior al umbral verificado de inicio; revisar el dato y la indicación antes de subir.');return r;}
 if(cardiac&&(g(d,'ic')!=='Sí'||g(d,'ic_sintomatica')!=='Sí'||n(d,'fevi')<40)||!cardiac&&(g(d,'dm2')!=='Sí'||g(d,'erc')!=='Sí'||g(d,'persistencia')!=='Sí')){review(r,'Conciliar el diagnóstico con la indicación actual','La indicación declarada contradice los datos clínicos.');return r;}
 if(g(d,'seq_mra_control')!=='Analítica actual revisada, sin deterioro agudo'){review(r,'Revisar la analítica antes de ajustar','No se puede titular con un control no confirmado o durante deterioro agudo.');return r;}
 need('fin_tfge_previa');if(r.missing.length)return r;
 const report=reviewFinerenoneContinuation(finerenoneControlDraft(d),cardiac?'ic_fevi40':'erc_dm2');
 if(['cyp3a4_fuerte','addison','hepatica_grave'].some(k=>g(d,k)==='Sí')){review(r,'Resolver contraindicación de finerenona','Consta un inhibidor potente CYP3A4, Addison o insuficiencia hepática grave; no proponer una subida.');return r;}
 const target={ 'FIN-CKD-UPTITRATE':20,'FIN-HF-UP20':20,'FIN-HF-UP40':40 }[report.ruleId];
 if(target&&g(d,'seq_objetivo')==='Reducir o simplificar tratamiento'){review(r,'La tabla no indica reducir con estos valores','No aumentar durante una consulta de desintensificación. Revisar el motivo clínico y conservar la protección si no hay indicación de retirada.');return r;}
 if(target&&n(d,'seq_semanas_finerenona')>=4)r.steps.push({action:'titrate',title:`Finerenona: ${dose} → ${target} mg cada 24 h`,reason:report.guidance,key:cardiac?'fine_ic':'fine_erc',operation:'escalate',currentMed:'finerenona',when:'Tras revisar pauta e interacciones'});
 else if(target)r.steps.push({action:'maintain',title:'Mantener hasta el control de las 4 semanas',reason:'Completar al menos cuatro semanas con la dosis actual y reevaluar K/TFGe antes de aumentar.',key:null,operation:'start',when:'Ahora'});
 else r.steps.push({action:report.state==='referencia'?'maintain':'review',title:report.title,reason:report.guidance,key:null,operation:'start',when:'Según tabla CIMA de la indicación actual'});
 r.followup.push('Repetir potasio y función renal 4 semanas después de un ajuste; adelantar según riesgo o síntomas. No considerar el cálculo una dosis ya administrada.');
 return r;
}
/** Información de ficha junto a la alerta. Nunca habilita una pauta rutinaria ni un reinicio. */
export function mraPriorityGuidance(d,ids){
 const notes=[],k=n(d,'potasio');if(k===null||ids.filter(x=>['finerenona','eplerenona','espironolactona'].includes(x)).length!==1)return notes;
 if(ids.includes('finerenona')){
  const dose=n(d,'seq_dosis_finerenona'),ind=g(d,'seq_fin_indicacion');if(![10,20,40].includes(dose))return notes;
  if(ind==='ERC asociada a DM2'&&k>5.5)notes.push({text:'Finerenona en ERC-DM2: la ficha indica interrumpir con K >5,5. Confirmar la analítica y evaluar la hiperpotasemia; no reiniciar automáticamente.',source:'https://cima.aemps.es/cima/dochtml/ft/1211616002/FT_1211616002.html'});
  if(ind==='IC con FEVI ≥40 %'&&k>=5.5)notes.push({text:k>=6||dose===10?'Finerenona en IC: la tabla indica interrumpir con este K y dosis. Valorar la hiperpotasemia sin demorar la atención; el reinicio exige nueva evaluación.':`Finerenona en IC: para ${dose} mg y K entre 5,5 y <6, la tabla indica reducir a ${dose/2} mg/día. Confirmar analítica, causa y gravedad; esta información no resuelve por sí sola la hiperpotasemia.`,source:'https://cima.aemps.es/cima/dochtml/ft/1211616002/FT_1211616002.html'});
 }
 if(ids.includes('eplerenona')&&k>=5.5){
  const dose=n(d,'seq_dosis_eplerenona'),freq=g(d,'seq_epl_frecuencia');let text=null;
  if(k>=6)text='Eplerenona: la ficha indica suspender con K ≥6. Priorizar valoración de la hiperpotasemia; no reiniciar automáticamente.';
  else if(dose===50&&freq==='Cada 24 h')text='Eplerenona: con K 5,5–5,9, la tabla reduce 50 mg/día a 25 mg/día.';
  else if(dose===25&&freq==='Cada 24 h')text='Eplerenona: con K 5,5–5,9, la tabla reduce 25 mg/día a 25 mg en días alternos.';
  else if(dose===25&&freq==='Cada 48 h')text='Eplerenona: con K 5,5–5,9 y 25 mg en días alternos, la tabla indica suspender.';
  if(text)notes.push({text:text+' Confirmar resultado y evaluar gravedad y causa antes de seguir un circuito rutinario.',source:'https://cima.aemps.es/cima/dochtml/ft/75983/FT_75983.html'});
 }
 return notes;
}
