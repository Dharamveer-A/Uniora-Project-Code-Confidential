/* ============================================================
   UNIORA — Document Verification Module
   Frontend Script (ES Module)
   ============================================================ */

import { supabase } from '../../../common/js/supabase.js';
import { getCurrentUser, getCurrentSession } from '../../../common/js/auth.js';
import { initNavbarAuth } from '../../../common/js/navbar.js';

// ============================================================
// DOCUMENT TYPE DEFINITIONS & SCHEME PRIORITIES
// ============================================================

// Top essential documents for 95%+ of Indian government schemes & scholarships
const HIGH_PRIORITY_DOCS = new Set([
    'Aadhaar Card',
    'Income Certificate',
    'Community Certificate',
    'Smart Ration Card',
    'Bank Passbook',
    '10th Marksheet',
    '12th Marksheet',
    'Undergraduate (UG) Degree',
]);

// 1. Primary Documents (Visible by default in 4-Column Grid: 3 rows × 4 cols = 12 cards)
const PRIMARY_DOCS = [
    'Aadhaar Card',
    'Income Certificate',
    'Community Certificate',
    'Smart Ration Card',
    'Bank Passbook',
    '10th Marksheet',
    '12th Marksheet',
    'Undergraduate (UG) Degree',
    'Diploma Certificate',
    'Postgraduate (PG) Degree',
    'PAN Card',
    'Voter ID Card',
];

// 2. Extended Documents (Expanded via "See All Documents")
const EXTENDED_DOCS = [
    'Bonafide Certificate',
    'Driving License',
    'Passport',
    'Birth Certificate',
    'Domicile Certificate',
    'BPL Certificate',
    'UDID Card',
    'Land Ownership Document',
    'Electricity Bill',
    'MGNREGA Job Card',
    'Udyam Certificate',
    'GST Certificate',
    'Marriage Certificate',
    'Death Certificate',
    'Orphan Certificate',
    'Widow Certificate',
];

