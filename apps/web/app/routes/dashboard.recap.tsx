import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { useState, useMemo } from 'react';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { createRequestLogger } from '~/lib/logger.server';

// Moto quotes - used on poster AND recap page
const MOTO_QUOTES = [
  {
    lines: [
      '"Vrijheid is de wind langst uwen helm,',
    ],
    finalLine: 'en de wég die alsan ma verder goat."'
  },
  {
    lines: [
      '"Gien bestemminge, alliene bochten',
    ],
    finalLine: 'ent bulderlachen van de moteur."'
  },
  {
    lines: [
      '"Rijjen es oassemen,',
    ],
    finalLine: "mee t'landschap als ui longen.\""
  },
  {
    lines: [
      '"De schuunste kilometers',
    ],
    finalLine: 'zijn die da ge vergeet te tellen."'
  },
  {
    lines: [
      "Gas open, t'koppeke leeg,",
    ],
    finalLine: 'pertang vol vrijheid."'
  },
  {
    lines: [
      '"De weg geefdui vrijheid,',
    ],
    finalLine: 'de motto geefdui stilte."'
  },
  {
    lines: [
      '"Soms es de beste route',
    ],
    finalLine: 'den omweg die ui doe glimlache."'
  },
  {
    lines: [
      '"Genieten es gien tempo,',
    ],
    finalLine: 'da is ee gevoel."'
  },
  {
    lines: [
      '"Op twee wielen',
    ],
    finalLine: 'est elken dag spelen op de koer."'
  },
  {
    lines: [
      '"Als de zonne piekt,',
    ],
    finalLine: 'droaiek de boane op"'
  },
];

