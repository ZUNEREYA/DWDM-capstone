import { RawHealthcareRow } from '../src/types/healthcare.js';

// Deterministic pseudo-random generator for consistent demonstration dataset
function mulberry32(seed: number) {
  let t = seed;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  'Aarav', 'Priya', 'Liam', 'Sophia', 'Rohan', 'Ananya', 'Noah', 'Elena',
  'Vikram', 'Meera', 'Ethan', 'Maya', 'Karthik', 'Diya', 'Lucas', 'Hannah',
  'Arjun', 'Sneha', 'Oliver', 'Nadia', 'Siddharth', 'Kavya', 'James', 'Zara'
];
const LAST_NAMES = [
  'Sharma', 'Patel', 'Reddy', 'Nair', 'Smith', 'Johnson', 'Williams', 'Brown',
  'Iyer', 'Verma', 'Khan', 'Garcia', 'Miller', 'Rao', 'Menon', 'Davis'
];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Arthritis', 'Cancer', 'Obesity'];
const HOSPITALS = [
  'Apollo Clinical Center',
  'Metro General Hospital',
  'St. Jude Medical Institute',
  'Sunrise Specialty Care',
  'Pacific Coast Medical',
  'CareWell Health System'
];
const DOCTORS = [
  'Dr. R. Mehta', 'Dr. S. Kapoor', 'Dr. A. Brooks', 'Dr. K. Ramanathan',
  'Dr. L. Chen', 'Dr. M. Fernandez', 'Dr. N. Subramanian', 'Dr. J. Walker'
];
const INSURANCES = ['BlueCross', 'Aetna', 'UnitedHealthcare', 'Medicare', 'Cigna'];
const ADMISSION_TYPES = ['Emergency', 'Elective', 'Urgent'];
const TEST_RESULTS = ['Normal', 'Abnormal', 'Inconclusive'];
const CONDITION_MEDICATIONS: Record<string, string[]> = {
  Diabetes: ['Metformin', 'Insulin', 'Lipitor'],
  Hypertension: ['Lisinopril', 'Aspirin', 'Lipitor'],
  Asthma: ['Albuterol', 'Prednisone', 'Ibuprofen'],
  Arthritis: ['Ibuprofen', 'Aspirin', 'Paracetamol'],
  Cancer: ['Chemotherapy', 'Ondansetron', 'Paracetamol'],
  Obesity: ['Metformin', 'Lipitor', 'Penicillin'],
};

/**
 * Generates 600 realistic records following Prasad22's Kaggle Healthcare Dataset schema,
 * including minor realistic raw anomalies (missing values, duplicates, casing drift)
 * so Module 1 (Data Collection & Preprocessing) can demonstrate genuine cleaning.
 */
export function generateDemoDataset(count = 600): RawHealthcareRow[] {
  const rand = mulberry32(202604);
  const rows: RawHealthcareRow[] = [];

  const startEpoch = new Date('2022-01-01T00:00:00Z').getTime();
  const endEpoch = new Date('2024-12-20T00:00:00Z').getTime();

  for (let i = 0; i < count; i++) {
    const fn = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const gender = rand() < 0.49 ? 'Female' : rand() < 0.98 ? 'Male' : 'Other';
    const age = Math.min(88, Math.max(18, Math.round(18 + rand() * 68)));

    // Weighted condition probabilities for realistic clinical patterns
    const cRoll = rand();
    let condition: string;
    if (age > 55) {
      condition = cRoll < 0.24 ? 'Hypertension' : cRoll < 0.45 ? 'Diabetes' : cRoll < 0.65 ? 'Arthritis' : cRoll < 0.80 ? 'Cancer' : cRoll < 0.91 ? 'Obesity' : 'Asthma';
    } else if (age < 35) {
      condition = cRoll < 0.28 ? 'Asthma' : cRoll < 0.48 ? 'Obesity' : cRoll < 0.68 ? 'Diabetes' : cRoll < 0.82 ? 'Hypertension' : cRoll < 0.92 ? 'Arthritis' : 'Cancer';
    } else {
      condition = CONDITIONS[Math.floor(rand() * CONDITIONS.length)];
    }

    const admissionEpoch = startEpoch + Math.floor(rand() * (endEpoch - startEpoch));
    const admissionDate = new Date(admissionEpoch);
    const baseStay = condition === 'Cancer' ? 8 + Math.floor(rand() * 14) :
                     condition === 'Hypertension' ? 3 + Math.floor(rand() * 9) :
                     2 + Math.floor(rand() * 10);
    const dischargeDate = new Date(admissionEpoch + baseStay * 86400000);

    const admissionType =
      condition === 'Cancer' || condition === 'Hypertension'
        ? (rand() < 0.45 ? 'Emergency' : rand() < 0.78 ? 'Urgent' : 'Elective')
        : ADMISSION_TYPES[Math.floor(rand() * ADMISSION_TYPES.length)];

    const testRoll = rand();
    const testResults =
      admissionType === 'Emergency'
        ? (testRoll < 0.44 ? 'Abnormal' : testRoll < 0.74 ? 'Inconclusive' : 'Normal')
        : (testRoll < 0.31 ? 'Abnormal' : testRoll < 0.63 ? 'Normal' : 'Inconclusive');

    const medList = CONDITION_MEDICATIONS[condition] || ['Paracetamol', 'Ibuprofen'];
    const medication = medList[Math.floor(rand() * medList.length)];

    const baseBill =
      condition === 'Cancer' ? 28000 + rand() * 22000 :
      condition === 'Hypertension' ? 16000 + rand() * 19000 :
      condition === 'Diabetes' ? 14000 + rand() * 18000 :
      11000 + rand() * 20000;
    const billingAmount = Number((baseBill + baseStay * 650).toFixed(2));

    const row: RawHealthcareRow = {
      Name: `${fn} ${ln}`,
      Age: age,
      Gender: gender,
      'Blood Type': BLOOD_TYPES[Math.floor(rand() * BLOOD_TYPES.length)],
      'Medical Condition': condition,
      'Date of Admission': admissionDate.toISOString().slice(0, 10),
      Doctor: DOCTORS[Math.floor(rand() * DOCTORS.length)],
      Hospital: HOSPITALS[Math.floor(rand() * HOSPITALS.length)],
      'Insurance Provider': INSURANCES[Math.floor(rand() * INSURANCES.length)],
      'Billing Amount': billingAmount,
      'Room Number': 101 + Math.floor(rand() * 399),
      'Admission Type': admissionType,
      'Discharge Date': dischargeDate.toISOString().slice(0, 10),
      Medication: medication,
      'Test Results': testResults,
    };

    // Inject realistic raw imperfections into ~6% of demo records for Preprocessing Demo
    if (i % 37 === 5) row['Billing Amount'] = null;
    if (i % 43 === 9) row['Blood Type'] = '';
    if (i % 53 === 11) row.Age = null;
    if (i % 41 === 3) row['Medical Condition'] = ` ${condition.toLowerCase()} `;
    if (i % 67 === 7) row['Test Results'] = ` ${testResults.toUpperCase()} `;
    if (i % 89 === 13) row['Billing Amount'] = -Math.abs(billingAmount);
    if (i % 73 === 17) row.Gender = gender === 'Female' ? 'female ' : 'MALE';

    rows.push(row);

    // Inject 12 exact duplicate records
    if (i > 10 && i % 50 === 0) {
      rows.push({ ...row });
    }
  }

  return rows;
}
