// Stessa cifratura dell'app (PBKDF2-SHA256 + AES-GCM 256), per Node 18+.
import { webcrypto as crypto } from 'node:crypto';

export const ITERAZIONI = 310000;
export const normCodice = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const b64 = b => Buffer.from(b).toString('base64');
const unb64 = s => new Uint8Array(Buffer.from(s, 'base64'));

async function chiave(codice, salt, it){
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(normCodice(codice)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: it, hash: 'SHA-256' }, base,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function cifra(testo, codice, it = ITERAZIONI){
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await chiave(codice, salt, it), new TextEncoder().encode(testo));
  return { v: 1, it, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}
export async function decifra(o, codice){
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, await chiave(codice, unb64(o.salt), o.it), unb64(o.ct));
  return new TextDecoder().decode(pt);
}

// Il blocco cifrato sta in index.html dentro <script id="seme" type="application/json">…</script>
export const RE_SEME = /(<script id="seme" type="application\/json">)([\s\S]*?)(<\/script>)/;

export function leggiCodice(){
  const c = normCodice(process.env.CODICE);
  if(c.length < 8){
    console.error('Manca il codice del viaggio. Uso: CODICE=XXXX-XXXX-XXXX-XXXX node strumenti/<script>.mjs');
    process.exit(1);
  }
  return c;
}
