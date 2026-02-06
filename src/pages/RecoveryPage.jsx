import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import RecoveryDashboard from '../components/dashboard/RecoveryDashboard';
import WearableConnections from '../components/dashboard/WearableConnections';
import SmartTaskRecommendation from '../components/dashboard/SmartTaskRecommendation';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function RecoveryPage() {
    useDocumentTitle('Recovery & Performance - ExtensioVitae');
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect if not authenticated
    React.useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
            <DashboardHeader />

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Recovery & Performance
                    </h1>
                    <p className="text-gray-600">
                        Track your recovery metrics and optimize your performance
                    </p>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Recovery Dashboard (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        <RecoveryDashboard />
                    </div>

                    {/* Right Column: Actions & Connections (1/3 width) */}
                    <div className="space-y-6">
                        <SmartTaskRecommendation />
                        <WearableConnections />
                    </div>
                </div>
            </div>
        </div>
    );
}
