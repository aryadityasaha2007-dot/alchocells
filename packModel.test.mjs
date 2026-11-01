import assert from 'node:assert/strict';
import { derive, simulate, req002Temp, clampInt } from './packModel.js';
const cell = { capacity: 3.5, voltage: 3.6, ir: 35, cost: 4.5, mass: 0.048, cycles: 800 };
const params = { cRate: 1, busbarResistance: 2.5, ambientTemp: 25, bmsTempTrip: 65, bmsVoltCutoff: 2.8 };
const d = derive({ series: 14, parallel: 4 }, cell, params);

// 1. Regression: values identical to the original App.jsx formulas
assert.ok(Math.abs(d.packVoltage - 50.4) < 1e-9);
assert.ok(Math.abs(d.packEnergyWh - 705.6) < 1e-9);
assert.ok(Math.abs(d.totalResistance - 125) < 1e-9);
assert.ok(Math.abs(d.qGen - 24.5) < 1e-9);
assert.ok(Math.abs(d.lcos - 0.937) < 5e-4);

// 2. REQ-002 is independent of the slider C-rate
const d3 = derive({ series: 14, parallel: 4 }, cell, { ...params, cRate: 3 });
assert.equal(req002Temp(d, 3.5), req002Temp(d3, 3.5));

// 3. Termination reason is explicit (thermal trip at 65C in the default passive case)
const r1 = simulate(d, 3.5, 'Passive (Natural Convection)', params);
assert.equal(r1.terminatedBy, 'thermal');

// 4. Voltage cutoff is now reported (this banner never fired before)
const r2 = simulate(d, 0.15, 'Phase Change Material (PCM)', { ...params, cRate: 3 });
assert.match(r2.terminatedBy, /voltage/);

// 5. Time axis: no duplicate x values at 5C (old code gave 13 distinct of 61)
const r5 = simulate(d, 0.15, 'Phase Change Material (PCM)', { ...params, cRate: 5, bmsTempTrip: 90 });
assert.equal(new Set(r5.data.map(p => p.time)).size, r5.data.length);

// 6. Input sanitising
assert.equal(clampInt(''), 1); assert.equal(clampInt('14.6'), 15); assert.equal(clampInt(500), 100);
console.log('all tests passed; default sim ends:', r1.terminatedBy, 'at', r1.data.at(-1).time, 'min;',
  '5C voltage-cutoff run ends:', r2.terminatedBy, 'at', r2.data.at(-1).time, 'min');
