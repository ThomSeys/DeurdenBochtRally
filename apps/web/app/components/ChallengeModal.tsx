import { useState } from 'react';
import { Icon } from './Icon';
import { useFetcher } from 'react-router';
import { compressImage } from '~/lib/image-compression';

interface ChallengeModalProps {
  challenge: {
    type: 'photo' | 'text' | 'multiple_choice' | 'number';
    question: string;
    hint?: string;
    options?: string[];
    correctAnswer?: string;
    points: number;
    isActive?: boolean;
  };
  locationName: string;
  locationKey: string;
  zoneId: string;
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

export default function ChallengeModal({
  challenge,
  locationName,
  locationKey,
  zoneId,
  onClose,
  onSuccess,
}: ChallengeModalProps) {
  const [answer, setAnswer] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fetcher = useFetcher();

  const isSubmitting = fetcher.state === 'submitting';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    // Validate file type
    if (!originalFile.type.startsWith('image/')) {
      alert('Selecteer een geldig afbeeldingsbestand');
      return;
    }

    // Compress image if needed
    let file = originalFile;
    try {
      if (originalFile.size > 5 * 1024 * 1024) {
        setUploadingPhoto(true);
        file = await compressImage(originalFile);
        setUploadingPhoto(false);
      }
    } catch (error) {
      console.error('Compression error:', error);
      alert('Fout bij verwerken van afbeelding. Probeer een kleinere foto.');
      setUploadingPhoto(false);
      return;
    }

    setSelectedFile(file);

    // Upload to participant_photos bucket
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'challenge');

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setPhotoUrl(data.url);
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Foto uploaden mislukt. Probeer opnieuw.');
      setSelectedFile(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (challenge.type === 'photo' && !photoUrl) {
      alert('Upload eerst een foto');
      return;
    }

    if (challenge.type !== 'photo' && !answer.trim()) {
      alert('Vul een antwoord in');
      return;
    }

    // Submit
    const formData = new FormData();
    formData.append('zoneId', zoneId);
    formData.append('locationKey', locationKey);
    formData.append('challengeType', challenge.type);
    formData.append('points', challenge.points.toString());

    if (challenge.type === 'photo') {
      formData.append('photoUrl', photoUrl!);
    } else {
      formData.append('textAnswer', answer);
    }

    if (challenge.correctAnswer) {
      formData.append('correctAnswer', challenge.correctAnswer);
    }

    fetcher.submit(formData, {
      method: 'post',
      action: '/api/challenges/submit',
    });
  };

  // Handle submission result
  if (fetcher.data) {
    if (fetcher.data.success) {
      const result = fetcher.data.submission;
      setTimeout(() => {
        if (onSuccess) onSuccess(result);
        onClose();
      }, 2000);
    }
  }

  const getChallengeIcon = () => {
    switch (challenge.type) {
      case 'photo': return 'camera';
      case 'text': return 'message-square';
      case 'multiple_choice': return 'list-checks';
      case 'number': return 'hash';
      default: return 'help-circle';
    }
  };

