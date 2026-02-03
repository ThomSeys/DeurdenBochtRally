# System Logs Cleanup

## Overzicht
Automatische cleanup van `system_logs` ouder dan 7 dagen om de database klein en performant te houden.

## Componenten

### 1. Database Function
**Bestand**: `scripts/add-log-cleanup.sql`

Bevat de `cleanup_old_system_logs()` functie die:
- Verwijdert logs ouder dan 7 dagen
- Logt het aantal verwijderde records
- Kan handmatig worden aangeroepen: `SELECT cleanup_old_system_logs();`

### 2. API Endpoint
**Bestand**: `apps/web/app/routes/api.cron.cleanup-logs.tsx`

Beveiligde cron endpoint die:
- Valideert de cron secret via Authorization header
- Roept de database cleanup functie aan
- Logt het resultaat

### 3. Vercel Cron Configuration
**Bestand**: `vercel.json`

Dagelijkse cron job:
- **Pad**: `/api/cron/cleanup-logs`
- **Schema**: `0 2 * * *` (elke dag om 2:00 AM)
- **Vercel documentatie**: https://vercel.com/docs/cron-jobs

## Setup

### Stap 1: Run de SQL Migration
```bash
psql $DATABASE_URL -f scripts/add-log-cleanup.sql
```

### Stap 2: Configureer Cron Secret
Voeg toe aan je environment variabelen (Vercel dashboard):
```
CRON_SECRET=your-random-secret-here
```

Je kan een random secret genereren met:
```bash
openssl rand -base64 32
```

### Stap 3: Deploy
Deploy naar Vercel. De cron job wordt automatisch geconfigureerd.

## Vercel Cron Jobs

Vercel ondersteunt native cron jobs voor Pro en Enterprise accounts:
- **Free tier**: Cron jobs worden NIET ondersteund
- **Pro tier**: Tot 10 cron jobs
- **Enterprise**: Unlimited

### Alternatief voor Free Tier

Als je op de free tier zit, gebruik een externe cron service:

#### Optie 1: EasyCron
1. Ga naar https://www.easycron.com
2. Maak een gratis account
3. Voeg een cron job toe:
   - URL: `https://jouw-domain.vercel.app/api/cron/cleanup-logs`
   - Interval: Daily at 02:00
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

#### Optie 2: cron-job.org
1. Ga naar https://cron-job.org
2. Maak een gratis account
3. Voeg een cron job toe met dezelfde configuratie

## Testing

### Handmatig testen van de functie
```sql
-- Via psql
SELECT cleanup_old_system_logs();

-- Controleer hoeveel logs er zijn
SELECT COUNT(*) FROM system_logs;

-- Bekijk logs van de laatste 7 dagen
SELECT COUNT(*), DATE(created_at) as date
FROM system_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Testen van het API endpoint
```bash
# Met curl (vervang YOUR_CRON_SECRET)
curl -X POST https://jouw-domain.vercel.app/api/cron/cleanup-logs \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response:
# {"success":true,"message":"Old system logs cleaned up successfully","timestamp":"2026-02-03T..."}
```

## Monitoring

Je kan de cleanup jobs monitoren via:
```sql
-- Bekijk cleanup logs
SELECT * FROM system_logs
WHERE category = 'maintenance'
  AND message LIKE '%Cleaned up%'
ORDER BY created_at DESC
LIMIT 10;
```

## Retentie Periode Aanpassen

Om de retentie periode te wijzigen van 7 naar bijv. 30 dagen:

1. Update de SQL functie:
```sql
CREATE OR REPLACE FUNCTION cleanup_old_system_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Wijzig '7 days' naar '30 days'
  DELETE FROM system_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    INSERT INTO system_logs (level, category, message, metadata)
    VALUES (
      'info',
      'maintenance',
      'Cleaned up old system logs',
      jsonb_build_object('deleted_count', deleted_count, 'retention_days', 30)
    );
  END IF;
END;
$$;
```

2. Run de update:
```bash
psql $DATABASE_URL -f scripts/add-log-cleanup.sql
```

## Audit Logs vs System Logs

**Belangrijk**: Dit is ALLEEN voor `system_logs`!

- **`system_logs`**: 7 dagen retentie (debugging/monitoring)
- **`participant_audit_log`**: 7 JAAR retentie (wettelijke vereiste)

De `participant_audit_log` heeft GEEN automatische cleanup en moet nooit automatisch verwijderd worden.

## Troubleshooting

### Cron job draait niet
1. Controleer of je op Vercel Pro/Enterprise zit
2. Bekijk Vercel dashboard → Project → Cron Jobs
3. Check de logs in Vercel dashboard

### Unauthorized error
- Controleer of `CRON_SECRET` correct is ingesteld
- Vercel moet het zelf aanroepen zonder Authorization header (dit gebeurt automatisch)

### Database error
- Controleer of de functie bestaat: `\df cleanup_old_system_logs` in psql
- Run de migration opnieuw als de functie niet bestaat
