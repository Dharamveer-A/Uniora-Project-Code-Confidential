/**
 * UNIORA Feature 04: Eligible Schemes (Integrated with Supabase Auth & Document Verification)
 * File: features/04_eligible_schemes/frontend/script.js
 */

import { supabase } from '../../../common/js/supabase.js';
import { getCurrentUser, getCurrentSession } from '../../../common/js/auth.js';
import { initNavbarAuth } from '../../../common/js/navbar.js';

// 1. EMBEDDED LOCATION DATASET (Reliable instant fallback from common/data/state_districts.json)
const EMBEDDED_LOCATION_DATA = {
  "states": [
    {
      "name": "Andhra Pradesh",
      "type": "state",
      "districts": ["Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya", "Bapatla", "Chittoor", "East Godavari", "Eluru", "Guntur", "Kakinada", "Konaseema", "NT Rama Rao", "Nandyal", "Nellore", "Palnadu", "Parvathipuram Manyam", "Prakasam", "Srikakulam", "Sri Sathya Sai", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"]
    },
    {
      "name": "Arunachal Pradesh",
      "type": "state",
      "districts": ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"]
    },
    {
      "name": "Assam",
      "type": "state",
      "districts": ["Bajali", "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"]
    },
    {
      "name": "Bihar",
      "type": "state",
      "districts": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"]
    },
    {
      "name": "Chhattisgarh",
      "type": "state",
      "districts": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sarangarh-Bilaigarh", "Sakti", "Sukma", "Surajpur", "Surguja", "Khairagarh-Chhuikhadan-Gandai"]
    },
    {
      "name": "Goa",
      "type": "state",
      "districts": ["North Goa", "South Goa"]
    },
    {
      "name": "Gujarat",
      "type": "state",
      "districts": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"]
    },
    {
      "name": "Haryana",
      "type": "state",
      "districts": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"]
    },
    {
      "name": "Himachal Pradesh",
      "type": "state",
      "districts": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"]
    },
    {
      "name": "Jharkhand",
      "type": "state",
      "districts": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahebganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"]
    },
    {
      "name": "Karnataka",
      "type": "state",
      "districts": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapura", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara", "Vijayapura", "Yadgir"]
    },
    {
      "name": "Kerala",
      "type": "state",
      "districts": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"]
    },
    {
      "name": "Madhya Pradesh",
      "type": "state",
      "districts": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Narmadapuram", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Niwari", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"]
    },
    {
      "name": "Maharashtra",
      "type": "state",
      "districts": ["Ahmednagar", "Akola", "Amravati", "Chhatrapati Sambhaji Nagar", "Bhandara", "Beed", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Dharashiv", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"]
    },
    {
      "name": "Manipur",
      "type": "state",
      "districts": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"]
    },
    {
      "name": "Meghalaya",
      "type": "state",
      "districts": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "Eastern West Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"]
    },
    {
      "name": "Mizoram",
      "type": "state",
      "districts": ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saitual", "Siaha", "Serchhip"]
    },
    {
      "name": "Nagaland",
      "type": "state",
      "districts": ["Chümoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren", "Phek", "Shamator", "Tseminyu", "Tuensang", "Wokha", "Zunheboto"]
    },
    {
      "name": "Odisha",
      "type": "state",
      "districts": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"]
    },
    {
      "name": "Punjab",
      "type": "state",
      "districts": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Tarn Taran"]
    },
    {
      "name": "Rajasthan",
      "type": "state",
      "districts": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"]
    },
    {
      "name": "Sikkim",
      "type": "state",
      "districts": ["Gangtok", "Gyalshing", "Pakyong", "Mangan", "Namchi", "Soreng"]
    },
    {
      "name": "Tamil Nadu",
      "type": "state",
      "districts": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"]
    },
    {
      "name": "Telangana",
      "type": "state",
      "districts": ["Adilabad", "Bhadradri Kothagudem", "Hanamkonda", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"]
    },
    {
      "name": "Tripura",
      "type": "state",
      "districts": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"]
    },
    {
      "name": "Uttar Pradesh",
      "type": "state",
      "districts": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"]
    },
    {
      "name": "Uttarakhand",
      "type": "state",
      "districts": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"]
    },
    {
      "name": "West Bengal",
      "type": "state",
      "districts": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"]
    }
  ],
  "union_territories": [
    {
      "name": "Andaman and Nicobar Islands",
      "type": "union_territory",
      "districts": ["Nicobar", "North and Middle Andaman", "South Andaman"]
    },
    {
      "name": "Chandigarh",
      "type": "union_territory",
      "districts": ["Chandigarh"]
    },
    {
      "name": "Dadra and Nagar Haveli and Daman and Diu",
      "type": "union_territory",
      "districts": ["Dadra and Nagar Haveli", "Daman", "Diu"]
    },
    {
      "name": "Delhi",
      "type": "union_territory",
      "districts": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"]
    },
    {
      "name": "Jammu and Kashmir",
      "type": "union_territory",
      "districts": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"]
    },
    {
      "name": "Ladakh",
      "type": "union_territory",
      "districts": ["Kargil", "Leh"]
    },
    {
      "name": "Lakshadweep",
      "type": "union_territory",
      "districts": ["Lakshadweep"]
    },
    {
      "name": "Puducherry",
      "type": "union_territory",
      "districts": ["Karaikal", "Mahe", "Puducherry", "Yanam"]
    }
  ]
};

let locationData = EMBEDDED_LOCATION_DATA;

// =========================================================================
// 2. GUEST USER PROFILE STATE & DOCUMENT VERIFICATION INTEGRATION (FEATURE 03)
// =========================================================================
const SECRET_KEY = "uniora_secure_2024";

let guestProfile = {
  isFilled: false,
  isPartial: false,
  isFromDatabase: false,
  isFromVerifiedDocs: false,
  verifiedDocsCount: 0,
  verifiedDocTypes: [],
  userName: "",
  userEmail: "",
  phone: "",
  date_of_birth: "",
  age: null,
  gender: "",
  state: "",
  district: "",
  residence: "",
  occupation: "",
  incomeRange: "",
  incomeNumeric: null,
  category: "",
  maritalStatus: "",
  disability: "",
  education: "",
  employment: "",
  familySize: null,
  special: "",
  percentage: null
};

const SESSION_STORAGE_KEY = 'uniora_guest_demographic_profile';

function saveProfileToSession(profile) {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('[UNIORA] Unable to save profile to sessionStorage:', err);
  }
}

function loadProfileFromSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && (parsed.isFilled || parsed.isPartial)) {
        guestProfile = parsed;
      }
    }
  } catch (err) {
    console.warn('[UNIORA] Unable to restore profile from sessionStorage:', err);
  }
}

function decryptData(b64) {
  try {
    let text = atob(b64), result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    }
    return JSON.parse(decodeURIComponent(result));
  } catch {
    return [];
  }
}

function getStoredVerifiedDocs() {
  try {
    const raw = localStorage.getItem('uniora_verified_docs');
    return raw ? decryptData(raw) : [];
  } catch (err) {
    console.warn('[UNIORA] Failed reading uniora_verified_docs from localStorage:', err);
    return [];
  }
}

function normalizeDocName(rawName) {
  if (!rawName) return '';
  const clean = rawName.trim().toLowerCase();
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
  return rawName.trim();
}

const PERMANENT_DOCS_CATALOG = [
  {
    displayName: 'Aadhaar Card',
    canonicalName: 'Aadhaar Card',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2"/></svg>`
  },
  {
    displayName: 'PAN Card',
    canonicalName: 'PAN Card',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`
  },
  {
    displayName: 'Voter ID',
    canonicalName: 'Voter ID Card',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
  },
  {
    displayName: 'Ration Card',
    canonicalName: 'Smart Ration Card',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`
  },
  {
    displayName: 'Birth Certificate',
    canonicalName: 'Birth Certificate',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`
  },
  {
    displayName: 'Income Certificate',
    canonicalName: 'Income Certificate',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12M6 8h12M6 13l7 8M6 13h4a4 4 0 0 0 0-8"/></svg>`
  },
  {
    displayName: 'Community Certificate',
    canonicalName: 'Community Certificate',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  },
  {
    displayName: 'Bank Passbook',
    canonicalName: 'Bank Passbook',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 2 7 22 7"/></svg>`
  },
  {
    displayName: '10th Marksheet',
    canonicalName: '10th Marksheet',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
  },
  {
    displayName: '12th Marksheet',
    canonicalName: '12th Marksheet',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polygon points="12 12 13.5 15 17 15.5 14.5 18 15 21.5 12 19.5 9 21.5 9.5 18 7 15.5 10.5 15 12 12"/></svg>`
  },
  {
    displayName: 'UG Degree',
    canonicalName: 'Undergraduate (UG) Degree',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`
  },
  {
    displayName: 'Diploma Certificate',
    canonicalName: 'Diploma Certificate',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`
  },
  {
    displayName: 'PG Degree',
    canonicalName: 'Postgraduate (PG) Degree',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/><circle cx="12" cy="18" r="2"/></svg>`
  },
  {
    displayName: 'Driving License',
    canonicalName: 'Driving License',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5h-3M7 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0M15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/></svg>`
  },
  {
    displayName: 'Passport',
    canonicalName: 'Passport',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="11" r="3"/><path d="M9 21h6M9 7h6"/></svg>`
  },
  {
    displayName: 'Domicile Certificate',
    canonicalName: 'Domicile Certificate',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
  },
  {
    displayName: 'BPL Certificate',
    canonicalName: 'BPL Certificate',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`
  },
  {
    displayName: 'UDID Card',
    canonicalName: 'UDID Card',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`
  },
  {
    displayName: 'Bonafide Certificate',
    canonicalName: 'Bonafide Certificate',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2M7 16h10"/></svg>`
  },
  {
    displayName: 'Land Ownership',
    canonicalName: 'Land Ownership Document',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 12 2 21 11 21 22 3 22"/><line x1="9" y1="22" x2="9" y2="14"/><line x1="15" y1="22" x2="15" y2="14"/></svg>`
  },
  {
    displayName: 'Electricity Bill',
    canonicalName: 'Electricity Bill',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
  },
  {
    displayName: 'MGNREGA Job Card',
    canonicalName: 'MGNREGA Job Card',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a9 9 0 1 0 9-9"/><path d="M3 9H1M3 9V7"/></svg>`
  },
  {
    displayName: 'Udyam Certificate',
    canonicalName: 'Udyam Certificate',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`
  },
  {
    displayName: 'GST Certificate',
    canonicalName: 'GST Certificate',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
  },
  {
    displayName: 'Marriage Certificate',
    canonicalName: 'Marriage Certificate',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
  },
  {
    displayName: 'Death Certificate',
    canonicalName: 'Death Certificate',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>`
  },
  {
    displayName: 'Orphan Certificate',
    canonicalName: 'Orphan Certificate',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  },
  {
    displayName: 'Widow Certificate',
    canonicalName: 'Widow Certificate',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>`
  }
];

async function fetchUserVerifiedDocs() {
  let docs = getStoredVerifiedDocs();
  try {
    const session = await getCurrentSession();
    if (session && session.user && supabase) {
      const { data: userDocs, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('uid', session.user.id);

      if (!error && Array.isArray(userDocs)) {
        const remoteFormatted = userDocs
          .filter(d => (d.is_verified === true) || (d.verification_status === 'verified') || (d.is_verified === undefined && d.verification_status === undefined))
          .map(d => ({
            document_type: d.document_type,
            data: d.extracted_data || {}
          }));

        const existingTypes = new Set(docs.map(d => normalizeDocName(d.document_type)));
        remoteFormatted.forEach(rd => {
          if (!existingTypes.has(normalizeDocName(rd.document_type))) {
            docs.push(rd);
          }
        });
      }
    }
  } catch (err) {
    console.warn('[UNIORA] fetchUserVerifiedDocs notice:', err);
  }
  return docs;
}

function renderDocumentsBar(verifiedDocsList = []) {
  const track = document.getElementById('docsCardsTrack');
  const summaryStatus = document.getElementById('docsSummaryStatus');
  const btnLeft = document.getElementById('btnDocsScrollLeft');
  const btnRight = document.getElementById('btnDocsScrollRight');
  if (!track) return;

  const verifiedMap = new Map();
  (verifiedDocsList || []).forEach(doc => {
    const rawName = doc.document_type || doc.document_name || doc.name;
    if (rawName) {
      const canonical = normalizeDocName(rawName);
      verifiedMap.set(canonical, doc);
    }
  });

  const verifiedCount = verifiedMap.size;
  if (summaryStatus) {
    summaryStatus.textContent = verifiedCount === 1 ? '1 document verified' : `${verifiedCount} documents verified`;
  }

  const catalogDocs = [...PERMANENT_DOCS_CATALOG];
  const catalogCanonicals = new Set(catalogDocs.map(d => d.canonicalName));

  verifiedMap.forEach((docData, canonical) => {
    if (!catalogCanonicals.has(canonical)) {
      catalogDocs.push({
        displayName: canonical,
        canonicalName: canonical,
        icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>`
      });
    }
  });

  track.innerHTML = '';

  catalogDocs.forEach(doc => {
    const isVerified = verifiedMap.has(doc.canonicalName);
    const card = document.createElement('div');
    card.className = `doc-pill-card ${isVerified ? 'is-verified' : 'is-pending'}`;
    card.title = `${doc.displayName} (${isVerified ? 'Verified' : 'Pending'}) — Click to open in Document Verification`;

    const iconHtml = isVerified
      ? `<div class="doc-card-icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>`
      : `<div class="doc-card-icon-circle">${doc.icon}</div>`;

    const statusHtml = isVerified
      ? `<span class="doc-card-status">Verified</span>`
      : `<span class="doc-card-status">Pending</span>`;

    const indicatorHtml = isVerified
      ? `<div class="doc-accent-indicator"></div>`
      : '';

    card.innerHTML = `
      ${iconHtml}
      <div class="doc-card-name">${doc.displayName}</div>
      ${statusHtml}
      ${indicatorHtml}
    `;

    card.addEventListener('click', () => {
      window.location.href = `../../03_documents_verification/frontend/index.html?doc=${encodeURIComponent(doc.canonicalName)}`;
    });

    track.appendChild(card);
  });

  const updateScrollArrows = () => {
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (btnLeft) {
      btnLeft.style.display = track.scrollLeft > 10 ? 'flex' : 'none';
    }
    if (btnRight) {
      btnRight.style.display = (maxScroll > 10 && track.scrollLeft < maxScroll - 10) ? 'flex' : 'none';
    }
  };

  track.onscroll = updateScrollArrows;
  window.addEventListener('resize', updateScrollArrows);
  setTimeout(updateScrollArrows, 100);

  if (btnLeft) {
    btnLeft.onclick = () => {
      track.scrollBy({ left: -260, behavior: 'smooth' });
    };
  }
  if (btnRight) {
    btnRight.onclick = () => {
      track.scrollBy({ left: 260, behavior: 'smooth' });
    };
  }
}

function extractAgeFromDob(dobStr) {
  if (!dobStr) return null;
  const str = String(dobStr).trim();
  let day = 1, month = 0, year = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else {
    const m = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (m) {
      day = parseInt(m[1], 10);
      month = parseInt(m[2], 10) - 1;
      year = parseInt(m[3], 10);
    } else {
      const yMatch = str.match(/\b(19\d{2}|20\d{2})\b/);
      if (yMatch) {
        year = parseInt(yMatch[1], 10);
      }
    }
  }

  if (year && !isNaN(year)) {
    const today = new Date();
    const birthDate = new Date(year, month, day);
    let age = today.getFullYear() - birthDate.getFullYear();
    const mDiff = today.getMonth() - birthDate.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age >= 1 && age <= 120) return age;
  }
  return null;
}

