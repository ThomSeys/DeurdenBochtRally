import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf } from '@react-pdf/renderer';

// Certificate styles
const styles = StyleSheet.create({
  page: {
    padding: 60,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  border: {
    border: '8px solid #991b1b',
    padding: 40,
    height: '100%',
  },
  title: {
    fontSize: 48,
    textAlign: 'center',
    color: '#991b1b',
    marginBottom: 20,
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 40,
    color: '#374151',
  },
  recipientLabel: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 10,
  },
  recipientName: {
    fontSize: 36,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 40,
  },
  body: {
    fontSize: 14,
    textAlign: 'center',
    color: '#374151',
    lineHeight: 1.6,
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 30,
    paddingVertical: 20,
    borderTop: '2px solid #e5e7eb',
    borderBottom: '2px solid #e5e7eb',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#991b1b',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 60,
    right: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    fontSize: 10,
    color: '#6b7280',
  },
  signature: {
    fontSize: 12,
    fontFamily: 'Helvetica-BoldOblique',
    color: '#374151',
  },
});

// Completion Certificate
export function CompletionCertificate({ 
  participant, 
  stats 
}: { 
  participant: any;
  stats: { zones_completed: number; total_distance: number; total_points: number };
}) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <Text style={styles.subtitle}>Deur Den Bocht 2026</Text>
          
          <Text style={styles.recipientLabel}>Dit certificaat wordt uitgereikt aan</Text>
          <Text style={styles.recipientName}>
            {participant.first_name} {participant.last_name}
          </Text>
          
          <Text style={styles.body}>
            Voor succesvolle deelname aan de Deur Den Bocht Rally 2026,{'\n'}
            een unieke motordag door België, Noord-Frankrijk en de Ardennen{'\n'}
            op vrijdag 16 mei 2026.
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.zones_completed}/8</Text>
              <Text style={styles.statLabel}>Rally Zones</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.total_distance}</Text>
              <Text style={styles.statLabel}>Kilometers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.total_points}</Text>
              <Text style={styles.statLabel}>Punten</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.footerText}>Uitgegeven op</Text>
              <Text style={styles.footerText}>{new Date().toLocaleDateString('nl-BE')}</Text>
            </View>
            <View>
              <Text style={styles.signature}>Deur Den Bocht Organisatie</Text>
              <Text style={styles.footerText}>www.deurdenbocht.be</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Winner Certificate
export function WinnerCertificate({ 
  participant, 
  rank,
  stats 
}: { 
  participant: any;
  rank: number;
  stats: { zones_completed: number; total_distance: number; total_points: number };
}) {
  const getRankText = (rank: number) => {
    if (rank === 1) return '🥇 EERSTE PLAATS';
    if (rank === 2) return '🥈 TWEEDE PLAATS';
    if (rank === 3) return '🥉 DERDE PLAATS';
    return `#${rank} PLAATS`;
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <Text style={styles.title}>🏆</Text>
          <Text style={styles.title}>{getRankText(rank)}</Text>
          <Text style={styles.subtitle}>Deur Den Bocht 2026</Text>
          
          <Text style={styles.recipientLabel}>Gefeliciteerd</Text>
          <Text style={styles.recipientName}>
            {participant.first_name} {participant.last_name}
          </Text>
          
          <Text style={styles.body}>
            Voor het behalen van de {rank === 1 ? 'eerste' : rank === 2 ? 'tweede' : rank === 3 ? 'derde' : `${rank}e`} plaats{'\n'}
            in de Deur Den Bocht Rally 2026!{'\n'}
            {'\n'}
            Een uitstekende prestatie op deze uitdagende route{'\n'}
            door België, Noord-Frankrijk en de Ardennen.
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.zones_completed}/8</Text>
              <Text style={styles.statLabel}>Rally Zones</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.total_distance}</Text>
              <Text style={styles.statLabel}>Kilometers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.total_points}</Text>
              <Text style={styles.statLabel}>Totaal Punten</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>#{rank}</Text>
              <Text style={styles.statLabel}>Ranking</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.footerText}>Uitgegeven op</Text>
              <Text style={styles.footerText}>{new Date().toLocaleDateString('nl-BE')}</Text>
            </View>
            <View>
              <Text style={styles.signature}>Deur Den Bocht Organisatie</Text>
              <Text style={styles.footerText}>www.deurdenbocht.be</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Generate and return PDF blob
export async function generateCertificatePDF(
  type: 'completion' | 'winner',
  participant: any,
  stats: any,
  rank?: number
) {
  const certificate = type === 'winner' && rank 
    ? <WinnerCertificate participant={participant} rank={rank} stats={stats} />
    : <CompletionCertificate participant={participant} stats={stats} />;

  const blob = await pdf(certificate).toBlob();
  return blob;
}
