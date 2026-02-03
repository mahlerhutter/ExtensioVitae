import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Science Page - Die wissenschaftliche Basis von ExtensioVitae
 *
 * Diese Seite erklärt, warum wenige gezielte Fragen ausreichen,
 * um einen personalisierten Longevity-Plan zu erstellen.
 */

const EVIDENCE_SECTIONS = [
  {
    id: 'overview',
    title: 'Warum 3 Minuten genügen',
    content: `Die Langlebigkeitsforschung der letzten 20 Jahre hat gezeigt: Es sind nicht hunderte Faktoren,
    die über unsere Gesundheitsspanne entscheiden, sondern eine Handvoll messbarer Verhaltensweisen.
    Diese "Big 5" erklären zusammen über 70% der vermeidbaren Mortalität.

    Unser Algorithmus fragt gezielt nach genau diesen Faktoren – nicht mehr, nicht weniger.
    Jede Frage wurde gewählt, weil sie einen messbaren Unterschied in Jahren Lebenserwartung repräsentiert.`,
    highlight: '70% der vermeidbaren Mortalität durch 5 Faktoren erklärbar'
  },
  {
    id: 'sleep',
    title: 'Schlaf: Der Fundament-Faktor',
    icon: '🌙',
    yearImpact: '± 4 Jahre',
    content: `Chronischer Schlafmangel (<6 Stunden/Nacht) ist mit einem 12% höheren Mortalitätsrisiko
    assoziiert – das entspricht etwa 4 Jahren Lebenserwartung. Schlaf beeinflusst:

    • Immunsystem-Regeneration
    • Hormonelle Balance (Wachstumshormon, Cortisol)
    • Kognitive Funktion und Demenz-Risiko
    • Metabolische Gesundheit und Insulinsensitivität`,
    sources: [
      'Cappuccio et al. (2010): "Sleep duration and all-cause mortality" - Meta-Analyse von 1.3 Mio. Teilnehmern',
      'Walker, M. (2017): "Why We Sleep" - Zusammenfassung der Schlafforschung',
      'Yin et al. (2017): "Sleep duration and mortality" - J-Kurven-Nachweis'
    ]
  },
  {
    id: 'stress',
    title: 'Stress: Der stille Beschleuniger',
    icon: '🧠',
    yearImpact: '± 6 Jahre',
    content: `Chronischer Stress verkürzt messbar die Telomere (Schutzkappen der DNA) und beschleunigt
    die biologische Alterung. Ein Stress-Level von 8-10 über Jahre entspricht einem Alterungsäquivalent
    von bis zu 10 zusätzlichen Jahren.

    • Erhöhtes Cortisol → Immunsuppression
    • Sympathikus-Dominanz → Herz-Kreislauf-Belastung
    • Schlafstörungen → Kaskadeneffekte
    • Inflammaging → Beschleunigte Zellalterung`,
    sources: [
      'Kivimäki et al. (2012): "Job strain and cardiovascular disease" - 200.000 Teilnehmer',
      'Epel et al. (2004): "Telomere shortening and chronic stress"',
      'Steptoe & Kivimäki (2012): "Stress and cardiovascular disease"'
    ]
  },
  {
    id: 'movement',
    title: 'Bewegung: Die Medizin ohne Rezept',
    icon: '🏃',
    yearImpact: '± 3-4 Jahre',
    content: `Bereits 15 Minuten tägliche Bewegung reduziert das Mortalitätsrisiko um 14% und
    verlängert die Lebenserwartung um durchschnittlich 3 Jahre. Der "Sweet Spot" liegt bei
    150-300 Minuten moderater Aktivität pro Woche.

    • Muskelerhalt = Schutz vor Frailty im Alter
    • VO2max als stärkster Prädiktor für Langlebigkeit
    • Zone-2-Training für mitochondriale Gesundheit
    • Krafttraining für Hormonstatus und Knochengesundheit`,
    sources: [
      'Wen et al. (2011): "Minimum amount of physical activity for reduced mortality" - Taiwan Cohort',
      'Moore et al. (2012): "Leisure Time Physical Activity" - 650.000 Erwachsene',
      'Kodama et al. (2009): "Cardiorespiratory Fitness as a Quantitative Predictor"'
    ]
  },
  {
    id: 'nutrition',
    title: 'Ernährung: Qualität vor Quantität',
    icon: '🥗',
    yearImpact: '± 4-5 Jahre',
    content: `Die NOVA-Klassifikation zeigt: Ultra-verarbeitete Lebensmittel erhöhen das Mortalitätsrisiko
    um bis zu 62%. Umgekehrt reduziert eine mediterrane Ernährung das kardiovaskuläre Risiko um 30%.

    • Protein-Timing für Muskelerhalt (1.2-1.6g/kg)
    • Ballaststoffe für Mikrobiom und Metabolismus
    • Zeit-restringiertes Essen für metabolische Flexibilität
    • Entzündungshemmende Lebensmittel`,
    sources: [
      'PREDIMED Trial (2013): "Mediterranean Diet for Cardiovascular Prevention"',
      'Aune et al. (2017): "Fruit and vegetable intake and mortality" - 95 Kohorten',
      'Hall et al. (2019): "Ultra-processed foods cause excess calorie intake"'
    ]
  },
  {
    id: 'smoking',
    title: 'Rauchen: Der größte einzelne Risikofaktor',
    icon: '🚭',
    yearImpact: '10 Jahre',
    content: `Rauchen ist der am besten dokumentierte vermeidbare Risikofaktor. Raucher sterben
    im Durchschnitt 10 Jahre früher als Nichtraucher. Die gute Nachricht: Wer vor 40 aufhört,
    kann 90% des Risikos reversieren.

    • Direkte Schädigung von Gefäßen und Lunge
    • Erhöhtes Krebsrisiko (nicht nur Lunge)
    • Beschleunigte Hautalterung
    • Negative Effekte auf Regeneration`,
    sources: [
      'Doll et al. (2004): "Mortality in relation to smoking: 50 years\' observations"',
      'Jha et al. (2013): "21st-Century Hazards of Smoking" - 200.000 Teilnehmer',
      'Pirie et al. (2013): "Million Women Study"'
    ]
  },
  {
    id: 'social',
    title: 'Soziale Verbindungen: Der unterschätzte Faktor',
    icon: '👥',
    yearImpact: '± 3-4 Jahre',
    content: `Eine Meta-Analyse von 148 Studien zeigt: Starke soziale Beziehungen erhöhen die
    Überlebenswahrscheinlichkeit um 50%. Einsamkeit hat einen ähnlich starken Effekt auf die
    Mortalität wie Rauchen – und ist stärker als Bewegungsmangel.

    • Soziale Unterstützung senkt Cortisol
    • Sinnstiftung und Purpose verlängern Leben
    • Positive Emotionen stärken Immunsystem
    • Community-Einbindung als Blue-Zone-Faktor`,
    sources: [
      'Holt-Lunstad et al. (2010): "Social Relationships and Mortality Risk" - 308.849 Teilnehmer',
      'Pantell et al. (2013): "Social Isolation in the Elderly"',
      'Buettner, D. (2008): "Blue Zones" - Langlebigkeitsforschung'
    ]
  }
];