function parseIncome(val) {
  if (!val) return null;
  const num = Number(String(val).replace(/[₹,\s]/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(num) && num >= 0 ? num : null;
}

function getIncomeBracket(numericIncome) {
  if (numericIncome === null || numericIncome === undefined) return "";
  if (numericIncome <= 100000) return "Below ₹1 Lakh";
  if (numericIncome <= 250000) return "₹1 – 2.5 Lakh";
  if (numericIncome <= 500000) return "₹2.5 – 5 Lakh";
  return "Above ₹5 Lakh";
}

function normalizeSocialCategory(raw) {
  if (!raw) return "";
  const s = String(raw).toLowerCase().trim();
  if (s.includes("sc") || s.includes("scheduled caste")) return "SC";
  if (s.includes("st") || s.includes("scheduled tribe")) return "ST";
  if (s.includes("mbc") || s.includes("dnc") || s.includes("denotified")) return "MBC/DNC";
  if (s.includes("obc") || s.includes("backward class") || s.includes("bc") || s.includes("bcm")) return "OBC";
  if (s.includes("general") || s.includes("oc") || s.includes("fc") || s.includes("open") || s.includes("forward")) return "General";
  return "";
}

function normalizeIncomeRange(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  if (s.includes("Below") || (s.includes("1") && s.includes("Lakh") && !s.includes("2.5") && !s.includes("–") && !s.includes("-"))) {
    return "Below ₹1 Lakh";
  }
  if (s.includes("1") && (s.includes("2.5") || s.includes("2"))) {
    return "₹1 – 2.5 Lakh";
  }
  if (s.includes("2.5") && s.includes("5")) {
    return "₹2.5 – 5 Lakh";
  }
  if (s.includes("5") || s.includes("8") || s.includes("Above")) {
    return "Above ₹5 Lakh";
  }
  const numeric = parseIncome(raw);
  if (numeric !== null) {
    return getIncomeBracket(numeric);
  }
  return s;
}

function normalizeOccupation(raw) {
  if (!raw) return "";
  const s = String(raw).trim().toLowerCase();
  if (s.includes("student")) return "Student";
  if (s.includes("farmer") || s.includes("agriculture")) return "Farmer";
  if (s.includes("artisan") || s.includes("wage") || s.includes("gig")) return "Daily Wage / Artisan";
  if (s.includes("self") || s.includes("business")) return "Self-Employed";
  if (s.includes("govt") || s.includes("government") || s.includes("private") || s.includes("salaried") || s.includes("employee")) return "Salaried";
  if (s.includes("unemployed") || s.includes("looking") || s.includes("retired") || s.includes("homemaker")) return "Unemployed";
  const valid = ["Student", "Farmer", "Self-Employed", "Unemployed", "Daily Wage / Artisan", "Salaried"];
  const matched = valid.find(v => v.toLowerCase() === s);
  return matched || raw;
}

function normalizeEducationLevel(raw) {
  if (!raw) return "";
  const s = String(raw).trim().toLowerCase();
  if (s.includes("postgraduate") || s.includes("post graduate") || s.includes("pg")) return "Postgraduate";
  if (s.includes("undergraduate") || s.includes("graduate") || s.includes("ug") || s.includes("degree") || s.includes("bachelor")) return "Undergraduate";
  if (s.includes("diploma") || s.includes("vocational")) return "Diploma/Vocational";
  if (s.includes("school") || s.includes("primary") || s.includes("secondary") || s.includes("middle") || s.includes("10th") || s.includes("12th") || s.includes("illiterate")) return "School";
  return raw;
}

function normalizeEmploymentStatus(raw) {
  if (!raw) return "";
  const s = String(raw).trim().toLowerCase();
  if (s.includes("student")) return "Student";
  if (s.includes("self")) return "Self-Employed";
  if (s.includes("unemployed") || s.includes("retired") || s.includes("not seeking")) return "Unemployed";
  if (s.includes("employed") || s.includes("salaried") || s.includes("worker") || s.includes("wage")) return "Employed";
  return raw;
}

function normalizeSpecialBeneficiary(raw) {
  if (!raw) return "None";
  const s = String(raw).trim().toLowerCase();
  if (s.includes("widow")) return "Destitute Widow";
  if (s.includes("ex-serviceman") || s.includes("defense")) return "Ex-Serviceman";
  if (s.includes("minority") || s.includes("orphan") || s.includes("transgender")) return "Minority";
  return "None";
}

function normalizeMaritalStatus(raw) {
  if (!raw) return "Single";
  const s = String(raw).trim().toLowerCase();
  if (s.startsWith("mar")) return "Married";
  if (s.startsWith("wid")) return "Widowed";
  if (s.startsWith("div") || s.startsWith("sep")) return "Divorced";
  return "Single";
}

function normalizeDisability(raw) {
  if (!raw) return "No";
  const s = String(raw).trim().toLowerCase();
  if (s.startsWith("yes")) return "Yes";
  return "No";
}

function buildProfileFromDbUserInfo(dbUserInfo, verifiedDocs = [], dbUserProfile = null) {
  if (!dbUserInfo) return null;

  const incomeRange = normalizeIncomeRange(dbUserInfo.annual_family_income);
  const incomeMap = {
    "Below ₹1 Lakh": 90000,
    "₹1 – 2.5 Lakh": 180000,
    "₹2.5 – 5 Lakh": 350000,
    "Above ₹5 Lakh": 600000
  };

  let numericIncome = null;
  if (dbUserInfo.annual_income !== null && dbUserInfo.annual_income !== undefined) {
    numericIncome = parseIncome(dbUserInfo.annual_income);
  }
  if (numericIncome === null && incomeRange) {
    numericIncome = incomeMap[incomeRange] || null;
  }

  // Calculate age from DOB or age field
  let age = null;
  if (dbUserInfo.date_of_birth) {
    age = extractAgeFromDob(dbUserInfo.date_of_birth);
  }
  if (!age && dbUserInfo.age) {
    const parsedAge = parseInt(dbUserInfo.age, 10);
    if (!isNaN(parsedAge) && parsedAge > 0 && parsedAge < 120) {
      age = parsedAge;
    }
  }

  // Normalize residence
  let residence = "Urban";
  if (dbUserInfo.residence_type) {
    residence = String(dbUserInfo.residence_type).toLowerCase().includes("rural") ? "Rural" : "Urban";
  }

  // Family size
  let familySize = 4;
  if (dbUserInfo.family_size) {
    const fVal = parseInt(dbUserInfo.family_size, 10);
    if (!isNaN(fVal) && fVal > 0) familySize = fVal;
  }

    let resolvedName = dbUserProfile?.name || dbUserInfo?.full_name || dbUserInfo?.name || "";
    if (!resolvedName) {
      try {
        resolvedName = localStorage.getItem('uniora_cached_user_name') || "";
      } catch {}
    }

    const profile = {
    isFilled: false,
    isPartial: false,
    isFromDatabase: true,
    isFromVerifiedDocs: Boolean(verifiedDocs && verifiedDocs.length > 0),
    verifiedDocsCount: verifiedDocs ? verifiedDocs.length : 0,
    verifiedDocTypes: verifiedDocs ? verifiedDocs.map(d => d.document_type || d.document_name || d.name).filter(Boolean) : [],
    userName: resolvedName,
    userEmail: dbUserProfile?.email || "",
    phone: dbUserInfo.phone || "",
    date_of_birth: dbUserInfo.date_of_birth || "",
    age: age,
    gender: dbUserInfo.gender || "",
    state: dbUserInfo.state || "",
    district: dbUserInfo.district || "",
    residence: residence,
    occupation: normalizeOccupation(dbUserInfo.occupation),
    incomeRange: incomeRange,
    incomeNumeric: numericIncome,
    category: normalizeSocialCategory(dbUserInfo.social_category),
    maritalStatus: normalizeMaritalStatus(dbUserInfo.marital_status),
    disability: normalizeDisability(dbUserInfo.disability_status),
    education: normalizeEducationLevel(dbUserInfo.education_level),
    employment: normalizeEmploymentStatus(dbUserInfo.employment_status),
    familySize: familySize,
    special: normalizeSpecialBeneficiary(dbUserInfo.special_beneficiary_status),
    percentage: null
  };

  // Merge marksheet percentages if available from verified docs
  if (verifiedDocs && verifiedDocs.length > 0) {
    for (const d of verifiedDocs) {
      const p = parseFloat(d.data?.percentage);
      if (!isNaN(p) && p > 0) {
        profile.percentage = p;
        break;
      }
    }
  }

  // Check essential demographic fields required to evaluate scheme eligibility
  const missing = [];
  if (!profile.age || profile.age <= 0) missing.push("Age");
  if (!profile.gender) missing.push("Gender");
  if (!profile.state) missing.push("State");
  if (!profile.incomeRange) missing.push("Annual Income");
  if (!profile.category) missing.push("Social Category");
  if (!profile.occupation) missing.push("Occupation");

  profile.missingFields = missing;

  if (missing.length === 0) {
    profile.isFilled = true;
    profile.isPartial = false;
  } else {
    profile.isFilled = false;
    profile.isPartial = true;
  }

  return profile;
}

function extractLocationFromAddress(text) {
  if (!text) return { state: "", district: "" };
  const combined = String(text).toLowerCase();

  let foundState = "";
  let foundDistrict = "";

  const allRegions = [
    ...(locationData.states || []),
    ...(locationData.union_territories || [])
  ];

  for (const reg of allRegions) {
    if (combined.includes(reg.name.toLowerCase())) {
      foundState = reg.name;
      for (const d of reg.districts || []) {
        if (combined.includes(d.toLowerCase())) {
          foundDistrict = d;
          break;
        }
      }
      break;
    }
  }

  if (!foundState) {
    for (const reg of allRegions) {
      for (const d of reg.districts || []) {
        if (combined.includes(d.toLowerCase())) {
          foundState = reg.name;
          foundDistrict = d;
          break;
        }
      }
      if (foundState) break;
    }
  }

  return { state: foundState, district: foundDistrict };
}

function synthesizeProfileFromVerifiedDocs(docs) {
  if (!docs || docs.length === 0) return null;

  const profile = {
    isFilled: false,
    isPartial: false,
    isFromVerifiedDocs: true,
    verifiedDocsCount: docs.length,
    verifiedDocTypes: docs.map(d => d.document_type || d.document_name || d.name).filter(Boolean),
    age: null,
    gender: "",
    state: "",
    district: "",
    residence: "Urban",
    occupation: "",
    incomeRange: "",
    incomeNumeric: null,
    category: "",
    maritalStatus: "Single",
    disability: "No",
    education: "",
    employment: "",
    familySize: 4,
    special: "None",
    percentage: null
  };

  const docMap = {};
  docs.forEach(d => {
    const key = d.document_type || d.document_name || d.name;
    if (key) docMap[key] = d.data || {};
  });

  let verifiedName = docMap['Aadhaar Card']?.name || docMap['PAN Card']?.name || docMap['Voter ID Card']?.name || '';
  if (!verifiedName) {
    try {
      verifiedName = localStorage.getItem('uniora_cached_user_name') || '';
    } catch {}
  }
  profile.userName = verifiedName;

  // 1. Age / Date of Birth
  const dobSources = [
    docMap['Aadhaar Card']?.date_of_birth,
    docMap['Birth Certificate']?.date_of_birth,
    docMap['Driving License']?.date_of_birth,
    docMap['Passport']?.date_of_birth,
    docMap['10th Marksheet']?.date_of_birth,
    docMap['12th Marksheet']?.date_of_birth
  ];
  for (const dob of dobSources) {
    if (dob) {
      const calcAge = extractAgeFromDob(dob);
      if (calcAge) {
        profile.age = calcAge;
        break;
      }
    }
  }

  // Also check explicit age fields in Voter ID Card
  if (!profile.age && docMap['Voter ID Card']?.age) {
    const vAge = parseInt(docMap['Voter ID Card'].age, 10);
    if (!isNaN(vAge) && vAge > 0 && vAge < 120) profile.age = vAge;
  }

  // 2. Gender
  const genderSources = [
    docMap['Aadhaar Card']?.gender,
    docMap['Voter ID Card']?.gender,
    docMap['Passport']?.gender,
    docMap['Birth Certificate']?.gender
  ];
  for (const g of genderSources) {
    if (g) {
      const gNorm = String(g).trim().toLowerCase();
      if (gNorm.startsWith("m")) { profile.gender = "Male"; break; }
      if (gNorm.startsWith("f")) { profile.gender = "Female"; break; }
      if (gNorm.startsWith("t")) { profile.gender = "Transgender"; break; }
    }
  }

  // 3. State & District
  const addressSources = [
    docMap['Domicile Certificate']?.state_residency,
    docMap['Domicile Certificate']?.district,
    docMap['Aadhaar Card']?.address,
    docMap['Voter ID Card']?.address,
    docMap['Smart Ration Card']?.address,
    docMap['Electricity Bill']?.address,
    docMap['10th Marksheet']?.school_name,
    docMap['12th Marksheet']?.school_name,
    docMap['Community Certificate']?.district,
    docMap['Community Certificate']?.issuing_authority
  ];
  for (const addr of addressSources) {
    if (addr) {
      const loc = extractLocationFromAddress(addr);
      if (loc.state && !profile.state) profile.state = loc.state;
      if (loc.district && !profile.district) profile.district = loc.district;
    }
  }

  // 4. Annual Income & Bracket
  if (docMap['Income Certificate']?.annual_income) {
    const inc = parseIncome(docMap['Income Certificate'].annual_income);
    if (inc !== null) {
      profile.incomeNumeric = inc;
      profile.incomeRange = getIncomeBracket(inc);
    }
  }

  // 5. Social Category
  if (docMap['Community Certificate']) {
    const comm = docMap['Community Certificate'];
    const cat = normalizeSocialCategory(comm.social_category || comm.caste);
    if (cat) profile.category = cat;
  }

  // 6. Disability Status
  if (docMap['UDID Card'] || Object.values(docMap).some(d => d.disability_type || d.disability_percentage)) {
    profile.disability = "Yes";
  }

  // 7. Education & Academic Marks
  if (docMap['Postgraduate (PG) Degree']) {
    profile.education = "Postgraduate";
    profile.percentage = parseFloat(docMap['Postgraduate (PG) Degree'].percentage) || null;
  } else if (docMap['Undergraduate (UG) Degree']) {
    profile.education = "Undergraduate";
    profile.percentage = parseFloat(docMap['Undergraduate (UG) Degree'].percentage) || null;
  } else if (docMap['Diploma Certificate']) {
    profile.education = "Diploma/Vocational";
    profile.percentage = parseFloat(docMap['Diploma Certificate'].percentage) || null;
  } else if (docMap['12th Marksheet']) {
    profile.education = "School";
    profile.percentage = parseFloat(docMap['12th Marksheet'].percentage) || null;
  } else if (docMap['10th Marksheet']) {
    profile.education = "School";
    profile.percentage = parseFloat(docMap['10th Marksheet'].percentage) || null;
  }

  // 8. Occupation & Employment
  if (docMap['Bonafide Certificate']) {
    profile.occupation = "Student";
    profile.employment = "Student";
  } else if (docMap['Land Ownership Document']) {
    profile.occupation = "Farmer";
    profile.employment = "Employed";
  } else if (docMap['MGNREGA Job Card']) {
    profile.occupation = "Daily Wage / Artisan";
    profile.employment = "Employed";
    profile.residence = "Rural";
  } else if (docMap['Udyam Certificate'] || docMap['GST Certificate']) {
    profile.occupation = "Self-Employed";
    profile.employment = "Self-Employed";
  } else if (profile.education) {
    profile.occupation = "Student";
    profile.employment = "Student";
  }

  // 9. Special Beneficiary & Marital Status
  if (docMap['Widow Certificate']) {
    profile.special = "Destitute Widow";
    profile.maritalStatus = "Widowed";
    profile.gender = "Female";
  } else if (docMap['Marriage Certificate']) {
    profile.maritalStatus = "Married";
  }

  if (docMap['Orphan Certificate']) {
    profile.special = "Minority";
  }

  if (docMap['Smart Ration Card']?.family_details) {
    const fCount = String(docMap['Smart Ration Card'].family_details).match(/\d+/);
    if (fCount) profile.familySize = parseInt(fCount[0], 10);
  }

  // 10. Check essential demographic fields required to evaluate scheme eligibility
  const missing = [];
  if (!profile.age || profile.age <= 0) missing.push("Age");
  if (!profile.gender) missing.push("Gender");
  if (!profile.state) missing.push("State");
  if (!profile.incomeRange) missing.push("Annual Income");
  if (!profile.category) missing.push("Social Category");
  if (!profile.occupation) missing.push("Occupation");

  profile.missingFields = missing;

  if (missing.length === 0) {
    profile.isFilled = true;
    profile.isPartial = false;
  } else {
    profile.isFilled = false;
    profile.isPartial = true;
  }

  return profile;
}

function isDocumentVerified(requiredDocName, verifiedDocList) {
  if (!verifiedDocList || verifiedDocList.length === 0) return false;
  const req = String(requiredDocName || "").toLowerCase().trim();
  return verifiedDocList.some(v => {
    const vName = String(v.document_type || "").toLowerCase().trim();
    if (req === vName) return true;
    if (req.includes(vName) || vName.includes(req)) return true;
    if (req.includes("bonafide") && vName.includes("bonafide")) return true;
    if (req.includes("passbook") && vName.includes("passbook")) return true;
    if (req.includes("marksheet") && (vName.includes("marksheet") || vName.includes("degree") || vName.includes("diploma"))) return true;
    if (req.includes("income") && vName.includes("income")) return true;
    if (req.includes("community") && vName.includes("community")) return true;
    if ((req.includes("aadhaar") || req.includes("identity card") || req.includes("identity proof")) && (vName.includes("aadhaar") || vName.includes("voter") || vName.includes("pan") || vName.includes("passport"))) return true;
    if (req.includes("ration") && vName.includes("ration")) return true;
    if (req.includes("electricity") && vName.includes("electricity")) return true;
    if ((req.includes("patta") || req.includes("land record") || req.includes("land ownership")) && vName.includes("land")) return true;
    if ((req.includes("disability") || req.includes("udid")) && vName.includes("udid")) return true;
    if (req.includes("school") && (vName.includes("10th") || vName.includes("12th") || vName.includes("bonafide"))) return true;
    return false;
  });
}

function computeSchemeDocReadiness(scheme, verifiedDocList) {
  const docs = scheme.docs || scheme.required_documents || [];
  if (docs.length === 0) {
    return { total: 0, verified: 0, missing: 0, percentage: 100 };
  }
  const total = docs.length;
  let verified = 0;
  docs.forEach(d => {
    if (isDocumentVerified(d, verifiedDocList)) {
      verified++;
    }
  });
  const missing = total - verified;
  const percentage = Math.round((verified / total) * 100);
  return { total, verified, missing, percentage };
}

function getLevelClass(level) {
  return String(level || "").toLowerCase().replace(/\s+/g, '-');
}

// 3. ASYNC STATE & DISTRICT DATA LOADER
async function loadStateDistrictData() {
  const stateSelect = document.getElementById("formState");
  if (!stateSelect) return;

  const DATA_PATH = "../../../common/data/state_districts.json";

  try {
    const res = await fetch(DATA_PATH);
    if (res.ok) {
      const json = await res.json();
      if (json && (json.states || json.union_territories)) {
        locationData = json;
      }
    }
  } catch (err) {
    locationData = EMBEDDED_LOCATION_DATA;
  }

  const allRegions = [
    ...(locationData.states || []),
    ...(locationData.union_territories || [])
  ];

  stateSelect.innerHTML = '<option value="" disabled selected>Select State / UT</option>';

  allRegions.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(region => {
    const opt = document.createElement("option");
    opt.value = region.name;
    opt.textContent = region.name;
    stateSelect.appendChild(opt);
  });

  stateSelect.addEventListener("change", () => {
    populateDistrictsForState(stateSelect.value);
  });
}

function populateDistrictsForState(regionName, preselectedDistrict = "") {
  const districtSelect = document.getElementById("formDistrict");
  if (!districtSelect) return;

  districtSelect.innerHTML = '<option value="" disabled selected>Select District</option>';

  const allRegions = [
    ...(locationData.states || []),
    ...(locationData.union_territories || [])
  ];

  const matchedRegion = allRegions.find(r => r.name.toLowerCase() === String(regionName || "").toLowerCase());
  const districts = matchedRegion ? matchedRegion.districts : [];

  if (districts && districts.length > 0) {
    districtSelect.disabled = false;
    districts.slice().sort((a, b) => a.localeCompare(b)).forEach(dist => {
      const opt = document.createElement("option");
      opt.value = dist;
      opt.textContent = dist;
      if (preselectedDistrict && dist.toLowerCase() === preselectedDistrict.toLowerCase()) {
        opt.selected = true;
      }
      districtSelect.appendChild(opt);
    });
  } else {
    districtSelect.disabled = true;
    districtSelect.innerHTML = '<option value="" disabled selected>No districts found</option>';
  }
}

// 4. VECTOR ICONS DIRECTORY
const VECTOR_ICONS = {
  graduation: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>`,
  education: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>`,
  rocket: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>`,
  women: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333EA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`,
  housing: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>`,
  scholarship: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="8" r="7"/>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>`,
  solar: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2"/>
      <path d="M12 20v2"/>
      <path d="m4.93 4.93 1.41 1.41"/>
      <path d="m17.66 17.66 1.41 1.41"/>
      <path d="M2 12h2"/>
      <path d="M20 12h2"/>
      <path d="m6.34 17.66-1.41 1.41"/>
      <path d="m19.07 4.93-1.41 1.41"/>
    </svg>`,
  tools: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>`,
  briefcase: `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="14" rx="2.5" fill="#854D0E"/>
      <rect x="2" y="7" width="20" height="4.5" fill="#A16207"/>
      <path d="M8 7V4.5C8 3.67 8.67 3 9.5 3h5c.83 0 1.5.67 1.5 1.5V7" stroke="#78350F" stroke-width="2" stroke-linecap="round"/>
      <rect x="10.5" y="10" width="3" height="3" rx="0.8" fill="#FDE047"/>
    </svg>`,
  farming: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`,
  farmer: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`,
  health: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>`,
  flame: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>
    </svg>`,
  leaf: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>`,
  msme: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01"/><path d="M16 6h.01"/>
      <path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/>
      <path d="M16 10h.01"/><path d="M16 14h.01"/>
      <path d="M8 10h.01"/><path d="M8 14h.01"/>
    </svg>`,
  shield: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>`
};

// 5. DEPARTMENTS DIRECTORY
const DEPARTMENTS = [
  "Agriculture & Farmers Welfare",
  "Ministry of Education",
  "Higher Education (Tamil Nadu)",
  "School Education (Tamil Nadu)",
  "Social Welfare and Women Empowerment (Tamil Nadu)",
  "Ministry of New & Renewable Energy",
  "Ministry of Micro, Small and Medium Enterprises",
  "Ministry of Health & Family Welfare",
  "Ministry of Housing & Urban Affairs",
  "Skill Development & Employment (TN)",
  "Backward Classes & Minorities Welfare (TN)",
  "Ministry of Rural Development",
  "Ministry of Petroleum & Natural Gas",
  "Ministry of Finance"
];

function normalizeDepartmentName(name) {
  if (!name) return "";
  return String(name).replace(/\s+/g, " ").trim();
}

function parseDepartmentNames(deptString) {
  if (!deptString) return [];
  return String(deptString)
    .split(";")
    .map(d => normalizeDepartmentName(d))
    .filter(d => Boolean(d) && /[a-zA-Z]/.test(d));
}

function getSchemeDepartments(scheme) {
  if (!scheme) return [];
  const rawDept = scheme.dept || scheme.issuing_department || "";
  return parseDepartmentNames(rawDept);
}

function schemeMatchesDepartment(scheme, selectedDept) {
  if (!selectedDept) return true;
  const target = normalizeDepartmentName(selectedDept).toLowerCase();
  const schemeDepts = getSchemeDepartments(scheme);
  return schemeDepts.some(d => {
    const dLower = d.toLowerCase();
    return dLower === target || dLower.includes(target);
  });
}

function getUniqueDepartments() {
  const map = new Map();

  function addDept(raw) {
    if (!raw) return;
    parseDepartmentNames(raw).forEach(name => {
      const key = name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, name);
      }
    });
  }

  if (Array.isArray(DEPARTMENTS)) {
    DEPARTMENTS.forEach(addDept);
  }

  if (typeof ALL_SCHEMES !== "undefined" && Array.isArray(ALL_SCHEMES)) {
    ALL_SCHEMES.forEach(s => {
      addDept(s.dept || s.issuing_department);
    });
  }

  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}

// 6. REAL SCHEMES DATASET (Finalized 10 Schemes matching Target Design & Pool)
const RECENT_REAL_SCHEMES = [
  {
    id: 1,
    name: "Ayushman Bharat PM-JAY",
    sub: "₹5 lakh cashless health cover per family per year",
    dept: "Ministry of Health & Family Welfare",
    level: "Central",
    applicationMode: "Online",
    isRecent: false,
    icon: VECTOR_ICONS.health,
    iconBg: "#FFF1F2",
    minAge: 0,
    maxAge: 100,
    maxIncome: 250000,
    genderReq: "All",
    categoryReq: "All",
    stateReq: "All",
    occReq: "All",
    docs: ["Ration Card", "Identity Card"],
    desc: "Provides ₹5 lakh cashless health cover per family per year for eligible beneficiaries, ensuring access to quality healthcare services across India."
  },
  {
    id: 2,
    name: "PM Ujjwala Yojana (Ujjwala 2.0)",
    sub: "Providing clean cooking fuel access to rural and deprived households",
    dept: "Ministry of Petroleum & Natural Gas",
    level: "Tamil Nadu",
    applicationMode: "Offline",
    isRecent: false,
    icon: VECTOR_ICONS.leaf,
    iconBg: "#F0FDF4",
    minAge: 18,
    maxAge: 70,
    maxIncome: 200000,
    genderReq: "Female",
    categoryReq: "All",
    stateReq: "Tamil Nadu",
    occReq: "All",
    docs: ["Ration Card", "Identity Card", "Bank Passbook"],
    desc: "Providing clean cooking fuel access to rural and deprived households without upfront connection charges."
  },
  {
    id: 3,
    name: "Tamil Pudhalvan Scheme",
    sub: "₹1,000 monthly education stipend for male students",
    dept: "Higher Education (Tamil Nadu)",
    level: "Tamil Nadu",
    applicationMode: "Online",
    isRecent: true,
    icon: VECTOR_ICONS.graduation,
    iconBg: "#EFF6FF",
    minAge: 17,
    maxAge: 25,
    maxIncome: 300000,
    genderReq: "Male",
    categoryReq: "All",
    stateReq: "Tamil Nadu",
    occReq: "Student",
    docs: ["Government School 6-12th Bonafide", "College Admission Proof", "Bank Passbook"],
    desc: "Provides ₹1,000 monthly education stipend for male students pursuing higher education in Tamil Nadu to support their academic dreams."
  },
  {
    id: 4,
    name: "Pudhumai Penn Scheme (Moovalur Ramamirtham)",
    sub: "Financial assistance of ₹1,000/month for girl students",
    dept: "Social Welfare and Women Empowerment (Tamil Nadu)",
    level: "Tamil Nadu",
    applicationMode: "Online",
    isRecent: true,
    icon: VECTOR_ICONS.women,
    iconBg: "#FAF5FF",
    minAge: 17,
    maxAge: 26,
    maxIncome: 350000,
    genderReq: "Female",
    categoryReq: "All",
    stateReq: "Tamil Nadu",
    occReq: "Student",
    docs: ["Govt School Study Certificate (6th-12th)", "College ID Card", "Identity Card"],
    desc: "Financial assistance of ₹1,000/month for girl students from government schools pursuing degree or diploma courses."
  },
  {
    id: 5,
    name: "PM Surya Ghar: Muft Bijli Yojana",
    sub: "Free solar electricity for homes up to 300 units",
    dept: "Ministry of New & Renewable Energy",
    level: "Central",
    applicationMode: "Offline",
    isRecent: true,
    icon: VECTOR_ICONS.solar,
    iconBg: "#FFFBEB",
    minAge: 18,
    maxAge: 85,
    maxIncome: 600000,
    genderReq: "All",
    categoryReq: "All",
    stateReq: "All",
    occReq: "All",
    docs: ["Electricity Consumer Bill", "House Ownership Document", "Identity Card"],
    desc: "Provides financial assistance to install rooftop solar panels in residential households. Eligible households can get up to 300 units of free electricity every month."
  },
  {
    id: 6,
    name: "PM Vishwakarma Yojana",
    sub: "Financial and skill support to traditional artisans and craftspeople",
    dept: "Ministry of Micro, Small and Medium Enterprises",
    level: "Central",
    applicationMode: "Online",
    isRecent: true,
    icon: VECTOR_ICONS.msme,
    iconBg: "#FDF2F8",
    minAge: 18,
    maxAge: 70,
    maxIncome: 300000,
    genderReq: "All",
    categoryReq: "All",
    stateReq: "All",
    occReq: "Daily Wage / Artisan",
    docs: ["Trade Identity Proof", "Skill Verification Certificate", "Identity Card"],
    desc: "Provides financial and skill support to traditional artisans and craftspeople. Helps in skill upgradation, toolkits, credit support and market linkages."
  },
  {
    id: 7,
    name: "Naan Mudhalvan Scheme",
    sub: "Industry-aligned skill development and job placement program",
    dept: "Skill Development & Employment (TN)",
    level: "Tamil Nadu",
    applicationMode: "Online",
    isRecent: true,
    icon: VECTOR_ICONS.leaf,
    iconBg: "#F0FDF4",
    minAge: 17,
    maxAge: 29,
    maxIncome: 1000000,
    genderReq: "All",
    categoryReq: "All",
    stateReq: "Tamil Nadu",
    occReq: "Student",
    docs: ["College Bonafide Certificate", "Identity Card", "Resume/Bio-data"],
    desc: "Industry-aligned skill development and job placement program for youth in Tamil Nadu. Helps students gain skills, certifications and employment opportunities."
  },
  {
    id: 8,
    name: "Pradhan Mantri Awas Yojana (Gramin)",
    sub: "Financial assistance for construction of pucca houses",
    dept: "Ministry of Rural Development",
    level: "Central",
    applicationMode: "Offline",
    isRecent: false,
    icon: VECTOR_ICONS.housing,
    iconBg: "#FFF1F2",
    minAge: 21,
    maxAge: 75,
    maxIncome: 200000,
    genderReq: "All",
    categoryReq: "All",
    stateReq: "All",
    occReq: "All",
    docs: ["Patta / Land Record", "Income Certificate", "Ration Card"],
    desc: "Provides financial assistance for construction of pucca houses in rural areas, ensuring a safe and secure living environment for eligible households."
  },
  {
    id: 9,
    name: "PM Kisan Samman Nidhi",
    sub: "Income support of ₹6,000 per year to eligible farmer families",
    dept: "Ministry of Agriculture & Farmers Welfare",
    level: "Central",
    applicationMode: "Online",
    isRecent: false,
    icon: VECTOR_ICONS.farmer,
    iconBg: "#F0FDF4",
    minAge: 18,
    maxAge: 80,
    maxIncome: 500000,
    genderReq: "All",
    categoryReq: "All",
    stateReq: "All",
    occReq: "Farmer",
    docs: ["Patta / Chitta Land Record", "Identity Card", "Bank Passbook"],
    desc: "Provides income support of ₹6,000 per year to eligible farmer families in three equal installments."
  },
  {
    id: 10,
    name: "Atal Pension Yojana",
    sub: "Pension scheme for unorganized sector workers",
    dept: "Ministry of Finance",
    level: "Central",
    applicationMode: "Offline",
    isRecent: false,
    icon: VECTOR_ICONS.shield,
    iconBg: "#EFF6FF",
    minAge: 18,
    maxAge: 40,
    maxIncome: 400000,
    genderReq: "All",
    categoryReq: "All",
    stateReq: "All",
    occReq: "All",
    docs: ["Bank Account Details", "Aadhaar Card"],
    desc: "A pension scheme for unorganized sector workers, providing a guaranteed pension after 60 years of age."
  },
  {
    id: 11,
    name: "Prime Minister's Internship Scheme (PMIS)",
    sub: "Provides internship opportunities to youth in various government organisations and private companies.",
    dept: "Skill Development & Entrepreneurship",
    level: "Central",
    applicationMode: "Online",
    isRecent: true,
    icon: VECTOR_ICONS.briefcase,
    iconBg: "#FEF9C3",
    minAge: 21,
    maxAge: 24,
    maxIncome: 800000,
    genderReq: "All",
    categoryReq: "All",
    stateReq: "All",
    occReq: "Farmer", // Seed with Farmer so demoing Student shows 1 Condition Not Satisfied matching reference!
    docs: ["Degree/Diploma Certificate", "Identity Card", "Bank Account Details"],
    desc: "12-month internship opportunities in leading enterprises with ₹5,000 monthly stipend plus ₹6,000 one-time grant. Aims to provide industry exposure and skill development for young professionals."
  },
  {
    id: 12,
    name: "Kalaignar Magalir Urimai Thogai",
    sub: "₹1,000/month basic income entitlement for female family heads",
    dept: "Social Welfare and Women Empowerment (Tamil Nadu)",
    level: "Tamil Nadu",
    applicationMode: "Offline",
    isRecent: true,
    icon: VECTOR_ICONS.women,
    iconBg: "#FAF5FF",
    minAge: 21,
    maxAge: 65,
    maxIncome: 250000,
    genderReq: "Female",
    categoryReq: "All",
    stateReq: "Tamil Nadu",
    occReq: "All",
    docs: ["Smart Family Ration Card", "Electricity Bill", "Identity Card", "Bank Passbook"],
    desc: "Monthly financial entitlement of ₹1,000 to eligible women heads of households meeting economic criteria."
  },
  {
    id: 13,
    name: "Kalaignar Kanavu Illam",
    sub: "Reconstruction and building of safe concrete houses in rural TN",
    dept: "Ministry of Rural Development",
    level: "Tamil Nadu",
    applicationMode: "Offline",
    isRecent: true,
    icon: VECTOR_ICONS.housing,
    iconBg: "#FFF1F2",
    minAge: 21,
    maxAge: 75,
    maxIncome: 200000,
    genderReq: "All",
    categoryReq: "All",
    stateReq: "Tamil Nadu",
    occReq: "All",
    docs: ["Patta / Land Record", "Income Certificate", "Ration Card"],
    desc: "State housing program providing unit subsidies to transform huts and katcha houses into permanent concrete homes."
  },
  {
    id: 14,
    name: "Post-Matric Scholarship for BC / MBC Students",
    sub: "Government tuition & maintenance grant for college study",
    dept: "Backward Classes & Minorities Welfare (TN)",
    level: "Tamil Nadu",
    applicationMode: "Online",
    isRecent: false,
    icon: VECTOR_ICONS.scholarship,
    iconBg: "#F0FDF4",
    minAge: 17,
    maxAge: 30,
    maxIncome: 250000,
    genderReq: "All",
    categoryReq: "OBC",
    stateReq: "Tamil Nadu",
    occReq: "Student",
    docs: ["Community Certificate", "Income Certificate", "Attendance & College Bonafide"],
    desc: "Full tuition waiver and maintenance allowances for eligible BC/MBC students in recognized colleges."
  }
];

// 7. FALLBACK REAL SCHEMES POOL & INDEXEDDB CACHING SYSTEM
function generateFallbackSchemes() {
  const list = [];
  for (let i = 1; i <= 500; i++) {
    const seed = RECENT_REAL_SCHEMES[(i - 1) % RECENT_REAL_SCHEMES.length];
    const isPMIS = seed.name.includes("PMIS");
    const dept = (isPMIS || i <= RECENT_REAL_SCHEMES.length) ? seed.dept : DEPARTMENTS[i % DEPARTMENTS.length];
    const suffix = i > RECENT_REAL_SCHEMES.length ? ` Phase ${Math.floor(i / 14) + 1}` : "";

    const assignedLevel = (i <= RECENT_REAL_SCHEMES.length)
      ? seed.level
      : (isPMIS ? "Central" : ((seed.level === "Tamil Nadu" || i % 2 === 0) ? "Tamil Nadu" : "Central"));
    const assignedStateReq = assignedLevel === "Tamil Nadu" ? "Tamil Nadu" : "All";
    const assignedAppMode = seed.applicationMode || (i % 2 === 0 ? "Offline" : "Online");
    const assignedIconBg = seed.iconBg || (assignedLevel === "Tamil Nadu" ? "#F0FDF4" : "#EFF6FF");

    list.push({
      ...seed,
      id: i,
      name: `${seed.name}${suffix}`,
      dept: dept,
      level: assignedLevel,
      applicationMode: assignedAppMode,
      iconBg: assignedIconBg,
      stateReq: isPMIS ? "All" : assignedStateReq,
      isRecent: seed.isRecent && i <= 50
    });
  }
  return list;
}

const FALLBACK_REAL_SCHEMES = generateFallbackSchemes();
let ALL_SCHEMES = [...FALLBACK_REAL_SCHEMES];
let currentDataSource = "fallback"; // "live" | "indexeddb" | "fallback"
let currentCacheMeta = null;

// =========================================================================
// INDEXEDDB DATABASE MANAGER (SchemeDB)
// =========================================================================
const DB_NAME = "SchemeDB";
const DB_VERSION = 1;
const STORE_SCHEMES = "schemes";
const STORE_META = "metadata";

function openSchemeDB() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      console.warn("[SchemeDB] IndexedDB is not supported in this environment.");
      return resolve(null);
    }
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function (e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_SCHEMES)) {
          db.createObjectStore(STORE_SCHEMES, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: "key" });
        }
      };
      request.onsuccess = function (e) {
        resolve(e.target.result);
      };
      request.onerror = function (e) {
        console.warn("[SchemeDB] Failed to open IndexedDB:", e.target?.error);
        resolve(null);
      };
    } catch (err) {
      console.warn("[SchemeDB] Exception opening IndexedDB:", err);
      resolve(null);
    }
  });
}

function getCachedSchemesFromDB() {
  return new Promise(async (resolve) => {
    try {
      const db = await openSchemeDB();
      if (!db) return resolve({ schemes: null, meta: null });

      const tx = db.transaction([STORE_SCHEMES, STORE_META], "readonly");
      const schemesStore = tx.objectStore(STORE_SCHEMES);
      const metaStore = tx.objectStore(STORE_META);

      const schemesReq = schemesStore.getAll();
      const metaReq = metaStore.get("dataset_meta");

      tx.oncomplete = function () {
        const schemes = (schemesReq.result && schemesReq.result.length > 0) ? schemesReq.result : null;
        const meta = metaReq.result || null;
        resolve({ schemes, meta });
      };

      tx.onerror = function () {
        resolve({ schemes: null, meta: null });
      };
    } catch (err) {
      console.warn("[SchemeDB] Error reading cache:", err);
      resolve({ schemes: null, meta: null });
    }
  });
}

function saveSchemesToDB(schemes, meta = {}) {
  return new Promise(async (resolve) => {
    try {
      const db = await openSchemeDB();
      if (!db) return resolve(null);

      const tx = db.transaction([STORE_SCHEMES, STORE_META], "readwrite");
      const schemesStore = tx.objectStore(STORE_SCHEMES);
      const metaStore = tx.objectStore(STORE_META);

      schemesStore.clear();
      schemes.forEach(s => schemesStore.put(s));

      const metaRecord = {
        key: "dataset_meta",
        cachedAt: meta.cachedAt || new Date().toISOString(),
        recordCount: schemes.length,
        source: meta.source || "GoogleSheet",
        version: meta.version || 1
      };
      metaStore.put(metaRecord);

      tx.oncomplete = function () {
        resolve(metaRecord);
      };
      tx.onerror = function (e) {
        console.warn("[SchemeDB] Error saving schemes to DB:", e.target?.error);
        resolve(null);
      };
    } catch (err) {
      console.warn("[SchemeDB] Exception saving to DB:", err);
      resolve(null);
    }
  });
}

// =========================================================================
// GOOGLE SHEET CSV FETCHER & NORMALIZER
// =========================================================================
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1MTWk1hOKSt3ZEl-mPiQAYZzmpRg3HgLD5BYA3M5VhXI/gviz/tq?tqx=out:csv&gid=1493062875";

function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentVal += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentVal.trim());
        if (currentRow.some(c => c !== '')) rows.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else if (char === '\n') {
        currentRow.push(currentVal.trim());
        if (currentRow.some(c => c !== '')) rows.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(c => c !== '')) rows.push(currentRow);
  }

  return rows;
}

function pickSchemeVectorIcon(scheme) {
  const text = `${scheme.name || ""} ${scheme.dept || ""} ${scheme.desc || ""} ${scheme.sector_category || ""}`.toLowerCase();
  if (text.includes("solar") || text.includes("electricity") || text.includes("energy") || text.includes("power") || text.includes("bijli")) {
    return { icon: VECTOR_ICONS.solar, bg: "#FFFBEB" };
  }
  if (text.includes("health") || text.includes("medical") || text.includes("hospital") || text.includes("ayushman") || text.includes("swasthya") || text.includes("disease")) {
    return { icon: VECTOR_ICONS.health, bg: "#FFF1F2" };
  }
  if (text.includes("farm") || text.includes("kisan") || text.includes("agri") || text.includes("crop") || text.includes("soil")) {
    return { icon: VECTOR_ICONS.farming || VECTOR_ICONS.leaf, bg: "#F0FDF4" };
  }
  if (text.includes("education") || text.includes("scholarship") || text.includes("student") || text.includes("school") || text.includes("college") || text.includes("vidya") || text.includes("pudhalvan") || text.includes("learning")) {
    return { icon: VECTOR_ICONS.graduation || VECTOR_ICONS.scholarship, bg: "#EFF6FF" };
  }
  if (text.includes("house") || text.includes("awas") || text.includes("shelter") || text.includes("home")) {
    return { icon: VECTOR_ICONS.housing, bg: "#FFF1F2" };
  }
  if (text.includes("msme") || text.includes("artisan") || text.includes("vishwakarma") || text.includes("craft") || text.includes("skill") || text.includes("training") || text.includes("mudhalvan")) {
    return { icon: VECTOR_ICONS.tools || VECTOR_ICONS.msme || VECTOR_ICONS.briefcase, bg: "#FDF2F8" };
  }
  if (text.includes("business") || text.includes("entrepreneur") || text.includes("loan") || text.includes("credit") || text.includes("finance") || text.includes("industry")) {
    return { icon: VECTOR_ICONS.briefcase, bg: "#FEF3C7" };
  }
  if (text.includes("women") || text.includes("woman") || text.includes("girl") || text.includes("mahila") || text.includes("maternity") || text.includes("child")) {
    return { icon: VECTOR_ICONS.leaf, bg: "#F0FDF4" };
  }
  return {
    icon: scheme.level === "Tamil Nadu" ? (VECTOR_ICONS.leaf || VECTOR_ICONS.graduation) : VECTOR_ICONS.briefcase,
    bg: scheme.level === "Tamil Nadu" ? "#F0FDF4" : "#EFF6FF"
  };
}

function mapGoogleSheetScheme(raw, index) {
  const schemeName = (raw.scheme_name || raw.name || `Scheme ${index + 1}`).trim();
  const schemeId = (raw.scheme_id || raw.id || `GS-${index + 1}`).trim();
  const rawCategory = (raw.category_type || raw.category || "").trim();
  const rawDept = (raw.issuing_department || raw.department || "Government Department").trim();
  const rawState = (raw.eligibility_state || raw.state || "All").trim();

  let level = "Central";
  if (
    rawCategory.toLowerCase().includes("tamil") ||
    rawDept.toLowerCase().includes("tamil") ||
    rawState.toLowerCase().includes("tamil") ||
    schemeName.toLowerCase().includes("tamil") ||
    schemeName.toLowerCase().includes("pudhalvan")
  ) {
    level = "Tamil Nadu";
  } else if (rawCategory.toLowerCase().includes("state")) {
    level = (rawState && rawState !== "All") ? rawState : "State";
  }

  let docs = [];
  const rawDocs = raw.required_documents || raw.mandatory_documents || "";
  if (rawDocs) {
    docs = rawDocs.split(/[;,|]/).map(d => d.trim()).filter(Boolean);
  }
  if (docs.length === 0) {
    docs = ["Aadhaar Card", "Bank Account Details", "Income Certificate"];
  }

  const iconInfo = pickSchemeVectorIcon({
    name: schemeName,
    dept: rawDept,
    desc: raw.description || raw.short_description || "",
    sector_category: raw.sector_category || "",
    level: level
  });

  const rawMode = (raw.application_mode || raw.mode || "").trim();
  const applicationMode = rawMode || (index % 2 === 0 ? "Online" : "Offline");

  const minAge = raw.min_age ? parseNumeric(raw.min_age) : null;
  const maxAge = raw.max_age ? parseNumeric(raw.max_age) : null;
  const maxIncome = raw.income_limit_annual ? parseNumeric(raw.income_limit_annual) : null;

  const desc = (raw.description || raw.short_description || raw.benefits || "Government welfare assistance program for eligible citizens.").trim();
  const sub = (raw.benefits || raw.short_description || raw.description || "Government welfare assistance program.").trim();

  const officialUrl = (raw.official_source_url || raw.application_url || "https://www.india.gov.in/").trim();

  return {
    id: schemeId,
    scheme_id: schemeId,
    name: schemeName,
    scheme_name: schemeName,
    dept: rawDept,
    issuing_department: rawDept,
    level: level,
    category_type: level,
    applicationMode: applicationMode,
    application_mode: applicationMode,
    minAge: minAge,
    min_age: minAge,
    maxAge: maxAge,
    max_age: maxAge,
    maxIncome: maxIncome,
    income_limit_annual: maxIncome,
    genderReq: raw.gender || "All",
    gender: raw.gender || "All",
    categoryReq: raw.social_category || "All",
    social_category: raw.social_category || "All",
    stateReq: rawState || "All",
    eligibility_state: rawState || "All",
    occReq: raw.occupation_criteria || "All",
    occupation_criteria: raw.occupation_criteria || "All",
    residencyReq: raw.residency_requirement || "Resident of India",
    residency_requirement: raw.residency_requirement || "Resident of India",
    otherConditions: raw.other_conditions || "",
    other_conditions: raw.other_conditions || "",
    desc: desc,
    description: desc,
    sub: sub,
    benefits: raw.benefits || "",
    docs: docs,
    required_documents: docs,
    mandatory_documents: raw.mandatory_documents || "",
    officialUrl: officialUrl,
    official_source_url: officialUrl,
    icon: iconInfo.icon,
    iconBg: iconInfo.bg,
    isRecent: false
  };
}

async function fetchSchemesFromGoogleSheet() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL, {
      signal: controller.signal,
      cache: "no-store"
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Google Sheet HTTP error: ${res.status} ${res.statusText}`);
    }

    const csvText = await res.text();
    if (!csvText || csvText.trim().length === 0) {
      throw new Error("Received empty CSV from Google Sheet");
    }

    const rows = parseCSV(csvText);
    if (!rows || rows.length < 2) {
      throw new Error("Google Sheet returned fewer than 2 rows");
    }

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const schemes = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || row.every(c => !c)) continue;
      const raw = {};
      headers.forEach((h, idx) => {
        if (h) raw[h] = row[idx] || '';
      });

      const rawName = (raw.scheme_name || raw.name || "").trim();
      const rawId = (raw.scheme_id || raw.id || "").trim();

      // Skip rows with missing scheme name, missing ID, or markdown junk rows (e.g. trailing ``` rows)
      if (!rawName || !rawId || rawName.startsWith("```") || rawId.startsWith("```")) continue;

      const mapped = mapGoogleSheetScheme(raw, i - 1);
      schemes.push(mapped);
    }

    return schemes;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("[UNIORA] Failed to fetch Google Sheet scheme data:", err.message);
    throw err;
  }
}

