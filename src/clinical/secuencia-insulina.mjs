/** Decisión de insulina derivada de la pauta real y del patrón glucémico. */
import {fieldState} from '../model.mjs';
import {auditCrossDomain} from './auditoria.mjs';
const g=(d,k)=>fieldState(d,k)==='registrado'?d.values[k]:null;
export function resolveInsulinSequence(d){
 const r={missing:[],blocks:auditCrossDomain(d).critical.map(x=>x.title),action:null,patch:{},reason:''};
 const need=(...ids)=>{for(const id of ids)if(g(d,id)===null)r.missing.push(id);};
 need('seq_ambito','dm2','insulina_esquema','ins_calc_hipo');if(r.blocks.length||r.missing.length)return r;
 if(g(d,'seq_ambito')!=='Adulto estable, sin embarazo ni lactancia, sin proceso agudo'||g(d,'dm2')!=='Sí'||g(d,'dm1')==='Sí'){r.blocks.push('Confirmar DM2 adulta estable antes de aplicar este circuito.');return r;}
 const scheme=g(d,'insulina_esquema'),hypo=g(d,'ins_calc_hipo');
 if(['Actual, grave o recurrente','No revisada'].includes(hypo)){r.blocks.push('Resolver o revisar la hipoglucemia antes del cálculo.');return r;}
 if(scheme==='Sin insulina'){
  need('hba1c','dm_objetivo_valor','ins_calc_glp1');if(r.missing.length)return r;
  if(Number(g(d,'hba1c'))<Number(g(d,'dm_objetivo_valor'))){r.reason='HbA1c dentro del objetivo: no iniciar insulina por rutina.';return r;}
  if(g(d,'ins_calc_glp1')!=='Ya utilizado o alternativa valorada y no adecuada'){r.reason='Valorar primero alternativas basadas en GLP-1 cuando no hay una indicación que exija insulina. Resolver la elección en el recorrido de DM2.';return r;}
  r.action='Iniciar basal';r.reason='Se propone glargina U100, 10 U al día, como pauta de referencia del circuito; comprobar elegibilidad, educación y seguimiento antes de iniciar.';
  r.patch={ins_calc_producto:'Glargina U100 · Lantus SoloStar',ins_calc_metodo:'10 U al día'};
 }else if(scheme==='Solo basal'){
  if(hypo==='Leve, resuelta y sin causa corregible identificada'){
   r.action='Reducir basal';r.reason='Revisar causalidad y, si la basal es responsable, aplicar la reducción conservadora del 10 % de esta vía.';r.patch={ins_calc_reduccion:'10 %'};
  }else{
   need('ins_calc_g1','ins_calc_g2','ins_calc_g3','ins_calc_min','ins_calc_max');if(r.missing.length)return r;
   const avg=['ins_calc_g1','ins_calc_g2','ins_calc_g3'].reduce((s,k)=>s+Number(g(d,k)),0)/3;
   if(avg>Number(g(d,'ins_calc_max'))||avg<Number(g(d,'ins_calc_min'))){r.action='Ajustar basal';r.reason='El patrón de ayunas está fuera del intervalo individual: calcular ajuste sobre la misma insulina que ya recibe.';}
   else{
    need('hba1c','dm_objetivo_valor','insulina_posprandial');if(r.missing.length)return r;
    if(Number(g(d,'hba1c'))<Number(g(d,'dm_objetivo_valor'))){r.reason='Ayunas y HbA1c en objetivo: mantener y revisar tolerancia.';return r;}
    if(g(d,'insulina_posprandial')!=='Elevaciones posprandiales repetidas'){r.reason='Con ayunas en objetivo no aumentar basal por HbA1c aislada; comprobar patrón posprandial y fiabilidad de HbA1c.';return r;}
    r.action='Añadir bolo en una comida';r.reason='Ayunas en objetivo con elevaciones posprandiales documentadas: valorar primer bolo tras revisar GLP-1. Se propone asparta U100, 4 U en la comida identificada.';
    r.patch={ins_calc_patron:'Ayunas en objetivo y elevación posprandial repetida',ins_calc_rapida:'Asparta U100 · NovoRapid FlexPen',ins_calc_bolo:'4 U'};
   }
  }
 }else{r.reason='La pauta incluye un esquema distinto de basal aislada: revisar distribución real y objetivos. No convertir premezclas ni retirar bolos mediante una reducción de basal.';return r;}
 r.patch.ins_calc_accion=r.action;r.patch.ins_calc_contexto='Adulto con DM2 estable, sin gestación';return r;
}
