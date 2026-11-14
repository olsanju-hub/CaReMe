import {fieldState} from '../model.mjs';
import {readMulti} from '../consultas.mjs';
const g=(d,k)=>fieldState(d,k)==='registrado'?d.values[k]:null;
/** Inicio y continuidad no comparten los mismos límites. Exige producto e indicación actuales. */
export function isFinerenoneContinuation(d){
 const key=g(d,'tx_clave'),ind=g(d,'seq_fin_indicacion');
 if(g(d,'tx_operacion')!=='Escalada del mismo producto, sin interrupciones'||!['fine_erc','fine_ic'].includes(key))return false;
 if(key==='fine_erc'&&ind!=='ERC asociada a DM2'||key==='fine_ic'&&ind!=='IC con FEVI ≥40 %')return false;
 const meds=['dm2','hta','lipids','obesidad','ic','erc'].flatMap(id=>readMulti(g(d,'seq_actual_'+id)||'[]'));
 return (meds.includes('Finerenona')||g(d,'fin_estado')==='En tratamiento')&&!meds.some(x=>['Espironolactona','Eplerenona'].includes(x));
}

export function isEplerenoneContinuation(d){
 if(g(d,'tx_clave')!=='eplerenona'||g(d,'tx_operacion')!=='Escalada del mismo producto, sin interrupciones'||g(d,'seq_epl_indicacion_previa')!=='IC crónica NYHA II y FEVI ≤30 % al inicio, revisado')return false;
 const meds=['dm2','hta','lipids','obesidad','ic','erc'].flatMap(id=>readMulti(g(d,'seq_actual_'+id)||'[]'));
 return meds.includes('Eplerenona')&&!meds.some(x=>['Finerenona','Espironolactona'].includes(x));
}
