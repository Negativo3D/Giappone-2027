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
await A.goto(PAGINA); await A.waitForSelector('#alba', { state:'detached' });
await A.fill('#codice-in', 'AAAA-BBBB-CCCC-DDDD'); await A.click('[data-a=sblocca]');
await A.waitForSelector('text=Codice non corretto');
await shot(A, '01-blocco');
await A.fill('#codice-in', CODICE.toLowerCase()); await A.click('[data-a=sblocca]');
await A.waitForSelector('text=Giorno per giorno');
await A.click('[data-a=impostazioni]'); await A.waitForSelector('text=Impostazioni');
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
await A.click('[data-a=tab][data-v=luoghi]'); await A.waitForSelector('.segno-in'); await A.waitForTimeout(1200); await shot(A, '05-mappa');
const segni = await A.$$eval('.segno', e => e.length);
await A.click('[data-a=citta][data-v=kyoto]'); await A.waitForTimeout(1300); await shot(A, '05a-mappa-kyoto');
await A.evaluate(() => MAPPA.setZoom(16)); await A.waitForTimeout(700); await A.locator('.segno-in', { hasText: 'Gimmond' }).click(); await A.waitForSelector('.foglio'); await A.waitForTimeout(300); await shot(A, '05b-hotel-da-mappa');
const titoloHotel = await A.$eval('.foglio-h h2', e => e.textContent);
await A.click('[data-a=chiudi]');
await A.click('#mappa-piu'); await A.waitForSelector('#mappa-aiuto:not([hidden])'); await shot(A, '05c-aggiungi');
const box = await A.$eval('#mappa', e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await A.mouse.click(box.x, box.y); await A.waitForSelector('[name=nome]');
await A.fill('[name=nome]', 'Caffè sul canale'); await A.selectOption('[name=cat]', 'mangiare'); await A.click('[data-a=salvaModulo]');
await A.waitForTimeout(400); const segniDopo = await A.$$eval('.segno', e => e.length); await shot(A, '05d-nuovo-luogo');
console.log(JSON.stringify({ segni, titoloHotel, segniDopo }));
await A.click('[data-a=tab][data-v=viaggio]'); await A.waitForTimeout(400); await shot(A, '06-voli-hotel');
await A.click('[data-a=dett][data-id=h09]'); await A.waitForSelector('.foglio');
await A.click('[data-a=statoH][data-id=h09][data-v=prenotato]'); await A.waitForTimeout(300);
await shot(A, '07-hotel');
await A.click('[data-a=chiudi]');
await A.click('[data-a=altre][data-v=hakone]'); await A.click('[data-a=dett][data-id=h10]'); await A.waitForTimeout(300); await shot(A, '07b-hotel-avviso'); await A.click('[data-a=chiudi]');
await A.waitForTimeout(2500); // sincronizzazione automatica
await A.click('[data-a=tab][data-v=programma]'); await A.waitForTimeout(300);

// --- telefono B: entra con il link d'invito e vede le modifiche di A
const invito = await A.evaluate(() => linkInvito());
const B = await telefono('B');
await B.goto(invito); await B.waitForSelector('#alba', { state:'detached' });
await B.waitForSelector('text=Giorno per giorno');
await B.click('[data-a=tab][data-v=viaggio]');
await B.click('[data-a=dett][data-k=alloggi][data-id=h05]'); await B.waitForSelector('.foglio');
await B.click('.foglio [data-a=pref]');
await B.waitForSelector('text=Chi sei?'); await shot(B, '11-chi-sei');
await B.click('[data-a=sonoIo][data-id=p2]');
await B.waitForTimeout(1500);
const vistaB = await B.evaluate(() => ({ sheetChiuso: !S.sheet, cuoreB: trova('alloggi', 'h05').pref, luogoNuovo: vis('luoghi').filter(l => l.lat).map(l => l.nome),
  nota: trova('giorni', 'g04').note, hakone: trova('alloggi', 'h09').stato,
  hash: location.hash
}));
// B modifica, A riceve
await B.evaluate(() => { const r = { ...trova('luoghi', 'l01') }; r.note = 'Andiamoci la prima sera'; salva('luoghi', r); });
await B.waitForTimeout(2500);
await A.evaluate(() => syncOra(true)); await A.waitForTimeout(1500);
const vistaA = await A.evaluate(() => ({ notaL01: trova('luoghi', 'l01').note, daChi: nomeDi(trova('luoghi', 'l01').da) }));
const cloud = [...db.values()][0];
console.log(JSON.stringify({ vistaB, vistaA, cloudCifrato: !/Hakone|Ichinoyu/.test(cloud.dati), invito: invito.replace(/c=[^&]+/, 'c=…'), errori }, null, 1));
await browser.close();
