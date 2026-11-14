import test from 'node:test';
import assert from 'node:assert/strict';
import { SECTIONS, createDraft, setValue, setUnavailable, fieldState, sectionStats, totalStats, sectionForFocus } from '../src/model.mjs';

test('sin datos no infiere resultados y deja todos los campos sin registrar', () => {
  const d = createDraft(), stats = totalStats(d);
  assert.equal(stats.registrado, 0);
  assert.equal(stats.sin_registrar, SECTIONS.flatMap(s => s.fields).length);
});
test('los valores introducidos permanecen al cambiar de sección', () => {
  const draft = setValue(setValue(createDraft(), 'edad', '47'), 'tfge', '52');
  assert.equal(draft.values.edad, '47');
  assert.equal(draft.values.tfge, '52');
  assert.equal(sectionStats(draft, SECTIONS[2]).registrado, 1);
});
test('dato no disponible es distinto a vacío y no supone valor', () => {
  const d = setUnavailable(createDraft(), 'cac', true);
  assert.equal(fieldState(d, 'cac'), 'no_disponible');
  assert.equal(d.values.cac, undefined);
  assert.equal(fieldState(setUnavailable(d, 'cac', false), 'cac'), 'sin_registrar');
});
test('entradas inválidas no se clasifican como registradas', () => {
  assert.equal(fieldState(setValue(createDraft(), 'edad', '15'), 'edad'), 'revisar');
  assert.equal(fieldState(setValue(createDraft(), 'edad', '47.5'), 'edad'), 'revisar');
  assert.equal(fieldState(setValue(createDraft(), 'pas', '-10'), 'pas'), 'revisar');
  assert.equal(fieldState(setValue(createDraft(), 'dm2', 'desconocido'), 'dm2'), 'revisar');
});
test('marcar no disponible retira el valor previo', () => {
  const draft = setUnavailable(setValue(createDraft(), 'ldl', '110'), 'ldl', true);
  assert.equal(draft.values.ldl, undefined);
  assert.equal(fieldState(draft, 'ldl'), 'no_disponible');
  assert.equal(fieldState(setValue(draft, 'ldl', '120'), 'ldl'), 'registrado');
});
test('la consulta dirigida abre el dominio apropiado', () => {
  assert.equal(sectionForFocus('hepatico'), 3);
  assert.equal(sectionForFocus('integral'), 0);
});
