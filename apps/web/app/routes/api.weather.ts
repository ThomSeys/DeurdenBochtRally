import type { LoaderFunctionArgs } from 'react-router';

// Open-Meteo API - Completely free, no API key required!
// Docs: https://open-meteo.com/en/docs
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';

interface WeatherData {
  location: string;
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  rain_probability?: number;
  alerts?: Array<{
    event: string;
    description: string;
    severity: string;
  }>;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  const location = url.searchParams.get('location') || 'Event Area';

  if (!lat || !lon) {
    return { error: 'Latitude and longitude required', status: 400 };
  }

  try {
    // Fetch current weather + forecast from Open-Meteo
    const weatherResponse = await fetch(
      `${OPEN_METEO_BASE_URL}/forecast?` +
      `latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
      `&hourly=precipitation_probability,weather_code` +
      `&timezone=Europe/Brussels` +
      `&forecast_days=1`
    );

    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData = await weatherResponse.json();
    const current = weatherData.current;
    const hourly = weatherData.hourly;

    // Get rain probability for next hour
    const rainProbability = hourly.precipitation_probability?.[0] || 0;

    // Convert WMO weather code to description and icon
    const weatherInfo = getWeatherInfo(current.weather_code);

    // Check for severe weather (simplified - no real-time alerts from Open-Meteo free tier)
    const alerts = checkSevereWeather(current, weatherInfo);

    const responseData: WeatherData = {
      location,
      temp: Math.round(current.temperature_2m),
      feels_like: Math.round(current.apparent_temperature),
      description: weatherInfo.description,
      icon: weatherInfo.icon,
      humidity: current.relative_humidity_2m,
      wind_speed: Math.round(current.wind_speed_10m),
      rain_probability: rainProbability,
      alerts,
    };

    return { data: responseData, status: 200 };
  } catch (error) {
    console.error('Weather API error:', error);
    return { error: 'Failed to fetch weather data', status: 500 };
  }
}

// Convert WMO Weather interpretation codes to descriptions and icons
// https://open-meteo.com/en/docs
function getWeatherInfo(code: number): { description: string; icon: string } {
  const weatherCodes: Record<number, { description: string; icon: string }> = {
    0: { description: 'Helder', icon: '01d' },
    1: { description: 'Overwegend helder', icon: '02d' },
    2: { description: 'Gedeeltelijk bewolkt', icon: '03d' },
    3: { description: 'Bewolkt', icon: '04d' },
    45: { description: 'Mist', icon: '50d' },
    48: { description: 'Mist met rijp', icon: '50d' },
    51: { description: 'Lichte motregen', icon: '09d' },
    53: { description: 'Motregen', icon: '09d' },
    55: { description: 'Zware motregen', icon: '09d' },
    61: { description: 'Lichte regen', icon: '10d' },
    63: { description: 'Regen', icon: '10d' },
    65: { description: 'Hevige regen', icon: '10d' },
    71: { description: 'Lichte sneeuw', icon: '13d' },
    73: { description: 'Sneeuw', icon: '13d' },
    75: { description: 'Hevige sneeuw', icon: '13d' },
    77: { description: 'Sneeuwvlokken', icon: '13d' },
    80: { description: 'Lichte buien', icon: '09d' },
    81: { description: 'Buien', icon: '09d' },
    82: { description: 'Hevige buien', icon: '09d' },
    85: { description: 'Lichte sneeuwbuien', icon: '13d' },
    86: { description: 'Sneeuwbuien', icon: '13d' },
    95: { description: 'Onweer', icon: '11d' },
    96: { description: 'Onweer met hagel', icon: '11d' },
    99: { description: 'Zwaar onweer met hagel', icon: '11d' },
  };

  return weatherCodes[code] || { description: 'Onbekend', icon: '01d' };
}

// Check for severe weather conditions
function checkSevereWeather(current: any, weatherInfo: any): Array<{
  event: string;
  description: string;
  severity: string;
}> {
  const alerts: Array<{ event: string; description: string; severity: string }> = [];

  // Heavy rain warning
  if (current.precipitation > 10) {
    alerts.push({
      event: 'Hevige neerslag',
      description: 'Verwacht hevige regenval. Wees voorzichtig op de weg.',
      severity: 'warning',
    });
  }

  // Storm warning
  if (current.wind_speed_10m > 60) {
    alerts.push({
      event: 'Storm',
      description: 'Harde wind verwacht. Rijd voorzichtig!',
      severity: 'severe',
    });
  } else if (current.wind_speed_10m > 40) {
    alerts.push({
      event: 'Harde wind',
      description: 'Stevige wind. Let op zijwind.',
      severity: 'warning',
    });
  }

  // Thunderstorm warning
  if (current.weather_code >= 95) {
    alerts.push({
      event: 'Onweer',
      description: 'Onweer in de buurt. Blijf veilig!',
      severity: 'severe',
    });
  }

  return alerts;
}

