# System Logging voor Deur Den Bocht

## Overzicht

Het logging systeem schrijft alle applicatie logs naar de Supabase database tabel `system_logs`. Dit maakt centralized monitoring, debugging en audit trails mogelijk.

## Installatie

### 1. Database Setup

Voer het SQL script uit om de logs tabel aan te maken:

```bash
psql -h <your-supabase-db-url> -U postgres -d postgres < scripts/add-system-logs.sql
```

Of via Supabase Dashboard:
1. Ga naar SQL Editor
2. Kopieer de inhoud van `scripts/add-system-logs.sql`
3. Voer het script uit

### 2. Gebruik in de Applicatie

De logger is beschikbaar via `~/lib/logger.server.ts`

## Basis Gebruik

```typescript
import { logger } from '~/lib/logger.server';

// Eenvoudige logs
await logger.info('auth', 'User logged in', { userId: '123' });
await logger.error('payment', 'Payment failed', error, { amount: 50 });
await logger.warn('api', 'Rate limit approaching', { remaining: 10 });
await logger.debug('database', 'Query executed', { query: 'SELECT * ...' });
await logger.critical('system', 'Database connection lost', error);
```

## Log Levels

- `debug` - Gedetailleerde debugging informatie
- `info` - Algemene informatieve berichten
- `warn` - Waarschuwingen die aandacht nodig hebben
- `error` - Errors die de applicatie blijft draaien
- `critical` - Kritieke errors die onmiddellijke actie vereisen

## Context Toevoegen

### Met Request Context

```typescript
import { createRequestLogger } from '~/lib/logger.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const requestLogger = createRequestLogger(request);
  
  await requestLogger.info('route', 'Dashboard loaded');
  // Logt automatisch: method, url, IP, user-agent, etc.
}
```

### Met User Context

```typescript
const userId = await getUserId(request);
const userLogger = logger.withUser(userId);

await userLogger.info('profile', 'Profile updated');
// Logt automatisch: userId, participantId
```

### Met Custom Context

```typescript
const customLogger = logger
  .withRequest(request)
  .withUser(userId)
  .withContext({ 
    zoneId: 'zone-123',
    eventType: 'check-in' 
  });

await customLogger.info('zone', 'User checked in');
```

## Metadata

Je kunt gestructureerde data meegeven als metadata:

```typescript
await logger.info('payment', 'Payment processed', {
  paymentId: 'pay_123',
  amount: 50,
  currency: 'EUR',
  provider: 'Mollie',
  participantId: 'user-456'
});
```

Metadata wordt opgeslagen als JSONB en is doorzoekbaar in de database.

## Error Logging

Voor errors, geef de Error object mee:

```typescript
try {
  await riskyOperation();
} catch (error) {
  await logger.error(
    'operation', 
    'Risky operation failed', 
    error as Error,
    { operationId: '123' }
  );
  throw error;
}
```

De stack trace wordt automatisch opgeslagen in `error_stack`.

## Performance Monitoring

Meet de duur van operaties:

```typescript
const result = await logger.withTiming(
  'database',
  'Fetch participants',
  async () => {
    return await supabase.from('participants').select('*');
  }
);
```

Dit logt automatisch de duur in milliseconden.

## Categorieën

Gebruik consistente categorieën voor betere filtering:

- `auth` - Authenticatie en autorisatie
- `api` - API calls en responses
- `database` - Database queries en operaties
- `payment` - Betalingen en transacties
- `email` - Email verzending
- `zone` - Rally zone check-ins/outs
- `registration` - Gebruiker registraties
- `push` - Push notifications
- `upload` - File uploads
- `gps` - GPS tracking
- `emergency` - Noodsituaties

## Logs Bekijken

Admins kunnen logs bekijken op:

**URL:** `/admin/logs`

Features:
- Filter op log level (debug, info, warn, error, critical)
- Filter op categorie
- Zoeken in messages
- Paginering (50 logs per pagina)
- Uitklapbare details met metadata, error stacks, request info
- Real-time user informatie

## RLS (Row Level Security)

