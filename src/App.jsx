import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import {
Upload, Users, Settings, FlaskConical, Home, Search, ChevronLeft, ChevronRight,
AlertTriangle, CheckCircle2, XCircle, Info, Brain, Zap, TrendingUp, TrendingDown,
Minus, FileText, Database, Download, RotateCcw, GraduationCap, Sparkles, Eye,
BookOpen, Activity, ShieldQuestion, Bot, Save, Trash2, Languages, Award, Target,
Printer, Trophy, Rocket, Flame, Lightbulb, ClipboardList, Star,
} from 'lucide-react';

/* ============================================================================
HKDSE PHYSICS MASTERY PROFILE — single-file prototype
============================================================================ */

/* ------------------------------ CORE HELPERS ----------------------------- */
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function parseCSV(text) {
if (text == null) return [];
if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
const rows = [];
let row = [], field = '', inQuotes = false, i = 0;
const n = text.length;
while (i < n) {
const c = text[i];
if (inQuotes) {
if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } inQuotes = false; i++; continue; }
field += c; i++; continue;
}
if (c === '"') { inQuotes = true; i++; continue; }
if (c === ',') { row.push(field); field = ''; i++; continue; }
if (c === '\r') { if (text[i + 1] === '\n') i++; row.push(field); field = ''; rows.push(row); row = []; i++; continue; }
if (c === '\n') { row.push(field); field = ''; rows.push(row); row = []; i++; continue; }
field += c; i++;
}
if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
return rows;
}
function csvField(s) { s = String(s == null ? '' : s); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function toCSV(rows) { return rows.map(r => r.map(csvField).join(',')).join('\n'); }

function canonicalClassNumber(raw) {
if (raw == null) return null;
let s = String(raw).replace(/\uFEFF/g, '').replace(/[\r\n]+/g, ' ').trim().replace(/\s+/g, '').toUpperCase();
const m = s.match(/^(\d+[A-Z]+)(\d+)$/);
if (!m) return null;
const cls = m[1], number = parseInt(m[2], 10);
return { cls, number, canonical: `${cls}${String(number).padStart(2, '0')}` };
}
function normalizeTrafficLight(v) {
if (v == null) return 'Unanswered';
const s = String(v).replace(/\uFEFF/g, '').trim().toLowerCase();
if (s === '') return 'Unanswered';
if (s.includes('green') || s.includes('綠')) return 'Green';
if (s.includes('yellow') || s.includes('黃')) return 'Yellow';
if (s.includes('red') || s.includes('紅')) return 'Red';
return 'Invalid';
}
function splitBilingual(text) {
const t = String(text).replace(/\s+/g, ' ').trim();
const m = t.match(/[\u4e00-\u9fff]/);
if (!m) return { en: t, zh: '' };
return { en: t.slice(0, m.index).replace(/\*+/g, '').trim(), zh: t.slice(m.index).trim() };
}
const toNum = (v) => { if (v == null) return null; const s = String(v).trim(); if (s === '') return null; const n = Number(s); return isNaN(n) ? null : n; };
const isAbsentToken = (v) => v != null && /^abs(ent)?$/i.test(String(v).trim());
const fmtPct = (x, d = 1) => (x == null || isNaN(x)) ? '—' : x.toFixed(d) + '%';
const round1 = (x) => Math.round(x * 10) / 10;

/* ------------------------------ DOMAIN CONFIG ---------------------------- */
const AREAS = [
{ key: 'I', roman: 'I', en: 'Heat and Gases', zh: '熱和氣體', color: '#ef4444' },
{ key: 'II', roman: 'II', en: 'Force and Motion', zh: '力和運動', color: '#f59e0b' },
{ key: 'III', roman: 'III', en: 'Wave Motion', zh: '波動', color: '#10b981' },
{ key: 'IV', roman: 'IV', en: 'Electricity and Magnetism', zh: '電和磁', color: '#3b82f6' },
{ key: 'V', roman: 'V', en: 'Radioactivity and Nuclear Energy', zh: '放射現象和核能', color: '#8b5cf6' },
];
const areaById = Object.fromEntries(AREAS.map(a => [a.key, a]));

const TEST_COLUMN_MAP = {
'test projectile motion': { area: 'II', topic: 'Projectile Motion', topicZh: '拋體運動' },
'test circular motion': { area: 'II', topic: 'Circular Motion', topicZh: '圓周運動' },
'test on gas law': { area: 'I', topic: 'Gas Laws', topicZh: '氣體定律' },
'test kinetic theory': { area: 'I', topic: 'Kinetic Theory', topicZh: '分子動理論' },
'test electrostatics': { area: 'IV', topic: 'Electrostatics', topicZh: '靜電學' },
'test circuit': { area: 'IV', topic: 'Electric Circuits', topicZh: '電路' },
'test magnetic field': { area: 'IV', topic: 'Magnetic Field', topicZh: '磁場' },
'test magnetic force': { area: 'IV', topic: 'Magnetic Force', topicZh: '磁力' },
};
const EVIDENCE_TOPIC = { 'test electrostatics': 'Electrostatics', 'test circuit': 'Electric Circuits', 'test magnetic field': 'Magnetic Field' };

// Topic display metadata for the gamified radar (book/chapter labels tied to known sources).
const TOPIC_META = {
'Projectile Motion': { en: 'Projectile Motion', short: 'Projectile', zh: '拋體運動', book: 'Force & Motion', emoji: '🎯' },
'Circular Motion': { en: 'Circular Motion', short: 'Circular', zh: '圓周運動', book: 'Force & Motion', emoji: '🔄' },
'Gas Laws': { en: 'Gas Laws', short: 'Gas Laws', zh: '氣體定律', book: 'Heat & Gases', emoji: '🎈' },
'Kinetic Theory': { en: 'Kinetic Theory', short: 'Kinetic', zh: '分子動理論', book: 'Heat & Gases', emoji: '🌡️' },
'Electrostatics': { en: 'Electrostatics', short: 'Statics', zh: '靜電學', book: 'Book 4 Ch1', emoji: '⚡' },
'Electric Circuits': { en: 'Electric Circuits', short: 'Circuits', zh: '電路', book: 'Book 4 Ch2–4', emoji: '🔌' },
'Magnetic Field': { en: 'Magnetic Field', short: 'Mag. Field', zh: '磁場', book: 'Book 4 Ch5', emoji: '🧲' },
'Magnetic Force': { en: 'Magnetic Force', short: 'Mag. Force', zh: '磁力', book: 'Book 4 Ch5', emoji: '💥' },
};
function topicMeta(topic) { return TOPIC_META[topic] || { en: topic, short: topic, zh: topic, book: '—', emoji: '📘' }; }

// RPG-style mastery tiers.
function tierOf(pct) {
if (pct == null) return { key: 'locked', en: 'Locked', zh: '未解鎖', emoji: '🔒', color: '#94a3b8' };
if (pct >= 85) return { key: 'master', en: 'Master', zh: '大師', emoji: '🏆', color: '#f59e0b' };
if (pct >= 70) return { key: 'expert', en: 'Expert', zh: '專家', emoji: '⭐', color: '#10b981' };
if (pct >= 55) return { key: 'adept', en: 'Adept', zh: '熟練', emoji: '💪', color: '#3b82f6' };
if (pct >= 40) return { key: 'apprentice', en: 'Apprentice', zh: '學徒', emoji: '📖', color: '#8b5cf6' };
return { key: 'novice', en: 'Novice', zh: '新手', emoji: '🌱', color: '#ef4444' };
}

const QKIND = {
electrostatics: { titleEn: 'Book 4 Ch1 Electrostatics — Self-Assessment', titleZh: '第4冊第1章 靜電學 自評問卷', map: () => ({ area: 'IV', topic: 'Electrostatics', evidence: 'test electrostatics' }) },
circuits: { titleEn: 'Book 4 Ch2–4 Circuits — Self-Assessment', titleZh: '第4冊第2-4章 電路 自評問卷', map: () => ({ area: 'IV', topic: 'Electric Circuits', evidence: 'test circuit' }) },
resistance_magnetic: { titleEn: 'Book 4.3 Resistance & Ch5 Magnetic Field — Self-Assessment', titleZh: '第4.3章 電阻 及 第5章 磁場 自評問卷',
map: (i) => i < 5 ? { area: 'IV', topic: 'Electric Circuits / Internal Resistance', evidence: 'test circuit' } : { area: 'IV', topic: 'Magnetic Field', evidence: 'test magnetic field' } },
};

/* ------------------------------ COGNITIVE GAP ---------------------------- */
function diagnose(confidence, actualPct, actualStatus, thresholds) {
const low = thresholds.low, high = thresholds.high;
const hasConf = confidence === 'Green' || confidence === 'Yellow' || confidence === 'Red';
const absent = actualStatus === 'Absent';
const hasActual = typeof actualPct === 'number' && !isNaN(actualPct);
if (!hasConf && !hasActual) return { code: absent ? 'absent' : 'insufficient', rule: 'No usable evidence' };
if (hasConf && !hasActual) return { code: 'confidence_only', rule: absent ? 'Confidence only (latest test absent)' : 'Confidence only (no test evidence)' };
if (!hasConf && hasActual) return { code: 'test_only', rule: 'Test evidence only (no self-assessment)' };
const g = confidence === 'Green', yr = confidence === 'Yellow' || confidence === 'Red';
if (g && actualPct < low) return { code: 'blindspot', rule: `Rule 1 — Green & actual < ${low}%` };
if (yr && actualPct > high) return { code: 'underconf', rule: `Rule 2 — Yellow/Red & actual > ${high}%` };
if (g && actualPct > high) return { code: 'secure', rule: `Rule 3 — Green & actual > ${high}%` };
if (yr && actualPct < low) return { code: 'aware', rule: `Rule 4 — Yellow/Red & actual < ${low}%` };
return { code: 'aligned', rule: 'Rule 5 — Broadly aligned / still developing' };
}
const DIAG_META = {
blindspot: { en: 'Possible overestimation / Hidden blind spot', zh: '可能高估掌握程度／隱藏盲點', tone: 'rose', priority: 'High', icon: Eye, msgEn: 'You felt confident, but the test evidence suggests some hidden blind spots — a great chance to find and fix them.', msgZh: '你對這部分感到有信心，但測驗數據顯示可能仍有一些隱藏盲點，這正是找出並改善它們的好機會。' },
underconf: { en: 'Under-confidence', zh: '低估自己的能力', tone: 'sky', priority: 'Confidence-building', icon: Award, msgEn: 'You are performing better than you think. Your evidence is strong — give yourself more credit.', msgZh: '你的實際表現比想像中更好，測驗數據相當理想，要對自己更有信心。' },
secure: { en: 'Secure and accurately confident', zh: '掌握穩固，自我判斷準確', tone: 'emerald', priority: 'Maintain', icon: CheckCircle2, msgEn: 'Confidence and evidence match well. Keep it up.', msgZh: '信心與數據吻合，繼續保持。' },
aware: { en: 'Student recognises the need for more practice', zh: '學生已察覺需要加強練習', tone: 'amber', priority: 'High', icon: BookOpen, msgEn: 'Your self-awareness is accurate — focused practice here will pay off quickly.', msgZh: '你的自我判斷準確，針對性練習會很快見效。' },
aligned: { en: 'Broadly aligned / still developing', zh: '大致吻合／仍在發展中', tone: 'slate', priority: 'Monitor', icon: Activity, msgEn: 'Confidence and evidence are broadly in line.', msgZh: '信心與數據大致一致。' },
test_only: { en: 'Test evidence only', zh: '只有測驗數據', tone: 'slate', priority: 'Info', icon: FileText, msgEn: 'No self-assessment yet — overconfidence/under-confidence cannot be judged.', msgZh: '尚無自評數據，無法判斷高估或低估。' },
confidence_only: { en: 'Confidence evidence only', zh: '只有自評數據', tone: 'slate', priority: 'Info', icon: ShieldQuestion, msgEn: 'No test evidence yet for this topic.', msgZh: '此課題尚無測驗數據。' },
absent: { en: 'Latest test absent', zh: '最近一次測驗缺席', tone: 'slate', priority: 'Info', icon: AlertTriangle, msgEn: 'Student was absent — no valid score to compare.', msgZh: '學生缺席，沒有有效分數可比較。' },
insufficient: { en: 'Insufficient evidence', zh: '證據不足', tone: 'slate', priority: 'Info', icon: Info, msgEn: 'Neither test nor self-assessment data available.', msgZh: '既無測驗亦無自評數據。' },
};
const toneClass = {
rose: 'bg-rose-50 border-rose-300 text-rose-800', sky: 'bg-sky-50 border-sky-300 text-sky-800',
emerald: 'bg-emerald-50 border-emerald-300 text-emerald-800', amber: 'bg-amber-50 border-amber-300 text-amber-800',
slate: 'bg-slate-50 border-slate-300 text-slate-700',
};
const tlClass = { Green: 'bg-emerald-500', Yellow: 'bg-amber-400', Red: 'bg-rose-500', Unanswered: 'bg-slate-300', Invalid: 'bg-fuchsia-500' };
const tlLabel = { Green: '🟢 Green', Yellow: '🟡 Yellow', Red: '🔴 Red', Unanswered: '⚪ Unanswered', Invalid: '⚠ Invalid' };

/* ------------------------------ SELECTORS -------------------------------- */
function emptyDb() {
return {
meta: { academicYearDefault: '2026/27' },
settings: { diagLow: 60, diagHigh: 70, benchL2: 35, benchL3: 50, benchL4: 65 },
teachingPlan: { I: 'auto', II: 'auto', III: 'Not yet taught', IV: 'auto', V: 'Not yet taught' },
students: [], assessments: [], results: [], questionnaires: [], submissions: [], batches: [],
};
}
const asmtByTopic = (db, topic) => db.assessments.find(a => a.topic === topic);
function computeResultPct(db, r) {
if (r.status !== 'Present' || r.rawScore == null) return null;
const a = db.assessments.find(x => x.id === r.assessmentId);
if (!a || !a.fullMark) return null;
return (r.rawScore / a.fullMark) * 100;
}
function studentResults(db, studentId) { return db.results.filter(r => r.studentId === studentId); }
function areaHasData(db, studentId, areaKey) {
return studentResults(db, studentId).some(r => { const a = db.assessments.find(x => x.id === r.assessmentId); return a && a.area === areaKey; });
}
function areaTeachingStatus(db, studentId, areaKey) {
if (areaHasData(db, studentId, areaKey)) return 'Assessed';
const plan = db.teachingPlan[areaKey];
if (plan && plan !== 'auto') return plan;
return 'No information';
}
function studentAreaStat(db, studentId, areaKey) {
const rs = studentResults(db, studentId).map(r => ({ r, a: db.assessments.find(x => x.id === r.assessmentId) })).filter(x => x.a && x.a.area === areaKey);
const present = rs.filter(x => x.r.status === 'Present' && x.r.rawScore != null);
const absent = rs.filter(x => x.r.status === 'Absent');
const missing = rs.filter(x => x.r.status === 'Missing');
const earned = present.reduce((s, x) => s + x.r.rawScore, 0);
const avail = present.reduce((s, x) => s + (x.a.fullMark || 0), 0);
const pct = avail > 0 ? (earned / avail) * 100 : null;
const status = areaTeachingStatus(db, studentId, areaKey);
const topics = rs.map(x => ({ topic: x.a.topic, pct: computeResultPct(db, x.r), status: x.r.status }));
return { areaKey, pct, status, count: rs.length, presentCount: present.length, absent: absent.length, missing: missing.length, topics };
}
function studentAllStats(db, studentId) { return AREAS.map(a => studentAreaStat(db, studentId, a.key)); }
function studentTopicStats(db, studentId) {
const map = {};
studentResults(db, studentId).forEach(r => {
const a = db.assessments.find(x => x.id === r.assessmentId);
if (!a) return;
if (!map[a.topic]) map[a.topic] = { topic: a.topic, area: a.area, earned: 0, avail: 0, present: 0, total: 0, absent: 0 };
const m = map[a.topic]; m.total++;
if (r.status === 'Present' && r.rawScore != null) { m.earned += r.rawScore; m.avail += a.fullMark || 0; m.present++; }
else if (r.status === 'Absent') m.absent++;
});
return Object.values(map).map(m => ({ ...m, pct: m.avail > 0 ? (m.earned / m.avail) * 100 : null }));
}
function studentCompleteness(db, studentId) {
const rs = studentResults(db, studentId);
if (!rs.length) return null;
const present = rs.filter(r => r.status === 'Present' && r.rawScore != null).length;
return (present / rs.length) * 100;
}
function studentOverall(db, studentId) {
const rs = studentResults(db, studentId).map(r => ({ r, a: db.assessments.find(x => x.id === r.assessmentId) })).filter(x => x.a && x.r.status === 'Present' && x.r.rawScore != null);
if (!rs.length) return null;
const earned = rs.reduce((s, x) => s + x.r.rawScore, 0);
const avail = rs.reduce((s, x) => s + (x.a.fullMark || 0), 0);
return avail > 0 ? (earned / avail) * 100 : null;
}
function studentPowerLevel(db, studentId) {
const ts = studentTopicStats(db, studentId).filter(t => t.pct != null);
if (!ts.length) return null;
return Math.round(ts.reduce((s, t) => s + t.pct, 0) / ts.length);
}
function activeSubmission(db, questionnaireId, studentId) {
const subs = db.submissions.filter(s => s.questionnaireId === questionnaireId && s.studentId === studentId);
if (!subs.length) return null;
return subs.find(s => s.active) || subs[0];
}
function questionnairesForStudent(db, studentId) {
const ids = new Set(db.submissions.filter(s => s.studentId === studentId).map(s => s.questionnaireId));
return db.questionnaires.filter(q => ids.has(q.id));
}
function conceptEvidence(db, studentId, concept) {
const topic = EVIDENCE_TOPIC[concept.evidence] || concept.topic;
const a = asmtByTopic(db, topic);
if (!a) return { pct: null, status: null, raw: null, full: null, topic, hasAsmt: false };
const r = db.results.find(x => x.studentId === studentId && x.assessmentId === a.id);
if (!r) return { pct: null, status: 'Missing', raw: null, full: a.fullMark, topic, hasAsmt: true };
return { pct: computeResultPct(db, r), status: r.status, raw: r.rawScore, full: a.fullMark, topic, hasAsmt: true };
}
function studentDiagnoses(db, studentId) {
const out = [];
for (const q of questionnairesForStudent(db, studentId)) {
const sub = activeSubmission(db, q.id, studentId);
if (!sub) continue;
const group = db.submissions.filter(s => s.questionnaireId === q.id && s.studentId === studentId);
const conflict = new Set(group.map(s => s.hash)).size > 1;
for (const c of q.concepts) {
const conf = sub.answers[c.id] || 'Unanswered';
const ev = conceptEvidence(db, studentId, c);
const d = diagnose(conf, ev.pct, ev.status, { low: db.settings.diagLow, high: db.settings.diagHigh });
out.push({ questionnaireId: q.id, qEn: q.titleEn, qZh: q.titleZh, conceptEn: c.en, conceptZh: c.zh, area: c.area, topic: c.topic,
confidence: conf, actualPct: ev.pct, actualStatus: ev.status, raw: ev.raw, full: ev.full, evidenceTopic: ev.topic,
evidenceLevel: ev.hasAsmt ? 'Chapter-level proxy' : 'None', ...d, meta: DIAG_META[d.code], conflict });
}
}
return out;
}
function generateSuggestions(db, studentId) {
const stats = studentAllStats(db, studentId);
const topics = studentTopicStats(db, studentId);
const diags = studentDiagnoses(db, studentId);
const out = [], seen = new Set();
diags.filter(d => d.code === 'blindspot').forEach(d => {
const k = 'blind::' + d.topic; if (seen.has(k)) return; seen.add(k);
out.push({ priority: 1, tone: 'rose', icon: Eye,
en: `Re-check "${d.conceptEn}". You felt confident, but the ${d.evidenceTopic} evidence (${fmtPct(d.actualPct)}) points to a hidden blind spot — redo worked examples then one exam question.`,
zh: `重溫「${d.conceptZh}」。你有信心，但${d.evidenceTopic}的數據（${fmtPct(d.actualPct)}）顯示可能有隱藏盲點 — 先重做例題，再做一條試題。` });
});
diags.filter(d => d.code === 'aware').forEach(d => {
const k = 'aware::' + d.topic; if (seen.has(k)) return; seen.add(k);
out.push({ priority: 2, tone: 'amber', icon: BookOpen,
en: `Targeted practice on "${d.conceptEn}". Your self-awareness is accurate (${fmtPct(d.actualPct)}); short daily drills will lift this fast.`,
zh: `針對「${d.conceptZh}」加強練習。你的自我判斷準確（${fmtPct(d.actualPct)}），每日短練習可快速提升。` });
});
topics.filter(t => t.pct != null && t.pct < 50).forEach(t => {
const k = 'low::' + t.topic; if (seen.has(k)) return; seen.add(k);
const m = topicMeta(t.topic);
out.push({ priority: 2, tone: 'rose', icon: Target,
en: `Rebuild fundamentals in ${m.en} (${fmtPct(t.pct)}). Start from definitions and basic equations before exam-level questions.`,
zh: `重建${m.zh}的基礎（${fmtPct(t.pct)}）。先由定義與基本方程開始，再挑戰試題程度。` });
});
diags.filter(d => d.code === 'underconf').forEach(d => {
const k = 'under::' + d.topic; if (seen.has(k)) return; seen.add(k);
out.push({ priority: 3, tone: 'sky', icon: Award,
en: `Build confidence in "${d.conceptEn}". Your evidence is strong (${fmtPct(d.actualPct)}) — attempt harder past-paper questions to prove it to yourself.`,
zh: `建立「${d.conceptZh}」的信心。你的數據理想（${fmtPct(d.actualPct)}），可挑戰較難的歷屆試題證明自己。` });
});
stats.filter(s => s.pct != null && s.pct >= 70).forEach(s => {
const a = areaById[s.areaKey];
out.push({ priority: 4, tone: 'emerald', icon: Trophy,
en: `Maintain your strength in ${a.en} (${fmtPct(s.pct)}) — use it as an anchor and attempt stretch/challenge problems.`,
zh: `保持${a.zh}的優勢（${fmtPct(s.pct)}）— 以此為根基，嘗試挑戰題。` });
});
const hasQ = db.submissions.some(x => x.studentId === studentId);
if (db.questionnaires.length && !hasQ) out.push({ priority: 3, tone: 'slate', icon: ShieldQuestion, en: 'Complete the self-assessment questionnaire so your confidence can be compared with your results.', zh: '完成自評問卷，讓系統可將你的信心與成績作比較。' });
if (studentResults(db, studentId).some(r => r.status === 'Absent')) out.push({ priority: 3, tone: 'slate', icon: AlertTriangle, en: 'Arrange a make-up for any absent test so your profile is complete and fair.', zh: '為缺席的測驗安排補考，令你的學習檔案更完整公平。' });
out.sort((a, b) => a.priority - b.priority);
return out.slice(0, 10);
}

/* ------------------------------ IMPORT ENGINE ---------------------------- */
function previewTestResults(csvText, opts) {
const rows = parseCSV(csvText);
if (!rows.length) return { error: 'Empty file' };
const header = rows[0].map(h => h.trim());
const idxSID = header.findIndex(h => /^sid$/i.test(h));
const idxClass = header.findIndex(h => /^class$/i.test(h));
const idxNum = header.findIndex(h => /^number$/i.test(h) || /^no$/i.test(h));
const idCols = new Set([idxSID, idxClass, idxNum].filter(i => i >= 0));
const asmtCols = header.map((h, i) => ({ h, i })).filter(x => !idCols.has(x.i) && x.h !== '');
const students = [], summaryRows = [], warnings = [];
const colMax = {}; asmtCols.forEach(c => (colMax[c.i] = -Infinity));
for (let r = 1; r < rows.length; r++) {
const row = rows[r];
const sid = (row[idxSID] || '').trim(), cls = (row[idxClass] || '').trim(), num = (row[idxNum] || '').trim();
asmtCols.forEach(c => { const v = toNum(row[c.i]); if (v != null && v > colMax[c.i]) colMax[c.i] = v; });
const isStudent = (cls !== '' && num !== '') || sid !== '';
if (!isStudent) { summaryRows.push(row); continue; }
const canon = canonicalClassNumber(cls && num ? `${cls}${num}` : sid);
if (!canon) { warnings.push(`Row ${r + 1}: cannot derive class/number (SID=${sid}, Class=${cls}, Number=${num}) — skipped`); continue; }
students.push({ sid, cls: canon.cls, number: canon.number, canonical: canon.canonical, cells: asmtCols.map(c => ({ colIdx: c.i, raw: row[c.i] })) });
}
const columns = asmtCols.map(c => {
const key = c.h.toLowerCase().trim();
const map = TEST_COLUMN_MAP[key] || { area: 'I', topic: c.h };
return { header: c.h, colIdx: c.i, area: map.area, topic: map.topic, topicZh: map.topicZh || '', fullMark: colMax[c.i] === -Infinity ? null : colMax[c.i] };
});
return { type: 'test', header, columns, students, summaryRows, warnings, opts };
}
function commitTestResults(db, preview) {
const draft = structuredClone(db);
const batchId = uid();
const report = { newStudents: 0, matched: 0, newAssessments: 0, existingAssessments: 0, newResults: 0, updatedResults: 0, unchangedResults: 0, conflicts: 0, warnings: [...(preview.warnings || [])] };
const { academicYear, cohort, sourceFile } = preview.opts;
const colToAsmt = {};
for (const col of preview.columns) {
const name = col.header;
const key = `${academicYear}||Chapter Test||${cohort}||${col.topic}||${name}`;
let a = draft.assessments.find(x => x._key === key);
if (!a) { a = { id: uid(), _key: key, academicYear, date: null, name, type: 'Chapter Test', area: col.area, topic: col.topic, topicZh: col.topicZh, fullMark: col.fullMark, weight: 1, sourceFile, batchId }; draft.assessments.push(a); report.newAssessments++; }
else { report.existingAssessments++; if (col.fullMark != null) a.fullMark = col.fullMark; }
colToAsmt[col.colIdx] = a.id;
}
for (const st of preview.students) {
let student = draft.students.find(s => s.sid && s.sid === st.sid);
if (!student && !st.sid) student = draft.students.find(s => s.aliases.some(al => al.academicYear === academicYear && al.canonical === st.canonical));
if (!student) { student = { id: uid(), sid: st.sid || null, name: null, cohort, currentClass: st.cls, currentNumber: st.number, targetGrade: null, notes: '', createdAt: Date.now(), updatedAt: Date.now(), aliases: [{ academicYear, form: '5', class: st.cls, number: st.number, canonical: st.canonical }] }; draft.students.push(student); report.newStudents++; }
else { report.matched++; if (!student.aliases.some(al => al.academicYear === academicYear && al.canonical === st.canonical)) student.aliases.push({ academicYear, form: '5', class: st.cls, number: st.number, canonical: st.canonical }); }
for (const cell of st.cells) {
const aId = colToAsmt[cell.colIdx];
let status = 'Present', raw = null;
if (isAbsentToken(cell.raw)) status = 'Absent';
else if (cell.raw == null || String(cell.raw).trim() === '') status = 'Missing';
else { raw = toNum(cell.raw); if (raw == null) { status = 'Missing'; report.warnings.push(`${student.sid || st.canonical}: invalid value "${cell.raw}"`); } }
const existing = draft.results.find(r => r.studentId === student.id && r.assessmentId === aId);
if (!existing) { draft.results.push({ id: uid(), studentId: student.id, assessmentId: aId, rawScore: raw, status, versions: [], batchId }); report.newResults++; }
else if (existing.rawScore === raw && existing.status === status) report.unchangedResults++;
else { existing.versions.push({ rawScore: existing.rawScore, status: existing.status, at: Date.now(), batchId: existing.batchId }); existing.rawScore = raw; existing.status = status; existing.batchId = batchId; report.updatedResults++; }
}
}
draft.batches.push({ id: batchId, filename: sourceFile, fileType: 'test', academicYear, at: Date.now(), ...report });
return { draft, report, batchId };
}
function buildQuestionnaireCSV(conceptHeaders, dataRows) {
const codeMap = { G: 'Green Light', Y: 'Yellow Light', R: 'Red Light', '': '' };
const header = ['你的班別學號 (e.g. 5S46)', ...conceptHeaders.map(c => `${c.en}${c.zh}`)];
const rows = [header, ...dataRows.map(([id, ...codes]) => [id, ...codes.map(c => codeMap[c] ?? c)])];
return toCSV(rows);
}
function previewQuestionnaire(csvText, opts) {
const rows = parseCSV(csvText);
if (rows.length < 2) return { error: 'Empty questionnaire' };
const header = rows[0];
const conceptHeaders = header.slice(1).map((h, i) => { const { en, zh } = splitBilingual(h); const m = QKIND[opts.kind].map(i); return { id: 'c' + i, index: i, en: en || `Concept ${i + 1}`, zh, area: m.area, topic: m.topic, evidence: m.evidence }; });
const submissions = [];
for (let r = 1; r < rows.length; r++) {
const row = rows[r]; const idRaw = (row[0] || '').trim();
if (idRaw === '') continue;
const canon = canonicalClassNumber(idRaw);
const answers = {}; conceptHeaders.forEach(c => { answers[c.id] = normalizeTrafficLight(row[c.index + 1]); });
const hash = conceptHeaders.map(c => answers[c.id][0]).join('');
submissions.push({ idRaw, canonical: canon ? canon.canonical : null, answers, hash, sourceRow: r + 1 });
}
return { type: 'questionnaire', kind: opts.kind, conceptHeaders, submissions, opts, warnings: [] };
}
function commitQuestionnaire(db, preview) {
const draft = structuredClone(db);
const batchId = uid();
const { academicYear, cohort, sourceFile, kind } = preview.opts;
const report = { newStudents: 0, matched: 0, added: 0, deduped: 0, conflicts: 0, unmatched: 0, warnings: [] };
const key = `${academicYear}||${kind}`;
let q = draft.questionnaires.find(x => x._key === key);
if (!q) { q = { id: uid(), _key: key, academicYear, kind, titleEn: QKIND[kind].titleEn, titleZh: QKIND[kind].titleZh, sourceFile, concepts: preview.conceptHeaders.map(c => ({ ...c })) }; draft.questionnaires.push(q); }
for (const s of preview.submissions) {
const cands = draft.students.filter(st => st.aliases.some(al => al.academicYear === academicYear && al.canonical === s.canonical));
if (cands.length === 0) { report.unmatched++; report.warnings.push(`No student matches ${s.idRaw} (${s.canonical || 'unparseable'}) — submission held back`); continue; }
if (cands.length > 1) { report.conflicts++; report.warnings.push(`Ambiguous match for ${s.idRaw} — needs teacher resolution`); continue; }
const student = cands[0]; report.matched++;
const group = draft.submissions.filter(x => x.questionnaireId === q.id && x.studentId === student.id);
if (group.some(x => x.hash === s.hash)) { report.deduped++; continue; }
const active = group.length === 0;
draft.submissions.push({ id: uid(), questionnaireId: q.id, studentId: student.id, canonical: s.canonical, answers: s.answers, hash: s.hash, sourceRow: s.sourceRow, batchId, active, at: Date.now() });
if (group.length >= 1) report.conflicts++;
report.added++;
}
draft.batches.push({ id: batchId, filename: sourceFile, fileType: 'questionnaire', academicYear, at: Date.now(), ...report });
return { draft, report, batchId };
}
function rollbackBatch(db, batchId) {
const draft = structuredClone(db);
draft.results = draft.results.filter(r => {
if (r.batchId !== batchId) return true;
if (r.versions.length) { const last = r.versions.pop(); r.rawScore = last.rawScore; r.status = last.status; r.batchId = last.batchId; return true; }
return false;
});
const asmtIds = draft.assessments.filter(a => a.batchId === batchId).map(a => a.id);
draft.assessments = draft.assessments.filter(a => a.batchId !== batchId);
draft.results = draft.results.filter(r => !asmtIds.includes(r.assessmentId));
draft.submissions = draft.submissions.filter(s => s.batchId !== batchId);
draft.batches = draft.batches.filter(b => b.id !== batchId);
return draft;
}

/* ------------------------------ SAMPLE DATA ------------------------------ */
const SAMPLE_TEST_CSV = `SID,Class,Number,test projectile motion,Test circular motion,test on gas law,test kinetic theory,test electrostatics, test circuit,Test magnetic field,Test magnetic force
20265S01,5A,18,23.5,22,10,11,17,24.5,27,18.5
20265S02,5S,1,10.5,abs,17,10,16,20,16,16
20265S03,5S,2,12.5,11.5,12,6,16,16,14,10
20265S04,5S,3,26,20,16.5,12,21,18,25,14
20265S05,5S,4,20.5,17,13,9,5.5,13.5,17,11.5
20265S06,5S,5,27.5,17,16.5,9,19.5,24.5,24,16
20265S07,5S,6,21.5,14.5,6,11,14,19.5,22,13.5
20265S08,5S,7,22,17.5,15.5,14,15,22,27,18
20265S09,5S,8,abs,10.5,12,9,10,10.5,5,3
20265S10,5S,9,12,17.5,17.5,9,15,19,26,14.5
20265S11,5S,10,22,22,18.5,15,23.5,20.5,25,18
20265S12,5S,12,21,13,10,15,16,19.5,24,11
20265S13,5S,13,22,24,18.5,13,16.5,23.5,15,16.5
20265S14,5S,14,8.5,18,12,8,14,15.5,13,9.5
20265S15,5S,15,23,18.5,16.5,15,27.5,25,26,abs
20265S16,5S,17,22.5,24,15.5,8,18.5,22,24,17.5
20265S17,5S,19,25.5,24,18,14,26,24.5,30,20.5
20265S18,5S,20,19,13,13.5,10,10.5,22.5,24,15
20265S19,5S,21,12.5,14.5,14.5,14,15,19,24,15.5
20265S20,5S,22,abs,22.5,15,12,13.5,17,12,13.5
20265S21,5S,23,4.5,4.5,12.5,9,9.5,15.5,11,7
20265S22,5S,24,21,19,11.5,10,18.5,23,28,20
20265S23,5S,25,21,12,13.5,9,16.5,16,27,10
20265S24,5S,26,25.5,21,21.5,15,18,22,28,17
20265S25,5S,27,27.5,26.5,11.5,14,21,21,28,15
20265S26,5S,28,16,8,13,6,18.5,23,27,9
20265S27,5S,29,16.5,20.5,14.5,14,22.5,24,28,17
20265S28,5S,30,25,16.5,8,13,20.5,17,25,16
20265S29,5S,32,abs,24,22.5,11,19,26.5,30,23.5
20265S30,5S,33,abs,abs,abs,abs,abs,abs,abs,abs
20265S31,5S,35,19.5,13.5,7.5,11,15.5,20.5,29,abs
,,,,,,,,,,
,,,29,29,24,16,29,28,30,27
,,,19.57407407,17.46551724,14.13333333,11.2,16.98333333,20.16666667,22.7,14.51785714
,,,27.5,26.5,22.5,15,27.5,26.5,30,23.5
,,,4.5,4.5,6,6,5.5,10.5,5,3
,,,0.777777778,0.7,0.766666667,0.933333333,23,28,25,20`;

const ELEC_CONCEPTS = [
{ en: 'I understand the 3 charging methods and they all relate to transfer of electrons.', zh: '我了解3種充電方法，它們都與電子的轉移有關。' },
{ en: 'I can determine whether an object becomes positively/negatively charged or neutral.', zh: '我可以確定物體在不同情況下是否帶正電、帶負電或中性。' },
{ en: 'I understand how earthing helps an insulated metal sphere become charged.', zh: '我了解接地如何有助於使受絕緣的金屬球帶電。' },
{ en: "I can apply Coulomb's law to find electrostatic force between charges.", zh: '我可以應用庫侖定律找到不同情況下電荷之間的靜電力。' },
{ en: 'I understand the electric field and the relation F = qE.', zh: '我了解電場的概念以及電力和電場之間的關係（F = qE）。' },
{ en: 'I can find the electric field created by a point charge.', zh: '我可以應用方程式查找點電荷產生的電場。' },
{ en: 'I understand why the field between parallel plates is uniform and can solve problems.', zh: '我明白為什麼平行板內的電場是均勻的，並應用方程式解決相關問題。' },
{ en: 'I can combine F=qE with equations of motion to solve motion of a charge in a field.', zh: '我可以應用F=qE與運動方程式解決電場下電荷的運動問題。' },
];
const ELEC_ROWS = [
['5S 22', 'Y','Y','Y','Y','Y','Y','Y','Y'],['5S 25','Y','G','R','G','Y','G','Y','Y'],
['5s03','R','Y','Y','Y','Y','Y','Y','Y'],['5S10','G','Y','Y','G','G','G','G','Y'],
['5S04','G','G','G','R','Y','Y','Y','Y'],['5S06','G','R','Y','G','Y','R','Y','Y'],
['5A18','Y','Y','Y','G','G','G','G','G'],['5S30','Y','G','Y','Y','Y','Y','Y','Y'],
['5S02','G','G','Y','G','G','G','R','Y'],['5S01','Y','Y','G','G','G','Y','G','R'],
['5S30','Y','G','Y','Y','Y','Y','Y','Y'],['5S12','G','G','G','G','G','G','G','G'],
['5s17','G','G','G','G','G','G','Y','G'],['5S04','Y','G','G','Y','R','R','Y','R'],
['5s13','Y','G','G','Y','G','Y','Y','Y'],['5s03','Y','G','G','Y','R','R','Y','Y'],
['5S07','G','G','G','Y','Y','Y','Y','Y'],['5s23','Y','Y','Y','Y','Y','Y','Y','Y'],
['5S32','G','G','G','Y','Y','G','G','Y'],['5s35','R','Y','Y','Y','Y','Y','Y','Y'],
['5S24','Y','Y','Y','G','G','G','G','Y'],['5S20','Y','Y','G','R','Y','Y','R','Y'],
['5S15','','G','G','G','G','G','G','G'],['5S26','Y','G','Y','R','Y','Y','Y','Y'],
['5S29','Y','Y','Y','G','G','G','G','G'],
];
const CIRC_CONCEPTS = [
{ en: 'I can draw circuit diagrams of all DSE circuit symbols.', zh: '我知道如何在DSE中繪製所有電路符號的電路圖。' },
{ en: 'I understand the difference between series & parallel circuits.', zh: '我了解串聯電路和並聯電路之間的差異。' },
{ en: 'I understand the meaning of current and can find it by definition.', zh: '我明白電流的意義，可以根據定義找到電流的大小。' },
{ en: 'I understand the meaning of voltage and can find it by definition.', zh: '我明白電壓的含義，可以根據定義找到電壓的大小。' },
{ en: 'Current is same everywhere; main V = sum of Vs in series.', zh: '串聯電路中各處電流相同，主電壓為各電壓之和。' },
{ en: 'Voltage is same everywhere; main I = sum of branch Is in parallel.', zh: '並聯電路中各處電壓相同，主電流為各支路電流之和。' },
{ en: "I can apply Ohm's law and understand its experiment.", zh: '我可以應用歐姆定律找到電阻並理解其實驗。' },
{ en: 'I can combine resistances in series.', zh: '我了解如何組合串聯電阻求等效電阻。' },
{ en: 'I can combine resistances in parallel.', zh: '我了解如何並聯組合電阻求等效電阻。' },
{ en: 'I can use the colouring method for complex resistor networks.', zh: '我可以應用著色方法求複雜電阻網路的等效電阻。' },
{ en: 'I can find resistance of a wire from length & area.', zh: '我知道如何由長度與面積求電線的電阻。' },
{ en: 'I can relate power to voltage & current.', zh: '我知道如何將功率與電壓、電流連結。' },
{ en: 'I know which power equation to use in series circuits.', zh: '我知道串聯電路採用哪個功率方程。' },
{ en: 'I know which power equation to use in parallel circuits.', zh: '我知道並聯電路採用哪個功率方程。' },
{ en: 'I can convert between kWh and Joule.', zh: '我知道如何在 kWh 與焦耳之間換算。' },
{ en: 'I understand the uses of live, neutral & earth wires (HK).', zh: '我了解香港三線（火線、零線、地線）的用途。' },
{ en: 'I understand what happens if the 3 wires are mixed up.', zh: '我明白三線接錯會發生什麼。' },
];
const CIRC_ROWS = [
['5S25','G','G','G','G','Y','Y','G','Y','Y','G','G','R','G','Y','Y','G','G'],
['5S32','Y','G','Y','G','G','G','G','Y','Y','Y','Y','Y','Y','Y','Y','G','Y'],
['5S07','G','G','G','G','G','G','G','Y','Y','Y','Y','Y','Y','Y','G','G','Y'],
['5S01','Y','G','Y','Y','G','G','G','G','G','R','Y','G','G','G','G','Y','Y'],
['5s17','G','G','G','G','G','G','G','G','G','G','G','G','G','G','G','G','G'],
['5S12','G','G','G','G','G','G','G','G','G','Y','G','G','G','G','G','G','G'],
['5s03','R','R','R','R','R','R','R','R','R','R','G','R','R','Y','G','Y','Y'],
['5S21','G','G','Y','Y','G','G','Y','Y','G','R','G','Y','G','Y','G','G','G'],
['5S09','Y','G','Y','Y','G','G','Y','G','G','Y','Y','Y','G','G','Y','Y','Y'],
['5S23','Y','Y','Y','Y','Y','R','R','R','R','R','R','R','R','R','R','R','Y'],
['5S19','G','G','G','G','G','G','G','G','G','G','G','G','G','G','G','G','G'],
['5s13','Y','G','Y','Y','G','G','Y','Y','G','Y','G','Y','Y','Y','G','Y','G'],
['5A18','G','G','G','G','G','G','G','G','G','G','G','G','G','G','G','Y','Y'],
['5S04','Y','Y','R','R','R','Y','G','R','Y','Y','G','Y','Y','Y','G','G','G'],
['5S22','G','G','R','Y','Y','R','Y','Y','Y','R','Y','Y','Y','Y','G','G','G'],
['5S 25','G','Y','G','Y','Y','Y','G','G','G','Y','G','R','G','G','Y','Y','R'],
['5S05','G','G','G','G','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y'],
['5S30','Y','G','Y','Y','G','G','Y','G','G','G','G','G','Y','Y','Y','Y','Y'],
['5S26','G','G','G','G','G','G','G','Y','Y','Y','G','Y','Y','Y','Y','G','Y'],
['5S10','G','G','G','G','G','G','G','G','G','Y','Y','Y','Y','Y','Y','G','Y'],
['5S02','G','G','G','G','Y','Y','G','G','G','G','G','Y','Y','Y','G','G','Y'],
['5s35','Y','G','Y','Y','G','G','Y','G','G','Y','Y','G','R','R','G','G','Y'],
['5S20','G','G','G','G','G','G','G','G','G','Y','R','G','Y','Y','Y','G','G'],
['5S24','Y','G','G','G','G','G','G','G','G','R','G','Y','G','G','G','G','R'],
['5S06','R','G','Y','Y','G','G','G','G','G','Y','Y','Y','G','G','G','G','G'],
['5S14','G','G','Y','Y','G','G','Y','G','G','G','Y','Y','Y','Y','Y','G','G'],
['5S15','Y','G','G','G','G','G','Y','G','G','G','G','G','G','G','G','G','Y'],
['5S27','G','G','G','G','G','G','G','G','G','G','G','Y','G','G','G','G','Y'],
['5S29','G','G','G','G','G','G','G','G','G','G','G','G','G','G','Y','G','Y'],
];
const RESMAG_CONCEPTS = [
{ en: 'Ammeter resistance ~0 so it does not lower the current.', zh: '我知道電流表電阻接近零，不會降低電路中的電流。' },
{ en: 'Voltmeter resistance ~infinite so no current passes through it.', zh: '我知道電壓表電阻接近無限大，電流不通過。' },
{ en: 'I can determine voltmeter/ammeter connection from measured R.', zh: '我可以由被測電阻大小判斷電壓表和電流表的連接。' },
{ en: 'Internal resistance uses part of the voltage before other components.', zh: '我理解電池內阻在輸送到其他元件前已消耗部分電壓。' },
{ en: 'I can solve problems with internal resistance & terminal voltage.', zh: '我可以解決含內阻的問題並求端電壓。' },
{ en: 'I can use bar-magnet properties to judge attraction/repulsion.', zh: '我可以利用條形磁鐵特性判斷吸引或排斥。' },
{ en: 'I understand the magnetic field of a bar magnet.', zh: '我理解條形磁鐵的磁場特性。' },
{ en: 'I can handle 3-D views (current out of / into paper).', zh: '我可以處理三維視圖，例如電流出紙或入紙。' },
{ en: 'I understand the magnetic field of a straight-line current.', zh: '我理解直線電流產生的磁場。' },
{ en: 'I can apply the right-hand grip rule for a straight-line current.', zh: '我可以用右手定則判斷直線電流的磁場方向。' },
{ en: 'I can find the size of a straight-line current field.', zh: '我可以求直線電流產生的磁場大小。' },
{ en: 'I can apply the right-hand grip rule for solenoid poles.', zh: '我能用右手定則判斷螺線管的磁極。' },
{ en: 'I can find the field inside a solenoid.', zh: '我可以求螺線管內部的磁場大小。' },
];
const RESMAG_ROWS = [
['5S17','G','G','G','G','G','G','G','G','G','G','G','G','G'],
['5S19','G','G','G','G','G','G','G','G','G','G','G','G','G'],
['5S15','G','G','Y','G','G','G','G','G','G','G','G','G','G'],
['5s03','G','G','R','G','Y','Y','Y','Y','Y','Y','Y','Y','Y'],
['5S24','G','G','Y','G','G','G','G','G','G','G','G','G','G'],
['5S32','Y','Y','Y','Y','Y','Y','Y','G','G','G','G','G','G'],
['5S04','Y','G','Y','G','R','G','Y','G','G','Y','Y','Y','R'],
['5S05','G','G','Y','G','Y','G','Y','Y','Y','Y','Y','Y','Y'],
['5s23','G','G','G','G','Y','Y','Y','Y','Y','Y','Y','Y','Y'],
['5S20','G','G','G','G','G','G','G','G','G','G','Y','G','Y'],
['5s28','G','G','Y','G','Y','Y','G','Y','Y','Y','G','G','Y'],
['5S12','G','G','G','G','G','G','G','G','G','G','Y','G','Y'],
['5S26','G','G','Y','G','Y','G','G','G','G','G','G','G','Y'],
['5s35','Y','Y','R','Y','Y','Y','Y','G','G','G','Y','Y','Y'],
['5S07','G','G','Y','G','Y','Y','G','G','G','G','G','G','G'],
['5S30','Y','Y','Y','Y','Y','G','G','G','G','G','G','G','G'],
['5A18','G','G','G','G','G','G','G','G','G','G','G','G','Y'],
['5s13','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y'],
['5S 22','G','G','Y','Y','Y','G','Y','R','Y','Y','Y','R','R'],
['5S09','G','G','Y','R','Y','Y','G','Y','G','G','Y','Y','R'],
['5S25','G','G','Y','Y','Y','G','G','G','Y','G','Y','Y','G'],
['5S06','G','G','Y','G','Y','G','G','Y','G','Y','G','G','G'],
['5S01','G','G','Y','G','Y','G','G','G','G','G','G','G','Y'],
['5S02','G','G','G','G','G','G','G','G','G','G','Y','G','Y'],
['5S27','G','G','G','G','Y','G','G','G','G','G','G','G','Y'],
['5S21','G','Y','G','Y','Y','G','G','Y','G','Y','G','Y','G'],
['5S14','G','G','G','Y','Y','G','Y','G','G','G','G','Y','G'],
['5S10','G','G','Y','G','G','G','G','Y','G','G','G','G','G'],
];
function importSampleAll(startDb) {
let db = startDb; const ay = '2026/27', cohort = '5S 2026/27';
db = commitTestResults(db, previewTestResults(SAMPLE_TEST_CSV, { academicYear: ay, cohort, sourceFile: '5S Ch test result_updated.csv' })).draft;
db = commitQuestionnaire(db, previewQuestionnaire(buildQuestionnaireCSV(ELEC_CONCEPTS, ELEC_ROWS), { kind: 'electrostatics', academicYear: ay, cohort, sourceFile: 'F5 Physics (Book 4 Ch1) Electrostatics Self-Assessment.csv' })).draft;
db = commitQuestionnaire(db, previewQuestionnaire(buildQuestionnaireCSV(CIRC_CONCEPTS, CIRC_ROWS), { kind: 'circuits', academicYear: ay, cohort, sourceFile: 'F5 Physics (Book 4 Ch 2-4) Self-Assessment.csv' })).draft;
db = commitQuestionnaire(db, previewQuestionnaire(buildQuestionnaireCSV(RESMAG_CONCEPTS, RESMAG_ROWS), { kind: 'resistance_magnetic', academicYear: ay, cohort, sourceFile: 'F5 Physics (Book 4.3 Resistance & Ch5 Magnetic field) Self-Assessment.csv' })).draft;
return db;
}

/* ------------------------------ ACCEPTANCE TESTS ------------------------- */
function runAcceptanceTests() {
const tests = []; const add = (name, pass, detail) => tests.push({ name, pass: !!pass, detail });
const c = (s) => { const x = canonicalClassNumber(s); return x ? x.canonical : null; };
add('1. 5s17 == 5S17', c('5s17') === c('5S17') && c('5s17') === '5S17', c('5s17'));
add('2. "5S 22" == 5S22', c('5S 22') === c('5S22') && c('5S22') === '5S22', c('5S 22'));
add('3. "5s35\\n" -> 5S35', c('5s35\n') === '5S35', c('5s35\n'));
let db = importSampleAll(emptyDb());
const byCanon = (canon) => db.students.find(s => s.aliases.some(a => a.canonical === canon));
const s30 = byCanon('5S30'), s5A18 = byCanon('5A18'), s25 = byCanon('5S25');
add('4. 5S25 & "5S 25" -> one profile', s25 && db.students.filter(s => s.aliases.some(a => a.canonical === '5S25')).length === 1, s25 ? s25.sid : 'none');
add('5. 5S30 -> SID 20265S28', s30 && s30.sid === '20265S28', s30 && s30.sid);
add('6. 5S30 != SID 20265S30', s30 && s30.sid !== '20265S30', s30 && s30.sid);
add('7. 5A18 -> SID 20265S01', s5A18 && s5A18.sid === '20265S01', s5A18 && s5A18.sid);
const testOnly = commitTestResults(emptyDb(), previewTestResults(SAMPLE_TEST_CSV, { academicYear: '2026/27', cohort: 'X', sourceFile: 't.csv' })).draft;
add('8. Summary rows not imported (31 students)', testOnly.students.length === 31, `count=${testOnly.students.length}`);
const s5S1 = testOnly.students.find(s => s.aliases.some(a => a.canonical === '5S01'));
const circA = testOnly.assessments.find(a => a.topic === 'Circular Motion');
const rAbs = testOnly.results.find(r => r.studentId === s5S1.id && r.assessmentId === circA.id);
add('9. "abs" -> Absent (not 0)', rAbs.status === 'Absent' && rAbs.rawScore === null, rAbs.status);
const elecQ = db.questionnaires.find(q => q.kind === 'electrostatics');
const s15 = byCanon('5S15'); const s15sub = activeSubmission(db, elecQ.id, s15.id);
add('10. Blank answer -> Unanswered', s15sub && s15sub.answers['c0'] === 'Unanswered', s15sub && s15sub.answers['c0']);
const s30elecSubs = db.submissions.filter(x => x.questionnaireId === elecQ.id && x.studentId === s30.id);
add('11. Identical duplicate 5S30 deduped', s30elecSubs.length === 1, `subs=${s30elecSubs.length}`);
const s04 = byCanon('5S04'); const s04elecSubs = db.submissions.filter(x => x.questionnaireId === elecQ.id && x.studentId === s04.id);
add('12. Conflicting 5S04 preserved+flagged', s04elecSubs.length === 2 && new Set(s04elecSubs.map(x => x.hash)).size === 2, `subs=${s04elecSubs.length}`);
add('13. Area III not shown as 0%', studentAreaStat(db, s30.id, 'III').pct === null, `pct=${studentAreaStat(db, s30.id, 'III').pct}`);
add('14. Area III/V "Not yet taught"', areaTeachingStatus(db, s30.id, 'III') === 'Not yet taught' && areaTeachingStatus(db, s30.id, 'V') === 'Not yet taught', `III=${areaTeachingStatus(db, s30.id, 'III')}`);
const reimport = commitTestResults(db, previewTestResults(SAMPLE_TEST_CSV, { academicYear: '2026/27', cohort: '5S 2026/27', sourceFile: '5S Ch test result_updated.csv' })).draft;
add('15. Re-upload -> no duplicate assessments (8)', reimport.assessments.length === db.assessments.length && db.assessments.length === 8, `asmts=${reimport.assessments.length}`);
const modified = SAMPLE_TEST_CSV.replace('20265S01,5A,18,23.5,22,10,11,17,24.5,27,18.5', '20265S01,5A,18,23.5,22,10,11,19,24.5,27,18.5');
const corrected = commitTestResults(db, previewTestResults(modified, { academicYear: '2026/27', cohort: '5S 2026/27', sourceFile: '5S Ch test result_updated.csv' })).draft;
const elecAsmt = corrected.assessments.find(a => a.topic === 'Electrostatics');
const rCorr = corrected.results.find(r => r.studentId === s5A18.id && r.assessmentId === elecAsmt.id);
add('16. Corrected value keeps version history', rCorr.rawScore === 19 && rCorr.versions.length >= 1 && rCorr.versions[0].rawScore === 17, `now=${rCorr.rawScore}, versions=${rCorr.versions.length}`);
add('17. Names never invented', db.students.every(s => s.name === null), 'all null');
const eA = db.assessments.find(a => a.topic === 'Electrostatics');
const r30 = db.results.find(r => r.studentId === s30.id && r.assessmentId === eA.id);
add('18. 5S30 electrostatics = 70.7%', fmtPct(computeResultPct(db, r30)) === '70.7%', fmtPct(computeResultPct(db, r30)));
const r18 = db.results.find(r => r.studentId === s5A18.id && r.assessmentId === eA.id);
add('19. 5A18 electrostatics = 58.6%', fmtPct(computeResultPct(db, r18)) === '58.6%', fmtPct(computeResultPct(db, r18)));
const diags = studentDiagnoses(db, s5A18.id); const bs = diags.find(d => d.code === 'blindspot');
add('20. Gap card shows evidence + rule', bs && bs.rule && typeof bs.actualPct === 'number' && bs.confidence === 'Green', bs ? `${bs.rule} | conf=${bs.confidence} | ${fmtPct(bs.actualPct)}` : 'no blindspot found');
// New tests for the dual radar + top-8 topic logic.
const topicsAll = studentTopicStats(db, s5A18.id).filter(t => t.pct != null);
const top8 = [...topicsAll].sort((a, b) => b.pct - a.pct).slice(0, 8);
add('21. Topic radar caps at 8', top8.length <= 8, `topics=${topicsAll.length}, shown=${top8.length}`);
add('22. Top-8 sorted descending', top8.every((t, i) => i === 0 || top8[i - 1].pct >= t.pct), top8.map(t => Math.round(t.pct)).join(','));
return tests;
}

/* ------------------------------ PERSISTENCE ------------------------------ */
const DB_NAME = 'hkdse_physics_mastery', STORE = 'app', KEY = 'state_v1';
function idbGet() { return new Promise((res) => { try { const r = indexedDB.open(DB_NAME, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onerror = () => res(null); r.onsuccess = () => { try { const t = r.result.transaction(STORE, 'readonly').objectStore(STORE).get(KEY); t.onsuccess = () => res(t.result || null); t.onerror = () => res(null); } catch { res(null); } }; } catch { res(null); } }); }
function idbSet(v) { return new Promise((res) => { try { const r = indexedDB.open(DB_NAME, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onerror = () => res(false); r.onsuccess = () => { try { const tx = r.result.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(v, KEY); tx.oncomplete = () => res(true); tx.onerror = () => res(false); } catch { res(false); } }; } catch { res(false); } }); }

/* ------------------------------ UI PRIMITIVES ---------------------------- */
function Pill({ children, className = '' }) { return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{children}</span>; }
function StatTile({ icon: Icon, label, value, tone = 'slate', sub }) {
const tones = { slate: 'from-slate-500 to-slate-600', rose: 'from-rose-500 to-rose-600', sky: 'from-sky-500 to-sky-600', emerald: 'from-emerald-500 to-emerald-600', amber: 'from-amber-500 to-amber-600', violet: 'from-violet-500 to-violet-600' };
return (<div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4 flex items-center gap-3"><div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${tones[tone]} text-white flex items-center justify-center shrink-0`}><Icon size={22} /></div><div className="min-w-0"><div className="text-2xl font-bold text-slate-800 leading-tight">{value}</div><div className="text-xs text-slate-500 truncate">{label}</div>{sub && <div className="text-[11px] text-slate-400 truncate">{sub}</div>}</div></div>);
}
function ProgressBar({ pct, color = '#3b82f6' }) { return <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct || 0))}%`, backgroundColor: color }} /></div>; }
function Avatar({ student, size = 'md' }) {
const s = size === 'lg' ? 'h-16 w-16 text-xl' : 'h-10 w-10 text-sm';
const init = student.name ? student.name.trim().slice(0, 2).toUpperCase() : (student.aliases[0]?.canonical.slice(-2) || '??');
const colors = ['bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-violet-100 text-violet-700'];
return <div className={`${s} ${colors[(student.currentNumber || 0) % colors.length]} rounded-xl flex items-center justify-center font-bold shrink-0`}>{init}</div>;
}

/* ------------------------- GAMIFIED ABILITY RADARS ----------------------- */
// Shows BOTH a five-area performance radar and a gamified top-8 topic radar.
function AbilityRadar({ db, student, bi }) {
// Five-area data — keep all 5 areas so the pentagon shape stays consistent; untaught areas plot as gaps (null), not 0%.
const areaData = AREAS.map(a => {
const st = studentAreaStat(db, student.id, a.key);
return { subject: a.roman, value: st.pct == null ? null : round1(st.pct), full: bi(a.en, a.zh), color: a.color };
});
const hasArea = areaData.some(d => d.value != null);

// Topic data — top 8 by performance, recomputed on every render so it stays current as data updates.
const topicStatsAll = studentTopicStats(db, student.id).filter(t => t.pct != null);
const topicStats = [...topicStatsAll].sort((a, b) => b.pct - a.pct).slice(0, 8);
const topicData = topicStats.map(t => { const m = topicMeta(t.topic); return { subject: `${m.emoji} ${bi(m.short, m.zh)}`, value: round1(t.pct), topic: t.topic }; });

const power = studentPowerLevel(db, student.id);
const topTier = tierOf(power);

if (!hasArea && !topicData.length) return <div className="text-center text-slate-400 py-10 text-sm">{bi('No assessed data to chart yet.', '尚無已評估的數據可製圖。')}</div>;

return (
<div>
{/* Power / rank header */}
<div className="flex items-center gap-3 mb-3">
<div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex flex-col items-center justify-center shrink-0 shadow">
<div className="text-lg font-bold leading-none">{power ?? '—'}</div><div className="text-[8px] leading-none mt-0.5">POWER</div>
</div>
<div className="min-w-0">
<div className="text-sm font-semibold text-slate-800 flex items-center gap-1">{topTier.emoji} {bi(topTier.en, topTier.zh)} {bi('rank', '級')}</div>
<div className="text-xs text-slate-400">{bi('Average across assessed topics', '已評估課題平均')}</div>
</div>
</div>

{/* FIVE-AREA RADAR */}
<div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1"><Activity size={13} /> {bi('Five-Area Performance', '五大範疇表現')}</div>
{hasArea ? (
<ResponsiveContainer width="100%" height={220}>
<RadarChart data={areaData} outerRadius="70%">
<PolarGrid stroke="#e2e8f0" />
<PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#475569' }} />
<PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} angle={90} />
<Radar name="area" dataKey="value" stroke="#0ea5e9" fill="#38bdf8" fillOpacity={0.4} connectNulls={false} dot />
<Tooltip formatter={(v) => fmtPct(v)} labelFormatter={(l) => areaData.find(d => d.subject === l)?.full} />
</RadarChart>
</ResponsiveContainer>
) : <div className="text-xs text-slate-400 py-6 text-center">{bi('No area assessed yet.', '尚無已評估範疇。')}</div>}
<div className="flex flex-wrap gap-1.5 mt-1 mb-3">
{AREAS.map(a => { const d = areaData.find(x => x.subject === a.roman); return (
<span key={a.key} className="inline-flex items-center gap-1 text-[10px] text-slate-500"><span className="h-2 w-2 rounded-full" style={{ background: a.color }} />{a.roman} {d.value != null ? Math.round(d.value) : '—'}</span>
); })}
</div>

<div className="border-t border-dashed border-slate-200 my-3" />

{/* TOP-8 TOPIC RADAR */}
<div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
<Rocket size={13} /> {bi('Top 8 Topics', '前 8 課題')}
{topicStatsAll.length > 8 && <span className="normal-case font-normal text-slate-400">· {bi('showing best 8 of', '顯示最佳 8／共')} {topicStatsAll.length}</span>}
</div>
{topicData.length ? (<>
<ResponsiveContainer width="100%" height={280}>
<RadarChart data={topicData} outerRadius="70%">
<PolarGrid stroke="#e2e8f0" />
<PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#475569' }} />
<PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} angle={90} />
<Radar name="topic" dataKey="value" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.4} dot />
<Tooltip formatter={(v) => fmtPct(v)} />
</RadarChart>
</ResponsiveContainer>
<div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1">
{topicStats.map(t => { const m = topicMeta(t.topic), tier = tierOf(t.pct); return (
<div key={t.topic} className="rounded-lg border border-slate-200 px-2 py-1 flex items-center gap-1.5" style={{ borderLeftColor: tier.color, borderLeftWidth: 3 }}>
<span className="text-sm">{m.emoji}</span>
<div className="min-w-0 flex-1"><div className="text-[11px] font-medium text-slate-700 truncate">{bi(m.short, m.zh)}</div><div className="text-[9px] text-slate-400 truncate">{m.book} · {tier.emoji} {bi(tier.en, tier.zh)}</div></div>
<div className="text-xs font-bold" style={{ color: tier.color }}>{Math.round(t.pct)}</div>
</div>
); })}
</div>
</>) : <div className="text-xs text-slate-400 py-6 text-center">{bi('No topic assessed yet.', '尚無已評估課題。')}</div>}

<p className="text-[11px] text-slate-400 mt-2">{bi('Gaps = topic/area not yet assessed / taught (not counted as 0%). Topic radar keeps the current top 8 and updates as new results arrive.', '缺口 = 尚未評估／教授的課題或範疇（不計作 0%）。課題雷達保留目前最佳 8 項，並隨新成績即時更新。')}</p>
</div>
);
}

/* ============================================================================
MAIN APP
============================================================================ */
export default function App() {
const [db, setDb] = useState(emptyDb());
const [lang, setLang] = useState('en');
const [view, setView] = useState('dashboard');
const [selId, setSelId] = useState(null);
const [loaded, setLoaded] = useState(false);
const [toast, setToast] = useState(null);
const bi = useCallback((en, zh) => (lang === 'zh' ? zh : en), [lang]);
const notify = (m) => { setToast(m); setTimeout(() => setToast(null), 2600); };

useEffect(() => { (async () => { const saved = await idbGet(); if (saved && saved.students) setDb(saved); setLoaded(true); })(); }, []);
const saveTimer = useRef(null);
useEffect(() => { if (!loaded) return; if (saveTimer.current) clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => idbSet(structuredClone(db)), 500); }, [db, loaded]);

const students = db.students;
const selected = students.find(s => s.id === selId);

const dashStats = useMemo(() => {
let complete = 0, missingQ = 0, absences = 0, blind = 0, under = 0;
const qIds = new Set(db.questionnaires.map(q => q.id));
for (const s of students) {
if (studentCompleteness(db, s.id) === 100) complete++;
const hasQ = db.submissions.some(x => x.studentId === s.id);
if (qIds.size && !hasQ) missingQ++;
if (studentResults(db, s.id).some(r => r.status === 'Absent')) absences++;
const ds = studentDiagnoses(db, s.id);
if (ds.some(d => d.code === 'blindspot')) blind++;
if (ds.some(d => d.code === 'underconf')) under++;
}
return { total: students.length, complete, missingQ, absences, blind, under };
}, [db, students]);

const classAverages = useMemo(() => AREAS.map(a => { const vals = students.map(s => studentAreaStat(db, s.id, a.key).pct).filter(v => v != null); return { area: a.roman, name: bi(a.en, a.zh), value: vals.length ? round1(vals.reduce((x, y) => x + y, 0) / vals.length) : null, color: a.color, count: vals.length }; }), [db, students, bi]);

return (
<div className="min-h-screen bg-slate-50 text-slate-800">
<header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 print:hidden">
<div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0"><Zap size={22} /></div>
<div className="min-w-0 flex-1"><div className="font-bold text-slate-800 leading-tight truncate">HKDSE Physics Mastery Profile</div><div className="text-xs text-slate-500 truncate">香港中學文憑物理學習歷程及能力分析系統 · {db.meta.academicYearDefault}</div></div>
<button onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"><Languages size={16} /> {lang === 'en' ? '繁體中文' : 'EN'}</button>
</div>
<nav className="max-w-7xl mx-auto px-2 flex gap-1 overflow-x-auto">
{[{ k: 'dashboard', icon: Home, en: 'Dashboard', zh: '總覽' }, { k: 'import', icon: Upload, en: 'Import', zh: '匯入資料' }, { k: 'settings', icon: Settings, en: 'Settings', zh: '設定' }, { k: 'tests', icon: FlaskConical, en: 'Acceptance Tests', zh: '驗收測試' }].map(tab => (
<button key={tab.k} onClick={() => { setView(tab.k); setSelId(null); }} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${view === tab.k ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><tab.icon size={16} /> {bi(tab.en, tab.zh)}</button>
))}
</nav>
</header>

<main className="max-w-7xl mx-auto px-4 py-5">
{view === 'dashboard' && !selected && <Dashboard db={db} bi={bi} stats={dashStats} classAverages={classAverages} onOpen={(id) => { setSelId(id); setView('student'); }} onQuickLoad={() => { setDb(d => importSampleAll(d)); notify(bi('Sample data imported via the standard pipeline.', '已透過標準流程匯入範例資料。')); }} />}
{view === 'student' && selected && <StudentProfile db={db} setDb={setDb} bi={bi} student={selected} onBack={() => { setView('dashboard'); setSelId(null); }} notify={notify} />}
{view === 'import' && <ImportWizard db={db} setDb={setDb} bi={bi} notify={notify} onQuickLoad={() => { setDb(d => importSampleAll(d)); notify(bi('Sample data imported.', '已匯入範例資料。')); }} />}
{view === 'settings' && <SettingsView db={db} setDb={setDb} bi={bi} notify={notify} />}
{view === 'tests' && <TestsView bi={bi} />}
</main>

{toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-4 py-2 rounded-xl shadow-lg print:hidden">{toast}</div>}
</div>
);
}

/* ------------------------------ DASHBOARD -------------------------------- */
function Dashboard({ db, bi, stats, classAverages, onOpen, onQuickLoad }) {
const [q, setQ] = useState(''); const [clsFilter, setClsFilter] = useState('all'); const [diagFilter, setDiagFilter] = useState('all'); const [sortBy, setSortBy] = useState('canon');
const classes = useMemo(() => Array.from(new Set(db.students.map(s => s.currentClass))).sort(), [db.students]);
const rows = useMemo(() => {
let arr = db.students.map(s => { const overall = studentOverall(db, s.id); const comp = studentCompleteness(db, s.id); const ds = studentDiagnoses(db, s.id); return { s, overall, comp, blind: ds.filter(d => d.code === 'blindspot').length, under: ds.filter(d => d.code === 'underconf').length, canon: s.aliases[0]?.canonical || '' }; });
if (q.trim()) { const t = q.trim().toLowerCase(); arr = arr.filter(x => (x.s.name || '').toLowerCase().includes(t) || (x.s.sid || '').toLowerCase().includes(t) || x.canon.toLowerCase().includes(t) || canonicalClassNumber(q)?.canonical === x.canon); }
if (clsFilter !== 'all') arr = arr.filter(x => x.s.currentClass === clsFilter);
if (diagFilter === 'blind') arr = arr.filter(x => x.blind > 0); if (diagFilter === 'under') arr = arr.filter(x => x.under > 0); if (diagFilter === 'absent') arr = arr.filter(x => studentResults(db, x.s.id).some(r => r.status === 'Absent'));
arr.sort((a, b) => sortBy === 'canon' ? a.canon.localeCompare(b.canon) : (b.overall ?? -1) - (a.overall ?? -1));
return arr;
}, [db, q, clsFilter, diagFilter, sortBy]);

if (!db.students.length) return (
<div className="text-center py-20"><div className="mx-auto h-16 w-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4"><Database size={30} /></div><h2 className="text-xl font-bold text-slate-800">{bi('No data yet', '尚未有資料')}</h2><p className="text-slate-500 mt-1 max-w-md mx-auto">{bi('Import your CSV test results and self-assessment questionnaires, or load the supplied sample files to explore the system.', '匯入你的 CSV 測驗成績與自評問卷，或載入提供的範例檔案以探索系統。')}</p><button onClick={onQuickLoad} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700"><Sparkles size={18} /> {bi('Load sample data (via import pipeline)', '載入範例資料（經匯入流程）')}</button></div>
);

return (
<div className="space-y-5">
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
<StatTile icon={Users} label={bi('Students', '學生總數')} value={stats.total} tone="slate" />
<StatTile icon={CheckCircle2} label={bi('Complete data', '資料完整')} value={stats.complete} tone="emerald" />
<StatTile icon={ShieldQuestion} label={bi('Missing questionnaire', '缺自評問卷')} value={stats.missingQ} tone="amber" />
<StatTile icon={AlertTriangle} label={bi('With absences', '曾缺席')} value={stats.absences} tone="slate" />
<StatTile icon={Eye} label={bi('Hidden blind-spot alerts', '隱藏盲點提示')} value={stats.blind} tone="rose" />
<StatTile icon={Award} label={bi('Under-confidence alerts', '低估自己提示')} value={stats.under} tone="sky" />
</div>
<div className="grid lg:grid-cols-3 gap-4">
<div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-4"><h3 className="font-semibold text-slate-800 mb-2">{bi('Class average by Physics area', '各物理課題班級平均')}</h3>
<ResponsiveContainer width="100%" height={230}><BarChart data={classAverages.filter(d => d.value != null)}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="area" tick={{ fontSize: 12 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 12 }} /><Tooltip formatter={(v) => fmtPct(v)} labelFormatter={(l) => classAverages.find(d => d.area === l)?.name} /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{classAverages.filter(d => d.value != null).map((d, i) => <Cell key={i} fill={d.color} />)}</Bar></BarChart></ResponsiveContainer>
<p className="text-xs text-slate-400 mt-1">{bi('Areas with no assessment evidence are omitted (not shown as 0%).', '無測驗數據的課題不會顯示（不會當作 0%）。')}</p>
</div>
<div className="rounded-2xl bg-white border border-slate-200 p-4"><h3 className="font-semibold text-slate-800 mb-2">{bi('Teaching status', '教學狀態')}</h3>
<div className="space-y-2 text-sm">{AREAS.map(a => { const anyData = db.students.some(s => areaHasData(db, s.id, a.key)); const status = anyData ? 'Assessed' : (db.teachingPlan[a.key] !== 'auto' ? db.teachingPlan[a.key] : 'No information'); const map = { Assessed: 'bg-emerald-100 text-emerald-700', 'Not yet taught': 'bg-slate-100 text-slate-500', 'Currently teaching': 'bg-sky-100 text-sky-700', 'Taught but not assessed': 'bg-amber-100 text-amber-700', 'No information': 'bg-slate-100 text-slate-400' }; return (<div key={a.key} className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} /> {a.roman}. {bi(a.en, a.zh)}</span><Pill className={map[status]}>{status}</Pill></div>); })}</div>
</div>
</div>
<div className="rounded-2xl bg-white border border-slate-200 p-3 flex flex-wrap items-center gap-2">
<div className="relative flex-1 min-w-52"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={q} onChange={e => setQ(e.target.value)} placeholder={bi('Search SID / class number / name…', '搜尋 SID／班別學號／姓名…')} className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
<select value={clsFilter} onChange={e => setClsFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="all">{bi('All classes', '所有班別')}</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select>
<select value={diagFilter} onChange={e => setDiagFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="all">{bi('All students', '所有學生')}</option><option value="blind">{bi('Hidden blind spots', '隱藏盲點')}</option><option value="under">{bi('Under-confidence', '低估自己')}</option><option value="absent">{bi('Has absences', '曾缺席')}</option></select>
<select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="canon">{bi('Sort: class number', '排序：班別學號')}</option><option value="overall">{bi('Sort: performance', '排序：表現')}</option></select>
</div>
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
{rows.map(({ s, overall, comp, blind, under }) => (
<button key={s.id} onClick={() => onOpen(s.id)} className="text-left rounded-2xl bg-white border border-slate-200 p-4 hover:shadow-md hover:border-blue-300 transition group">
<div className="flex items-center gap-3"><Avatar student={s} /><div className="min-w-0 flex-1"><div className="font-semibold text-slate-800 truncate">{s.name || s.aliases[0]?.canonical}</div><div className="text-xs text-slate-500 truncate">{s.aliases[0]?.canonical} · SID {s.sid || '—'}</div></div><ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500" /></div>
<div className="mt-3 flex items-center gap-2 text-sm"><span className="text-slate-500">{bi('Overall', '整體')}</span><span className="font-bold text-slate-800">{fmtPct(overall)}</span><span className="text-xs text-slate-400 ml-auto">{bi('data', '完整度')} {comp == null ? '—' : Math.round(comp) + '%'}</span></div>
<div className="mt-2"><ProgressBar pct={overall} color={overall >= 65 ? '#10b981' : overall >= 50 ? '#f59e0b' : '#ef4444'} /></div>
<div className="mt-3 flex flex-wrap gap-1.5">{blind > 0 && <Pill className="bg-rose-100 text-rose-700"><Eye size={11} /> {blind} {bi('blind spot', '盲點')}</Pill>}{under > 0 && <Pill className="bg-sky-100 text-sky-700"><Award size={11} /> {under} {bi('under-conf', '低估')}</Pill>}{studentResults(db, s.id).some(r => r.status === 'Absent') && <Pill className="bg-slate-100 text-slate-500"><AlertTriangle size={11} /> {bi('absence', '缺席')}</Pill>}</div>
</button>
))}
</div>
{!rows.length && <div className="text-center text-slate-400 py-10">{bi('No students match your filters.', '沒有符合篩選條件的學生。')}</div>}
</div>
);
}

/* ------------------------------ STUDENT PROFILE -------------------------- */
function StudentProfile({ db, setDb, bi, student, onBack, notify }) {
const [tab, setTab] = useState('overview');
const [coach, setCoach] = useState(false);
const stats = useMemo(() => studentAllStats(db, student.id), [db, student]);
const overall = studentOverall(db, student.id);
const comp = studentCompleteness(db, student.id);
const power = studentPowerLevel(db, student.id);
const tier = tierOf(power);
const diagnoses = useMemo(() => studentDiagnoses(db, student.id), [db, student]);
const priorities = useMemo(() => {
const list = [];
diagnoses.filter(d => d.code === 'blindspot' || d.code === 'aware').forEach(d => list.push({ kind: d.code, en: d.conceptEn, zh: d.conceptZh, area: d.area, actual: d.actualPct, conf: d.confidence }));
stats.forEach(s => s.topics.forEach(t => { if (t.pct != null && t.pct < 50) list.push({ kind: 'lowscore', en: t.topic, zh: t.topic, area: s.areaKey, actual: t.pct }); }));
return list.slice(0, 12);
}, [diagnoses, stats]);
const updateStudent = (patch) => setDb(d => { const draft = structuredClone(d); const s = draft.students.find(x => x.id === student.id); Object.assign(s, patch, { updatedAt: Date.now() }); return draft; });

const tabs = [
{ k: 'overview', en: 'Overview', zh: '概覽' }, { k: 'report', en: 'Report', zh: '報告' }, { k: 'stats', en: 'Character Stats', zh: '能力數值' },
{ k: 'history', en: 'Test History', zh: '測驗紀錄' }, { k: 'gap', en: 'Cognitive Gap', zh: '認知落差' }, { k: 'confidence', en: 'Confidence', zh: '自評信心' },
{ k: 'priorities', en: 'Revision Priorities', zh: '溫習優先' }, { k: 'notes', en: 'Teacher Notes', zh: '教師備註' }, { k: 'audit', en: 'Audit', zh: '審計紀錄' },
];
const benchTone = overall == null ? 'slate' : overall >= db.settings.benchL4 ? 'emerald' : overall >= db.settings.benchL3 ? 'sky' : overall >= db.settings.benchL2 ? 'amber' : 'rose';

return (
<div className="space-y-4">
<button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 print:hidden"><ChevronLeft size={16} /> {bi('Back to dashboard', '返回總覽')}</button>
<div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-5 print:hidden">
<div className="flex flex-wrap items-center gap-4">
<Avatar student={student} size="lg" />
<div className="min-w-0 flex-1"><div className="text-xl font-bold">{student.name || student.aliases[0]?.canonical}</div><div className="text-slate-300 text-sm">{student.aliases[0]?.canonical} · SID {student.sid || '—'} · {bi('Form', '級別')} {student.aliases[0]?.form} · {student.aliases[0]?.academicYear}</div>
<div className="mt-1 flex flex-wrap gap-2 text-xs"><Pill className="bg-white/15 text-white"><Target size={11} /> {bi('Target', '目標')}: {student.targetGrade || bi('not set', '未設定')}</Pill><Pill className="bg-white/15 text-white">{bi('Data completeness', '資料完整度')}: {comp == null ? '—' : Math.round(comp) + '%'}</Pill><Pill className="bg-amber-400/90 text-slate-900">{tier.emoji} {bi(tier.en, tier.zh)} · {bi('Power', '戰力')} {power ?? '—'}</Pill></div>
</div>
<div className="text-right"><div className="text-4xl font-bold">{fmtPct(overall, 0)}</div><div className="text-xs text-slate-300">{bi('Overall (assessed areas)', '整體（已評估課題）')}</div>
<div className="mt-2 flex gap-2 justify-end"><button onClick={() => setTab('report')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 text-sm font-medium"><ClipboardList size={15} /> {bi('View Report', '查看報告')}</button><button onClick={() => setCoach(true)} className="inline-flex items-center gap-1 rounded-lg bg-blue-500 hover:bg-blue-400 px-3 py-1.5 text-sm font-medium"><Bot size={15} /> {bi('Coach', '教練')}</button></div>
</div>
</div>
</div>
<div className="flex gap-1 overflow-x-auto border-b border-slate-200 print:hidden">{tabs.map(t => <button key={t.k} onClick={() => setTab(t.k)} className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${tab === t.k ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{bi(t.en, t.zh)}</button>)}</div>

{tab === 'overview' && (
<div className="grid lg:grid-cols-3 gap-4">
<div className="lg:col-span-2 grid sm:grid-cols-2 gap-3">{stats.map(st => <AreaStatCard key={st.areaKey} st={st} bi={bi} />)}</div>
<div className="space-y-4">
<div className="rounded-2xl bg-white border border-slate-200 p-4">
<h3 className="font-semibold text-slate-800 flex items-center gap-1 mb-2"><Rocket size={16} className="text-indigo-600" /> {bi('Ability radars', '能力雷達圖')}</h3>
<AbilityRadar db={db} student={student} bi={bi} />
</div>
<div className={`rounded-2xl border p-4 ${toneClass[benchTone]}`}><div className="font-semibold flex items-center gap-2"><GraduationCap size={16} /> {bi('Internal planning benchmark', '內部規劃基準')}</div><p className="text-sm mt-1">{bi('Editable internal planning thresholds, not official HKDSE cut-offs.', '可調整的內部規劃基準，並非官方 DSE 分數線。')}</p><div className="text-xs mt-2">L2 ≥ {db.settings.benchL2}% · L3 ≥ {db.settings.benchL3}% · L4 ≥ {db.settings.benchL4}%</div></div>
</div>
</div>
)}
{tab === 'report' && <ReportTab db={db} student={student} bi={bi} />}
{tab === 'stats' && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{stats.map(st => <AreaStatCard key={st.areaKey} st={st} bi={bi} detailed />)}</div>}
{tab === 'history' && <HistoryTab db={db} student={student} bi={bi} />}
{tab === 'gap' && <GapTab diagnoses={diagnoses} bi={bi} db={db} />}
{tab === 'confidence' && <ConfidenceTab db={db} setDb={setDb} student={student} bi={bi} />}
{tab === 'priorities' && <PrioritiesTab priorities={priorities} bi={bi} />}
{tab === 'notes' && <NotesTab student={student} bi={bi} updateStudent={updateStudent} notify={notify} />}
{tab === 'audit' && <AuditTab db={db} student={student} bi={bi} />}
{coach && <CoachModal db={db} student={student} bi={bi} onClose={() => setCoach(false)} stats={stats} diagnoses={diagnoses} />}
</div>
);
}

function AreaStatCard({ st, bi, detailed }) {
const a = areaById[st.areaKey];
const statusMap = { Assessed: bi('Assessed', '已評估'), 'Not yet taught': bi('Not yet taught', '尚未教授'), 'Currently teaching': bi('Currently teaching', '正在教授'), 'Taught but not assessed': bi('Taught, not assessed', '已教未評'), 'No information': bi('No information', '沒有資料') };
const hasData = st.pct != null;
return (
<div className="rounded-2xl bg-white border border-slate-200 p-4">
<div className="flex items-center justify-between"><div className="flex items-center gap-2 min-w-0"><span className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: a.color }}>{a.roman}</span><div className="min-w-0"><div className="font-semibold text-slate-800 text-sm truncate">{bi(a.en, a.zh)}</div><div className="text-[11px] text-slate-400">{st.count} {bi('assessment(s)', '個評估')}</div></div></div>{hasData ? <div className="text-2xl font-bold text-slate-800">{Math.round(st.pct)}</div> : <Pill className="bg-slate-100 text-slate-500">{statusMap[st.status]}</Pill>}</div>
{hasData ? <div className="mt-2"><ProgressBar pct={st.pct} color={a.color} /></div> : <p className="text-xs text-slate-400 mt-2">{bi('No score shown — not counted as 0%.', '不顯示分數 — 不當作 0%。')}</p>}
{detailed && hasData && <div className="mt-3 space-y-1.5">{st.topics.map((t, i) => (<div key={i} className="flex items-center justify-between text-xs"><span className="text-slate-600 truncate">{topicMeta(t.topic).emoji} {t.topic}</span><span className={`font-medium ${t.status === 'Absent' ? 'text-slate-400' : t.pct != null && t.pct < 50 ? 'text-rose-600' : 'text-slate-700'}`}>{t.status === 'Absent' ? bi('Absent', '缺席') : t.status === 'Missing' ? bi('Missing', '缺') : fmtPct(t.pct)}</span></div>))}{st.absent > 0 && <div className="text-[11px] text-amber-600">{bi('Incomplete: includes an absence', '不完整：含缺席')}</div>}</div>}
</div>
);
}

/* ------------------------------ REPORT TAB ------------------------------- */
function ReportTab({ db, student, bi }) {
const stats = studentAllStats(db, student.id);
const overall = studentOverall(db, student.id);
const comp = studentCompleteness(db, student.id);
const power = studentPowerLevel(db, student.id);
const tier = tierOf(power);
const diagnoses = studentDiagnoses(db, student.id);
const suggestions = generateSuggestions(db, student.id);
const counts = diagnoses.reduce((m, d) => { m[d.code] = (m[d.code] || 0) + 1; return m; }, {});
const gapOrder = { blindspot: 0, aware: 1, underconf: 2 };
const keyGaps = diagnoses.filter(d => ['blindspot', 'aware', 'underconf'].includes(d.code)).sort((a, b) => gapOrder[a.code] - gapOrder[b.code]);

return (
<div>
<style>{`@media print { body * { visibility: hidden !important; } #report-print, #report-print * { visibility: visible !important; } #report-print { position: absolute; left: 0; top: 0; width: 100%; padding: 12px; } .no-print { display: none !important; } }`}</style>
<div className="flex justify-end mb-3 no-print"><button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700"><Printer size={15} /> {bi('Print / Save as PDF', '列印／儲存為 PDF')}</button></div>

<div id="report-print" className="space-y-5">
{/* Report header */}
<div className="rounded-2xl border border-slate-300 p-5 bg-white">
<div className="flex items-center justify-between flex-wrap gap-2">
<div><div className="text-lg font-bold text-slate-800">{bi('Student Learning Report', '學生學習報告')}</div><div className="text-xs text-slate-500">HKDSE Physics Mastery Profile · 香港中學文憑物理學習歷程</div></div>
<div className="text-xs text-slate-400 text-right">{bi('Generated', '製作日期')}: {new Date().toLocaleDateString()}</div>
</div>
<div className="mt-4 grid sm:grid-cols-4 gap-3">
<div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-[11px] text-slate-400">{bi('Student', '學生')}</div><div className="font-semibold text-slate-800">{student.name || student.aliases[0]?.canonical}</div><div className="text-xs text-slate-500">{student.aliases[0]?.canonical} · SID {student.sid || '—'}</div></div>
<div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-[11px] text-slate-400">{bi('Year / Form / Target', '學年／級別／目標')}</div><div className="font-semibold text-slate-800">{student.aliases[0]?.academicYear} · F{student.aliases[0]?.form}</div><div className="text-xs text-slate-500">{bi('Target', '目標')}: {student.targetGrade || bi('not set', '未設定')}</div></div>
<div className="rounded-xl bg-blue-50 border border-blue-200 p-3"><div className="text-[11px] text-blue-500">{bi('Overall (assessed)', '整體（已評估）')}</div><div className="text-2xl font-bold text-blue-700">{fmtPct(overall, 0)}</div><div className="text-xs text-blue-500">{bi('data completeness', '資料完整度')} {comp == null ? '—' : Math.round(comp) + '%'}</div></div>
<div className="rounded-xl bg-amber-50 border border-amber-200 p-3"><div className="text-[11px] text-amber-600">{bi('Power Level / Rank', '戰力／級別')}</div><div className="text-2xl font-bold text-amber-700">{power ?? '—'}</div><div className="text-xs text-amber-600">{tier.emoji} {bi(tier.en, tier.zh)}</div></div>
</div>
</div>

{/* Five area performance */}
<div className="rounded-2xl border border-slate-300 p-5 bg-white">
<h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Activity size={17} className="text-blue-600" /> {bi('Five-Area Performance', '五大範疇表現')}</h3>
<div className="grid md:grid-cols-2 gap-3">
{stats.map(st => { const a = areaById[st.areaKey]; const has = st.pct != null; const tr = tierOf(st.pct);
return (
<div key={st.areaKey} className="rounded-xl border border-slate-200 p-3">
<div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-medium text-slate-800"><span className="h-6 w-6 rounded-md flex items-center justify-center text-white text-[11px] font-bold" style={{ background: a.color }}>{a.roman}</span>{bi(a.en, a.zh)}</span>{has ? <span className="text-sm font-bold" style={{ color: a.color }}>{fmtPct(st.pct)}</span> : <Pill className="bg-slate-100 text-slate-500">{st.status === 'Not yet taught' ? bi('Not yet taught', '尚未教授') : bi('No data', '無數據')}</Pill>}</div>
{has && <div className="mt-2"><ProgressBar pct={st.pct} color={a.color} /></div>}
{has && <div className="mt-2 flex flex-wrap gap-1">{st.topics.map((t, i) => <Pill key={i} className={t.status === 'Absent' ? 'bg-slate-100 text-slate-400' : t.pct != null && t.pct < 50 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}>{topicMeta(t.topic).emoji} {topicMeta(t.topic).short} {t.status === 'Absent' ? bi('(abs)', '(缺)') : t.pct != null ? Math.round(t.pct) : ''}</Pill>)}<Pill className="bg-slate-50 text-slate-400">{tr.emoji} {bi(tr.en, tr.zh)}</Pill></div>}
</div>
);
})}
</div>
</div>

{/* Ability radars (five-area + top-8 topics) */}
<div className="rounded-2xl border border-slate-300 p-5 bg-white">
<h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2"><Rocket size={17} className="text-indigo-600" /> {bi('Ability Radars', '能力雷達圖')}</h3>
<AbilityRadar db={db} student={student} bi={bi} />
</div>

{/* Cognitive gap */}
<div className="rounded-2xl border border-slate-300 p-5 bg-white">
<h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2"><Brain size={17} className="text-rose-600" /> {bi('Cognitive Gap Diagnosis', '認知落差診斷')}</h3>
<p className="text-xs text-slate-500 mb-3">{bi(`Self-assessment confidence vs actual test evidence · thresholds ${db.settings.diagLow}% / ${db.settings.diagHigh}% · concept evidence is chapter-level proxy.`, `自評信心 vs 實際測驗數據 · 門檻 ${db.settings.diagLow}%／${db.settings.diagHigh}% · 概念證據為章節層面參考。`)}</p>
<div className="flex flex-wrap gap-1.5 mb-3">
{['blindspot', 'aware', 'underconf', 'secure', 'aligned'].filter(c => counts[c]).map(c => { const M = DIAG_META[c]; return <Pill key={c} className={toneClass[M.tone]}>{bi(M.en, M.zh)}: {counts[c]}</Pill>; })}
{!keyGaps.length && <Pill className="bg-slate-100 text-slate-500">{bi('No high-priority gaps detected', '未偵測到高優先落差')}</Pill>}
</div>
<div className="grid md:grid-cols-2 gap-2">
{keyGaps.slice(0, 8).map((d, i) => { const M = d.meta, Icon = M.icon; return (
<div key={i} className={`rounded-xl border p-3 text-xs ${toneClass[M.tone]}`}>
<div className="flex items-center gap-1.5 font-semibold"><Icon size={14} /> {bi(M.en, M.zh)}</div>
<div className="mt-1 opacity-90">{d.conceptEn}</div><div className="opacity-70">{d.conceptZh}</div>
<div className="mt-1.5 flex flex-wrap gap-2 opacity-90"><span>{bi('Confidence', '信心')}: {tlLabel[d.confidence]}</span><span>{bi('Actual', '實際')}: {d.raw != null ? `${d.raw}/${d.full}` : d.actualStatus === 'Absent' ? bi('Absent', '缺席') : '—'} ({fmtPct(d.actualPct)})</span></div>
<div className="mt-1 opacity-70">{bi('Evidence', '證據')}: {d.evidenceTopic} · {bi('Rule', '規則')}: {d.rule}</div>
</div>
); })}
</div>
{keyGaps.length === 0 && diagnoses.length === 0 && <div className="text-sm text-slate-400">{bi('No self-assessment data available for this student yet.', '此學生尚無自評數據。')}</div>}
</div>

{/* Study suggestions */}
<div className="rounded-2xl border border-slate-300 p-5 bg-white">
<h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Lightbulb size={17} className="text-amber-500" /> {bi('Suggestions for Study', '學習建議')}</h3>
{suggestions.length ? (
<ol className="space-y-2">{suggestions.map((s, i) => { const Icon = s.icon; return (
<li key={i} className={`rounded-xl border p-3 flex gap-3 ${toneClass[s.tone]}`}>
<span className="h-6 w-6 rounded-lg bg-white/70 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
<div className="min-w-0 text-sm"><div className="flex items-center gap-1.5 font-medium"><Icon size={14} /> {s.en}</div><div className="opacity-80 mt-0.5">{s.zh}</div></div>
</li>
); })}</ol>
) : <div className="text-sm text-emerald-600">{bi('Great balance — no urgent study actions. Keep practising and maintain your strengths.', '表現均衡 — 沒有迫切的學習行動。繼續練習並保持強項。')}</div>}
<p className="text-[11px] text-slate-400 mt-3">{bi('Suggestions are generated from your test evidence and self-assessment. They are guidance, not grades.', '建議由你的測驗數據及自評產生，屬指導性質，並非評分。')}</p>
</div>
</div>
</div>
);
}

function HistoryTab({ db, student, bi }) {
const rows = studentResults(db, student.id).map(r => { const a = db.assessments.find(x => x.id === r.assessmentId); return { r, a }; }).filter(x => x.a).sort((x, y) => (x.a.area).localeCompare(y.a.area) || x.a.topic.localeCompare(y.a.topic));
return (
<div className="rounded-2xl bg-white border border-slate-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-left"><tr>{[bi('Assessment', '評估'), bi('Type', '類型'), bi('Area', '課題'), bi('Topic', '子題'), bi('Score', '分數'), bi('Full', '滿分'), bi('%', '百分比'), bi('Status', '狀態'), bi('Source', '來源')].map((h, i) => <th key={i} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{rows.map(({ r, a }) => { const pct = computeResultPct(db, r); return (<tr key={r.id} className="border-t border-slate-100"><td className="px-3 py-2">{a.name}</td><td className="px-3 py-2"><Pill className="bg-slate-100 text-slate-600">{a.type}</Pill></td><td className="px-3 py-2">{a.area}</td><td className="px-3 py-2">{a.topic}</td><td className="px-3 py-2 font-medium">{r.status === 'Present' ? r.rawScore : '—'}</td><td className="px-3 py-2 text-slate-500">{a.fullMark}</td><td className="px-3 py-2 font-semibold" style={{ color: pct == null ? '#94a3b8' : pct < 50 ? '#e11d48' : pct >= 65 ? '#059669' : '#334155' }}>{fmtPct(pct)}</td><td className="px-3 py-2">{r.status === 'Present' ? <Pill className="bg-emerald-100 text-emerald-700">{bi('Present', '出席')}</Pill> : r.status === 'Absent' ? <Pill className="bg-amber-100 text-amber-700">{bi('Absent', '缺席')}</Pill> : <Pill className="bg-slate-100 text-slate-500">{bi('Missing', '缺資料')}</Pill>}</td><td className="px-3 py-2 text-xs text-slate-400 max-w-40 truncate">{a.sourceFile}</td></tr>); })}</tbody></table></div>{!rows.length && <div className="p-6 text-center text-slate-400">{bi('No assessment records.', '沒有評估紀錄。')}</div>}</div>
);
}

function GapTab({ diagnoses, bi, db }) {
const [filter, setFilter] = useState('all');
const order = { blindspot: 0, aware: 1, underconf: 2, aligned: 3, secure: 4, test_only: 5, confidence_only: 6, absent: 7, insufficient: 8 };
const list = diagnoses.filter(d => filter === 'all' ? true : d.code === filter).sort((a, b) => order[a.code] - order[b.code]);
const counts = diagnoses.reduce((m, d) => { m[d.code] = (m[d.code] || 0) + 1; return m; }, {});
return (
<div className="space-y-3">
<div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 flex items-start gap-2"><Brain size={18} className="shrink-0 mt-0.5" /><span>{bi(`Deterministic diagnosis: self-assessment confidence vs actual test evidence. Thresholds: low ${db.settings.diagLow}% / high ${db.settings.diagHigh}%. Concept evidence here is chapter-level proxy.`, `規則式診斷：自評信心 vs 實際測驗數據。門檻：下限 ${db.settings.diagLow}%／上限 ${db.settings.diagHigh}%。此處概念證據為章節層面的參考數據。`)}</span></div>
<div className="flex flex-wrap gap-1.5"><button onClick={() => setFilter('all')} className={`text-xs px-2.5 py-1 rounded-full border ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}>{bi('All', '全部')} ({diagnoses.length})</button>{Object.entries(counts).map(([code, n]) => <button key={code} onClick={() => setFilter(code)} className={`text-xs px-2.5 py-1 rounded-full border ${filter === code ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}>{bi(DIAG_META[code].en, DIAG_META[code].zh)} ({n})</button>)}</div>
<div className="grid md:grid-cols-2 gap-3">{list.map((d, i) => { const M = d.meta, Icon = M.icon; return (
<div key={i} className={`rounded-2xl border p-4 ${toneClass[M.tone]}`}>
<div className="flex items-start gap-2"><Icon size={18} className="shrink-0 mt-0.5" /><div className="min-w-0 flex-1"><div className="font-semibold text-sm">{bi(M.en, M.zh)} <span className="text-[10px] font-normal opacity-70">· {bi('priority', '優先')}: {M.priority}</span></div><div className="text-xs mt-0.5 opacity-90">{d.conceptEn}</div><div className="text-[11px] opacity-70">{d.conceptZh}</div></div>{d.conflict && <Pill className="bg-white/60 text-slate-700 shrink-0"><AlertTriangle size={10} /> {bi('conflict', '衝突')}</Pill>}</div>
<div className="mt-2 grid grid-cols-3 gap-2 text-xs bg-white/50 rounded-lg p-2"><div><div className="opacity-60">{bi('Confidence', '信心')}</div><div className="font-semibold">{tlLabel[d.confidence]}</div></div><div><div className="opacity-60">{bi('Actual', '實際')}</div><div className="font-semibold">{d.actualStatus === 'Absent' ? bi('Absent', '缺席') : d.raw != null ? `${d.raw}/${d.full}` : '—'}</div></div><div><div className="opacity-60">%</div><div className="font-semibold">{fmtPct(d.actualPct)}</div></div></div>
<div className="mt-2 text-xs space-y-0.5"><div><span className="opacity-60">{bi('Evidence', '證據')}:</span> {d.evidenceTopic} · {bi(d.evidenceLevel === 'Chapter-level proxy' ? 'Chapter-level proxy' : d.evidenceLevel, d.evidenceLevel === 'Chapter-level proxy' ? '章節層面參考' : d.evidenceLevel)}</div><div><span className="opacity-60">{bi('Rule', '規則')}:</span> {d.rule}</div></div>
<div className="mt-2 text-xs bg-white/60 rounded-lg p-2"><div>{M.msgEn}</div><div className="opacity-80 mt-0.5">{M.msgZh}</div></div>
</div>
); })}</div>
{!list.length && <div className="text-center text-slate-400 py-8">{bi('No diagnoses in this filter.', '此篩選沒有診斷。')}</div>}
</div>
);
}

function ConfidenceTab({ db, setDb, student, bi }) {
const qs = questionnairesForStudent(db, student.id);
const setActive = (qid, subId) => setDb(d => { const draft = structuredClone(d); draft.submissions.forEach(s => { if (s.questionnaireId === qid && s.studentId === student.id) s.active = (s.id === subId); }); return draft; });
if (!qs.length) return <div className="text-center text-slate-400 py-8">{bi('No self-assessment submissions for this student.', '此學生沒有自評問卷紀錄。')}</div>;
return (
<div className="space-y-4">{qs.map(q => { const subs = db.submissions.filter(s => s.questionnaireId === q.id && s.studentId === student.id); const conflict = new Set(subs.map(s => s.hash)).size > 1; const active = subs.find(s => s.active) || subs[0];
return (
<div key={q.id} className="rounded-2xl bg-white border border-slate-200 p-4">
<div className="flex items-center justify-between gap-2 flex-wrap"><div className="font-semibold text-slate-800">{bi(q.titleEn, q.titleZh)}</div>{conflict && <Pill className="bg-rose-100 text-rose-700"><AlertTriangle size={11} /> {bi('Conflicting submissions — pick active', '有衝突提交 — 選擇有效紀錄')}</Pill>}</div>
{conflict && <div className="mt-2 flex flex-wrap gap-2">{subs.map((s, i) => <button key={s.id} onClick={() => setActive(q.id, s.id)} className={`text-xs px-2.5 py-1 rounded-lg border ${s.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600'}`}>{bi('Submission', '提交')} {i + 1} ({bi('row', '行')} {s.sourceRow})</button>)}</div>}
<div className="mt-3 space-y-1.5">{q.concepts.map(c => { const ans = active.answers[c.id] || 'Unanswered'; return (<div key={c.id} className="flex items-center gap-2 text-sm"><span className={`h-3.5 w-3.5 rounded-full shrink-0 ${tlClass[ans]}`} /><span className="text-slate-700 flex-1 min-w-0 truncate">{bi(c.en, c.zh)}</span><span className="text-xs text-slate-400 shrink-0">{tlLabel[ans]}</span></div>); })}</div>
</div>
);
})}</div>
);
}

function PrioritiesTab({ priorities, bi }) {
if (!priorities.length) return <div className="text-center text-slate-400 py-8">{bi('No urgent revision priorities detected — nice work.', '未偵測到迫切的溫習優先項目 — 做得好。')}</div>;
const kindMap = { blindspot: { en: 'Hidden blind spot', zh: '隱藏盲點', c: 'bg-rose-100 text-rose-700' }, aware: { en: 'Needs practice', zh: '需練習', c: 'bg-amber-100 text-amber-700' }, lowscore: { en: 'Low score', zh: '分數偏低', c: 'bg-slate-100 text-slate-600' } };
return (<div className="space-y-2">{priorities.map((p, i) => (<div key={i} className="rounded-xl bg-white border border-slate-200 p-3 flex items-center gap-3"><span className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span><div className="min-w-0 flex-1"><div className="text-sm font-medium text-slate-800 truncate">{p.en}</div><div className="text-xs text-slate-400">{bi('Area', '課題')} {p.area}{p.actual != null ? ` · ${bi('actual', '實際')} ${fmtPct(p.actual)}` : ''}</div></div><Pill className={kindMap[p.kind].c}>{bi(kindMap[p.kind].en, kindMap[p.kind].zh)}</Pill></div>))}</div>);
}

function NotesTab({ student, bi, updateStudent, notify }) {
const [name, setName] = useState(student.name || ''); const [target, setTarget] = useState(student.targetGrade || ''); const [notes, setNotes] = useState(student.notes || '');
return (
<div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-4 max-w-xl">
<div><label className="text-sm font-medium text-slate-700">{bi('Student name (never auto-invented)', '學生姓名（不會自動虛構）')}</label><input value={name} onChange={e => setName(e.target.value)} placeholder={bi('Add name manually…', '手動加入姓名…')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
<div><label className="text-sm font-medium text-slate-700">{bi('Target HKDSE grade', '目標 DSE 等級')}</label><select value={target} onChange={e => setTarget(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">{bi('Not set', '未設定')}</option>{['5**', '5*', '5', '4', '3', '2', '1'].map(g => <option key={g} value={g}>{g}</option>)}</select></div>
<div><label className="text-sm font-medium text-slate-700">{bi('Teacher notes', '教師備註')}</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
<button onClick={() => { updateStudent({ name: name.trim() || null, targetGrade: target || null, notes }); notify(bi('Saved.', '已儲存。')); }} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"><Save size={15} /> {bi('Save', '儲存')}</button>
</div>
);
}

function AuditTab({ db, student, bi }) {
const results = studentResults(db, student.id).map(r => ({ r, a: db.assessments.find(x => x.id === r.assessmentId) }));
const versioned = results.filter(x => x.r.versions && x.r.versions.length);
const subs = db.submissions.filter(s => s.studentId === student.id);
return (
<div className="space-y-4">
<div className="rounded-2xl bg-white border border-slate-200 p-4"><h3 className="font-semibold text-slate-800 mb-2">{bi('Academic-year aliases', '學年別名紀錄')}</h3><div className="space-y-1 text-sm">{student.aliases.map((a, i) => <div key={i} className="flex gap-3 text-slate-600"><span className="font-medium">{a.academicYear}</span><span>{bi('Form', '級別')} {a.form}</span><span>{a.canonical}</span></div>)}</div></div>
<div className="rounded-2xl bg-white border border-slate-200 p-4"><h3 className="font-semibold text-slate-800 mb-2">{bi('Result version history', '成績版本紀錄')}</h3>{versioned.length ? versioned.map((x, i) => (<div key={i} className="text-sm border-t border-slate-100 py-2 first:border-0"><div className="font-medium text-slate-700">{x.a.name} — {bi('now', '現值')}: {x.r.status === 'Present' ? x.r.rawScore : x.r.status}</div>{x.r.versions.map((v, j) => <div key={j} className="text-xs text-slate-400 ml-2">{bi('was', '曾為')}: {v.status === 'Present' ? v.rawScore : v.status} · {new Date(v.at).toLocaleString()}</div>)}</div>)) : <div className="text-sm text-slate-400">{bi('No corrections recorded.', '沒有修訂紀錄。')}</div>}</div>
<div className="rounded-2xl bg-white border border-slate-200 p-4"><h3 className="font-semibold text-slate-800 mb-2">{bi('Questionnaire submissions', '問卷提交紀錄')}</h3><div className="space-y-1 text-sm">{subs.map(s => { const q = db.questionnaires.find(x => x.id === s.questionnaireId); return <div key={s.id} className="flex items-center gap-2 text-slate-600"><span className={`h-2.5 w-2.5 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-slate-300'}`} /><span className="truncate">{q ? bi(q.titleEn, q.titleZh) : '?'} · {bi('row', '行')} {s.sourceRow} · {s.active ? bi('active', '有效') : bi('inactive', '非有效')}</span></div>; })}</div></div>
</div>
);
}

function CoachModal({ db, student, bi, onClose, stats, diagnoses }) {
const [msgs, setMsgs] = useState(() => { const weak = stats.filter(s => s.pct != null).sort((a, b) => a.pct - b.pct)[0]; const blind = diagnoses.filter(d => d.code === 'blindspot').length;
return [{ role: 'bot', en: `Hi! I'm your Physics Revision Coach. I've read ${student.name || student.aliases[0]?.canonical}'s profile. ${weak ? `Your lowest assessed area right now is ${areaById[weak.areaKey].en} (${fmtPct(weak.pct)}).` : ''} ${blind ? `I also see ${blind} hidden blind-spot concept(s) worth a look.` : ''} Which topic would you like to revise?`, zh: `你好！我是你的物理溫習教練。我已閱讀${student.name || student.aliases[0]?.canonical}的檔案。${weak ? `目前最需要加強的課題是${areaById[weak.areaKey].zh}（${fmtPct(weak.pct)}）。` : ''}${blind ? `另外我看到有 ${blind} 個隱藏盲點概念值得留意。` : ''}你想溫習哪個課題？` }];
});
const [input, setInput] = useState('');
const send = () => { if (!input.trim()) return; setMsgs(m => [...m, { role: 'user', en: input, zh: input }, { role: 'bot', en: `Good choice. Based on the HKDSE syllabus, focus on the core concepts and one or two common misconceptions. When ready, say "quiz me". Note: verified multiple-choice questions can only be shown after you upload the relevant past-paper PDF — no PDF is loaded, so I will not invent questions.`, zh: `好選擇。根據 DSE 課程綱要，先掌握核心概念，並留意一兩個常見誤解。準備好時輸入「測我」。注意：只有在上載相關歷屆試題 PDF 後才能提供已核實的選擇題 — 目前未載入 PDF，我不會虛構題目。` }]); setInput(''); };
return (
<div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
<div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>
<div className="p-4 border-b border-slate-200 flex items-center gap-2"><Bot size={20} className="text-blue-600" /><div className="font-semibold flex-1">{bi('Physics Revision Coach', '物理溫習教練')}</div><button onClick={onClose}><XCircle size={20} className="text-slate-400" /></button></div>
<div className="flex-1 overflow-y-auto p-4 space-y-3">{msgs.map((m, i) => (<div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}><div>{m.en}</div>{m.role === 'bot' && <div className="opacity-70 mt-1">{m.zh}</div>}</div></div>))}</div>
<div className="p-3 border-t border-slate-200 flex gap-2"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={bi('Type a topic…', '輸入課題…')} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button onClick={send} className="rounded-lg bg-blue-600 text-white px-4 text-sm font-medium">{bi('Send', '傳送')}</button></div>
</div>
</div>
);
}

/* ------------------------------ IMPORT WIZARD ---------------------------- */
function ImportWizard({ db, setDb, bi, notify, onQuickLoad }) {
const [stage, setStage] = useState(1); const [dataType, setDataType] = useState('test'); const [kind, setKind] = useState('electrostatics');
const [academicYear, setAcademicYear] = useState(db.meta.academicYearDefault); const [cohort, setCohort] = useState('5S 2026/27');
const [fileName, setFileName] = useState(''); const [rawText, setRawText] = useState(''); const [preview, setPreview] = useState(null); const [error, setError] = useState('');
const onFile = (e) => { const f = e.target.files?.[0]; if (!f) return; setFileName(f.name); if (/\.(xlsx|xls)$/i.test(f.name)) { setError(bi('Excel parsing requires the SheetJS library, which is not bundled in this sandbox build. Please export the sheet as CSV (UTF-8). The import engine is pluggable and ready for xlsx.', 'Excel 解析需要 SheetJS 函式庫（此沙盒版本未內建）。請將工作表匯出為 CSV（UTF-8）。匯入引擎為可插拔式，已預留 xlsx 支援。')); setRawText(''); return; } setError(''); const reader = new FileReader(); reader.onload = () => setRawText(String(reader.result || '')); reader.readAsText(f, 'utf-8'); };
const doPreview = () => { try { if (!rawText) { setError(bi('Please choose a CSV file first.', '請先選擇 CSV 檔案。')); return; } const opts = { academicYear, cohort, sourceFile: fileName || 'upload.csv' }; const p = dataType === 'test' ? previewTestResults(rawText, opts) : previewQuestionnaire(rawText, { ...opts, kind }); if (p.error) { setError(p.error); return; } setPreview(p); setError(''); setStage(3); } catch (e) { setError(String(e.message || e)); } };
const commit = () => { const { draft, report } = dataType === 'test' ? commitTestResults(db, preview) : commitQuestionnaire(db, preview); setDb(draft); notify(bi(`Imported. New students: ${report.newStudents || 0}, matched: ${report.matched}.`, `已匯入。新增學生：${report.newStudents || 0}，已配對：${report.matched}。`)); setStage(1); setPreview(null); setRawText(''); setFileName(''); };
const setFull = (i, v) => setPreview(p => { const np = structuredClone(p); np.columns[i].fullMark = toNum(v); return np; });
return (
<div className="space-y-4">
<div className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center justify-between flex-wrap gap-2"><div className="flex items-center gap-2">{[1, 2, 3, 4].map(s => <div key={s} className="flex items-center gap-2"><span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${stage >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{s}</span>{s < 4 && <span className="w-6 h-0.5 bg-slate-200" />}</div>)}<span className="text-sm text-slate-500 ml-2">{[bi('Upload', '上傳'), bi('Map', '對應'), bi('Validate', '驗證'), bi('Confirm', '確認')][stage - 1]}</span></div><button onClick={onQuickLoad} className="inline-flex items-center gap-1.5 text-sm rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"><Sparkles size={15} /> {bi('Quick-load all sample files', '一鍵載入全部範例')}</button></div>
{(stage === 1 || stage === 2) && (
<div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 max-w-2xl">
<div className="grid sm:grid-cols-2 gap-3">
<div><label className="text-sm font-medium text-slate-700">{bi('Data type', '資料類型')}</label><select value={dataType} onChange={e => setDataType(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="test">{bi('Test / examination results', '測驗／考試成績')}</option><option value="questionnaire">{bi('Self-assessment questionnaire', '自評問卷')}</option></select></div>
{dataType === 'questionnaire' && <div><label className="text-sm font-medium text-slate-700">{bi('Questionnaire kind', '問卷種類')}</label><select value={kind} onChange={e => setKind(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">{Object.entries(QKIND).map(([k, v]) => <option key={k} value={k}>{bi(v.titleEn, v.titleZh)}</option>)}</select></div>}
<div><label className="text-sm font-medium text-slate-700">{bi('Academic year', '學年')}</label><input value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
<div><label className="text-sm font-medium text-slate-700">{bi('Class / cohort', '班別／群組')}</label><input value={cohort} onChange={e => setCohort(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
</div>
<div><label className="text-sm font-medium text-slate-700">{bi('CSV file (.csv, UTF-8)', 'CSV 檔案（.csv, UTF-8）')}</label><input type="file" accept=".csv,.xlsx,.xls" onChange={onFile} className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-blue-700" />{fileName && <div className="text-xs text-slate-500 mt-1">{fileName}</div>}</div>
{error && <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3">{error}</div>}
<button onClick={doPreview} disabled={!rawText} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 disabled:bg-slate-300 text-white px-4 py-2 text-sm font-medium">{bi('Preview & validate', '預覽並驗證')} <ChevronRight size={16} /></button>
</div>
)}
{stage === 3 && preview && (
<div className="space-y-3">
{preview.type === 'test' && (<>
<div className="rounded-2xl bg-white border border-slate-200 p-4"><h3 className="font-semibold text-slate-800 mb-2">{bi('Confirm full marks (auto-proposed = column max)', '確認滿分（自動建議 = 欄最大值）')}</h3><div className="grid sm:grid-cols-2 gap-2">{preview.columns.map((c, i) => (<div key={i} className="flex items-center gap-2 text-sm"><span className="flex-1 min-w-0"><span className="font-medium truncate">{c.header}</span><span className="text-xs text-slate-400 block">{c.area} · {c.topic}</span></span><input type="number" value={c.fullMark ?? ''} onChange={e => setFull(i, e.target.value)} className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm" /></div>))}</div><p className="text-xs text-amber-600 mt-2">{bi('Please confirm — unlabelled summary rows are not treated as students, and the full-mark row is proposed, not assumed.', '請確認 — 未標示的統計列不會當作學生，滿分列僅為建議而非假設。')}</p></div>
<div className="rounded-2xl bg-white border border-slate-200 p-4 text-sm grid sm:grid-cols-3 gap-3"><div><div className="text-2xl font-bold text-slate-800">{preview.students.length}</div><div className="text-slate-500">{bi('student rows', '學生列')}</div></div><div><div className="text-2xl font-bold text-slate-800">{preview.columns.length}</div><div className="text-slate-500">{bi('assessments', '評估')}</div></div><div><div className="text-2xl font-bold text-slate-800">{preview.summaryRows.length}</div><div className="text-slate-500">{bi('summary rows ignored', '忽略的統計列')}</div></div></div>
</>)}
{preview.type === 'questionnaire' && (
<div className="rounded-2xl bg-white border border-slate-200 p-4 text-sm"><h3 className="font-semibold text-slate-800 mb-2">{bi('Detected concepts & matching', '偵測到的概念及配對')}</h3><div className="grid sm:grid-cols-3 gap-3 mb-3"><div><div className="text-2xl font-bold text-slate-800">{preview.conceptHeaders.length}</div><div className="text-slate-500">{bi('concepts', '概念')}</div></div><div><div className="text-2xl font-bold text-slate-800">{preview.submissions.length}</div><div className="text-slate-500">{bi('submission rows', '提交列')}</div></div><div><div className="text-2xl font-bold text-slate-800">{preview.submissions.filter(s => db.students.some(st => st.aliases.some(a => a.academicYear === academicYear && a.canonical === s.canonical))).length}</div><div className="text-slate-500">{bi('will match students', '將配對學生')}</div></div></div><div className="text-xs text-slate-500">{bi('Unmatched IDs (need students imported first):', '未配對的學號（需先匯入學生）：')} {preview.submissions.filter(s => !db.students.some(st => st.aliases.some(a => a.academicYear === academicYear && a.canonical === s.canonical))).map(s => s.idRaw).join(', ') || bi('none', '無')}</div></div>
)}
{preview.warnings?.length > 0 && <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">{preview.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}</div>}
<div className="flex gap-2"><button onClick={() => setStage(1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">{bi('Back', '返回')}</button><button onClick={commit} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700"><CheckCircle2 size={16} /> {bi('Confirm import', '確認匯入')}</button></div>
</div>
)}
{db.batches.length > 0 && (
<div className="rounded-2xl bg-white border border-slate-200 p-4"><h3 className="font-semibold text-slate-800 mb-2">{bi('Recent imports (with rollback)', '近期匯入（可復原）')}</h3><div className="space-y-2">{[...db.batches].reverse().map(b => (<div key={b.id} className="flex items-center gap-2 text-sm border-t border-slate-100 pt-2 first:border-0 first:pt-0"><FileText size={15} className="text-slate-400 shrink-0" /><div className="min-w-0 flex-1"><div className="truncate">{b.filename}</div><div className="text-xs text-slate-400">{new Date(b.at).toLocaleString()} · {b.fileType} · {bi('new', '新增')} {(b.newStudents || 0) + (b.newResults || 0) + (b.added || 0)}</div></div><button onClick={() => { setDb(d => rollbackBatch(d, b.id)); notify(bi('Import rolled back.', '已復原此匯入。')); }} className="inline-flex items-center gap-1 text-xs rounded-lg border border-slate-300 px-2 py-1 hover:bg-slate-50"><RotateCcw size={12} /> {bi('Undo', '復原')}</button></div>))}</div></div>
)}
</div>
);
}

/* ------------------------------ SETTINGS --------------------------------- */
function SettingsView({ db, setDb, bi, notify }) {
const s = db.settings;
const set = (patch) => setDb(d => ({ ...d, settings: { ...d.settings, ...patch } }));
const setPlan = (area, val) => setDb(d => ({ ...d, teachingPlan: { ...d.teachingPlan, [area]: val } }));
const exportJson = () => { const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `hkdse-physics-backup-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url); };
const importJson = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const obj = JSON.parse(String(r.result)); if (obj.students) { setDb(obj); notify(bi('Backup restored.', '已還原備份。')); } } catch { notify(bi('Invalid backup file.', '備份檔案無效。')); } }; r.readAsText(f); };
return (
<div className="space-y-4 max-w-2xl">
<div className="rounded-2xl bg-white border border-slate-200 p-4"><h3 className="font-semibold text-slate-800 mb-3">{bi('Cognitive-gap thresholds', '認知落差門檻')}</h3><div className="grid grid-cols-2 gap-3 text-sm"><label>{bi('Low (blind spot / needs practice below)', '下限（低於則為盲點／需練習）')}<input type="number" value={s.diagLow} onChange={e => set({ diagLow: toNum(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label>{bi('High (secure / under-confidence above)', '上限（高於則為穩固／低估）')}<input type="number" value={s.diagHigh} onChange={e => set({ diagHigh: toNum(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></div></div>
<div className="rounded-2xl bg-white border border-slate-200 p-4"><h3 className="font-semibold text-slate-800 mb-1">{bi('Internal planning benchmarks', '內部規劃基準')}</h3><p className="text-xs text-slate-400 mb-3">{bi('Editable planning aids — not official HKDSE grade cut-offs.', '可調整的規劃輔助 — 並非官方 DSE 分數線。')}</p><div className="grid grid-cols-3 gap-3 text-sm"><label>L2 %<input type="number" value={s.benchL2} onChange={e => set({ benchL2: toNum(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label>L3 %<input type="number" value={s.benchL3} onChange={e => set({ benchL3: toNum(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label>L4 %<input type="number" value={s.benchL4} onChange={e => set({ benchL4: toNum(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></div></div>
<div className="rounded-2xl bg-white border border-slate-200 p-4"><h3 className="font-semibold text-slate-800 mb-3">{bi('Teaching plan (per area)', '教學計劃（各課題）')}</h3><div className="space-y-2 text-sm">{AREAS.map(a => (<div key={a.key} className="flex items-center gap-2"><span className="flex-1 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} /> {a.roman}. {bi(a.en, a.zh)}</span><select value={db.teachingPlan[a.key]} onChange={e => setPlan(a.key, e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1">{['auto', 'Not yet taught', 'Currently teaching', 'Taught but not assessed', 'No information'].map(v => <option key={v} value={v}>{v === 'auto' ? bi('Auto (from data)', '自動（依數據）') : v}</option>)}</select></div>))}</div></div>
<div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-wrap gap-2"><button onClick={exportJson} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"><Download size={15} /> {bi('Export backup (JSON)', '匯出備份 (JSON)')}</button><label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 cursor-pointer"><Upload size={15} /> {bi('Restore backup', '還原備份')}<input type="file" accept=".json" onChange={importJson} className="hidden" /></label><button onClick={() => { if (confirm(bi('Delete ALL data? This cannot be undone (export a backup first).', '刪除所有資料？此動作無法復原（請先匯出備份）。'))) { setDb(emptyDb()); notify(bi('All data cleared.', '已清除所有資料。')); } }} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 text-rose-600 px-4 py-2 text-sm hover:bg-rose-50 ml-auto"><Trash2 size={15} /> {bi('Reset all data', '重設所有資料')}</button></div>
<div className="rounded-xl bg-slate-100 p-3 text-xs text-slate-500">{bi('Storage: this prototype uses your browser (IndexedDB) with JSON backup. It is not suitable for multi-device production; deploy with a real database and authentication for live use.', '儲存：此原型使用瀏覽器（IndexedDB）並提供 JSON 備份，不適合多裝置正式使用；正式部署請採用真正的資料庫與身份驗證。')}</div>
</div>
);
}

/* ------------------------------ TESTS VIEW ------------------------------- */
function TestsView({ bi }) {
const [results, setResults] = useState(null);
useEffect(() => { try { setResults(runAcceptanceTests()); } catch (e) { setResults([{ name: 'runner', pass: false, detail: String(e.message || e) }]); } }, []);
const passed = results ? results.filter(r => r.pass).length : 0;
return (
<div className="space-y-4">
<div className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-3"><FlaskConical size={22} className="text-blue-600" /><div className="flex-1"><div className="font-semibold text-slate-800">{bi('Acceptance test suite', '驗收測試')}</div><div className="text-xs text-slate-500">{bi('Runs the live parsing, matching, scoring, dedup & diagnosis functions.', '對即時的解析、配對、計分、去重與診斷函式執行測試。')}</div></div>{results && <div className={`text-lg font-bold ${passed === results.length ? 'text-emerald-600' : 'text-amber-600'}`}>{passed}/{results.length}</div>}</div>
<div className="grid sm:grid-cols-2 gap-2">{results?.map((r, i) => (<div key={i} className={`rounded-xl border p-3 text-sm flex items-start gap-2 ${r.pass ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>{r.pass ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" /> : <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />}<div className="min-w-0"><div className="font-medium text-slate-800">{r.name}</div><div className="text-xs text-slate-500 break-words">{r.detail}</div></div></div>))}</div>
</div>
);
}
