# Giappone 2027: istruzioni per Claude Code

App web di una sola pagina (`index.html`) per condividere con i compagni di viaggio il viaggio in Giappone dal 21 marzo al 1° aprile 2027. È costruita come CHO (repo `Negativo3D/CHO`): niente framework né build, installabile sul telefono come app e pubblicata con GitHub Pages. Rispondi e scrivi commit in italiano.

## Regola d'oro: i dati del viaggio sono segreti

Il repository è **pubblico**. Date, hotel, prezzi e prenotazioni stanno solo:
- nel blocco cifrato `<script id="seme">` di `index.html` (AES-GCM, chiave dal codice del viaggio);
- nel cloud Supabase, sempre cifrati.

Regole:
- **Mai** scrivere il codice del viaggio in file, commit, PR o issue. Se serve, chiedilo all'utente e usalo solo come variabile d'ambiente `CODICE`.
- **Mai** committare `privato/`: è già in `.gitignore`.
- Non scrivere dati personali del viaggio in chiaro nel codice (README, commenti, test).

## Modificare i dati del viaggio

```bash
CODICE=XXXX-XXXX-XXXX-XXXX node strumenti/decifra.mjs     # crea privato/viaggio.json
# modifica privato/viaggio.json
CODICE=XXXX-XXXX-XXXX-XXXX node strumenti/costruisci.mjs  # ricifra dentro index.html
```

`costruisci.mjs` aggiorna l'ora di modifica (`agg`) solo degli elementi cambiati. Così le modifiche fatte dagli utenti nell'app restano, tranne su quegli elementi. Un elemento tolto dal file viene segnato come eliminato anche sui telefoni.

Gli utenti modificano quasi tutto dall'app. Ricostruire il blocco cifrato serve solo per cambi strutturali o di massa.

## Modello dei dati

Raccolte: `viaggiatori`, `tappe`, `giorni` (con `voci` collegate ai `luoghi` tramite `l`), `alloggi`, `voli`, `luoghi`, `info`, più l'oggetto `viaggio`. Le sezioni Spese e Da fare sono state tolte su richiesta dell'utente: `todo`, `budget` e `spese` restano nei dati ma non si vedono.
- Ogni elemento ha `id`, `agg` (ora dell'ultima modifica), `da` (chi l'ha fatta) e, se eliminato, `del: true`. Questi nomi sono riservati: non usarli come campi dei dati (i voli usano `origine` e `destinazione`).
- Nell'unione tra telefono, cloud e blocco cifrato vince, elemento per elemento, la modifica più recente (funzione `unisci`).

## Sincronizzazione

Usa Supabase via REST, di default sulla stessa tabella di CHO (`cho_sync`: `codice`, `dati`, `aggiornato`).
- La riga si identifica con `sha256('giappone-2027|' + codice)`.
- La sincronizzazione parte all'apertura, 1,5 secondi dopo ogni modifica e ogni minuto.
- Il link d'invito porta codice, URL e chiave anon nel frammento `#`, che non viene mai inviato al server.

## Come lavorare

- Ogni modifica in un branch `claude/...` con una PR verso `main`, come in CHO.
- Quando cambia l'app, aumenta `VERSIONE` in `index.html` e il nome di `CACHE` in `sw.js`.
- Provala su un telefono simulato (Playwright, viewport iPhone) servendo la cartella con `python3 -m http.server`.
- Per la sincronizzazione, intercetta le chiamate a Supabase con un finto server in memoria, come in `strumenti/prova.mjs`.

## Spirito dell'app

L'app è un **compagno di viaggio pratico**: dice dove andare oggi, apre la mappa, ricorda l'hotel della notte. Non deve essere assillante: niente scadenze in evidenza, contatori, avvisi rossi, promemoria o liste di cose da fare. Le schede sono tre: **Home** (conto alla rovescia, orologi Italia e Giappone, giorno per giorno), **Luoghi** e **Voli e hotel**. Le sezioni Spese e Da fare sono state tolte apposta. Prima di aggiungere qualcosa chiediti: serve davvero mentre si è in giro?

## Stile grafico

Lo stile è **Odoo** (palette e font delle app O&M dell'utente), in versione **grande, ariosa e sempre chiara**. L'utente ha bocciato la versione densa e piccola, quindi va mantenuto così in ogni modifica:
- **solo tema chiaro**: niente modalità scura, anche se il telefono è impostato in scuro;
- fondo `#eef4f9`, superfici bianche, bordi `#e4ebf3`, accento teal `#0f8f9a`;
- titoli in **Archivo**, testo in **IBM Plex Sans** a 17px; niente etichette minuscole o in monospazio;
- **poche informazioni per schermata**: gli elenchi mostrano icona, nome, una riga di contesto e al massimo un'azione; i dettagli stanno in una scheda che si apre al tocco (`foglioDettaglio`, `foglioGiornoVista`);
- pulsanti alti almeno 46–48px, icone a linea SVG (oggetto `ICO`) in riquadri colorati con `color-mix`, niente emoji nell'interfaccia.

La scheda **Luoghi** è tutta mappa: una mappa Leaflet (in `vendor/leaflet`, sfondo Esri World Street Map, con ripiego su OpenStreetMap; CARTO ora chiede una chiave) a schermo pieno tra barra in alto e barra delle schede (`#mappa-box`, fuori da `#app` per non ricaricarla a ogni tocco), con sopra solo i filtri per città. Niente elenco di suggerimenti: i luoghi li inseriscono gli utenti col pulsante "+" toccando un punto della mappa (campi nascosti `lat`/`lon`).
- Sulla mappa ci sono gli hotel (colore della città, etichetta verde se prenotato) e i luoghi inseriti. I badge si adattano allo zoom: sotto 10 uno per città ("Kyoto · 4 hotel"), sotto 14 compatti, poi col nome. Toccando un badge si apre la scheda di dettaglio.
- I quartieri (`QUARTIERI`) sono cerchi tratteggiati con il nome, visibili da zoom 11.
- Negli hotel non si mostrano i prezzi; nell'elenco Voli e hotel toccando l'hotel si apre il suo sito.

**Animazione d'apertura** (`#alba`, circa 3,3 secondi, si salta con un tocco, disattivata con Riduci movimento): è la scena dell'icona che prende vita. Il cielo passa dalla notte al tramonto, il sole sorge dietro il Fuji, il ramo di ciliegio ondeggia, cadono i petali e compare il titolo. La scena si adatta tagliando la parte alta, quindi il ramo sta in un SVG a parte agganciato in alto a sinistra. La precedente animazione con la samurai è stata bocciata: non usare personaggi né spezzoni di film.

L'icona dell'app è originale, in stile anime: il sorgente è `strumenti/icona.svg` e i PNG si rigenerano da lì.
