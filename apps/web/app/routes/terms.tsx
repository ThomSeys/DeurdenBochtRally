import { type MetaFunction } from 'react-router';
import Header from '~/components/Header';
import Footer from '~/components/Footer';

export const meta: MetaFunction = () => {
  return [
    { title: 'Algemene Voorwaarden - Deur Den Bocht' },
    { name: 'description', content: 'Algemene voorwaarden voor deelname aan Deur Den Bocht' },
  ];
};

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Algemene Voorwaarden</h1>

        <div className="bg-white rounded-sm shadow-sm p-8 space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Definities</h2>
            <ul className="space-y-2">
              <li><strong>"Organisator":</strong> Deur Den Bocht, organisator van het motorrijtuigenevenement</li>
              <li><strong>"Deelnemer":</strong> Persoon die zich heeft ingeschreven voor het evenement</li>
              <li><strong>"Evenement":</strong> Deur Den Bocht motorrit en aanverwante activiteiten</li>
              <li><strong>"Rally":</strong> Het competitieve element met zones en scorebepaling</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Toepasselijkheid</h2>
            <p>
              Deze algemene voorwaarden zijn van toepassing op alle inschrijvingen, deelname en gebruik 
              van de website en diensten van Deur Den Bocht. Door in te schrijven en deel te nemen aan 
              het evenement accepteert u deze voorwaarden volledig.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Inschrijving en Betaling</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">3.1 Inschrijvingsprocedure</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Inschrijving gebeurt online via de website</li>
              <li>Inschrijving is pas definitief na betaling</li>
              <li>U ontvangt een bevestigingsmail met unieke QR-code</li>
              <li>Het inschrijvingsgeld is niet terugbetaalbaar, behalve bij annulering door de organisator</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">3.2 Betaling</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Betaling verloopt via Stripe (veilige betalingsverwerker)</li>
              <li>Prijzen zijn zoals vermeld op de website en zijn inclusief BTW</li>
              <li>Betaling dient onmiddellijk te gebeuren na registratie</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">3.3 Annulering door Deelnemer</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Annulering tot 30 dagen voor het evenement: 50% restitutie</li>
              <li>Annulering binnen 30 dagen voor het evenement: geen restitutie</li>
              <li>Annuleringen dienen schriftelijk te gebeuren via email</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Voorwaarden voor Deelname</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">4.1 Algemeen</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Deelnemers moeten minimaal 18 jaar zijn</li>
              <li>Deelnemers moeten in het bezit zijn van een geldig motorrijbewijs (A of A2)</li>
              <li>Het motorrijtuig moet verzekerd zijn en technisch in orde</li>
              <li>Deelnemers moeten voldoen aan de verkeersregels te allen tijde</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">4.2 Rijgedrag</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Deelname gebeurt op eigen risico</li>
              <li>Snelheidslimieten en verkeersregels moeten te allen tijde worden nageleefd</li>
              <li>De organisator behoudt zich het recht voor om deelnemers die zich niet aan de regels houden te diskwalificeren</li>
              <li>Gevaarlijk rijgedrag leidt tot onmiddellijke uitsluiting zonder terugbetaling</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Aansprakelijkheid en Verzekering</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">5.1 Uitsluiting Aansprakelijkheid Organisator</h3>
            <p className="mb-2">
              De organisator is niet aansprakelijk voor:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Lichamelijk letsel, overlijden of materiële schade aan personen of goederen</li>
              <li>Diefstal, verlies of beschadiging van persoonlijke eigendommen</li>
              <li>Mechanische problemen aan motorrijtuigen</li>
              <li>Verkeersongevallen tijdens het evenement</li>
              <li>Gedrag van andere deelnemers</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">5.2 Verzekering</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Elke deelnemer is verplicht een geldige WA-verzekering te hebben</li>
              <li>Deelnemers wordt aangeraden een volledige omnium- en reisverzekering af te sluiten</li>
              <li>De organisator heeft een aansprakelijkheidsverzekering voor organisatorische activiteiten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Evenementregels</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">6.1 Rally Zones</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Rally zones moeten binnen de aangegeven tijdsvensters worden bezocht</li>
              <li>GPS-verificatie wordt gebruikt voor controle</li>
              <li>Fraude of manipulatie leidt tot diskwalificatie</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">6.2 Snelwegverbod</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Het gebruik van snelwegen is verboden tijdens de rally</li>
              <li>Overtreding leidt tot puntaftrek of diskwalificatie</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Foto's en Media</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Door deel te nemen geeft u toestemming voor foto's en video's gemaakt tijdens het evenement</li>
              <li>Deze beelden kunnen gebruikt worden voor promotiedoeleinden</li>
              <li>Foto's geüpload door deelnemers kunnen worden gedeeld op de website</li>
              <li>U behoudt copyright op uw eigen foto's maar geeft een licentie voor gebruik door de organisator</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Gegevensbescherming</h2>
            <p>
              Uw persoonsgegevens worden verwerkt in overeenstemming met onze{' '}
              <a href="/privacy-policy" className="text-primary-600 hover:text-primary-700 underline">
                privacyverklaring
              </a>
              . Door in te schrijven stemt u in met deze verwerking.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Wijzigingen en Annulering door Organisator</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">9.1 Wijzigingen</h3>
            <p>
              De organisator behoudt zich het recht voor om:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Het programma aan te passen</li>
              <li>De route te wijzigen</li>
              <li>Rally zones te verplaatsen of te annuleren</li>
              <li>Tijdstippen aan te passen</li>
            </ul>
            <p className="mt-2">Deelnemers worden tijdig geïnformeerd over belangrijke wijzigingen.</p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">9.2 Annulering door Organisator</h3>
            <p>
              Bij annulering door de organisator (wegens overmacht, onvoldoende deelnemers, of andere redenen):
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Worden alle betaalde inschrijvingsgelden volledig terugbetaald</li>
              <li>Is de organisator niet aansprakelijk voor gemaakte reis- of andere kosten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Overmacht</h2>
            <p>
              De organisator is niet aansprakelijk bij overmacht, waaronder begrepen maar niet beperkt tot:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Extreme weersomstandigheden</li>
              <li>Natuurrampen</li>
              <li>Epidemieën of pandemieën</li>
              <li>Overheidsmaatregelen</li>
              <li>Stakingen of andere arbeidsconflicten</li>
              <li>Terrorisme of andere veiligheidsdreigingen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Gedragsregels</h2>
            <p>Deelnemers dienen zich te houden aan fatsoensnormen:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Respectvol gedrag tegenover mededeelnemers, organisatoren en derden</li>
              <li>Geen discriminatie, intimidatie of geweld</li>
              <li>Geen overmatig alcoholgebruik (voor, tijdens of na het rijden)</li>
              <li>Geen gebruik van verdovende middelen</li>
            </ul>
            <p className="mt-2">
              Overtredingen kunnen leiden tot uitsluiting zonder terugbetaling.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Intellectueel Eigendom</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Alle rechten op de website, logo's, teksten en materialen berusten bij de organisator</li>
              <li>Het is verboden om materialen te kopiëren zonder toestemming</li>
              <li>Het evenementnaam en logo mogen niet worden gebruikt voor commerciële doeleinden</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Klachten en Geschillen</h2>
            <p>
              Klachten kunnen worden ingediend via <a href="mailto:vzwddb@gmail.com" className="text-primary-600 hover:text-primary-700 underline">vzwddb@gmail.com</a>.
              We streven ernaar om binnen 14 dagen te reageren.
            </p>
            <p className="mt-2">
              Op deze voorwaarden is Belgisch recht van toepassing. Geschillen worden voorgelegd aan de 
              bevoegde rechtbank van het arrondissement waar de organisator is gevestigd.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Diversen</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Indien een bepaling in deze voorwaarden nietig is, blijven de overige bepalingen van kracht</li>
              <li>De organisator mag deze voorwaarden te allen tijde aanpassen</li>
              <li>Aangepaste voorwaarden worden gepubliceerd op de website</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact</h2>
            <p>Voor vragen over deze algemene voorwaarden:</p>
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

          <section className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8">
            <p className="text-sm text-yellow-800">
              <strong>Belangrijk:</strong> Door deel te nemen aan Deur Den Bocht verklaart u deze algemene voorwaarden 
              te hebben gelezen, begrepen en volledig te accepteren. Bij twijfel of vragen, neem contact op 
              voor het evenement.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
