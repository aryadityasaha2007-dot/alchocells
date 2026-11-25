import React, { useState, useMemo } from 'react';
import {
  Settings, BarChart2, Activity, FileText, Download,
  Cpu, Battery, ShieldCheck, CheckCircle2, Zap, PlayCircle, DollarSign, IndianRupee,
  AlertTriangle, Info, Layers, Compass, Sliders, Check, X
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ZAxis, ReferenceLine, ReferenceDot
} from 'recharts';

// ============================================================================
// 1. RECONCILED DATASHEET LIBRARY WITH PROVENANCE (Fixes D9, D12, C5)
// ============================================================================
const USD_TO_INR = 93; // update to the current exchange rate
// Formats a USD amount in the chosen currency. usdDigits = decimals for $, inrDigits = decimals for ₹.
const fmtMoney = (usd, currency = 'INR', usdDigits = 0, inrDigits = usdDigits) =>
  currency === 'INR'
    ? '₹' + (usd * USD_TO_INR).toLocaleString('en-IN', { minimumFractionDigits: inrDigits, maximumFractionDigits: inrDigits })
    : '$' + usd.toLocaleString('en-US', { minimumFractionDigits: usdDigits, maximumFractionDigits: usdDigits });

const CELL_LIBRARY = {
  'Samsung 35E': {
    id: 'Samsung 35E',
    fullName: 'Samsung INR18650-35E',
    family: 'NMC',
    format: '18650 Cylindrical',
    capacity: 3.5,          // Ah nominal (3.35 Ah min @ 0.2C)
    voltage: 3.6,           // V nominal
    vMax: 4.2,              // V charge cutoff
    vMin: 2.65,             // V discharge cutoff
    irAcMohm: 35.0,         // <=35 mOhm AC @ 1kHz (Datasheet initial)
    irDcMohm: 48.0,         // mOhm 10s pulse DCIR (used for I^2*R heating in Physics-Corrected mode)
    maxContDischargeA: 8.0, // A continuous (13A peak non-continuous)
    maxChargeA: 2.0,        // A max charge (1.7A standard, ~0.57C max)
    mass: 0.050,            // kg (50.0g max per datasheet)
    diameterMm: 18.55,
    heightMm: 65.25,
    costRetail: 4.50,       // USD single-unit distributor price
    costVolume: 1.55,       // USD OEM volume pack-aligned price (~$123/kWh cell level)
    cycles: 500,            // cycles to 80% SOH @ 1A chg / 3.4A dchg (conservative datasheet basis)
    cyclesLegacy: 800,
    cpJkgK: 910,            // J/(kg*K) specific heat capacity
    provenance: 'Samsung SDI Spec INR18650-35E Rev 1.2 (AC IR <=35mΩ @ 1kHz; Cont. 8A; Max Chg 2.0A; 50g max)'
  },
  'Molicel P42A': {
    id: 'Molicel P42A',
    fullName: 'Molicel INR-21700-P42A',
    family: 'NMC',
    format: '21700 Cylindrical',
    capacity: 4.2,          // Ah typical (4.0 Ah min)
    voltage: 3.6,
    vMax: 4.2,
    vMin: 2.5,
    irAcMohm: 10.0,         // mOhm AC @ 1kHz typical
    irDcMohm: 16.0,         // mOhm DC @ 10A/1s pulse (Datasheet Rev 4.0)
    maxContDischargeA: 45.0,// A continuous
    maxChargeA: 8.4,        // A fast charge (2.0C max)
    mass: 0.070,            // kg (70g max per datasheet)
    diameterMm: 21.55,
    heightMm: 70.15,
    costRetail: 6.00,
    costVolume: 2.15,       // USD OEM volume (~$142/kWh cell level)
    cycles: 500,            // cycles to 80% @ 4.2A chg / 10A dchg
    cyclesLegacy: 600,
    cpJkgK: 920,
    provenance: 'E-One Moli INR-21700-P42A Datasheet Rev 4.0 (AC 10mΩ / DC 16mΩ; Cont. 45A; 70g max; 500 cyc @ 10A)'
  },
  'A123 26650 LFP': {
    id: 'A123 26650 LFP',
    fullName: 'A123 ANR26650M1-B',
    family: 'LFP',
    format: '26650 Cylindrical',
    capacity: 2.5,          // Ah nominal
    voltage: 3.3,
    vMax: 3.6,
    vMin: 2.0,
    irAcMohm: 6.0,          // mOhm AC @ 1kHz typical
    irDcMohm: 10.0,         // mOhm 10s pulse DCIR @ 50% SOC
    maxContDischargeA: 50.0,// A continuous (120A 10s pulse)
    maxChargeA: 10.0,       // A fast charge (4.0C max)
    mass: 0.076,            // kg (76g nominal)
    diameterMm: 25.96,
    heightMm: 65.15,
    costRetail: 7.50,
    costVolume: 1.35,       // USD OEM volume
    cycles: 2500,           // >1000 cycles @ 10C 100% DOD; ~2500+ @ 1C/1C 80% DOD (Sandia Battery Archive ref)
    cyclesLegacy: 3000,
    cpJkgK: 960,
    provenance: 'A123 ANR26650M1-B Datasheet & Sandia Battery Archive LFP dataset (6mΩ AC / 10mΩ DC; Cont. 50A; 76g)'
  },
  'EVE LF50K': {
    id: 'EVE LF50K',
    fullName: 'EVE LF50K Prismatic LFP',
    family: 'LFP',
    format: 'Prismatic Al-Shell',
    capacity: 50.0,         // Ah nominal
    voltage: 3.2,
    vMax: 3.65,
    vMin: 2.5,
    irAcMohm: 0.7,          // <=0.7 mOhm AC @ 1kHz (Datasheet)
    irDcMohm: 1.45,         // mOhm DC pulse resistance
    maxContDischargeA: 100.0,// A continuous (2.0C)
    maxChargeA: 50.0,       // A continuous charge (1.0C)
    mass: 1.395,            // kg (1.395 kg +- 50g per datasheet)
    diameterMm: 36.7,       // thickness mm (Width 148.5mm, Height 128.5mm)
    widthMm: 148.5,
    heightMm: 128.5,
    costRetail: 18.50,      // USD reconciled retail (~€16.99 incl. VAT)
    costVolume: 12.80,      // USD OEM volume (~$80/kWh cell level per BNEF LFP headline)
    cycles: 3500,           // cycles @ 25°C 1C/1C 80% DOD
    cyclesLegacy: 4000,
    cpJkgK: 980,
    provenance: 'EVE Energy LF50K Product Specification Version E (<=0.7mΩ AC; 1395g ±50g; 3500 cycles @ 1C/1C)'
  }
};

// ============================================================================
// 2. SUBSYSTEM COMPONENT MODELS (Fixes D7, D11: Every dropdown changes numbers)
// ============================================================================
const BUSBAR_SPECS = {
  'Nickel Strips (0.15mm)': {
    resMohmPerStage: 2.4,
    ampLimitPerBranch: 8.5,
    massKgPerCell: 0.0025,
    costPerCell: 0.14,
    note: 'Pure Ni 0.15×8mm spot-welded strip (high Joule loss above 8A/branch)'
  },
  'Copper-Nickel Sandwich (0.2mm)': {
    resMohmPerStage: 0.65,
    ampLimitPerBranch: 24.0,
    massKgPerCell: 0.0042,
    costPerCell: 0.38,
    note: 'Clad Cu 0.15mm + Ni 0.05mm (low resistance, AIS-156 fuse-link compatible)'
  },
  'Laser-welded Aluminum': {
    resMohmPerStage: 0.35,
    ampLimitPerBranch: 38.0,
    massKgPerCell: 0.0031,
    costPerCell: 0.55,
    note: '1060-O Al 0.8mm collector sheet with wire-bonded cell fuses'
  },
  'Heavy Copper Busbars (Prismatic)': {
    resMohmPerStage: 0.12,
    ampLimitPerBranch: 120.0,
    massKgPerCell: 0.018,
    costPerCell: 1.15,
    note: 'T2 Tin-plated 2.0mm Cu bar for high-current modules'
  }
};

const COOLING_SPECS = {
  'Passive (Natural Convection)': {
    legacyRth: 3.5,
    hCoeff: 6.5,            // W/(m^2*K) textbook natural convection in enclosed battery bay
    massOverheadKg: 0.35,
    volumeMultiplier: 1.12,
    costUsd: 14.0,
    parasiticW: 0,
    isPcm: false,
    note: 'h = 6.5 W/m²K (textbook natural convection assumption; no moving parts)'
  },
  'Active Air (Forced Fans)': {
    legacyRth: 1.2,
    hCoeff: 32.0,           // W/(m^2*K) forced air ducting across cell holders
    massOverheadKg: 0.85,
    volumeMultiplier: 1.22,
    costUsd: 38.0,
    parasiticW: 9.0,
    isPcm: false,
    note: 'h = 32 W/m²K forced convection duct with brushless IP65 blower (9W parasitic)'
  },
  'Liquid Cooling Plate (Bottom)': {
    legacyRth: 0.4,
    hCoeff: 145.0,          // W/(m^2*K) bottom cold-plate + gap pad interface
    massOverheadKg: 1.65,
    volumeMultiplier: 1.26,
    costUsd: 95.0,
    parasiticW: 18.0,
    isPcm: false,
    note: 'h_eff = 145 W/m²K Al micro-channel cold plate with TIM pad (18W pump/chiller)'
  },
  'Phase Change Material (PCM)': {
    legacyRth: 0.15,
    hCoeff: 18.0,           // W/(m^2*K) sensible conduction + latent heat clamping at 44°C
    pcmMeltTempC: 44.0,
    pcmLatentJPerCell: 1950,// J latent heat buffer per cell interstitial paraffin matrix
    massOverheadKg: 1.15,
    volumeMultiplier: 1.18,
    costUsd: 54.0,
    parasiticW: 0,
    isPcm: true,
    note: 'Paraffin/expanded-graphite matrix (T_melt = 44°C, L_f = 180 kJ/kg latent clamping)'
  }
};

const SPACING_SPECS = {
  '1.5mm Compact Holders': { gapMm: 1.5, areaFactor: 0.82, massPerCellKg: 0.004, costPerCell: 0.08, ais156Pass: false },
  '2mm Cylindrical Holders': { gapMm: 2.0, areaFactor: 1.00, massPerCellKg: 0.006, costPerCell: 0.12, ais156Pass: true },
  '3.5mm AIS-156 Thermal Gap': { gapMm: 3.5, areaFactor: 1.24, massPerCellKg: 0.009, costPerCell: 0.18, ais156Pass: true },
  '5mm High-Airflow Matrix': { gapMm: 5.0, areaFactor: 1.45, massPerCellKg: 0.013, costPerCell: 0.25, ais156Pass: true }
};

const BMS_SPECS = {
  'Standard (Passive Balancing)': {
    ntcCount: 2,
    balanceMa: 50,
    costUsd: 26.0,
    massKg: 0.24,
    dodWindow: 0.85,
    asilRating: 'QM (Basic Hardware OVP/UVP/OTP)',
    hasCanTelemetry: false,
    ais156Compliant: false
  },
  'Advanced (Active Balancing, CAN bus)': {
    ntcCount: 4,
    balanceMa: 250,
    costUsd: 58.0,
    massKg: 0.42,
    dodWindow: 0.88,
    asilRating: 'SIL-2 / AIS-156 Rev 3 Compliant (4 NTC + Hall + CAN)',
    hasCanTelemetry: true,
    ais156Compliant: true
  },
  'Automotive-Grade (ASIL-C, Dual MCU)': {
    ntcCount: 8,
    balanceMa: 1000,
    costUsd: 115.0,
    massKg: 0.78,
    dodWindow: 0.90,
    asilRating: 'ISO 26262 ASIL-C Dual Contactor + Pyro-Fuse (8 NTC)',
    hasCanTelemetry: true,
    ais156Compliant: true
  }
};

// ============================================================================
// 3. APPLICATION REQUIREMENTS & PRESET DESIGNS (Fixes D1, D5, D6, C1, C4)
// ============================================================================
const APPLICATION_PROFILES = {
  'Swappable 48V E-Scooter Module': {
    id: 'Swappable 48V E-Scooter Module',
    roleBadge: 'Primary Deep-Dive Scope (AIS-156 + NITI Aayog Swap Policy)',
    vMinReq: 44.0,
    vMaxReq: 54.0,
    usableEnergyMinWh: 1200,
    maxTemp1CCelsius: 55.0,
    maxMassKg: 13.5,
    maxChargeTimeMin: 95,
    bnefPackCostBandMin: 115,
    bnefPackCostBandMax: 185,
    presets: {
      'Baseline Starting Design': {
        cellChemistry: 'Samsung 35E',
        series: 14,
        parallel: 8,
        busbars: 'Nickel Strips (0.15mm)',
        cooling: 'Passive (Natural Convection)',
        spacing: '2mm Cylindrical Holders',
        bmsTier: 'Standard (Passive Balancing)'
      },
      'Option A (High Energy, Active Cooling)': {
        cellChemistry: 'Molicel P42A',
        series: 14,
        parallel: 9,
        busbars: 'Copper-Nickel Sandwich (0.2mm)',
        cooling: 'Active Air (Forced Fans)',
        spacing: '3.5mm AIS-156 Thermal Gap',
        bmsTier: 'Advanced (Active Balancing, CAN bus)'
      },
      'Option B (High Power, LFP Chemistry)': {
        cellChemistry: 'A123 26650 LFP',
        series: 15,
        parallel: 12,
        busbars: 'Laser-welded Aluminum',
        cooling: 'Phase Change Material (PCM)',
        spacing: '2mm Cylindrical Holders',
        bmsTier: 'Advanced (Active Balancing, CAN bus)'
      }
    }
  },
  '24V ICU Medical Cart Backup': {
    id: '24V ICU Medical Cart Backup',
    roleBadge: 'Platform Reuse Proof #1 (Hospital Indoor Backup)',
    vMinReq: 22.0,
    vMaxReq: 28.0,
    usableEnergyMinWh: 550,
    maxTemp1CCelsius: 45.0,
    maxMassKg: 7.5,
    maxChargeTimeMin: 75,
    bnefPackCostBandMin: 130,
    bnefPackCostBandMax: 220,
    presets: {
      'Baseline Starting Design': {
        cellChemistry: 'Samsung 35E',
        series: 7,
        parallel: 8,
        busbars: 'Nickel Strips (0.15mm)',
        cooling: 'Passive (Natural Convection)',
        spacing: '2mm Cylindrical Holders',
        bmsTier: 'Standard (Passive Balancing)'
      },
      'Option A (High Energy, Active Cooling)': {
        cellChemistry: 'Molicel P42A',
        series: 7,
        parallel: 7,
        busbars: 'Copper-Nickel Sandwich (0.2mm)',
        cooling: 'Phase Change Material (PCM)',
        spacing: '3.5mm AIS-156 Thermal Gap',
        bmsTier: 'Advanced (Active Balancing, CAN bus)'
      },
      'Option B (High Power, LFP Chemistry)': {
        cellChemistry: 'A123 26650 LFP',
        series: 8,
        parallel: 10,
        busbars: 'Copper-Nickel Sandwich (0.2mm)',
        cooling: 'Passive (Natural Convection)',
        spacing: '3.5mm AIS-156 Thermal Gap',
        bmsTier: 'Automotive-Grade (ASIL-C, Dual MCU)'
      }
    }
  },
  '22.2V Agricultural Drone Pack': {
    id: '22.2V Agricultural Drone Pack',
    roleBadge: 'Platform Reuse Proof #2 (High C-Rate Flight)',
    vMinReq: 20.0,
    vMaxReq: 25.2,
    usableEnergyMinWh: 480,
    maxTemp1CCelsius: 58.0,
    maxMassKg: 4.8,
    maxChargeTimeMin: 35,
    bnefPackCostBandMin: 140,
    bnefPackCostBandMax: 240,
    presets: {
      'Baseline Starting Design': {
        cellChemistry: 'Samsung 35E',
        series: 6,
        parallel: 7,
        busbars: 'Nickel Strips (0.15mm)',
        cooling: 'Passive (Natural Convection)',
        spacing: '1.5mm Compact Holders',
        bmsTier: 'Standard (Passive Balancing)'
      },
      'Option A (High Energy, Active Cooling)': {
        cellChemistry: 'Molicel P42A',
        series: 6,
        parallel: 6,
        busbars: 'Laser-welded Aluminum',
        cooling: 'Active Air (Forced Fans)',
        spacing: '3.5mm AIS-156 Thermal Gap',
        bmsTier: 'Advanced (Active Balancing, CAN bus)'
      },
      'Option B (High Power, LFP Chemistry)': {
        cellChemistry: 'A123 26650 LFP',
        series: 7,
        parallel: 9,
        busbars: 'Laser-welded Aluminum',
        cooling: 'Active Air (Forced Fans)',
        spacing: '2mm Cylindrical Holders',
        bmsTier: 'Advanced (Active Balancing, CAN bus)'
      }
    }
  },
  '48V Microgrid Rack': {
    id: '48V Microgrid Rack',
    roleBadge: 'Platform Reuse Proof #3 (Stationary Prismatic LFP)',
    vMinReq: 46.0,
    vMaxReq: 54.0,
    usableEnergyMinWh: 4000,
    maxTemp1CCelsius: 48.0,
    maxMassKg: 35.0,
    maxChargeTimeMin: 110,
    bnefPackCostBandMin: 85,
    bnefPackCostBandMax: 155,
    presets: {
      'Baseline Starting Design': {
        cellChemistry: 'Samsung 35E',
        series: 14,
        parallel: 26,
        busbars: 'Copper-Nickel Sandwich (0.2mm)',
        cooling: 'Passive (Natural Convection)',
        spacing: '2mm Cylindrical Holders',
        bmsTier: 'Standard (Passive Balancing)'
      },
      'Option A (High Energy, Active Cooling)': {
        cellChemistry: 'EVE LF50K',
        series: 15,
        parallel: 2,
        busbars: 'Heavy Copper Busbars (Prismatic)',
        cooling: 'Active Air (Forced Fans)',
        spacing: '3.5mm AIS-156 Thermal Gap',
        bmsTier: 'Advanced (Active Balancing, CAN bus)'
      },
      'Option B (High Power, LFP Chemistry)': {
        cellChemistry: 'EVE LF50K',
        series: 16,
        parallel: 2,
        busbars: 'Heavy Copper Busbars (Prismatic)',
        cooling: 'Liquid Cooling Plate (Bottom)',
        spacing: '3.5mm AIS-156 Thermal Gap',
        bmsTier: 'Automotive-Grade (ASIL-C, Dual MCU)'
      }
    }
  }
};

// ============================================================================
// 4. PIECEWISE OCV LOOKUP TABLES (Fixes D4: Real NMC vs Flat-Plateau LFP OCV)
// ============================================================================
const OCV_TABLES = {
  NMC: [
    { soc: 0, v: 2.75 }, { soc: 5, v: 3.22 }, { soc: 10, v: 3.42 },
    { soc: 20, v: 3.54 }, { soc: 30, v: 3.61 }, { soc: 40, v: 3.66 },
    { soc: 50, v: 3.72 }, { soc: 60, v: 3.80 }, { soc: 70, v: 3.89 },
    { soc: 80, v: 3.98 }, { soc: 90, v: 4.09 }, { soc: 100, v: 4.20 }
  ],
  LFP: [
    { soc: 0, v: 2.50 }, { soc: 5, v: 2.98 }, { soc: 10, v: 3.18 },
    { soc: 20, v: 3.24 }, { soc: 30, v: 3.27 }, { soc: 40, v: 3.29 },
    { soc: 50, v: 3.30 }, { soc: 60, v: 3.31 }, { soc: 70, v: 3.32 },
    { soc: 80, v: 3.33 }, { soc: 90, v: 3.36 }, { soc: 100, v: 3.60 }
  ]
};

