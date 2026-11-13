import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue,setUnavailable} from '../src/model.mjs';
import {BRIEF_FIELDS,evaluateClinicalBrief} from '../src/clinical/consulta-breve.mjs';
const d=v=>Object.entries(v).reduce((x,[k,y])=>setValue(x,k,Array.isArray(y)?JSON.stringify(y):String(y)),createDraft());
const run=(id,v={})=>evaluateClinicalBrief(d(v),id);
const text=r=>JSON.stringify(r);
for(const id of Object.keys(BRIEF_FIELDS)){
 test(id+': sin datos no confirma elegibilidad ni emite dosis',()=>{const r=run(id);assert.equal(r.eligibilityEstablished,false);assert.equal(r.patientDose,null);assert.equal(r.prescription,null);assert.equal(r.actionPerformed,false);assert.ok(r.sources.length);assert.ok(r.missing.length);});
 for(const flag of ['cetoacidosis_sospecha','acidosis_metabolica','hipoxia_tisular','lra_sospecha','pancreatitis_sospecha','vision_subita'])test(id+': alarma compartida '+flag+' precede a cualquier clase',()=>{const r=run(id,{[flag]:'Sí',imc:'35',dm2:'Sí',ic_fevigrupo:'Reducida · FEVI <50 %',congestion:'Presentes'});assert.equal(r.state,'seguridad_prioritaria');assert.equal(r.treatment.length,0);assert.ok(r.safety.length);});
 for(const scope of [{edad:'17'},{embarazo:'Sí'},{dm1:'Sí'}])test(id+': ámbito específico '+JSON.stringify(scope),()=>{const r=run(id,scope);assert.equal(r.treatment.length,0);assert.equal(r.state,'seguridad_prioritaria');});
}
test('IC con dos criterios aporta clases y evita diurético rutinario sin congestión',()=>{const r=run('ic',{ic_fevigrupo:'Reducida · FEVI <50 %',congestion:'Ausentes'});assert.match(text(r),/betabloqueante/);assert.ok(!r.treatment.some(x=>x.title.includes('diurético de asa')));assert.match(text(r),/no añadir diurético/);assert.equal(r.missing.length,0);});
test('IC negada no se trata como conocida, aunque haya grupo de FEVI',()=>assert.equal(run('ic',{ic:'No',ic_fevigrupo:'Reducida · FEVI <50 %'}).treatment.length,0));
test('FEVI previamente reducida no indica retirar tratamiento por mejoría',()=>assert.match(text(run('ic',{ic_fevigrupo:'Preservada · FEVI ≥50 %',ic_fevi_previa_reducida:'Sí'})),/mejoría no indica retirar/));
test('ERC: unidad ausente no permite interpretar ni mostrar tratamiento',()=>{const r=run('erc',{tfge:'50',cac:'100',persistencia:'Sí'});assert.equal(r.state,'seguridad_prioritaria');assert.equal(r.treatment.length,0);});
test('ERC: una alteración sin cronicidad no activa tratamientos renales',()=>assert.equal(run('erc',{tfge:'35',cac:'400',unidad_cac:'mg/g',persistencia:'No'}).treatment.length,0));
test('ERC: rama iSGLT2 respeta el contexto y la frontera TFGe 20',()=>{
 const base={cac:'400',unidad_cac:'mg/g',persistencia:'Sí'};
 assert.ok(run('erc',{...base,tfge:'20'}).treatment.some(x=>x.title.includes('iSGLT2')));
 assert.ok(!run('erc',{...base,tfge:'19.9'}).treatment.some(x=>x.title.includes('iSGLT2')));
 assert.ok(!run('erc',{...base,tfge:'55',cac:'100',dm2:'No',ic:'No'}).treatment.some(x=>x.title.includes('iSGLT2')));
 assert.ok(run('erc',{...base,tfge:'55',cac:'100',dm2:'Sí'}).treatment.some(x=>x.title.includes('iSGLT2')));
});
test('ERC: TFGe cero no clasifica un valor fisiológicamente inválido',()=>assert.equal(run('erc',{tfge:'0',cac:'20',unidad_cac:'mg/g',persistencia:'Sí'}).state,'seguridad_prioritaria'));
for(const [bmi,dm2,has] of [['26.9','Sí',false],['27','No',false],['27','Sí',true],['30','No',true]])test('Peso: IMC '+bmi+' DM2 '+dm2,()=>{const r=run('obesidad',{imc:bmi,dm2,obesidad_perfil:['Ninguna seleccionada']});assert.equal(r.treatment.length>0,has);});
test('Peso: tratamiento incretínico previo no genera segundo inicio',()=>{const r=run('obesidad',{imc:'35',dm2:'No',obesidad_perfil:['Ninguna seleccionada'],farmacos_clases:['arGLP-1']});assert.match(r.treatment[0].title,/ya utilizada/);assert.match(r.treatment[0].detail,/No añadir/);});
for(const flag of ['ob_tca','ob_perdida_involuntaria','ob_edema','embarazo_planificado','ob_lactancia'])test('Peso: condicionante registrado '+flag+' se conserva',()=>assert.equal(run('obesidad',{imc:'35',[flag]:'Sí'}).treatment.length,0));
for(const [age,fib,band] of [['65','1.3','intermedia'],['66','1.3','baja'],['66','2','intermedia'],['55','2.67','intermedia'],['55','2.68','alta']])test('FIB4: edad '+age+' índice '+fib,()=>{
 const r=run('hepatico',{edad:age,fib4_informado:fib,hepatico_valoracion:'Esteatosis documentada y otras causas evaluadas'});assert.match(r.situation,new RegExp('banda '+band));assert.equal(r.prescription,null);
});
test('FIB4: menor de 35, enfermedad aguda y cirrosis no reciben seguimiento rutinario',()=>{
 for(const v of [{edad:'34'},{fib4_agudo:'Sí'},{masld_cirrosis:'Conocida'}]){const r=run('hepatico',{edad:'55',fib4_informado:'1',hepatico_valoracion:'Esteatosis documentada y otras causas evaluadas',...v});assert.ok(!r.steps.some(x=>x.includes('1–3 años')));}
});
test('FIB4: elastografía presente no se ignora para asignar seguimiento rutinario',()=>{const r=run('hepatico',{edad:'55',fib4_informado:'1',hepatico_valoracion:'Esteatosis documentada y otras causas evaluadas',elastografia:'12'});assert.match(text(r),/Ya consta una elastografía/);assert.ok(!r.steps.some(x=>x.includes('1–3 años')));});
test('FIB4: confirmación invalidada no se reutiliza',()=>assert.match(text(run('hepatico',{edad:'66',fib4_informado:'2.8',masld_fib4_origen:'Informado por fuente externa',masld_fib4_confirmado:'No'})),/reconfirmación/));
test('Insulina: inicio orienta a basal sin calcular dosis desde el peso',()=>{const r=run('insulina',{insulina_fase:'Valorar inicio',insulina_perfil:['Sin situación especial seleccionada']});assert.match(text(r),/basal/);assert.equal(r.patientDose,null);});
test('Insulina: debut sintomático no se convierte en una pauta ambulatoria',()=>{const r=run('insulina',{insulina_fase:'Valorar inicio',insulina_perfil:['Debut sintomático o proceso intercurrente']});assert.equal(r.treatment.length,0);assert.ok(r.safety.length||r.steps.length);});
test('HTA: cifra grave precede a la orientación de clases',()=>assert.equal(run('hta',{pas:'180',pad:'90'}).treatment.length,0));
test('HTA: PA elevada sin HTA no inicia tratamiento por la cifra',()=>assert.equal(run('hta',{pas:'130',pad:'80',hta_conocida:'No',hta_tratamiento:'Sin tratamiento'}).treatment.length,0));
test('Lípidos: objetivo corresponde a categoría aportada, sin validarla',()=>{const r=run('lipids',{ldl:'150',lip_riesgo:'Alto',lip_estatina:'Ninguna',lip_ezetimiba:'No'});assert.match(r.situation,/<70 mg/);assert.match(r.situation,/≥50/);assert.match(r.steps[0],/no se confirma/);assert.ok(r.treatment.length);assert.equal(r.eligibilityEstablished,false);});
test('Lípidos: LDL bajo no propone intensificación automática',()=>assert.equal(run('lipids',{ldl:'50',lip_riesgo:'Alto',lip_estatina:'Atorvastatina',lip_ezetimiba:'Sí'}).treatment.length,0));
test('Dato no disponible no se reutiliza para orientar una clase',()=>{const draft=setUnavailable(d({imc:'35',dm2:'No',obesidad_perfil:['Ninguna seleccionada']}),'imc',true);assert.equal(evaluateClinicalBrief(draft,'obesidad').treatment.length,0);});
test('Datos de otra consulta no modifican la ficha al leer la orientación',()=>{const draft=d({imc:'35'}),before=JSON.stringify(draft);evaluateClinicalBrief(draft,'obesidad');assert.equal(JSON.stringify(draft),before);});