- **Lezen:** Alleen admins kunnen logs bekijken
- **Schrijven:** Alleen de service role kan logs schrijven (via server-side code)
- Gebruikers kunnen hun eigen logs niet zien (privacy)

## Best Practices

### ✅ DO

```typescript
// Goede log messages: specifiek en actionable
await logger.info('auth', 'User login successful', { userId, method: 'password' });
await logger.error('payment', 'Mollie webhook validation failed', error, { webhookId });

// Gebruik request context waar mogelijk
const reqLogger = createRequestLogger(request, userId);
await reqLogger.warn('rate-limit', 'Rate limit exceeded');
```

### ❌ DON'T

```typescript
// Vermijd vage messages
await logger.info('app', 'Something happened'); // ❌ Te vaag

// Log geen gevoelige data in plain text
await logger.info('auth', 'Login attempt', { 
  password: '123456' // ❌ NOOIT passwords loggen
});

// Gebruik debug level voor verbose logs, niet info
await logger.info('debug', 'Variable x = 5'); // ❌ Gebruik debug level
```

## Database Schema

```sql
CREATE TABLE system_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  level VARCHAR(20),                    -- debug, info, warn, error, critical
  category VARCHAR(100),                -- auth, api, database, etc.
  message TEXT,                         -- Hoofdbericht
  user_id UUID,                         -- Gekoppelde user
  participant_id UUID,                  -- Gekoppelde participant
  metadata JSONB,                       -- Extra gestructureerde data
  request_id VARCHAR(255),              -- Request tracking ID
  ip_address INET,                      -- Client IP
  user_agent TEXT,                      -- Browser/client info
  url TEXT,                             -- Request URL
  method VARCHAR(10),                   -- HTTP method
  status_code INTEGER,                  -- HTTP status
  error_stack TEXT,                     -- Error stack trace
  duration_ms INTEGER                   -- Operation duration
);
```

## Voorbeelden uit Routes

### Login Route

```typescript
import { createRequestLogger } from '~/lib/logger.server';

export async function action({ request }: ActionFunctionArgs) {
  const requestLogger = createRequestLogger(request);
  
  try {
    const { email, password } = await request.formData();
    
    const user = await authenticateUser(email, password);
    
    await requestLogger
      .withUser(user.id)
      .info('auth', 'User logged in successfully', { 
        method: 'password',
        email 
      });
    
    return redirect('/dashboard');
  } catch (error) {
    await requestLogger.error('auth', 'Login failed', error as Error, {
      email: formData.get('email')
    });
    
    return json({ error: 'Login failed' }, { status: 401 });
  }
}
```

### API Route met Performance Tracking

```typescript
import { logger, logApiResponse } from '~/lib/logger.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const start = Date.now();
  
  try {
    const data = await logger.withTiming(
      'api',
      'Fetch rally zones',
      async () => {
        return await supabase.from('rally_zones').select('*');
      }
    );
    
    const response = json(data);
    await logApiResponse(request, response, Date.now() - start);
    
    return response;
  } catch (error) {
    await logger
      .withRequest(request)
      .error('api', 'Failed to fetch rally zones', error as Error);
    
    return json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## Troubleshooting

### Logs worden niet opgeslagen

1. Check of de `system_logs` tabel bestaat
2. Verifieer dat de service role key correct is ingesteld
3. Check RLS policies op de tabel
4. Kijk in de console voor fallback logs

### Kan logs niet zien in admin panel

1. Verifieer dat je ingelogd bent als admin (`is_admin = true`)
2. Check of er überhaupt logs in de database staan
3. Probeer filters te resetten

### Performance issues

- Index zijn aanwezig op: `created_at`, `level`, `category`, `user_id`, `participant_id`
- Oudere logs kunnen gearchiveerd worden via custom script
- Overweeg log retention policy (bijv. 90 dagen)

## Toekomstige Features

- [ ] Log aggregatie en trends
- [ ] Email alerts voor critical errors
- [ ] Log export functionaliteit
- [ ] Automatische log archivering (> 90 dagen)
- [ ] Dashboard met log statistieken
- [ ] Slack/Discord integratie voor critical logs