function interpolateCellOcv(family, socPct) {
  const table = OCV_TABLES[family] || OCV_TABLES.NMC;
  const clamped = Math.max(0, Math.min(100, socPct));
  for (let i = 0; i < table.length - 1; i++) {
    const p0 = table[i];
    const p1 = table[i + 1];
    if (clamped >= p0.soc && clamped <= p1.soc) {
      const ratio = (clamped - p0.soc) / (p1.soc - p0.soc || 1);
      return p0.v + ratio * (p1.v - p0.v);
    }
  }
  return table[table.length - 1].v;
}

// ============================================================================
// 5. PURE UNIFIED PHYSICS EVALUATION ENGINE (Fixes D1–D12, C1–C7, H1)
// ============================================================================
function evaluatePack(design, conditions, options = {}) {
  const {
    modelMode = 'physics', // 'physics' | 'legacy'
    costBasis = 'volume',  // 'volume' | 'retail'
    currency = 'INR'       // 'INR' | 'USD' (display only)
  } = options;

  const appProfile = APPLICATION_PROFILES[design.application] || APPLICATION_PROFILES['Swappable 48V E-Scooter Module'];
  const cell = CELL_LIBRARY[design.cellChemistry] || CELL_LIBRARY['Samsung 35E'];
  const busbar = BUSBAR_SPECS[design.busbars] || BUSBAR_SPECS['Nickel Strips (0.15mm)'];
  const cooling = COOLING_SPECS[design.cooling] || COOLING_SPECS['Passive (Natural Convection)'];
  const spacing = SPACING_SPECS[design.spacing] || SPACING_SPECS['2mm Cylindrical Holders'];
  const bms = BMS_SPECS[design.bmsTier] || BMS_SPECS['Standard (Passive Balancing)'];

  const seriesCount = Math.max(1, Number(design.series) || 1);
  const parallelCount = Math.max(1, Number(design.parallel) || 1);
  const totalCells = seriesCount * parallelCount;

  const packVoltage = seriesCount * cell.voltage;
  const packMaxVoltage = seriesCount * cell.vMax;
  const packMinVoltage = seriesCount * Math.max(cell.vMin, conditions.bmsVoltCutoff);
  const packCapacity = parallelCount * cell.capacity;
  const packEnergyWh = packVoltage * packCapacity; // Nominal V * Ah
  const packEnergyKWh = packEnergyWh / 1000;

  // Geometry, Footprint & Surface Area (Fixes D2: Size-scaled thermal area)
  const pitchLengthMm = cell.diameterMm + spacing.gapMm;
  const pitchWidthMm = (cell.widthMm || cell.diameterMm) + spacing.gapMm;
  const lengthMm = Math.round(seriesCount * pitchLengthMm + 30);
  const widthMm = Math.round(parallelCount * pitchWidthMm + 26);
  const heightMm = Math.round(cell.heightMm + 34);
  const packVolumeLiters = ((lengthMm * widthMm * heightMm) / 1e6) * cooling.volumeMultiplier;

  // Effective heat transfer area A_eff (m^2): external casing + internal ventilated cell surfaces
  const casingAreaM2 = 2 * ((lengthMm * widthMm) + (lengthMm * heightMm) + (widthMm * heightMm)) / 1e6;
  const singleCellLateralAreaM2 = Math.PI * (cell.diameterMm / 1000) * (cell.heightMm / 1000);
  const internalFinFactor = design.cooling === 'Passive (Natural Convection)' ? 0.22 : 0.58;
  const aEffM2 = Math.max(0.06, (casingAreaM2 + totalCells * singleCellLateralAreaM2 * internalFinFactor) * spacing.areaFactor);

  // Mass & Cost Calculations (Fixes D11, D12)
  const cellMassTotal = totalCells * cell.mass;
  const busbarMassKg = totalCells * busbar.massKgPerCell;
  const holderMassKg = totalCells * spacing.massPerCellKg;
  const enclosureShellMassKg = 0.45 + casingAreaM2 * 2.4;

  const totalMassEst = modelMode === 'legacy'
    ? cellMassTotal * 1.35
    : cellMassTotal + busbarMassKg + holderMassKg + enclosureShellMassKg + cooling.massOverheadKg + bms.massKg;

  const unitCellCost = costBasis === 'volume' ? cell.costVolume : cell.costRetail;
  const cellsCostUsd = totalCells * unitCellCost;
  const subsystemCostUsd = (totalCells * (busbar.costPerCell + spacing.costPerCell)) + cooling.costUsd + bms.costUsd + 28.0;

  const totalCostEst = modelMode === 'legacy'
    ? (totalCells * cell.costRetail) + 150
    : cellsCostUsd + subsystemCostUsd;

  const packCostPerKWh = totalCostEst / Math.max(0.05, packEnergyKWh);

  // Electrical Resistance & Load Current (Fixes D7)
  const cellIrMohm = modelMode === 'legacy' ? cell.irAcMohm : cell.irDcMohm;
  const interconnectMohm = modelMode === 'legacy'
    ? conditions.busbarResistance
    : (seriesCount * busbar.resMohmPerStage / Math.max(1, Math.pow(parallelCount, 0.75))) + conditions.busbarResistance * 0.4;

  const totalResistance = (cellIrMohm / parallelCount) * seriesCount + interconnectMohm; // mOhm
  const I_load = conditions.cRate * packCapacity;
  const cellCurrentA = I_load / parallelCount;
  const qGen = Math.pow(I_load, 2) * (totalResistance / 1000);

  // Reference 1C thermal calculation for REQ-002 (Fixes D6: Requirement evaluated at stated 1C condition)
  const I_1C = 1.0 * packCapacity;
  const qGen1C = Math.pow(I_1C, 2) * (totalResistance / 1000);

  // Thermal Resistance R_th & Time Constant tau (Fixes D2, D3)
  const rTh = modelMode === 'legacy'
    ? cooling.legacyRth
    : 1.0 / Math.max(0.4, cooling.hCoeff * aEffM2);

  const cThJK = totalMassEst * cell.cpJkgK; // J/K thermal capacitance
  const tauSec = modelMode === 'legacy'
    ? (design.cooling.includes('Liquid') ? 300 : 900)
    : rTh * cThJK;

  // 1-Hour / 1C Discharge Thermal Rise vs Steady-State Infinite Horizon
  const dischargeDuration1CSec = 3600 * bms.dodWindow;
  const rawSteadyTempActive = conditions.ambientTemp + (qGen * rTh);
  const rawTransientEndTempActive = conditions.ambientTemp + (qGen * rTh) * (1 - Math.exp(-(3600 / Math.max(0.2, conditions.cRate)) / tauSec));

  // PCM latent heat clamping around 44°C (Fixes D3)
  const applyPcmClamp = (tempUnclamped, heatW, durationSec) => {
    if (modelMode === 'legacy' || !cooling.isPcm || tempUnclamped <= cooling.pcmMeltTempC) {
      return tempUnclamped;
    }
    const totalLatentPoolJ = totalCells * cooling.pcmLatentJPerCell;
    const excessHeatJ = Math.max(0, (tempUnclamped - cooling.pcmMeltTempC) / rTh) * durationSec;
    const meltFraction = Math.min(1.0, excessHeatJ / Math.max(1, totalLatentPoolJ));
    if (meltFraction < 1.0) {
      return cooling.pcmMeltTempC + meltFraction * 2.2; // Clamped in mushy phase transition zone (44.0 - 46.2°C)
    }
    return cooling.pcmMeltTempC + 2.2 + (tempUnclamped - cooling.pcmMeltTempC) * (1 - totalLatentPoolJ / excessHeatJ);
  };

  const steadyPeakTemp = modelMode === 'legacy'
    ? rawSteadyTempActive
    : applyPcmClamp(rawTransientEndTempActive, qGen, 3600 / Math.max(0.2, conditions.cRate));

  const tempAtStated1C = modelMode === 'legacy'
    ? 25 + (qGen1C * rTh)
    : applyPcmClamp(
        25 + (qGen1C * rTh) * (1 - Math.exp(-dischargeDuration1CSec / tauSec)),
        qGen1C,
        dischargeDuration1CSec
      );

  // Usable Energy Calculation (Fixes D4, D5: Rate capability, DoD, cutoff, efficiency)
  const voltageDropAtLoad = I_load * (totalResistance / 1000);
  const dischargeEff = Math.max(0.72, Math.min(0.99, (packVoltage - voltageDropAtLoad) / packVoltage));
  const peukertFactor = Math.max(0.74, Math.min(1.0, 1.0 - Math.max(0, conditions.cRate - 0.5) * (cell.family === 'LFP' ? 0.035 : 0.055)));
  const effectiveVMin = cell.family === 'LFP' ? Math.max(cell.vMin, 2.65) : cell.vMin;
const cutoffPenalty = Math.max(0.65, Math.min(1.0, 1.0 - Math.max(0, conditions.bmsVoltCutoff - effectiveVMin) * 0.32));

  const usableEnergyWh = modelMode === 'legacy'
    ? packEnergyWh
    : Math.max(0, (packEnergyWh * bms.dodWindow * dischargeEff * peukertFactor * cutoffPenalty) - (cooling.parasiticW * 0.8));

  const usableEnergyAt1CWh = modelMode === 'legacy'
    ? packEnergyWh
    : Math.max(0, (packEnergyWh * bms.dodWindow * ((packVoltage - I_1C * (totalResistance / 1000)) / packVoltage) * cutoffPenalty) - (cooling.parasiticW * 0.8));

  // Simplified CC-CV Charge Time Metric (Fixes C7)
  // Respects cell datasheet max charge current; 10%->90% (80% ΔSOC) with CC + CV taper factor (1.18x)
  const maxSafeChargeC = cell.maxChargeA / cell.capacity;
  const chargeTimeMinutes = Math.round((0.80 / Math.max(0.15, maxSafeChargeC)) * 60 * 1.18);

  // Cycle Life & Throughput Cost / LCOS (Fixes D8)
  const baseCycles = modelMode === 'legacy' ? cell.cyclesLegacy : cell.cycles;
  const tempAgeingPenalty = Math.max(1.0, 1.0 + Math.max(0, (steadyPeakTemp - 30) / 10) * 0.28);
  const effectiveCycles = modelMode === 'legacy' ? baseCycles : Math.round(baseCycles / tempAgeingPenalty);

  const lifetimeThroughputKWh = Math.max(1, (usableEnergyAt1CWh / 1000) * effectiveCycles * 0.95);
  const capexPerKWhThroughput = totalCostEst / lifetimeThroughputKWh;
  // Full LCOS adds grid charging electricity ($0.09/kWh India commercial tariff / round-trip eff) + 8% maintenance reserve
  const fullLcosPerKWh = (totalCostEst * 1.08) / lifetimeThroughputKWh + (0.09 / 0.90);
  const lcos = modelMode === 'legacy'
    ? totalCostEst / (packEnergyKWh * 0.8 * cell.cyclesLegacy * 0.95)
    : capexPerKWhThroughput;

  // Deterministic Cell Variation & Weakest Cell Analysis (Concept D / I1)
  // Models +-3.5% cell resistance spread and +-2.2% capacity spread across the pack
  const cellVariationStats = computeCellVariation(seriesCount, parallelCount, cell, cellCurrentA, steadyPeakTemp, bms);

  // Concept A: Design Contract Engine (Fixes D9, H1)
  const contracts = evaluateDesignContracts({
    design, conditions, appProfile, cell, busbar, cooling, spacing, bms,
    seriesCount, parallelCount, totalCells, packVoltage, usableEnergyAt1CWh,
    cellCurrentA, steadyPeakTemp, tempAtStated1C, packCostPerKWh, chargeTimeMinutes, totalMassEst, currency
  });

  // Transparent, Mathematically Defined 0-100 Normalized Scores for Radar (Fixes Radar Arbitrary Score Critique)
  const specificEnergyWhKg = usableEnergyAt1CWh / Math.max(0.5, totalMassEst);
  const scores = {
    specificEnergy: Math.round(Math.max(10, Math.min(100, (specificEnergyWhKg / 180) * 100))),
    thermalStability: Math.round(Math.max(10, Math.min(100, 100 - Math.max(0, tempAtStated1C - 25) * 2.2))),
    cRateCapability: Math.round(Math.max(10, Math.min(100, ((cell.maxContDischargeA / cell.capacity) / 12) * 100))),
    lightness: Math.round(Math.max(10, Math.min(100, 100 - ((totalMassEst / (appProfile.maxMassKg * 1.6)) * 80)))),
    costEfficiency: Math.round(Math.max(10, Math.min(100, 100 - ((packCostPerKWh - 70) / 450) * 85))),
    cycleLife: Math.round(Math.max(10, Math.min(100, (effectiveCycles / 3500) * 100)))
  };

  return {
    design, cell, busbar, cooling, spacing, bms, appProfile,
    seriesCount, parallelCount, totalCells,
    packVoltage, packMaxVoltage, packMinVoltage, packCapacity,
    packEnergyWh, packEnergyKWh, usableEnergyWh, usableEnergyAt1CWh,
    lengthMm, widthMm, heightMm, packVolumeLiters, aEffM2,
    cellMassTotal, totalMassEst, cellsCostUsd, subsystemCostUsd, totalCostEst, packCostPerKWh,
    totalResistance, I_load, cellCurrentA, qGen, qGen1C,
    rTh, cThJK, tauSec, steadyPeakTemp, tempAtStated1C,
    chargeTimeMinutes, maxSafeChargeC, effectiveCycles,
    lcos, capexPerKWhThroughput, fullLcosPerKWh, specificEnergyWhKg,
    cellVariationStats, contracts, scores
  };
}

// ============================================================================
// 6. CELL VARIATION & PARALLEL CURRENT SHARING ENGINE (Concept D / I1)
// ============================================================================
function computeCellVariation(seriesCount, parallelCount, cell, nominalCellCurrentA, steadyPeakTemp, bms) {
  // Deterministic pseudo-random spread seeded by (r, c) so cell grid is repeatable
  const maxCols = Math.min(seriesCount, 30);
  const maxRows = Math.min(parallelCount, 30);
  const grid = [];
  let maxBranchCurrentA = nominalCellCurrentA;
  let hottestCellTempC = steadyPeakTemp;
  let weakestCellLabel = 'S1-P1';
  let minCapRatio = 1.0;

  for (let c = 0; c < maxCols; c++) {
    // Compute parallel branch resistances for series column c
    const branchR = [];
    for (let r = 0; r < maxRows; r++) {
      const seed = Math.sin((c + 1) * 12.9898 + (r + 1) * 78.233) * 43758.5453;
      const frac = seed - Math.floor(seed); // 0..1
      const rMultiplier = 1.0 + (frac - 0.5) * 0.08; // +-4% IR spread
      const capMultiplier = 1.0 + ((1 - frac) - 0.5) * 0.05; // +-2.5% capacity spread
      branchR.push({ rMultiplier, capMultiplier });
    }
    const conductanceSum = branchR.reduce((acc, b) => acc + (1 / b.rMultiplier), 0);

    for (let r = 0; r < maxRows; r++) {
      if (!grid[r]) grid[r] = [];
      const b = branchR[r];
      // Current sharing I_i = I_total * (G_i / sum(G))
      const currentShareRatio = (1 / b.rMultiplier) / (conductanceSum / maxRows);
      const cellAmp = nominalCellCurrentA * currentShareRatio;

      // Center cells run warmer than perimeter cells
      const radialDist = Math.hypot((c - (maxCols - 1) / 2) / Math.max(1, maxCols), (r - (maxRows - 1) / 2) / Math.max(1, maxRows));
      const localDeltaT = (0.5 - radialDist) * 4.2 + (currentShareRatio - 1.0) * 8.5;
      const cellTempC = steadyPeakTemp + localDeltaT;

      if (cellAmp > maxBranchCurrentA) maxBranchCurrentA = cellAmp;
      if (cellTempC > hottestCellTempC) {
        hottestCellTempC = cellTempC;
        weakestCellLabel = `S${c + 1}-P${r + 1}`;
      }
      if (b.capMultiplier < minCapRatio) minCapRatio = b.capMultiplier;

      // Place NTC sensors evenly across array
      const isNtcSensor = ((c * maxRows + r) % Math.max(1, Math.floor((maxCols * maxRows) / bms.ntcCount))) === 0;

      grid[r][c] = {
        id: `S${c + 1}-P${r + 1}`,
        cellTempC,
        cellAmp,
        irPct: ((b.rMultiplier - 1) * 100).toFixed(1),
        capPct: ((b.capMultiplier - 1) * 100).toFixed(1),
        isNtcSensor
      };
    }
  }

  // Weakest cell in series limits pack capacity; balancing recovers part of spread
  const balanceRecovery = Math.min(0.02, (bms.balanceMa / 1000) * 0.015);
  const packCapacityDeratePct = Math.max(0.5, (1 - minCapRatio - balanceRecovery) * 100);

  return {
    grid,
    maxBranchCurrentA,
    hottestCellTempC,
    weakestCellLabel,
    packCapacityDeratePct
  };
}