  const getChallengeTypeLabel = () => {
    switch (challenge.type) {
      case 'photo': return 'Foto Opdracht';
      case 'text': return 'Tekst Vraag';
      case 'multiple_choice': return 'Meerkeuze';
      case 'number': return 'Getal';
      default: return 'Opdracht';
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-6 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon name={getChallengeIcon()} className="w-6 h-6" />
                <span className="text-sm font-medium opacity-90">
                  {getChallengeTypeLabel()}
                </span>
              </div>
              <h2 className="text-2xl font-bold">{locationName}</h2>
              <div className="mt-2 inline-flex items-center gap-1 bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                <Icon name="star" className="w-4 h-4" />
                <span>{challenge.points} punten</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              disabled={isSubmitting}
            >
              <Icon name="x" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Success Message */}
        {fetcher.data?.success && (
          <div className="p-4 bg-green-50 border-b border-green-100">
            <div className="flex items-center gap-3 text-green-800">
              <Icon name="check-circle" className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold">
                  {fetcher.data.submission.isValidated
                    ? fetcher.data.submission.isCorrect
                      ? '🎉 Correct! Je hebt punten verdiend!'
                      : '❌ Helaas, dat was niet het juiste antwoord'
                    : '✅ Inzending ontvangen! We controleren je antwoord.'}
                </p>
                {fetcher.data.submission.pointsAwarded > 0 && (
                  <p className="text-sm mt-1">
                    +{fetcher.data.submission.pointsAwarded} punten toegevoegd!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {fetcher.data?.error && (
          <div className="p-4 bg-red-50 border-b border-red-100">
            <div className="flex items-center gap-3 text-red-800">
              <Icon name="alert-circle" className="w-6 h-6 text-red-600" />
              <p className="font-semibold">{fetcher.data.error}</p>
            </div>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Question */}
          <div className="mb-6">
            <label className="block text-gray-900 font-semibold mb-2">
              Opdracht:
            </label>
            <p className="text-gray-700 leading-relaxed">{challenge.question}</p>
          </div>

          {/* Hint */}
          {challenge.hint && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-start gap-2">
                <Icon name="lightbulb" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">Hint:</p>
                  <p className="text-sm text-blue-800">{challenge.hint}</p>
                </div>
              </div>
            </div>
          )}

          {/* Input based on type */}
          {challenge.type === 'photo' && (
            <div className="mb-6">
              <label className="block text-gray-900 font-semibold mb-2">
                Upload je foto:
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                {photoUrl ? (
                  <div className="space-y-3">
                    <img
                      src={photoUrl}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl(null);
                        setSelectedFile(null);
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700"
                      disabled={isSubmitting}
                    >
                      Andere foto kiezen
                    </button>
                  </div>
                ) : (
                  <div>
                    <Icon name="camera" className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    {uploadingPhoto ? (
                      <p className="text-gray-600">Foto uploaden...</p>
                    ) : (
                      <>
                        <p className="text-gray-600 mb-4">
                          Kies hoe je een foto wilt selecteren
                        </p>
                        <div className="flex gap-3">
                          {/* Camera input */}
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            className="hidden"
                            id="photo-upload-camera"
                            disabled={isSubmitting}
                          />
                          <label
                            htmlFor="photo-upload-camera"
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-colors inline-flex items-center justify-center gap-2 font-semibold"
                          >
                            <Icon name="camera" className="w-5 h-5" />
                            Camera
                          </label>
                          
                          {/* Album input */}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="photo-upload-album"
                            disabled={isSubmitting}
                          />
                          <label
                            htmlFor="photo-upload-album"
                            className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-lg cursor-pointer hover:from-primary-700 hover:to-primary-800 transition-colors inline-flex items-center justify-center gap-2 font-semibold"
                          >
                            <Icon name="image" className="w-5 h-5" />
                            Album
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {challenge.type === 'text' && (
            <div className="mb-6">
              <label htmlFor="answer" className="block text-gray-900 font-semibold mb-2">
                Jouw antwoord:
              </label>
              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={4}
                placeholder="Typ hier je antwoord..."
                disabled={isSubmitting}
              />
            </div>
          )}

          {challenge.type === 'multiple_choice' && challenge.options && (
            <div className="mb-6">
              <label className="block text-gray-900 font-semibold mb-3">
                Kies het juiste antwoord:
              </label>
              <div className="space-y-2">
                {challenge.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      answer === option
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-primary-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={answer === option}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="mr-3"
                      disabled={isSubmitting}
                    />
                    <span className="text-gray-900">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {challenge.type === 'number' && (
            <div className="mb-6">
              <label htmlFor="answer" className="block text-gray-900 font-semibold mb-2">
                Jouw antwoord:
              </label>
              <input
                type="number"
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Typ hier je nummer..."
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingPhoto || (challenge.type === 'photo' && !photoUrl) || (challenge.type !== 'photo' && !answer.trim())}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Icon name="loader" className="w-5 h-5 animate-spin" />
                  <span>Indienen...</span>
                </>
              ) : (
                <>
                  <Icon name="send" className="w-5 h-5" />
                  <span>Indienen</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