const SVG = {
    id:          `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2"/></svg>`,
    card:        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
    doc:         `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    vote:        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>`,
    car:         `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5h-3M7 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0M15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/></svg>`,
    passport:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="11" r="3"/><path d="M9 21h6M9 7h6"/></svg>`,
    birth:       `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 1 5 5c0 4-5 8-5 8S7 11 7 7a5 5 0 0 1 5-5z"/><path d="M5 20h14"/><path d="M8 16v4M16 16v4"/></svg>`,
    community:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    ration:      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
    bpl:         `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    bank:        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 2 7 22 7"/></svg>`,
    edu10:       `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="13" y2="11"/></svg>`,
    edu12:       `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polygon points="12 12 13.5 15 17 15.5 14.5 18 15 21.5 12 19.5 9 21.5 9.5 18 7 15.5 10.5 15 12 12"/></svg>`,
    diploma:     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
    ug:          `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    pg:          `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/><circle cx="12" cy="18" r="2"/></svg>`,
    bonafide:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2M7 16h10"/></svg>`,
    land:        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 12 2 21 11 21 22 3 22"/><line x1="9" y1="22" x2="9" y2="14"/><line x1="15" y1="22" x2="15" y2="14"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`,
    udid:        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
    death:       `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>`,
    marriage:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    domicile:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    electricity: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    mgnrega:     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a9 9 0 1 0 9-9"/><path d="M3 9H1M3 9V7"/></svg>`,
    udyam:       `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>`,
    gst:         `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    welfare:     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    folderEmpty: `<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    allVerified: `<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="16 9 10 15 7 12"/></svg>`,
    checkSmall:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    chevronRight:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
    sparkles:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
    alert:       `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    check:       `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="16 9 10 15 7 12"/></svg>`,
    spinner:     `<svg class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>`,
};

const DOCUMENT_TYPES = {
    'Aadhaar Card':             { icon: SVG.id,          fields: ['name', 'date_of_birth', 'aadhaar_number', 'address'], hint: 'Unique 12-digit identity proof' },
    'Income Certificate':       { icon: SVG.doc,         fields: ['name', 'annual_income', 'issuing_authority'], hint: 'Annual household income criteria' },
    'Community Certificate':    { icon: SVG.community,   fields: ['name', 'social_category', 'caste', 'issuing_authority'], hint: 'Caste & category reservation proof' },
    'Smart Ration Card':        { icon: SVG.ration,      fields: ['name', 'ration_card_number', 'address', 'ration_category'], hint: 'Food & family welfare identifier' },
    'Bank Passbook':            { icon: SVG.bank,        fields: ['name', 'account_number', 'ifsc_code'], hint: 'Direct benefit scholarship bank account' },
    '10th Marksheet':           { icon: SVG.edu10,       fields: ['student_name', 'roll_number', 'board_name', 'school_name', 'year_of_passing', 'obtained_marks', 'maximum_marks', 'percentage'], hint: 'SSLC / Matriculation secondary school marks' },
    '12th Marksheet':           { icon: SVG.edu12,       fields: ['student_name', 'roll_number', 'board_name', 'school_name', 'year_of_passing', 'obtained_marks', 'maximum_marks', 'percentage'], hint: 'HSC / +2 Higher secondary school marks' },
    'Undergraduate (UG) Degree':{ icon: SVG.ug,          fields: ['student_name', 'register_number', 'degree_name', 'university_or_college', 'year_of_passing', 'cgpa', 'percentage'], hint: "Bachelor's graduation degree & CGPA" },
    'Diploma Certificate':      { icon: SVG.diploma,     fields: ['student_name', 'registration_number', 'institution', 'branch_or_stream', 'year_of_passing', 'obtained_marks', 'maximum_marks', 'percentage'], hint: 'Polytechnic technical diploma qualification' },
    'Postgraduate (PG) Degree': { icon: SVG.pg,          fields: ['student_name', 'register_number', 'degree_name', 'university_or_college', 'year_of_passing', 'cgpa', 'percentage'], hint: "Master's postgraduate degree & CGPA" },
    'Bonafide Certificate':     { icon: SVG.bonafide,    fields: ['student_name', 'roll_number', 'institution', 'current_course', 'academic_year'], hint: 'Active college / school enrollment proof' },
    'PAN Card':                 { icon: SVG.card,        fields: ['name', 'pan_number'], hint: 'Income tax & financial identifier' },
    'Voter ID Card':            { icon: SVG.vote,        fields: ['name', 'voter_id_number', 'address'], hint: 'Electoral photo identity card (EPIC)' },
    'Driving License':          { icon: SVG.car,         fields: ['name', 'date_of_birth', 'license_number', 'address'], hint: 'Motor vehicle transport license' },
    'Passport':                 { icon: SVG.passport,    fields: ['name', 'date_of_birth', 'passport_number', 'address'], hint: 'International citizenship & travel doc' },
    'Birth Certificate':        { icon: SVG.birth,       fields: ['name', 'date_of_birth', 'place_of_birth'], hint: 'Official proof of birth & age' },
    'Domicile Certificate':     { icon: SVG.domicile,    fields: ['name', 'state_residency', 'district'], hint: 'State nativity & residency proof' },
    'BPL Certificate':          { icon: SVG.bpl,         fields: ['name', 'bpl_status', 'family_details'], hint: 'Below Poverty Line welfare status' },
    'UDID Card':                { icon: SVG.udid,        fields: ['name', 'disability_type', 'disability_percentage'], hint: 'Unique Disability ID certificate' },
    'Land Ownership Document':  { icon: SVG.land,        fields: ['owner_name', 'land_area', 'location'], hint: 'Patta / Chitta farmer property title' },
    'Electricity Bill':         { icon: SVG.electricity, fields: ['name', 'consumer_number', 'address'], hint: 'Residential utility & address proof' },
    'MGNREGA Job Card':         { icon: SVG.mgnrega,     fields: ['name', 'job_card_number', 'rural_status'], hint: 'Rural guaranteed employment card' },
    'Udyam Certificate':        { icon: SVG.udyam,       fields: ['name', 'business_registration', 'msme_status'], hint: 'MSME business & enterprise proof' },
    'GST Certificate':          { icon: SVG.gst,         fields: ['name', 'gst_number', 'business_registration'], hint: 'GST business registration proof' },
    'Marriage Certificate':     { icon: SVG.marriage,    fields: ['name', 'spouse_name', 'marriage_date'], hint: 'Official legal proof of marriage' },
    'Death Certificate':        { icon: SVG.death,       fields: ['deceased_name', 'date_of_death', 'issuing_authority'], hint: 'Official proof of death' },
    'Orphan Certificate':       { icon: SVG.welfare,     fields: ['name', 'orphan_status', 'issuing_authority'], hint: 'Orphan welfare & fee waiver status' },
    'Widow Certificate':        { icon: SVG.welfare,     fields: ['name', 'widow_status', 'husband_death_proof'], hint: 'Widow pension & welfare status' },
};

// ============================================================
// STATE
// ============================================================
const SECRET_KEY = "uniora_secure_2024";
let pendingDocs  = {};   // docName → true
let verifiedDocs = {};   // docName → { data, icon }
let activeDocName = null;
let wizardExtractedData = null;

// ============================================================
// ENCRYPTION
// ============================================================
function encryptData(data) {
    let text = encodeURIComponent(JSON.stringify(data));
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    }
    return btoa(result);
}

function decryptData(b64) {
    try {
        let text = atob(b64), result = '';
        for (let i = 0; i < text.length; i++) result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
        return JSON.parse(decodeURIComponent(result));
    } catch { return []; }
}

function getStoredDocs() {
    const r = localStorage.getItem('uniora_verified_docs');
    return r ? decryptData(r) : [];
}

function saveStoredDocs(d) {
    localStorage.setItem('uniora_verified_docs', encryptData(d));
}

// ============================================================
// INIT
// ============================================================
async function initApp() {
    // 1. Initialize navbar auth UI
    try {
        await initNavbarAuth();
    } catch (e) {
        console.warn('[UNIORA] navbar auth init warning:', e);
    }

    // 2. Initialize all docs as pending
    Object.keys(DOCUMENT_TYPES).forEach(n => { pendingDocs[n] = true; });

    // 3. Load locally saved docs first
    getStoredDocs().forEach(doc => {
        delete pendingDocs[doc.document_type];
        verifiedDocs[doc.document_type] = {
            data: doc.data,
            icon: (DOCUMENT_TYPES[doc.document_type] || {}).icon || SVG.doc
        };
    });

    // 4. If logged in, sync local documents to Supabase and fetch remote records
    try {
        const session = await getCurrentSession();
        if (session && session.user) {
            // Direct fetch from Supabase
            if (supabase) {
                const { data: userDocs, error } = await supabase
                    .from('user_documents')
                    .select('*')
                    .eq('uid', session.user.id);

                if (!error && Array.isArray(userDocs)) {
                    userDocs.forEach(doc => {
                        const docType = doc.document_type;
                        const isVerified = (doc.is_verified === true) || (doc.verification_status === 'verified') || (doc.is_verified === undefined && doc.verification_status === undefined);
                        if (isVerified) {
                            delete pendingDocs[docType];
                            verifiedDocs[docType] = {
                                data: doc.extracted_data || {},
                                icon: (DOCUMENT_TYPES[docType] || {}).icon || SVG.doc
                            };
                        }
                    });
                }
            }
        }
    } catch (e) {
        console.warn('[UNIORA] Could not fetch/sync remote documents:', e);
    }

    renderPending();
    renderVerified();

    // Check URL search parameters for navigation from Readiness
    const urlParams = new URLSearchParams(window.location.search);
    const targetDoc = urlParams.get('doc');
    const returnSrc = urlParams.get('return');
    const returnScheme = urlParams.get('scheme');

    if (targetDoc && DOCUMENT_TYPES[targetDoc]) {
        setTimeout(() => openWizard(targetDoc), 300);
    }

    if (returnSrc === 'readiness') {
        const headerContainer = document.querySelector('.hero-copy') || document.querySelector('.page-header') || document.querySelector('.page-heading');
        if (headerContainer && !document.getElementById('returnToReadinessBanner')) {
            const banner = document.createElement('div');
            banner.id = 'returnToReadinessBanner';
            banner.className = 'return-banner';
            banner.style.cssText = 'background:#eff6ff; border:1px solid #bfdbfe; border-radius:14px; padding:14px 18px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;';
            const schemeQuery = returnScheme ? `?scheme=${encodeURIComponent(returnScheme)}` : '';
            banner.innerHTML = `
                <div>
                    <strong style="color:#1e40af; font-size:15px;">Verifying Document for My Readiness</strong>
                    <p style="margin:2px 0 0; color:#3b82f6; font-size:13px;">Verify or upload your document below to update your scheme readiness score.</p>
                </div>
                <a href="../../../features/05_my_readiness/frontend/index.html${schemeQuery}" style="background:#2563eb; color:white; padding:10px 16px; border-radius:10px; font-weight:700; text-decoration:none; font-size:13px; display:inline-flex; align-items:center; gap:6px;">← Return to Readiness</a>
            `;
            headerContainer.insertAdjacentElement('afterend', banner);
        }
    }

    // 5. Check if a specific document was requested via URL query param (?doc=...)
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const requestedDoc = urlParams.get('doc') || urlParams.get('openDoc');
        if (requestedDoc) {
            handleRequestedDoc(requestedDoc);
        }
    } catch (e) {
        console.warn('[UNIORA] Error processing requested doc parameter:', e);
    }
}

function findCanonicalDocName(rawName) {
    if (!rawName) return null;
    const clean = rawName.trim().toLowerCase();
    for (const name of Object.keys(DOCUMENT_TYPES)) {
        if (name.toLowerCase() === clean) return name;
    }
    if (clean === 'ration card' || clean === 'smart ration card' || clean.includes('ration')) return 'Smart Ration Card';
    if (clean === 'voter id' || clean === 'voter id card' || clean === 'epic card' || clean === 'epic') return 'Voter ID Card';
    if (clean === 'aadhaar' || clean === 'aadhaar card' || clean === 'aadhar' || clean === 'aadhar card') return 'Aadhaar Card';
    if (clean === 'pan' || clean === 'pan card') return 'PAN Card';
    if (clean === 'income certificate' || clean === 'income') return 'Income Certificate';
    if (clean === 'community certificate' || clean === 'community' || clean === 'caste') return 'Community Certificate';
    if (clean === 'birth certificate' || clean === 'birth') return 'Birth Certificate';
    if (clean === 'bank passbook' || clean === 'bank' || clean === 'passbook') return 'Bank Passbook';
    if (clean === '10th marksheet' || clean === '10th' || clean === 'sslc') return '10th Marksheet';
    if (clean === '12th marksheet' || clean === '12th' || clean === 'hsc') return '12th Marksheet';
    if (clean.includes('undergraduate') || clean.includes('ug degree')) return 'Undergraduate (UG) Degree';
    if (clean.includes('diploma')) return 'Diploma Certificate';
    if (clean.includes('postgraduate') || clean.includes('pg degree')) return 'Postgraduate (PG) Degree';
    if (clean.includes('driving')) return 'Driving License';
    if (clean.includes('passport')) return 'Passport';
    if (clean.includes('domicile')) return 'Domicile Certificate';
    if (clean.includes('bpl')) return 'BPL Certificate';
    if (clean.includes('udid') || clean.includes('disability')) return 'UDID Card';
    if (clean.includes('bonafide')) return 'Bonafide Certificate';
    if (clean.includes('land')) return 'Land Ownership Document';
    if (clean.includes('electricity') || clean.includes('eb bill')) return 'Electricity Bill';
    if (clean.includes('mgnrega')) return 'MGNREGA Job Card';
    if (clean.includes('udyam')) return 'Udyam Certificate';
    if (clean.includes('gst')) return 'GST Certificate';
    if (clean.includes('marriage')) return 'Marriage Certificate';
    if (clean.includes('death')) return 'Death Certificate';
    if (clean.includes('orphan')) return 'Orphan Certificate';
    if (clean.includes('widow')) return 'Widow Certificate';
    return null;
}

function handleRequestedDoc(rawName) {
    const canonicalName = findCanonicalDocName(rawName);
    if (!canonicalName) return;

    setTimeout(() => {
        if (verifiedDocs[canonicalName]) {
            const def = DOCUMENT_TYPES[canonicalName] || { icon: SVG.doc };
            openVerifiedModal(canonicalName, verifiedDocs[canonicalName].data, def.icon);
        } else if (DOCUMENT_TYPES[canonicalName]) {
            openWizard(canonicalName);
        }
    }, 150);
}

// ============================================================
// RENDER PENDING (Single Contiguous 4-Column Grid)
// ============================================================
function renderPending() {
    const grid = document.getElementById('pendingDocGrid');
    const seeMoreFooter = document.getElementById('seeMoreFooter');
    const seeMoreText = document.getElementById('seeMoreText');
    const seeMoreChevron = document.getElementById('seeMoreChevron');
    const badge = document.getElementById('pendingCount');

    const allPending = Object.keys(pendingDocs);
    badge.textContent = `${allPending.length} pending`;
    grid.innerHTML = '';

    if (allPending.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${SVG.allVerified}</div>
                <p>All documents verified!</p>
                <p class="empty-sub">You're ready to check scheme eligibility.</p>
            </div>`;
        if (seeMoreFooter) seeMoreFooter.style.display = 'none';
        return;
    }

    const pendingPrimary = PRIMARY_DOCS.filter(n => pendingDocs[n]);
    const pendingExtended = EXTENDED_DOCS.filter(n => pendingDocs[n]);

    // 1. Append Primary documents (always visible)
    pendingPrimary.forEach(docName => grid.appendChild(makeDocCard(docName, false, {}, false)));

    // 2. Append Extended documents to the SAME grid (hidden by default via .is-extended)
    pendingExtended.forEach(docName => grid.appendChild(makeDocCard(docName, false, {}, true)));

    // 3. Control the single See More button at the bottom
    if (pendingExtended.length > 0 && seeMoreFooter) {
        seeMoreFooter.style.display = 'flex';
        if (seeMoreText) {
            seeMoreText.textContent = extendedExpanded ? 'Show Less' : `Show More Documents (${pendingExtended.length} more)`;
        }
        if (seeMoreChevron) {
            seeMoreChevron.classList.toggle('rotated', extendedExpanded);
        }
        grid.classList.toggle('is-expanded', extendedExpanded);
    } else if (seeMoreFooter) {
        seeMoreFooter.style.display = 'none';
    }
}

