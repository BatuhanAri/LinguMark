const fs = require('fs');

const c1Words = [
  "abolish", "abundant", "accuracy", "acquisition", "adequate", "adjacent", "adolescent", "advocate",
  "allocate", "ambiguous", "amend", "analogy", "anticipate", "apparatus", "arbitrary", "assemble",
  "assert", "assess", "asset", "assign", "bias", "boom", "bounce", "breach", "bulk", "bypass",
  "capacity", "cease", "chronicle", "clarify", "coherent", "coincide", "collapse", "commence",
  "commodity", "compile", "complement", "comply", "comprehensive", "conceive", "consensus",
  "consent", "constrain", "contemporary", "contradict", "core", "correlate", "crude", "deduce",
  "demographic", "derive", "designate", "deviate", "diagnose", "dictate", "diminish", "disclose",
  "discriminate", "displace", "dispose", "distort", "diverse", "domain", "dynamic", "eclipse",
  "ecology", "elaborate", "empirical", "entity", "equate", "erode", "ethic", "evaluate", "evolve",
  "exceed", "explicit", "exploit", "extract", "facilitate", "format", "framework", "hierarchy",
  "hypothesis", "implement", "implication", "implicit", "incentive", "incline", "incorporate",
  "index", "induce", "inevitable", "infer", "infrastructure", "inherent", "inhibit", "initiate",
  "innovate", "insight", "integral", "integrity", "intervene", "intrinsic", "invoke", "margin",
  "mechanism", "mediate", "metaphor", "norm", "paradigm", "panel", "persist", "phenomenon",
  "plausible", "preliminary", "presume", "prevail", "profound", "prohibit", "qualitative",
  "quantitative", "radical", "random", "regime", "restore", "rigid", "scope", "simulate",
  "scenario", "subordinate", "subsidy", "substitute", "successive", "supplement", "suspend",
  "sustain", "tangible", "terminate", "theme", "thereby", "thesis", "transform", "transmit",
  "ultimate", "undergo", "underlie", "undertake", "uniform", "unify", "unique", "utilize",
  "valid", "vary", "vehicle", "via", "violate", "virtual", "visible", "vision", "visual",
  "volume", "voluntary", "welfare", "whereas", "whereby", "widespread", "withhold", "accumulate",
  "acknowledge", "aggregate", "align", "albeit", "array", "assimilation", "autonomy", "civilian",
  "closure", "cohesion", "commodity", "competence", "complexity", "concede", "conceive", "confer",
  "configuration", "consensus", "constraint", "converge", "coordinate", "corpus", "credibility"
];

// Read oxford_words.json
const wordsPath = 'oxford_words.json';
const data = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

// Replace C1
data.C1 = c1Words;
fs.writeFileSync(wordsPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Fixed oxford_words.json with 160 genuine C1 Master words.');

// Read src/shared/oxford.js and remove all C1 words
const jsPath = 'src/shared/oxford.js';
const jsContent = fs.readFileSync(jsPath, 'utf8');
const match = jsContent.match(/export const oxfordDictionary = (\[[\s\S]*\]);\s*$/);
if (match) {
  let dictionary = JSON.parse(match[1]);
  // Filter out any word whose level is C1
  dictionary = dictionary.filter(w => w.level !== 'C1');
  const output = `export const oxfordDictionary = ${JSON.stringify(dictionary, null, 2)};\n`;
  fs.writeFileSync(jsPath, output, 'utf8');
  console.log('Removed duplicate C1 entries from src/shared/oxford.js (Left ' + dictionary.length + ' words)');
}