export const meta: MetaFunction = () => {
  return [{ title: 'Jouw Tijdcapsule - Deur Den Bocht' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);

  await requestLogger.info('page-view', 'Dashboard recap loaded');

  const user = await getUser(request);
  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  const rallyZones = await sanityClient.fetch(`
    *[_type == "rallyZone"] | order(order asc) {
      _id,
      title
    }
  `);

  const zoneNameById = new Map((rallyZones || []).map((zone: any) => [zone._id, zone.title]));

  const { data: checkIns } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('zone_id, checked_in_at')
    .eq('participant_id', user.id)
    .order('checked_in_at', { ascending: true });

  const { data: challenges } = await supabaseAdmin
    .from('route_challenge_submissions')
    .select('zone_id, challenge_type, points_awarded, is_correct, submitted_at')
    .eq('participant_id', user.id)
    .order('submitted_at', { ascending: false });

  const { data: photos } = await supabaseAdmin
    .from('participant_photos')
    .select('id, image_url, uploaded_at, zone_id')
    .eq('participant_id', user.id)
    .order('uploaded_at', { ascending: false })
    .limit(9);

  const totalZones = new Set((checkIns || []).map((ci: any) => ci.zone_id)).size;
  const totalChallenges = challenges?.length || 0;
  const totalPoints = (challenges || []).reduce((sum: number, c: any) => sum + (c.points_awarded || 0), 0);
  const correctChallenges = (challenges || []).filter((c: any) => c.is_correct).length;

  const timeline = (checkIns || []).map((ci: any) => ({
    zoneName: zoneNameById.get(ci.zone_id) || 'Zone',
    timestamp: ci.checked_in_at,
  }));

  return {
    user,
    totalZones,
    totalChallenges,
    totalPoints,
    correctChallenges,
    timeline,
    photos: photos || [],
  };
}

export default function DashboardRecap() {
  const { user, totalZones, totalChallenges, totalPoints, correctChallenges, timeline, photos } = useLoaderData<typeof loader>();
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Get random quote for display
  const randomQuote = useMemo(() => {
    return MOTO_QUOTES[Math.floor(Math.random() * MOTO_QUOTES.length)];
  }, []);

  const generateShareImage = (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No canvas context'));

      const randomQuote = MOTO_QUOTES[Math.floor(Math.random() * MOTO_QUOTES.length)];

      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
      gradient.addColorStop(0, '#4338ca'); // indigo-700
      gradient.addColorStop(0.5, '#9333ea'); // purple-600
      gradient.addColorStop(1, '#ec4899'); // pink-500
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // Title
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DEUR DEN BOCHT', 540, 180);

      // User name
      ctx.fillStyle = 'white';
      ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${user.first_name} ${user.last_name}`, 540, 280);

      // Subtitle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '32px system-ui, -apple-system, sans-serif';
      ctx.fillText('Mijn 2026 Recap', 540, 340);

      // Quote
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = 'italic 30px system-ui, -apple-system, sans-serif';
      let quoteY = 420;
      randomQuote.lines.forEach(line => {
        ctx.fillText(line, 540, quoteY);
        quoteY += 40;
      });
      ctx.font = 'italic bold 34px system-ui, -apple-system, sans-serif';
      ctx.fillText(randomQuote.finalLine, 540, quoteY + 10);

      // Stats cards in 2x2 grid (2 per row)
      const statsStartY = quoteY + 100;
      const cardWidth = 360;
      const cardHeight = 160;
      const cardGapX = 40;
      const cardGapY = 30;
      const gridStartX = (1080 - (cardWidth * 2 + cardGapX)) / 2;
      
      const stats = [
        { label: 'Zones bezocht', value: totalZones.toString(), row: 0, col: 0 },
        { label: 'Challenges gedaan', value: totalChallenges.toString(), row: 0, col: 1 },
        { label: 'Punten gescoord', value: totalPoints.toString(), row: 1, col: 0 },
        { label: 'Correcte challenges', value: correctChallenges.toString(), row: 1, col: 1 },
      ];

      stats.forEach(stat => {
        const x = gridStartX + stat.col * (cardWidth + cardGapX);
        const y = statsStartY + stat.row * (cardHeight + cardGapY);
        
        // Card background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(x, y, cardWidth, cardHeight);

        // Value
        ctx.fillStyle = 'white';
        ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(stat.value, x + cardWidth / 2, y + 75);

        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '28px system-ui, -apple-system, sans-serif';
        ctx.fillText(stat.label, x + cardWidth / 2, y + 115);
      });

      const photosStartY = statsStartY + (cardHeight * 2) + cardGapY + 80;

      // Load and draw photos (max 6 photos in 3x2 grid)
      if (photos.length > 0) {
        const photosToShow = photos.slice(0, 6);
        const photoSize = 200;
        const photoGap = 20;
        const photosPerRow = 3;
        const totalWidth = photosPerRow * photoSize + (photosPerRow - 1) * photoGap;
        const photoStartX = (1080 - totalWidth) / 2;

        // Label above photos
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Mijn momenten', 540, photosStartY - 30);

        try {
          // Load all images
          const imagePromises = photosToShow.map((photo: any) => {
            return new Promise<HTMLImageElement>((resolveImg, rejectImg) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolveImg(img);
              img.onerror = () => rejectImg(new Error(`Failed to load image: ${photo.image_url}`));
              img.src = photo.image_url;
            });
          });

          const loadedImages = await Promise.all(imagePromises);

          // Draw images in grid
          loadedImages.forEach((img, index) => {
            const col = index % photosPerRow;
            const row = Math.floor(index / photosPerRow);
            const x = photoStartX + col * (photoSize + photoGap);
            const y = photosStartY + row * (photoSize + photoGap);

            // Draw image with cover fitting
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, photoSize, photoSize);
            ctx.clip();

            const scale = Math.max(photoSize / img.width, photoSize / img.height);
            const scaledW = img.width * scale;
            const scaledH = img.height * scale;
            const offsetX = (photoSize - scaledW) / 2;
            const offsetY = (photoSize - scaledH) / 2;

            ctx.drawImage(img, x + offsetX, y + offsetY, scaledW, scaledH);
            ctx.restore();

            // Border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, photoSize, photoSize);
          });
        } catch (err) {
          console.error('Error loading photos for poster:', err);
          // Continue without photos
        }
      }

      // Footer positioning (dynamic based on photos)
      const footerStartY = photos.length > 0 
        ? photosStartY + (Math.ceil(Math.min(photos.length, 6) / 3) * 220) + 60
        : photosStartY + 60;

      // Footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'italic 26px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Legendes voor het leven', 540, footerStartY);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'italic 26px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Merci voor mee te doen', 540, footerStartY + 32);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'italic 26px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VZW DdB', 540, footerStartY + 64);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not generate image'));
      }, 'image/png');
    });
  };

  const handleShare = async () => {
    setShareStatus('idle');
    
    try {
      const imageBlob = await generateShareImage();
      const file = new File([imageBlob], 'deur-den-bocht-recap.png', { type: 'image/png' });

      // Check if mobile/touch device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                      ('ontouchstart' in window);

      // Only try share API on mobile devices
      if (isMobile && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Mijn Deur Den Bocht Recap',
          text: `🏍️ ${totalZones} zones, ${totalChallenges} challenges, ${totalPoints} punten!`,
          files: [file],
        });
        setShareStatus('success');
      } else {
        // Desktop: always download
        const url = URL.createObjectURL(imageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'deur-den-bocht-recap.png';
        a.click();
        URL.revokeObjectURL(url);
        setShareStatus('success');
      }
      
      setTimeout(() => setShareStatus('idle'), 3000);
    } catch (err) {
      console.error('Share error:', err);
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-500 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-white/80">Tijdcapsule</p>
            <h1 className="text-4xl md:text-5xl font-bold mt-2">Jouw dag in 60 seconden</h1>
            <p className="text-white/90 mt-3 text-lg">
              Een persoonlijke recap van {user.first_name}. De vibe, de route, de momenten.
            </p>
            <Link
              to="/dashboard"
              className="mt-6 inline-flex items-center gap-2 bg-white text-purple-700 hover:bg-white/90 px-4 py-2 rounded-sm font-semibold transition-colors"
            >
              Terug naar dashboard
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white rounded-sm shadow p-6">
            <p className="text-sm text-gray-500">Zones bezocht</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{totalZones}</p>
          </div>
          <div className="bg-white rounded-sm shadow p-6">
            <p className="text-sm text-gray-500">Challenges gedaan</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">{totalChallenges}</p>
          </div>
          <div className="bg-white rounded-sm shadow p-6">
            <p className="text-sm text-gray-500">Punten gescoord</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">{totalPoints}</p>
          </div>
          <div className="bg-white rounded-sm shadow p-6">
            <p className="text-sm text-gray-500">Correcte challenges</p>
            <p className="text-3xl font-bold text-pink-600 mt-2">{correctChallenges}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-sm shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Jouw timeline</h2>
            <div className="space-y-4">
              {timeline.length === 0 && (
                <p className="text-gray-500 text-sm">Nog geen check-ins. Maak er straks een verhaal van!</p>
              )}
              {timeline.map((item: any, index: number) => (
                <div key={`${item.zoneName}-${index}`} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Icon name="map-pin" className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.zoneName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 rounded-sm shadow-xl p-6 text-white">
            <h2 className="text-xl font-bold">Momenten om te delen</h2>
            <p className="text-sm text-slate-200 mt-2">
              Deel je topmomenten met je crew en inspireer de volgende bocht.
            </p>
            
            {/* Random Moto Quote */}
            <div className="mt-6 pt-6 border-t border-slate-600">
              <p className="italic text-lg leading-relaxed text-slate-100 mb-2">
                {randomQuote.lines.map(line => line).join(' ')}
                <br />
                <span className="font-semibold">{randomQuote.finalLine}</span>
              </p>
            </div>
            
            <button
              onClick={handleShare}
              className="mt-6 w-full px-4 py-2 bg-white text-slate-900 rounded-sm font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
              type="button"
            >
              <Icon name="download" className="w-4 h-4" />
              {shareStatus === 'success' ? '✓ Opgeslagen!' : shareStatus === 'error' ? 'Fout opgetreden' : 'Download poster'}
            </button>
            <p className="text-xs text-slate-300 mt-2">
              {shareStatus === 'success' ? 'Poster gedownload! Deel op je socials 📸' : 'Download een poster met jouw stats om te delen'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-sm shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Fotomomenten</h2>
          {photos.length === 0 ? (
            <p className="text-gray-500 text-sm">Nog geen foto’s geupload. Tijd om die legendes vast te leggen.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo: any) => (
                <div key={photo.id} className="rounded-sm overflow-hidden bg-gray-100">
                  <img src={photo.image_url} alt="Moment" className="w-full h-40 object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