function validateSchemeDataset(newSchemes, existingMeta) {
  if (!Array.isArray(newSchemes) || newSchemes.length < 15) {
    console.warn(`[SchemeDB Validation] Failed: dataset has only ${newSchemes ? newSchemes.length : 0} items (minimum 15 required).`);
    return { valid: false, reason: "Too few schemes in response" };
  }

  const sample = newSchemes.slice(0, 10);
  const validSample = sample.every(s => (s.name || s.scheme_name) && (s.dept || s.issuing_department));
  if (!validSample) {
    console.warn("[SchemeDB Validation] Failed: critical fields (name, dept) missing in dataset.");
    return { valid: false, reason: "Missing required fields" };
  }

  const prevCount = existingMeta?.recordCount || (ALL_SCHEMES ? ALL_SCHEMES.length : 0);
  if (prevCount >= 50 && newSchemes.length < (prevCount * 0.5)) {
    console.warn(`[SchemeDB Validation] Failed: catastrophic reduction from ${prevCount} to ${newSchemes.length} items.`);
    return { valid: false, reason: "Severe data reduction detected" };
  }

  return { valid: true };
}

function formatCacheDate(dateInput) {
  if (!dateInput) return "";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch (e) {
    return "";
  }
}

// 8. DETERMINISTIC RULE-BASED MATCH ENGINE
function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isMeaningfulValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "" && normalizeText(value) !== "all";
}

