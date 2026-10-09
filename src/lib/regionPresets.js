const EUROPE = [
  "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CY", "CZ", "DK", "EE",
  "FI", "FR", "DE", "GR", "HU", "IS", "IE", "IT", "XK", "LV", "LI", "LT",
  "LU", "MT", "MD", "MC", "ME", "NL", "MK", "NO", "PL", "PT", "RO", "RU",
  "SM", "RS", "SK", "SI", "ES", "SE", "CH", "UA", "GB", "VA",
];
const ASIA = [
  "AF", "AM", "AZ", "BH", "BD", "BT", "BN", "KH", "CN", "GE", "IN", "ID",
  "IR", "IQ", "IL", "JP", "JO", "KZ", "KW", "KG", "LA", "LB", "MY", "MV",
  "MN", "MM", "NP", "KP", "OM", "PK", "PS", "PH", "QA", "SA", "SG", "KR",
  "LK", "SY", "TW", "TJ", "TH", "TL", "TR", "TM", "AE", "UZ", "VN", "YE",
];
const NORTH_AMERICA = [
  "AG", "BS", "BB", "BZ", "CA", "CR", "CU", "DM", "DO", "SV", "GD", "GT",
  "HT", "HN", "JM", "MX", "NI", "PA", "KN", "LC", "VC", "TT", "US",
];
const SOUTH_AMERICA = [
  "AR", "BO", "BR", "CL", "CO", "EC", "GY", "PY", "PE", "SR", "UY", "VE",
];
const CENTRAL_AMERICA = ["BZ", "CR", "SV", "GT", "HN", "NI", "PA"];
const LATAM = [...new Set([...SOUTH_AMERICA, ...CENTRAL_AMERICA, "MX", "CU", "DO"])];
const AFRICA = [
  "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG",
  "CD", "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN",
  "GW", "KE", "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ",
  "NA", "NE", "NG", "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD",
  "TZ", "TG", "TN", "UG", "ZM", "ZW",
];
const OCEANIA = [
  "AU", "FJ", "KI", "MH", "FM", "NR", "NZ", "PW", "PG", "WS", "SB", "TO",
  "TV", "VU",
];
const MIDDLE_EAST = ["BH", "IR", "IQ", "IL", "JO", "KW", "LB", "OM", "PS", "QA", "SA", "SY", "AE", "YE"];
const MEA = [...new Set([...MIDDLE_EAST, ...AFRICA])];
const EMEA = [...new Set([...EUROPE, ...MIDDLE_EAST, ...AFRICA])];
const MENA = [...new Set([...MIDDLE_EAST, "DZ", "EG", "LY", "MA", "TN"])];
const RU_CIS = ["RU", "UA", "BY", "KZ", "UZ", "AM", "AZ", "GE", "KG", "MD", "TJ", "TM"];

export const ALL_COUNTRY_CODES = [
  ...new Set([...EUROPE, ...ASIA, ...NORTH_AMERICA, ...SOUTH_AMERICA, ...AFRICA, ...OCEANIA]),
].sort();

export const REGION_PRESETS = [
  { code: "EUROPE", name: "Europe", countries: EUROPE },
  { code: "NORTH_AMERICA", name: "North America", countries: NORTH_AMERICA },
  { code: "LATAM", name: "Latin America", countries: LATAM },
  { code: "ASIA", name: "Asia", countries: ASIA },
  { code: "MEA", name: "Middle East & Africa", countries: MEA },
  { code: "EMEA", name: "Europe, Middle East & Africa", countries: EMEA },
  { code: "MENA", name: "Middle East & North Africa", countries: MENA },
  { code: "RU_CIS", name: "Russia & CIS", countries: RU_CIS },
  { code: "GLOBAL", name: "Global", isGlobal: true, countries: [] },
];

export const GLOBAL_REGION_CODE = "GLOBAL";

export const REGION_PRESET_MAP = new Map(REGION_PRESETS.map((r) => [r.code, r]));
