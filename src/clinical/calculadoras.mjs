import {fieldState} from '../model.mjs';
import {computeFib4,gfrCategory} from './engine.mjs';
import {classifyMasldFib4} from './masld.mjs';
import {classifyAdultBmi} from './obesidad.mjs';
export const CALCULATOR_FIELDS={crcl:['edad','calc_sexo','calc_creatinina','calc_creat_unidad','calc_estabilidad','calc_peso_cg','calc_peso_cg_revision'],imc:['peso','talla'],fib4:['edad','ast','alt','plaquetas'],tfge:['edad','calc_sexo','calc_creatinina','calc_creat_unidad','calc_estabilidad']};
export const CALCULATOR_TITLES={crcl:'Aclaramiento · Cockcroft–Gault',imc:'Índice de masa corporal',fib4:'FIB-4',tfge:'TFGe · CKD-EPI 2021'};
const value=(d,k)=>fieldState(d,k)==='registrado'?d.values[k]:null;
const n=(d,k)=>value(d,k)===null?null:Number(value(d,k));
export function calculateClinical(d,type){
 if(!CALCULATOR_FIELDS[type])throw new Error('Calculadora no reconocida');
 const r={value:null,unit:'',formula:'',interpretation:'',missing:CALCULATOR_FIELDS[type].filter(k=>value(d,k)===null),blocks:[],source:'',transferField:null,actionPerformed:false};
 if(r.missing.length)return r;
 const age=n(d,'edad');
 if(type==='imc'){
  const w=n(d,'peso'),h=n(d,'talla');
  if(w<=0||w>600||h<50||h>250){r.blocks.push('Revisar peso y talla; se esperan kg y centímetros (talla 50–250 cm en esta calculadora adulta).');return r;}
  if((d.values.edad&&fieldState(d,'edad')!=='registrado')||d.values.edad&&age<18){r.blocks.push('Clasificación adulta no aplicable a la edad registrada.');return r;}
  r.value=w/(h/100)**2;r.unit='kg/m²';r.formula=`${w} / (${h}/100)²`;r.interpretation=classifyAdultBmi(r.value).replaceAll('_',' ');r.source='https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight';r.transferField='imc';
 }else if(type==='fib4'){
  r.value=computeFib4(age,n(d,'ast'),n(d,'alt'),n(d,'plaquetas'));
  if(r.value===null){r.blocks.push('Edad adulta y valores positivos de AST, ALT y plaquetas; revisar unidades.');return r;}
  r.formula=`${age} × ${n(d,'ast')} / (${n(d,'plaquetas')} × √${n(d,'alt')})`;r.unit='';r.transferField='fib4_informado';
  r.interpretation=age<35?'Precisión limitada por debajo de 35 años.':`Banda ${classifyMasldFib4(r.value,age)}; no confirma fibrosis por sí sola.`;
  if(value(d,'fib4_agudo')==='Sí')r.interpretation='No interpretar el índice durante enfermedad aguda.';
  r.source='https://easlcampus.eu/sites/default/files/2024-08/EASL_CPGs_management_of_MASLD.pdf';
 }else{
  if(value(d,'calc_estabilidad')!=='Creatinina estable, sin embarazo ni diálisis'||value(d,'lra_sospecha')==='Sí'||value(d,'embarazo')==='Sí'){r.blocks.push('No estimar por creatinina en embarazo, diálisis o función renal inestable.');return r;}
  const raw=n(d,'calc_creatinina'),c=value(d,'calc_creat_unidad')==='µmol/L'?raw/88.4:raw;
  if(c<=0||c>30){r.blocks.push('Revisar creatinina y unidad.');return r;}
  const female=value(d,'calc_sexo')==='Mujer';
  if(type==='crcl'){
   const w=n(d,'calc_peso_cg');if(w<=0||value(d,'calc_peso_cg_revision')!=='Peso seleccionado apropiado tras revisión clínica'){r.blocks.push('Revisar el peso usado; no asumir peso real en obesidad, edema o alteración muscular.');return r;}
   r.value=(140-age)*w/(72*c)*(female?.85:1);r.unit='mL/min';r.formula=`(140 − ${age}) × ${w} / (72 × ${c.toFixed(4)})${female?' × 0,85':''}`;
   r.interpretation='Aclaramiento estimado por Cockcroft–Gault; no es TFGe normalizada. Confirmar idoneidad de la estimación cerca de un umbral de dosis.';
   r.source='https://www.kidney.org/sites/default/files/441-8491_2202_faqs_aboutgfr_v5.pdf';r.transferField='lip_aclaramiento';return r;
  }
  const k=female?.7:.9,a=female?-.241:-.302;
  r.value=142*Math.min(c/k,1)**a*Math.max(c/k,1)**(-1.2)*.9938**age*(female?1.012:1);r.unit='mL/min/1,73 m²';
  r.formula=`142 × min(${c.toFixed(4)}/${k},1)^(${a}) × max(${c.toFixed(4)}/${k},1)^(−1,200) × 0,9938^${age}${female?' × 1,012':''}`;
  r.interpretation=`Categoría ${gfrCategory(r.value)}. Estimación normalizada; no equivale a aclaramiento de creatinina ni confirma cronicidad. Extremos de masa muscular pueden reducir su precisión.`;
  r.source='https://www.kidney.org/professionals/ckd-epi-creatinine-equation-2021';r.transferField='tfge';
 }
 return r;
}

export function additionalLdlReduction(current,goal){if(![current,goal].every(x=>Number.isFinite(x)&&x>0))return null;return Math.max(0,(1-goal/current)*100);}
