import { type MetaFunction } from 'react-router';
import Header from '~/components/Header';
import Footer from '~/components/Footer';

export const meta: MetaFunction = () => {
  return [
    { title: 'Cookieverklaring - Deur Den Bocht' },
    { name: 'description', content: 'Lees onze cookieverklaring en meer over hoe we cookies gebruiken' },
  ];
};

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Cookieverklaring</h1>

        <div className="bg-white rounded-sm shadow-sm p-8 space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Wat zijn cookies?</h2>
            <p>
              Cookies zijn kleine tekstbestanden die door websites op uw apparaat worden opgeslagen. Deze cookies helpen websites u beter 
              van dienst te zijn door uw voorkeur onthouden en uw browsingervaring te verbeteren. We gebruiken cookies op de volgende manieren:
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Soorten cookies die we gebruiken</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">🔒 Essentiële Cookies</h3>
                <p className="mb-2">
                  Deze cookies zijn noodzakelijk voor de werking van onze website. Ze worden gebruikt voor:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Authenticatie:</strong> Sessies en inloggegevens</li>
                  <li><strong>Beveiliging:</strong> CSRF-bescherming en verifiëring</li>
                  <li><strong>Functionaliteit:</strong> Site-wachtwoord en gebruikersvoorkeur</li>
                </ul>
                <p className="mt-2 text-sm text-gray-600">
                  <strong>Cookies:</strong> __Host-session, site-password
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">📊 Analytische Cookies</h3>
                <p className="mb-2">
                  Deze cookies helpen ons begrijpen hoe u onze website gebruikt zodat we deze kunnen verbeteren. Ze volgen:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Welke pagina's u bezoekt</li>
                  <li>Hoe lang u op pagina's blijft</li>
                  <li>Of u links klikt</li>
                  <li>Foutmeldingen die u tegenkomt</li>
                </ul>
                <p className="mt-2 text-sm text-gray-600">
                  <strong>Cookies:</strong> Google Analytics (_ga, _gid, _gat)
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">💾 Functionele Cookies</h3>
                <p className="mb-2">
                  Deze cookies onthouden uw keuzes en instellingen:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Cookie-goedkeuring status</li>
                  <li>Taalvoorkeuren</li>
                  <li>Weergaveinstellingen</li>
                </ul>
                <p className="mt-2 text-sm text-gray-600">
                  <strong>Cookies:</strong> cookie-consent, ui-preferences
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Hoe u cookies kunt beheren</h2>
            <p className="mb-4">
              U kunt cookies beheren en verwijderen door de instellingen van uw webbrowser aan te passen. 
              Hier zijn instructies voor populaire browsers:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>Chrome:</strong> Instellingen → Privacy en beveiliging → Cookies en sitegegevens</li>
              <li><strong>Firefox:</strong> Instellingen → Privacy en beveiliging → Cookies en sitegegevens</li>
              <li><strong>Safari:</strong> Voorkeuren → Privacy → Cookies beheren</li>
              <li><strong>Edge:</strong> Instellingen → Privacy en services → Cookies en sitetoestemmingen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Meldingen en push</h2>
            <p>
              Wanneer u zich aanmeldt voor pushberichten, onthouden we uw voorkeur met behulp van lokale opslag 
              en in onze database. Dit stelt ons in staat u belangrijk evenementgegevens te sturen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Gegevensbescherming</h2>
            <p>
              Alle persoonlijke gegevens die via cookies worden verzameld, worden verwerkt in overeenstemming met 
              de GDPR en onze privacybeleid. We geven uw gegevens nooit aan derden door zonder uw toestemming.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
            <p>
              Heeft u vragen over onze cookieverklaring? Neem contact met ons op via:
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded-sm">
              <p><strong>Email:</strong> info@deurdenbocht.be</p>
              <p><strong>Website:</strong> deurdenbocht.be</p>
            </div>
          </section>

          <section className="border-t-2 pt-6">
            <p className="text-sm text-gray-500">
              Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
