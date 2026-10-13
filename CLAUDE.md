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

Raccolte: `viaggiatori`, `tappe`, `giorni` (con `voci` collegate ai `luoghi` tramite `l`), `alloggi`, `voli`, `luoghi`, `todo`, `budget`, `spese`, `info`, più l'oggetto `viaggio`.
- Ogni elemento ha `id`, `agg` (ora dell'ultima modifica), `da` (chi l'ha fatta) e, se eliminato, `del: true`.
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
