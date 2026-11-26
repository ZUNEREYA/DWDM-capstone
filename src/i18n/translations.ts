export type LanguageCode = 'en' | 'ta' | 'hi';

export type NavPageId =
  | 'home'
  | 'dashboard'
  | 'data-collection'
  | 'data-preprocessing'
  | 'data-warehouse'
  | 'etl-process'
  | 'disease-pattern'
  | 'patient-segmentation'
  | 'healthcare-analytics'
  | 'olap-explorer'
  | 'ai-assistant'
  | 'hospital-insights'
  | 'reports'
  | 'about-project';

export interface TranslationBundle {
  brandName: string;
  tagline: string;
  demoBadge: string;
  uploadedBadge: string;
  uploadCsvBtn: string;
  exploreDashboardBtn: string;
  learnProjectBtn: string;
  heroTitle: string;
  heroSubtitle: string;
  nav: Record<NavPageId, string>;
  kpis: {
    totalPatients: string;
    totalHospitals: string;
    totalConditions: string;
    avgAge: string;
    totalAdmissions: string;
    avgBilling: string;
    avgStay: string;
  };
  common: {
    loading: string;
    applyFilters: string;
    resetFilters: string;
    downloadCsv: string;
    downloadPdf: string;
    records: string;
    cleanDataset: string;
    runEtl: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationBundle> = {
  en: {
    brandName: 'MediInsight AI',
    tagline: 'Turning Healthcare Data into Intelligent Insights',
    demoBadge: 'Demonstration Mode (Sample Dataset)',
    uploadedBadge: 'Live Kaggle Dataset Active',
    uploadCsvBtn: 'Upload Dataset',
    exploreDashboardBtn: 'Explore Dashboard',
    learnProjectBtn: 'Learn About Project',
    heroTitle: 'Smarter Healthcare Starts with Better Data.',
    heroSubtitle:
      'An intelligent healthcare analytics platform that transforms complex medical datasets into meaningful insights using data warehousing, data mining and AI.',
    nav: {
      home: 'Home',
      dashboard: 'Dashboard',
      'data-collection': 'Data Collection',
      'data-preprocessing': 'Data Preprocessing',
      'data-warehouse': 'Data Warehouse',
      'etl-process': 'ETL Process',
      'disease-pattern': 'Disease Pattern Discovery',
      'patient-segmentation': 'Patient Segmentation',
      'healthcare-analytics': 'Healthcare Analytics',
      'olap-explorer': 'OLAP Explorer',
      'ai-assistant': 'AI Healthcare Assistant',
      'hospital-insights': 'Hospital Insights',
      reports: 'Reports',
      'about-project': 'About Project',
    },
    kpis: {
      totalPatients: 'Total Patient Records',
      totalHospitals: 'Total Hospitals',
      totalConditions: 'Medical Conditions',
      avgAge: 'Average Patient Age',
      totalAdmissions: 'Total Admissions',
      avgBilling: 'Average Billing Amount',
      avgStay: 'Average Hospital Stay',
    },
    common: {
      loading: 'Computing analytics from dataset...',
      applyFilters: 'Apply Filters',
      resetFilters: 'Reset Filters',
      downloadCsv: 'Download Cleaned CSV',
      downloadPdf: 'Download PDF Report',
      records: 'Records',
      cleanDataset: 'Clean Dataset',
      runEtl: 'Run ETL Pipeline',
    },
  },
  ta: {
    brandName: 'MediInsight AI',
    tagline: 'மருத்துவத் தரவை நுண்ணறிவுத் தகவலாக மாற்றுகிறது',
    demoBadge: 'மாதிரித் தரவு பயன்முறை',
    uploadedBadge: 'பதிவேற்றப்பட்ட Kaggle தரவு செயலில்',
    uploadCsvBtn: 'தரவைப் பதிவேற்று',
    exploreDashboardBtn: 'டாஷ்போர்டை ஆராய்',
    learnProjectBtn: 'திட்டத்தைப் பற்றி அறிக',
    heroTitle: 'சிறந்த தரவுடன் தொடங்கும் அறிவார்ந்த சுகாதாரம்.',
    heroSubtitle:
      'தரவுக் கிடங்கு, தரவுச் சுரங்கம் மற்றும் செயற்கை நுண்ணறிவு மூலம் சிக்கலான மருத்துவத் தரவுகளைப் பயனுள்ள நுண்ணறிவுகளாக மாற்றும் தளம்.',
    nav: {
      home: 'முகப்பு',
      dashboard: 'டாஷ்போர்டு',
      'data-collection': 'தரவு சேகரிப்பு',
      'data-preprocessing': 'தரவு சுத்திகரிப்பு',
      'data-warehouse': 'தரவுக் கிடங்கு',
      'etl-process': 'ETL செயல்முறை',
      'disease-pattern': 'நோய் முறை கண்டறிதல்',
      'patient-segmentation': 'நோயாளர் பிரிவு',
      'healthcare-analytics': 'மருத்துவ பகுப்பாய்வு',
      'olap-explorer': 'OLAP ஆய்வாளர்',
      'ai-assistant': 'AI சுகாதார உதவியாளர்',
      'hospital-insights': 'மருத்துவமனை தகவல்கள்',
      reports: 'அறிக்கைகள்',
      'about-project': 'திட்டம் பற்றி',
    },
    kpis: {
      totalPatients: 'மொத்த நோயாளர் பதிவுகள்',
      totalHospitals: 'மொத்த மருத்துவமனைகள்',
      totalConditions: 'மருத்துவ நிலைகள்',
      avgAge: 'சராசரி நோயாளர் வயது',
      totalAdmissions: 'மொத்த சேர்க்கைகள்',
      avgBilling: 'சராசரி கட்டணத் தொகை',
      avgStay: 'சராசரி தங்கும் நாட்கள்',
    },
    common: {
      loading: 'தரவிலிருந்து பகுப்பாய்வு கணக்கிடப்படுகிறது...',
      applyFilters: 'வடிகட்டு',
      resetFilters: 'மீட்டமை',
      downloadCsv: 'சுத்தமான CSV பதிவிறக்கு',
      downloadPdf: 'PDF அறிக்கை பதிவிறக்கு',
      records: 'பதிவுகள்',
      cleanDataset: 'தரவை சுத்தப்படுத்து',
      runEtl: 'ETL இயக்கு',
    },
  },
  hi: {
    brandName: 'MediInsight AI',
    tagline: 'स्वास्थ्य डेटा को बुद्धिमान अंतर्दृष्टि में बदलना',
    demoBadge: 'डेमो मोड (नमूना डेटासेट)',
    uploadedBadge: 'अपलोड किया गया Kaggle डेटा सक्रिय',
    uploadCsvBtn: 'डेटासेट अपलोड करें',
    exploreDashboardBtn: 'डैशबोर्ड देखें',
    learnProjectBtn: 'प्रोजेक्ट के बारे में जानें',
    heroTitle: 'बेहतर डेटा से शुरू होती है स्मार्ट स्वास्थ्य सेवा।',
    heroSubtitle:
      'डेटा वेयरहाउसिंग, डेटा माइनिंग और AI का उपयोग करके जटिल चिकित्सा डेटा को सार्थक अंतर्दृष्टि में बदलने वाला बुद्धिमान स्वास्थ्य विश्लेषण प्लेटफ़ॉर्म।',
    nav: {
      home: 'होम',
      dashboard: 'डैशबोर्ड',
      'data-collection': 'डेटा संग्रह',
      'data-preprocessing': 'डेटा प्रीप्रोसेसिंग',
      'data-warehouse': 'डेटा वेयरहाउस',
      'etl-process': 'ETL प्रक्रिया',
      'disease-pattern': 'रोग पैटर्न खोज',
      'patient-segmentation': 'रोगी विभाजन',
      'healthcare-analytics': 'स्वास्थ्य विश्लेषण',
      'olap-explorer': 'OLAP एक्सप्लोरर',
      'ai-assistant': 'AI स्वास्थ्य सहायक',
      'hospital-insights': 'अस्पताल अंतर्दृष्टि',
      reports: 'रिपोर्ट्स',
      'about-project': 'प्रोजेक्ट परिचय',
    },
    kpis: {
      totalPatients: 'कुल रोगी रिकॉर्ड',
      totalHospitals: 'कुल अस्पताल',
      totalConditions: 'चिकित्सा स्थितियां',
      avgAge: 'औसत रोगी आयु',
      totalAdmissions: 'कुल प्रवेश',
      avgBilling: 'औसत बिलिंग राशि',
      avgStay: 'औसत अस्पताल प्रवास',
    },
    common: {
      loading: 'डेटासेट से विश्लेषण की गणना हो रही है...',
      applyFilters: 'फ़िल्टर लागू करें',
      resetFilters: 'रीसेट करें',
      downloadCsv: 'साफ़ CSV डाउनलोड करें',
      downloadPdf: 'PDF रिपोर्ट डाउनलोड करें',
      records: 'रिकॉर्ड',
      cleanDataset: 'डेटा साफ़ करें',
      runEtl: 'ETL पाइपलाइन चलाएं',
    },
  },
};
