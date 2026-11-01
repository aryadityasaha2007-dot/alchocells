// VoltTwin Studio - pack model extracted from App.jsx.
// FORMULAS ARE UNCHANGED from the original (same R, Q, LCOS, OCV curve, tau).
// What changes: input sanitising, explicit termination reason, decimal time axis,
// and a separate fixed-condition thermal check for REQ-002.
//
// App.jsx edits that go with this file (each is small):
//  1. Replace the derived-value block and runSimulation body with derive()/simulate().
//  2. Banners: use `terminatedBy` instead of comparing floats (the old voltage-cutoff
//     banner never shows: parseFloat("39.20") <= 14*2.8 is false in JS).
//  3. REQ-002 ("@ 1C"): use req002Temp(d, rTh) - it used the slider C-rate and ambient.
//  4. Right Y axis: domain={['auto','auto']}; [0,100] clips ambient < 0 C.
//  5. initial bmsTier must equal an <option> text ("Standard (Passive Balancing)").
//  6. exportSummary: await writeText in try/catch; only show success if it resolved.
//  7. Add id/htmlFor to labels and aria-label to sliders (slate-500 on slate-950 is 4.24:1).

export const clampInt = (v, lo = 1, hi = 100) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;
};

export const legacyTau = (cooling) => (cooling.includes('Liquid') ? 300 : 900); // seconds, original assumption

export function derive({ series, parallel }, cell, { cRate, busbarResistance }) {
  const S = clampInt(series), P = clampInt(parallel);
  const packVoltage = S * cell.voltage;
  const packCapacity = P * cell.capacity;
  const packEnergyWh = packVoltage * packCapacity;
  const totalMassEst = S * P * cell.mass * 1.35;
  const totalCostEst = S * P * cell.cost + 150;
  const lcos = totalCostEst / ((packEnergyWh / 1000) * 0.8 * cell.cycles * 0.95);
  const totalResistance = (cell.ir / P) * S + busbarResistance; // mOhm
  const I_load = cRate * packCapacity;
  const qGen = I_load ** 2 * (totalResistance / 1000);
  return { S, P, packVoltage, packCapacity, packEnergyWh, totalMassEst, totalCostEst,
           lcos, totalResistance, I_load, qGen };
}

// REQ-002 is defined "@ 1C": evaluate at 1C regardless of the slider.
export function req002Temp(d, rTh, ambient = 25) {
  const q1C = d.packCapacity ** 2 * (d.totalResistance / 1000);
  return ambient + q1C * rTh;
}

export function simulate(d, rTh, cooling, params) {
  const I = params.cRate * d.packCapacity, R = d.totalResistance / 1000;
  const dTmax = I * I * R * rTh;
  const tau = params.tauSeconds ?? legacyTau(cooling);
  const total = 3600 / params.cRate, steps = 60, dt = total / steps;
  const vMax = d.packVoltage * 1.15, vMin = d.S * params.bmsVoltCutoff;
  const data = [];
  let terminatedBy = null;
  for (let i = 0; i <= steps; i++) {
    const t = i * dt;
    const soc = Math.max(0, 100 - (t / total) * 100);
    const vRaw = vMin + (vMax - vMin) * Math.sqrt(soc / 100) - I * R;
    const T = params.ambientTemp + dTmax * (1 - Math.exp(-t / tau));
    data.push({ time: +(t / 60).toFixed(2), voltage: +Math.max(vRaw, vMin).toFixed(2),
                temperature: +T.toFixed(1), soc: +soc.toFixed(1) });
    const why = [vRaw <= vMin && 'voltage', T >= params.bmsTempTrip && 'thermal'].filter(Boolean);
    if (why.length) { terminatedBy = why.join('+'); break; }
  }
  return { data, terminatedBy };
}