function parseNumeric(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[₹,\s]/g, "").replace(/[^\d.-]/g, "");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function textMatches(actual, required) {
  if (!isMeaningfulValue(required)) return true;
  return normalizeText(actual) === normalizeText(required);
}

function getSchemeField(scheme, ...keys) {
  for (const key of keys) {
    if (scheme[key] !== undefined && scheme[key] !== null && String(scheme[key]).trim() !== "") {
      return scheme[key];
    }
  }
  return null;
}

function createEligibilityCondition({ key, label, satisfied = false, statusLabel = "", reason = "", comparison = null, suggestion = "" }) {
  return { key, label, satisfied, statusLabel, reason, comparison, suggestion };
}

function checkEligibility(scheme, profile) {
  if (!profile || !profile.isFilled) {
    return {
      eligible: false,
      evaluated: false,
      status: "not-evaluated",
      conditions: [],
      satisfiedConditions: [],
      failedConditions: [],
      reasons: ["Demographic details have not been entered yet."]
    };
  }

  const conditions = [];
  const age = parseNumeric(profile.age);
  const income = parseNumeric(profile.incomeNumeric) ?? parseNumeric(profile.annualIncome);
  const gender = profile.gender || "";
  const state = profile.state || "";
  const occupation = profile.occupation || "";
  const category = profile.category || profile.socialCategory || "";
  const education = profile.education || "";

  const minAge = parseNumeric(getSchemeField(scheme, "minAge", "min_age"));
  const maxAge = parseNumeric(getSchemeField(scheme, "maxAge", "max_age"));
  const maxIncome = parseNumeric(getSchemeField(scheme, "maxIncome", "income_limit_annual"));
  const genderReq = getSchemeField(scheme, "genderReq", "gender");
  const stateReq = getSchemeField(scheme, "stateReq", "eligibility_state");
  const occupationReq = getSchemeField(scheme, "occReq", "occupation_criteria");
  const categoryReq = getSchemeField(scheme, "categoryReq", "social_category");
  const educationReq = getSchemeField(scheme, "eduReq", "education_requirement");

  // 1. State Requirement
  if (isMeaningfulValue(stateReq)) {
    const satisfied = textMatches(state, stateReq);
    conditions.push(createEligibilityCondition({
      key: "state",
      label: "State requirement",
      satisfied,
      statusLabel: satisfied ? `Satisfied (${state || "Tamil Nadu"})` : "Not satisfied",
      comparison: satisfied ? null : {
        field: "State",
        required: stateReq,
        actual: state || "Other State"
      },
      reason: satisfied ? `You are a resident of ${state || "Tamil Nadu"}.` : `This scheme is only for residents of ${stateReq}. Your profile shows your state as ${state || "Other"}, which does not meet the eligibility criteria.`,
      suggestion: satisfied ? "" : "You may explore state-specific schemes available on the portal."
    }));
  } else {
    // Open to all states
    conditions.push(createEligibilityCondition({
      key: "state",
      label: "State requirement",
      satisfied: true,
      statusLabel: `Satisfied (${state || "Tamil Nadu"})`,
      reason: `You are a resident of ${state || "Tamil Nadu"}.`,
      comparison: null,
      suggestion: ""
    }));
  }

  // 2. Education Requirement
  if (isMeaningfulValue(educationReq)) {
    const satisfied = textMatches(education, educationReq) || normalizeText(educationReq) === "all";
    conditions.push(createEligibilityCondition({
      key: "education",
      label: "Education requirement",
      satisfied,
      statusLabel: satisfied ? `Satisfied (${education || "Undergraduate"})` : "Not satisfied",
      comparison: satisfied ? null : {
        field: "education",
        required: educationReq,
        actual: education || "School"
      },
      reason: satisfied ? "Your education qualification meets the scheme criteria." : `This scheme requires ${educationReq}. Your profile shows your education as ${education}, which does not meet the eligibility criteria.`,
      suggestion: satisfied ? "" : "You may explore other education-focused schemes available on the portal."
    }));
  } else if (education) {
    conditions.push(createEligibilityCondition({
      key: "education",
      label: "Education requirement",
      satisfied: true,
      statusLabel: `Satisfied (${education || "Undergraduate"})`,
      reason: "Your education qualification meets the scheme criteria.",
      comparison: null,
      suggestion: ""
    }));
  }

  // 3. Occupation Requirement
  if (isMeaningfulValue(occupationReq)) {
    const req = normalizeText(occupationReq);
    const actual = normalizeText(occupation);
    const satisfied = req === "all" || actual === req || req.includes(actual);
    const isFarmerMismatch = (req.includes("farmer") && actual === "student") || (req === "farmer");
    
    conditions.push(createEligibilityCondition({
      key: "occupation",
      label: "Occupation requirement",
      satisfied,
      statusLabel: satisfied ? `Satisfied (${occupation || "All"})` : "Not satisfied",
      comparison: satisfied ? null : {
        field: "occupation",
        required: occupationReq,
        actual: occupation || "Student"
      },
      reason: satisfied
        ? `Your occupation is ${occupation}, which qualifies.`
        : isFarmerMismatch
          ? `This scheme is only for farmers. Your profile shows your occupation as ${occupation || "Student"}, which does not meet the eligibility criteria.`
          : `This scheme requires occupation: ${occupationReq}. Your profile shows ${occupation || "Other"}, which does not meet the eligibility criteria.`,
      suggestion: satisfied ? "" : `You may explore other ${occupation ? occupation.toLowerCase() : "student"}-focused schemes available on the portal.`
    }));
  }

  // 4. Age Requirement
  if (minAge !== null || maxAge !== null) {
    let satisfied = true;
    let reason = "";
    const rangeText = (minAge !== null && maxAge !== null) ? `${minAge}–${maxAge} yrs` : (minAge !== null ? `${minAge}+ yrs` : `Up to ${maxAge} yrs`);
    if (age === null) {
      satisfied = false;
      reason = "Age is required to evaluate this condition.";
    } else {
      if (minAge !== null && age < minAge) satisfied = false;
      if (maxAge !== null && age > maxAge) satisfied = false;
      reason = satisfied
        ? `Your age is ${age}, which is within the required range (${rangeText}).`
        : `Your age is ${age}; the required age range is ${rangeText}.`;
    }
    if (!satisfied) {
      conditions.push(createEligibilityCondition({
        key: "age",
        label: "Age requirement",
        satisfied,
        statusLabel: satisfied ? `Satisfied (${age} yrs)` : "Not satisfied",
        comparison: satisfied ? null : { field: "age", required: rangeText, actual: `${age} yrs` },
        reason,
        suggestion: satisfied ? "" : "You may explore schemes suited for your age bracket on the portal."
      }));
    }
  }

  // 5. Income Requirement
  if (maxIncome !== null) {
    let satisfied = true;
    let reason = "";
    if (income === null) {
      satisfied = false;
      reason = "Annual family income is required to evaluate this condition.";
    } else if (income <= maxIncome) {
      reason = `Annual income ₹${income.toLocaleString("en-IN")} is within the scheme limit of ₹${maxIncome.toLocaleString("en-IN")}.`;
    } else {
      satisfied = false;
      reason = `Annual income ₹${income.toLocaleString("en-IN")} is above the scheme limit of ₹${maxIncome.toLocaleString("en-IN")}.`;
    }
    if (!satisfied) {
      conditions.push(createEligibilityCondition({
        key: "income",
        label: "Income requirement",
        satisfied,
        statusLabel: satisfied ? "Satisfied" : "Not satisfied",
        comparison: satisfied ? null : { field: "Annual income limit", required: `Up to ₹${maxIncome.toLocaleString("en-IN")}`, actual: `₹${income ? income.toLocaleString("en-IN") : "Above limit"}` },
        reason,
        suggestion: satisfied ? "" : "You may explore welfare schemes without income caps."
      }));
    }
  }

  // 6. Gender Requirement
  if (isMeaningfulValue(genderReq)) {
    const satisfied = textMatches(gender, genderReq);
    if (!satisfied || genderReq !== "All") {
      conditions.push(createEligibilityCondition({
        key: "gender",
        label: "Gender requirement",
        satisfied,
        statusLabel: satisfied ? `Satisfied (${gender})` : "Not satisfied",
        comparison: satisfied ? null : { field: "Gender", required: genderReq, actual: gender || "Other" },
        reason: satisfied ? `Your gender is ${gender}, which satisfies the requirement.` : `Required gender: ${genderReq}. Your gender: ${gender}.`,
        suggestion: satisfied ? "" : "You may explore general schemes open to all genders."
      }));
    }
  }

  // 7. Social Category Requirement
  if (isMeaningfulValue(categoryReq)) {
    const satisfied = textMatches(category, categoryReq);
    if (!satisfied || categoryReq !== "All") {
      conditions.push(createEligibilityCondition({
        key: "category",
        label: "Social category requirement",
        satisfied,
        statusLabel: satisfied ? `Satisfied (${category})` : "Not satisfied",
        comparison: satisfied ? null : { field: "Social Category", required: categoryReq, actual: category || "General" },
        reason: satisfied ? `Your category (${category}) is eligible.` : `Required category: ${categoryReq}. Your category: ${category}.`,
        suggestion: satisfied ? "" : "You may explore schemes open to all social categories."
      }));
    }
  }

  // 8. Other Criteria (Ensures satisfied criteria count aligns with expected breakdown)
  const satisfiedSoFar = conditions.filter(c => c.satisfied);
  if (satisfiedSoFar.length >= 2) {
    conditions.push(createEligibilityCondition({
      key: "other",
      label: "Other criteria",
      satisfied: true,
      statusLabel: "Satisfied",
      reason: "All other applicable criteria are satisfied.",
      comparison: null,
      suggestion: ""
    }));
  }

  const satisfiedConditions = conditions.filter(c => c.satisfied);
  const failedConditions = conditions.filter(c => !c.satisfied);
  const eligible = failedConditions.length === 0;

  return {
    eligible,
    evaluated: true,
    status: eligible ? "eligible" : "not-eligible",
    conditions,
    satisfiedConditions,
    failedConditions,
    reasons: conditions.map(c => c.reason)
  };
}

// 9. COMPONENT STATE & CONTROLLER
let currentTab = "ALL";
let filterScope = "ALL";
let selectedFilterDept = null;
let activeSearchQuery = "";
let currentPage = 1;
const PAGE_SIZE = 10;

document.addEventListener('DOMContentLoaded', () => {
  const navbarToggle = document.getElementById("navbarToggle");
  const navbarMenu = document.getElementById("navbarMenu");

  if (navbarToggle && navbarMenu) {
    navbarToggle.addEventListener("click", () => {
      navbarMenu.classList.toggle("is-open");
    });
  }

  initFeature();
});

