import { Link } from 'react-router';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Info */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white rounded-full p-2 w-12 h-12 flex items-center justify-center">
                <span className="text-2xl">🏍</span>
              </div>
              <div>
                <div className="font-bold text-xl uppercase">Deur Den Bocht</div>
                <div className="text-sm text-gray-400 uppercase">VZW DDB</div>
              </div>
            </div>
            <p className="text-gray-300 mb-2">Den tweede keer Deur den Bocht</p>
            <p className="text-white font-semibold mb-1">📅 ZONDAG 16 MEI 2026</p>
            <p className="text-gray-400">Tot aan café Belami, Aalter!</p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-bold mb-4 uppercase text-sm tracking-wide">Navigatie</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Over het event
                </Link>
              </li>
              <li>
                <Link to="/registration" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Inschrijven
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 uppercase text-sm tracking-wide">Contact</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-center space-x-2">
                <span>📧</span>
                <a href="mailto:info@deurdenbocht.be" className="hover:text-white transition-colors">
                  info@deurdenbocht.be
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <span>📱</span>
                <span>Via WhatsApp groep</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>📍</span>
                <span>Café Den Belami, Aalter</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p className="mb-2">© 2026 VZW Deur Den Bocht. Alle rechten voorbehouden.</p>
          <p className="text-xs">Deelname volledig op eigen risico. Geen snelheid, geen tijdsklassement.</p>
        </div>
      </div>
    </footer>
  );
}
