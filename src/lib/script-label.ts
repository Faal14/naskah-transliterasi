// Ubah nama aksara jadi label cantik
export function formatScript(script: string): string {
  if (!script) return "—";
  // Known mappings
  const map: Record<string, string> = {
    PEGON: "Pegon",
    HANACARAKA: "Carakan",
    JAWI: "Jawi",
    BALI: "Bali",
    SUNDA: "Sunda",
    BUGIS: "Bugis",
    BATAK: "Batak",
  };
  if (map[script.toUpperCase()]) return map[script.toUpperCase()];
  // Fallback: capitalize
  return script.charAt(0).toUpperCase() + script.slice(1).toLowerCase();
}

// Warna badge otomatis dari nama aksara
export function getScriptColor(script: string): string {
  if (!script) return "bg-slate-100 text-slate-700";

  const colors = [
    "bg-blue-100 text-blue-800",
    "bg-teal-100 text-teal-800",
    "bg-purple-100 text-purple-800",
    "bg-amber-100 text-amber-800",
    "bg-rose-100 text-rose-800",
    "bg-indigo-100 text-indigo-800",
    "bg-emerald-100 text-emerald-800",
    "bg-orange-100 text-orange-800",
    "bg-cyan-100 text-cyan-800",
    "bg-pink-100 text-pink-800",
  ];

  // Hash sederhana: nama aksara yang sama selalu dapat warna yang sama
  let hash = 0;
  const key = script.toUpperCase();
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Daftar aksara umum untuk saran di upload form
export const COMMON_SCRIPTS = [
  "Pegon",
  "Carakan",
  "Jawi",
  "Bali",
  "Sunda",
  "Bugis",
  "Batak",
  "Lampung",
  "Makassar",
  "Rejang",
];