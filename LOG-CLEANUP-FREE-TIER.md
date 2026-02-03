# Automatische Log Cleanup (Free Tier Compatible)

## Probleem
- Vercel free tier ondersteunt **geen cron jobs**
- System logs moeten elke 7 dagen automatisch verwijderd worden (GDPR compliance)
- Participant audit logs blijven 7 jaar bewaard

## Oplossing: Opportunistische Cleanup

In plaats van externe cron jobs gebruiken we **opportunistische cleanup** die ingebouwd is in het logging systeem zelf.

### Hoe het werkt

1. **In-memory tracking**: Simpele variabele houdt laatste cleanup tijd bij
2. **Automatische trigger**: Bij elk log dat geschreven wordt, controleren we of cleanup nodig is
3. **24-uur interval**: Cleanup draait maximaal 1x per 24 uur
4. **Non-blocking**: Cleanup draait in de achtergrond, blokkeert logging niet
5. **Geen externe dependencies**: Werkt zonder cron jobs, GitHub Actions, of third-party services

### Implementatie

#### 1. Database Functie
```sql
-- scripts/add-log-cleanup.sql
CREATE OR REPLACE FUNCTION cleanup_old_system_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM system_logs 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. Logger met Auto-Cleanup
```typescript
// apps/web/app/lib/logger.server.ts

// Track last cleanup time (in-memory, resets on server restart)
let lastCleanupTime = 0;
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

class Logger {
  async log(entry: LogEntry): Promise<void> {
    // ... write log to database ...
    
    // Opportunistic cleanup: run cleanup once per day
    this.maybeCleanupOldLogs();
  }

  private maybeCleanupOldLogs(): void {
    const now = Date.now();
    
    // Check if enough time has passed (non-blocking)
    if (now - lastCleanupTime < CLEANUP_INTERVAL_MS) {
      return; // Too soon, skip
    }

    // Update timestamp immediately to prevent concurrent cleanups
    lastCleanupTime = now;

    // Run cleanup in background (don't await, don't block logging)
    this.performCleanup().catch((err) => {
      console.error('[Logger] Background cleanup failed:', err);
      // Reset timestamp on failure so we retry sooner
      lastCleanupTime = now - CLEANUP_INTERVAL_MS + (60 * 60 * 1000); // Retry in 1 hour
    });
  }

  private async performCleanup(): Promise<void> {
    const { data, error } = await supabaseAdmin.rpc('cleanup_old_system_logs');
    
    if (error) {
      throw new Error(`Cleanup RPC failed: ${error.message}`);
    }
    
    if (data > 0) {
      console.log(`[Logger] Cleaned up ${data} old system logs`);
    }
  }
}
```

## Voordelen

✅ **Free-tier compatible**: Geen Vercel Pro/Enterprise nodig
✅ **Zero external dependencies**: Geen GitHub Actions, cron services, etc.
✅ **Automatic**: Gebeurt vanzelf zolang de app logs schrijft
✅ **Non-blocking**: Logging blijft snel, cleanup draait op achtergrond
✅ **Resilient**: Bij falen wordt 1 uur later opnieuw geprobeerd
✅ **Efficient**: Maximaal 1x per 24 uur

## Nadelen & Beperkingen

⚠️ **Server restart reset**: In-memory tijd wordt gereset bij elke deployment
- Impact: Minimaal - cleanup draait dan iets vaker (max 1 extra keer per dag)

⚠️ **Afhankelijk van logging**: Als app geen logs schrijft, geen cleanup
- Impact: Zeer minimaal - app schrijft constant logs (page views, errors, etc.)

⚠️ **Geen exacte timing**: Cleanup gebeurt "ongeveer" elke 24 uur
- Impact: Geen - 7-dagen retentie is niet naar de seconde kritisch

## Alternatieven (niet gekozen)

❌ **Vercel Cron**: Vereist Pro/Enterprise plan (€20+/maand)
❌ **GitHub Actions**: Extra complexiteit, aparte CI/CD setup
❌ **External cron services**: Extra dependency, minder betrouwbaar
❌ **Manual cleanup**: Foutgevoelig, vereist menselijke actie

## Setup

1. **Run database migration**:
   ```bash
   # Via Supabase dashboard of CLI
   psql -f scripts/add-log-cleanup.sql
   ```

2. **Deploy de aangepaste logger**:
   ```bash
   git add apps/web/app/lib/logger.server.ts
   git commit -m "Add opportunistic log cleanup"
   git push
   ```

3. **Verify it works**:
   - Check console logs voor: `[Logger] Cleaned up X old system logs`
   - Of query database: `SELECT cleanup_old_system_logs();`

## Monitoring

Monitor de cleanup via:
- **Console logs**: Zoek naar `[Logger] Cleaned up` berichten
- **Database query**: 
  ```sql
  SELECT COUNT(*) FROM system_logs 
  WHERE created_at < NOW() - INTERVAL '7 days';
  ```
  Moet altijd `0` of zeer laag zijn

## GDPR Compliance

✅ **System logs**: Automatisch verwijderd na 7 dagen
✅ **Participant audit logs**: Bewaard voor 7 jaar (wettelijke verplichting)
✅ **Participant data**: Kan worden verwijderd via admin of self-service
✅ **Audit trail**: Alle verwijderingen worden gelogd in participant_audit_log

