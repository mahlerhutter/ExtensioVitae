import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function PrivacyPage() {
    useDocumentTitle('Privacy Policy - ExtensioVitae');

    return (
        <div className="min-h-screen bg-slate-900 text-slate-300">
            {/* Header */}
            <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="text-xl font-semibold text-white">
                        Extensio<span className="text-amber-400">Vitae</span>
                    </Link>
                    <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl md:text-4xl font-semibold text-white mb-2">
                    Privacy Policy
                </h1>
                <p className="text-slate-400 mb-8">Last updated: February 3, 2026</p>

                <div className="prose prose-invert prose-slate max-w-none space-y-8">

                    {/* Introduction */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
                        <p>
                            Velebit Ventures d.o.o. ("we", "us", or "our") operates ExtensioVitae (the "Service").
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                            when you use our Service in accordance with the General Data Protection Regulation (GDPR)
                            and other applicable data protection laws.
                        </p>
                        <p className="mt-4">
                            <strong className="text-white">Data Controller:</strong><br />
                            Velebit Ventures d.o.o.<br />
                            7. strasse 13<br />
                            23248 Razanac, Croatia<br />
                            Email: privacy@extensiovitae.com
                        </p>
                    </section>

                    {/* Data We Collect */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. Data We Collect</h2>

                        <h3 className="text-lg font-medium text-white mt-6 mb-3">2.1 Information You Provide</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong className="text-white">Account Data:</strong> Email address, name, profile information when you register</li>
                            <li><strong className="text-white">Health & Lifestyle Data:</strong> Information from the intake questionnaire including age, stress levels, sleep patterns, exercise habits, nutrition preferences</li>
                            <li><strong className="text-white">Usage Data:</strong> Your progress tracking, completed tasks, and interaction with your longevity plan</li>
                            <li><strong className="text-white">Communication Data:</strong> Feedback, support requests, and any other communications</li>
                        </ul>

                        <h3 className="text-lg font-medium text-white mt-6 mb-3">2.2 Automatically Collected Data</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong className="text-white">Device Information:</strong> Browser type, operating system, device identifiers</li>
                            <li><strong className="text-white">Log Data:</strong> IP address, access times, pages viewed, referring URLs</li>
                            <li><strong className="text-white">Cookies:</strong> Session cookies for authentication and preferences</li>
                        </ul>
                    </section>

                    {/* Legal Basis */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">3. Legal Basis for Processing (GDPR Art. 6)</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong className="text-white">Contract Performance (Art. 6(1)(b)):</strong> Processing necessary to provide you with the Service you requested</li>
                            <li><strong className="text-white">Consent (Art. 6(1)(a)):</strong> For optional features like notifications, with your explicit consent</li>
                            <li><strong className="text-white">Legitimate Interests (Art. 6(1)(f)):</strong> For service improvement, security, and fraud prevention</li>
                            <li><strong className="text-white">Legal Obligations (Art. 6(1)(c)):</strong> When required by law</li>
                        </ul>
                    </section>

                    {/* How We Use Data */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">4. How We Use Your Data</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Generate and personalize your 30-day longevity plan</li>
                            <li>Track your progress and calculate your longevity score</li>
                            <li>Provide customer support and respond to inquiries</li>
                            <li>Send notifications (only with your consent)</li>
                            <li>Improve and optimize our Service</li>
                            <li>Ensure security and prevent fraud</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    {/* Data Sharing */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">5. Data Sharing & Third Parties</h2>
                        <p>We do not sell your personal data. We may share data with:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li><strong className="text-white">Supabase:</strong> Database and authentication services (EU data center)</li>
                            <li><strong className="text-white">Vercel:</strong> Hosting and deployment services</li>
                            <li><strong className="text-white">Google:</strong> OAuth authentication (if you sign in with Google)</li>
                            <li><strong className="text-white">OpenAI:</strong> AI-powered plan generation (data is not stored by OpenAI)</li>
                        </ul>
                        <p className="mt-4">
                            All service providers are bound by data processing agreements and appropriate safeguards
                            for international data transfers (Standard Contractual Clauses where applicable).
                        </p>
                    </section>

                    {/* Data Retention */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">6. Data Retention</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong className="text-white">Account Data:</strong> Retained while your account is active</li>
                            <li><strong className="text-white">Health & Lifestyle Data:</strong> Retained for 2 years after last activity</li>
                            <li><strong className="text-white">Usage Logs:</strong> Retained for 90 days</li>
                        </ul>
                        <p className="mt-4">
                            You can request deletion of your data at any time (see Your Rights below).
                        </p>
                    </section>

                    {/* Your Rights */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">7. Your Rights (GDPR)</h2>
                        <p>Under the GDPR, you have the following rights:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li><strong className="text-white">Right of Access (Art. 15):</strong> Request a copy of your personal data</li>
                            <li><strong className="text-white">Right to Rectification (Art. 16):</strong> Correct inaccurate data</li>
                            <li><strong className="text-white">Right to Erasure (Art. 17):</strong> Request deletion of your data ("right to be forgotten")</li>
                            <li><strong className="text-white">Right to Restriction (Art. 18):</strong> Limit how we process your data</li>
                            <li><strong className="text-white">Right to Data Portability (Art. 20):</strong> Receive your data in a portable format</li>
                            <li><strong className="text-white">Right to Object (Art. 21):</strong> Object to processing based on legitimate interests</li>
                            <li><strong className="text-white">Right to Withdraw Consent:</strong> Withdraw consent at any time for consent-based processing</li>
                        </ul>
                        <p className="mt-4">
                            To exercise your rights, contact us at: <a href="mailto:privacy@extensiovitae.com" className="text-amber-400 hover:underline">privacy@extensiovitae.com</a>
                        </p>
                        <p className="mt-2">
                            You also have the right to lodge a complaint with a supervisory authority,
                            particularly in the EU Member State of your residence.
                        </p>
                    </section>

                    {/* Security */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">8. Data Security</h2>
                        <p>We implement appropriate technical and organizational measures to protect your data:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li>Encryption in transit (TLS/HTTPS)</li>
                            <li>Encryption at rest for sensitive data</li>
                            <li>Access controls and authentication</li>
                            <li>Regular security assessments</li>
                            <li>Row-level security for database access</li>
                        </ul>
                    </section>

                    {/* Cookies */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">9. Cookies</h2>
                        <p>We use essential cookies for:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li>Authentication and session management</li>
                            <li>Security and fraud prevention</li>
                            <li>User preferences</li>
                        </ul>
                        <p className="mt-4">
                            We do not use tracking cookies or third-party advertising cookies.
                        </p>
                    </section>

                    {/* Children */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">10. Children's Privacy</h2>
                        <p>
                            Our Service is not intended for individuals under 18 years of age.
                            We do not knowingly collect personal data from children.
                        </p>
                    </section>

                    {/* Changes */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">11. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of
                            significant changes by posting the new policy on this page and updating the
                            "Last updated" date.
                        </p>
                    </section>

                    {/* Contact */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">12. Contact Us</h2>
                        <p>
                            For questions about this Privacy Policy or to exercise your rights:
                        </p>
                        <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                            <p><strong className="text-white">Velebit Ventures d.o.o.</strong></p>
                            <p>7. strasse 13</p>
                            <p>23248 Razanac, Croatia</p>
                            <p className="mt-2">
                                Email: <a href="mailto:privacy@extensiovitae.com" className="text-amber-400 hover:underline">privacy@extensiovitae.com</a>
                            </p>
                        </div>
                    </section>

                </div>

                {/* Footer Links */}
                <div className="mt-12 pt-8 border-t border-slate-800 flex flex-wrap gap-6">
                    <Link to="/terms" className="text-slate-400 hover:text-amber-400 transition-colors">Terms of Service</Link>
                    <Link to="/imprint" className="text-slate-400 hover:text-amber-400 transition-colors">Imprint</Link>
                    <Link to="/" className="text-slate-400 hover:text-amber-400 transition-colors">Home</Link>
                </div>
            </main>
        </div>
    );
}