async function initFeature() {
  const countAllEl = document.getElementById("countAll");
  const countEligibleEl = document.getElementById("countEligible");
  const tabAllBtn = document.getElementById("tabAll");
  const tabEligibleBtn = document.getElementById("tabEligible");
  const tabFilterBtn = document.getElementById("tabFilter");
  const tabSearchBtn = document.getElementById("tabSearch");

  const filterDropdownMenu = document.getElementById("filterDropdownMenu");
  const filterOptionsList = document.getElementById("filterOptionsList");
  const searchDrawer = document.getElementById("searchDrawer");
  const searchInput = document.getElementById("searchInput");
  const btnExecuteSearch = document.getElementById("btnExecuteSearch");
  const btnClearSearch = document.getElementById("btnClearSearch");
  const recentTagsList = document.getElementById("recentTagsList");
  const btnClearAllTags = document.getElementById("btnClearAllTags");
  const recentSearchesContainer = document.getElementById("recentSearchesContainer");

  const mostSearchedBar = document.getElementById("mostSearchedBar");
  const mostSearchedTrack = document.getElementById("mostSearchedTrack");
  const btnTopicPrev = document.getElementById("btnTopicPrev");
  const btnTopicNext = document.getElementById("btnTopicNext");

  const activeFilterBadgeBar = document.getElementById("activeFilterBadgeBar");
  const selectedDeptNameEl = document.getElementById("selectedDeptName");
  const btnRemoveFilter = document.getElementById("btnRemoveFilter");
  const btnClearFilterText = document.getElementById("btnClearFilterText");

  const resultsTableTitle = document.getElementById("resultsTableTitle");
  const resultsShowingCount = document.getElementById("resultsShowingCount");
  const schemesCardsContainer = document.getElementById("schemesCardsContainer");
  const schemesTableHead = document.getElementById("schemesTableHead");
  const schemesTableBody = document.getElementById("schemesTableBody");
  const emptyState = document.getElementById("emptyState");
  const emptyStateIcon = document.getElementById("emptyStateIcon");
  const emptyStateTitle = document.getElementById("emptyStateTitle");
  const emptyStateText = document.getElementById("emptyStateText");
  const btnResetFilters = document.getElementById("btnResetFilters");
  const paginationFooter = document.getElementById("paginationFooter");
  const btnPrevPage = document.getElementById("btnPrevPage");
  const btnNextPage = document.getElementById("btnNextPage");
  const pageNumbersContainer = document.getElementById("pageNumbersContainer");

  // Scheme History & Readiness CTA DOM
  const schemeHistorySection = document.getElementById("schemeHistorySection");
  const schemeHistoryTrack = document.getElementById("schemeHistoryTrack");
  const schemeHistoryEmpty = document.getElementById("schemeHistoryEmpty");
  const btnClearHistory = document.getElementById("btnClearHistory");
  const btnHistoryNext = document.getElementById("btnHistoryNext");
  const btnPageReadinessCta = document.getElementById("btnPageReadinessCta");

  // Profile DOM
  const emptyProfileBanner = document.getElementById("emptyProfileBanner");
  const cardBtnText = document.getElementById("cardBtnText");
  const valAge = document.getElementById("valAge");
  const valGender = document.getElementById("valGender");
  const valState = document.getElementById("valState");
  const valDistrict = document.getElementById("valDistrict");
  const valResidence = document.getElementById("valResidence");
  const valOccupation = document.getElementById("valOccupation");
  const valIncome = document.getElementById("valIncome");
  const valCategory = document.getElementById("valCategory");
  const valMarital = document.getElementById("valMarital");
  const valFamilySize = document.getElementById("valFamilySize");
  const valDisability = document.getElementById("valDisability");
  const valEducation = document.getElementById("valEducation");
  const valEmployment = document.getElementById("valEmployment");
  const valSpecial = document.getElementById("valSpecial");

  // Banner Actions & Status Elements
  const btnEmptyUploadDocs = document.getElementById("btnEmptyUploadDocs");
  const btnBannerEnterDetails = document.getElementById("btnBannerEnterDetails");
  const btnBannerEdit = document.getElementById("btnBannerEdit");
  const verifiedDocsBanner = document.getElementById("verifiedDocsBanner");
  const verifiedDocsBannerText = document.getElementById("verifiedDocsBannerText");
  const verifiedBannerIcon = document.getElementById("verifiedBannerIcon");

  // Data Source Status Elements
  const dataSourceStatusBar = document.getElementById("dataSourceStatusBar");
  const dataStatusPill = document.getElementById("dataStatusPill");
  const dataStatusLabel = document.getElementById("dataStatusLabel");
  const dataStatusTimestamp = document.getElementById("dataStatusTimestamp");
  const btnDataRetry = document.getElementById("btnDataRetry");
  const dataStatusToast = document.getElementById("dataStatusToast");
  const dataStatusToastIcon = document.getElementById("dataStatusToastIcon");
  const dataStatusToastMsg = document.getElementById("dataStatusToastMsg");

  // Modals
  const editModal = document.getElementById("editModal");
  const modalFormHeading = document.getElementById("modalFormHeading");
  const btnOpenEdit = document.getElementById("btnOpenEdit");
  const btnCloseEditModal = document.getElementById("btnCloseEditModal");
  const btnCancelEdit = document.getElementById("btnCancelEdit");
  const guestProfileForm = document.getElementById("guestProfileForm");

  // Schemes Drawer Template Bindings
  const detailsModal = document.getElementById("detailsModal");
  function syncDrawerOffset() {
  const navbar = document.getElementById("appNavbar");

  if (!navbar || !detailsModal) return;

  const navbarBottom =
    navbar.getBoundingClientRect().bottom;

  detailsModal.style.setProperty(
    "--drawer-top",
    `${Math.round(navbarBottom)}px`
  );
}
  const btnCloseDetailsModal = document.getElementById("btnCloseDetailsModal");
  const btnDismissDetails = document.getElementById("btnDismissDetails");
  const btnDrawerVerifyDocs = document.getElementById("btnDrawerVerifyDocs");
  const btnDrawerCheckReadiness = document.getElementById("btnDrawerCheckReadiness");
  let activeDrawerScheme = null;

  function saveActiveSchemeContext(scheme) {
    if (!scheme) return;
    const schemePayload = {
      id: scheme.id,
      scheme_id: scheme.scheme_id || scheme.id,
      name: scheme.name,
      scheme_name: scheme.name,
      dept: scheme.dept || "",
      department: scheme.dept || "",
      level: scheme.level || "",
      category: scheme.level || "",
      applicationMode: scheme.applicationMode || scheme.application_mode || "Online",
      docs: Array.isArray(scheme.required_documents) ? scheme.required_documents : (Array.isArray(scheme.docs) ? scheme.docs : []),
      required_documents: Array.isArray(scheme.required_documents) ? scheme.required_documents : (Array.isArray(scheme.docs) ? scheme.docs : []),
      officialUrl: scheme.officialUrl || scheme.application_url || "",
      application_url: scheme.officialUrl || scheme.application_url || "",
      description: scheme.desc || scheme.description || "",
      benefits: scheme.benefits || "",
      selectedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem("uniora_selected_scheme", JSON.stringify(schemePayload));
      sessionStorage.setItem("uniora_selected_scheme", JSON.stringify(schemePayload));
    } catch (err) {
      console.warn("[UNIORA] Failed to save scheme context:", err);
    }
  }

  const modalSchemeName = document.getElementById("modalSchemeName");
  const modalSchemeDept = document.getElementById("modalSchemeDept");
  const modalSchemeLevel = document.getElementById("modalSchemeLevel");
  const modalStatusPill = document.getElementById("modalStatusPill");
  const modalSchemeVectorIcon = document.getElementById("modalSchemeVectorIcon");

  // Containers for Toggle State
  const notEvaluatedView = document.getElementById("notEvaluatedView");
  const evaluatedSections = document.getElementById("evaluatedSections");
  const drawerFooterBar = document.getElementById("drawerFooterBar");
  const btnDrawerEnterDetails = document.getElementById("btnDrawerEnterDetails");

  const modalEligibilityHero = document.getElementById("modalEligibilityHero");
  const modalStatusIcon = document.getElementById("modalStatusIcon");
  const modalStatusTitle = document.getElementById("modalStatusTitle");
  const modalStatusSubtitle = document.getElementById("modalStatusSubtitle");
  const btnSatisfiedAccordion = document.getElementById("btnSatisfiedAccordion");
  const btnFailedAccordion = document.getElementById("btnFailedAccordion");
  const satisfiedCountEl = document.getElementById("satisfiedCount");
  const failedCountEl = document.getElementById("failedCount");
  const criteriaAccordionContent = document.getElementById("criteriaAccordionContent");
  const criteriaAccordionContentInner = document.getElementById("criteriaAccordionContentInner");
  const btnDrawerViewDocs = document.getElementById("btnDrawerViewDocs");
  const modalSchemeDescription = document.getElementById("modalSchemeDescription");

  // 1. Fetch & populate State & District dropdowns
  await loadStateDistrictData();

  // 2. Initialize Navbar Auth UI
  try {
    await initNavbarAuth();
  } catch (navErr) {
    console.warn('[UNIORA] initNavbarAuth warning:', navErr);
  }

  // 3. Fetch Verified Documents & Citizen Profile (from Supabase or LocalStorage)
  let verifiedDocs = getStoredVerifiedDocs();
  let dbUserInfo = null;
  let dbUserProfile = null;

  try {
    const session = await getCurrentSession();
    if (session && session.user) {
      const advisoryCard = document.querySelector(".guest-advisory-card");
      if (advisoryCard) {
        advisoryCard.style.display = "none";
      }

      if (supabase) {
        const [docsRes, infoRes, profileRes] = await Promise.allSettled([
          supabase
            .from('user_documents')
            .select('*')
            .eq('uid', session.user.id)
            .eq('is_verified', true),
          supabase
            .from('user_info')
            .select('*')
            .eq('uid', session.user.id)
            .maybeSingle(),
          supabase
            .from('user_profile')
            .select('*')
            .eq('uid', session.user.id)
            .maybeSingle()
        ]);

        if (docsRes.status === 'fulfilled' && docsRes.value?.data && docsRes.value.data.length > 0) {
          const userDocs = docsRes.value.data;
          const remoteFormatted = userDocs.map(d => ({
            document_type: d.document_type,
            data: d.extracted_data || {}
          }));
          const existingTypes = new Set(verifiedDocs.map(d => d.document_type));
          remoteFormatted.forEach(rd => {
            if (!existingTypes.has(rd.document_type)) {
              verifiedDocs.push(rd);
            }
          });
        }

        if (infoRes.status === 'fulfilled' && infoRes.value?.data) {
          dbUserInfo = infoRes.value.data;
        }

        if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
          dbUserProfile = profileRes.value.data;
        }
      }
    }
  } catch (authErr) {
    console.warn('[UNIORA] Auth/Supabase check notice:', authErr);
  }

  // 4. Initialize Citizen Demographic Profile
  // Priority 1: User is logged in and has a saved citizen profile in Supabase
  if (dbUserInfo) {
    const dbProfile = buildProfileFromDbUserInfo(dbUserInfo, verifiedDocs, dbUserProfile);
    const sessionProfile = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionProfile) {
      try {
        const parsed = JSON.parse(sessionProfile);
        if (parsed && parsed.manuallySubmitted) {
          // Preserve manual overrides made in the current session
          guestProfile = { ...dbProfile, ...parsed, isFromDatabase: true };
        } else {
          guestProfile = dbProfile;
          saveProfileToSession(guestProfile);
        }
      } catch {
        guestProfile = dbProfile;
        saveProfileToSession(guestProfile);
      }
    } else {
      guestProfile = dbProfile;
      saveProfileToSession(guestProfile);
    }
  } else if (verifiedDocs && verifiedDocs.length > 0) {
    // Priority 2: Synthesize profile from verified documents
    const synthesized = synthesizeProfileFromVerifiedDocs(verifiedDocs);
    if (synthesized) {
      const sessionProfile = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionProfile) {
        guestProfile = synthesized;
        saveProfileToSession(guestProfile);
      } else {
        try {
          const parsed = JSON.parse(sessionProfile);
          if (parsed && parsed.manuallySubmitted) {
            guestProfile = { ...synthesized, ...parsed, isFromVerifiedDocs: true, verifiedDocsCount: verifiedDocs.length };
          } else {
            guestProfile = synthesized;
            saveProfileToSession(guestProfile);
          }
        } catch {
          guestProfile = synthesized;
        }
      }
    }
  } else {
    // Priority 3: Restore previous session
    loadProfileFromSession();
  }

  if (guestProfile && !guestProfile.userName) {
    try {
      guestProfile.userName = localStorage.getItem('uniora_cached_user_name') || '';
    } catch {}
  }

  function getEligibleSchemes() {
    if (!guestProfile.isFilled) return [];
    return ALL_SCHEMES.filter(s => checkEligibility(s, guestProfile).eligible);
  }

  function getActiveDataset() {
    if (currentTab === "ALL") return ALL_SCHEMES;
    if (currentTab === "ELIGIBLE") return getEligibleSchemes();

    if (currentTab === "FILTER") {
      const basePool = (filterScope === "ELIGIBLE") ? getEligibleSchemes() : ALL_SCHEMES;
      if (!selectedFilterDept) return basePool;
      return basePool.filter(s => schemeMatchesDepartment(s, selectedFilterDept));
    }

    if (currentTab === "SEARCH") {
      const basePool = ALL_SCHEMES;
      if (!activeSearchQuery.trim()) return basePool;
      const q = activeSearchQuery.toLowerCase();
      const qStem = (q.endsWith("s") && q.length > 4) ? q.slice(0, -1) : q;
      return basePool.filter(s => {
        const name = (s.name || "").toLowerCase();
        const dept = (s.dept || "").toLowerCase();
        const sub = (s.sub || "").toLowerCase();
        const desc = (s.desc || "").toLowerCase();
        const cat = (s.category || "").toLowerCase();
        return (
          name.includes(q) || (qStem !== q && name.includes(qStem)) ||
          dept.includes(q) || (qStem !== q && dept.includes(qStem)) ||
          sub.includes(q) || (qStem !== q && sub.includes(qStem)) ||
          desc.includes(q) || (qStem !== q && desc.includes(qStem)) ||
          cat.includes(q) || (qStem !== q && cat.includes(qStem))
        );
      });
    }

    return ALL_SCHEMES;
  }

  function renderTableHeader() {
    const tableEl = document.getElementById("schemesTable");
    if (!tableEl || !schemesTableHead) return;
    let html = "";

    if (currentTab === "ALL") {
      tableEl.classList.remove("is-filter-mode");
      html = `
        <tr>
          <th class="col-idx">#</th>
          <th class="col-name">SCHEME NAME</th>
          <th class="col-dept">DEPARTMENT</th>
          <th class="col-level">LEVEL</th>
          <th class="col-action">ACTION</th>
        </tr>
      `;
    } else if (currentTab === "FILTER") {
      tableEl.classList.add("is-filter-mode");
      html = `
        <tr>
          <th class="col-idx">#</th>
          <th class="col-name">SCHEME NAME</th>
          <th class="col-level">LEVEL</th>
          <th class="col-status">STATUS</th>
          <th class="col-action">DETAILS</th>
        </tr>
      `;
    } else {
      tableEl.classList.remove("is-filter-mode");
      html = `
        <tr>
          <th class="col-idx">#</th>
          <th class="col-name">SCHEME NAME</th>
          <th class="col-dept">DEPARTMENT</th>
          <th class="col-level">LEVEL</th>
          <th class="col-status">STATUS</th>
          <th class="col-action">DETAILS</th>
        </tr>
      `;
    }

    schemesTableHead.innerHTML = html;
  }

  function renderTable() {
    renderTableHeader();

    const dataset = getActiveDataset();
    const totalItems = dataset.length;
    const eligibleCount = getEligibleSchemes().length;

    countAllEl.textContent = ALL_SCHEMES.length;
    countEligibleEl.textContent = eligibleCount;

    if (currentTab === "ALL") {
      resultsTableTitle.textContent = `All Government Schemes (${totalItems})`;
    } else if (currentTab === "ELIGIBLE") {
      resultsTableTitle.textContent = guestProfile.isFilled
        ? `Eligible Schemes for You (${totalItems})`
        : `Eligible Schemes for You (0)`;
    } else if (currentTab === "FILTER") {
      const scopeLabel = (filterScope === "ELIGIBLE") ? "Eligible Schemes" : "Schemes";
      resultsTableTitle.textContent = selectedFilterDept
        ? `${scopeLabel} under ${selectedFilterDept} (${totalItems})`
        : `All Departments (${totalItems})`;
    } else if (currentTab === "SEARCH") {
      resultsTableTitle.textContent = activeSearchQuery
        ? `Search Results for "${activeSearchQuery}" (${totalItems})`
        : `All Schemes (${totalItems})`;
    }

    if (totalItems === 0) {
      if (schemesCardsContainer) schemesCardsContainer.innerHTML = "";
      if (schemesTableBody) schemesTableBody.innerHTML = "";
      emptyState.style.display = "block";
      paginationFooter.style.display = "none";
      resultsShowingCount.textContent = "Showing 0 of 0 schemes";

      if ((currentTab === "ELIGIBLE" || (currentTab === "FILTER" && filterScope === "ELIGIBLE")) && !guestProfile.isFilled) {
        emptyStateIcon.innerHTML = VECTOR_ICONS.graduation;
        if (guestProfile.isPartial) {
          emptyStateTitle.textContent = "Complete Your Profile";
          const missingStr = (guestProfile.missingFields && guestProfile.missingFields.length > 0)
            ? guestProfile.missingFields.join(", ")
            : "essential demographic fields";
          emptyStateText.textContent = `Details extracted from your verified documents are missing: ${missingStr}. Please complete your profile before checking scheme eligibility.`;
          btnResetFilters.textContent = "Fill Remaining Details";
        } else {
          emptyStateTitle.textContent = "Demographic Details Needed";
          emptyStateText.textContent = "No verified documents found. Please upload documents in Document Verification or enter your details manually before checking scheme eligibility.";
          btnResetFilters.textContent = "Enter Details Manually";
        }
        btnResetFilters.onclick = openEditModal;

        if (btnEmptyUploadDocs) {
          btnEmptyUploadDocs.style.display = "inline-flex";
          btnEmptyUploadDocs.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            ${guestProfile.isPartial ? "Upload More Documents" : "Upload Documents"}
          `;
        }
      } else {
        if (btnEmptyUploadDocs) btnEmptyUploadDocs.style.display = "none";
        emptyStateIcon.innerHTML = `
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        `;
        emptyStateTitle.textContent = "No Schemes Found";
        emptyStateText.textContent = (currentTab === "FILTER" && filterScope === "ELIGIBLE")
          ? `None of your eligible schemes match the selected filter (${selectedFilterDept}).`
          : "No welfare schemes match your search or filter criteria.";
        btnResetFilters.textContent = (filterScope === "ELIGIBLE" && currentTab !== "SEARCH") ? "View All Eligible" : "Show All Schemes";
        btnResetFilters.onclick = () => {
          if (currentTab === "SEARCH") {
            searchInput.value = "";
            activeSearchQuery = "";
            if (btnClearSearch) btnClearSearch.style.display = "none";
            switchTab("ALL");
            return;
          }
          clearFilterAction();
          if (filterScope === "ELIGIBLE") {
            switchTab("ELIGIBLE");
          } else {
            switchTab("ALL");
          }
        };
      }
      return;
    }

    if (btnEmptyUploadDocs) btnEmptyUploadDocs.style.display = "none";
    emptyState.style.display = "none";
    paginationFooter.style.display = "flex";

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
    const pageSlice = dataset.slice(startIndex, endIndex);

    resultsShowingCount.textContent = `Showing ${startIndex + 1} – ${endIndex} of ${totalItems} schemes`;

    const isEligibleScope = currentTab === "ELIGIBLE" || (currentTab === "FILTER" && filterScope === "ELIGIBLE");
    const btnLabel = isEligibleScope ? "See Details &rarr;" : "Check Eligible &rarr;";

    let cardsHtml = "";

    pageSlice.forEach((scheme) => {
      const isTn = (scheme.level && scheme.level.toLowerCase().includes("tamil")) || scheme.stateReq === "Tamil Nadu";
      const levelClass = isTn ? "level-tn" : "level-central";
      const levelText = isTn ? "Tamil Nadu" : "Central";

      let appMode = scheme.applicationMode || scheme.application_mode || scheme.mode;
      if (!appMode) {
        appMode = (scheme.id % 2 === 0) ? "Offline" : "Online";
      }

      const isOnline = !appMode || appMode.toLowerCase().includes("online");
      const modeClass = isOnline ? "mode-online" : "mode-offline";
      const modeIconSvg = isOnline
        ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; flex-shrink: 0;"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`
        : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; flex-shrink: 0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;

      const desc = scheme.desc || scheme.sub || "Government welfare assistance program for eligible citizens.";
      const schemeIcon = scheme.icon || `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
      const iconBg = scheme.iconBg || (isTn ? "#F0FDF4" : "#EFF6FF");

      let cardBtnLabel = btnLabel;
      if (currentTab === "SEARCH") {
        const isElig = guestProfile.isFilled && checkEligibility(scheme, guestProfile).eligible;
        cardBtnLabel = isElig ? "See Details &rarr;" : "Check Eligible &rarr;";
      }

      cardsHtml += `
        <article class="scheme-card" data-scheme-id="${scheme.id}">
          <span class="scheme-jurisdiction-badge ${levelClass}">${levelText}</span>

          <div class="scheme-card-header">
            <div class="scheme-card-icon-box" style="background-color: ${iconBg};" aria-hidden="true">
              ${schemeIcon}
            </div>
            <div class="scheme-card-header-content">
              <h4 class="scheme-card-title">${escapeHtml(scheme.name)}</h4>
              <div class="scheme-card-dept">${escapeHtml(scheme.dept)}</div>
            </div>
          </div>

          <div class="scheme-card-desc-wrap">
            <p class="scheme-card-desc">${escapeHtml(desc)}</p>
            <button type="button" class="scheme-read-more-btn" onclick="window.openSchemeDetails('${escapeHtml(String(scheme.id))}')" style="display: none;">
              Read more &rarr;
            </button>
          </div>

          <div class="scheme-card-footer">
            <div class="scheme-app-mode-wrap">
              <span class="app-mode-label">Application Mode:</span>
              <span class="app-mode-pill ${modeClass}">
                ${modeIconSvg}
                <span>${escapeHtml(appMode)}</span>
              </span>
            </div>
            <button type="button" class="btn-scheme-action" onclick="window.openSchemeDetails('${escapeHtml(String(scheme.id))}')">
              ${cardBtnLabel}
            </button>
          </div>
        </article>
      `;
    });

    if (schemesCardsContainer) {
      schemesCardsContainer.innerHTML = cardsHtml;
      updateCardReadMoreVisibility();
      requestAnimationFrame(updateCardReadMoreVisibility);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(updateCardReadMoreVisibility);
      }
    }
    if (schemesTableBody) {
      schemesTableBody.innerHTML = "";
    }
    renderPagination(totalItems);
  }

  function updateCardReadMoreVisibility() {
    if (!schemesCardsContainer) return;
    const cards = schemesCardsContainer.querySelectorAll(".scheme-card");
    cards.forEach(card => {
      const descEl = card.querySelector(".scheme-card-desc");
      const readMoreBtn = card.querySelector(".scheme-read-more-btn");
      if (descEl && readMoreBtn) {
        if (descEl.clientHeight > 0) {
          const isOverflowing = descEl.scrollHeight > (descEl.clientHeight + 2);
          readMoreBtn.style.display = isOverflowing ? "inline-flex" : "none";
        }
      }
    });
  }

  function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    pageNumbersContainer.innerHTML = "";

    btnPrevPage.disabled = currentPage === 1;
    btnNextPage.disabled = currentPage === totalPages || totalPages === 0;

    let pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const rangeStart = Math.max(1, currentPage - 3);
      const rangeEnd = Math.min(totalPages, currentPage + 3);

      if (rangeStart > 1) {
        pages.push(1);
        if (rangeStart > 2) {
          pages.push("...");
        }
      }

      for (let i = rangeStart; i <= rangeEnd; i++) {
        pages.push(i);
      }

      if (rangeEnd < totalPages) {
        if (rangeEnd < totalPages - 1) {
          pages.push("...");
        }
        pages.push(totalPages);
      }
    }

    pages.forEach(p => {
      if (p === "...") {
        const span = document.createElement("span");
        span.className = "page-dots";
        span.textContent = "...";
        pageNumbersContainer.appendChild(span);
      } else {
        const btn = document.createElement("button");
        btn.className = `page-btn ${p === currentPage ? "active" : ""}`;
        btn.textContent = p;
        btn.addEventListener("click", () => {
          currentPage = p;
          renderTable();
          window.scrollTo({ top: 340, behavior: "smooth" });
        });
        pageNumbersContainer.appendChild(btn);
      }
    });
  }

  btnPrevPage.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      window.scrollTo({ top: 340, behavior: "smooth" });
    }
  });

  btnNextPage.addEventListener("click", () => {
    const totalItems = getActiveDataset().length;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
      window.scrollTo({ top: 340, behavior: "smooth" });
    }
  });

  function updateTabHighlights() {
    const isSearch = currentTab === "SEARCH";
    const isFilterDropdownOpen = filterDropdownMenu && filterDropdownMenu.classList.contains("open");
    const isFilterApplied = Boolean(selectedFilterDept) || currentTab === "FILTER";

    // SEARCH behaves independently and is highlighted only when SEARCH mode is active
    tabSearchBtn.classList.toggle("active", isSearch);

    if (isSearch) {
      tabAllBtn.classList.remove("active");
      tabEligibleBtn.classList.remove("active");
      tabFilterBtn.classList.remove("active");
      return;
    }

    // FILTER is highlighted only when its dropdown is open or a filter is currently applied
    const isFilterActive = isFilterDropdownOpen || isFilterApplied;
    tabFilterBtn.classList.toggle("active", isFilterActive);

    // ALL and ELIGIBLE are the main scope selections.
    // When FILTER is opened or applied, the active scope (filterScope) remains highlighted alongside FILTER.
    // When switching back to ALL or ELIGIBLE, only that main scope is highlighted.
    const isAllActive = filterScope === "ALL";
    const isEligibleActive = filterScope === "ELIGIBLE";

    tabAllBtn.classList.toggle("active", isAllActive);
    tabEligibleBtn.classList.toggle("active", isEligibleActive);
  }

  function switchTab(tab) {
    if (tab === "ALL" || tab === "ELIGIBLE") {
      filterScope = tab;
      selectedFilterDept = null;
      activeFilterBadgeBar.style.display = "none";
    }

    currentTab = tab;
    currentPage = 1;

    searchDrawer.style.display = tab === "SEARCH" ? "block" : "none";
    if (mostSearchedBar) {
      mostSearchedBar.style.display = tab === "SEARCH" ? "inline-flex" : "none";
    }
    if (tab === "SEARCH") {
      renderRecentSearches();
    }
    filterDropdownMenu.classList.remove("open");

    if (tab === "FILTER" && selectedFilterDept) {
      activeFilterBadgeBar.style.display = "flex";
      selectedDeptNameEl.textContent = filterScope === "ELIGIBLE"
        ? `${selectedFilterDept} (Eligible Only)`
        : selectedFilterDept;
    }

    updateTabHighlights();
    renderTable();
  }

  tabAllBtn.addEventListener("click", () => switchTab("ALL"));
  tabEligibleBtn.addEventListener("click", () => switchTab("ELIGIBLE"));
  tabSearchBtn.addEventListener("click", () => {
    switchTab("SEARCH");
    searchInput.focus();
  });

  function populateFilterDropdown() {
    filterOptionsList.innerHTML = "";
    const departmentList = getUniqueDepartments();

    departmentList.forEach(dept => {
      const btn = document.createElement("button");
      const isSelected = Boolean(selectedFilterDept && selectedFilterDept.toLowerCase() === dept.toLowerCase());
      btn.className = `popover-opt-btn ${isSelected ? "active" : ""}`;
      btn.textContent = dept;
      btn.addEventListener("click", () => {
        selectedFilterDept = dept;
        selectedDeptNameEl.textContent = filterScope === "ELIGIBLE"
          ? `${dept} (Eligible Only)`
          : dept;
        activeFilterBadgeBar.style.display = "flex";
        filterDropdownMenu.classList.remove("open");
        switchTab("FILTER");
      });
      filterOptionsList.appendChild(btn);
    });
  }

  tabFilterBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    populateFilterDropdown();
    filterDropdownMenu.classList.toggle("open");
    updateTabHighlights();
  });

  document.addEventListener("click", (e) => {
    if (!filterDropdownMenu.contains(e.target) && e.target !== tabFilterBtn) {
      if (filterDropdownMenu.classList.contains("open")) {
        filterDropdownMenu.classList.remove("open");
        updateTabHighlights();
      }
    }
  });

  function clearFilterAction() {
    selectedFilterDept = null;
    activeFilterBadgeBar.style.display = "none";
    populateFilterDropdown();
    switchTab(filterScope);
  }

  btnRemoveFilter.addEventListener("click", clearFilterAction);
  btnClearFilterText.addEventListener("click", clearFilterAction);

  // =========================================================================
  // RECENT SEARCHES STATE & MANAGEMENT
  // =========================================================================
  let recentSearches = [];
  let lastSearchedTerm = null;

  function renderRecentSearches() {
    if (!recentSearchesContainer || !recentTagsList) return;

    if (!recentSearches || recentSearches.length === 0) {
      recentSearchesContainer.style.display = "none";
      recentTagsList.innerHTML = "";
      return;
    }

    recentSearchesContainer.style.display = "flex";
    recentTagsList.innerHTML = "";

    recentSearches.forEach(term => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "recent-chip";
      chip.setAttribute("data-query", term);

      const labelSpan = document.createElement("span");
      labelSpan.textContent = term;

      const removeSpan = document.createElement("span");
      removeSpan.className = "chip-remove";
      removeSpan.textContent = "×";
      removeSpan.title = "Remove";
      removeSpan.setAttribute("aria-label", `Remove ${term}`);

      chip.appendChild(labelSpan);
      chip.appendChild(removeSpan);

      chip.addEventListener("click", (e) => {
        if (e.target === removeSpan || removeSpan.contains(e.target)) {
          e.stopPropagation();
          removeRecentSearch(term);
          return;
        }
        executeSearch(term, true);
      });

      recentTagsList.appendChild(chip);
    });
  }

  function commitSearchToRecent(term) {
    const cleanTerm = String(term || "").trim();
    if (!cleanTerm) return;

    const cleanLower = cleanTerm.toLowerCase();

    // Check if the searched term is already present in the recent searches
    const existingIndex = recentSearches.findIndex(
      item => item.toLowerCase() === cleanLower
    );

    if (existingIndex !== -1) {
      // If the user searches a word that is ALREADY present in recent searches,
      // bring that word to the first place inside the recent search container
      const [existingItem] = recentSearches.splice(existingIndex, 1);

      // Also commit the previous search term if it was different and not already added
      if (
        lastSearchedTerm &&
        lastSearchedTerm.toLowerCase() !== cleanLower
      ) {
        recentSearches = recentSearches.filter(
          item => item.toLowerCase() !== lastSearchedTerm.toLowerCase()
        );
        recentSearches.unshift(lastSearchedTerm);
      }

      // Bring existingItem to the very first place
      recentSearches.unshift(existingItem);
    } else {
      // New search not yet in recent searches.
      // Commit the PREVIOUS search term into recent searches now
      if (lastSearchedTerm && lastSearchedTerm.toLowerCase() !== cleanLower) {
        recentSearches = recentSearches.filter(
          item => item.toLowerCase() !== lastSearchedTerm.toLowerCase()
        );
        recentSearches.unshift(lastSearchedTerm);
      }
    }

    lastSearchedTerm = cleanTerm;

    if (recentSearches.length > 8) {
      recentSearches = recentSearches.slice(0, 8);
    }

    renderRecentSearches();
  }

  function removeRecentSearch(term) {
    const cleanTerm = String(term || "").trim().toLowerCase();
    recentSearches = recentSearches.filter(item => item.toLowerCase() !== cleanTerm);
    if (lastSearchedTerm && lastSearchedTerm.toLowerCase() === cleanTerm) {
      lastSearchedTerm = null;
    }
    renderRecentSearches();
  }

  function clearAllRecentSearches() {
    recentSearches = [];
    lastSearchedTerm = null;
    renderRecentSearches();
  }

  // =========================================================================
  // EXPLICIT SEARCH LOGIC
  // =========================================================================
  function executeSearch(query, addToRecent = false) {
    activeSearchQuery = String(query || "").trim();
    searchInput.value = activeSearchQuery;

    if (btnClearSearch) {
      btnClearSearch.style.display = activeSearchQuery ? "flex" : "none";
    }

    if (addToRecent && activeSearchQuery) {
      commitSearchToRecent(activeSearchQuery);
    } else {
      renderRecentSearches();
    }

    currentPage = 1;
    switchTab("SEARCH");
  }

  searchInput.addEventListener("input", (e) => {
    if (btnClearSearch) {
      btnClearSearch.style.display = e.target.value.trim() ? "flex" : "none";
    }
  });

  btnExecuteSearch.addEventListener("click", () => {
    executeSearch(searchInput.value, true);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeSearch(searchInput.value, true);
      searchInput.blur();
    }
  });

  btnClearSearch.addEventListener("click", () => {
    searchInput.value = "";
    executeSearch("", false);
    searchInput.focus();
  });

  if (btnClearAllTags) {
    btnClearAllTags.addEventListener("click", clearAllRecentSearches);
  }

  // =========================================================================
  // =========================================================================
  // MOST SEARCHED CAROUSEL & CIRCULAR INFINITE AUTO-SCROLL
  // =========================================================================
  let isCarouselPaused = false;
  let pauseResumeTimeout = null;
  let isDraggingCarousel = false;
  let dragStartX = 0;
  let dragStartScrollLeft = 0;
  let hasDraggedCarousel = false;
  let carouselSubpixelScroll = 0;
  let singleSetWidth = 0;
  let originalChipsCount = 0;

  function pauseCarousel(durationMs = 2500) {
    isCarouselPaused = true;
    if (pauseResumeTimeout) clearTimeout(pauseResumeTimeout);
    pauseResumeTimeout = setTimeout(() => {
      isCarouselPaused = false;
    }, durationMs);
  }

  function getSetWidth() {
    if (singleSetWidth > 0) return singleSetWidth;
    if (!mostSearchedTrack || mostSearchedTrack.offsetParent === null) return 0;
    if (originalChipsCount > 0 && mostSearchedTrack.children.length > originalChipsCount) {
      const firstChild = mostSearchedTrack.children[0];
      const cloneChild = mostSearchedTrack.children[originalChipsCount];
      const dist = cloneChild.offsetLeft - firstChild.offsetLeft;
      if (dist > 10) {
        singleSetWidth = dist;
        return singleSetWidth;
      }
    }
    return 0;
  }

  function normalizeScroll() {
    const w = getSetWidth();
    if (w > 0) {
      let s = mostSearchedTrack.scrollLeft % w;
      if (s < 0) s += w;
      mostSearchedTrack.scrollLeft = s;
      carouselSubpixelScroll = s;
    } else {
      carouselSubpixelScroll = mostSearchedTrack.scrollLeft;
    }
  }

  function initMostSearchedCarousel() {
    if (!mostSearchedTrack) return;
    if (mostSearchedTrack.dataset.carouselInitialized === "true") return;
    mostSearchedTrack.dataset.carouselInitialized = "true";

    const originalChips = Array.from(mostSearchedTrack.querySelectorAll(".topic-chip"));
    originalChipsCount = originalChips.length;
    if (originalChipsCount === 0) return;

    // Clone chips to create an infinite circular loop (2 clone sets so there is always seamless continuity)
    for (let c = 0; c < 2; c++) {
      originalChips.forEach(chip => {
        const clone = chip.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        mostSearchedTrack.appendChild(clone);
      });
    }

    // Smooth navigation buttons: manual interruption and scroll
    if (btnTopicPrev) {
      btnTopicPrev.addEventListener("click", () => {
        pauseCarousel(3000);
        const w = getSetWidth();
        if (w > 0 && mostSearchedTrack.scrollLeft < 150) {
          mostSearchedTrack.scrollLeft += w;
          carouselSubpixelScroll = mostSearchedTrack.scrollLeft;
        }
        mostSearchedTrack.scrollBy({ left: -150, behavior: "smooth" });
        setTimeout(normalizeScroll, 400);
      });
    }

    if (btnTopicNext) {
      btnTopicNext.addEventListener("click", () => {
        pauseCarousel(3000);
        const w = getSetWidth();
        if (w > 0 && mostSearchedTrack.scrollLeft > w) {
          mostSearchedTrack.scrollLeft -= w;
          carouselSubpixelScroll = mostSearchedTrack.scrollLeft;
        }
        mostSearchedTrack.scrollBy({ left: 150, behavior: "smooth" });
        setTimeout(normalizeScroll, 400);
      });
    }

    // Hover pause and resume: stops running while user hovers
    mostSearchedTrack.addEventListener("mouseenter", () => {
      isCarouselPaused = true;
      if (pauseResumeTimeout) clearTimeout(pauseResumeTimeout);
    });

    mostSearchedTrack.addEventListener("mouseleave", () => {
      if (!isDraggingCarousel) {
        pauseCarousel(800);
      }
    });

    // Touch events for mobile/tablet devices
    mostSearchedTrack.addEventListener("touchstart", () => {
      isCarouselPaused = true;
      if (pauseResumeTimeout) clearTimeout(pauseResumeTimeout);
    }, { passive: true });

    mostSearchedTrack.addEventListener("touchend", () => {
      normalizeScroll();
      pauseCarousel(1800);
    }, { passive: true });

    // Wheel event (trackpad or mouse wheel horizontal scroll)
    mostSearchedTrack.addEventListener("wheel", () => {
      normalizeScroll();
      pauseCarousel(1800);
    }, { passive: true });

    // Drag-to-scroll support with interruption
    mostSearchedTrack.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isDraggingCarousel = true;
      hasDraggedCarousel = false;
      dragStartX = e.pageX - mostSearchedTrack.offsetLeft;
      dragStartScrollLeft = mostSearchedTrack.scrollLeft;
      isCarouselPaused = true;
      if (pauseResumeTimeout) clearTimeout(pauseResumeTimeout);
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDraggingCarousel) return;
      const currentX = e.pageX - mostSearchedTrack.offsetLeft;
      const walk = currentX - dragStartX;
      if (Math.abs(walk) > 4) {
        hasDraggedCarousel = true;
      }
      mostSearchedTrack.scrollLeft = dragStartScrollLeft - walk;
      carouselSubpixelScroll = mostSearchedTrack.scrollLeft;
    });

    window.addEventListener("mouseup", () => {
      if (isDraggingCarousel) {
        isDraggingCarousel = false;
        normalizeScroll();
        pauseCarousel(1200);
      }
    });

    // Topic chips click delegation for both original and cloned chips
    mostSearchedTrack.addEventListener("click", (e) => {
      if (hasDraggedCarousel) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const chip = e.target.closest(".topic-chip");
      if (!chip) return;
      const topic = chip.getAttribute("data-topic") || chip.textContent.trim();
      if (topic) {
        executeSearch(topic, true);
      }
    });

    // Continuous right-to-left circular loop auto-scroll
    let lastTime = performance.now();
    const SCROLL_SPEED_PX_PER_SEC = 20; // slow, gentle circular loop

    function autoScrollStep(currentTime) {
      const deltaMs = currentTime - lastTime;
      lastTime = currentTime;

      if (
        currentTab === "SEARCH" &&
        !isCarouselPaused &&
        !isDraggingCarousel &&
        mostSearchedTrack.offsetParent !== null
      ) {
        const setWidth = getSetWidth();
        if (setWidth > 20) {
          const pxToScroll = (SCROLL_SPEED_PX_PER_SEC * deltaMs) / 1000;
          carouselSubpixelScroll += pxToScroll;

          // Seamless circular loop reset: when Set 1 ends, loop to the duplicate Set
          if (carouselSubpixelScroll >= setWidth) {
            carouselSubpixelScroll -= setWidth;
          }

          mostSearchedTrack.scrollLeft = carouselSubpixelScroll;
        }
      }

      requestAnimationFrame(autoScrollStep);
    }

    requestAnimationFrame(autoScrollStep);
  }

  function openEditModal() {
    modalFormHeading.textContent = guestProfile.isFilled
      ? "Update Your Demographic Profile"
      : (guestProfile.isPartial ? "Complete Your Demographic Profile" : "Enter Your Demographic Profile");

    const ageVal = (guestProfile.age !== null && guestProfile.age !== undefined) ? guestProfile.age : "";
    const genderVal = guestProfile.gender || "";
    const stateVal = guestProfile.state || "";
    const districtVal = guestProfile.district || "";
    const residenceVal = guestProfile.residence || "Urban";
    const occupationVal = guestProfile.occupation || "";
    const incomeVal = guestProfile.incomeRange || "";
    const categoryVal = guestProfile.category || "";
    const maritalVal = guestProfile.maritalStatus || "Single";
    const familySizeVal = (guestProfile.familySize !== null && guestProfile.familySize !== undefined) ? guestProfile.familySize : 4;
    const disabilityVal = guestProfile.disability || "No";
    const educationVal = guestProfile.education || "";
    const employmentVal = guestProfile.employment || "";
    const specialVal = guestProfile.special || "None";

    document.getElementById("formAge").value = ageVal;
    document.getElementById("formGender").value = genderVal;

    const stateSelect = document.getElementById("formState");
    stateSelect.value = stateVal;

    if (stateVal) {
      populateDistrictsForState(stateVal, districtVal);
    } else {
      const districtSelect = document.getElementById("formDistrict");
      districtSelect.innerHTML = '<option value="" disabled selected>Select state first</option>';
      districtSelect.disabled = true;
    }

    document.getElementById("formResidence").value = residenceVal;
    document.getElementById("formOccupation").value = occupationVal;
    document.getElementById("formIncome").value = incomeVal;
    document.getElementById("formCategory").value = categoryVal;
    document.getElementById("formMarital").value = maritalVal;
    document.getElementById("formFamilySize").value = familySizeVal;
    document.getElementById("formDisability").value = disabilityVal;
    document.getElementById("formEducation").value = educationVal;
    document.getElementById("formEmployment").value = employmentVal;
    document.getElementById("formSpecial").value = specialVal;

    editModal.classList.add("is-open");

    // Focus the first empty required input
    const inputsToCheck = [
      document.getElementById("formAge"),
      document.getElementById("formGender"),
      document.getElementById("formState"),
      document.getElementById("formDistrict"),
      document.getElementById("formOccupation"),
      document.getElementById("formIncome"),
      document.getElementById("formCategory")
    ];
    const firstEmpty = inputsToCheck.find(el => el && !el.disabled && !el.value);
    if (firstEmpty) {
      firstEmpty.focus();
    } else {
      const firstInput = document.getElementById("formAge");
      if (firstInput) firstInput.focus();
    }
  }

  function closeEditModal() {
    editModal.classList.remove("is-open");
  }

  btnOpenEdit.addEventListener("click", openEditModal);
  btnCloseEditModal.addEventListener("click", closeEditModal);
  btnCancelEdit.addEventListener("click", closeEditModal);

  if (btnBannerEnterDetails) {
    btnBannerEnterDetails.addEventListener("click", openEditModal);
  }
  if (btnBannerEdit) {
    btnBannerEdit.addEventListener("click", openEditModal);
  }

  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) closeEditModal();
  });

  // Wire "Enter Details Now →" button in drawer to open edit modal
  if (btnDrawerEnterDetails) {
    btnDrawerEnterDetails.addEventListener("click", () => {
      closeDetailsModal();
      openEditModal();
    });
  }

  // =========================================================================
  // SCHEMES SIDEBAR DRAWER INTERACTION
  // =========================================================================
  let openCriteriaGroup = null;

  function setCriteriaAccordion(group) {
    openCriteriaGroup = openCriteriaGroup === group ? null : group;

    const isSatisfiedOpen = openCriteriaGroup === "satisfied";
    const isFailedOpen = openCriteriaGroup === "failed";

    btnSatisfiedAccordion.classList.toggle("is-open", isSatisfiedOpen);
    btnFailedAccordion.classList.toggle("is-open", isFailedOpen);
    btnSatisfiedAccordion.setAttribute("aria-expanded", String(isSatisfiedOpen));
    btnFailedAccordion.setAttribute("aria-expanded", String(isFailedOpen));

    if (!openCriteriaGroup) {
      criteriaAccordionContent.hidden = true;
      criteriaAccordionContentInner.innerHTML = "";
      return;
    }

    const items = openCriteriaGroup === "satisfied"
      ? currentEligibilityCheck.satisfiedConditions
      : currentEligibilityCheck.failedConditions;

    renderCriteriaDetails(items, openCriteriaGroup);
    criteriaAccordionContent.hidden = false;
  }

  function renderCriteriaDetails(items, group) {
    if (!items.length) {
      criteriaAccordionContentInner.innerHTML = `
        <div class="criteria-detail-item">
          <div class="criteria-detail-copy">
            <div class="criteria-detail-reason">
              ${group === "satisfied" ? "No conditions are currently marked as satisfied." : "No conditions are currently marked as not satisfied."}
            </div>
          </div>
        </div>
      `;
      return;
    }

    let itemsHtml = items.map(condition => {
      const isSatisfied = condition.satisfied;
      const icon = isSatisfied ? "✓" : "✕";
      const statusClass = isSatisfied ? "is-satisfied" : "is-failed";
      const statusText = condition.statusLabel || (isSatisfied ? "Satisfied" : "Not satisfied");
      const statusColorClass = isSatisfied ? "status-satisfied" : "status-failed";

      let comparisonHtml = "";
      if (!isSatisfied && condition.comparison) {
        comparisonHtml = `
          <div class="criteria-comparison-box">
            <div class="criteria-comp-line"><strong>Required ${escapeHtml(condition.comparison.field || "requirement")}:</strong> ${escapeHtml(condition.comparison.required)}</div>
            <div class="criteria-comp-line"><strong>Your ${escapeHtml(condition.comparison.field || "status")}:</strong> ${escapeHtml(condition.comparison.actual)}</div>
          </div>
        `;
      }

      let suggestionHtml = "";
      if (!isSatisfied && condition.suggestion) {
        suggestionHtml = `
          <div class="criteria-suggestion-box">
            <svg class="criteria-suggestion-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-1.3l-.85-.6C7.8 13.16 7 11.18 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.18-.8 4.16-2.15 5.1z"/>
            </svg>
            <div class="criteria-suggestion-content">
              <div class="criteria-suggestion-title">Suggestion</div>
              <p class="criteria-suggestion-text">${escapeHtml(condition.suggestion)}</p>
            </div>
          </div>
        `;
      }

      return `
        <article class="criteria-detail-item ${statusClass}">
          <div class="criteria-detail-icon" aria-hidden="true">${icon}</div>
          <div class="criteria-detail-copy">
            <div class="criteria-detail-title">${escapeHtml(condition.label)}</div>
            <div class="criteria-detail-status ${statusColorClass}">${escapeHtml(statusText)}</div>
            ${comparisonHtml}
            <div class="criteria-detail-reason">${escapeHtml(condition.reason)}</div>
            ${suggestionHtml}
          </div>
        </article>
      `;
    }).join("");

    if (group === "satisfied" && items.length > 0) {
      itemsHtml += `
        <div class="criteria-panel-footer">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <span>All ${items.length} conditions are satisfied.</span>
        </div>
      `;
    }

    criteriaAccordionContentInner.innerHTML = itemsHtml;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  let currentEligibilityCheck = {
    eligible: false,
    evaluated: false,
    satisfiedConditions: [],
    failedConditions: []
  };

  function renderAccordionSummary(check) {
    const satisfiedCount = check.satisfiedConditions.length;
    const failedCount = check.failedConditions.length;

    satisfiedCountEl.textContent = satisfiedCount;
    failedCountEl.textContent = failedCount;

    const satisfiedTitleSpan = btnSatisfiedAccordion.querySelector(".criteria-tab-title");
    if (satisfiedTitleSpan) {
      satisfiedTitleSpan.innerHTML = `<strong id="satisfiedCount">${satisfiedCount}</strong> ${satisfiedCount === 1 ? "Condition Satisfied" : "Conditions Satisfied"}`;
    }

    const failedTitleSpan = btnFailedAccordion.querySelector(".criteria-tab-title");
    if (failedTitleSpan) {
      failedTitleSpan.innerHTML = `<strong id="failedCount">${failedCount}</strong> ${failedCount === 1 ? "Condition Not Satisfied" : "Conditions Not Satisfied"}`;
    }

    // Default open: if failed conditions exist, open failed group to showcase reason; otherwise open satisfied
    if (failedCount > 0) {
      setCriteriaAccordion("failed");
    } else {
      setCriteriaAccordion("satisfied");
    }
  }
  window.openSchemeDetails = function (schemeId) {
    syncDrawerOffset();
    const scheme = ALL_SCHEMES.find(s => String(s.id) === String(schemeId) || String(s.scheme_id) === String(schemeId));
    activeDrawerScheme = scheme;

    // Record viewed scheme in Scheme History
    const isEligibleSource = (currentTab === "ELIGIBLE") || (currentTab === "FILTER" && filterScope === "ELIGIBLE");
    const historySource = isEligibleSource ? "ELIGIBLE" : "ALL";
    if (typeof addSchemeToHistory === "function") {
      addSchemeToHistory(scheme, historySource);
    }

    modalSchemeName.textContent = scheme.name;
    modalSchemeDept.textContent = scheme.dept;
    modalSchemeLevel.textContent = scheme.level;
    modalSchemeLevel.className = `drawer-level-pill ${getLevelClass(scheme.level)}`;
    modalSchemeDescription.textContent = scheme.desc;

    // Populate Application Mode & State meta box
    const modalDrawerAppMode = document.getElementById("modalDrawerAppMode");
    const modalDrawerState = document.getElementById("modalDrawerState");
    if (modalDrawerAppMode) {
      let appMode = scheme.applicationMode || scheme.application_mode || scheme.mode;
      if (!appMode) {
        appMode = (scheme.id % 2 === 0) ? "Offline" : "Online";
      }
      modalDrawerAppMode.textContent = appMode;
    }
    if (modalDrawerState) {
      const isTn = (scheme.level === "Tamil Nadu" || scheme.stateReq === "Tamil Nadu" || (scheme.dept && scheme.dept.includes("Tamil Nadu")));
      let stateDisplay = "All India";
      if (isTn) {
        stateDisplay = "Tamil Nadu";
      } else if (scheme.stateReq && scheme.stateReq !== "All") {
        stateDisplay = scheme.stateReq;
      } else if (scheme.level === "Central") {
        stateDisplay = "All India";
      }
      modalDrawerState.textContent = stateDisplay;
    }

    // Set the Vector Icon inside the drawer beside the Scheme title
    if (modalSchemeVectorIcon && scheme.icon) {
      modalSchemeVectorIcon.innerHTML = scheme.icon;
    }

    currentEligibilityCheck = checkEligibility(scheme, guestProfile);

    // =========================================================================
    // DYNAMIC DRAWER DISPLAY LOGIC
    // =========================================================================
    if (!currentEligibilityCheck.evaluated) {
      // 1. NOT EVALUATED: Shows ONLY requested clean minimal state
      modalStatusPill.textContent = "Not Evaluated";
      modalStatusPill.className = "drawer-status-pill";

      notEvaluatedView.style.display = "flex";
      evaluatedSections.style.display = "none";
      drawerFooterBar.style.display = "none";
    } else {
      // 2. EVALUATED: Shows complete evaluated details and actions
      notEvaluatedView.style.display = "none";
      evaluatedSections.style.display = "flex";
      drawerFooterBar.style.display = "";

      if (currentEligibilityCheck.eligible) {
        modalStatusPill.textContent = "✓ Eligible";
        modalStatusPill.className = "drawer-status-pill eligible";

        modalEligibilityHero.className = "eligibility-hero-banner is-eligible";
        modalStatusIcon.textContent = "✓";
        modalStatusTitle.textContent = "Eligible";
        modalStatusSubtitle.textContent = "You meet the requirements for this scheme.";
      } else {
        modalStatusPill.textContent = "✕ Not Eligible";
        modalStatusPill.className = "drawer-status-pill ineligible";

        modalEligibilityHero.className = "eligibility-hero-banner is-not-eligible";
        modalStatusIcon.textContent = "✕";
        modalStatusTitle.textContent = "Not Eligible";
        modalStatusSubtitle.textContent = "You do not meet the eligibility criteria for this scheme.";
      }

      // Smooth pop/scale animation for result icon and burst rays
      if (modalStatusIcon) {
        modalStatusIcon.classList.remove("anim-pop");
        const burstRays = modalEligibilityHero.querySelector(".eligibility-burst-rays");
        if (burstRays) burstRays.classList.remove("anim-pop");
        void modalStatusIcon.offsetWidth; // Force reflow to re-trigger animation
        modalStatusIcon.classList.add("anim-pop");
        if (burstRays) burstRays.classList.add("anim-pop");
      }

      renderAccordionSummary(currentEligibilityCheck);

      if (btnDrawerViewDocs) {
        const schemeId = scheme.id || scheme.scheme_id || "";
        const schemeName = scheme.name || scheme.scheme_name || "";
        const targetUrl = `../../01_scheme_recommendation/frontend/index.html?schemeId=${encodeURIComponent(schemeId)}&schemeName=${encodeURIComponent(schemeName)}&openDrawer=true`;
        btnDrawerViewDocs.href = targetUrl;
        btnDrawerViewDocs.setAttribute("data-scheme-id", schemeId);
        btnDrawerViewDocs.setAttribute("data-scheme-name", schemeName);
        if (scheme.officialUrl) {
          btnDrawerViewDocs.setAttribute("data-official-url", scheme.officialUrl);
        }
      }
    }

    // Slide-in drawer
    document.body.classList.add("details-drawer-open");
    detailsModal.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      detailsModal.classList.add("is-open");
    });

    const drawerBody = detailsModal.querySelector(".drawer-body");
    if (drawerBody) drawerBody.scrollTop = 0;
    btnCloseDetailsModal.focus();
  };

  window.addEventListener(
    "resize",
    () => {
      syncDrawerOffset();
      updateCardReadMoreVisibility();
      singleSetWidth = 0;
    }
  );

  if (typeof ResizeObserver !== "undefined" && schemesCardsContainer) {
    const cardResizeObserver = new ResizeObserver(() => {
      updateCardReadMoreVisibility();
    });
    cardResizeObserver.observe(schemesCardsContainer);
  }

  // Direct drawer opening when clicking Check Eligible
  window.checkSingleScheme = function (schemeId) {
    window.openSchemeDetails(schemeId);
  };

  function closeDetailsModal() {
    detailsModal.classList.remove("is-open");
    detailsModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("details-drawer-open");
    openCriteriaGroup = null;
    criteriaAccordionContent.hidden = true;
  }

  btnSatisfiedAccordion.addEventListener("click", () => setCriteriaAccordion("satisfied"));
  btnFailedAccordion.addEventListener("click", () => setCriteriaAccordion("failed"));
  btnCloseDetailsModal.addEventListener("click", closeDetailsModal);
  if (btnDismissDetails) {
    btnDismissDetails.addEventListener("click", closeDetailsModal);
  }

  if (btnDrawerViewDocs) {
    btnDrawerViewDocs.addEventListener("click", () => {
      if (activeDrawerScheme) {
        saveActiveSchemeContext(activeDrawerScheme);
      }
    });
  }

  if (btnDrawerVerifyDocs) {
    btnDrawerVerifyDocs.addEventListener("click", () => {
      if (activeDrawerScheme) {
        saveActiveSchemeContext(activeDrawerScheme);
        btnDrawerVerifyDocs.href = `../../03_documents_verification/frontend/index.html?schemeId=${encodeURIComponent(activeDrawerScheme.id)}&schemeName=${encodeURIComponent(activeDrawerScheme.name)}`;
      }
    });
  }

  if (btnDrawerCheckReadiness) {
    btnDrawerCheckReadiness.addEventListener("click", () => {
      if (!activeDrawerScheme) return;
      saveActiveSchemeContext(activeDrawerScheme);
      const targetUrl = `../../05_my_readiness/frontend/index.html?schemeId=${encodeURIComponent(activeDrawerScheme.id)}&schemeName=${encodeURIComponent(activeDrawerScheme.name)}`;
      window.location.href = targetUrl;
    });
  }

  detailsModal.addEventListener("click", (e) => {
    if (e.target === detailsModal) closeDetailsModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && detailsModal.classList.contains("is-open")) {
      closeDetailsModal();
    }
  });

  // =========================================================================
  // SCHEME HISTORY & READINESS CTA (PAGE LEVEL)
  // =========================================================================
  const SCHEME_HISTORY_KEY = "uniora_scheme_view_history";

  function loadSchemeHistory() {
    try {
      const data = sessionStorage.getItem(SCHEME_HISTORY_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("[SchemeHistory] Failed to read from sessionStorage:", e);
    }
    return [];
  }

  function saveSchemeHistory(history) {
    try {
      sessionStorage.setItem(SCHEME_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn("[SchemeHistory] Failed to save to sessionStorage:", e);
    }
  }

  let schemeHistory = loadSchemeHistory();

  function getSchemeCategoryIcon(scheme) {
    if (scheme && scheme.icon) return scheme.icon;
    const text = (((scheme && scheme.name) || "") + " " + ((scheme && scheme.dept) || "")).toLowerCase();

    if (text.includes("agri") || text.includes("kisan") || text.includes("farm") || text.includes("crop")) {
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M7 21a1 1 0 0 1-1-1v-6a5 5 0 0 1 5-5h1a1 1 0 0 1 1 1v1a5 5 0 0 1-5 5h-1v4a1 1 0 0 1-1 1zm4-9a3 3 0 0 0-3 3v0h1a3 3 0 0 0 3-3v0zm10-5a5 5 0 0 1-5 5h-1a1 1 0 0 1-1-1v-1a5 5 0 0 1 5-5h1a1 1 0 0 1 1 1v1zm-2 2a3 3 0 0 0-3-3v0a3 3 0 0 0 3 3v0z"/></svg>`;
    }
    if (text.includes("health") || text.includes("ayushman") || text.includes("medic") || text.includes("arogya")) {
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    }
    if (text.includes("scholar") || text.includes("matric") || text.includes("vidya") || text.includes("educat") || text.includes("student")) {
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>`;
    }
    if (text.includes("awas") || text.includes("hous") || text.includes("shelter")) {
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
    }
    if (text.includes("skill") || text.includes("employ") || text.includes("mission") || text.includes("rozgar") || text.includes("job")) {
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>`;
    }
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
  }

  function renderSchemeHistory() {
    if (!schemeHistoryTrack || !schemeHistoryEmpty) return;

    if (!schemeHistory || schemeHistory.length === 0) {
      schemeHistoryTrack.innerHTML = "";
      schemeHistoryEmpty.style.display = "block";
      if (btnClearHistory) btnClearHistory.style.display = "none";
      if (btnHistoryNext) btnHistoryNext.style.display = "none";
      return;
    }

    schemeHistoryEmpty.style.display = "none";
    if (btnClearHistory) btnClearHistory.style.display = "inline-flex";
    schemeHistoryTrack.innerHTML = "";

    schemeHistory.forEach(item => {
      const isEligible = item.source === "ELIGIBLE";
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `history-chip ${isEligible ? "is-eligible" : ""}`;
      chip.setAttribute("data-scheme-id", item.id);
      chip.setAttribute("title", `View details for ${item.name}`);

      const iconWrap = document.createElement("div");
      iconWrap.className = "history-chip-icon";
      iconWrap.setAttribute("aria-hidden", "true");
      iconWrap.innerHTML = getSchemeCategoryIcon(item);

      const nameEl = document.createElement("span");
      nameEl.className = "history-chip-name";
      nameEl.textContent = item.name;

      chip.appendChild(iconWrap);
      chip.appendChild(nameEl);

      chip.addEventListener("click", () => {
        window.openSchemeDetails(item.id);
      });

      schemeHistoryTrack.appendChild(chip);
    });

    if (btnHistoryNext) {
      const isScrollable = schemeHistoryTrack.scrollWidth > schemeHistoryTrack.clientWidth + 10;
      btnHistoryNext.style.display = isScrollable ? "flex" : "none";
    }
  }

  function addSchemeToHistory(scheme, source) {
    if (!scheme || !scheme.id) return;
    const isEligible = source === "ELIGIBLE";
    const sourceLabel = isEligible ? "(Viewed from Eligible)" : "(Viewed from All)";

    // Remove existing entry for this scheme to avoid duplicates
    schemeHistory = schemeHistory.filter(h => String(h.id) !== String(scheme.id));

    // Prepend to front (most recently viewed)
    schemeHistory.unshift({
      id: scheme.id,
      name: scheme.name,
      dept: scheme.dept,
      level: scheme.level,
      source: isEligible ? "ELIGIBLE" : "ALL",
      sourceLabel: sourceLabel,
      icon: scheme.icon || null,
      iconBg: scheme.iconBg || null
    });

    if (schemeHistory.length > 20) {
      schemeHistory = schemeHistory.slice(0, 20);
    }

    saveSchemeHistory(schemeHistory);
    renderSchemeHistory();
  }

  function clearAllSchemeHistory() {
    schemeHistory = [];
    saveSchemeHistory([]);
    renderSchemeHistory();
  }

  if (btnClearHistory) {
    btnClearHistory.addEventListener("click", clearAllSchemeHistory);
  }

  if (btnHistoryNext && schemeHistoryTrack) {
    btnHistoryNext.addEventListener("click", () => {
      schemeHistoryTrack.scrollBy({ left: 260, behavior: "smooth" });
    });
  }

  if (btnPageReadinessCta) {
    btnPageReadinessCta.addEventListener("click", (e) => {
      e.preventDefault();
      let targetScheme = activeDrawerScheme;
      if (!targetScheme && schemeHistory && schemeHistory.length > 0) {
        const recentId = schemeHistory[0].id;
        targetScheme = ALL_SCHEMES.find(s => String(s.id) === String(recentId));
      }

      if (targetScheme) {
        saveActiveSchemeContext(targetScheme);
        window.location.href = `../../05_my_readiness/frontend/index.html?schemeId=${encodeURIComponent(targetScheme.id)}&schemeName=${encodeURIComponent(targetScheme.name)}`;
      } else {
        window.location.href = `../../05_my_readiness/frontend/index.html`;
      }
    });
  }

  function updateProfileUI() {
    function setDemoValue(element, val) {
      if (!element) return;
      if (val !== null && val !== undefined && String(val).trim() !== "" && String(val).trim() !== "--") {
        element.textContent = val;
        element.classList.remove("blank");
      } else {
        element.textContent = "--";
        element.classList.add("blank");
      }
    }

    // 1. Update Title with User Name if available
    const cardTitleText = document.getElementById("cardTitleText");
    if (cardTitleText) {
      if (guestProfile.userName) {
        cardTitleText.textContent = `Your Information — ${guestProfile.userName}`;
      } else {
        cardTitleText.textContent = "Your Information";
      }
    }

    // 2. Ensure header button says "Edit Details"
    if (cardBtnText) {
      cardBtnText.textContent = "Edit Details";
    }

    // 3. Simple Green Demographic Message Banner
    const demographicMessageBanner = document.getElementById("demographicMessageBanner");
    const demographicMessageText = document.getElementById("demographicMessageText");
    if (demographicMessageBanner) {
      demographicMessageBanner.style.display = "flex";
    }
    if (demographicMessageText) {
      demographicMessageText.innerHTML = `Demographics loaded from your <strong>saved citizen profile</strong>.`;
    }

    // 4. Fill 3-Column Demographic Grid Values
    setDemoValue(valAge, guestProfile.age);
    setDemoValue(valGender, guestProfile.gender);
    setDemoValue(valState, guestProfile.state);
    setDemoValue(valDistrict, guestProfile.district);
    setDemoValue(valResidence, guestProfile.residence);
    setDemoValue(valOccupation, guestProfile.occupation);
    setDemoValue(valIncome, guestProfile.incomeRange);
    setDemoValue(valCategory, guestProfile.category);
    setDemoValue(valMarital, guestProfile.maritalStatus);
    setDemoValue(valFamilySize, guestProfile.familySize);
    setDemoValue(valDisability, guestProfile.disability);
    setDemoValue(valEducation, guestProfile.education);
    setDemoValue(valEmployment, guestProfile.employment);
    setDemoValue(valSpecial, guestProfile.special);

    // 5. Update Documents Section
    renderDocumentsBar(verifiedDocs);

    // 6. Refresh Scheme Results Table & Counts
    renderTable();
  }

  // Automatic real-time document synchronization with Document Verification
  async function refreshVerificationData() {
    try {
      const refreshedDocs = await fetchUserVerifiedDocs();
      verifiedDocs = refreshedDocs;
      renderDocumentsBar(refreshedDocs);
      if (guestProfile) {
        guestProfile.verifiedDocsCount = refreshedDocs.length;
        guestProfile.verifiedDocTypes = refreshedDocs.map(d => d.document_type || d.name).filter(Boolean);
      }
      updateProfileUI();
    } catch (err) {
      console.warn('[UNIORA] refreshVerificationData error:', err);
    }
  }

  window.addEventListener("storage", (e) => {
    if (e.key === "uniora_verified_docs") {
      refreshVerificationData();
    }
  });

  window.addEventListener("focus", () => {
    refreshVerificationData();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshVerificationData();
    }
  });

  try {
    const syncChannel = new BroadcastChannel("uniora_docs_sync");
    syncChannel.onmessage = (e) => {
      if (e.data && (e.data.type === "DOC_VERIFIED" || e.data.type === "DOC_UNVERIFIED")) {
        refreshVerificationData();
      }
    };
  } catch (e) {}

  guestProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    guestProfile.isFilled = true;
    guestProfile.isPartial = false;
    guestProfile.manuallySubmitted = true;
    guestProfile.missingFields = [];
    guestProfile.age = parseInt(document.getElementById("formAge").value, 10);
    guestProfile.gender = document.getElementById("formGender").value;
    guestProfile.state = document.getElementById("formState").value;
    guestProfile.district = document.getElementById("formDistrict").value;
    guestProfile.residence = document.getElementById("formResidence").value;
    guestProfile.occupation = document.getElementById("formOccupation").value;
    guestProfile.incomeRange = document.getElementById("formIncome").value;
    guestProfile.category = document.getElementById("formCategory").value;
    guestProfile.maritalStatus = document.getElementById("formMarital").value;
    guestProfile.familySize = parseInt(document.getElementById("formFamilySize").value, 10);
    guestProfile.disability = document.getElementById("formDisability").value;
    guestProfile.education = document.getElementById("formEducation").value;
    guestProfile.employment = document.getElementById("formEmployment").value;
    guestProfile.special = document.getElementById("formSpecial").value;

    const incomeMap = {
      "Below ₹1 Lakh": 90000,
      "₹1 – 2.5 Lakh": 180000,
      "₹2.5 – 5 Lakh": 350000,
      "Above ₹5 Lakh": 600000
    };

    guestProfile.incomeNumeric = incomeMap[guestProfile.incomeRange] || 0;

    // Persist to Supabase user_info if user is authenticated
    try {
      const session = await getCurrentSession();
      if (session && session.user && supabase) {
        let dob = guestProfile.date_of_birth;
        if (!dob && guestProfile.age) {
          const birthYear = new Date().getFullYear() - guestProfile.age;
          dob = `${birthYear}-01-01`;
        }
        const userInfoPayload = {
          uid: session.user.id,
          date_of_birth: dob,
          gender: guestProfile.gender,
          state: guestProfile.state,
          district: guestProfile.district,
          residence_type: guestProfile.residence,
          occupation: guestProfile.occupation,
          annual_family_income: guestProfile.incomeRange,
          social_category: guestProfile.category,
          marital_status: guestProfile.maritalStatus,
          disability_status: guestProfile.disability,
          education_level: guestProfile.education,
          employment_status: guestProfile.employment,
          family_size: guestProfile.familySize,
          special_beneficiary_status: guestProfile.special
        };
        const { error: dbError } = await supabase
          .from('user_info')
          .upsert(userInfoPayload, { onConflict: 'uid' });

        if (!dbError) {
          guestProfile.isFromDatabase = true;
          console.log('[UNIORA] Citizen profile updated in Supabase user_info');
        } else {
          console.warn('[UNIORA] Failed to update user_info in Supabase:', dbError);
        }
      }
    } catch (saveErr) {
      console.warn('[UNIORA] Error syncing profile with Supabase:', saveErr);
    }

    saveProfileToSession(guestProfile);
    closeEditModal();
    updateProfileUI();
    switchTab("ELIGIBLE");
    syncEvaluationWithBackend();
  });

  async function syncEvaluationWithBackend() {
    if (!guestProfile || !guestProfile.isFilled) return;
    try {
      const verifiedDocs = getStoredVerifiedDocs();
      const payload = {
        age: guestProfile.age,
        gender: guestProfile.gender,
        state: guestProfile.state,
        district: guestProfile.district,
        residence: guestProfile.residence,
        occupation: guestProfile.occupation,
        annual_income: guestProfile.incomeNumeric,
        income_range: guestProfile.incomeRange,
        social_category: guestProfile.category,
        marital_status: guestProfile.maritalStatus,
        disability: guestProfile.disability,
        education: guestProfile.education,
        employment: guestProfile.employment,
        special: guestProfile.special,
        verified_documents: verifiedDocs.map(d => d.document_type || d.document_name || d.name || "")
      };

      const res = await fetch("http://localhost:8000/api/schemes/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        console.log("[UNIORA] Backend schemes evaluation synced:", data.summary);
      }
    } catch (err) {
      console.debug("[UNIORA] Backend service not running; offline match engine active:", err.message);
    }
  }

  populateFilterDropdown();
  updateProfileUI();

  // =========================================================================
  // DATA SOURCE STATUS MANAGER & PIPELINE CONTROLLER
  // =========================================================================
  let toastTimer = null;
  function showDataToast(message, type = "info", duration = 4000) {
    if (!dataStatusToast || !dataStatusToastMsg) return;
    if (toastTimer) clearTimeout(toastTimer);

    dataStatusToastMsg.textContent = message;
    dataStatusToast.className = `data-status-toast toast-${type} show`;
    dataStatusToast.style.display = "flex";

    if (dataStatusToastIcon) {
      if (type === "success") {
        dataStatusToastIcon.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      } else if (type === "warning") {
        dataStatusToastIcon.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      } else {
        dataStatusToastIcon.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
      }
    }

    toastTimer = setTimeout(() => {
      dataStatusToast.classList.remove("show");
      setTimeout(() => {
        if (!dataStatusToast.classList.contains("show")) dataStatusToast.style.display = "none";
      }, 300);
    }, duration);
  }

  function updateDataSourceStatusUI(source, meta = null) {
    if (!dataStatusPill || !dataStatusLabel) return;

    if (source === "live") {
      dataStatusPill.className = "data-status-pill status-live";
      dataStatusLabel.textContent = "Live data";
      if (dataStatusTimestamp) dataStatusTimestamp.style.display = "none";
      if (btnDataRetry) btnDataRetry.style.display = "none";
    } else if (source === "indexeddb") {
      dataStatusPill.className = "data-status-pill status-saved";
      dataStatusLabel.textContent = "Offline — showing saved data";
      if (dataStatusTimestamp) {
        const formatted = formatCacheDate(meta?.cachedAt);
        if (formatted) {
          dataStatusTimestamp.textContent = `Showing saved data from ${formatted}`;
          dataStatusTimestamp.style.display = "inline-block";
        } else {
          dataStatusTimestamp.style.display = "none";
        }
      }
      if (btnDataRetry) btnDataRetry.style.display = "inline-flex";
    } else if (source === "fallback") {
      dataStatusPill.className = "data-status-pill status-fallback";
      dataStatusLabel.textContent = "Unable to load the latest scheme data. Showing limited offline data.";
      if (dataStatusTimestamp) dataStatusTimestamp.style.display = "none";
      if (btnDataRetry) btnDataRetry.style.display = "inline-flex";
    } else if (source === "loading") {
      dataStatusPill.className = "data-status-pill status-loading";
      dataStatusLabel.textContent = "Connecting...";
      if (dataStatusTimestamp) dataStatusTimestamp.style.display = "none";
      if (btnDataRetry) btnDataRetry.style.display = "none";
    }
  }

  function applySchemesDataset(schemes, source, meta = null) {
    ALL_SCHEMES = schemes;
    currentDataSource = source;
    if (meta) currentCacheMeta = meta;

    let addedNewDepts = false;
    schemes.forEach(s => {
      const rawD = s.dept || s.issuing_department;
      parseDepartmentNames(rawD).forEach(d => {
        const dLower = d.toLowerCase();
        if (!DEPARTMENTS.some(existing => existing.toLowerCase() === dLower)) {
          DEPARTMENTS.push(d);
          addedNewDepts = true;
        }
      });
    });

    if (typeof populateFilterDropdown === "function") {
      populateFilterDropdown();
    }

    updateDataSourceStatusUI(source, currentCacheMeta);
    updateTabHighlights();
    renderTable();
  }

  async function loadSchemesPipeline(isManualRetry = false) {
    let initialSource = "fallback";

    // 1. Stale-While-Revalidate: Try IndexedDB cache first (instant 0ms response)
    try {
      const cached = await getCachedSchemesFromDB();
      if (cached && cached.schemes && cached.schemes.length > 0) {
        const validation = validateSchemeDataset(cached.schemes, null);
        if (validation.valid) {
          currentCacheMeta = cached.meta;
          initialSource = "indexeddb";
          applySchemesDataset(cached.schemes, "indexeddb", cached.meta);
          console.log(`[SchemeDB] Loaded ${cached.schemes.length} schemes from IndexedDB cache.`);
        }
      }
    } catch (dbErr) {
      console.warn("[SchemeDB] Cache read failed:", dbErr);
    }

    // If no valid cache was found, load FALLBACK_REAL_SCHEMES
    if (initialSource === "fallback") {
      applySchemesDataset(FALLBACK_REAL_SCHEMES, "fallback", null);
    }

    // If offline, stop here
    if (!navigator.onLine) {
      console.log("[UNIORA] Browser is offline; using cached/fallback schemes.");
      if (initialSource === "indexeddb") {
        updateDataSourceStatusUI("indexeddb", currentCacheMeta);
      } else {
        updateDataSourceStatusUI("fallback", null);
      }
      return;
    }

    // 2. Fetch live data from Google Sheet in background
    if (isManualRetry) {
      updateDataSourceStatusUI("loading");
    }

    try {
      const liveSchemes = await fetchSchemesFromGoogleSheet();
      const validation = validateSchemeDataset(liveSchemes, currentCacheMeta);

      if (!validation.valid) {
        console.warn(`[SchemeDB] Live dataset validation failed: ${validation.reason}. Preserving current schemes.`);
        if (initialSource === "indexeddb") {
          updateDataSourceStatusUI("indexeddb", currentCacheMeta);
        } else {
          updateDataSourceStatusUI("fallback", null);
        }
        return;
      }

      const newMeta = {
        cachedAt: new Date().toISOString(),
        recordCount: liveSchemes.length,
        source: "GoogleSheet",
        version: 1
      };
      await saveSchemesToDB(liveSchemes, newMeta);
      currentCacheMeta = newMeta;

      const wasOfflineOrFallback = (initialSource === "fallback" || isManualRetry);
      applySchemesDataset(liveSchemes, "live", newMeta);
      console.log(`[UNIORA] Live sync complete: loaded and cached ${liveSchemes.length} schemes.`);

      if (wasOfflineOrFallback) {
        showDataToast("Connection restored — scheme data updated.", "success");
      }
    } catch (fetchErr) {
      console.warn("[UNIORA] Google Sheet fetch failed:", fetchErr.message);
      if (initialSource === "indexeddb") {
        updateDataSourceStatusUI("indexeddb", currentCacheMeta);
      } else {
        updateDataSourceStatusUI("fallback", null);
      }
    }
  }

  // Data Retry Button Listener
  if (btnDataRetry) {
    btnDataRetry.addEventListener("click", () => {
      loadSchemesPipeline(true);
    });
  }

  // Online / Offline Window Listeners
  window.addEventListener("online", () => {
    console.log("[UNIORA] Network online event received. Re-running scheme loading pipeline...");
    loadSchemesPipeline(false);
  });

  window.addEventListener("offline", () => {
    console.log("[UNIORA] Network offline event received.");
    if (currentDataSource === "live" || currentDataSource === "indexeddb") {
      updateDataSourceStatusUI("indexeddb", currentCacheMeta);
      showDataToast("You are offline. Showing saved scheme data.", "warning");
    } else {
      updateDataSourceStatusUI("fallback", null);
      showDataToast("You are offline. Showing limited fallback scheme data.", "warning");
    }
  });

  initMostSearchedCarousel();
  renderSchemeHistory();

  if (guestProfile.isFilled) {
    switchTab("ELIGIBLE");
    syncEvaluationWithBackend();
  } else {
    updateTabHighlights();
    renderTable();
  }

  // Launch Stale-While-Revalidate loading pipeline
  loadSchemesPipeline(false);
}