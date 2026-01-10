import { Link } from '@remix-run/react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-900 text-white">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-white rounded-full p-3 shadow-lg">
                <span className="text-3xl">🏍</span>
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-display font-black uppercase leading-none">
                  DEUR DEN BOCHT
                </h3>
                <p className="text-sm text-brand-300 uppercase tracking-wider font-bold">
                  VZW DdB
                </p>
              </div>
            </div>
            <p className="text-brand-200 text-lg mb-4 font-bold">
              Den tweede keer Deur den Bocht
            </p>
            <p className="text-brand-300 mb-2">
              <span className="font-black text-xl">📅 ZONDAG 16 MEI 2026</span>
            </p>
            <p className="text-brand-300 font-bold">
              Tot aan café Belami, Aalter!
            </p>
          </div>

          <div>
            <h4 className="font-black uppercase text-lg mb-4 text-brand-100 tracking-wide">
              Navigatie
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-brand-200 hover:text-white transition-colors font-bold uppercase text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-brand-200 hover:text-white transition-colors font-bold uppercase text-sm">
                  Over het Event
                </Link>
              </li>
              <li>
                <Link to="/rally" className="text-brand-200 hover:text-white transition-colors font-bold uppercase text-sm">
                  Rally Zones
                </Link>
              </li>
              <li>
                <Link to="/registration" className="text-brand-200 hover:text-white transition-colors font-bold uppercase text-sm">
                  Inschrijven
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-black uppercase text-lg mb-4 text-brand-100 tracking-wide">
              Contact
            </h4>
            <ul className="space-y-3 text-brand-200">
              <li className="flex items-start font-bold">
                <span className="mr-2">📧</span>
                <a href="mailto:info@deurdenbocht.be" className="hover:text-white transition-colors">
                  info@deurdenbocht.be
                </a>
              </li>
              <li className="flex items-start font-bold">
                <span className="mr-2">📱</span>
                <span>Via WhatsApp groep</span>
              </li>
              <li className="flex items-start font-bold">
                <span className="mr-2">📍</span>
                <span>Café Den Belami, Aalter</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-700 mt-12 pt-8 text-center">
          <p className="text-brand-300 text-sm font-bold">
            &copy; {currentYear} VZW Deur Den Bocht. Alle rechten voorbehouden.
          </p>
          <p className="text-sm mt-2 text-brand-400 font-bold">
            Deelname volledig op eigen risico. Geen snelheid, geen tijdsklassement.
          </p>
        </div>
      </div>
    </footer>
  );
}
