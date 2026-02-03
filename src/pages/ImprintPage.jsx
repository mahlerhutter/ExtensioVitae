import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function ImprintPage() {
    useDocumentTitle('Imprint & Contact - ExtensioVitae');

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
                <h1 className="text-3xl md:text-4xl font-semibold text-white mb-8">
                    Imprint & Contact
                </h1>

                <div className="grid md:grid-cols-2 gap-8">

                    {/* Impressum */}
                    <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Impressum (Legal Notice)
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Company Name</p>
                                <p className="text-white font-medium">Velebit Ventures d.o.o.</p>
                            </div>

                            <div>
                                <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Registered Address</p>
                                <p className="text-white">7. strasse 13</p>
                                <p className="text-white">23248 Razanac</p>
                                <p className="text-white">Croatia</p>
                            </div>

                            <div>
                                <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Legal Form</p>
                                <p className="text-white">d.o.o. (Limited Liability Company)</p>
                            </div>

                            <div>
                                <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Country</p>
                                <p className="text-white">Croatia (EU Member State)</p>
                            </div>
                        </div>
                    </section>

                    {/* Contact */}
                    <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Contact
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">General Inquiries</p>
                                <a href="mailto:hello@extensiovitae.com" className="text-amber-400 hover:underline">
                                    hello@extensiovitae.com
                                </a>
                            </div>

                            <div>
                                <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Privacy & Data Protection</p>
                                <a href="mailto:privacy@extensiovitae.com" className="text-amber-400 hover:underline">
                                    privacy@extensiovitae.com
                                </a>
                            </div>

                            <div>
                                <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Legal & Terms</p>
                                <a href="mailto:legal@extensiovitae.com" className="text-amber-400 hover:underline">
                                    legal@extensiovitae.com
                                </a>
                            </div>

                            <div>
                                <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Support</p>
                                <a href="mailto:support@extensiovitae.com" className="text-amber-400 hover:underline">
                                    support@extensiovitae.com
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* Responsible for Content */}
                    <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Responsible for Content
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">According to § 55 Abs. 2 RStV (Germany) / Media Act</p>
                                <p className="text-white">Velebit Ventures d.o.o.</p>
                                <p className="text-white">7. strasse 13</p>
                                <p className="text-white">23248 Razanac, Croatia</p>
                            </div>
                        </div>
                    </section>

                    {/* EU Dispute Resolution */}
                    <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                            EU Dispute Resolution
                        </h2>

                        <div className="space-y-4">
                            <p>
                                The European Commission provides a platform for online dispute resolution (ODR):
                            </p>
                            <a
                                href="https://ec.europa.eu/consumers/odr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-400 hover:underline block"
                            >
                                https://ec.europa.eu/consumers/odr
                            </a>
                            <p className="text-slate-400 text-sm">
                                We are not obliged and generally not willing to participate in dispute
                                resolution proceedings before a consumer arbitration board.
                            </p>
                        </div>
                    </section>

                </div>

                {/* Disclaimer */}
                <section className="mt-12 p-6 bg-slate-800/30 rounded-xl border border-slate-700">
                    <h2 className="text-xl font-semibold text-white mb-4">Disclaimer</h2>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-white font-medium mb-2">Liability for Content</h3>
                            <p className="text-sm">
                                The contents of our pages were created with the greatest care. However, we cannot
                                guarantee the accuracy, completeness, or timeliness of the content. As a service
                                provider, we are responsible for our own content on these pages according to
                                general laws. However, we are not obligated to monitor transmitted or stored
                                third-party information or to investigate circumstances that indicate illegal activity.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-white font-medium mb-2">Liability for Links</h3>
                            <p className="text-sm">
                                Our website contains links to external third-party websites over whose content we
                                have no influence. Therefore, we cannot assume any liability for these external
                                contents. The respective provider or operator of the pages is always responsible
                                for the contents of the linked pages.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-white font-medium mb-2">Copyright</h3>
                            <p className="text-sm">
                                The content and works created by the site operators on these pages are subject to
                                copyright law. Duplication, processing, distribution, and any kind of exploitation
                                outside the limits of copyright require the written consent of the respective
                                author or creator.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Footer Links */}
                <div className="mt-12 pt-8 border-t border-slate-800 flex flex-wrap gap-6">
                    <Link to="/privacy" className="text-slate-400 hover:text-amber-400 transition-colors">Privacy Policy</Link>
                    <Link to="/terms" className="text-slate-400 hover:text-amber-400 transition-colors">Terms of Service</Link>
                    <Link to="/" className="text-slate-400 hover:text-amber-400 transition-colors">Home</Link>
                </div>
            </main>
        </div>
    );
}
