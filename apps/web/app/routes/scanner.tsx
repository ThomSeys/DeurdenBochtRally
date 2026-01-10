import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useState, useEffect, useRef } from 'react';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { getUser } from '~/lib/session.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'QR Scanner - Deur Den Bocht' },
    { name: 'description', content: 'Scan participant QR codes' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return json({ user });
}

export default function Scanner() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      // Use jsQR library or send to backend for processing
      // For now, we'll use a simple text input fallback
      setError('Image QR scanning requires additional setup. Please use manual input below.');
    } catch (err) {
      setError('Failed to scan QR code from image');
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualInput = async (qrData: string) => {
    if (!qrData.trim()) return;

    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      const response = await fetch('/api/validate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData }),
      });

      const data = await response.json();

      if (data.valid) {
        setScanResult(data);
      } else {
        setError(data.error || 'Invalid QR code');
      }
    } catch (err) {
      setError('Failed to validate QR code');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 py-16">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-display font-bold mb-4">📱 QR Scanner</h1>
              <p className="text-xl text-gray-700">
                Scan participant QR codes for validation
              </p>
            </div>

            {/* Info Notice */}
            <div className="card bg-blue-50 border-2 border-blue-400 mb-6">
              <h3 className="text-xl font-bold mb-2">ℹ️ Native QR Scanning</h3>
              <p className="text-gray-700 mb-4">
                De QR codes kunnen nu direct gescand worden met de native camera app op je smartphone! 
                Open gewoon de camera en richt op de QR code - je wordt automatisch doorgestuurd naar de validatie pagina.
              </p>
              <p className="text-sm text-gray-600">
                Deze pagina is enkel nodig als je de QR code data handmatig wilt invoeren.
              </p>
            </div>

            {/* Camera Scanner (Future Enhancement) */}
            <div className="card mb-6">
              <h3 className="text-xl font-bold mb-4">📷 Camera Scanner</h3>
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-4">
                  Camera-based scanning can be implemented with libraries like react-qr-reader or html5-qrcode
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary"
                >
                  Upload QR Code Image
                </button>
              </div>
            </div>

            {/* Manual Input */}
            <div className="card mb-6">
              <h3 className="text-xl font-bold mb-4">⌨️ Manual Input</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const qrData = formData.get('qrData') as string;
                  handleManualInput(qrData);
                }}
              >
                <textarea
                  name="qrData"
                  rows={6}
                  placeholder="Paste QR code data here...&#10;&#10;Example:&#10;Naam: John Doe&#10;Email: john@example.com&#10;ID: abc123&#10;Betaald: Ja"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 mb-4"
                  disabled={isScanning}
                />
                <button
                  type="submit"
                  disabled={isScanning}
                  className="btn-primary w-full"
                >
                  {isScanning ? 'Validating...' : 'Validate QR Code'}
                </button>
              </form>
            </div>

            {/* Error Display */}
            {error && (
              <div className="card bg-red-50 border-2 border-red-500 mb-6">
                <p className="text-red-700 font-bold">❌ {error}</p>
              </div>
            )}

            {/* Success Result */}
            {scanResult && scanResult.valid && (
              <div className="card bg-green-50 border-2 border-green-500">
                <div className="text-center mb-6">
                  <span className="text-6xl mb-4 block">
                    {scanResult.participant.isPaid ? '✅' : '⚠️'}
                  </span>
                  <h3 className="text-2xl font-bold mb-2">
                    {scanResult.message}
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-bold text-lg">{scanResult.participant.name}</p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-bold">{scanResult.participant.email}</p>
                  </div>

                  {scanResult.participant.phone && (
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-bold">{scanResult.participant.phone}</p>
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Motorcycle</p>
                    <p className="font-bold">
                      {scanResult.participant.motorcycle_brand} {scanResult.participant.motorcycle_model}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <p className={`font-bold ${scanResult.participant.isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                      {scanResult.participant.paymentStatus}
                    </p>
                  </div>

                  {scanResult.participant.allowEarlyAccess && (
                    <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-400">
                      <p className="font-bold text-yellow-800">🌟 Early Access Granted</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setScanResult(null);
                    setError(null);
                  }}
                  className="btn-secondary w-full mt-6"
                >
                  Scan Another
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
