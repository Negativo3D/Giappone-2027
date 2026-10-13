// Estrae i dati del viaggio dal blocco cifrato di index.html e li scrive
// in privato/viaggio.json (cartella esclusa da git: non va mai committata).
//   CODICE=XXXX-XXXX-XXXX-XXXX node strumenti/decifra.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { decifra, RE_SEME, leggiCodice } from './cifratura.mjs';

const codice = leggiCodice();
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const seme = JSON.parse(html.match(RE_SEME)[2]);
let dati;
try{ dati = JSON.parse(await decifra(seme, codice)); }
catch(e){ console.error('Codice non corretto: non riesco ad aprire i dati.'); process.exit(1); }

// Toglie i campi tecnici di sincronizzazione per avere un file leggibile.
const pulisci = r => { const { agg, da, ...resto } = r; return resto; };
for(const k of Object.keys(dati)){
  if(Array.isArray(dati[k])) dati[k] = dati[k].filter(r => !r.del).map(pulisci);
  else if(dati[k] && typeof dati[k] === 'object') dati[k] = pulisci(dati[k]);
}
mkdirSync(new URL('../privato/', import.meta.url), { recursive: true });
writeFileSync(new URL('../privato/viaggio.json', import.meta.url), JSON.stringify(dati, null, 1) + '\n');
console.log('Scritto privato/viaggio.json');