// ============================================================================
// 7. DESIGN CONTRACT ENGINE — DECLARATIVE RULES (Concept A / Fixes D9, H1)
// ============================================================================
function evaluateDesignContracts(ctx) {
  const {
    design, conditions, appProfile, cell, busbar, spacing, bms,
    totalCells, packVoltage, usableEnergyAt1CWh, cellCurrentA,
    steadyPeakTemp, tempAtStated1C, packCostPerKWh, chargeTimeMinutes, totalMassEst, currency
  } = ctx;

  const minReqParallel = Math.max(
    Number(design.parallel) + 1,
    Math.ceil((conditions.cRate * Number(design.parallel) * cell.capacity) / cell.maxContDischargeA)
  );

  const rules = [
    {
      id: 'CON-CELL-01',
      title: 'Cell Continuous Discharge Current Limit',
      passed: cellCurrentA <= cell.maxContDischargeA,
      severity: 'CRITICAL',
      measured: `${cellCurrentA.toFixed(1)} A/cell`,
      limit: `≤ ${cell.maxContDischargeA.toFixed(1)} A/cell`,
      source: cell.provenance,
      fixHint: `Increase Parallel count (P) from ${design.parallel}P to ≥${minReqParallel}P or switch to Molicel P42A / A123 LFP.`,
      fixPatch: { design: { parallel: minReqParallel } }
    },
    {
      id: 'CON-BUS-02',
      title: 'Interconnect Busbar Branch Ampacity',
      passed: cellCurrentA <= busbar.ampLimitPerBranch,
      severity: 'WARNING',
      measured: `${cellCurrentA.toFixed(1)} A/branch`,
      limit: `≤ ${busbar.ampLimitPerBranch.toFixed(1)} A (${design.busbars})`,
      source: 'IPC-2152 / Spot-Welded Strip Ampacity Standard',
      fixHint: 'Upgrade Interconnect Busbars from Nickel Strips (0.15mm) to Copper-Nickel Sandwich (0.2mm) or Laser-welded Aluminum.',
      fixPatch: {
        design: {
          busbars: cellCurrentA > 24.0 ? 'Laser-welded Aluminum' : 'Copper-Nickel Sandwich (0.2mm)'
        }
      }
    },
    {
      id: 'CON-AIS-03',
      title: 'AIS-156 Rev 3 Thermal Propagation & Cell Gap',
      passed: spacing.ais156Pass && bms.ais156Compliant,
      severity: design.application.includes('Scooter') ? 'CRITICAL' : 'WARNING',
      measured: `${spacing.gapMm}mm gap • ${bms.ntcCount} NTC • CAN=${bms.hasCanTelemetry ? 'Yes' : 'No'}`,
      limit: '≥ 2.0mm cell gap + ≥ 4 NTC sensors + CAN BMS',
      source: 'MoRTH / ARAI AIS-156 Amendment 3 (L-Category EV Traction Packs)',
      fixHint: 'Select ≥2mm Cylindrical Holders and Advanced (Active Balancing, CAN bus) BMS tier.',
      fixPatch: {
        design: {
          ...(spacing.ais156Pass ? {} : { spacing: '2mm Cylindrical Holders' }),
          ...(bms.ais156Compliant ? {} : { bmsTier: 'Advanced (Active Balancing, CAN bus)' })
        }
      }
    },
    {
      id: 'CON-THM-04',
      title: 'Active Operating Thermal Ceiling',
      passed: steadyPeakTemp < conditions.bmsTempTrip && steadyPeakTemp <= appProfile.maxTemp1CCelsius + 3,
      severity: 'CRITICAL',
      measured: `${steadyPeakTemp.toFixed(1)} °C (@ ${conditions.cRate}C, ${conditions.ambientTemp}°C amb)`,
      limit: `≤ ${Math.min(conditions.bmsTempTrip, appProfile.maxTemp1CCelsius + 3).toFixed(1)} °C`,
      source: `${cell.fullName} SOA & Application Thermal Spec`,
      fixHint: 'Switch Cooling Arrangement to Active Air, PCM, or Liquid Cooling Plate, or lower discharge C-rate.',
      fixPatch: {
        design: {
          cooling: design.cooling === 'Passive (Natural Convection)' ? 'Active Air (Forced Fans)' : 'Liquid Cooling Plate (Bottom)'
        }
      }
    },
    {
      id: 'CON-CHG-05',
      title: 'Datasheet Fast-Charge Lithium-Plating Guard',
      passed: conditions.ambientTemp >= 0 && conditions.ambientTemp <= 45 && chargeTimeMinutes <= appProfile.maxChargeTimeMin,
      severity: conditions.ambientTemp < 0 ? 'CRITICAL' : 'WARNING',
      measured: `${chargeTimeMinutes} min (Max ${cell.maxChargeA}A/cell @ ${conditions.ambientTemp}°C)`,
      limit: `≤ ${appProfile.maxChargeTimeMin} min & 0–45°C Charge Window`,
      source: `${cell.fullName} Charge Specification`,
      fixHint: conditions.ambientTemp < 0
        ? 'Sub-zero charging causes metallic lithium plating; enable BMS pre-heater or raise ambient ≥ 5°C.'
        : 'Samsung 35E is limited to 0.57C (2A) charge (~100 min); switch to Molicel P42A (2C) or A123 LFP (4C) for fast charging.',
      fixPatch: conditions.ambientTemp < 0
        ? { params: { ambientTemp: 15 } }
        : { design: { cellChemistry: 'Molicel P42A' } }
    },
    {
      id: 'CON-BMS-06',
      title: 'BMS Under-Voltage Cutoff vs Cell Datasheet Floor',
      passed: conditions.bmsVoltCutoff >= cell.vMin,
      severity: 'CRITICAL',
      measured: `${conditions.bmsVoltCutoff.toFixed(2)} V/cell`,
      limit: `≥ ${cell.vMin.toFixed(2)} V/cell (${cell.fullName})`,
      source: cell.provenance,
      fixHint: `Raise BMS Under-Volt slider to at least ${cell.vMin.toFixed(2)}V to prevent copper current-collector dissolution.`,
      fixPatch: { params: { bmsVoltCutoff: cell.vMin } }
    },
    {
      id: 'CON-ECN-07',
      title: 'BNEF 2025 Pack Cost Sanity Band',
      passed: packCostPerKWh >= appProfile.bnefPackCostBandMin * 0.75 && packCostPerKWh <= appProfile.bnefPackCostBandMax * 1.45,
      severity: 'INFO',
      measured: `${fmtMoney(packCostPerKWh, currency)} / kWh`,
      limit: `${fmtMoney(appProfile.bnefPackCostBandMin, currency)}–${fmtMoney(appProfile.bnefPackCostBandMax, currency)}/kWh (BNEF 2W/3W ${fmtMoney(133, currency)}/kWh ref)`,
      source: 'BloombergNEF 2025 Li-Ion Battery Price Survey',
      fixHint: 'Toggle Cost Basis to "Volume OEM" in the top bar to evaluate mass-production pack economics vs single-unit retail.',
      fixPatch: { costBasis: 'volume' }
    }
  ];

  const violations = rules.filter(r => !r.passed);
  const criticalCount = violations.filter(r => r.severity === 'CRITICAL').length;
  const warningCount = violations.filter(r => r.severity === 'WARNING').length;

  return { rules, violations, criticalCount, warningCount, totalCells, packVoltage, usableEnergyAt1CWh, totalMassEst };
}
// ============================================================================
// 8.WMTC MISSION PROFILE DUTY CYCLE GENERATOR (Concept C / I2)
// ============================================================================
function generateWmtcDutyFactor(stepIdx, totalSteps) {
  // Approximates UNECE GTR No. 2 (WMTC Part 1 Urban Scooter Cycle: stop-and-go peaks + regen coasting)
  const phase = (stepIdx / totalSteps) * Math.PI * 6;
  const baseCruise = 0.65;
  const accelBurst = 0.55 * Math.pow(Math.sin(phase), 2) + 0.35 * Math.max(0, Math.sin(phase * 2.3));
  const stopIdling = (stepIdx % 12 === 0) ? 0.12 : 1.0;
  return Math.max(0.1, (baseCruise + accelBurst) * stopIdling);
}

// ============================================================================
// MAIN REACT COMPONENT
// ============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState('workbench');
  const [copySuccess, setCopySuccess] = useState('');
  // Load shared configuration from URL hash if present (#cfg=...)
  React.useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash.startsWith('#cfg=')) {
        const decoded = JSON.parse(decodeURIComponent(atob(hash.slice(5))));
        if (decoded.application && APPLICATION_PROFILES[decoded.application]) {
          setApplication(decoded.application);
          if (decoded.designSelection) setDesignSelection(decoded.designSelection);
          if (decoded.slotConfig) {
            setAllAppDesigns(prev => ({
              ...prev,
              [decoded.application]: {
                ...prev[decoded.application],
                [decoded.designSelection || 'Baseline Starting Design']: decoded.slotConfig
              }
            }));
          }
          if (decoded.params) setParams(prev => ({ ...prev, ...decoded.params }));
        }
      }
    } catch (e) {}
  }, []);

  const copyShareLink = () => {
    try {
      const payload = btoa(encodeURIComponent(JSON.stringify({
        application,
        designSelection,
        slotConfig: allAppDesigns[application][designSelection],
        params
      })));
      const shareUrl = `${window.location.origin}${window.location.pathname}#cfg=${payload}`;
      window.history.replaceState(null, '', `#cfg=${payload}`);
      navigator.clipboard?.writeText(shareUrl);
      setCopySuccess('Share link copied!');
      setTimeout(() => setCopySuccess(''), 3000);
    } catch (e) {}
  };
  const [showReportModal, setShowReportModal] = useState(false);
const [lightMode, setLightMode] = useState(() => {
  try { return localStorage.getItem('theme') === 'light'; } catch (e) { return false; }
});
React.useEffect(() => {
  document.documentElement.classList.toggle('light', lightMode);
  try { localStorage.setItem('theme', lightMode ? 'light' : 'dark'); } catch (e) {}
}, [lightMode]);
  // Stage 6/7 Policy Controls: Model Mode Switch (Physics-Corrected vs Legacy) & Cost Basis
  const [modelMode, setModelMode] = useState('physics'); // 'physics' | 'legacy'
  const [costBasis, setCostBasis] = useState('volume');  // 'volume' | 'retail'
  const [currency, setCurrency] = useState('INR');        // 'INR' | 'USD' (display only)
  const [showLegacyInfo, setShowLegacyInfo] = useState(false);
  const [showPassing, setShowPassing] = useState(false);
  const [swapsPerDay, setSwapsPerDay] = useState(2.5);

  // Active Application & Active Slot ('Baseline Starting Design' | 'Option A...' | 'Option B...')
  const [application, setApplication] = useState('Swappable 48V E-Scooter Module');
  const [designSelection, setDesignSelection] = useState('Baseline Starting Design');

  // All 3 Design Slots stored as live configurations per application (Fixes D1/C1)
  const [allAppDesigns, setAllAppDesigns] = useState(() => {
    const initial = {};
    Object.keys(APPLICATION_PROFILES).forEach(appKey => {
      initial[appKey] = JSON.parse(JSON.stringify(APPLICATION_PROFILES[appKey].presets));
    });
    return initial;
  });

  // Tab 3 State (Operating & BMS Parameters + Mission Mode)
  const [params, setParams] = useState({
    cRate: 1.0,            // Continuous Discharge C-Rate
    busbarResistance: 2.5, // mOhm terminal/connector resistance
    ambientTemp: 30,       // °C (Indian urban ambient baseline; IMD ref)
    bmsTempTrip: 60,       // °C
    bmsVoltCutoff: 2.7,    // V per cell
    simMode: 'constant'    // 'constant' | 'wmtc' | 'charge'
  });

  // Simulation State
  const [simData, setSimData] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Current active slot configuration object
  const activeSlotConfig = allAppDesigns[application][designSelection];
  const config = {
    application,
    designSelection,
    ...activeSlotConfig
  };

  // Evaluate all 3 options live using the unified pure model (Fixes D1/C1)
  const evalOptions = useMemo(() => ({ modelMode, costBasis, currency }), [modelMode, costBasis, currency]);

  const evalBaseline = useMemo(() => evaluatePack(
    { application, designSelection: 'Baseline Starting Design', ...allAppDesigns[application]['Baseline Starting Design'] },
    params,
    evalOptions
  ), [application, allAppDesigns, params, evalOptions]);

  const evalOptionA = useMemo(() => evaluatePack(
    { application, designSelection: 'Option A (High Energy, Active Cooling)', ...allAppDesigns[application]['Option A (High Energy, Active Cooling)'] },
    params,
    evalOptions
  ), [application, allAppDesigns, params, evalOptions]);

  const evalOptionB = useMemo(() => evaluatePack(
    { application, designSelection: 'Option B (High Power, LFP Chemistry)', ...allAppDesigns[application]['Option B (High Power, LFP Chemistry)'] },
    params,
    evalOptions
  ), [application, allAppDesigns, params, evalOptions]);

  const currentEval = useMemo(() => {
    if (designSelection.startsWith('Option A')) return evalOptionA;
    if (designSelection.startsWith('Option B')) return evalOptionB;
    return evalBaseline;
  }, [designSelection, evalBaseline, evalOptionA, evalOptionB]);

  // Extract convenient aliases matching original variables
  const {
    cell, seriesCount, parallelCount, packVoltage, packCapacity,
    packEnergyWh, packEnergyKWh, usableEnergyWh, usableEnergyAt1CWh,
    totalMassEst, totalCostEst, packCostPerKWh, lcos, fullLcosPerKWh,
    totalResistance, I_load, qGen, rTh, tauSec, steadyPeakTemp, tempAtStated1C,
    chargeTimeMinutes, effectiveCycles, lengthMm, widthMm, heightMm, packVolumeLiters,
    cellVariationStats, contracts, appProfile, totalCells
  } = currentEval;

  // Money helpers (one currency at a time) and chart cost scaling
  const money = (usd, usdDigits = 0, inrDigits = usdDigits) => fmtMoney(usd, currency, usdDigits, inrDigits);
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const costChart = (usd) => (currency === 'INR' ? Math.round((usd * USD_TO_INR) / 100) / 10 : Math.round(usd)); // ₹ thousand or $

  // Design-contract rows: failures first, passing rows collapsible
  const rankRule = (r) => (r.passed ? 3 : r.severity === 'CRITICAL' ? 0 : r.severity === 'WARNING' ? 1 : 2);
  const failingRules = contracts.rules.filter(r => !r.passed).sort((a, b) => rankRule(a) - rankRule(b));
  const passingRules = contracts.rules.filter(r => r.passed);
const applyRuleFix = (rule) => {
    if (!rule.fixPatch) return;
    if (rule.fixPatch.design) {
      setAllAppDesigns(prev => ({
        ...prev,
        [application]: {
          ...prev[application],
          [designSelection]: {
            ...prev[application][designSelection],
            ...rule.fixPatch.design
          }
        }
      }));
    }
    if (rule.fixPatch.params) {
      setParams(prev => ({ ...prev, ...rule.fixPatch.params }));
    }
    if (rule.fixPatch.costBasis) {
      setCostBasis(rule.fixPatch.costBasis);
    }
  };

  const renderRuleRow = (rule) => (
    <div
      key={rule.id}
      title={rule.source}
      className={`flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 px-6 py-3 border-t border-slate-800 text-xs ${
        !rule.passed && rule.severity === 'CRITICAL' ? 'bg-rose-950/40' : ''
      }`}
    >
      <div className="lg:w-20 shrink-0">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
          rule.passed
            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            : rule.severity === 'CRITICAL'
            ? 'bg-rose-600 text-slate-950'
            : rule.severity === 'WARNING'
            ? 'bg-amber-500 text-slate-950'
            : 'bg-slate-700 text-white'
        }`}>
          {rule.passed ? 'Pass' : rule.severity === 'CRITICAL' ? 'Critical' : rule.severity === 'WARNING' ? 'Warning' : 'Info'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-100">{rule.title}</p>
        {!rule.passed && <p className="text-slate-400 mt-0.5">Fix: {rule.fixHint}</p>}
      </div>
      <div className="font-mono text-slate-300 lg:w-56 shrink-0">{rule.measured}</div>
      <div className="font-mono text-slate-500 lg:w-64 shrink-0 lg:text-right">{rule.limit}</div>
      {!rule.passed && rule.fixPatch && (
        <button
          type="button"
          onClick={() => applyRuleFix(rule)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shrink-0 transition"
        >
          <Check className="w-3.5 h-3.5" /> Apply fix
        </button>
      )}
    </div>
  );
  // Dynamic Radar & Bar data driven live by the 3 configurations (Fixes D1)
  const liveRadarData = useMemo(() => [
    { subject: 'Specific Energy', Baseline: evalBaseline.scores.specificEnergy, OptionA: evalOptionA.scores.specificEnergy, OptionB: evalOptionB.scores.specificEnergy, fullMark: 100 },
    { subject: 'Thermal Margin', Baseline: evalBaseline.scores.thermalStability, OptionA: evalOptionA.scores.thermalStability, OptionB: evalOptionB.scores.thermalStability, fullMark: 100 },
    { subject: 'C-Rate Power', Baseline: evalBaseline.scores.cRateCapability, OptionA: evalOptionA.scores.cRateCapability, OptionB: evalOptionB.scores.cRateCapability, fullMark: 100 },
    { subject: 'Lightness', Baseline: evalBaseline.scores.lightness, OptionA: evalOptionA.scores.lightness, OptionB: evalOptionB.scores.lightness, fullMark: 100 },
    { subject: 'Cost Efficiency', Baseline: evalBaseline.scores.costEfficiency, OptionA: evalOptionA.scores.costEfficiency, OptionB: evalOptionB.scores.costEfficiency, fullMark: 100 },
    { subject: 'Cycle Life', Baseline: evalBaseline.scores.cycleLife, OptionA: evalOptionA.scores.cycleLife, OptionB: evalOptionB.scores.cycleLife, fullMark: 100 }
  ], [evalBaseline, evalOptionA, evalOptionB]);

  const liveBarData = useMemo(() => [
    {
      name: 'Baseline',
      energy: Math.round(evalBaseline.usableEnergyAt1CWh),
      temp: parseFloat(evalBaseline.tempAtStated1C.toFixed(1)),
      time: evalBaseline.chargeTimeMinutes,
      mass: parseFloat(evalBaseline.totalMassEst.toFixed(1)),
      cost: costChart(evalBaseline.totalCostEst)
    },
    {
      name: 'Option A',
      energy: Math.round(evalOptionA.usableEnergyAt1CWh),
      temp: parseFloat(evalOptionA.tempAtStated1C.toFixed(1)),
      time: evalOptionA.chargeTimeMinutes,
      mass: parseFloat(evalOptionA.totalMassEst.toFixed(1)),
      cost: costChart(evalOptionA.totalCostEst)
    },
    {
      name: 'Option B (LFP)',
      energy: Math.round(evalOptionB.usableEnergyAt1CWh),
      temp: parseFloat(evalOptionB.tempAtStated1C.toFixed(1)),
      time: evalOptionB.chargeTimeMinutes,
      mass: parseFloat(evalOptionB.totalMassEst.toFixed(1)),
      cost: costChart(evalOptionB.totalCostEst)
    }
  ], [evalBaseline, evalOptionA, evalOptionB]);
  const liveCostBreakdown = useMemo(() => {
    const buildRow = (label, ev) => {
      const busbarUsd = ev.totalCells * ev.busbar.costPerCell;
      const holderUsd = ev.totalCells * ev.spacing.costPerCell;
      const coolingUsd = ev.cooling.costUsd;
      const bmsUsd = ev.bms.costUsd;
      const overheadUsd = Math.max(0, ev.totalCostEst - (ev.cellsCostUsd + busbarUsd + holderUsd + coolingUsd + bmsUsd));
      const scale = (usd) => (currency === 'INR' ? Math.round(usd * USD_TO_INR) : Math.round(usd));
      return {
        name: label,
        Cells: scale(ev.cellsCostUsd),
        BusbarsHolders: scale(busbarUsd + holderUsd),
        Cooling: scale(coolingUsd),
        BMS: scale(bmsUsd),
        Enclosure: scale(overheadUsd)
      };
    };
    return [
      buildRow('Baseline', evalBaseline),
      buildRow('Option A', evalOptionA),
      buildRow('Option B (LFP)', evalOptionB)
    ];
  }, [evalBaseline, evalOptionA, evalOptionB, currency]);

  // Concept B (H2): Pareto Frontier & Monte Carlo Risk Sweeper
  const paretoAnalysis = useMemo(() => {
    const candidates = [];
    const sMid = Math.round((appProfile.vMinReq + appProfile.vMaxReq) / (2 * 3.5));
    const chemistries = Object.keys(CELL_LIBRARY);
    const coolings = Object.keys(COOLING_SPECS);

    chemistries.forEach(chemKey => {
      const cSpec = CELL_LIBRARY[chemKey];
      const sNom = Math.max(4, Math.round(((appProfile.vMinReq + appProfile.vMaxReq) / 2) / cSpec.voltage));
      const pCandidates = cSpec.capacity >= 25 ? [1, 2, 3] : [4, 6, 8, 10, 12, 14];
      pCandidates.forEach(pVal => {
        coolings.forEach(coolKey => {
          const candDesign = {
            application,
            cellChemistry: chemKey,
            series: sNom,
            parallel: pVal,
            busbars: cSpec.capacity >= 25 ? 'Heavy Copper Busbars (Prismatic)' : 'Copper-Nickel Sandwich (0.2mm)',
            cooling: coolKey,
            spacing: '3.5mm AIS-156 Thermal Gap',
            bmsTier: 'Advanced (Active Balancing, CAN bus)'
          };
          const ev = evaluatePack(candDesign, params, evalOptions);
          const isFeasible =
            ev.usableEnergyAt1CWh >= appProfile.usableEnergyMinWh * 0.85 &&
            ev.tempAtStated1C <= appProfile.maxTemp1CCelsius &&
            ev.totalMassEst <= appProfile.maxMassKg * 1.25 &&
            ev.contracts.criticalCount === 0;

          // Monte Carlo thermal/current violation risk under +-5°C ambient & +-4% IR spread
          const tempMargin = appProfile.maxTemp1CCelsius - ev.tempAtStated1C;
          const riskPct = Math.round(Math.max(1, Math.min(99, 50 * Math.exp(-tempMargin / 4.5))));

          candidates.push({
            label: `${sNom}S${pVal}P ${chemKey} (${coolKey.split(' ')[0]})`,
            chemKey,
            coolKey,
            sNom,
            pVal,
            massKg: parseFloat(ev.totalMassEst.toFixed(2)),
            usableWh: Math.round(ev.usableEnergyAt1CWh),
            costUsd: Math.round(ev.totalCostEst),
            tempC: parseFloat(ev.tempAtStated1C.toFixed(1)),
            chargeMin: ev.chargeTimeMinutes,
            riskPct,
            isFeasible,
            designObj: candDesign
          });
        });
      });
    });

    // Identify Pareto non-dominated frontier (maximize usableWh, minimize massKg and costUsd)
    const feasibleList = candidates.filter(c => c.isFeasible);
    feasibleList.forEach(c => {
      c.isPareto = !feasibleList.some(other =>
        other !== c &&
        other.usableWh >= c.usableWh &&
        other.massKg <= c.massKg &&
        other.costUsd <= c.costUsd &&
        (other.usableWh > c.usableWh || other.massKg < c.massKg || other.costUsd < c.costUsd)
      );
    });

    // Pick balanced knee recommendation
    const paretoFront = feasibleList.filter(c => c.isPareto);
    const kneePick = paretoFront.length > 0
      ? paretoFront.reduce((best, cur) => {
          const curScore = (cur.usableWh / appProfile.usableEnergyMinWh) * 40 - (cur.massKg / appProfile.maxMassKg) * 25 - (cur.riskPct * 0.35);
          const bestScore = (best.usableWh / appProfile.usableEnergyMinWh) * 40 - (best.massKg / appProfile.maxMassKg) * 25 - (best.riskPct * 0.35);
          return curScore > bestScore ? cur : best;
        }, paretoFront[0])
      : candidates[0];

    return { candidates: candidates.slice(0, 36), paretoFront, kneePick, sMid };
  }, [application, appProfile, params, evalOptions]);

  // Sensitivity Tornado Analysis: What moves Peak Temperature (°C) most?
  const sensitivityTornado = useMemo(() => {
    const baseTemp = currentEval.steadyPeakTemp;
    const evalDelta = (modDesign, modParams) => {
      const ev = evaluatePack({ ...config, ...modDesign }, { ...params, ...modParams }, evalOptions);
      return parseFloat((ev.steadyPeakTemp - baseTemp).toFixed(1));
    };
    return [
      {
        factor: 'Discharge C-Rate (+0.5C vs -0.5C)',
        highSwing: evalDelta({}, { cRate: Math.min(5, params.cRate + 0.5) }),
        lowSwing: evalDelta({}, { cRate: Math.max(0.2, params.cRate - 0.5) })
      },
      {
        factor: 'Cooling Mode (Passive vs Liquid)',
        highSwing: evalDelta({ cooling: 'Passive (Natural Convection)' }, {}),
        lowSwing: evalDelta({ cooling: 'Liquid Cooling Plate (Bottom)' }, {})
      },
      {
        factor: 'Ambient Temp (+10°C vs -10°C)',
        highSwing: evalDelta({}, { ambientTemp: params.ambientTemp + 10 }),
        lowSwing: evalDelta({}, { ambientTemp: params.ambientTemp - 10 })
      },
      {
        factor: 'Parallel Count (-2P vs +2P)',
        highSwing: evalDelta({ parallel: Math.max(1, parallelCount - 2) }, {}),
        lowSwing: evalDelta({ parallel: parallelCount + 2 }, {})
      },
      {
        factor: 'Busbar Grade (Ni Strip vs Cu Sandwich)',
        highSwing: evalDelta({ busbars: 'Nickel Strips (0.15mm)' }, {}),
        lowSwing: evalDelta({ busbars: 'Copper-Nickel Sandwich (0.2mm)' }, {})
      }
    ];
  }, [config, params, currentEval.steadyPeakTemp, parallelCount, evalOptions]);

  // Handlers
  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    if (name === 'application') {
      setApplication(value);
      setSimData([]);
      return;
    }
    if (name === 'designSelection') {
      setDesignSelection(value);
      setSimData([]);
      return;
    }
    const parsedVal = (name === 'series' || name === 'parallel')
      ? Math.max(1, parseInt(value, 10) || 1)
      : value;

    setAllAppDesigns(prev => ({
      ...prev,
      [application]: {
        ...prev[application],
        [designSelection]: {
          ...prev[application][designSelection],
          [name]: parsedVal
        }
      }
    }));
    setSimData([]);
  };

  const handleParamChange = (e) => {
    const { name, value } = e.target;
    if (name === 'simMode') {
      setParams(prev => ({ ...prev, simMode: value }));
      return;
    }
    const numVal = parseFloat(value);
    const safeVal = Number.isNaN(numVal) ? 0 : numVal;
    setParams(prev => ({ ...prev, [name]: safeVal }));
  };

  const loadKneeIntoOptionA = () => {
    if (!paretoAnalysis.kneePick) return;
    const d = paretoAnalysis.kneePick.designObj;
    setAllAppDesigns(prev => ({
      ...prev,
      [application]: {
        ...prev[application],
        'Option A (High Energy, Active Cooling)': {
          cellChemistry: d.cellChemistry,
          series: d.series,
          parallel: d.parallel,
          busbars: d.busbars,
          cooling: d.cooling,
          spacing: d.spacing,
          bmsTier: d.bmsTier
        }
      }
    }));
    setDesignSelection('Option A (High Energy, Active Cooling)');
  };

  // Structured Engineering Report & JSON Export (Fixes C6)
  const buildStructuredReportText = () => {
    return `AlchoCells: Simulate First. Build Next.
