/** Captura de medicación REAL, nunca elección del tratamiento propuesto. */
export const SEQUENCE_MEDS={
 metformina:{label:'Metformina',className:'Metformina',key:'metformina',daily:true},
 empagliflozina:{label:'Empagliflozina',className:'iSGLT2',key:'empa_dm2'},dapagliflozina:{label:'Dapagliflozina',className:'iSGLT2',key:'dapa_dm2'},
 ozempic:{label:'Semaglutida para DM2 · Ozempic',className:'arGLP-1',key:'ozempic',weekly:true},wegovy:{label:'Semaglutida para peso · Wegovy',className:'arGLP-1',key:'wegovy',weekly:true},tirzepatida:{label:'Tirzepatida',className:'Agonista dual GIP/GLP-1',key:'tirze_dm2',weekly:true},
 losartan:{label:'Losartán',className:'ARA-II',key:'losartan'},amlodipino:{label:'Amlodipino',className:'Calcioantagonista dihidropiridínico',key:'amlodipino'},indapamida:{label:'Indapamida retard',className:'Diurético tiazídico o similar',key:'indapamida'},
 bisoprolol:{label:'Bisoprolol',className:'Betabloqueante',key:'bisoprolol'},arni:{label:'Sacubitrilo/valsartán',className:'INRA/ARNI',key:'arni'},eplerenona:{label:'Eplerenona',className:'ARM',key:'eplerenona'},espironolactona:{label:'Espironolactona',className:'ARM',key:'espironolactona'},finerenona:{label:'Finerenona',className:'ARM',key:'fine_erc'},furosemida:{label:'Furosemida',className:'Diurético de asa',key:'furosemida'},
 atorvastatina:{label:'Atorvastatina',className:'Estatina',key:'atorvastatina'},rosuvastatina:{label:'Rosuvastatina',className:'Estatina',key:'rosuvastatina'},ezetimiba:{label:'Ezetimiba',className:'Ezetimiba',key:'ezetimiba'},
 ieca:{label:'IECA',className:'IECA'},otro_ara:{label:'Otro ARA-II',className:'ARA-II'},otro_diuretico:{label:'Otro diurético',className:'Diurético tiazídico o similar'},otro_beta:{label:'Otro betabloqueante',className:'Betabloqueante'},
 iddp4:{label:'iDPP-4',className:'iDPP-4'},su:{label:'Sulfonilurea o glinida',className:'Sulfonilurea'},insulina:{label:'Insulina',className:'Insulina'},otra_incretina:{label:'Otra incretina',className:'arGLP-1'},otro_sglt2:{label:'Otro iSGLT2',className:'iSGLT2'},otro:{label:'Otro tratamiento relevante',className:null}
};
export const SEQUENCE_GROUPS={
 dm2:['metformina','empagliflozina','dapagliflozina','ozempic','wegovy','tirzepatida','iddp4','su','insulina','otra_incretina','otro_sglt2','otro'],
 hta:['losartan','amlodipino','indapamida','ieca','otro_ara','otro_diuretico','bisoprolol','otro_beta','arni','espironolactona','eplerenona','finerenona','furosemida','otro'],
 lipids:['atorvastatina','rosuvastatina','ezetimiba','otro'],obesidad:['wegovy','tirzepatida','ozempic','otra_incretina','otro'],
 ic:['empagliflozina','dapagliflozina','arni','bisoprolol','espironolactona','eplerenona','finerenona','furosemida','ieca','losartan','otro_ara','otro_beta','otro_sglt2','otro'],
 erc:['empagliflozina','dapagliflozina','losartan','ieca','otro_ara','arni','finerenona','espironolactona','eplerenona','otro_sglt2','otro'],hepatico:[]
};
export const SEQUENCE_FIELDS=[
 {id:'seq_retirada_motivo',label:'Motivo clínico para reducir antihipertensivos',type:'select',options:['PA baja u ortostatismo sintomático','Edema atribuido a amlodipino tras revisión','Carga terapéutica con PA en objetivo','Otra causa o sin aclarar']},
 {id:'seq_hta_una_toma',label:'Pauta realmente tomada del candidato a reducir',type:'select',options:['Una toma diaria confirmada','Otra pauta o sin confirmar']},
 {id:'seq_indicacion_solo_hta',label:'Otras indicaciones del candidato que señala la aplicación',type:'select',options:['Solo HTA, sin otra indicación del candidato','Tiene otra indicación o no revisado']},
 {id:'seq_control_retirada',label:'Acuerdo y vigilancia del cambio',type:'select',options:['Cambio acordado y seguimiento disponible','Pendiente o no disponible']},
 {id:'seq_fin_indicacion',label:'Indicación por la que ya recibe finerenona',type:'select',options:['ERC asociada a DM2','IC con FEVI ≥40 %','Sin confirmar']},
 {id:'seq_mra_control',label:'Control analítico utilizado para ajustar el ARM',type:'select',options:['Analítica actual revisada, sin deterioro agudo','Pendiente o no revisada']},
 {id:'seq_ic_nyha',label:'Clase funcional NYHA confirmada',type:'select',options:['I','II','III','IV','No confirmada']},
 {id:'seq_epl_indicacion_previa',label:'Indicación original de eplerenona en esta vía',type:'select',options:['IC crónica NYHA II y FEVI ≤30 % al inicio, revisado','Otra indicación o sin confirmar']},
 {id:'seq_epl_frecuencia',label:'Frecuencia real de eplerenona',type:'select',options:['Cada 24 h','Cada 48 h','No confirmada']},
 {id:'seq_epl_cyp',label:'Interacciones CYP3A4 de eplerenona',type:'select',options:['Sin inhibidor relevante tras revisión','Inhibidor leve o moderado','Inhibidor potente o sin revisar']},

 {id:'seq_ambito',label:'Situación clínica de esta consulta',type:'select',options:['Adulto estable, sin embarazo ni lactancia, sin proceso agudo','Situación especial o sin confirmar']},
 {id:'seq_objetivo',label:'Decisión que necesitas resolver',type:'select',options:['Iniciar o ajustar tratamiento','Reducir o simplificar tratamiento']},
 {id:'seq_comorbilidades',label:'Condicionantes confirmados que modifican el tratamiento',type:'multi',options:['Ninguno de los siguientes','Insuficiencia cardíaca','Enfermedad renal crónica','Enfermedad cardiovascular aterosclerótica','Obesidad','HTA o dislipemia asociadas al peso','Fragilidad']},
 {id:'seq_adherencia',label:'Tratamiento realmente tomado y continuidad',type:'select',options:['Dosis y adherencia confirmadas','Dosis omitidas o dudas de adherencia','No comprobadas']},
 {id:'seq_tolerancia',label:'Tolerancia del tratamiento actual',type:'select',options:['Buena tolerancia','Efectos adversos o intolerancia','No comprobada']},
 {id:'seq_sca_reciente',label:'Síndrome coronario agudo reciente o plan de alta aún en ajuste',type:'select',options:['Sí','No','No revisado']},
 {id:'seq_metformina_forma',label:'Presentación de metformina que ya toma',type:'select',options:['Liberación inmediata, pauta confirmada','Otra presentación o sin confirmar']},
 {id:'seq_respuesta_peso',label:'Respuesta de peso y función con la pauta actual',type:'select',options:['Insuficiente tras evaluación','Objetivo acordado alcanzado o respuesta suficiente','No evaluada']},
 {id:'seq_pad_objetivo',label:'Límite superior de PAD individualizado',type:'number',min:60,max:100,unit:'mmHg'},
 {id:'seq_pa_objetivo',label:'Límite superior de PAS individualizado para este seguimiento',type:'number',min:90,max:160,unit:'mmHg'},
 {id:'seq_pa_valida',label:'PA utilizada para decidir el ajuste',type:'select',options:['Media validada; control fuera de consulta revisado cuando corresponde','Lectura aislada o control sin confirmar']},
 {id:'seq_hta_vulnerable',label:'Edad ≥85 años, fragilidad, ortostatismo sintomático o expectativa limitada',type:'select',options:['Ninguno tras valoración','Alguno presente o sin revisar']},
 ...Object.entries(SEQUENCE_GROUPS).filter(([,ids])=>ids.length).map(([id,ids])=>({id:'seq_actual_'+id,label:'Medicamentos que ya toma y afectan esta decisión (incluye otras indicaciones)',type:'multi',options:['Sin tratamiento para esta patología',...ids.map(k=>SEQUENCE_MEDS[k].label)]})),
 ...Object.entries(SEQUENCE_MEDS).filter(([,p])=>p.key).flatMap(([id,p])=>[
  {id:'seq_dosis_'+id,label:p.label+' · dosis actual '+(p.weekly?'semanal':p.daily?'total diaria':'por toma'),type:'number',min:0,unit:p.weekly?'mg/semana':p.daily?'mg/día':'mg'},
  {id:'seq_semanas_'+id,label:p.label+' · semanas completas con la dosis actual',type:'number',integer:true,min:0,max:520,unit:'semanas'}
 ])
];
