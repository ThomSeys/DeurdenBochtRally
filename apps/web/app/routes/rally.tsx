import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { getUser } from '~/lib/session.server';
import { getRallyZones, getPageContent, getImageUrl } from '~/lib/sanity.server';
import { PortableText } from '@portabletext/react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Rally Zones - Deur Den Bocht' },
    { name: 'description', content: 'Ontdek alle rally zones en instructies voor de Deur Den Bocht rally.' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  
  if (!user) {
    return redirect('/login');
  }

  const hasEarlyAccess = user.allow_early_access ?? false;

  const [rallyZones, howItWorksContent] = await Promise.all([
    getRallyZones().catch(() => []),
    getPageContent('rally').catch(() => []),
  ]);

  // Process image URLs on the server
  const rallyZonesWithUrls = rallyZones.map(zone => {
    if (!zone || !zone.image) return zone;
    return {
      ...zone,
      imageUrl: getImageUrl(zone.image, 800)
    };
  });

  return json({ user, rallyZones: rallyZonesWithUrls, howItWorksContent, hasEarlyAccess });
}

export default function Rally() {
  const { user, rallyZones, howItWorksContent, hasEarlyAccess } = useLoaderData<typeof loader>();

  if (!hasEarlyAccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={user} />
        <main className="flex-1 flex items-center justify-center">
          <div className="container-custom text-center py-16">
            <div className="card max-w-2xl mx-auto">
              <span className="text-6xl mb-4 block">🔒</span>
              <h1 className="text-4xl font-display font-bold mb-4">Rally Zones - Binnenkort Beschikbaar</h1>
              <p className="text-xl text-gray-700 mb-6">
                De rally zones worden beschikbaar op <strong>1 februari 2026</strong>.
              </p>
              <p className="text-gray-600">
                Houd je dashboard in de gaten voor updates!
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const useableHowItWorksContent = howItWorksContent.filter(c => c !== null);

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary-600 text-white py-16">
          <div className="container-custom">
            <h1 className="text-5xl font-display font-bold mb-4">Rally Zones</h1>
            <p className="text-xl text-primary-100">
              Ontdek alle zones en bereid je voor op de ultimate rally ervaring
            </p>
          </div>
        </section>

        {/* How it works */}
        {howItWorksContent && howItWorksContent.length > 0 && (
          <section className="section">
            <div className="container-custom">
              <div className="card max-w-4xl mx-auto">
                <h2 className="text-3xl font-display font-bold mb-6">{useableHowItWorksContent.find(c => c.section === 'how-it-works-intro')?.title || 'Hoe werkt het?'}</h2>
                {useableHowItWorksContent.find(c => c.section === 'how-it-works-intro')?.content && (
                  <div className="prose prose-lg max-w-none">
                    <PortableText value={useableHowItWorksContent.find(c => c.section === 'how-it-works-intro')!.content} />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Rally Zones */}
        <section className="section bg-gray-100">
          <div className="container-custom">
            <h2 className="text-4xl font-display font-bold mb-8 text-center">De Rally Zones</h2>
            
            <div className="grid grid-cols-1 gap-6">
              {rallyZones.length > 0 ? (
                rallyZones.filter((z) => z !== null).map((zone) => {
                  const zoneWithImage = zone as typeof zone & { imageUrl?: string };
                  const colorClasses: Record<string, string> = {
                    green: 'border-l-4 border-green-500 bg-green-50',
                    yellow: 'border-l-4 border-yellow-500 bg-yellow-50',
                    orange: 'border-l-4 border-orange-500 bg-orange-50',
                    red: 'border-l-4 border-red-500 bg-red-50',
                  };
                  
                  return (
                    <div 
                      key={zone._id} 
                      className={`card hover:shadow-xl transition-shadow ${colorClasses[zone.color] || 'border-l-4 border-gray-500'}`}
                    >
                      {zoneWithImage.imageUrl && (
                        <img 
                          src={zoneWithImage.imageUrl} 
                          alt={zone.checkpoint ? `Afbeelding van ${zone.checkpoint}` : 'Rally Zone afbeelding'}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      )}
                      <div className="mb-3">
                        <h3 className="text-2xl font-display font-bold">{zone.title}</h3>
                        <p className="text-sm text-gray-600">{zone.location}</p>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <p className="text-gray-700">{zone.description}</p>
                        
                        <div className="text-sm space-y-4">
                          <p><strong>🚪 Exit:</strong> {zone.exit}</p>
                          <p><strong>🔄 Lus:</strong> {zone.lus}</p>
                          <p><strong>📍 Checkpoint:</strong> {zone.checkpoint}</p>
                          <p><strong>💡 Hint:</strong> {zone.codeHint}</p>
                          <p><strong>↩️ Terug:</strong> {zone.rejoin}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200">
                        <span className="font-bold text-primary-600">
                          {zone.points} punten
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-xl text-gray-600">Er zijn nog geen rally zones toegevoegd.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Important Info */}
        <section className="section">
          <div className="container-custom">
            <div className="card bg-yellow-50 border-2 border-yellow-400 max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold mb-4 flex items-center">
                <span className="text-3xl mr-3">⚡</span>
                Belangrijke Rally Informatie
              </h3>
              <ul className="space-y-3 text-gray-800">
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span><strong>Start:</strong> 10:00 uur stipt - zorg dat je op tijd bent!</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span><strong>Zones:</strong> Bezoek alle zones in willekeurige volgorde</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span><strong>Foto's:</strong> Maak foto's bij elke zone om punten te verdienen</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span><strong>Veiligheid:</strong> Volg alle verkeersregels en rij veilig!</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span><strong>WhatsApp:</strong> Join de WhatsApp groep voor live updates</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