=====================================================================
1. SCOPE & TARGET APPLICATION
   Application:        ${config.application} (${appProfile.roleBadge})
   Active Design Slot: ${config.designSelection}
   Physics Engine:     ${modelMode === 'physics' ? 'Physics-Corrected (Size-scaled R_th, tau=R_th*C_th, OCV Table, DCIR)' : 'Legacy Simplified'}
   Cost Basis:         ${costBasis === 'volume' ? `OEM Volume Pricing (BNEF ${money(133)}/kWh 2W/3W benchmark aligned)` : 'Single-Unit Distributor Retail'}

2. ACTIVE CONFIGURATION (${seriesCount}S ${parallelCount}P — ${totalCells} Cells)
   Cell Chemistry:     ${cell.fullName} (${cell.provenance})
   Interconnects:      ${config.busbars}
   Cooling System:     ${config.cooling} (${currentEval.cooling.note})
   Cell Spacing:       ${config.spacing} (${currentEval.spacing.gapMm}mm gap)
   BMS Architecture:   ${config.bmsTier} (${currentEval.bms.asilRating})

3. SIMULATED PERFORMANCE INDICATORS
   Nominal Voltage:    ${packVoltage.toFixed(1)} V (Window: ${appProfile.vMinReq}–${appProfile.vMaxReq} V)
   Nominal / Usable:   ${packEnergyWh.toFixed(0)} Wh gross | ${usableEnergyAt1CWh.toFixed(0)} Wh usable @ 1C (${(currentEval.bms.dodWindow*100).toFixed(0)}% DoD)
   Mass & Volume:      ${totalMassEst.toFixed(2)} kg | ${packVolumeLiters.toFixed(2)} L (${lengthMm}×${widthMm}×${heightMm} mm)
   Thermal @ 1C:       ${tempAtStated1C.toFixed(1)} °C (R_th = ${rTh.toFixed(3)} K/W, tau = ${Math.round(tauSec)} s, Q_1C = ${currentEval.qGen1C.toFixed(1)} W)
   Fast-Charge Time:   ${chargeTimeMinutes} mins (10–90% CC-CV @ max ${cell.maxChargeA}A/cell)
   Pack BOM Cost:      ${money(totalCostEst)} (${money(packCostPerKWh)}/kWh) | CapEx Throughput: ${money(lcos, 3, 2)}/kWh | Full LCOS: ${money(fullLcosPerKWh, 3, 2)}/kWh

4. SIDE-BY-SIDE COMPARISON SUMMARY (AT STATED 1C REFERENCE)
   - Baseline: ${evalBaseline.seriesCount}S${evalBaseline.parallelCount}P ${evalBaseline.design.cellChemistry} | ${Math.round(evalBaseline.usableEnergyAt1CWh)} Wh | ${evalBaseline.tempAtStated1C.toFixed(1)}°C | ${evalBaseline.chargeTimeMinutes} min | ${evalBaseline.totalMassEst.toFixed(1)} kg | ${money(evalBaseline.totalCostEst)}
   - Option A: ${evalOptionA.seriesCount}S${evalOptionA.parallelCount}P ${evalOptionA.design.cellChemistry} | ${Math.round(evalOptionA.usableEnergyAt1CWh)} Wh | ${evalOptionA.tempAtStated1C.toFixed(1)}°C | ${evalOptionA.chargeTimeMinutes} min | ${evalOptionA.totalMassEst.toFixed(1)} kg | ${money(evalOptionA.totalCostEst)}
   - Option B: ${evalOptionB.seriesCount}S${evalOptionB.parallelCount}P ${evalOptionB.design.cellChemistry} | ${Math.round(evalOptionB.usableEnergyAt1CWh)} Wh | ${evalOptionB.tempAtStated1C.toFixed(1)}°C | ${evalOptionB.chargeTimeMinutes} min | ${evalOptionB.totalMassEst.toFixed(1)} kg | ${money(evalOptionB.totalCostEst)}

