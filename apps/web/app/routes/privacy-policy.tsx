import { type MetaFunction } from 'react-router';
import Header from '~/components/Header';
import Footer from '~/components/Footer';

export const meta: MetaFunction = () => {
  return [
    { title: 'Privacybeleid - Deur Den Bocht' },
    { name: 'description', content: 'Privacybeleid en gegevensbescherming voor Deur Den Bocht' },
  ];
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacybeleid</h1>

        <div className="bg-white rounded-sm shadow-sm p-8 space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Inleiding</h2>
            <p>
              Deur Den Bocht ("wij", "ons") hecht veel waarde aan de bescherming van uw persoonsgegevens. 
              In dit privacybeleid leggen we uit welke gegevens we verzamelen, waarom we deze verzamelen, 
              hoe we deze gebruiken en welke rechten u heeft met betrekking tot uw gegevens.
            </p>
            <p className="mt-2">
              Dit privacybeleid is van toepassing op alle deelnemers van het Deur Den Bocht evenement 
              en bezoekers van onze website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Verantwoordelijke</h2>
            <div className="bg-gray-100 rounded-sm p-4">
              <p><strong>Deur Den Bocht</strong></p>
              <p>Email: vzwddb@gmail.com</p>
              <p>Website: deurdenbocht.be</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Welke gegevens verzamelen we?</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">3.1 Registratiegegevens</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Voornaam en achternaam</li>
              <li>E-mailadres</li>
              <li>Telefoonnummer</li>
              <li>Motorgegevens (merk, model, nummerplaat)</li>
              <li>Gekozen formule (met/zonder maaltijden)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">3.2 Betalingsgegevens</h3>
            <p>
              Betalingen worden verwerkt door Stripe. Wij ontvangen alleen een betalingsbevestiging, 
              geen volledige creditcardgegevens. Stripe verwerkt uw betaalgegevens volgens hun eigen privacybeleid.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">3.3 Locatiegegevens</h3>
            <p>
              Tijdens het evenement verzamelen we GPS-coördinaten wanneer u incheckt bij rally zones. 
              Deze gegevens worden gebruikt voor verificatie van uw rally deelname en scorebepaling.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">3.4 Foto's en Media</h3>
            <p>
              Als u foto's uploadt tijdens het evenement, worden deze opgeslagen met metadata zoals 
              locatie en tijdstip. Deze foto's kunnen worden gedeeld in de galerij op onze website.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">3.5 Cookies en Tracking</h3>
            <p>
              We gebruiken essentiële cookies voor authenticatie en functionaliteit. 
              Zie ons <a href="/cookie-policy" className="text-primary-600 hover:text-primary-700 underline">cookiebeleid</a> voor meer informatie.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Waarom verzamelen we deze gegevens?</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Registratie en deelname:</strong> Om uw registratie te verwerken en u toegang te geven tot het evenement</li>
              <li><strong>Betaling:</strong> Om uw betaling te verwerken via Stripe</li>
              <li><strong>Communicatie:</strong> Om u te informeren over het evenement, wijzigingen en belangrijke mededelingen</li>
              <li><strong>Rally scoring:</strong> Om uw deelname te verifiëren en scores bij te houden</li>
              <li><strong>Veiligheid:</strong> Voor noodgevallen en contactopname tijdens het evenement</li>
              <li><strong>Verbetering:</strong> Om onze diensten en het evenement te verbeteren</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Rechtsgrondslag (GDPR)</h2>
            <p>We verwerken uw gegevens op basis van:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li><strong>Uw toestemming</strong> (Art. 6(1)(a) GDPR) - U geeft expliciet toestemming bij registratie</li>
              <li><strong>Contractuele noodzaak</strong> (Art. 6(1)(b) GDPR) - Nodig voor uitvoering van uw deelname</li>
              <li><strong>Gerechtvaardigd belang</strong> (Art. 6(1)(f) GDPR) - Voor veiligheid en evenementorganisatie</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Hoe lang bewaren we uw gegevens?</h2>
            <p>
              <strong>Tijdens het evenement:</strong> Alle gegevens worden actief gebruikt.<br />
              <strong>Na het evenement:</strong> We bewaren uw gegevens maximaal 1 jaar na het evenement voor archiefdoeleinden, 
              klachtenafhandeling en toekomstige edities.<br />
              <strong>Na 1 jaar:</strong> Gegevens worden geanonimiseerd of verwijderd, tenzij u toestemming geeft voor langer bewaren.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Met wie delen we uw gegevens?</h2>
            <p>We delen uw gegevens alleen met:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li><strong>Stripe (Betalingsverwerker):</strong> Voor het verwerken van betalingen. 
                Stripe heeft eigen AVG-conforme verwerkersovereenkomsten.</li>
              <li><strong>Supabase (Database hosting):</strong> Onze database wordt gehost bij Supabase (EU servers). 
                Supabase is gecertificeerd volgens ISO 27001 en SOC 2 Type II.</li>
              <li><strong>Resend (E-mailservice):</strong> Voor het verzenden van bevestigingsmails en updates.</li>
              <li><strong>Nooddiensten:</strong> In geval van nood kunnen we uw contactgegevens delen met hulpdiensten.</li>
            </ul>
            <p className="mt-4">
              We verkopen uw gegevens <strong>nooit</strong> aan derden. We delen geen gegevens met marketingpartijen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Uw rechten onder de AVG/GDPR</h2>
            <p>U heeft de volgende rechten met betrekking tot uw persoonsgegevens:</p>
            
            <div className="space-y-3 mt-4">
              <div className="border-l-4 border-primary-600 pl-4">
                <h4 className="font-semibold">Recht op inzage (Art. 15)</h4>
                <p className="text-sm">U kunt opvragen welke gegevens we van u hebben.</p>
              </div>
              
              <div className="border-l-4 border-primary-600 pl-4">
                <h4 className="font-semibold">Recht op rectificatie (Art. 16)</h4>
                <p className="text-sm">U kunt onjuiste gegevens laten corrigeren.</p>
              </div>
              
              <div className="border-l-4 border-primary-600 pl-4">
                <h4 className="font-semibold">Recht op verwijdering/"Recht op vergetelheid" (Art. 17)</h4>
                <p className="text-sm">U kunt verwijdering van uw gegevens aanvragen.</p>
              </div>
              
              <div className="border-l-4 border-primary-600 pl-4">
                <h4 className="font-semibold">Recht op dataportabiliteit (Art. 20)</h4>
                <p className="text-sm">U kunt uw gegevens in een gestructureerd formaat opvragen.</p>
              </div>
              
              <div className="border-l-4 border-primary-600 pl-4">
                <h4 className="font-semibold">Recht op beperking (Art. 18)</h4>
                <p className="text-sm">U kunt verzoeken om beperking van de verwerking.</p>
              </div>
              
              <div className="border-l-4 border-primary-600 pl-4">
                <h4 className="font-semibold">Recht van bezwaar (Art. 21)</h4>
                <p className="text-sm">U kunt bezwaar maken tegen bepaalde verwerkingen.</p>
              </div>
            </div>

            <p className="mt-4">
              <strong>Hoe deze rechten uitoefenen?</strong><br />
              Stuur een e-mail naar <a href="mailto:vzwddb@gmail.com" className="text-primary-600 hover:text-primary-700 underline">vzwddb@gmail.com</a> met 
              uw verzoek. We reageren binnen 30 dagen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Beveiliging van uw gegevens</h2>
            <p>We nemen beveiliging serieus en implementeren de volgende maatregelen:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>HTTPS-versleuteling voor alle communicatie</li>
              <li>Veilige opslag van wachtwoorden (bcrypt hashing)</li>
              <li>Row Level Security (RLS) in onze database</li>
              <li>CSRF-bescherming op alle formulieren</li>
              <li>Regelmatige security audits</li>
              <li>Toegang tot gegevens alleen voor geautoriseerde organisatoren</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Gegevens van minderjarigen</h2>
            <p>
              Ons evenement is bedoeld voor personen van 18 jaar en ouder met een geldig motorrijbewijs. 
              We verzamelen niet bewust gegevens van minderjarigen onder de 16 jaar.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Wijzigingen in dit privacybeleid</h2>
            <p>
              We kunnen dit privacybeleid van tijd tot tijd aanpassen. Wijzigingen worden op deze pagina gepubliceerd 
              met de bijgewerkte datum onderaan. Bij belangrijke wijzigingen informeren we u per e-mail.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Klachten</h2>
            <p>
              Heeft u een klacht over de verwerking van uw persoonsgegevens? Neem dan eerst contact met ons op 
              via <a href="mailto:vzwddb@gmail.com" className="text-primary-600 hover:text-primary-700 underline">vzwddb@gmail.com</a>.
            </p>
            <p className="mt-2">
              U heeft ook het recht een klacht in te dienen bij de Belgische Gegevensbeschermingsautoriteit:
            </p>
            <div className="bg-gray-100 rounded-sm p-4 mt-2">
              <p><strong>Gegevensbeschermingsautoriteit</strong></p>
              <p>Drukpersstraat 35, 1000 Brussel</p>
              <p>Tel: +32 (0)2 274 48 00</p>
              <p>E-mail: contact@apd-gba.be</p>
              <p>Website: <a href="https://www.gegevensbeschermingsautoriteit.be" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline">www.gegevensbeschermingsautoriteit.be</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact</h2>
            <p>
              Voor vragen over dit privacybeleid of over de verwerking van uw persoonsgegevens kunt u contact met ons opnemen:
            </p>
            <div className="bg-gray-100 rounded-sm p-4 mt-2">
              <p><strong>Deur Den Bocht</strong></p>
              <p>Email: <a href="mailto:vzwddb@gmail.com" className="text-primary-600 hover:text-primary-700 underline">vzwddb@gmail.com</a></p>
              <p>Website: deurdenbocht.be</p>
            </div>
          </section>

          <section className="border-t-2 pt-6">
            <p className="text-sm text-gray-500">
              <strong>Laatst bijgewerkt:</strong> {new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              <strong>Versie:</strong> 1.0
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
