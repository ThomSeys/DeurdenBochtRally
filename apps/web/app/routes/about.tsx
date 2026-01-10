import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { getUser } from '~/lib/session.server';
import { getScheduleItems, getBenefitItems, getFAQItems } from '~/lib/sanity.server';
import type { Database } from '~/lib/database.types';

type Participant = Database['public']['Tables']['participants']['Row'];

export const meta: MetaFunction = () => {
  return [
    { title: 'Over het Event - Deur Den Bocht' },
    { name: 'description', content: 'Alles over de Deur Den Bocht rally - route, schema, veiligheid en meer.' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  const [scheduleItems, benefitsEveryone, benefitsWinner, safetyItems, cancellationItems, importantItems] = await Promise.all([
    getScheduleItems().catch(() => []),
    getBenefitItems('everyone').catch(() => []),
    getBenefitItems('winner').catch(() => []),
    getFAQItems('safety').catch(() => []),
    getFAQItems('cancellation').catch(() => []),
    getFAQItems('important').catch(() => []),
  ]);
  return json({ user, scheduleItems, benefitsEveryone, benefitsWinner, safetyItems, cancellationItems, importantItems });
}

export default function About() {
  const { user, scheduleItems, benefitsEveryone, benefitsWinner, safetyItems, cancellationItems, importantItems } = useLoaderData<typeof loader>();

  const colorBorderClasses: Record<string, string> = {
    primary: 'border-primary-600',
    blue: 'border-blue-600',
    green: 'border-green-600',
    yellow: 'border-yellow-600',
    red: 'border-red-600',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary-600 text-white py-16">
          <div className="container-custom">
            <h1 className="text-5xl font-display font-bold mb-4">Over het Event</h1>
            <p className="text-xl text-primary-100">
              Alles wat je moet weten over Deur Den Bocht - Den Bochtenkoning Rally
            </p>
          </div>
        </section>

        {/* Schedule */}
        <section className="section">
          <div className="container-custom">
            <h2 className="text-4xl font-display font-bold mb-8">Dagschema</h2>
            
            <div className="space-y-6 max-w-3xl">
              {scheduleItems.filter((item) => item !== null).map((item) => (
                <div key={item._id} className={`card border-l-4 ${colorBorderClasses[item.color] || 'border-primary-600'}`}>
                  <div className="flex items-start">
                    <span className="text-4xl mr-4">{item.icon}</span>
                    <div>
                      <h3 className="text-2xl font-display font-bold mb-2">
                        {item.time}: {item.title}
                      </h3>
                      <p className="text-gray-700 mb-2">{item.description}</p>
                      {item.details && item.details.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {item.details.map((detail, index) => (
                            <li key={index}>{detail}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What you receive */}
        <section className="section bg-gray-100">
          <div className="container-custom">
            <h2 className="text-4xl font-display font-bold mb-8">Wat ontvang je?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span className="text-3xl mr-3">🎁</span>
                  Iedere deelnemer krijgt
                </h3>
                <ul className="space-y-2 text-gray-700">
                  {benefitsEveryone.filter((benefit) => benefit !== null).map((benefit) => (
                    <li key={benefit._id} className="flex items-start">
                      <span className="text-primary-600 mr-2">{benefit.icon}</span>
                      <span>{benefit.title}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card bg-primary-50 border-2 border-primary-600">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span className="text-3xl mr-3">👑</span>
                  De winnaar krijgt
                </h3>
                <ul className="space-y-2 text-gray-700">
                  {benefitsWinner.filter((benefit) => benefit !== null).map((benefit) => (
                    <li key={benefit._id} className="flex items-start">
                      <span className="text-primary-600 mr-2">{benefit.icon}</span>
                      <span><strong>{benefit.title}</strong></span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Safety */}
        <section className="section">
          <div className="container-custom">
            <h2 className="text-4xl font-display font-bold mb-8">🔒 Veiligheid & Organisatie</h2>
            
            <div className="card max-w-3xl mx-auto">
              <ul className="space-y-4 text-gray-700">
                {safetyItems.filter((item) => item !== null).map((item) => (
                  <li key={item._id} className="flex items-start">
                    <span className="text-2xl mr-3">{item.icon}</span>
                    <div>
                      <strong>{item.question}</strong>
                      <p>{item.answer}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Cancellation Policy */}
        <section className="section bg-gray-100">
          <div className="container-custom">
            <h2 className="text-4xl font-display font-bold mb-8">🔄 Annuleringsbeleid</h2>
            
            <div className="card max-w-3xl mx-auto">
              <h3 className="text-xl font-bold mb-4">Niet kunnen komen?</h3>
              <div className="space-y-3 text-gray-700">
                {cancellationItems.filter((item) => item !== null).map((item) => (
                  <p key={item._id}>
                    <strong>{item.question}:</strong> {item.answer}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Important Info */}
        <section className="section">
          <div className="container-custom">
            <div className="card bg-yellow-50 border-2 border-yellow-400 max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold mb-4 flex items-center">
                <span className="text-3xl mr-3">⚡</span>
                Belangrijke Info
              </h3>
              <ul className="space-y-2 text-gray-800">
                {importantItems.filter((item) => item !== null).map((item) => (
                  <li key={item._id} className="flex items-start">
                    <span className="text-yellow-600 mr-2">•</span>
                    <span><strong>{item.question}:</strong> {item.answer}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
