// Cifra privato/viaggio.json e lo inserisce in index.html.
//   CODICE=XXXX-XXXX-XXXX-XXXX node strumenti/costruisci.mjs
//
// Ogni elemento riceve un'ora di modifica ("agg"): resta quella vecchia se
// l'elemento non è cambiato, così le modifiche fatte dagli utenti nell'app
// non vengono sovrascritte. Gli elementi cambiati qui prendono l'ora attuale
// e vincono su quelli salvati nei telefoni e nel cloud.
import { readFileSync, writeFileSync } from 'node:fs';
import { cifra, decifra, RE_SEME, leggiCodice } from './cifratura.mjs';

const codice = leggiCodice();
const fHtml = new URL('../index.html', import.meta.url);
const html = readFileSync(fHtml, 'utf8');
const nuovi = JSON.parse(readFileSync(new URL('../privato/viaggio.json', import.meta.url), 'utf8'));

let vecchi = {};
try{
  const s = JSON.parse(html.match(RE_SEME)[2]);
  if(s.ct) vecchi = JSON.parse(await decifra(s, codice));
}catch(e){
  console.error('Il blocco attuale di index.html non si apre con questo codice: interrompo per non perdere dati.');
  process.exit(1);
}

const ora = Date.now();
const senzaTempi = r => JSON.stringify(r, (k, v) => (k === 'agg' || k === 'da') ? undefined : v);
const marca = (n, v) => {
  if(v && senzaTempi(v) === senzaTempi(n)) return { ...n, agg: v.agg || ora };
  return { ...n, agg: ora };
};
let cambiati = 0;
const out = {};
for(const k of Object.keys(nuovi)){
  if(Array.isArray(nuovi[k])){
    const prima = new Map((vecchi[k] || []).map(r => [r.id, r]));
    out[k] = nuovi[k].map(r => { const m = marca(r, prima.get(r.id)); if(m.agg === ora) cambiati++; prima.delete(r.id); return m; });
    // elementi tolti dal file: diventano "eliminati" anche nei telefoni
    for(const r of prima.values()) if(!r.del){ out[k].push({ id: r.id, del: true, agg: ora }); cambiati++; }
      else out[k].push(r);
  }else{
    out[k] = marca(nuovi[k], vecchi[k]); if(out[k].agg === ora) cambiati++;
  }
}
const seme = await cifra(JSON.stringify(out), codice);
writeFileSync(fHtml, html.replace(RE_SEME, (m, a, b, c) => a + JSON.stringify(seme) + c));
console.log(`index.html aggiornato: ${cambiati} elementi nuovi o modificati.`);
