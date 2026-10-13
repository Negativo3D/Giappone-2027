# Giappone 2027

L'app del nostro viaggio in Giappone: programma giorno per giorno, voli, hotel, luoghi con Google Maps, ristoranti, preferiti, cose da fare e spese. Tutto si modifica dall'app e si condivide tra i compagni di viaggio.

## Come si usa

1. Apri il link d'invito ricevuto in privato, dal telefono.
2. Aggiungi l'app alla schermata Home: su iPhone con Condividi → Aggiungi alla schermata Home, su Android con il menu ⋮ → Installa app.
3. Scegli chi sei. Da quel momento le tue modifiche e i tuoi preferiti ❤️ arrivano a tutti.

L'app funziona anche senza rete: le modifiche fatte offline partono appena torna la connessione.

## Riservatezza

Il codice è pubblico, i dati del viaggio no. Sono cifrati sia in questa pagina sia nel cloud, e si aprono solo con il codice del viaggio, contenuto nel link d'invito. Il link va mandato solo ai compagni di viaggio.

## Sincronizzazione

Serve un progetto Supabase. Va bene quello di CHO, con la stessa tabella `cho_sync`. Nelle Impostazioni dell'app inserisci Project URL e chiave anon, poi tocca **Invita i compagni di viaggio**.

Se si vuole una tabella dedicata:

```sql
create table viaggio_sync (codice text primary key, dati text not null, aggiornato timestamptz default now());
alter table viaggio_sync enable row level security;
create policy "accesso con codice" on viaggio_sync for all to anon using (true) with check (true);
```

Poi scrivi `viaggio_sync` nel campo Tabella delle Impostazioni.

## Sviluppo

Lo sviluppo si fa con Claude Code nel cloud, senza installare nulla sul computer. Le istruzioni sono in [CLAUDE.md](CLAUDE.md).