let extendedExpanded = false;
export function toggleExtendedDocs() {
    const grid = document.getElementById('pendingDocGrid');
    const seeMoreText = document.getElementById('seeMoreText');
    const seeMoreChevron = document.getElementById('seeMoreChevron');
    const extCount = EXTENDED_DOCS.filter(n => pendingDocs[n]).length;

    extendedExpanded = !extendedExpanded;
    if (grid) grid.classList.toggle('is-expanded', extendedExpanded);
    if (seeMoreChevron) seeMoreChevron.classList.toggle('rotated', extendedExpanded);
    if (seeMoreText) {
        seeMoreText.textContent = extendedExpanded ? 'Show Less' : `Show More Documents (${extCount} more)`;
    }
}

// ============================================================
// RENDER VERIFIED (4-Column Grid)
// ============================================================
function renderVerified() {
    const grid = document.getElementById('verifiedDocGrid');
    const badge = document.getElementById('verifiedCount');
    const keys = Object.keys(verifiedDocs);
    badge.textContent = `${keys.length} verified`;
    grid.innerHTML = '';

    if (keys.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" id="verifiedEmptyState">
                <div class="empty-icon">${SVG.folderEmpty}</div>
                <p>No verified documents yet.</p>
                <p class="empty-sub">Click any document above to get started.</p>
            </div>`;
        return;
    }

    keys.forEach(docName => {
        const { data } = verifiedDocs[docName];
        grid.appendChild(makeDocCard(docName, true, data, false));
    });
}

// ============================================================
// 3-COLUMN CARD COMPONENT GENERATOR
// ============================================================
function makeDocCard(docName, isVerified = false, data = {}, isExtended = false) {
    const def = DOCUMENT_TYPES[docName] || { icon: SVG.doc, hint: '' };
    const isHighPriority = HIGH_PRIORITY_DOCS.has(docName);
    const card = document.createElement('div');
    card.className = `doc-card ${isVerified ? 'is-verified' : ''} ${isHighPriority && !isVerified ? 'is-priority' : ''} ${isExtended ? 'is-extended' : ''}`;

    if (isVerified) {
        card.onclick = () => openVerifiedModal(docName, data, def.icon);
        card.innerHTML = `
            <div class="doc-card-top">
                <div class="doc-card-icon verified">${def.icon}</div>
                <span class="verified-pill">${SVG.checkSmall} Verified</span>
            </div>
            <div class="doc-card-title">${docName}</div>
            <div class="doc-card-hint">${def.hint}</div>
            <div class="doc-card-footer verified-footer">
                <span>View Details</span>
                <span class="doc-card-arrow">${SVG.chevronRight}</span>
            </div>
        `;
    } else {
        card.onclick = () => openWizard(docName);
        card.innerHTML = `
            <div class="doc-card-top">
                <div class="doc-card-icon">${def.icon}</div>
                ${isHighPriority ? '<span class="priority-pill">Essential</span>' : ''}
            </div>
            <div class="doc-card-title">${docName}</div>
            <div class="doc-card-hint">${def.hint}</div>
            <div class="doc-card-footer">
                <span>Upload or Type</span>
                <span class="doc-card-arrow">${SVG.chevronRight}</span>
            </div>
        `;
    }
    return card;
}

// ============================================================
// MOVE TO VERIFIED
// ============================================================
function moveToVerified(docName, data) {
    const def = DOCUMENT_TYPES[docName] || { icon: SVG.doc };
    delete pendingDocs[docName];
    verifiedDocs[docName] = { data, icon: def.icon };
    const stored = getStoredDocs().filter(d => d.document_type !== docName);
    stored.push({ document_type: docName, data, timestamp: new Date().toISOString() });
    saveStoredDocs(stored);
    try {
        const ch = new BroadcastChannel('uniora_docs_sync');
        ch.postMessage({ type: 'DOC_VERIFIED', docName, timestamp: Date.now() });
        ch.close();
    } catch (e) {}
    renderPending();
    renderVerified();
}

// ============================================================
// WIZARD MODAL
// ============================================================
export function openWizard(docName) {
    activeDocName = docName;
    wizardExtractedData = null;

    const def = DOCUMENT_TYPES[docName] || { icon: '', fields: [] };
    document.getElementById('wizardTitle').innerHTML = `<span style="display:inline-flex;align-items:center;gap:10px;vertical-align:middle;">${def.icon}</span> ${docName}`;

    // Show unverify button if document is already verified
    const unverifyBtn = document.getElementById('wizardUnverifyBtn');
    if (unverifyBtn) {
        unverifyBtn.style.display = verifiedDocs[docName] ? 'inline-block' : 'none';
    }

    buildWizardFields(def.fields, {});
    hideVerifyNotice();
    resetWizardUpload();

    document.body.classList.add('modal-open');
    document.getElementById('wizardModal').classList.add('active');
}

export function closeWizardModal() {
    document.getElementById('wizardModal').classList.remove('active');
    document.body.classList.remove('modal-open');
    activeDocName = null;
    wizardExtractedData = null;
}

const DATE_FIELDS = new Set(['date_of_birth', 'date_of_death', 'marriage_date']);

function formatDateForInput(val) {
    if (!val) return '';
    val = String(val).trim();
    // If already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    // Match DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const match = val.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        return `${year}-${month}-${day}`;
    }
    // Match YYYY only
    if (/^\d{4}$/.test(val)) {
        return `${val}-01-01`;
    }
    return '';
}

function formatDateForDisplay(val) {
    if (!val) return '';
    val = String(val).trim();
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
        return `${match[3]}/${match[2]}/${match[1]}`;
    }
    return val;
}

const FIELD_PLACEHOLDERS = {
    'aadhaar_number': 'e.g. 1234 5678 9012',
    'pan_number': 'e.g. ABCDE1234F',
    'voter_id_number': 'e.g. XSS4095964',
    'annual_income': 'e.g. ₹ 72,000',
    'ifsc_code': 'e.g. SBIN0001234',
    'account_number': 'e.g. 123456789012',
    'date_of_birth': 'Select date from calendar',
    'date_of_death': 'Select date from calendar',
    'marriage_date': 'Select date from calendar',
    'student_name': 'e.g. Sundararajan R',
    'roll_number': 'e.g. 1024567 / 21CS101',
    'register_number': 'e.g. 710021104052',
    'registration_number': 'e.g. DOTE-2021-98765',
    'board_name': 'e.g. State Board of Tamil Nadu / CBSE',
    'school_name': 'e.g. Govt Higher Secondary School, Tiruppur',
    'university_or_college': 'e.g. Anna University / PSG Tech',
    'institution': 'e.g. Govt Polytechnic College / CIT',
    'branch_or_stream': 'e.g. Computer Engineering / Science',
    'degree_name': 'e.g. B.E. Computer Science and Engineering',
    'current_course': 'e.g. B.Tech Artificial Intelligence (3rd Year)',
    'academic_year': 'e.g. 2024-2025',
    'year_of_passing': 'e.g. 2024',
    'obtained_marks': 'e.g. 485',
    'maximum_marks': 'e.g. 500 (or leave empty if unknown)',
    'percentage': 'e.g. 97.00% (Auto-calculated or direct %)',
    'cgpa': 'e.g. 8.75 / 10',
    'qualification': 'e.g. B.Tech Computer Science / 12th',
    'social_category': 'e.g. OBC / BC / MBC / SC / ST',
    'caste': 'e.g. Kongu Vellalar / Nadar / Adidravidar',
    'ration_card_number': 'e.g. 330123456789',
    'ration_category': 'e.g. PHH / NPHH / AAY',
    'license_number': 'e.g. TN38 20210001234',
    'passport_number': 'e.g. Z1234567',
    'consumer_number': 'e.g. 03-123-456-789',
    'gst_number': 'e.g. 33AAAAA0000A1Z5',
    'business_registration': 'e.g. UDYAM-TN-01-0012345',
    'disability_percentage': 'e.g. 40%',
    'disability_type': 'e.g. Locomotor / Visual',
    'land_area': 'e.g. 1.5 Acres',
    'place_of_birth': 'e.g. Tiruppur, Tamil Nadu',
    'issuing_authority': 'e.g. Tahsildar / Revenue Dept',
};

function validateDocumentField(field, rawValue) {
    const val = (rawValue || '').trim();
    const label = field.replace(/_/g, ' ');

    // Optional fields when percentage/marks are alternatives
    if (field === 'maximum_marks' && !val) {
        return null; // Maximum marks is optional if percentage/obtained marks provided
    }
    if (field === 'obtained_marks' && !val) {
        const pct = document.getElementById('wf-percentage')?.value.trim();
        const cgpa = document.getElementById('wf-cgpa')?.value.trim();
        if (pct || cgpa) return null;
        return 'Please enter obtained marks or percentage.';
    }
    if (field === 'percentage' && !val) {
        const obt = document.getElementById('wf-obtained_marks')?.value.trim();
        const cgpa = document.getElementById('wf-cgpa')?.value.trim();
        if (obt || cgpa) return null;
        return 'Please enter percentage (or marks).';
    }

    if (!val) {
        return `Please enter ${label}.`;
    }

    switch (field) {
        case 'aadhaar_number': {
            const digits = val.replace(/\s+/g, '');
            if (!/^\d{12}$/.test(digits)) {
                return 'Aadhaar number must be exactly 12 digits (e.g. 1234 5678 9012).';
            }
            break;
        }
        case 'pan_number': {
            const clean = val.toUpperCase().replace(/\s+/g, '');
            if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(clean)) {
                return 'PAN must be 10 characters in standard format (e.g. ABCDE1234F).';
            }
            break;
        }
        case 'voter_id_number': {
            const clean = val.toUpperCase().replace(/\s+/g, '');
            if (clean.length < 6 || clean.length > 18) {
                return 'Voter ID / EPIC must be 6 to 18 characters (e.g. XSS4095964).';
            }
            break;
        }
        case 'annual_income': {
            const digits = val.replace(/[^0-9]/g, '');
            if (!digits || parseInt(digits, 10) <= 0) {
                return 'Please enter a valid annual income amount (e.g. ₹ 72,000).';
            }
            break;
        }
        case 'ifsc_code': {
            const clean = val.toUpperCase().replace(/\s+/g, '');
            if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean)) {
                return 'IFSC code must be 11 characters (e.g. SBIN0001234).';
            }
            break;
        }
        case 'account_number': {
            const digits = val.replace(/\s+/g, '');
            if (!/^\d{9,18}$/.test(digits)) {
                return 'Bank account number must be between 9 and 18 digits.';
            }
            break;
        }
        case 'date_of_birth':
        case 'date_of_death':
        case 'marriage_date': {
            const isIso = /^\d{4}-\d{2}-\d{2}$/.test(val);
            const isDdMm = /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}|\d{4})$/.test(val);
            if (!isIso && !isDdMm) {
                return `Please select a valid date in calendar.`;
            }
            if (field === 'date_of_birth' || field === 'date_of_death') {
                const dateObj = new Date(isIso ? val : val.split(/[\/\-.]/).reverse().join('-'));
                if (dateObj > new Date()) {
                    return `${label.charAt(0).toUpperCase() + label.slice(1)} cannot be in the future.`;
                }
            }
            break;
        }
        case 'year_of_passing': {
            const clean = val.replace(/[^0-9]/g, '');
            const year = parseInt(clean, 10);
            if (!clean || clean.length !== 4 || year < 1950 || year > new Date().getFullYear() + 2) {
                return 'Please enter a valid 4-digit passing year (e.g. 2024).';
            }
            break;
        }
        case 'academic_year': {
            if (val.length < 4) {
                return 'Please enter academic year (e.g. 2024-2025).';
            }
            break;
        }
        case 'obtained_marks': {
            const num = parseFloat(val.replace(/[^\d.]/g, ''));
            if (isNaN(num) || num < 0) {
                return 'Please enter a valid obtained mark (e.g. 485).';
            }
            const maxVal = document.getElementById('wf-maximum_marks')?.value.trim();
            if (maxVal) {
                const maxNum = parseFloat(maxVal.replace(/[^\d.]/g, ''));
                if (!isNaN(maxNum) && num > maxNum) {
                    return 'Obtained marks cannot exceed maximum marks.';
                }
            }
            break;
        }
        case 'maximum_marks': {
            if (val) {
                const num = parseFloat(val.replace(/[^\d.]/g, ''));
                if (isNaN(num) || num <= 0) {
                    return 'Please enter a valid maximum mark (e.g. 500).';
                }
            }
            break;
        }
        case 'percentage': {
            const clean = val.replace('%', '').trim();
            const num = parseFloat(clean);
            if (isNaN(num) || num < 1 || num > 100) {
                return 'Please enter a valid percentage between 1% and 100% (e.g. 94.5%).';
            }
            break;
        }
        case 'cgpa': {
            const clean = val.replace('/10', '').replace('CGPA', '').trim();
            const num = parseFloat(clean);
            if (isNaN(num) || num < 0 || num > 10) {
                return 'Please enter a valid CGPA between 0.0 and 10.0 (e.g. 8.45).';
            }
            break;
        }
        case 'gst_number': {
            const clean = val.toUpperCase().replace(/\s+/g, '');
            if (clean.length !== 15) {
                return 'GSTIN must be 15 alphanumeric characters (e.g. 33AAAAA0000A1Z5).';
            }
            break;
        }
        case 'name':
        case 'student_name':
        case 'owner_name':
        case 'spouse_name':
        case 'deceased_name': {
            if (val.length < 2 || /^\d+$/.test(val)) {
                return `Please enter a valid ${label} (minimum 2 characters).`;
            }
            break;
        }
        case 'roll_number':
        case 'register_number':
        case 'registration_number': {
            if (val.length < 3) {
                return `Please enter a valid ${label} (minimum 3 characters).`;
            }
            break;
        }
        case 'board_name': {
            if (val.length < 3) {
                return 'Please enter the board name (e.g. State Board of Tamil Nadu / CBSE).';
            }
            break;
        }
        case 'school_name':
        case 'university_or_college':
        case 'institution': {
            if (val.length < 3) {
                return `Please enter the ${label} (minimum 3 characters).`;
            }
            break;
        }
        case 'branch_or_stream':
        case 'degree_name':
        case 'current_course': {
            if (val.length < 2) {
                return `Please enter the ${label}.`;
            }
            break;
        }
        case 'address': {
            if (val.length < 5) {
                return 'Please enter a complete address (minimum 5 characters).';
            }
            break;
        }
        case 'disability_percentage': {
            const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
            if (isNaN(num) || num < 1 || num > 100) {
                return 'Please enter a valid percentage between 1% and 100%.';
            }
            break;
        }
    }

    return null; // Valid field
}

function buildWizardFields(fields, values) {
    const container = document.getElementById('wizardFields');
    container.innerHTML = '';
    const todayIso = new Date().toISOString().split('T')[0];
    const renderedFields = new Set();

    fields.forEach(field => {
        if (renderedFields.has(field)) return;

        // Group obtained_marks and maximum_marks side by side in a 2-column grid
        if (field === 'obtained_marks' && fields.includes('maximum_marks')) {
            renderedFields.add('obtained_marks');
            renderedFields.add('maximum_marks');

            const row = document.createElement('div');
            row.className = 'form-row-2col';

            // Obtained Marks col
            const obtGroup = document.createElement('div');
            obtGroup.className = 'form-group';
            obtGroup.innerHTML = `
                <label for="wf-obtained_marks">Marks Obtained <span class="form-label-badge">Scored</span></label>
                <input type="text" id="wf-obtained_marks" class="form-control"
                       value="${values['obtained_marks'] || ''}"
                       placeholder="${FIELD_PLACEHOLDERS['obtained_marks']}">
                <span class="field-error-msg" id="err-wf-obtained_marks"></span>`;

            // Maximum Marks col
            const maxGroup = document.createElement('div');
            maxGroup.className = 'form-group';
            maxGroup.innerHTML = `
                <label for="wf-maximum_marks">Maximum Marks <span class="form-label-badge">Total</span></label>
                <input type="text" id="wf-maximum_marks" class="form-control"
                       value="${values['maximum_marks'] || ''}"
                       placeholder="${FIELD_PLACEHOLDERS['maximum_marks']}">
                <span class="field-error-msg" id="err-wf-maximum_marks"></span>`;

            row.appendChild(obtGroup);
            row.appendChild(maxGroup);
            container.appendChild(row);

            attachFieldValidation('obtained_marks', obtGroup.querySelector('input'), obtGroup);
            attachFieldValidation('maximum_marks', maxGroup.querySelector('input'), maxGroup);
            return;
        }

        renderedFields.add(field);
        const isDateField = DATE_FIELDS.has(field);
        const placeholder = FIELD_PLACEHOLDERS[field] || `Enter ${field.replace(/_/g, ' ')}...`;
        const g = document.createElement('div');
        g.className = 'form-group';

        let badgeHtml = '';
        if (field === 'percentage') {
            badgeHtml = `<span class="form-label-badge">Auto-calculated or %</span>`;
        } else if (field === 'cgpa') {
            badgeHtml = `<span class="form-label-badge">Scale 10.0</span>`;
        }

        if (isDateField) {
            const rawVal = values[field] || '';
            const inputVal = formatDateForInput(rawVal);
            const maxAttr = (field === 'date_of_birth' || field === 'date_of_death') ? `max="${todayIso}"` : '';
            g.innerHTML = `
                <label for="wf-${field}">${field.replace(/_/g, ' ')} ${badgeHtml}</label>
                <input type="date" id="wf-${field}" class="form-control date-input"
                       value="${inputVal}"
                       ${maxAttr}>
                <span class="field-error-msg" id="err-wf-${field}"></span>`;
        } else {
            g.innerHTML = `
                <label for="wf-${field}">${field.replace(/_/g, ' ')} ${badgeHtml}</label>
                <input type="text" id="wf-${field}" class="form-control"
                       value="${values[field] || ''}"
                       placeholder="${placeholder}">
                <span class="field-error-msg" id="err-wf-${field}"></span>`;
        }

        attachFieldValidation(field, g.querySelector('input'), g);
        container.appendChild(g);
    });

    setupDynamicCalculations();
}

function attachFieldValidation(field, input, groupEl) {
    if (!input) return;
    const handleEvent = () => {
        const errorMsg = validateDocumentField(field, input.value);
        const errEl = groupEl.querySelector(`#err-wf-${field}`);
        if (!errorMsg) {
            input.classList.remove('is-invalid');
            if (errEl) {
                errEl.textContent = '';
                errEl.classList.remove('visible');
            }
        }
    };
    input.addEventListener('input', handleEvent);
    input.addEventListener('change', handleEvent);
}

