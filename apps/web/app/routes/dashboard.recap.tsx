import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { useState, useMemo, useEffect } from 'react';
import { useHaptics } from '~/lib/haptics';
import { useModal } from '~/contexts/ModalContext';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { createRequestLogger } from '~/lib/logger.server';
import { Lightbox } from '~/components/Lightbox';

// Moto quotes - used on poster AND recap page
const MOTO_QUOTES = [
  {
    lines: [
      '"Vrijheid es de wind langst uiwen elme,',
    ],
    finalLine: 'en de boane die alsan ma verder luupt."'
  },
  {
    lines: [
      '"Gien bestemminge, alliene bochten',
    ],
    finalLine: 'ent bulderlachen van de moteur."'
  },
  {
    lines: [
      '"Rijjen es lijk oassemen,',
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
      '"Op twie wiele',
    ],
    finalLine: 'est elken dag spelen op de koer."'
  },
  {
    lines: [
      '"Als de zonne piekt,',
    ],
    finalLine: 'droaiek mijne gas open"'
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
  // Determine badges based on available metrics and pick a single best badge
  const photosCount = (photos || []).length;
  const candidates: Array<{ key: string; name: string; emoji: string }> = [];

  if (totalZones >= 6 && totalChallenges >= 6) {
    candidates.push({ key: 'discoverer', name: 'De Ontdekker', emoji: '🧭' });
  }

  if (totalZones >= 6 && correctChallenges >= 4) {
    candidates.push({ key: 'adventurer', name: 'De Avonturier', emoji: '🗺️' });
  }

  if (totalZones <= 3 && totalPoints >= 50) {
    candidates.push({ key: 'doorzetter', name: 'De Doorzetter', emoji: '💪' });
  }

  if (photosCount >= 3 && totalChallenges <= 3) {
    candidates.push({ key: 'genieter', name: 'De Genieter', emoji: '🌿' });
  }

  if (totalZones <= 2 && photosCount <= 2) {
    candidates.push({ key: 'rechte_lijn', name: 'De Rechte Lijn', emoji: '➡️' });
  }
  // Priority order for single badge selection
  const priority = ['discoverer', 'adventurer', 'doorzetter', 'genieter', 'rechte_lijn'];
  // Promote hazepad badge slightly lower than adventurer
  const priorityWithHazepads = ['discoverer', 'adventurer', 'hurry_hare', 'doorzetter', 'genieter', 'rechte_lijn'];
  let bestBadge: { key: string; name: string; emoji: string } | null = null;
  for (const key of priorityWithHazepads) {
    const found = candidates.find(c => c.key === key);
    if (found) { bestBadge = found; break; }
  }

  const timeline = (checkIns || []).map((ci: any) => ({
    zoneName: zoneNameById.get(ci.zone_id) || 'Zone',
    timestamp: ci.checked_in_at,
  }));

  // Hazepaden: derive from zone check-ins (authoritative source)
  const { data: hazepadSubs } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('zone_id, took_skip_route')
    .eq('participant_id', user.id)
    .eq('took_skip_route', true);

  const hazepadsSelected = hazepadSubs ? new Set(hazepadSubs.map((s: any) => s.zone_id).filter(Boolean)).size : 0;
  const hazepadZoneNames = (hazepadSubs || [])
    .map((s: any) => zoneNameById.get(s.zone_id) || null)
    .filter(Boolean) as string[];



  // Badge for choosing multiple hazepads (skip-route choices)
  if (hazepadsSelected >= 3) {
    candidates.push({ key: 'hurry_hare', name: 'Hurry Hare', emoji: '🐇' });
  }


    return {
      user,
      totalZones,
      totalChallenges,
      totalPoints,
      correctChallenges,
      timeline,
      photos: photos || [],
      bestBadge,
      hazepadsSelected,
      hazepadZoneNames,
    };
}

export default function DashboardRecap() {
  const { user, totalZones, totalChallenges, totalPoints, correctChallenges, timeline, photos, bestBadge, hazepadsSelected, hazepadZoneNames } = useLoaderData<typeof loader>();
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

      // Precompute layout to ensure everything fits; apply global scale if needed
      const layoutBadgeSize = 130;
      const cardWidth = 360;
      const cardHeight = 160;
      const cardGapX = 40;
      const cardGapY = 30;

      const hazepadsToDraw = (typeof (window as any).__RECAP_HAZEPADS_COUNT__ !== 'undefined')
        ? (window as any).__RECAP_HAZEPADS_COUNT__
        : (typeof hazepadsSelected !== 'undefined' ? hazepadsSelected : 0);

      const stats = [
        { label: 'Zones bezocht', value: totalZones.toString() },
        { label: 'Challenges gedaan', value: totalChallenges.toString() },
        { label: 'Punten gescoord', value: totalPoints.toString() },
        { label: 'Correcte challenges', value: correctChallenges.toString() },
        { label: 'Hazepaden gekozen', value: hazepadsToDraw.toString() },
      ];

      const cols = 2;
      const rows = Math.ceil(stats.length / cols);

      // estimate vertical positions used by different sections (match draw logic)
      const quoteStartY = 420;
      const quoteLinesHeight = (randomQuote.lines || []).length * 40;
      const quoteLoopEnd = quoteStartY + quoteLinesHeight; // matches quoteY after loop
      const badgeTop = quoteLoopEnd + (bestBadge ? 80 : 0);
      const badgeBottom = badgeTop + (bestBadge ? (layoutBadgeSize + 52) : 0);
      const statsStartY = quoteLoopEnd + 100 + (bestBadge ? (layoutBadgeSize + 120) : 0);
      // Photos layout: allow up to 9 images and compute size so they fit
      const photosToShowCount = Math.min((photos || []).length, 9);
      const photosPerRow = photosToShowCount >= 3 ? 3 : (photosToShowCount || 1);
      const photoGap = 20;
      const photoContainerPadding = 120; // left+right total padding
      const photoContainerWidth = 1080 - photoContainerPadding;
      const photoSize = Math.max(100, Math.min(200, Math.floor((photoContainerWidth - (photosPerRow - 1) * photoGap) / photosPerRow)));
      const photoRows = photosToShowCount > 0 ? Math.ceil(photosToShowCount / photosPerRow) : 0;
      const photosStartY = statsStartY + (cardHeight * rows) + cardGapY + 80;
      const footerStartY = photosToShowCount > 0
        ? photosStartY + (photoRows * (photoSize + photoGap)) + 60
        : photosStartY + 60;
      const footerEndY = footerStartY + 100;

      const requiredHeight = footerEndY + 20;
      const scale = Math.min(1, canvas.height / requiredHeight);
      if (scale < 1) {
        ctx.scale(scale, scale);
      }

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

      // Draw single best badge (SVG) centered under the quote
      // Slightly larger badge with added spacing, shadow and ring to emphasize "badge"
      if (bestBadge) {
        const badgeSize = layoutBadgeSize;
        const badgesY = quoteY + 80; // more space under the quote (extra top spacing for badge)
        const badgeX = (1080 - badgeSize) / 2;

        // Subtle shadow for depth
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 6;

        // Circle background behind badge (slightly larger to show the ring)
        ctx.beginPath();
        ctx.arc(540, badgesY + badgeSize / 2, badgeSize / 2 + 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fill();
        ctx.restore();

        // Outer ring
        ctx.beginPath();
        ctx.arc(540, badgesY + badgeSize / 2, badgeSize / 2 + 6, 0, Math.PI * 2);
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.stroke();

        try {
          const img: HTMLImageElement = await new Promise((resolveImg, rejectImg) => {
            const i = new Image();
            i.crossOrigin = 'anonymous';
            i.onload = () => resolveImg(i);
            i.onerror = () => rejectImg(new Error('Failed to load badge image'));
            i.src = `/badges/${bestBadge.key}.svg`;
          });

          // Draw the badge slightly inset so the ring remains visible
          const inset = 8;
          ctx.drawImage(img, badgeX + inset, badgesY + inset, badgeSize - inset * 2, badgeSize - inset * 2);

          // Small uppercase indicator and name below to make it explicit
          ctx.font = '14px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.textAlign = 'center';
          ctx.fillText('BADGE', 540, badgesY + badgeSize + 30);

          ctx.font = '20px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.fillText(bestBadge.name, 540, badgesY + badgeSize + 52);
        } catch (err) {
          console.error('Error loading badge SVG:', err);
        }
      }

        // Stats cards in grid
        const gridStartX = (1080 - (cardWidth * 2 + cardGapX)) / 2;
      
          stats.forEach((stat, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const x = gridStartX + col * (cardWidth + cardGapX);
            const y = statsStartY + row * (cardHeight + cardGapY);

            // Card background with rounded corners and subtle gradient
            const radius = 12;
            ctx.save();
            const grad = ctx.createLinearGradient(x, y, x, y + cardHeight);
            grad.addColorStop(0, 'rgba(255,255,255,0.18)');
            grad.addColorStop(1, 'rgba(255,255,255,0.08)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + cardWidth - radius, y);
            ctx.quadraticCurveTo(x + cardWidth, y, x + cardWidth, y + radius);
            ctx.lineTo(x + cardWidth, y + cardHeight - radius);
            ctx.quadraticCurveTo(x + cardWidth, y + cardHeight, x + cardWidth - radius, y + cardHeight);
            ctx.lineTo(x + radius, y + cardHeight);
            ctx.quadraticCurveTo(x, y + cardHeight, x, y + cardHeight - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

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

      // photosStartY was precomputed above to ensure consistent layout

      // Load and draw photos (max 6 photos in 3x2 grid)
      if (photos.length > 0) {
        const photosToShow = photos.slice(0, photosToShowCount);
        const photosPerRowLocal = photosPerRow;
        const totalWidth = photosPerRowLocal * photoSize + (photosPerRowLocal - 1) * photoGap;
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

      // (Hazepads are now integrated into the stats grid above)

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

      // Footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'italic 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Legendes voor het leven', canvas.width / 2, canvas.height - 120);
      ctx.fillText('Merci voor mee te doen', canvas.width / 2, canvas.height - 92);
      ctx.fillText('VZW DdB', canvas.width / 2, canvas.height - 64);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not generate image'));
      }, 'image/png');
    });
  };

  // Generate a photos-only poster (larger grid) and return a Blob
  const generatePhotosPoster = (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No canvas context'));

      // simple gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#4338ca');
      gradient.addColorStop(1, '#ec4899');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header (title + user name)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DEUR DEN BOCHT', canvas.width / 2, 120);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${user.first_name} ${user.last_name}`, canvas.width / 2, 200);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '24px system-ui, -apple-system, sans-serif';
      ctx.fillText('Mijn 2026 Recap', canvas.width / 2, 240);

      // Photos grid - reuse precomputed photoSize from above logic, but reserve footer space
      const photosToShowCount = Math.min((photos || []).length, 9);
      const photosPerRow = photosToShowCount >= 3 ? 3 : (photosToShowCount || 1);
      const photoGap = 20;
      const photoContainerPadding = 80; // narrower padding to allow larger photos
      const photoContainerWidth = canvas.width - photoContainerPadding;
      let photoSize = Math.max(120, Math.min(420, Math.floor((photoContainerWidth - (photosPerRow - 1) * photoGap) / photosPerRow)));

      // layout positions
      let startY = 320; // place grid below header

      // Reserve footer height to avoid overlap
      const footerHeight = 160; // space for footer texts
      const footerY = canvas.height - footerHeight;

      const rowsNeeded = photosToShowCount > 0 ? Math.ceil(photosToShowCount / photosPerRow) : 0;
      if (rowsNeeded > 0) {
        const maxGridHeight = Math.max(0, footerY - startY - 24); // small padding above footer
        const maxPhotoSizeByHeight = Math.floor((maxGridHeight - (rowsNeeded - 1) * photoGap) / rowsNeeded);
        if (maxPhotoSizeByHeight > 0) {
          photoSize = Math.min(photoSize, maxPhotoSizeByHeight);
        }
        // enforce minimum so images don't disappear
        photoSize = Math.max(80, photoSize);
      }

      const totalWidth = photosPerRow * photoSize + (photosPerRow - 1) * photoGap;
      const startX = (canvas.width - totalWidth) / 2;

      try {
        const photosToShow = photos.slice(0, photosToShowCount);
        const imagePromises = photosToShow.map((p: any) => {
          return new Promise<HTMLImageElement>((resolveImg, rejectImg) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolveImg(img);
            img.onerror = () => rejectImg(new Error('Failed to load image'));
            img.src = p.image_url;
          });
        });

        const loaded = await Promise.all(imagePromises);
        loaded.forEach((img, index) => {
          const col = index % photosPerRow;
          const row = Math.floor(index / photosPerRow);
          const x = startX + col * (photoSize + photoGap);
          const y = startY + row * (photoSize + photoGap);

          // cover-fit with rounded corners and subtle border
          const scale = Math.max(photoSize / img.width, photoSize / img.height);
          const scaledW = img.width * scale;
          const scaledH = img.height * scale;
          const offsetX = (photoSize - scaledW) / 2;
          const offsetY = (photoSize - scaledH) / 2;

          // rounded clip
          const radius = 10;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + photoSize - radius, y);
          ctx.quadraticCurveTo(x + photoSize, y, x + photoSize, y + radius);
          ctx.lineTo(x + photoSize, y + photoSize - radius);
          ctx.quadraticCurveTo(x + photoSize, y + photoSize, x + photoSize - radius, y + photoSize);
          ctx.lineTo(x + radius, y + photoSize);
          ctx.quadraticCurveTo(x, y + photoSize, x, y + photoSize - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
          ctx.clip();

          ctx.drawImage(img, x + offsetX, y + offsetY, scaledW, scaledH);
          ctx.restore();

          // rounded border
          ctx.strokeStyle = 'rgba(255,255,255,0.66)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + photoSize - radius, y);
          ctx.quadraticCurveTo(x + photoSize, y, x + photoSize, y + radius);
          ctx.lineTo(x + photoSize, y + photoSize - radius);
          ctx.quadraticCurveTo(x + photoSize, y + photoSize, x + photoSize - radius, y + photoSize);
          ctx.lineTo(x + radius, y + photoSize);
          ctx.quadraticCurveTo(x, y + photoSize, x, y + photoSize - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
          ctx.stroke();
        });
      } catch (err) {
        console.error('Failed to build photos poster', err);
      }

      // Footer for photos poster
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'italic 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Legendes voor het leven', canvas.width / 2, canvas.height - 120);
      ctx.fillText('Merci voor mee te doen', canvas.width / 2, canvas.height - 92);
      ctx.fillText('VZW DdB', canvas.width / 2, canvas.height - 64);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not generate image'));
      }, 'image/png');
    });
  };

  // Generate a badge + quote poster (header + badge + quote + footer)
  const generateBadgePoster = (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No canvas context'));

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#4338ca');
      gradient.addColorStop(1, '#ec4899');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DEUR DEN BOCHT', canvas.width / 2, 140);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${user.first_name} ${user.last_name}`, canvas.width / 2, 220);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '24px system-ui, -apple-system, sans-serif';
      ctx.fillText('Mijn 2026 Recap', canvas.width / 2, 260);

      // Quote
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = 'italic 28px system-ui, -apple-system, sans-serif';
      const quote = randomQuote;
      let qy = 320;
      (quote.lines || []).forEach((l) => {
        ctx.fillText(l, canvas.width / 2, qy);
        qy += 36;
      });
      ctx.font = 'italic bold 30px system-ui, -apple-system, sans-serif';
      ctx.fillText(quote.finalLine, canvas.width / 2, qy + 6);

      // Badge area
      if (bestBadge) {
        try {
          const img: HTMLImageElement = await new Promise((res, rej) => {
            const i = new Image();
            i.crossOrigin = 'anonymous';
            i.onload = () => res(i);
            i.onerror = rej;
            i.src = `/badges/${bestBadge.key}.svg`;
          });
          const badgeSize = 400;
          const bx = (canvas.width - badgeSize) / 2;
          const by = qy + 200;
          ctx.beginPath();
          ctx.arc(canvas.width / 2, by + badgeSize / 2, badgeSize / 2 + 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fill();
          ctx.drawImage(img, bx + 8, by + 8, badgeSize - 16, badgeSize - 16);
          ctx.font = '32px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fillText('BADGE', canvas.width / 2, by + badgeSize + 60);
          ctx.font = '60px system-ui, -apple-system, sans-serif';
          ctx.fillText(bestBadge.name, canvas.width / 2, by + badgeSize + 120);
        } catch (e) {
          console.error('Badge load fail', e);
        }
      }

      // Footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'italic 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Legendes voor het leven', canvas.width / 2, canvas.height - 120);
      ctx.fillText('Merci voor mee te doen', canvas.width / 2, canvas.height - 92);
      ctx.fillText('VZW DdB', canvas.width / 2, canvas.height - 64);

      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No blob'))), 'image/png');
    });
  };

  // Generate a stats-only poster (header + stats grid + footer)
  const generateStatsPoster = (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No canvas context'));

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#4338ca');
      gradient.addColorStop(1, '#ec4899');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DEUR DEN BOCHT', canvas.width / 2, 140);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${user.first_name} ${user.last_name}`, canvas.width / 2, 220);

      // Stats grid
      const statsList = [
        { label: 'Zones bezocht', value: totalZones.toString() },
        { label: 'Challenges gedaan', value: totalChallenges.toString() },
        { label: 'Punten gescoord', value: totalPoints.toString() },
        { label: 'Correcte challenges', value: correctChallenges.toString() },
        { label: 'Hazepaden gekozen', value: (hazepadsSelected || 0).toString() },
      ];

      const cols = 2;
      const cardW = 420;
      const cardH = 180;
      const gap = 36;
      const totalW = cols * cardW + (cols - 1) * gap;
      const startX = (canvas.width - totalW) / 2;
      const startY = 320;

      statsList.forEach((s, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (cardW + gap);
        const y = startY + row * (cardH + gap);

        // rounded rect
        const r = 16;
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + cardW - r, y);
        ctx.quadraticCurveTo(x + cardW, y, x + cardW, y + r);
        ctx.lineTo(x + cardW, y + cardH - r);
        ctx.quadraticCurveTo(x + cardW, y + cardH, x + cardW - r, y + cardH);
        ctx.lineTo(x + r, y + cardH);
        ctx.quadraticCurveTo(x, y + cardH, x, y + cardH - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(s.value, x + cardW / 2, y + 78);

        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '24px system-ui, -apple-system, sans-serif';
        ctx.fillText(s.label, x + cardW / 2, y + 120);
      });

      // Footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'italic 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Legendes voor het leven', canvas.width / 2, canvas.height - 120);
      ctx.fillText('Merci voor mee te doen', canvas.width / 2, canvas.height - 92);
      ctx.fillText('VZW DdB', canvas.width / 2, canvas.height - 64);

      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No blob'))), 'image/png');
    });
  };

  // small wrapper component for modal lightbox that supports multiple urls
  function PosterLightbox({ urls, onClose }: { urls: string[]; onClose: () => void }) {
    const [idx, setIdx] = useState(0);
    const { tap } = useHaptics();

    const downloadCurrent = () => {
      tap();
      const a = document.createElement('a');
      a.href = urls[idx];
      a.download = `deur-den-bocht-poster-${idx + 1}.png`;
      a.click();
    };

    const shareCurrent = async () => {
      tap();
      try {
        const res = await fetch(urls[idx]);
        const blob = await res.blob();
        const file = new File([blob], `deur-den-bocht-poster-${idx + 1}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] }) && navigator.share) {
          await navigator.share({ files: [file], title: 'Mijn Deur Den Bocht Recap' });
          return;
        }
      } catch (e) {
        // fallback
      }
      downloadCurrent();
    };

    return (
      <Lightbox
        imageSrc={urls[idx]}
        showNav
        onPrev={() => setIdx((i) => (i - 1 + urls.length) % urls.length)}
        onNext={() => setIdx((i) => (i + 1) % urls.length)}
        overlays={
          // put icons inside the image wrapper so they're positioned relative to the image
          <div className="absolute right-6 bottom-6 z-50 flex gap-3 items-center">
            <button
              type="button"
              onClick={() => { tap(); shareCurrent(); }}
              aria-label="Share poster"
              title="Share"
              className="w-11 h-11 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md hover:scale-105 transition-transform"
            >
              <Icon name="share" className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => { tap(); downloadCurrent(); }}
              aria-label="Download poster"
              title="Download"
              className="w-11 h-11 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md hover:scale-105 transition-transform"
            >
              <Icon name="download" className="w-5 h-5" />
            </button>
          </div>
        }
        onClose={onClose}
      />
    );
  }

  const { openModal, closeModal } = useModal();

  const openPostersLightbox = async () => {
    // generate overview, badge, stats and photos posters and open PosterLightbox
    try {
      // Generate only badge, stats and photos posters (no combined overview poster)
      const [badgeBlob, statsBlob, photosBlob] = await Promise.all([
        generateBadgePoster(),
        generateStatsPoster(),
        generatePhotosPoster(),
      ]);

      const urls = [
        URL.createObjectURL(badgeBlob),
        URL.createObjectURL(statsBlob),
        URL.createObjectURL(photosBlob),
      ];

      let modalId: string;

      modalId = openModal({
        variant: 'lightbox',
        content: (
          <PosterLightbox
            urls={urls}
            onClose={() => {
              urls.forEach((u) => URL.revokeObjectURL(u));
              if (modalId) closeModal(modalId);
            }}
          />
        ),
        closeOnBackdrop: true,
      });
    } catch (err) {
      console.error('Failed to generate posters', err);
    }
  };

  const handleShare = async () => {
    setShareStatus('idle');
    
    try {
      // Use the badge poster for quick download/share instead of the combined overview
      const imageBlob = await generateBadgePoster();
      const file = new File([imageBlob], 'deur-den-bocht-badge.png', { type: 'image/png' });

      // Check if mobile/touch device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                      ('ontouchstart' in window);

      // Only try share API on mobile devices
      if (isMobile && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Mijn Deur Den Bocht Badge',
          text: `🏍️ ${user.first_name}'s badge — ${bestBadge?.name || ''}`,
          files: [file],
        });
        setShareStatus('success');
      } else {
        // Desktop: always download
        const url = URL.createObjectURL(imageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'deur-den-bocht-badge.png';
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
        <div className="grid md:grid-cols-5 gap-6">
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
          <div className="bg-white rounded-sm shadow p-6">
            <p className="text-sm text-gray-500">Hazepaden gekozen</p>
            <p className="text-3xl font-bold text-teal-600 mt-2">{hazepadsSelected}</p>
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
            
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={openPostersLightbox}
                className="flex-1 px-4 py-2 bg-white/10 text-white border border-white/20 rounded-sm font-semibold hover:bg-white/20 transition-colors"
                type="button"
              >
                <Icon name="image" className="w-4 h-4" />
                Bekijk posters
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              {shareStatus === 'success' ? 'Poster gedownload! Deel op je socials 📸' : 'Download een poster met jouw stats om te delen — of bekijk meerdere posters'}
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