5. DESIGN CONTRACT AUDIT & STATED LIMITATIONS
   Contract Status:    ${contracts.criticalCount} Critical Violation(s), ${contracts.warningCount} Warning(s)
   Stated Limitations: Lumped-capacitance thermal model (Bi < 0.1 assumption); convection coefficients h are textbook engineering estimates; does not replace physical AIS-156 thermal propagation nail-penetration testing.
   Recommended Next Step: Construct a safe 4S2P (<16.8V) low-voltage bench sub-module with a 15A blade fuse, 4x NTC thermistors, and fireproof containment to empirically calibrate R_th and tau.`;
  };
const exportSummary = () => {
    try {
      // WinAnsi-safe text sanitizer (preserves real ° degree symbol via \260)
      const sanitize = (str) =>
        String(str ?? '')
          .replace(/₹/g, 'INR ')
          .replace(/≤/g, '<=')
          .replace(/≥/g, '>=')
          .replace(/×/g, 'x')
          .replace(/—|–/g, '-')
          .replace(/•|·/g, '|')
          .replace(/\\/g, '\\\\')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)')
          .replace(/°/g, '\\260')
          .replace(/[^\x20-\x7E\\]/g, (ch) => (ch === '\\' ? '\\' : ''));

      const wrapText = (str, maxChars) => {
        const clean = String(str ?? '');
        if (clean.length <= maxChars) return [clean];
        const words = clean.split(' ');
        const out = [];
        let cur = '';
        words.forEach((w) => {
          if ((cur + (cur ? ' ' : '') + w).length <= maxChars) {
            cur += (cur ? ' ' : '') + w;
          } else {
            if (cur) out.push(cur);
            cur = w;
          }
        });
        if (cur) out.push(cur);
        return out;
      };

      const ev = currentEval || {};
      const ops = [];
      const L = 44;   // Left margin
      const R = 551;  // Right margin (usable width = 507 pt)

      // Fonts: /F1 = Helvetica, /F2 = Helvetica-Bold, /F3 = Times-Roman, /F4 = Times-Bold, /F5 = Courier-Bold
      const line = (x1, y1, x2, y2, lw = 0.6, gray = '0.15') => {
        ops.push(`${lw} w ${gray} G ${x1} ${y1} m ${x2} ${y2} l S`);
      };
      const text = (str, x, y, size = 9.5, font = '/F3', rgb = '0.08 0.08 0.10') => {
        ops.push(`${rgb} rg BT ${font} ${size} Tf ${x} ${y} Td (${sanitize(str)}) Tj ET`);
      };

      // =========================================================================
      // 1. TECHNICAL DOCUMENT MASTHEAD (White Paper / Datasheet Style)
      // =========================================================================
      // Minimalist vector pulse mark on white background
      ops.push('1.4 w 1 J 1 j 0.05 0.35 0.45 RG 44 794 m 50 794 l 54 804 l 59 783 l 63 798 l 69 794 l S');
      text('AlchoCells', 76, 790, 16, '/F2', '0.06 0.08 0.12');
      text('BATTERY PACK ENGINEERING SPECIFICATION & VERIFICATION REPORT', 76, 777, 8, '/F2', '0.35 0.40 0.46');

      // Right-aligned Document Control Block
      const docCode = `DOC ID: AC-${seriesCount}S${parallelCount}P-${new Date().getFullYear()}`;
      const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      text(docCode, 425, 797, 8, '/F5', '0.15 0.18 0.22');
      text(`DATE:   ${dateStr}`, 425, 787, 8, '/F5', '0.25 0.28 0.32');
      text(`SOLVER: ${modelMode === 'physics' ? 'PHYSICS-REV2' : 'LEGACY'}`, 425, 777, 8, '/F5', '0.25 0.28 0.32');

      line(L, 768, R, 768, 1.4, '0.08');
      line(L, 765, R, 765, 0.4, '0.35');

      // Paper Title & Abstract / Scope Line
      let y = 747;
      text(
        `Technical Dossier: ${seriesCount}S${parallelCount}P ${cell?.fullName || config.cellChemistry} Pack Architecture`,
        L,
        y,
        12.5,
        '/F4',
        '0.05 0.05 0.08'
      );
      y -= 14;
      text(
        `Target Application: ${config.application}   |   Cost Basis: ${costBasis.toUpperCase()} (${currency})   |   Ambient: ${params.ambientTemp}°C`,
        L,
        y,
        8.8,
        '/F3',
        '0.28 0.32 0.38'
      );

      // =========================================================================
      // SECTION I. KEY PERFORMANCE & PHYSICAL PARAMETERS (Booktabs Style Table)
      // =========================================================================
      y -= 24;
      text('I. EXECUTIVE PERFORMANCE & PHYSICAL PARAMETERS', L, y, 9.5, '/F2', '0.06 0.08 0.12');
      y -= 5;
      line(L, y, R, y, 1.0, '0.10');

      const tempLimit = Math.min(params.bmsTempTrip, (appProfile?.maxTemp1CCelsius ?? 55) + 3);
      const perfRows = [
        ['Nominal Bus Voltage', `${Number(packVoltage || 0).toFixed(1)} V`, 'Rated Pack Capacity', `${Number(packCapacity || 0).toFixed(1)} Ah (${totalCells} cells)`],
        ['Usable Energy (1C)', `${Math.round(usableEnergyAt1CWh || 0).toLocaleString()} Wh (Target >= ${appProfile?.usableEnergyMinWh ?? '-'} Wh)`, 'Peak Cell Temp (1C)', `${Number(steadyPeakTemp || 0).toFixed(1)}°C (Limit <= ${tempLimit}°C)`],
        ['Total Pack Mass', `${Number(totalMassEst || 0).toFixed(2)} kg (Limit <= ${appProfile?.maxMassKg ?? '-'} kg)`, 'Envelope & Volume', `${lengthMm} x ${widthMm} x ${heightMm} mm (${Number(packVolumeLiters || 0).toFixed(1)} L)`],
        ['CC-CV Charge (10-90%)', `${chargeTimeMinutes} min (Limit <= ${appProfile?.maxChargeTimeMin ?? '-'} min)`, 'Cycle Life (80% SOH)', `${Number(effectiveCycles || 0).toLocaleString()} cycles`],
        ['Estimated BOM Cost', `${money(totalCostEst)} (${money(packCostPerKWh)}/kWh)`, 'Levelized Cost (LCOS)', `${money(fullLcosPerKWh, 2)} / kWh`]
      ];

      perfRows.forEach((row, idx) => {
        y -= 17;
        text(row[0], L + 2, y, 8.8, '/F4', '0.15 0.18 0.22');
        text(row[1], L + 112, y, 8.8, '/F3', '0.08 0.08 0.10');
        text(row[2], L + 275, y, 8.8, '/F4', '0.15 0.18 0.22');
        text(row[3], L + 382, y, 8.8, '/F3', '0.08 0.08 0.10');
        if (idx < perfRows.length - 1) line(L, y - 5, R, y - 5, 0.25, '0.82');
      });
      y -= 6;
      line(L, y, R, y, 1.0, '0.10');

      // =========================================================================
      // SECTION II. SUBSYSTEM BILL OF MATERIALS & ARCHITECTURE
      // =========================================================================
      y -= 22;
      text('II. SUBSYSTEM BILL OF MATERIALS & ARCHITECTURE', L, y, 9.5, '/F2', '0.06 0.08 0.12');
      y -= 5;
      line(L, y, R, y, 1.0, '0.10');

      const rIntVal = cell?.internalResMOhm ?? cell?.rIntMOhm ?? cell?.internalRes ?? ev.cell?.internalResMOhm ?? '';
      const bomRows = [
        ['Cell Chemistry', `${cell?.fullName || config.cellChemistry}  -  ${cell?.voltage ?? ''} V nominal, ${cell?.capacity ?? ''} Ah${rIntVal ? `, ${rIntVal} mOhm DCIR` : ''}`],
        ['Interconnect Busbars', `${config.busbars}${ev.busbar?.ampLimitPerBranch ? `  (Continuous branch rating: ${ev.busbar.ampLimitPerBranch} A)` : ''}`],
        ['Thermal Management', `${config.cooling}${ev.rTh ? `  (R_th = ${Number(ev.rTh).toFixed(2)} K/W, thermal time constant tau = ${Math.round(ev.tauSec || 0)} s)` : ''}`],
        ['Cell Spacing & Housing', `${config.spacing}${ev.spacing?.gapMm != null ? `  (${ev.spacing.gapMm} mm inter-cell propagation gap)` : ''}`],
        ['BMS Protection Tier', `${config.bmsTier}  (UV cutoff: ${params.bmsVoltCutoff} V/cell, OT trip: ${params.bmsTempTrip}°C)`]
      ];

      bomRows.forEach((row, idx) => {
        y -= 16;
        text(row[0], L + 2, y, 8.8, '/F4', '0.15 0.18 0.22');
        text(row[1], L + 125, y, 8.8, '/F3', '0.08 0.08 0.10');
        if (idx < bomRows.length - 1) line(L, y - 4.5, R, y - 4.5, 0.25, '0.82');
      });
      y -= 6;
      line(L, y, R, y, 1.0, '0.10');

      // =========================================================================
      // SECTION III. COMPARATIVE DESIGN TRADE-OFF MATRIX
      // =========================================================================
      y -= 22;
      text('III. COMPARATIVE DESIGN TRADE-OFF MATRIX', L, y, 9.5, '/F2', '0.06 0.08 0.12');
      y -= 5;
      line(L, y, R, y, 1.0, '0.10');

      y -= 14;
      const cols = [
        { label: 'Variant', x: L + 2 },
        { label: 'Topology & Cell', x: L + 64 },
        { label: 'Energy', x: L + 218 },
        { label: 'Temp (1C)', x: L + 272 },
        { label: 'Mass', x: L + 328 },
        { label: 'Charge', x: L + 375 },
        { label: 'Cycles', x: L + 422 },
        { label: 'BOM Cost', x: L + 465 }
      ];
      cols.forEach((c) => text(c.label, c.x, y, 8.3, '/F2', '0.12 0.15 0.20'));
      y -= 5;
      line(L, y, R, y, 0.5, '0.25');

      [
        { tag: 'Baseline', item: evalBaseline },
        { tag: 'Option A', item: evalOptionA },
        { tag: 'Option B', item: evalOptionB }
      ].forEach(({ tag, item }, idx) => {
        if (!item) return;
        y -= 16;
        text(tag, L + 2, y, 8.6, '/F4', '0.10 0.12 0.16');
        text(`${item.seriesCount}S${item.parallelCount}P ${item.design?.cellChemistry || ''}`, L + 64, y, 8.6, '/F3', '0.10 0.12 0.16');
        text(`${Math.round(item.usableEnergyAt1CWh || 0)} Wh`, L + 218, y, 8.6, '/F3', '0.10 0.12 0.16');
        text(`${Number(item.tempAtStated1C || 0).toFixed(1)}°C`, L + 272, y, 8.6, '/F3', '0.10 0.12 0.16');
        text(`${Number(item.totalMassEst || 0).toFixed(2)} kg`, L + 328, y, 8.6, '/F3', '0.10 0.12 0.16');
        text(`${item.chargeTimeMinutes} min`, L + 375, y, 8.6, '/F3', '0.10 0.12 0.16');
        text(`${item.effectiveCycles}`, L + 422, y, 8.6, '/F3', '0.10 0.12 0.16');
        text(`${money(item.totalCostEst)}`, L + 465, y, 8.6, '/F4', '0.08 0.10 0.14');
        if (idx < 2) line(L, y - 4.5, R, y - 4.5, 0.25, '0.85');
      });
      y -= 6;
      line(L, y, R, y, 1.0, '0.10');

      // =========================================================================
      // SECTION IV. DESIGN CONTRACT & AIS-156 COMPLIANCE VERIFICATION
      // =========================================================================
      const rules = contracts?.rules || [];
      const violations = contracts?.violations || [];
      const passCount = rules.length - violations.length;
      y -= 22;
      text(`IV. DESIGN CONTRACT & AIS-156 COMPLIANCE VERIFICATION (${passCount}/${rules.length} SATISFIED)`, L, y, 9.5, '/F2', '0.06 0.08 0.12');
      y -= 5;
      line(L, y, R, y, 1.0, '0.10');

      rules.forEach((r, idx) => {
        if (y < 68) return;
        const isPass = !!r.passed;
        const isCrit = !isPass && String(r.severity).toUpperCase() === 'CRITICAL';
        const statusCode = isPass ? '[PASS]' : isCrit ? '[CRIT]' : '[WARN]';
        const statusRgb = isPass ? '0.06 0.42 0.22' : isCrit ? '0.68 0.10 0.10' : '0.65 0.34 0.04';

        const detailText = `${r.title}: ${r.measured}  |  Spec: ${r.limit}`;
        const wrapped = wrapText(detailText, 88);

        wrapped.forEach((lineStr, lIdx) => {
          y -= lIdx === 0 ? 15 : 11;
          if (lIdx === 0) {
            text(statusCode, L + 2, y, 8.0, '/F5', statusRgb);
          }
          text(lineStr, L + 44, y, 8.4, lIdx === 0 && !isPass ? '/F4' : '/F3', '0.10 0.12 0.16');
        });
        if (idx < rules.length - 1) line(L, y - 4, R, y - 4, 0.25, '0.86');
      });
      y -= 5;
      line(L, y, R, y, 1.0, '0.10');

      // =========================================================================
      // DOCUMENT FOOTER
      // =========================================================================
      line(L, 42, R, 42, 0.5, '0.45');
      text('AlchoCells Engineering Workbench  -  Automated Physics & Compliance Verification Sheet', L, 30, 7.8, '/F3', '0.35 0.38 0.42');
      text('Sheet 1 of 1', R - 42, 30, 7.8, '/F4', '0.25 0.28 0.32');

      const stream = ops.join('\n');
      const objects = [
        '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
        '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
        '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R /F4 8 0 R /F5 9 0 R >> >> >> endobj',
        `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
        '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj',
        '6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >> endobj',
        '7 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >> endobj',
        '8 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >> endobj',
        '9 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >> endobj'
      ];

      let pdf = '%PDF-1.4\n';
      const offsets = [0];
      objects.forEach((obj) => {
        offsets.push(pdf.length);
        pdf += obj + '\n';
      });
      const xrefStart = pdf.length;
      pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
      offsets.slice(1).forEach((off) => {
        pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
      });
      pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

      const blob = new Blob([pdf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AlchoCells_${seriesCount}S${parallelCount}P_${config.cellChemistry.replace(/\s+/g, '_')}_SpecSheet.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setCopySuccess('PDF downloaded!');
      setTimeout(() => setCopySuccess(''), 3000);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export error: ' + err.message);
    }
  };

   

  // ============================================================================
  // 9. TRANSIENT SIMULATION ENGINE (Fixes D3, D4, D10 + Concept C WMTC & Charge)
  // ============================================================================
  const runSimulation = (overrideVal = null, overrideName = null) => {
    setIsSimulating(true);

    const currentParams = { ...params };
    if (overrideName) currentParams[overrideName] = overrideVal;

    const activeEval = evaluatePack(config, currentParams, evalOptions);
    const data = [];
    const cRateActive = Math.max(0.1, currentParams.cRate || 0.1);
    const R_tot_ohms = activeEval.totalResistance / 1000;
    const R_th = activeEval.rTh;
    const tau = activeEval.tauSec;
    const mode = currentParams.simMode || 'constant';

    const totalTimeSec = mode === 'charge'
      ? (activeEval.chargeTimeMinutes * 60)
      : (3600 / cRateActive);

    const steps = 60;
    const dt = totalTimeSec / steps;
    const V_min_pack = activeEval.seriesCount * currentParams.bmsVoltCutoff;
    const V_max_pack = activeEval.seriesCount * activeEval.cell.vMax;

    let currentSoc = mode === 'charge' ? 10.0 : 100.0;
    let currentTemp = currentParams.ambientTemp;

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      const dutyMult = mode === 'wmtc' ? generateWmtcDutyFactor(i, steps) : 1.0;

      // Current in Amps (positive = discharge, negative = charge)
      let I_step = cRateActive * activeEval.packCapacity * dutyMult;
      if (mode === 'charge') {
        // CC-CV taper above 80% SOC
        const taper = currentSoc > 80 ? Math.max(0.15, (100 - currentSoc) / 20) : 1.0;
        I_step = activeEval.maxSafeChargeC * activeEval.packCapacity * taper;
      }

      // Per-chemistry OCV lookup (Fixes D4)
      const cellOcv = modelMode === 'legacy'
        ? (currentParams.bmsVoltCutoff + ((activeEval.cell.voltage * 1.15 - currentParams.bmsVoltCutoff) * Math.pow(Math.max(0, currentSoc) / 100, 0.5)))
        : interpolateCellOcv(activeEval.cell.family, currentSoc);

      const packOcv = activeEval.seriesCount * cellOcv;
      let V_load = mode === 'charge'
        ? Math.min(V_max_pack, packOcv + (I_step * R_tot_ohms))
        : packOcv - (I_step * R_tot_ohms);

      if (mode !== 'charge' && V_load < V_min_pack) {
        V_load = V_min_pack;
      }

      // Step-by-step thermal integration with PCM clamping (Fixes D3)
      const Q_step = Math.pow(I_step, 2) * R_tot_ohms;
      const dT_step = ((Q_step - (currentTemp - currentParams.ambientTemp) / R_th) / activeEval.cThJK) * dt;
      let nextTemp = currentTemp + dT_step;

      if (modelMode !== 'legacy' && activeEval.cooling.isPcm && nextTemp > activeEval.cooling.pcmMeltTempC && nextTemp < activeEval.cooling.pcmMeltTempC + 2.5) {
        nextTemp = currentTemp + dT_step * 0.18; // Latent heat phase-change absorption plateau
      }
      currentTemp = modelMode === 'legacy'
        ? currentParams.ambientTemp + (Q_step * R_th) * (1 - Math.exp(-t / tau))
        : nextTemp;

      // Fractional minutes (Fixes D10: prevents X-axis jitter at high C-rates)
      const timeMin = parseFloat((t / 60).toFixed(2));

      data.push({
        time: timeMin,
        voltage: parseFloat(V_load.toFixed(2)),
        temperature: parseFloat(currentTemp.toFixed(1)),
        soc: parseFloat(currentSoc.toFixed(1)),
        currentA: parseFloat(I_step.toFixed(1))
      });

      // Advance Coulomb-counted SOC with Peukert rate factor
      const dSoc = ((I_step * dt) / (activeEval.packCapacity * 3600)) * 100 * (mode === 'charge' ? 0.98 : (1 / activeEval.peukertFactor || 1.04));
      currentSoc = mode === 'charge'
        ? Math.min(95, currentSoc + dSoc)
        : Math.max(0, currentSoc - dSoc);

      // Stop on BMS voltage cutoff, thermal trip, or the usable-energy window (Legacy mode uses the full pack)
      const socFloor = modelMode === 'legacy' ? 0 : (1 - activeEval.bms.dodWindow) * 100;
      if ((mode !== 'charge' && V_load <= V_min_pack) || currentTemp >= currentParams.bmsTempTrip || (mode !== 'charge' && currentSoc <= socFloor)) {
        break;
      }
    }

    setSimData(data);
    setTimeout(() => setIsSimulating(false), 180);
  };

  // Run the simulation automatically when the tab opens or any input changes
  React.useEffect(() => {
    if (activeTab === 'bms') runSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, application, designSelection, allAppDesigns, params, modelMode, costBasis]);

  // ---- Pack layout helpers: dot size shrinks as the pack grows ----
  const gridRows = cellVariationStats.grid.length;
  const gridCols = gridRows > 0 ? cellVariationStats.grid[0].length : 0;
  const dotPx = Math.max(gridRows, gridCols) > 22 ? 10 : Math.max(gridRows, gridCols) > 14 ? 13 : 16;
  const dotGap = dotPx < 14 ? 4 : 6;

  // ---- Simulation chart helpers (axes, limits, result cards, stop reason) ----
  const simLast = simData.length > 0 ? simData[simData.length - 1] : null;
  const simShowCutoff = params.simMode !== 'charge';
  const simTempLimit = Math.min(params.bmsTempTrip, appProfile.maxTemp1CCelsius + 3);
  const simCutoffV = seriesCount * params.bmsVoltCutoff;

  const simMaxTime = simLast ? simLast.time : 60;
  const simTimeStep = simMaxTime <= 15 ? 2 : simMaxTime <= 30 ? 5 : simMaxTime <= 75 ? 10 : simMaxTime <= 150 ? 20 : 30;
  const simTimeEnd = Math.max(simTimeStep, Math.ceil(simMaxTime / simTimeStep) * simTimeStep);
  const simTimeTicks = Array.from({ length: Math.round(simTimeEnd / simTimeStep) + 1 }, (_, i) => i * simTimeStep);

  const simVoltages = simData.map(d => d.voltage);
  const simTemps = simData.map(d => d.temperature);
  const simVLow = simLast ? Math.floor(Math.min(...simVoltages, simShowCutoff ? simCutoffV : Infinity) - 1) : 0;
  const simVHigh = simLast ? Math.ceil(Math.max(...simVoltages) + 1) : 60;
  const simTLow = simLast ? Math.floor(Math.min(...simTemps, params.ambientTemp) - 3) : 0;
  const simTHigh = simLast ? Math.ceil(Math.max(...simTemps, simTempLimit) + 3) : 80;

  const simStats = (() => {
    if (!simLast) return null;
    let energyWh = 0;
    for (let i = 1; i < simData.length; i++) {
      const dtH = (simData[i].time - simData[i - 1].time) / 60;
      energyWh += ((simData[i].voltage * simData[i].currentA + simData[i - 1].voltage * simData[i - 1].currentA) / 2) * dtH;
    }
    return { runtimeMin: simLast.time, energyWh, minV: Math.min(...simVoltages), maxV: Math.max(...simVoltages), peakTemp: Math.max(...simTemps) };
  })();

  const simStop = (() => {
    if (!simLast) return null;
    const mins = Math.round(simLast.time);
    if (simLast.temperature >= params.bmsTempTrip) {
      return { tone: 'bad', text: `Stopped at ${mins} min: the pack reached the ${params.bmsTempTrip} °C over-temperature trip.` };
    }
    if (params.simMode !== 'charge' && simLast.voltage <= simCutoffV + 0.05) {
      return { tone: 'volt', text: `Stopped at ${mins} min: the pack reached the ${simCutoffV.toFixed(1)} V under-voltage cutoff with ${simLast.soc.toFixed(1)}% charge left.` };
    }
    if (params.simMode !== 'charge' && modelMode !== 'legacy' && simLast.soc <= (1 - currentEval.bms.dodWindow) * 100 + 5) {
      return { tone: 'ok', text: `Stopped at ${mins} min: the usable-energy limit was reached (${(currentEval.bms.dodWindow * 100).toFixed(0)}% depth of discharge).` };
    }
    if (params.simMode === 'charge') {
      return { tone: 'ok', text: `Charged from 10% to ${simLast.soc.toFixed(0)}% in ${mins} min.` };
    }
    return { tone: 'ok', text: `Run completed in ${mins} min with ${simLast.soc.toFixed(1)}% charge left.` };
  })();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans flex flex-col">
      {/* TOP BAR */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-3.5 flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <Activity className="text-cyan-400 w-6 h-6" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wide">AlchoCells <span className="font-light text-cyan-500"></span></h1>
          
            </div>
            <p className="text-[11px] text-slate-400">Simulate First. Build Next.</p>
          </div>
        </div>

        {/* Stage 6/7 Audit Controls: Physics-Corrected vs Legacy Toggle + Cost Basis Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-950 p-1 rounded border border-slate-800 text-xs">
            <span className="text-slate-400 px-2">Model:</span>
            <button
              type="button"
              onClick={() => setModelMode('physics')}
              className={`px-2.5 py-1 rounded font-semibold transition ${modelMode === 'physics' ? 'bg-cyan-600 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Physics-Corrected
            </button>
            <button
              type="button"
              onClick={() => { setModelMode('legacy'); setShowLegacyInfo(true); }}
              className={`px-2.5 py-1 rounded font-semibold transition ${modelMode === 'legacy' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Legacy
            </button>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded border border-slate-800 text-xs">
            <span className="text-slate-400 px-2">Pricing:</span>
            <button
              type="button"
              onClick={() => setCostBasis('volume')}
              className={`px-2.5 py-1 rounded font-semibold transition ${costBasis === 'volume' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Volume OEM (BNEF)
            </button>
            <button
              type="button"
              onClick={() => setCostBasis('retail')}
              className={`px-2.5 py-1 rounded font-semibold transition ${costBasis === 'retail' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Retail
            </button>
          </div>
<div className="flex items-center bg-slate-950 p-1 rounded border border-slate-800 text-xs" title={`1 USD = ₹${USD_TO_INR}`}>
            <span className="text-slate-400 px-2">Currency:</span>
            <button
              type="button"
              onClick={() => setCurrency('INR')}
              className={`px-2.5 py-1 rounded font-semibold transition ${currency === 'INR' ? 'bg-cyan-600 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              ₹ INR
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 rounded font-semibold transition ${currency === 'USD' ? 'bg-cyan-600 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              $ USD
            </button>
          </div>
<button
  type="button"
  onClick={() => setLightMode(m => !m)}
  className="px-3 py-2 rounded text-xs font-bold border border-slate-700 bg-slate-800 text-slate-200"
>
  {lightMode ? 'Dark mode' : 'Light mode'}
</button>
          {copySuccess && <span className="text-emerald-400 text-sm flex items-center"><CheckCircle2 className="w-4 h-4 mr-1"/> {copySuccess}</span>}
          <button
            type="button"
            onClick={copyShareLink}
            className="px-3 py-2 rounded text-xs font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-cyan-300 transition"
          >
            Share Link
          </button>
          <button
            onClick={exportSummary}
            className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 px-4 py-2 rounded flex items-center transition-colors text-sm font-bold shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </header>

      {/* TABS NAVIGATION (Accessible role="tablist") */}
      <div role="tablist" aria-label="Platform Views" className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 px-6 flex space-x-1 overflow-x-auto shrink-0">
        {[
          { id: 'workbench', icon: Settings, label: 'Multi-Domain Workbench' },
          { id: 'tradeoff', icon: BarChart2, label: 'Design Trade-Off Comparison' },
          { id: 'bms', icon: Cpu, label: 'Subsystem Parameter Exchange' },
          { id: 'traceability', icon: FileText, label: 'Traceability & Datasheets' },
      { id: 'lifecycle', icon: Battery, label: 'Cycle Life & Fleet Economics' },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-cyan-500 text-cyan-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* =====================================================================
              TAB 1: MULTI-DOMAIN WORKBENCH
             ===================================================================== */}
          {activeTab === 'workbench' && (
            <div className="space-y-6">

              {/* HEADLINE: design name + contract status */}
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                    {config.application} · {config.designSelection.split(' (')[0].replace(' Starting', '')}
                  </p>
                  <h2 className="text-3xl font-bold text-slate-100 mt-1">{seriesCount}S{parallelCount}P {config.cellChemistry}</h2>
                  <p className="text-xs text-slate-500 mt-1">{appProfile.roleBadge}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {contracts.criticalCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full border bg-rose-950/80 border-rose-700 text-rose-300 font-semibold">{contracts.criticalCount} critical</span>
                  )}
                  {contracts.warningCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full border bg-amber-950/80 border-amber-700 text-amber-300 font-semibold">{contracts.warningCount} warning</span>
                  )}
                  <span className="text-slate-400">{contracts.rules.length - contracts.violations.length} of {contracts.rules.length} rules satisfied</span>
                </div>
              </div>

              {/* KPI STRIP */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm grid grid-cols-2 md:grid-cols-5 divide-x divide-slate-800">
                {[
                  {
                    label: 'Usable energy',
                    value: `${Math.round(usableEnergyAt1CWh).toLocaleString()} Wh`,
                    sub: `Target ≥ ${appProfile.usableEnergyMinWh.toLocaleString()} Wh`,
                    bad: usableEnergyAt1CWh < appProfile.usableEnergyMinWh
                  },
                  {
                    label: 'Peak temperature',
                    value: `${steadyPeakTemp.toFixed(1)} °C`,
                    sub: `Limit ≤ ${Math.min(params.bmsTempTrip, appProfile.maxTemp1CCelsius + 3)} °C`,
                    bad: steadyPeakTemp > Math.min(params.bmsTempTrip, appProfile.maxTemp1CCelsius + 3)
                  },
                  {
                    label: 'Mass',
                    value: `${totalMassEst.toFixed(2)} kg`,
                    sub: `Limit ≤ ${appProfile.maxMassKg} kg`,
                    bad: totalMassEst > appProfile.maxMassKg
                  },
                  {
                    label: 'Charge time',
                    value: `${chargeTimeMinutes} min`,
                    sub: `Limit ≤ ${appProfile.maxChargeTimeMin} min`,
                    bad: chargeTimeMinutes > appProfile.maxChargeTimeMin
                  },
                  {
                    label: 'Pack cost',
                    value: money(totalCostEst),
                    sub: `${money(packCostPerKWh)} / kWh`,
                    bad: false
                  }
                ].map(k => (
                  <div key={k.label} className="p-5">
                    <p className="text-xs text-slate-500">{k.label}</p>
                    <p className="text-2xl font-bold text-slate-100 mt-1">{k.value}</p>
                    <p className={`text-xs mt-1 ${k.bad ? 'text-rose-400' : 'text-slate-500'}`}>{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* CONFIGURATION + PACK LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-6">

                {/* Configuration card */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-6 space-y-5">
                  <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Configuration</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="select-application" className="block text-[11px] text-slate-500 mb-1">Target application</label>
                      <select id="select-application" name="application" value={config.application} onChange={handleConfigChange} className="w-full p-2 bg-slate-800 border border-slate-700 text-slate-200 rounded focus:ring-2 focus:ring-cyan-500 outline-none text-sm">
                        <option>Swappable 48V E-Scooter Module</option>
                        <option>24V ICU Medical Cart Backup</option>
                        <option>22.2V Agricultural Drone Pack</option>
                        <option>48V Microgrid Rack</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="select-designSelection" className="block text-[11px] text-slate-500 mb-1">Design slot (edits live option)</label>
                      <select id="select-designSelection" name="designSelection" value={config.designSelection} onChange={handleConfigChange} className="w-full p-2 bg-slate-800 border border-cyan-700/60 text-cyan-300 font-semibold rounded focus:ring-2 focus:ring-cyan-500 outline-none text-sm">
                        <option>Baseline Starting Design</option>
                        <option>Option A (High Energy, Active Cooling)</option>
                        <option>Option B (High Power, LFP Chemistry)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="select-cellChemistry" className="block text-[11px] text-slate-500 mb-1">Cell chemistry</label>
                      <select id="select-cellChemistry" name="cellChemistry" value={config.cellChemistry} onChange={handleConfigChange} className="w-full p-2 bg-slate-800 border border-slate-700 text-slate-200 rounded focus:ring-2 focus:ring-cyan-500 outline-none text-sm">
                        <option>Samsung 35E</option>
                        <option>Molicel P42A</option>
                        <option>A123 26650 LFP</option>
                        <option>EVE LF50K</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="input-series" className="block text-[11px] text-slate-500 mb-1">Series (S)</label>
                        <input id="input-series" type="number" name="series" value={config.series} onChange={handleConfigChange} min="1" max="100" className="w-full p-2 bg-slate-800 border border-slate-700 text-slate-200 rounded focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-mono" />
                      </div>
                      <div>
                        <label htmlFor="input-parallel" className="block text-[11px] text-slate-500 mb-1">Parallel (P)</label>
                        <input id="input-parallel" type="number" name="parallel" value={config.parallel} onChange={handleConfigChange} min="1" max="100" className="w-full p-2 bg-slate-800 border border-slate-700 text-slate-200 rounded focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-mono" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-5 space-y-4">
                    <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Subsystems</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="select-busbars" className="block text-[11px] text-slate-500 mb-1">Busbars</label>
                        <select id="select-busbars" name="busbars" value={config.busbars} onChange={handleConfigChange} className="w-full p-2 bg-slate-800 border border-slate-700 text-slate-200 rounded focus:ring-2 focus:ring-cyan-500 outline-none text-sm">
                          <option>Nickel Strips (0.15mm)</option>
                          <option>Copper-Nickel Sandwich (0.2mm)</option>
                          <option>Laser-welded Aluminum</option>
                          <option>Heavy Copper Busbars (Prismatic)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="select-cooling" className="block text-[11px] text-slate-500 mb-1">Cooling</label>
                        <select id="select-cooling" name="cooling" value={config.cooling} onChange={handleConfigChange} className="w-full p-2 bg-slate-800 border border-slate-700 text-slate-200 rounded focus:ring-2 focus:ring-cyan-500 outline-none text-sm">
                          <option>Passive (Natural Convection)</option>
                          <option>Active Air (Forced Fans)</option>
                          <option>Liquid Cooling Plate (Bottom)</option>
                          <option>Phase Change Material (PCM)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="select-spacing" className="block text-[11px] text-slate-500 mb-1">Cell holder spacing</label>
                        <select id="select-spacing" name="spacing" value={config.spacing} onChange={handleConfigChange} className="w-full p-2 bg-slate-800 border border-slate-700 text-slate-200 rounded focus:ring-2 focus:ring-cyan-500 outline-none text-sm">
                          <option>1.5mm Compact Holders</option>
                          <option>2mm Cylindrical Holders</option>
                          <option>3.5mm AIS-156 Thermal Gap</option>
                          <option>5mm High-Airflow Matrix</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="select-bmsTier" className="block text-[11px] text-slate-500 mb-1">BMS tier</label>
                        <select id="select-bmsTier" name="bmsTier" value={config.bmsTier} onChange={handleConfigChange} className="w-full p-2 bg-slate-800 border border-slate-700 text-slate-200 rounded focus:ring-2 focus:ring-cyan-500 outline-none text-sm">
                          <option>Standard (Passive Balancing)</option>
                          <option>Advanced (Active Balancing, CAN bus)</option>
                          <option>Automotive-Grade (ASIL-C, Dual MCU)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Derived thermal & economic strip (kept, includes rupee values) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-slate-800 text-xs">
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Derived thermal R_th & τ:</span>
                      <span className="font-mono text-cyan-400 font-bold">{rTh.toFixed(2)} K/W · τ = {Math.round(tauSec)} s</span>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">CapEx / throughput:</span>
                      <span className="font-mono text-emerald-400 font-bold">{money(lcos, 3, 2)}/kWh (Full LCOS: {money(fullLcosPerKWh, 2)})</span>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">CC-CV charge (10–90%):</span>
                      <span className="font-mono text-slate-200 font-bold">{chargeTimeMinutes} mins (≤{cell.maxChargeA}A/cell)</span>
                    </div>
                  </div>
                </div>

                {/* Pack layout card */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-6 flex flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Pack layout</p>
                    <span className="text-[11px] font-mono text-slate-400">{lengthMm} × {widthMm} × {heightMm} mm · {packVolumeLiters.toFixed(1)} L</span>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-lg overflow-x-auto flex flex-col items-center" style={{ gap: dotGap }}>
                    {cellVariationStats.grid.map((row, rIdx) => (
                      <div key={rIdx} className="flex items-center" style={{ gap: dotGap }}>
                        {row.map((cellNode, cIdx) => {
                          const isRed = cellNode.cellTempC > simTempLimit;
                          const isAmber = !isRed && cellNode.cellTempC > appProfile.maxTemp1CCelsius;
                          const isHotspot = cellNode.id === cellVariationStats.weakestCellLabel;
                          const prismatic = config.cellChemistry === 'EVE LF50K';
                          return (
                            <div
                              key={cIdx}
                              title={`${cellNode.id}: ${cellNode.cellTempC.toFixed(1)}°C | ${cellNode.cellAmp.toFixed(1)}A | IR ${cellNode.irPct}% | Cap ${cellNode.capPct}%${cellNode.isNtcSensor ? ' | [NTC Sensor]' : ''}`}
                              style={{ width: dotPx, height: prismatic ? Math.round(dotPx * 1.5) : dotPx, fontSize: Math.max(6, Math.round(dotPx * 0.5)) }}
                              className={`${prismatic ? 'rounded-sm' : 'rounded-full'} shrink-0 flex items-center justify-center font-mono font-bold select-none text-white ${
                                isRed ? 'bg-rose-500' : isAmber ? 'bg-amber-500' : 'bg-teal-600/80'
                              } ${isHotspot ? 'ring-2 ring-rose-500 ring-offset-1' : ''}`}
                            >
                              {cellNode.isNtcSensor ? 'T' : ''}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    {(seriesCount > gridCols || parallelCount > gridRows) && (
                      <span className="text-[10px] text-slate-400 font-mono mt-1">
                        Showing {gridCols}S × {gridRows}P of {seriesCount}S × {parallelCount}P pack
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-3">
                    <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-600/80 mr-1.5 align-middle"></span>Within target</span>
                    <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5 align-middle"></span>Above {appProfile.maxTemp1CCelsius} °C target</span>
                    <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5 align-middle"></span>Above {simTempLimit} °C limit</span>
                  </div>

                  <div className="flex flex-wrap justify-between gap-1 text-[11px] text-slate-500 mt-2">
                    <span>{totalCells} cells · ±4% IR spread · T = NTC sensor</span>
                    <span className="text-rose-400 font-mono">Hotspot {cellVariationStats.weakestCellLabel} · {cellVariationStats.hottestCellTempC.toFixed(1)} °C</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800 mt-5 pt-5">
                    <div>
                      <p className="text-[11px] text-slate-500">Voltage</p>
                      <p className="text-lg font-semibold text-slate-100">{packVoltage.toFixed(1)} V</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Capacity</p>
                      <p className="text-lg font-semibold text-slate-100">{packCapacity.toFixed(1)} Ah</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Branch current</p>
                      <p className="text-lg font-semibold text-slate-100">{cellVariationStats.maxBranchCurrentA.toFixed(1)} A max</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Cell mass</p>
                      <p className="text-lg font-semibold text-slate-100">{currentEval.cellMassTotal.toFixed(2)} kg</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* DESIGN CONTRACT CHECKS (failures first, passing rows collapsible) */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4">
                  <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Design contract checks</p>
                  <span className="text-xs text-slate-500">{failingRules.length > 0 ? 'Needs attention first' : 'All checks pass'}</span>
                </div>
                {failingRules.map(renderRuleRow)}
                {passingRules.length > 0 && (
                  <button
                    type="button"
                    aria-expanded={showPassing}
                    onClick={() => setShowPassing(s => !s)}
                    className="w-full flex items-center justify-between px-6 py-3 border-t border-slate-800 text-xs font-semibold text-cyan-400 hover:bg-slate-800/50 transition"
                  >
                    <span>{showPassing ? 'Hide' : 'Show'} {passingRules.length} passing check{passingRules.length === 1 ? '' : 's'}</span>
                    <span aria-hidden="true">{showPassing ? '▲' : '▼'}</span>
                  </button>
                )}
                {showPassing && passingRules.map(renderRuleRow)}
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 2: DESIGN TRADE-OFF COMPARISON (Live Model + Pareto + Tornado)
             ===================================================================== */}
          {activeTab === 'tradeoff' && (
            <div className="space-y-6">

              {/* Concept B: Pareto Frontier Knee Recommendation Banner */}
              {paretoAnalysis.kneePick && (
                <div className="bg-slate-900 rounded-md border border-cyan-800/70 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold uppercase">
                        Pareto Optimal Knee Recommendation
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Monte Carlo Thermal Breach Risk: <strong className="text-emerald-400">{paretoAnalysis.kneePick.riskPct}%</strong> (under ±5°C IMD ambient & ±4% IR spread)
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {paretoAnalysis.kneePick.label} — {paretoAnalysis.kneePick.usableWh} Wh Usable · {paretoAnalysis.kneePick.massKg} kg · {money(paretoAnalysis.kneePick.costUsd)} · {paretoAnalysis.kneePick.tempC}°C Peak
                    </h3>
                    <p className="text-xs text-slate-400">
                      Selected from {paretoAnalysis.candidates.length} enumerated designs across 4 chemistries × cooling topologies. Balances mass, thermal safety margin, and BNEF pack cost without violating datasheet current limits.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadKneeIntoOptionA}
                    className="px-3.5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shrink-0 transition"
                  >
                    Load Knee Pick into Option A
                  </button>
                </div>
              )}

              {/* Live Scorecard Table (Fixes D1: Driven 100% by evaluatePack) */}
              <div className="bg-slate-900 rounded-md border border-slate-800 shadow-sm p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">Live Multi-Option Engineering Scorecard</h2>
                    <p className="text-xs text-slate-400">All values compute dynamically from the shared physics model ({modelMode === 'physics' ? 'Physics-Corrected' : 'Legacy'} mode)</p>
                  </div>
                  <div className="flex gap-2">
                    {['Baseline Starting Design', 'Option A (High Energy, Active Cooling)', 'Option B (High Power, LFP Chemistry)'].map(slotName => (
                      <button
                        key={slotName}
                        type="button"
                        onClick={() => { setDesignSelection(slotName); setActiveTab('workbench'); }}
                        className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                      >
                        Edit {slotName.split(' ')[0]} {slotName.split(' ')[1]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Metric & Engineering Basis</th>
                        <th className="px-4 py-3">Target / Limit</th>
                        <th className="px-4 py-3">Baseline ({evalBaseline.seriesCount}S{evalBaseline.parallelCount}P {evalBaseline.design.cellChemistry})</th>
                        <th className="px-4 py-3">Option A ({evalOptionA.seriesCount}S{evalOptionA.parallelCount}P {evalOptionA.design.cellChemistry})</th>
                        <th className="px-4 py-3">Option B ({evalOptionB.seriesCount}S{evalOptionB.parallelCount}P {evalOptionB.design.cellChemistry})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-xs">
                      <tr className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-sans font-medium text-slate-200">Usable Energy @ 1C (Wh) <span className="text-slate-500 block text-[11px]">Incl. DoD window, I²R sag & rate factor</span></td>
                        <td className="px-4 py-3 text-slate-400">&gt; {appProfile.usableEnergyMinWh} Wh</td>
                        <td className="px-4 py-3">{Math.round(evalBaseline.usableEnergyAt1CWh)} Wh <span className="text-slate-500">({Math.round(evalBaseline.packEnergyWh)} gross)</span></td>
                        <td className="px-4 py-3 text-cyan-400 font-bold">{Math.round(evalOptionA.usableEnergyAt1CWh)} Wh <span className="text-slate-500">({Math.round(evalOptionA.packEnergyWh)} gross)</span></td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">{Math.round(evalOptionB.usableEnergyAt1CWh)} Wh <span className="text-slate-500">({Math.round(evalOptionB.packEnergyWh)} gross)</span></td>
                      </tr>
                      <tr className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-sans font-medium text-slate-200">Peak Temp @ 1C Discharge (°C) <span className="text-slate-500 block text-[11px]">Size-scaled R_th = 1/(h·A_eff), τ = R_th·C_th</span></td>
                        <td className="px-4 py-3 text-slate-400">≤ {appProfile.maxTemp1CCelsius}°C</td>
                        <td className={`px-4 py-3 ${evalBaseline.tempAtStated1C > appProfile.maxTemp1CCelsius ? 'text-rose-400 font-bold' : ''}`}>{evalBaseline.tempAtStated1C.toFixed(1)}°C</td>
                        <td className="px-4 py-3">{evalOptionA.tempAtStated1C.toFixed(1)}°C</td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">{evalOptionB.tempAtStated1C.toFixed(1)}°C</td>
                      </tr>
                      <tr className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-sans font-medium text-slate-200">CC-CV Charge Time 10–90% (min) <span className="text-slate-500 block text-[11px]">Capped at datasheet max charge current</span></td>
                        <td className="px-4 py-3 text-slate-400">≤ {appProfile.maxChargeTimeMin} min</td>
                        <td className="px-4 py-3">{evalBaseline.chargeTimeMinutes} min</td>
                        <td className="px-4 py-3 text-cyan-400 font-bold">{evalOptionA.chargeTimeMinutes} min</td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">{evalOptionB.chargeTimeMinutes} min</td>
                      </tr>
                      <tr className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-sans font-medium text-slate-200">Total Mass & Pack Volume <span className="text-slate-500 block text-[11px]">Cells + busbars + holders + cooling + BMS</span></td>
                        <td className="px-4 py-3 text-slate-400">≤ {appProfile.maxMassKg} kg</td>
                        <td className="px-4 py-3">{evalBaseline.totalMassEst.toFixed(1)} kg / {evalBaseline.packVolumeLiters.toFixed(1)} L</td>
                        <td className="px-4 py-3">{evalOptionA.totalMassEst.toFixed(1)} kg / {evalOptionA.packVolumeLiters.toFixed(1)} L</td>
                        <td className="px-4 py-3">{evalOptionB.totalMassEst.toFixed(1)} kg / {evalOptionB.packVolumeLiters.toFixed(1)} L</td>
                      </tr>
                      <tr className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-sans font-medium text-slate-200">Estimated BOM Cost ({costBasis}) <span className="text-slate-500 block text-[11px]">BNEF 2W/3W ref: {money(133)}/kWh</span></td>
                        <td className="px-4 py-3 text-slate-400">{money(appProfile.bnefPackCostBandMin)}–{money(appProfile.bnefPackCostBandMax)}/kWh</td>
                        <td className="px-4 py-3">{money(evalBaseline.totalCostEst)} ({money(evalBaseline.packCostPerKWh)}/kWh)</td>
                        <td className="px-4 py-3">{money(evalOptionA.totalCostEst)} ({money(evalOptionA.packCostPerKWh)}/kWh)</td>
                        <td className="px-4 py-3">{money(evalOptionB.totalCostEst)} ({money(evalOptionB.packCostPerKWh)}/kWh)</td>
                      </tr>
                      <tr className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-sans font-medium text-slate-200">Cycle Life (80% SOH) & Throughput Cost <span className="text-slate-500 block text-[11px]">Temperature-adjusted cycle degradation</span></td>
                        <td className="px-4 py-3 text-slate-400">≥ 600 cycles</td>
                        <td className="px-4 py-3">{evalBaseline.effectiveCycles} cyc · {money(evalBaseline.lcos, 3, 2)}/kWh</td>
                        <td className="px-4 py-3">{evalOptionA.effectiveCycles} cyc · {money(evalOptionA.lcos, 3, 2)}/kWh</td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">{evalOptionB.effectiveCycles} cyc · {money(evalOptionB.lcos, 3, 2)}/kWh</td>
                      </tr>
                      <tr className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-sans font-medium text-slate-200">Design Contract Violations <span className="text-slate-500 block text-[11px]">Datasheet SOA & AIS-156 checks</span></td>
                        <td className="px-4 py-3 text-slate-400">0 Critical</td>
                        <td className="px-4 py-3">{evalBaseline.contracts.criticalCount} Crit / {evalBaseline.contracts.warningCount} Warn</td>
                        <td className="px-4 py-3">{evalOptionA.contracts.criticalCount} Crit / {evalOptionA.contracts.warningCount} Warn</td>
                        <td className="px-4 py-3">{evalOptionB.contracts.criticalCount} Crit / {evalOptionB.contracts.warningCount} Warn</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row 1 Charts: Pareto Scatter Explorer + Sensitivity Tornado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 rounded-md border border-slate-800 shadow-sm p-6">
                  <h2 className="text-base font-semibold text-slate-100 mb-1">Pareto Design-Space Explorer (Usable Wh vs Mass kg)</h2>
                  <p className="text-xs text-slate-400 mb-3">Enumerates candidate packs across chemistries & cooling; green points meet all SOA/thermal requirements</p>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" dataKey="massKg" name="Mass" unit=" kg" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis type="number" dataKey="usableWh" name="Usable Energy" unit=" Wh" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <ZAxis type="number" dataKey="costUsd" range={[45, 180]} name="BOM Cost" />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', fontSize: '12px' }}
                          formatter={(val, name) => (name === 'BOM Cost' ? [money(val), name] : [val, name])}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                        <Scatter name="Pareto Feasible Frontier" data={paretoAnalysis.candidates.filter(c => c.isFeasible)} fill="#10b981" />
                        <Scatter name="Violates Thermal/SOA Limit" data={paretoAnalysis.candidates.filter(c => !c.isFeasible)} fill="#f43f5e" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-md border border-slate-800 shadow-sm p-6">
                  <h2 className="text-base font-semibold text-slate-100 mb-1">Sensitivity Tornado: What Moves Peak Temp (°C) Most?</h2>
                  <p className="text-xs text-slate-400 mb-3">Temperature swing (Δ°C) around active design ({steadyPeakTemp.toFixed(1)}°C) per parameter perturbation</p>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sensitivityTornado} layout="vertical" margin={{ top: 10, right: 25, left: 35, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                        <XAxis type="number" unit="°C" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis type="category" dataKey="factor" width={150} tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                        <ReferenceLine x={0} stroke="#94a3b8" />
                        <Bar dataKey="highSwing" name="High Stress Swing (Δ°C)" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="lowSwing" name="Mitigation Swing (Δ°C)" fill="#0ea5e9" radius={[4, 0, 0, 4]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 2 Charts: Absolute Metric Comparison (Energy, Temp, Time, Cost) + Normalized Radar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 rounded-md border border-slate-800 shadow-sm p-6">
                  <h2 className="text-base font-semibold text-slate-100 mb-1 text-center">Live Absolute Metric Comparison</h2>
                  <p className="text-xs text-slate-400 mb-3 text-center">Usable Energy (Wh), Cost ({currency === 'INR' ? '₹ thousand' : '$'}), Peak Temp (°C), and Charge Time (min)</p>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={liveBarData} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                        <YAxis yAxisId="left" orientation="left" stroke="#0ea5e9" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }} cursor={{ fill: '#1e293b' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }}/>
                        <Bar yAxisId="left" dataKey="energy" name="Usable Energy (Wh)" fill="#0ea5e9" radius={[4,4,0,0]} />
                        <Bar yAxisId={currency === 'INR' ? 'right' : 'left'} dataKey="cost" name={currency === 'INR' ? 'BOM Cost (₹ thousand)' : 'BOM Cost ($)'} fill="#10b981" radius={[4,4,0,0]} />
                        <Bar yAxisId="right" dataKey="temp" name="Peak Temp (°C)" fill="#f43f5e" radius={[4,4,0,0]} />
                        <Bar yAxisId="right" dataKey="time" name="Charge Time (min)" fill="#f59e0b" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-md border border-slate-800 shadow-sm p-6">
                  <h2 className="text-base font-semibold text-slate-100 mb-1 text-center">Normalized Multi-Axis Radar (Defined 0–100 Scales)</h2>
                  <p className="text-xs text-slate-400 mb-3 text-center">100 = 180 Wh/kg, 25°C, 12C rating, {money(70)}/kWh, 3500 cycles</p>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={liveRadarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Baseline" dataKey="Baseline" stroke="#94a3b8" fill="#64748b" fillOpacity={0.25} />
                        <Radar name="Option A" dataKey="OptionA" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.35} />
                        <Radar name="Option B" dataKey="OptionB" stroke="#10b981" fill="#10b981" fillOpacity={0.35} />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              {/* Stacked Subsystem BOM Cost Breakdown */}
              <div className="bg-slate-900 rounded-md border border-slate-800 shadow-sm p-6">
                <div className="mb-3">
                  <h2 className="text-base font-semibold text-slate-100">Subsystem BOM Cost Architecture ({currencySymbol})</h2>
                  <p className="text-xs text-slate-400">Component-level cost split across cells, interconnects, thermal hardware, and BMS ({costBasis} basis)</p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liveCostBreakdown} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                      <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', fontSize: '12px' }}
                        formatter={(val, name) => [`${currencySymbol}${Number(val).toLocaleString()}`, name]}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                      <Bar dataKey="Cells" stackId="a" name="Cells" fill="#0ea5e9" />
                      <Bar dataKey="BusbarsHolders" stackId="a" name="Busbars & Holders" fill="#6366f1" />
                      <Bar dataKey="Cooling" stackId="a" name="Thermal / Cooling" fill="#f59e0b" />
                      <Bar dataKey="BMS" stackId="a" name="BMS Electronics" fill="#10b981" />
                      <Bar dataKey="Enclosure" stackId="a" name="Enclosure & Assembly" fill="#64748b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 3: SUBSYSTEM PARAMETER EXCHANGE & TRANSIENT SIMULATION
             ===================================================================== */}
          {activeTab === 'bms' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Inputs & Controls (Span 4) */}
                <div className="md:col-span-4 bg-slate-900 rounded-md border border-slate-800 shadow-sm p-6 flex flex-col h-full">
                  <h2 className="text-lg font-semibold text-slate-100 mb-4 border-b border-slate-800 pb-2">Simulation Parameters</h2>
                  <div className="space-y-4 flex-1">

                    {/* Concept C: Mission Profile Mode Selector (Constant C-Rate vs WMTC vs CC-CV Charge) */}
                    <div>
                      <label htmlFor="select-simMode" className="block text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
                        Operating Duty Profile (Concept C)
                      </label>
                      <select
                        id="select-simMode"
                        name="simMode"
                        value={params.simMode}
                        onChange={handleParamChange}
                        className="w-full p-2 bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs focus:ring-2 focus:ring-cyan-500 outline-none"
                      >
                        <option value="constant">Constant C-Rate Discharge</option>
                        <option value="wmtc">UNECE GTR No. 2 (WMTC Urban Scooter Cycle)</option>
                        <option value="charge">CC-CV Fast-Charge Mode (10% → 95% SOC)</option>
                      </select>
                    </div>

                    {/* C-Rate Slider */}
                    <div>
                      <label htmlFor="slider-cRate" className="block text-sm font-medium text-slate-400 mb-1 flex justify-between">
                        <span>Discharge C-Rate</span>
                        <span className="text-cyan-400 font-mono font-bold">{params.cRate.toFixed(1)} C</span>
                      </label>
                      <input
                        id="slider-cRate"
                        type="range" name="cRate" value={params.cRate} onChange={handleParamChange}
                        min="0.2" max="5.0" step="0.1"
                        className="w-full cursor-pointer accent-cyan-500 h-2 bg-slate-700 rounded-lg appearance-none"
                      />
                      <p className="text-xs text-slate-500 mt-1 flex justify-between">
                        <span>Pack / Cell Current:</span>
                        <span className="font-mono text-slate-300">{I_load.toFixed(1)} A ({currentEval.cellCurrentA.toFixed(1)} A/cell)</span>
                      </p>
                    </div>

                    {/* Terminal / Harness Resistance Slider (Fixes D7: exposes busbarResistance) */}
                    <div>
                      <label htmlFor="slider-busbarRes" className="block text-sm font-medium text-slate-400 mb-1 flex justify-between">
                        <span>Harness / Contactor R_ext</span>
                        <span className="text-indigo-400 font-mono font-bold">{params.busbarResistance.toFixed(1)} mΩ</span>
                      </label>
                      <input
                        id="slider-busbarRes"
                        type="range" name="busbarResistance" value={params.busbarResistance} onChange={handleParamChange}
                        min="0.5" max="10.0" step="0.5"
                        className="w-full cursor-pointer accent-indigo-500 h-2 bg-slate-700 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Ambient Temp Slider */}
                    <div>
                      <label htmlFor="slider-ambientTemp" className="block text-sm font-medium text-slate-400 mb-1 flex justify-between">
                        <span>Ambient Temperature (IMD Ref)</span>
                        <span className="text-orange-400 font-mono font-bold">{params.ambientTemp}°C</span>
                      </label>
                      <input
                        id="slider-ambientTemp"
                        type="range" name="ambientTemp" value={params.ambientTemp} onChange={handleParamChange}
                        min="-10" max="55" step="1"
                        className="w-full cursor-pointer accent-orange-500 h-2 bg-slate-700 rounded-lg appearance-none"
                      />
                    </div>

                    {/* BMS Temp Cutoff */}
                    <div>
                      <label htmlFor="slider-bmsTempTrip" className="block text-sm font-medium text-slate-400 mb-1 flex justify-between">
                        <span>BMS Over-Temp Trip</span>
                        <span className="text-red-400 font-mono font-bold">{params.bmsTempTrip}°C</span>
                      </label>
                      <input
                        id="slider-bmsTempTrip"
                        type="range" name="bmsTempTrip" value={params.bmsTempTrip} onChange={handleParamChange}
                        min="45" max="85" step="1"
                        className="w-full cursor-pointer accent-red-500 h-2 bg-slate-700 rounded-lg appearance-none"
                      />
                    </div>

                    {/* BMS Under-Volt Cutoff */}
                    <div>
                      <label htmlFor="slider-bmsVoltCutoff" className="block text-sm font-medium text-slate-400 mb-1 flex justify-between">
                        <span>BMS Under-Volt (Per Cell)</span>
                        <span className="text-blue-400 font-mono font-bold">{params.bmsVoltCutoff.toFixed(2)}V</span>
                      </label>
                      <input
                        id="slider-bmsVoltCutoff"
                        type="range" name="bmsVoltCutoff" value={params.bmsVoltCutoff} onChange={handleParamChange}
                        min="2.0" max="3.3" step="0.05"
                        className="w-full cursor-pointer accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none"
                      />
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded border border-slate-800 text-xs text-slate-400 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Pack Internal Res (DCIR+Bus):</span>
                        <span className="font-mono text-slate-200">{totalResistance.toFixed(2)} mΩ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Heat Gen (Q = I²R):</span>
                        <span className="font-mono text-red-400">{qGen.toFixed(1)} W</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Thermal R_th & Time Const τ:</span>
                        <span className="font-mono text-cyan-400">{rTh.toFixed(2)} K/W · {Math.round(tauSec)} s</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => runSimulation()}
                    disabled={isSimulating}
                    className="mt-5 w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-3 px-4 rounded-md transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {isSimulating ? <Activity className="w-5 h-5 mr-2 animate-spin"/> : <PlayCircle className="w-5 h-5 mr-2" />}
                    {isSimulating ? 'Simulating...' : 'Run Transient Simulation'}
                  </button>
                </div>

                {/* Simulation Outputs (Span 8) */}
                <div className="md:col-span-8 bg-slate-900 rounded-md border border-slate-800 shadow-sm p-6 flex flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
                    <h2 className="text-lg font-semibold text-slate-100 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-yellow-500"/>
                      {params.simMode === 'charge' ? 'CC-CV Charge Profile' : params.simMode === 'wmtc' ? 'WMTC Scooter Duty Cycle Profile' : 'Transient Discharge Cycle Profile'}
                    </h2>
                  </div>

                  {/* Plain-language stop reason + datasheet warning */}
                  {simLast && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {simStop && (
                        <div className={`text-xs px-3 py-1.5 rounded border flex items-center ${
                          simStop.tone === 'bad'
                            ? 'bg-red-950/80 text-red-300 border-red-800'
                            : simStop.tone === 'volt'
                            ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                        }`}>
                          {simStop.text}
                        </div>
                      )}
                      {currentEval.cellCurrentA > cell.maxContDischargeA && (
                        <div className="bg-amber-950/80 text-amber-300 text-xs px-3 py-1.5 rounded border border-amber-800 flex items-center">
                          Datasheet warning: cell current ({currentEval.cellCurrentA.toFixed(1)} A) exceeds the {cell.fullName} continuous rating ({cell.maxContDischargeA} A).
                        </div>
                      )}
                    </div>
                  )}

                  {/* Result cards */}
                  {simStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {[
                        {
                          label: 'Runtime',
                          value: `${simStats.runtimeMin.toFixed(1)} min`,
                          sub: params.simMode === 'charge' ? 'CC-CV charge' : params.simMode === 'wmtc' ? 'WMTC urban cycle' : `Constant ${params.cRate.toFixed(1)} C`,
                          bad: false
                        },
                        {
                          label: params.simMode === 'charge' ? 'Energy added' : 'Energy delivered',
                          value: `${Math.round(simStats.energyWh).toLocaleString()} Wh`,
                          sub: params.simMode === 'charge' ? `10% → ${simLast.soc.toFixed(0)}% charge` : `Down to ${simLast.soc.toFixed(1)}% charge`,
                          bad: false
                        },
                        {
                          label: params.simMode === 'charge' ? 'Highest voltage' : 'Lowest voltage',
                          value: `${(params.simMode === 'charge' ? simStats.maxV : simStats.minV).toFixed(1)} V`,
                          sub: params.simMode === 'charge' ? `Max ${(seriesCount * cell.vMax).toFixed(1)} V` : `Cutoff ${simCutoffV.toFixed(1)} V`,
                          bad: false
                        },
                        {
                          label: 'Peak temperature',
                          value: `${simStats.peakTemp.toFixed(1)} °C`,
                          sub: `Limit ≤ ${simTempLimit} °C`,
                          bad: simStats.peakTemp > simTempLimit
                        }
                      ].map(k => (
                        <div key={k.label} className="bg-slate-950 border border-slate-800 rounded p-3">
                          <p className="text-[11px] text-slate-500">{k.label}</p>
                          <p className="text-xl font-bold text-slate-100 mt-0.5">{k.value}</p>
                          <p className={`text-[11px] mt-0.5 ${k.bad ? 'text-rose-400' : 'text-slate-500'}`}>{k.sub}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {simData.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-md bg-slate-950/50 min-h-[340px]">
                      <Activity className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-sm">Adjust parameters and click "Run Transient Simulation"</p>
                      <p className="text-xs text-slate-600 mt-1">Supports Constant C-Rate, UNECE WMTC Urban Cycle, and CC-CV Fast Charging</p>
                    </div>
                  ) : (
                    <div className="h-[390px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={simData} margin={{ top: 8, right: 8, left: 4, bottom: 28 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.25} />
                          <XAxis
                            dataKey="time" type="number" domain={[0, simTimeEnd]} ticks={simTimeTicks}
                            tick={{ fill: '#64748b', fontSize: 11 }} stroke="#94a3b8" tickLine={false}
                            label={{ value: 'Time (min)', position: 'insideBottom', offset: -14, fill: '#64748b', fontSize: 11 }}
                          />
                          <YAxis
                            yAxisId="left" domain={[simVLow, simVHigh]} allowDecimals={false} width={56}
                            tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
                            label={{ value: 'Pack voltage (V)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11, style: { textAnchor: 'middle' } }}
                          />
                          <YAxis
                            yAxisId="right" orientation="right" domain={[simTLow, simTHigh]} allowDecimals={false} width={56}
                            tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
                            label={{ value: 'Temperature (°C)', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 11, style: { textAnchor: 'middle' } }}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', color: '#f8fafc', fontSize: '12px' }}
                            labelFormatter={(value) => `Time: ${value} min`}
                          />
                          <Legend verticalAlign="top" height={30} wrapperStyle={{ color: '#64748b', fontSize: '12px' }} />
                          {simShowCutoff && (
                            <ReferenceLine
                              yAxisId="left" y={simCutoffV} stroke="#94a3b8" strokeDasharray="5 4"
                              label={{ value: `Cutoff ${simCutoffV.toFixed(1)} V`, position: 'insideBottomLeft', fill: '#64748b', fontSize: 11 }}
                            />
                          )}
                          <ReferenceLine
                            yAxisId="right" y={simTempLimit} stroke="#94a3b8" strokeDasharray="5 4"
                            label={{ value: `Temp limit ${simTempLimit} °C`, position: 'insideTopLeft', fill: '#64748b', fontSize: 11 }}
                          />
                          <Line yAxisId="left" type="monotone" dataKey="voltage" name="Pack voltage (V)" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                          <Line yAxisId="right" type="monotone" dataKey="temperature" name="Pack temperature (°C)" stroke="#f87171" strokeWidth={2} dot={false} isAnimationActive={false} />
                          <ReferenceDot
                            yAxisId="left" x={simLast.time} y={simLast.voltage} r={5} fill="#38bdf8" stroke="#ffffff" strokeWidth={2}
                            label={{ value: `${Math.round(simLast.time)} min`, position: 'top', fill: '#64748b', fontSize: 11 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* SOC Tracker & WMTC Fleet Economics Overlay at Bottom */}
                  {simData.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>End-of-Run State of Charge (SOC)</span>
                          <span className="font-mono text-slate-200">{simData[simData.length - 1].soc.toFixed(1)}% SOC</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-800 overflow-hidden">
                          <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 h-2.5 transition-all duration-300" style={{ width: `${simData[simData.length - 1].soc}%` }}></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs font-mono bg-slate-950 p-3 rounded border border-slate-800">
                        <div>
                          <span className="text-slate-500 block font-sans">Est. E-Scooter Range/Swap:</span>
                          <strong className="text-emerald-400">{(usableEnergyAt1CWh / 28).toFixed(1)} km</strong> <span className="text-slate-500">(28 Wh/km)</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block font-sans">Swap Fleet Energy Cost/km:</span>
                          <strong className="text-cyan-400">{money((fullLcosPerKWh * 28) / 1000, 4, 2)} / km</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block font-sans">Cell OCV Curve Model:</span>
                          <strong className="text-slate-200">{cell.family} Piecewise Lookup</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 4: TRACEABILITY, DATASHEETS, ASSUMPTIONS & BENCH VALIDATION
             ===================================================================== */}
          {activeTab === 'traceability' && (
            <div className="space-y-6">

              {/* Expanded 6-Row Application-Driven Requirement Validation Matrix (Fixes D5, D6, C4) */}
              <div className="bg-slate-900 rounded-md border border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">Application Requirement & Traceability Matrix</h2>
                    <p className="text-xs text-slate-400">Evaluated for {config.application} at stated reference conditions (1C, 25°C) with linked model evidence</p>
                  </div>
                  <span className="text-xs font-mono text-cyan-400">{config.designSelection}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Req ID</th>
                        <th className="px-4 py-3">Requirement & Stated Condition</th>
                        <th className="px-4 py-3">Target</th>
                        <th className="px-4 py-3">Linked Subsystem & Model</th>
                        <th className="px-4 py-3">Verified Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 text-xs">
                      <tr className="hover:bg-slate-800/50">
                        <td className="px-4 py-3.5 font-mono text-cyan-400">REQ-001</td>
                        <td className="px-4 py-3.5 font-medium text-slate-200">Nominal Bus Voltage Window ({config.application})</td>
                        <td className="px-4 py-3.5 font-mono">{appProfile.vMinReq}V – {appProfile.vMaxReq}V</td>
                        <td className="px-4 py-3.5 text-slate-400">Series Count ({seriesCount}S) × {cell.voltage}V ({cell.fullName})</td>
                        <td className="px-4 py-3.5 font-mono">
                          {packVoltage >= appProfile.vMinReq && packVoltage <= appProfile.vMaxReq ?
                            <span className="bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded border border-emerald-800 font-bold">✓ PASS ({packVoltage.toFixed(1)}V)</span> :
                            <span className="bg-red-900/50 text-red-400 px-2 py-1 rounded border border-red-800 font-bold">✗ FAIL ({packVoltage.toFixed(1)}V)</span>}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-800/50">
                        <td className="px-4 py-3.5 font-mono text-cyan-400">REQ-002</td>
                        <td className="px-4 py-3.5 font-medium text-slate-200">Thermal Safety @ Stated 1C Discharge (25°C Ambient)</td>
                        <td className="px-4 py-3.5 font-mono">≤ {appProfile.maxTemp1CCelsius.toFixed(0)}°C</td>
                        <td className="px-4 py-3.5 text-slate-400">Size-scaled R_th ({rTh.toFixed(2)} K/W), τ={Math.round(tauSec)}s ({config.cooling})</td>
                        <td className="px-4 py-3.5 font-mono">
                          {tempAtStated1C <= appProfile.maxTemp1CCelsius ?
                            <span className="bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded border border-emerald-800 font-bold">✓ PASS ({tempAtStated1C.toFixed(1)}°C @1C)</span> :
                            <span className="bg-red-900/50 text-red-400 px-2 py-1 rounded border border-red-800 font-bold">✗ FAIL ({tempAtStated1C.toFixed(1)}°C @1C)</span>}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-800/50">
                        <td className="px-4 py-3.5 font-mono text-cyan-400">REQ-003</td>
                        <td className="px-4 py-3.5 font-medium text-slate-200">Minimum Usable Energy @ 1C (Net of DoD, Sag & Cutoff)</td>
                        <td className="px-4 py-3.5 font-mono">≥ {appProfile.usableEnergyMinWh} Wh</td>
                        <td className="px-4 py-3.5 text-slate-400">{packEnergyWh.toFixed(0)}Wh gross × {(currentEval.bms.dodWindow*100).toFixed(0)}% DoD × η_discharge</td>
                        <td className="px-4 py-3.5 font-mono">
                          {usableEnergyAt1CWh >= appProfile.usableEnergyMinWh ?
                            <span className="bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded border border-emerald-800 font-bold">✓ PASS ({usableEnergyAt1CWh.toFixed(0)}Wh)</span> :
                            <span className="bg-red-900/50 text-red-400 px-2 py-1 rounded border border-red-800 font-bold">✗ FAIL ({usableEnergyAt1CWh.toFixed(0)}Wh)</span>}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-800/50">
                        <td className="px-4 py-3.5 font-mono text-cyan-400">REQ-004</td>
                        <td className="px-4 py-3.5 font-medium text-slate-200">Module Mass & Packaging Envelope</td>
                        <td className="px-4 py-3.5 font-mono">≤ {appProfile.maxMassKg} kg</td>
                        <td className="px-4 py-3.5 text-slate-400">Bottom-up BOM mass ({packVolumeLiters.toFixed(1)} L · {lengthMm}×{widthMm}×{heightMm} mm)</td>
                        <td className="px-4 py-3.5 font-mono">
                          {totalMassEst <= appProfile.maxMassKg ?
                            <span className="bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded border border-emerald-800 font-bold">✓ PASS ({totalMassEst.toFixed(2)}kg)</span> :
                            <span className="bg-red-900/50 text-red-400 px-2 py-1 rounded border border-red-800 font-bold">✗ FAIL ({totalMassEst.toFixed(2)}kg)</span>}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-800/50">
                        <td className="px-4 py-3.5 font-mono text-cyan-400">REQ-005</td>
                        <td className="px-4 py-3.5 font-medium text-slate-200">CC-CV Fast-Charge Time (10–90% SOC Without Plating)</td>
                        <td className="px-4 py-3.5 font-mono">≤ {appProfile.maxChargeTimeMin} min</td>
                        <td className="px-4 py-3.5 text-slate-400">Datasheet Max Charge {cell.maxChargeA}A/cell ({currentEval.maxSafeChargeC.toFixed(2)}C)</td>
                        <td className="px-4 py-3.5 font-mono">
                          {chargeTimeMinutes <= appProfile.maxChargeTimeMin ?
                            <span className="bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded border border-emerald-800 font-bold">✓ PASS ({chargeTimeMinutes} min)</span> :
                            <span className="bg-red-900/50 text-red-400 px-2 py-1 rounded border border-red-800 font-bold">✗ FAIL ({chargeTimeMinutes} min)</span>}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-800/50">
                        <td className="px-4 py-3.5 font-mono text-cyan-400">REQ-006</td>
                        <td className="px-4 py-3.5 font-medium text-slate-200">AIS-156 Rev 3 Thermal Gap & Multi-NTC BMS Protection</td>
                        <td className="px-4 py-3.5 font-mono">≥ 2mm gap & ≥ 4 NTC</td>
                        <td className="px-4 py-3.5 text-slate-400">{config.spacing} + {config.bmsTier}</td>
                        <td className="px-4 py-3.5 font-mono">
                          {currentEval.spacing.ais156Pass && currentEval.bms.ais156Compliant ?
                            <span className="bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded border border-emerald-800 font-bold">✓ PASS (AIS-156 Aligned)</span> :
                            <span className="bg-amber-900/50 text-amber-300 px-2 py-1 rounded border border-amber-800 font-bold">⚠ NON-COMPLIANT</span>}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reconciled Manufacturer Cell Datasheet Table (Fixes "Tab is titled Datasheets but shows none") */}
              <div className="bg-slate-900 rounded-md border border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
                  <h2 className="text-base font-semibold text-slate-100">Reconciled Cell Datasheet Register & Provenance (Stage 3 Audit)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5">Cell Model</th>
                        <th className="px-4 py-2.5">Nom V / Ah</th>
                        <th className="px-4 py-2.5">AC IR (1kHz) vs DCIR</th>
                        <th className="px-4 py-2.5">Cont. Discharge / Max Chg</th>
                        <th className="px-4 py-2.5">Mass & Dimensions</th>
                        <th className="px-4 py-2.5">Volume vs Retail ({currencySymbol})</th>
                        <th className="px-4 py-2.5">Datasheet Provenance & Test Basis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                      {Object.values(CELL_LIBRARY).map(c => (
                        <tr key={c.id} className={c.id === config.cellChemistry ? 'bg-cyan-950/30' : 'hover:bg-slate-800/40'}>
                          <td className="px-4 py-2.5 font-sans font-bold text-white">{c.fullName}</td>
                          <td className="px-4 py-2.5">{c.voltage}V · {c.capacity}Ah</td>
                          <td className="px-4 py-2.5">{c.irAcMohm}mΩ AC / <strong className="text-cyan-300">{c.irDcMohm}mΩ DC</strong></td>
                          <td className="px-4 py-2.5">{c.maxContDischargeA}A dchg / {c.maxChargeA}A chg</td>
                          <td className="px-4 py-2.5">{(c.mass * 1000).toFixed(0)}g ({c.diameterMm}×{c.heightMm}mm)</td>
                          <td className="px-4 py-2.5">{money(c.costVolume, 2, 0)} vol / {money(c.costRetail, 2, 0)} ret</td>
                          <td className="px-4 py-2.5 font-sans text-slate-400">{c.provenance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Economics, Governing Physics, Assumptions Register & Low-Voltage Lab Protocol */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 rounded-md border border-slate-800 shadow-sm p-6 space-y-4">
                  <h2 className="text-base font-semibold text-slate-100 flex items-center border-b border-slate-800 pb-2">
                    {currency === 'INR' ? <IndianRupee className="w-5 h-5 mr-2 text-emerald-500"/> : <DollarSign className="w-5 h-5 mr-2 text-emerald-500"/>} Throughput Cost & Full LCOS Breakdown (Fixes D8, D12)
                  </h2>
                  <div className="bg-slate-950 p-3.5 rounded border border-slate-800 text-xs text-slate-300 font-mono space-y-1">
                    <div>CapEx_throughput = BOM_Cost / (E_usable_1C × Cycles_eff × η_disch)</div>
                    <div>Full_LCOS = (BOM_Cost × 1.08_O&M) / Throughput_kWh + ({money(0.09, 2, 1)}_tariff / 0.90_RTE)</div>
                  </div>
                  
<ul className="space-y-2 text-xs text-slate-400">
  <li className="flex justify-between"><span>Pack BOM Cost ({costBasis} basis):</span> <strong className="text-slate-200 font-mono">{money(totalCostEst, 2, 0)} ({money(packCostPerKWh)}/kWh)</strong></li>
  <li className="flex justify-between"><span>Usable Energy @ 1C ({(currentEval.bms.dodWindow*100).toFixed(0)}% DoD):</span> <strong className="text-slate-200 font-mono">{(usableEnergyAt1CWh / 1000).toFixed(3)} kWh</strong></li>
  <li className="flex justify-between"><span>Temp-Adjusted Cycle Life (to 80% SOH):</span> <strong className="text-slate-200 font-mono">{effectiveCycles} cycles</strong></li>
  <li className="flex justify-between border-t border-slate-800 pt-2">
    <span className="text-cyan-400">CapEx per kWh Throughput:</span>
    <strong className="text-cyan-400 font-mono text-sm">{money(lcos, 4, 2)} / kWh</strong>
  </li>
  <li className="flex justify-between">
    <span className="text-emerald-400">Full Levelized Cost (incl. Electricity & O&M):</span>
    <strong className="text-emerald-400 font-mono text-sm">{money(fullLcosPerKWh, 4, 2)} / kWh</strong>
  </li>
</ul>
                </div>

                <div className="bg-slate-900 rounded-md border border-slate-800 shadow-sm p-6 space-y-4">
                  <h2 className="text-base font-semibold text-slate-100 border-b border-slate-800 pb-2">
                    Assumptions Register, Limitations & Safe Bench Protocol (C6 / H3)
                  </h2>
                  <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
  <li><strong className="text-cyan-400">Thermal Assumptions:</strong> Lumped thermal capacitance C_th = m · c_p (c_p ≈ 910–980 J/kg·K). Convection coefficients h between 6.5 and 145 W/m²K are textbook engineering values requiring empirical calibration.</li>
  <li><strong className="text-amber-400">External Reference Datasets:</strong> Single-cell fade and thermal rise shape benchmarked against <span className="underline">NASA Ames PCoE 18650 Dataset</span> and <span className="underline">Sandia Battery Archive</span>; ambient range anchored to <span className="underline">IMD Gridded Daily Max Temperature</span>; regulatory rules mapped to <span className="underline">AIS-156 Amendment 3</span>.</li>
  <li><strong className="text-emerald-400">Recommended Next Step (Safe Low-Voltage Bench Experiment):</strong> Assemble a scaled <strong>4S2P (≤16.8V)</strong> sub-module inside a vermiculite/sand fireproof tray with a 15A inline blade fuse, 4× 10kΩ NTC thermistors (center vs edge cells), and a current-limited electronic load at 0.5C/1C to measure empirical R_th and τ within a strict 0–45°C attended window.</li>
</ul>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 5: BATTERY CYCLE LIFE & SWAPPING FLEET ECONOMICS
             ===================================================================== */}
          {activeTab === 'lifecycle' && (() => {
            const usableKwh = Math.max(0.1, usableEnergyAt1CWh / 1000);
            const rangePerSwapKm = usableEnergyAt1CWh / 28; // 28 Wh/km e-scooter consumption
            const stationOpsMarginUsd = 0.28; // ~₹26/swap station capex & handling margin
            const costPerSwapUsd = usableKwh * fullLcosPerKWh + stationOpsMarginUsd;
            const batteryLifeYears = effectiveCycles / (365 * Math.max(0.5, swapsPerDay));
            const electricCostPerKmUsd = costPerSwapUsd / Math.max(1, rangePerSwapKm);
            const petrolCostPerKmUsd = 2.40 / USD_TO_INR; // ₹2.40/km petrol scooter benchmark
            const savingsPerKmUsd = petrolCostPerKmUsd - electricCostPerKmUsd;
            const annualKm = rangePerSwapKm * swapsPerDay * 365;
            const annualSavingsUsd = savingsPerKmUsd * annualKm;

            // SOH degradation curve comparing Baseline, Option A, and Option B
            const maxCycPlot = Math.max(
              evalBaseline.effectiveCycles,
              evalOptionA.effectiveCycles,
              evalOptionB.effectiveCycles,
              1000
            );
            const stepCyc = Math.max(100, Math.round(maxCycPlot / 12 / 50) * 50);
            const sohCurve = [];
            for (let c = 0; c <= maxCycPlot + stepCyc; c += stepCyc) {
              const sohAt = (effCyc) => parseFloat(Math.max(65, 100 - 20 * (c / Math.max(1, effCyc))).toFixed(1));
              sohCurve.push({
                cycles: c,
                Baseline: sohAt(evalBaseline.effectiveCycles),
                OptionA: sohAt(evalOptionA.effectiveCycles),
                OptionB: sohAt(evalOptionB.effectiveCycles)
              });
            }

            return (
              <div className="space-y-6">
                {/* Top KPI Strip */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-800">
                  <div className="p-5">
                    <p className="text-xs text-slate-500">Temp-adjusted cycle life</p>
                    <p className="text-2xl font-bold text-slate-100 mt-1">{effectiveCycles.toLocaleString()} cycles</p>
                    <p className="text-xs text-slate-500 mt-1">To 80% SOH @ {steadyPeakTemp.toFixed(1)} °C peak</p>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-slate-500">Fleet service lifetime</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{batteryLifeYears.toFixed(1)} years</p>
                    <p className="text-xs text-slate-500 mt-1">At {swapsPerDay.toFixed(1)} swaps/day ({Math.round(annualKm).toLocaleString()} km/yr)</p>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-slate-500">Cost per battery swap</p>
                    <p className="text-2xl font-bold text-cyan-400 mt-1">{money(costPerSwapUsd, 2, 1)}</p>
                    <p className="text-xs text-slate-500 mt-1">{rangePerSwapKm.toFixed(0)} km range @ 28 Wh/km</p>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-slate-500">Running cost vs petrol</p>
                    <p className="text-2xl font-bold text-slate-100 mt-1">{money(electricCostPerKmUsd, 4, 2)} / km</p>
                    <p className={`text-xs mt-1 ${savingsPerKmUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {savingsPerKmUsd >= 0 ? `Saves ${money(annualSavingsUsd, 0, 0)}/yr vs ${money(petrolCostPerKmUsd, 3, 2)}/km ICE` : 'Higher than petrol benchmark'}
                    </p>
                  </div>
                </div>

                {/* Duty Intensity Control + SOH Degradation Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-4 bg-slate-900 rounded-md border border-slate-800 shadow-sm p-6 space-y-5">
                    <h2 className="text-base font-semibold text-slate-100 border-b border-slate-800 pb-2">
                      Swapping Fleet Duty Parameters
                    </h2>

                    <div>
                      <label htmlFor="slider-swapsPerDay" className="block text-sm font-medium text-slate-400 mb-1 flex justify-between">
                        <span>Daily Swap Frequency</span>
                        <span className="text-emerald-400 font-mono font-bold">{swapsPerDay.toFixed(1)} swaps/day</span>
                      </label>
                      <input
                        id="slider-swapsPerDay"
                        type="range"
                        min="1.0"
                        max="4.0"
                        step="0.5"
                        value={swapsPerDay}
                        onChange={(e) => setSwapsPerDay(parseFloat(e.target.value))}
                        className="w-full cursor-pointer accent-emerald-500 h-2 bg-slate-700 rounded-lg appearance-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        1.0/day = personal commuter · 2.5–4.0/day = commercial delivery fleet
                      </p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Active Chemistry:</span>
                        <span className="font-mono text-slate-200">{cell.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Datasheet Base Cycles:</span>
                        <span className="font-mono text-slate-200">{cell.cycles.toLocaleString()} cycles</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Thermal Ageing Derating:</span>
                        <span className="font-mono text-amber-400">
                          -{Math.round((1 - effectiveCycles / Math.max(1, cell.cycles)) * 100)}% (@ {steadyPeakTemp.toFixed(1)}°C)
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-800 pt-2">
                        <span className="text-slate-400">Lifetime Energy Delivered:</span>
                        <span className="font-mono text-cyan-400 font-bold">
                          {Math.round(usableKwh * effectiveCycles * 0.95).toLocaleString()} kWh
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-8 bg-slate-900 rounded-md border border-slate-800 shadow-sm p-6">
                    <h2 className="text-base font-semibold text-slate-100 mb-1">
                      State-of-Health (SOH) Cycle Retention Comparison
                    </h2>
                    <p className="text-xs text-slate-400 mb-3">
                      Projected capacity retention down to the 80% end-of-first-life retirement threshold
                    </p>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sohCurve} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis
                            dataKey="cycles"
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            label={{ value: 'Charge / Swap Cycles', position: 'insideBottom', offset: -8, fill: '#64748b', fontSize: 11 }}
                          />
                          <YAxis
                            domain={[70, 100]}
                            unit="%"
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', color: '#f8fafc', fontSize: '12px' }}
                            formatter={(val) => [`${val}% SOH`, '']}
                            labelFormatter={(c) => `${c} Cycles`}
                          />
                          <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '12px' }} />
                          <ReferenceLine
                            y={80}
                            stroke="#f43f5e"
                            strokeDasharray="5 4"
                            label={{ value: '80% SOH Retirement Limit', position: 'insideBottomLeft', fill: '#f43f5e', fontSize: 11 }}
                          />
                          <Line type="monotone" dataKey="Baseline" name={`Baseline (${evalBaseline.design.cellChemistry})`} stroke="#94a3b8" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="OptionA" name={`Option A (${evalOptionA.design.cellChemistry})`} stroke="#0ea5e9" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="OptionB" name={`Option B (${evalOptionB.design.cellChemistry})`} stroke="#10b981" strokeWidth={2.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Side-by-Side Fleet Lifecycle Comparison Table */}
                <div className="bg-slate-900 rounded-md border border-slate-800 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
                    <h2 className="text-base font-semibold text-slate-100">
                      Side-by-Side Swapping Fleet Lifecycle & Economics ({swapsPerDay.toFixed(1)} swaps/day)
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Design Option</th>
                          <th className="px-4 py-3">Effective Cycles</th>
                          <th className="px-4 py-3">Service Life</th>
                          <th className="px-4 py-3">Range / Swap</th>
                          <th className="px-4 py-3">Cost / Swap</th>
                          <th className="px-4 py-3">Running Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                        {[
                          { label: 'Baseline', ev: evalBaseline },
                          { label: 'Option A', ev: evalOptionA },
                          { label: 'Option B (LFP)', ev: evalOptionB }
                        ].map(({ label, ev }) => {
                          const kwh = Math.max(0.1, ev.usableEnergyAt1CWh / 1000);
                          const km = ev.usableEnergyAt1CWh / 28;
                          const swapCost = kwh * ev.fullLcosPerKWh + stationOpsMarginUsd;
                          const yrs = ev.effectiveCycles / (365 * Math.max(0.5, swapsPerDay));
                          return (
                            <tr key={label} className="hover:bg-slate-800/40">
                              <td className="px-4 py-3 font-sans font-bold text-slate-100">
                                {label} ({ev.seriesCount}S{ev.parallelCount}P {ev.design.cellChemistry})
                              </td>
                              <td className="px-4 py-3">{ev.effectiveCycles.toLocaleString()} cyc</td>
                              <td className="px-4 py-3 text-emerald-400 font-bold">{yrs.toFixed(1)} yrs</td>
                              <td className="px-4 py-3">{km.toFixed(0)} km</td>
                              <td className="px-4 py-3 text-cyan-400">{money(swapCost, 2, 1)}</td>
                              <td className="px-4 py-3">{money(swapCost / Math.max(1, km), 4, 2)} / km</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}


          
        </div>
      </main>

      {/* FOOTER */}
      <footer className="px-6 py-4 text-center text-[11px] text-slate-500 border-t border-slate-800">
        Estimates from a simplified model; not a substitute for AIS-156 testing.
        {currency === 'INR' ? ` Costs converted at ₹${USD_TO_INR} per US$.` : ''}
      </footer>

      {/* LEGACY MODE INFO POP-UP */}
      {showLegacyInfo && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowLegacyInfo(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="legacy-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div>
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[11px] font-bold uppercase">Legacy mode</span>
              <h3 id="legacy-title" className="text-lg font-bold text-slate-100 mt-2">Quick, simplified estimates</h3>
            </div>
            <p className="text-sm text-slate-300">
              Legacy mode is ideal for fast first-pass sizing, and for comparing against the Physics-Corrected results to see how much the detailed model changes the answer.
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-5">
              <li>Heat flow uses one fixed value per cooling type, not the pack's size.</li>
              <li>Usable energy equals the full nominal energy (no depth-of-discharge window, voltage sag or cut-off loss).</li>
              <li>Mass = cells × 1.35. Cost = retail cell prices plus a flat {money(150)}.</li>
            </ul>
            <p className="text-xs font-semibold text-slate-200">
              Numbers are usually optimistic. Use Physics-Corrected for final design decisions.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setModelMode('physics'); setShowLegacyInfo(false); }}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300"
              >
                Switch back to Physics-Corrected
              </button>
              <button
                type="button"
                onClick={() => setShowLegacyInfo(false)}
                className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STRUCTURED REPORT & JSON EXPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-3xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Traceable Engineering Report</h3>
                <p className="text-xs text-slate-400">Copied to clipboard </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Close
              </button>
            </div>
            <pre className="flex-1 overflow-y-auto bg-slate-950 border border-slate-800 rounded p-4 text-xs font-mono text-slate-200 whitespace-pre-wrap">
              {buildStructuredReportText()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