function setupDynamicCalculations() {
    const obtInput = document.getElementById('wf-obtained_marks');
    const maxInput = document.getElementById('wf-maximum_marks');
    const pctInput = document.getElementById('wf-percentage');
    const cgpaInput = document.getElementById('wf-cgpa');

    const computeFromMarks = () => {
        if (!obtInput || !pctInput) return;
        const obtRaw = obtInput.value.replace(/[^\d.]/g, '');
        const maxRaw = maxInput ? maxInput.value.replace(/[^\d.]/g, '') : '';
        if (obtRaw && maxRaw) {
            const obt = parseFloat(obtRaw);
            const max = parseFloat(maxRaw);
            if (!isNaN(obt) && !isNaN(max) && max > 0 && obt <= max) {
                const pct = ((obt / max) * 100).toFixed(2);
                pctInput.value = `${pct}%`;
                pctInput.classList.remove('is-invalid');
                const err = document.getElementById('err-wf-percentage');
                if (err) { err.textContent = ''; err.classList.remove('visible'); }
            }
        }
    };

    const computeFromCgpa = () => {
        if (!cgpaInput || !pctInput) return;
        const cgpaRaw = cgpaInput.value.replace(/[^\d.]/g, '');
        if (cgpaRaw) {
            const cgpa = parseFloat(cgpaRaw);
            if (!isNaN(cgpa) && cgpa >= 0 && cgpa <= 10) {
                if (!pctInput.value || pctInput.dataset.autoFilledCgpa === 'true') {
                    pctInput.value = `${(cgpa * 10).toFixed(1)}%`;
                    pctInput.dataset.autoFilledCgpa = 'true';
                    pctInput.classList.remove('is-invalid');
                    const err = document.getElementById('err-wf-percentage');
                    if (err) { err.textContent = ''; err.classList.remove('visible'); }
                }
            }
        }
    };

    if (obtInput) {
        obtInput.addEventListener('input', computeFromMarks);
        obtInput.addEventListener('change', computeFromMarks);
    }
    if (maxInput) {
        maxInput.addEventListener('input', computeFromMarks);
        maxInput.addEventListener('change', computeFromMarks);
    }
    if (cgpaInput) {
        cgpaInput.addEventListener('input', computeFromCgpa);
        cgpaInput.addEventListener('change', computeFromCgpa);
    }
    if (pctInput) {
        pctInput.addEventListener('input', () => {
            pctInput.dataset.autoFilledCgpa = 'false';
        });
    }
}