const WHY_IT_WORKS = [
  {
    icon: '🎯',
    title: 'Fokus auf das Wesentliche',
    description: 'Statt 100 Fragen zu stellen, fragen wir nach den 7 Faktoren, die 80% des Outcomes bestimmen.'
  },
  {
    icon: '📊',
    title: 'Evidenzbasierte Gewichtung',
    description: 'Jeder Faktor ist mit seinem tatsächlichen Jahres-Impact auf die Lebenserwartung gewichtet.'
  },
  {
    icon: '🔄',
    title: 'Adaptive Personalisierung',
    description: 'Dein Plan passt sich an deine Ausgangslage an – wer wenig schläft, bekommt Schlaf-Priorität.'
  },
  {
    icon: '⚡',
    title: 'Sofort umsetzbar',
    description: 'Keine generischen Tipps, sondern konkrete Micro-Aktionen basierend auf deinem Profil.'
  }
];

function SourceList({ sources }) {
  return (
    <div className="mt-4 pt-4 border-t border-slate-700">
      <p className="text-xs text-slate-500 mb-2 font-medium">Wissenschaftliche Quellen:</p>
      <ul className="space-y-1">
        {sources.map((source, idx) => (
          <li key={idx} className="text-xs text-slate-500 leading-relaxed">
            • {source}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EvidenceCard({ section }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-amber-400/30 transition-colors">
      <div className="flex items-start gap-4 mb-4">
        <span className="text-3xl">{section.icon}</span>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-1">{section.title}</h3>
          {section.yearImpact && (
            <span className="inline-block px-2 py-1 bg-amber-400/10 text-amber-400 text-sm rounded-lg font-medium">
              Impact: {section.yearImpact}
            </span>
          )}
        </div>
      </div>

      <div className="text-slate-300 leading-relaxed whitespace-pre-line text-sm">
        {section.content}
      </div>

      {section.sources && <SourceList sources={section.sources} />}
    </div>
  );
}

export default function SciencePage() {
  const overviewSection = EVIDENCE_SECTIONS.find(s => s.id === 'overview');
  const factorSections = EVIDENCE_SECTIONS.filter(s => s.id !== 'overview');

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-white tracking-tight">
            Extensio<span className="text-amber-400">Vitae</span>
          </Link>
          <Link
            to="/intake"
            className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Jetzt starten
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4">
            Die Wissenschaft hinter <span className="text-amber-400">ExtensioVitae</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Warum wenige gezielte Fragen zu einem personalisierten Plan führen – basierend auf
            Jahrzehnten Langlebigkeitsforschung.
          </p>

          {/* Overview highlight */}
          <div className="bg-slate-800 border border-amber-400/30 rounded-2xl p-8 text-left max-w-3xl mx-auto">
            <p className="text-slate-300 leading-relaxed mb-4">
              {overviewSection.content}
            </p>
            <div className="inline-block px-4 py-2 bg-amber-400/10 border border-amber-400/30 rounded-lg">
              <p className="text-amber-400 font-semibold text-sm">
                ✓ {overviewSection.highlight}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Works */}
      <section className="py-16 bg-slate-800">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-white text-center mb-10">
            Warum unser Ansatz funktioniert
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_IT_WORKS.map((item, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-700 rounded-xl p-5 text-center">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Evidence Sections */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-white text-center mb-4">
            Die Evidenz hinter jedem Faktor
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Jeder unserer Input-Parameter repräsentiert einen wissenschaftlich validierten
            Risiko- oder Schutzfaktor mit messbarem Impact auf die Lebenserwartung.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {factorSections.map(section => (
              <EvidenceCard key={section.id} section={section} />
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer & Methodology Note */}
      <section className="py-16 bg-slate-800">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              📋 Wichtiger Hinweis
            </h3>
            <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
              <p>
                <strong className="text-white">Keine medizinische Beratung:</strong> ExtensioVitae ersetzt
                keine ärztliche Diagnose oder Behandlung. Unser Score dient der Motivation und Selbstreflexion,
                nicht der medizinischen Bewertung.
              </p>
              <p>
                <strong className="text-white">Populationsbasierte Daten:</strong> Die zitierten Studien
                basieren auf großen Populationen. Individuelle Ergebnisse können abweichen, da genetische,
                sozioökonomische und weitere Faktoren nicht erfasst werden.
              </p>
              <p>
                <strong className="text-white">Continuous Improvement:</strong> Wir aktualisieren unseren
                Algorithmus regelmäßig basierend auf neuen wissenschaftlichen Erkenntnissen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6">
            Bereit für deinen personalisierten Plan?
          </h2>
          <p className="text-slate-400 mb-8">
            3 Minuten Input. 30 Tage umsetzbare Maßnahmen. Wissenschaftlich fundiert.
          </p>
          <Link
            to="/intake"
            className="inline-flex items-center bg-amber-400 hover:bg-amber-500 text-slate-900 px-8 py-4 rounded-lg text-lg font-medium transition-all hover:scale-105"
          >
            Jetzt Blueprint erstellen
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-slate-500 text-sm">
            © 2025 ExtensioVitae. Wissenschaftlich inspiriert, nicht medizinisch validiert.
          </div>
          <div className="flex items-center gap-6 text-slate-500 text-sm">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Datenschutz</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">AGB</Link>
            <Link to="/" className="hover:text-slate-300 transition-colors">Startseite</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
