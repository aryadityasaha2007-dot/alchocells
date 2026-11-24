import React, { useState, useMemo } from 'react';
import {
  Settings, BarChart2, Activity, FileText, Download,
  Cpu, Battery, ShieldCheck, CheckCircle2, Zap, PlayCircle, DollarSign,
  AlertTriangle, Info, Layers, Compass, Sliders, Check, X
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ZAxis, ReferenceLine
} from 'recharts';

// ============================================================================
// 1. RECONCILED DATASHEET LIBRARY WITH PROVENANCE (Fixes D9, D12, C5)
// ============================================================================
const USD_TO_INR = 93; // update to the current exchange rate
const inr = (usd, digits = 0) =>
  '₹' + (usd * USD_TO_INR).toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });

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
    irAcMohm: 35.0,         // ≤35 mOhm AC @ 1kHz (Datasheet initial)
    irDcMohm: 48.0,         // mOhm 10s pulse DCIR (used for I²R heating in Physics-Corrected mode)
    maxContDischargeA: 8.0, // A continuous (13A peak non-continuous)
    maxChargeA: 2.0,        // A max charge (1.7A standard, ~0.57C max)
    mass: 0.050,            // kg (50.0g max per datasheet)
    diameterMm: 18.55,
    heightMm: 65.25,
    costRetail: 4.50,       // USD single-unit distributor price
    costVolume: 1.55,       // USD OEM volume pack-aligned price (~$123/kWh cell level)
    cycles: 500,            // cycles to 80% SOH @ 1A chg / 3.4A dchg (conservative datasheet basis)
    cyclesLegacy: 800,
    cpJkgK: 910,            // J/(kg·K) specific heat capacity
    provenance: 'Samsung SDI Spec INR18650-35E Rev 1.2 (AC IR ≤ 35mΩ @ 1kHz; Cont. 8A; Max Chg 2.0A; 50g max)'
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
    cpJkg
