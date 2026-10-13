// Prova completa su due "telefoni" simulati con un finto Supabase in memoria.
// Uso: python3 -m http.server 8765 &  poi  node strumenti/prova.mjs <cartella-screenshot> <CODICE>
import { chromium, devices } from 'playwright';
const DIR = process.argv[2], CODICE = process.argv[3], PAGINA = 'http://127.0.0.1:8765/index.html';
const browser = await chromium.launch();

// finto Supabase: una sola riga in memoria, condivisa dai due "telefoni"
const db = new Map();
async function finto(route){
  const req = route.request(), u = new URL(req.url());
  if(req.method() === 'GET'){
    const id = (u.searchParams.get('codice') || '').replace('eq.', '');
    const r = db.get(id);
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(r ? [r] : []) });
  }
  const [r] = JSON.parse(req.postData()); db.set(r.codice, r);
  return route.fulfill({ status: 201, body: '' });
}
const errori = [];
async function telefono(nome){
  const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'it-IT', timezoneId: 'Europe/Rome' });
  await ctx.route('https://finto.supabase.co/**', finto);
  const p = await ctx.newPage();
  p.on('pageerror', e => errori.push(nome + ': ' + e.message));
  p.on('console', m => { if(m.type() === 'error') errori.push(nome + ' console: ' + m.text()); });
  return p;
}
const shot = (p, n) => p.screenshot({ path: `${DIR}/${n}.png`, fullPage: false });

// --- telefono A: codice sbagliato, poi giusto
const A = await telefono('A');
await A.goto(PAGINA);
await A.fill('#codice-in', 'AAAA-BBBB-CCCC-DDDD'); await A.click('[data-a=sblocca]');
await A.waitForSelector('text=Codice non corretto');
await shot(A, '01-blocco');
await A.fill('#codice-in', CODICE.toLowerCase()); await A.click('[data-a=sblocca]');
await A.waitForSelector('text=Impostazioni');
await shot(A, '02-chi-sei');
await A.selectOption('[data-cfg=io]', 'p1');
await A.fill('[data-cfg=url]', 'https://finto.supabase.co'); await A.dispatchEvent('[data-cfg=url]', 'change');
await A.fill('[data-cfg=key]', 'anon-finta'); await A.dispatchEvent('[data-cfg=key]', 'change');
await A.click('[data-a=syncManuale]');
await A.waitForSelector('text=Sincronizzato alle');
await A.click('[data-a=chiudi]');
await shot(A, '03-programma');
await A.click('[data-a=apriGiorno][data-id=g04]');
await A.waitForSelector('.foglio');
await A.waitForTimeout(400);
await shot(A, '04-giorno');
await A.fill('[data-ed="giorni|g04|note"]', 'Sveglia alle 5:45!'); await A.dispatchEvent('[data-ed="giorni|g04|note"]', 'change');
await A.click('.foglio [data-a=modGiorno]'); await A.waitForSelector('text=Modifica giorno'); await A.waitForTimeout(300);
await shot(A, '10-modifica-giorno');
await A.click('[data-a=chiudi]');
await A.click('[data-a=tab][data-v=luoghi]'); await A.waitForTimeout(400); await shot(A, '05-luoghi');
await A.click('[data-a=pref][data-id=l13]');
await A.click('[data-a=dett][data-id=l13] >> nth=1'); await A.waitForSelector('.foglio'); await A.waitForTimeout(300); await shot(A, '05b-luogo');
await A.click('[data-a=chiudi]');
await A.click('[data-a=tab][data-v=viaggio]'); await A.waitForTimeout(400); await shot(A, '06-voli-hotel');
await A.click('[data-a=dett][data-id=h09]'); await A.waitForSelector('.foglio');
await A.click('[data-a=statoH][data-id=h09][data-v=prenotato]'); await A.waitForTimeout(300);
await shot(A, '07-hotel');
await A.click('[data-a=chiudi]');
await A.click('[data-a=altre][data-v=hakone]'); await A.click('[data-a=dett][data-id=h10]'); await A.waitForTimeout(300); await shot(A, '07b-hotel-avviso'); await A.click('[data-a=chiudi]');
await A.click('[data-a=tab][data-v=todo]'); await A.waitForTimeout(400); await shot(A, '08-todo');
await A.click('[data-a=todo][data-id=t02]');
await A.click('[data-a=tab][data-v=spese]');
await A.click('[data-a=nuovo][data-k=spese]');
await A.fill('[name=descr]', 'Cena Chibo'); await A.fill('[name=importo]', '9800'); await A.selectOption('[name=valuta]', 'JPY');
await A.click('[data-a=salvaModulo]');
await A.waitForTimeout(2500);
await shot(A, '09-spese');
await A.click('[data-a=tab][data-v=programma]'); await A.waitForTimeout(300);

// --- telefono B: entra con il link d'invito e vede le modifiche di A
const invito = await A.evaluate(() => linkInvito());
const B = await telefono('B');
await B.goto(invito);
await B.waitForSelector('text=Impostazioni');
await B.selectOption('[data-cfg=io]', 'p2');
await B.click('[data-a=chiudi]');
await B.waitForTimeout(1500);
const vistaB = await B.evaluate(() => ({
  nota: trova('giorni', 'g04').note, pref: trova('luoghi', 'l13').pref, hakone: trova('alloggi', 'h09').stato,
  todo: trova('todo', 't02').fatto, spese: vis('spese').map(s => s.descr), hash: location.hash
}));
// B modifica, A riceve
await B.evaluate(() => { const r = { ...trova('todo', 't03') }; r.fatto = true; salva('todo', r); });
await B.waitForTimeout(2500);
await A.evaluate(() => syncOra(true)); await A.waitForTimeout(1500);
const vistaA = await A.evaluate(() => ({ t03: trova('todo', 't03').fatto, daChi: nomeDi(trova('todo', 't03').da) }));
const cloud = [...db.values()][0];
console.log(JSON.stringify({ vistaB, vistaA, cloudCifrato: !/Hakone|Ichinoyu/.test(cloud.dati), invito: invito.replace(/c=[^&]+/, 'c=…'), errori }, null, 1));
await browser.close();