test('Peso: las restricciones CIMA por producto se respetan también en la vista breve',()=>{const r=run('obesidad',{imc:'35',dm2:'No',obesidad_perfil:['Ninguna seleccionada'],tfge:'12'});assert.ok(r.treatment.every(x=>!x.title.includes('semaglutida')));assert.ok(r.treatment.some(x=>x.title.includes('tirzepatida')));assert.match(text(r),/no recomendado con TFGe/);});
for(const context of [{lip_ascvd:'Sí'},{erc:'Sí',tfge:'25'},{erc:'Sí',tfge:'50'}])test('Lípidos: categoría baja discordante con historia no fija objetivo '+JSON.stringify(context),()=>{const r=run('lipids',{ldl:'150',lip_riesgo:'Bajo',...context});assert.equal(r.treatment.length,0);assert.equal(r.state,'seguridad_prioritaria');assert.doesNotMatch(r.situation,/<116/);});

test('HTA: dos cifras y contexto muestran clases condicionadas a confirmación',()=>{const r=run('hta',{pas:'150',pad:'95',hta_conocida:'No',hta_tratamiento:'Sin tratamiento'});assert.equal(r.safety.length,0);assert.equal(r.missing.length,0);assert.match(r.treatment[0].title,/Si se confirma/);assert.match(r.treatment[0].detail,/No combinar IECA y ARA-II/);});
