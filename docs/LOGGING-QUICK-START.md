# Quick Start: Logging Systeem Activeren

## Stap 1: Database Tabel Aanmaken

Open Supabase Dashboard → SQL Editor en voer uit:

```bash
# Lokaal (als je een lokale Supabase hebt)
psql -h localhost -U postgres -d postgres < scripts/add-system-logs.sql

# Of via Supabase Dashboard:
# 1. Open https://supabase.com/dashboard/project/YOUR_PROJECT/sql
# 2. Kopieer scripts/add-system-logs.sql
# 3. Plak en voer uit
```

## Stap 2: Test de Logger

Maak een test file aan om te verifiëren dat logging werkt:

```typescript
// test-logging.ts
import { logger } from './apps/web/app/lib/logger.server';

async function testLogging() {
  console.log('Testing logging system...');
  
  // Test verschillende log levels
  await logger.info('test', 'This is an info message', { test: true });
  await logger.warn('test', 'This is a warning', { severity: 'medium' });
  await logger.error('test', 'This is an error', new Error('Test error'), { critical: false });
  
  console.log('✅ Logs written to database');
  console.log('📊 Check admin panel at: http://localhost:3000/admin/logs');
}

testLogging();
```

Run:
```bash
npx tsx test-logging.ts
```

## Stap 3: Bekijk Logs in Admin Panel

1. Start de app: `npm run dev` (in apps/web)
2. Login als admin gebruiker
3. Navigeer naar: http://localhost:3000/admin/logs
4. Je zou de test logs moeten zien!

## Stap 4: Integreer in je Routes

Voeg logging toe aan belangrijke routes:

```typescript
// Voorbeeld: apps/web/app/routes/login.tsx
import { createRequestLogger } from '~/lib/logger.server';

export async function action({ request }: ActionFunctionArgs) {
  const requestLogger = createRequestLogger(request);
  
  try {
    // ... je login logica
    
    await requestLogger
      .withUser(user.id)
      .info('auth', 'User logged in successfully');
    
    return redirect('/dashboard');
  } catch (error) {
    await requestLogger.error('auth', 'Login failed', error as Error);
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
```

## Verificatie Checklist

- [ ] Database tabel `system_logs` bestaat
- [ ] Test logging script werkt zonder errors
- [ ] Admin panel toont logs op `/admin/logs`
- [ ] Filters werken (level, category, search)
- [ ] Log details expanderen werkt
- [ ] User info wordt correct getoond

## Veelvoorkomende Problemen

**Problem:** "relation system_logs does not exist"
- **Oplossing:** Voer SQL script opnieuw uit in Supabase

**Problem:** Kan geen logs zien in admin panel
- **Oplossing:** Verifieer dat je gebruiker `is_admin = true` heeft

**Problem:** Logs worden niet opgeslagen
- **Oplossing:** Check Supabase connection en service role key in `.env`

## Volgende Stappen

1. Bekijk [LOGGING-SYSTEM.md](./LOGGING-SYSTEM.md) voor uitgebreide documentatie
2. Voeg logging toe aan kritieke routes (auth, payment, etc.)
3. Monitor logs regelmatig voor errors en warnings
4. Stel alerts in voor critical logs (toekomstige feature)

## Handig om te Weten

- Logs in development worden ook naar console geschreven
- Logs in production alleen naar database
- Oudere logs kunnen gearchiveerd worden
- RLS zorgt dat alleen admins logs kunnen zien
- Service role key nodig voor het schrijven van logs
