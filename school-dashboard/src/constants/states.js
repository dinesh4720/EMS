// Indian States and Union Territories
// Extracted from AddStudent.jsx for better maintainability

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh",
  "Puducherry", "Chandigarh", "Andaman and Nicobar Islands"
];
// Normalize state name from API to match predefined indianStates array
export const normalizeStateName = (apiState) => {
  if (!apiState) return null;

  // State name variations mapping (handles common mismatches)
  const stateVariations = {
    "TamilNadu": "Tamil Nadu",
    "Tamilnadu": "Tamil Nadu",
    "TN": "Tamil Nadu",
    "Kerala": "Kerala",
    "KL": "Kerala",
    "Karnataka": "Karnataka",
    "KA": "Karnataka",
    "AndhraPradesh": "Andhra Pradesh",
    "Andhrapradesh": "Andhra Pradesh",
    "AP": "Andhra Pradesh",
    "Telangana": "Telangana",
    "TS": "Telangana",
    "Maharashtra": "Maharashtra",
    "MH": "Maharashtra",
    "UttarPradesh": "Uttar Pradesh",
    "UP": "Uttar Pradesh",
    "Delhi": "Delhi",
    "DL": "Delhi",
    "WestBengal": "West Bengal",
    "WB": "West Bengal",
    "MadhyaPradesh": "Madhya Pradesh",
    "MP": "Madhya Pradesh",
    "Rajasthan": "Rajasthan",
    "RJ": "Rajasthan",
    "Gujarat": "Gujarat",
    "GJ": "Gujarat",
    "Bihar": "Bihar",
    "BR": "Bihar",
    "Punjab": "Punjab",
    "PB": "Punjab",
    "Haryana": "Haryana",
    "HR": "Haryana",
    "JammuKashmir": "Jammu & Kashmir",
    "Jammu & Kashmir": "Jammu & Kashmir",
    "JK": "Jammu & Kashmir",
    "Uttarakhand": "Uttarakhand",
    "UK": "Uttarakhand",
    "HimachalPradesh": "Himachal Pradesh",
    "HP": "Himachal Pradesh",
    "Puducherry": "Puducherry",
    "Pondicherry": "Puducherry",
    "PY": "Puducherry",
    "Chandigarh": "Chandigarh",
    "CH": "Chandigarh",
    "Goa": "Goa",
    "GA": "Goa",
    "Assam": "Assam",
    "AS": "Assam",
    "Odisha": "Odisha",
    "Orissa": "Odisha",
    "OD": "Odisha",
    "Chhattisgarh": "Chhattisgarh",
    "CG": "Chhattisgarh",
    "Jharkhand": "Jharkhand",
    "JH": "Jharkhand",
    "Sikkim": "Sikkim",
    "SK": "Sikkim",
    "Manipur": "Manipur",
    "MN": "Manipur",
    "Meghalaya": "Meghalaya",
    "ML": "Meghalaya",
    "Mizoram": "Mizoram",
    "MZ": "Mizoram",
    "Nagaland": "Nagaland",
    "NL": "Nagaland",
    "Tripura": "Tripura",
    "TR": "Tripura",
    "ArunachalPradesh": "Arunachal Pradesh",
    "Arunachalpradesh": "Arunachal Pradesh",
    "AR": "Arunachal Pradesh",
    "AndamanNicobar": "Andaman and Nicobar Islands",
    "Andaman and Nicobar": "Andaman and Nicobar Islands",
    "AN": "Andaman and Nicobar Islands",
    "Ladakh": "Ladakh",
    "LA": "Ladakh"
  };

  // Try exact match first (case-insensitive)
  const exactMatch = INDIAN_STATES.find(state =>
    state.toLowerCase() === apiState.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  // Try abbreviation/variations mapping
  if (stateVariations[apiState]) {
    return stateVariations[apiState];
  }

  // Try partial match (contains, case-insensitive)
  const partialMatch = INDIAN_STATES.find(state => {
    const stateLower = state.toLowerCase().replace(/\s+/g, '');
    const apiStateLower = apiState.toLowerCase().replace(/\s+/g, '');
    return stateLower.includes(apiStateLower) || apiStateLower.includes(stateLower);
  });
  if (partialMatch) return partialMatch;

  // If no match, return null (will require manual selection)
  console.warn(`State "${apiState}" not found in predefined states list`);
  return null;
};
