import test from 'node:test';import assert from 'node:assert/strict';
import {createDraft,setValue,setUnavailable,setCalculatedMeasurement} from '../src/model.mjs';
import {calculateClinical,CALCULATOR_FIELDS,additionalLdlReduction} from '../src/clinical/calculadoras.mjs';
const d=v=>Object.entries(v).reduce((s,[k,v])=>setValue(s,k,String(v)),createDraft());
const kidney={edad:40,calc_sexo:'Hombre',calc_creatinina:.9,calc_creat_unidad:'mg/dL',calc_estabilidad:'Creatinina estable, sin embarazo ni diálisis'};
for(const type of Object.keys(CALCULATOR_FIELDS))test(type+': datos vacíos no generan resultado',()=>assert.equal(calculateClinical(createDraft(),type).value,null));
test('IMC de referencia 100 kg, 200 cm =25',()=>assert.equal(calculateClinical(d({peso:100,talla:200}),'imc').value,25));
test('talla introducida en metros se retiene, no genera IMC 30000',()=>assert.equal(calculateClinical(d({peso:100,talla:1.8}),'imc').value,null));
test('FIB-4 de referencia 50×40/(200×√25)=2',()=>assert.equal(calculateClinical(d({edad:50,ast:40,alt:25,plaquetas:200}),'fib4').value,2));
test('FIB-4 cero en denominador y edad pediátrica no calculan',()=>{assert.equal(calculateClinical(d({edad:50,ast:40,alt:0,plaquetas:200}),'fib4').value,null);assert.equal(calculateClinical(d({edad:17,ast:40,alt:25,plaquetas:200}),'fib4').value,null);});
test('FIB-4 adulto joven no tranquiliza por valor bajo',()=>assert.match(calculateClinical(d({edad:30,ast:20,alt:20,plaquetas:300}),'fib4').interpretation,/limitada/));
test('CKD-EPI en pivote masculino reproduce forma reducida publicada',()=>assert.ok(Math.abs(calculateClinical(d(kidney),'tfge').value-142*.9938**40)<1e-10));
test('CKD-EPI en pivote femenino reproduce factor 1,012 publicado',()=>assert.ok(Math.abs(calculateClinical(d({...kidney,calc_sexo:'Mujer',calc_creatinina:.7}),'tfge').value-142*.9938**40*1.012)<1e-10));
test('unidades mg/dL y µmol/L dan mismo resultado',()=>assert.ok(Math.abs(calculateClinical(d(kidney),'tfge').value-calculateClinical(d({...kidney,calc_creatinina:.9*88.4,calc_creat_unidad:'µmol/L'}),'tfge').value)<1e-10));
for(const v of [{calc_creatinina:0},{calc_creatinina:'NaN'},{calc_creat_unidad:''},{lra_sospecha:'Sí'},{embarazo:'Sí'},{calc_estabilidad:'No confirmada o fuera de ámbito'},{edad:17}])test('CKD-EPI retiene '+JSON.stringify(v),()=>assert.equal(calculateClinical(d({...kidney,...v}),'tfge').value,null));
test('resultado calculado solo se usa con acción explícita',()=>{const b=d(kidney),r=calculateClinical(b,'tfge');assert.equal(b.values.tfge,undefined);const c=setCalculatedMeasurement(b,'tfge',r.value,[...CALCULATOR_FIELDS.tfge,'embarazo','lra_sospecha']);assert.equal(Number(c.values.tfge),r.value);assert.equal(c.values.fecha_tfge,'');const changed=setValue(c,'calc_creatinina','1.2');assert.equal(changed.values.tfge,undefined);assert.equal(changed.values.fecha_tfge,undefined);});
test('transferencia IMC no persiste tras cambiar peso ni altera laboratorio manual',()=>{let b=d({peso:100,talla:200,tfge:60});b=setCalculatedMeasurement(b,'imc',25,CALCULATOR_FIELDS.imc);const next=setValue(b,'peso','80');assert.equal(next.values.imc,undefined);assert.equal(next.values.tfge,'60');assert.equal(b.values.imc,'25');});
test('no disponible invalida resultado derivado',()=>{let b=d(kidney);b=setCalculatedMeasurement(b,'tfge',100,CALCULATOR_FIELDS.tfge);assert.equal(setUnavailable(b,'edad',true).values.tfge,undefined);});

test('Cockcroft–Gault referencia hombre 68a 72kg creat1:72mL/min',()=>{const r=calculateClinical(d({...kidney,edad:68,calc_creatinina:1,calc_peso_cg:72,calc_peso_cg_revision:'Peso seleccionado apropiado tras revisión clínica'}),'crcl');assert.equal(r.value,72);assert.equal(r.unit,'mL/min');});
test('Cockcroft–Gault factor femenino y peso sin revisar',()=>{const base={...kidney,edad:68,calc_creatinina:1,calc_peso_cg:72,calc_sexo:'Mujer',calc_peso_cg_revision:'Peso seleccionado apropiado tras revisión clínica'};assert.equal(calculateClinical(d(base),'crcl').value,61.199999999999996);assert.equal(calculateClinical(d({...base,calc_peso_cg_revision:'Pendiente o no interpretable'}),'crcl').value,null);});
test('aclaramiento derivado invalida valor y fecha al cambiar peso elegido',()=>{let b=d({...kidney,calc_peso_cg:72});b=setCalculatedMeasurement(b,'lip_aclaramiento',72,CALCULATOR_FIELDS.crcl);b=setValue(b,'lip_fecha_aclaramiento','2026-11-13');const changed=setValue(b,'calc_peso_cg','80');assert.equal(changed.values.lip_aclaramiento,undefined);assert.equal(changed.values.lip_fecha_aclaramiento,undefined);});

test('reducción LDL desde 160 hasta umbral 70 es 56,25%',()=>{assert.equal(additionalLdlReduction(160,70),56.25);assert.equal(additionalLdlReduction(60,70),0);assert.equal(additionalLdlReduction(0,70),null);});