function fillWizardFields(data) {
    for (const [key, value] of Object.entries(data)) {
        const el = document.getElementById(`wf-${key}`);
        const errEl = document.getElementById(`err-wf-${key}`);
        if (el) {
            if (DATE_FIELDS.has(key)) {
                el.value = formatDateForInput(value);
            } else if (key === 'obtained_marks' || key === 'maximum_marks') {
                el.value = String(value || '').replace(/^0+(?=\d)/, '');
            } else {
                el.value = value || '';
            }
            el.classList.remove('is-invalid');
        }
        if (errEl) {
            errEl.textContent = '';
            errEl.classList.remove('visible');
        }
    }

    // Trigger auto-calculation if marks exist but percentage is empty
    const obtInput = document.getElementById('wf-obtained_marks');
    const maxInput = document.getElementById('wf-maximum_marks');
    const pctInput = document.getElementById('wf-percentage');
    const cgpaInput = document.getElementById('wf-cgpa');

    if (pctInput && !pctInput.value) {
        if (obtInput && maxInput && obtInput.value && maxInput.value) {
            const obt = parseFloat(obtInput.value.replace(/[^\d.]/g, ''));
            const max = parseFloat(maxInput.value.replace(/[^\d.]/g, ''));
            if (!isNaN(obt) && !isNaN(max) && max > 0 && obt <= max) {
                pctInput.value = `${((obt / max) * 100).toFixed(2)}%`;
            }
        } else if (cgpaInput && cgpaInput.value) {
            const cgpa = parseFloat(cgpaInput.value.replace(/[^\d.]/g, ''));
            if (!isNaN(cgpa) && cgpa >= 0 && cgpa <= 10) {
                pctInput.value = `${(cgpa * 10).toFixed(1)}%`;
                pctInput.dataset.autoFilledCgpa = 'true';
            }
        }
    }
}

