import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function TermsPage() {
    useDocumentTitle('Terms of Service - ExtensioVitae');

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
                    Terms of Service
                </h1>
                <p className="text-slate-400 mb-8">Last updated: February 3, 2026</p>

                <div className="prose prose-invert prose-slate max-w-none space-y-8">

                    {/* Introduction */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
                        <p>
                            By accessing or using ExtensioVitae (the "Service") operated by Velebit Ventures d.o.o.
                            ("Company", "we", "us", or "our"), you agree to be bound by these Terms of Service
                            ("Terms"). If you disagree with any part of these terms, you may not access the Service.
                        </p>
                    </section>

                    {/* Service Description */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. Service Description</h2>
                        <p>
                            ExtensioVitae is a digital wellness platform that provides:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li>Personalized 30-day longevity plans based on lifestyle questionnaires</li>
                            <li>Progress tracking and longevity score calculations</li>
                            <li>Science-informed wellness recommendations</li>
                            <li>Optional notification features</li>
                        </ul>
                        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                            <p className="text-amber-400 font-medium">⚠️ Important Disclaimer</p>
                            <p className="mt-2">
                                ExtensioVitae is a wellness lifestyle tool, NOT a medical service. Our recommendations
                                are informational only and do not constitute medical advice, diagnosis, or treatment.
                                Always consult qualified healthcare professionals for medical decisions.
                            </p>
                        </div>
                    </section>

                    {/* User Accounts */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">3. User Accounts</h2>

                        <h3 className="text-lg font-medium text-white mt-6 mb-3">3.1 Registration</h3>
                        <p>
                            To access certain features, you must create an account. You agree to provide accurate,
                            current, and complete information during registration and to update such information
                            to keep it accurate.
                        </p>

                        <h3 className="text-lg font-medium text-white mt-6 mb-3">3.2 Account Security</h3>
                        <p>
                            You are responsible for safeguarding your account credentials and for all activities
                            under your account. Notify us immediately of any unauthorized use.
                        </p>

                        <h3 className="text-lg font-medium text-white mt-6 mb-3">3.3 Age Requirement</h3>
                        <p>
                            You must be at least 18 years old to use the Service.
                        </p>
                    </section>

                    {/* Acceptable Use */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">4. Acceptable Use</h2>
                        <p>You agree NOT to:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li>Use the Service for any unlawful purpose</li>
                            <li>Attempt to gain unauthorized access to any part of the Service</li>
                            <li>Interfere with or disrupt the Service or servers</li>
                            <li>Transmit viruses or malicious code</li>
                            <li>Collect user data without consent</li>
                            <li>Use the Service to send spam or unsolicited messages</li>
                            <li>Impersonate others or misrepresent your affiliation</li>
                            <li>Use automated means to access the Service without permission</li>
                        </ul>
                    </section>

                    {/* Intellectual Property */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">5. Intellectual Property</h2>
                        <p>
                            The Service and its original content (excluding user-provided content), features,
                            and functionality are owned by Velebit Ventures d.o.o. and are protected by
                            international copyright, trademark, and other intellectual property laws.
                        </p>
                        <p className="mt-4">
                            You may not reproduce, distribute, modify, create derivative works of, publicly
                            display, or exploit any content from the Service without our prior written consent.
                        </p>
                    </section>

                    {/* User Content */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">6. User Content</h2>
                        <p>
                            By submitting content (including intake responses, feedback, and other data), you grant
                            us a non-exclusive, royalty-free license to use, process, and store such content to
                            provide and improve the Service.
                        </p>
                        <p className="mt-4">
                            You retain ownership of your personal data and can request its deletion at any time
                            in accordance with our <Link to="/privacy" className="text-amber-400 hover:underline">Privacy Policy</Link>.
                        </p>
                    </section>

                    {/* Health Disclaimer */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">7. Health Disclaimer</h2>
                        <div className="p-4 bg-slate-800 rounded-lg">
                            <p className="text-white font-medium mb-2">THE SERVICE IS NOT A SUBSTITUTE FOR PROFESSIONAL MEDICAL ADVICE</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>We do not provide medical diagnoses or treatments</li>
                                <li>Our recommendations are general wellness suggestions only</li>
                                <li>Always consult your doctor before starting any new health regimen</li>
                                <li>Seek immediate medical attention for health emergencies</li>
                                <li>We are not responsible for health outcomes resulting from following our suggestions</li>
                            </ul>
                        </div>
                    </section>

                    {/* Limitation of Liability */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
                        <p>
                            TO THE FULLEST EXTENT PERMITTED BY LAW, VELEBIT VENTURES D.O.O. SHALL NOT BE LIABLE FOR:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                            <li>Loss of profits, data, or other intangible losses</li>
                            <li>Damages arising from your use or inability to use the Service</li>
                            <li>Health outcomes or medical conditions</li>
                            <li>Unauthorized access to your data</li>
                        </ul>
                        <p className="mt-4">
                            Our total liability shall not exceed the amount you paid us (if any) in the 12 months
                            preceding the claim, or €100, whichever is greater.
                        </p>
                    </section>

                    {/* Disclaimer of Warranties */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">9. Disclaimer of Warranties</h2>
                        <p>
                            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
                            WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
                            FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                        </p>
                        <p className="mt-4">
                            We do not guarantee that the Service will be uninterrupted, error-free, or secure.
                        </p>
                    </section>

                    {/* Termination */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">10. Termination</h2>
                        <p>
                            We may terminate or suspend your account and access to the Service immediately,
                            without prior notice, for conduct that we determine violates these Terms or is
                            harmful to other users, us, or third parties.
                        </p>
                        <p className="mt-4">
                            You may terminate your account at any time by contacting us. Upon termination,
                            your right to use the Service ceases immediately.
                        </p>
                    </section>

                    {/* Changes to Terms */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">11. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these Terms at any time. We will provide notice of
                            significant changes by posting the new Terms on this page and updating the
                            "Last updated" date.
                        </p>
                        <p className="mt-4">
                            Your continued use of the Service after changes become effective constitutes
                            acceptance of the modified Terms.
                        </p>
                    </section>

                    {/* Governing Law */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">12. Governing Law & Jurisdiction</h2>
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of the
                            Republic of Croatia, without regard to its conflict of law provisions.
                        </p>
                        <p className="mt-4">
                            For EU consumers: You may also benefit from mandatory consumer protection provisions
                            of your country of residence. Any disputes shall be resolved by the competent courts
                            as determined by applicable law.
                        </p>
                    </section>

                    {/* Severability */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">13. Severability</h2>
                        <p>
                            If any provision of these Terms is found to be unenforceable or invalid, that
                            provision shall be limited or eliminated to the minimum extent necessary, and the
                            remaining provisions shall remain in full force and effect.
                        </p>
                    </section>

                    {/* Contact */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">14. Contact Us</h2>
                        <p>
                            For questions about these Terms:
                        </p>
                        <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                            <p><strong className="text-white">Velebit Ventures d.o.o.</strong></p>
                            <p>7. strasse 13</p>
                            <p>23248 Razanac, Croatia</p>
                            <p className="mt-2">
                                Email: <a href="mailto:legal@extensiovitae.com" className="text-amber-400 hover:underline">legal@extensiovitae.com</a>
                            </p>
                        </div>
                    </section>

                </div>

                {/* Footer Links */}
                <div className="mt-12 pt-8 border-t border-slate-800 flex flex-wrap gap-6">
                    <Link to="/privacy" className="text-slate-400 hover:text-amber-400 transition-colors">Privacy Policy</Link>
                    <Link to="/imprint" className="text-slate-400 hover:text-amber-400 transition-colors">Imprint</Link>
                    <Link to="/" className="text-slate-400 hover:text-amber-400 transition-colors">Home</Link>
                </div>
            </main>
        </div>
    );
}