function showVerifyNotice() { document.getElementById('wizardVerifyNotice').style.display = 'flex'; }
function hideVerifyNotice() { document.getElementById('wizardVerifyNotice').style.display = 'none'; }

let selectedWizardFile = null;

function resetWizardUpload() {
    selectedWizardFile = null;
    const fileInput = document.getElementById('wizardFileInput');
    if (fileInput) fileInput.value = '';
    document.getElementById('wizardUploadText').style.display = 'block';
    document.getElementById('wizardFileInfo').style.display = 'none';
    document.getElementById('wizardExtractBtn').style.display = 'none';
    document.getElementById('wizardExtractStatus').textContent = '';
    hideVerifyNotice();
}

export function clearWizardFile() { resetWizardUpload(); }

// Attach drag-and-drop listeners
document.addEventListener('DOMContentLoaded', () => {
    const dropZone  = document.getElementById('wizardUploadBox');
    const fileInput = document.getElementById('wizardFileInput');
    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
            showFileSelected(e.dataTransfer.files[0]);
        }
    });
    fileInput.addEventListener('change', e => {
        if (e.target && e.target.files && e.target.files[0]) {
            showFileSelected(e.target.files[0]);
        }
    });
});

function showFileSelected(file) {
    selectedWizardFile = file;
    document.getElementById('wizardUploadText').style.display = 'none';
    document.getElementById('wizardFileInfo').style.display = 'block';
    document.getElementById('wizardFileName').textContent = file.name;
    document.getElementById('wizardExtractBtn').style.display = 'block';
}

export async function runExtraction() {
    const file = selectedWizardFile || (document.getElementById('wizardFileInput') ? document.getElementById('wizardFileInput').files[0] : null);
    if (!file) { alert('Please select a file first.'); return; }

    const btn = document.getElementById('wizardExtractBtn');
    const status = document.getElementById('wizardExtractStatus');
    btn.innerHTML = `${SVG.spinner} <span>Extracting...</span>`;
    btn.disabled = true;
    status.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;color:#64748b;">${SVG.spinner} AI is reading your document…</span>`;
    hideVerifyNotice();

    try {
        const formData = new FormData();
        formData.append('file', file);
        const res  = await fetch('http://localhost:8000/api/documents/process', { method: 'POST', body: formData });
        const resp = await res.json();

        if (resp.status === 'error') {
            status.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;color:#dc2626;">${SVG.alert} ${resp.message}</span>`;
            return;
        }

        wizardExtractedData = resp.extracted_data || {};
        fillWizardFields(wizardExtractedData);
        status.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;color:#16a34a;">${SVG.check} Extraction complete — please verify below.</span>`;
        showVerifyNotice();

    } catch (err) {
        status.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;color:#dc2626;">${SVG.alert} Could not connect to backend. Please check the server.</span>`;
        console.error(err);
    } finally {
        btn.innerHTML = `${SVG.sparkles} <span>Extract with AI</span>`;
        btn.disabled = false;
    }
}

export async function saveWizardDocument() {
    if (!activeDocName) return;
    const def = DOCUMENT_TYPES[activeDocName] || { fields: [] };

    let hasErrors = false;
    let firstInvalidInput = null;
    const finalData = {};

    def.fields.forEach(field => {
        const el = document.getElementById(`wf-${field}`);
        const errEl = document.getElementById(`err-wf-${field}`);
        const val = el ? el.value.trim() : '';
        finalData[field] = DATE_FIELDS.has(field) ? formatDateForDisplay(val) : val;

        const errorMsg = validateDocumentField(field, val);
        if (errorMsg) {
            hasErrors = true;
            if (el) {
                el.classList.add('is-invalid');
                if (!firstInvalidInput) firstInvalidInput = el;
            }
            if (errEl) {
                errEl.textContent = errorMsg;
                errEl.classList.add('visible');
            }
        } else {
            if (el) el.classList.remove('is-invalid');
            if (errEl) {
                errEl.textContent = '';
                errEl.classList.remove('visible');
            }
        }
    });

    // Stop and focus the first invalid field if errors exist
    if (hasErrors) {
        if (firstInvalidInput) firstInvalidInput.focus();
        return;
    }

    const saveBtn = document.getElementById('wizardSaveBtn');
    saveBtn.textContent = 'Saving…';
    saveBtn.disabled = true;

    try {
        const session = await getCurrentSession();
        if (session && session.user) {
            // 1. Direct Supabase save (Browser client has user auth token attached)
            if (supabase) {
                const { data: existing } = await supabase
                    .from('user_documents')
                    .select('id')
                    .eq('uid', session.user.id)
                    .eq('document_type', activeDocName);

                if (existing && existing.length > 0) {
                    await supabase
                        .from('user_documents')
                        .update({
                            is_verified: true,
                            extracted_data: finalData
                        })
                        .eq('id', existing[0].id);
                } else {
                    await supabase
                        .from('user_documents')
                        .insert({
                            uid: session.user.id,
                            document_type: activeDocName,
                            is_verified: true,
                            extracted_data: finalData
                        });
                }
            }

            // 2. Also notify backend with Bearer token
            try {
                await fetch('http://localhost:8000/api/documents/confirm', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ document_type: activeDocName, extracted_data: finalData })
                });
            } catch (backendErr) {
                console.warn('[UNIORA] Backend sync notice:', backendErr);
            }
        }
    } catch (e) {
        console.warn('[UNIORA] Supabase save error:', e);
    }

    moveToVerified(activeDocName, finalData);
    closeWizardModal();
    saveBtn.textContent = 'Save & Verify ✓';
    saveBtn.disabled = false;
}

// ============================================================
// VERIFIED DETAIL MODAL
// ============================================================
export function openVerifiedModal(docName, data, icon) {
    activeDocName = docName;
    document.getElementById('verifiedModalTitle').innerHTML = `<span style="display:inline-flex;align-items:center;gap:10px;vertical-align:middle;">${icon}</span> ${docName}`;
    const body = document.getElementById('verifiedModalBody');
    body.innerHTML = '';
    for (const [key, value] of Object.entries(data)) {
        const div = document.createElement('div');
        div.className = 'modal-field';
        div.innerHTML = `
            <div class="modal-label">${key.replace(/_/g, ' ')}</div>
            <div class="modal-value">${value || '—'}</div>`;
        body.appendChild(div);
    }
    document.body.classList.add('modal-open');
    document.getElementById('verifiedDetailModal').classList.add('active');
}

export function closeVerifiedModal() {
    document.getElementById('verifiedDetailModal').classList.remove('active');
    document.body.classList.remove('modal-open');
}

export function reupdateDocument() {
    const docName = activeDocName;
    closeVerifiedModal();
    if (!docName) return;
    delete verifiedDocs[docName];
    pendingDocs[docName] = true;
    const stored = getStoredDocs().filter(d => d.document_type !== docName);
    saveStoredDocs(stored);
    renderPending();
    renderVerified();
    setTimeout(() => openWizard(docName), 200);
}

export async function unverifyCurrentDocument() {
    const docName = activeDocName;
    if (!docName) return;

    if (!confirm(`Are you sure you want to remove ${docName} from verified documents?`)) {
        return;
    }

    // 1. Remove from local memory immediately
    delete verifiedDocs[docName];
    pendingDocs[docName] = true;

    // 2. Remove from local storage
    const stored = getStoredDocs().filter(d => d.document_type !== docName);
    saveStoredDocs(stored);

    // 3. Remove from Supabase if authenticated
    try {
        const session = await getCurrentSession();
        if (session && session.user) {
            // A. Direct browser Supabase deletion
            if (supabase) {
                const { error: dbErr } = await supabase
                    .from('user_documents')
                    .delete()
                    .eq('uid', session.user.id)
                    .eq('document_type', docName);

                if (dbErr) {
                    console.warn('[UNIORA] Supabase client delete notice:', dbErr);
                }
            }

            // B. Backend API deletion
            try {
                await fetch('http://localhost:8000/api/documents/remove', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ document_type: docName })
                });
            } catch (backendErr) {
                console.warn('[UNIORA] Backend remove sync notice:', backendErr);
            }
        }
    } catch (e) {
        console.warn('[UNIORA] Supabase delete error:', e);
    }

    // 4. Close modals and update UI
    try {
        const ch = new BroadcastChannel('uniora_docs_sync');
        ch.postMessage({ type: 'DOC_UNVERIFIED', docName, timestamp: Date.now() });
        ch.close();
    } catch (e) {}
    closeWizardModal();
    closeVerifiedModal();
    renderPending();
    renderVerified();
}

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeWizardModal();
        closeVerifiedModal();
    }
});

// Close modals when user clicks outside the modal content box
document.addEventListener('DOMContentLoaded', () => {
    ['wizardModal', 'verifiedDetailModal'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.addEventListener('mousedown', (e) => {
                if (e.target === modal) {
                    closeWizardModal();
                    closeVerifiedModal();
                }
            });
        }
    });
});

// Expose handlers to window for HTML onclick attributes
window.openWizard = openWizard;
window.closeWizardModal = closeWizardModal;
window.clearWizardFile = clearWizardFile;
window.runExtraction = runExtraction;
window.saveWizardDocument = saveWizardDocument;
window.openVerifiedModal = openVerifiedModal;
window.closeVerifiedModal = closeVerifiedModal;
window.reupdateDocument = reupdateDocument;
window.unverifyCurrentDocument = unverifyCurrentDocument;
window.toggleExtendedDocs = toggleExtendedDocs;

// Start app
initApp();
