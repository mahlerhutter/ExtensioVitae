/**
 * Biological Supplies Widget (v0.8.0)
 * Purpose: Supply Chain Dashboard for supplement inventory
 * Design: High-end logistics / medical lab aesthetic
 * Axiom: AX-3 Real-World Execution - Reduce cognitive load
 */

import React, { useState, useEffect } from 'react';
import {
  getInventoryStatus,
  generateReorderList,
  generateReorderMessage,
  logReorder,
  updateSupplementStock,
  initializeInventory
} from '../../lib/inventoryService';
import { logger } from '../../lib/logger';

export default function BiologicalSuppliesWidget({ userId, activeProtocols = [], onReorderComplete }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderList, setReorderList] = useState([]);
  const [expanded, setExpanded] = useState(true);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editStock, setEditStock] = useState(0);

  useEffect(() => {
    if (userId) {
      loadInventory();
    }
  }, [userId, activeProtocols]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      let status = await getInventoryStatus(userId, activeProtocols);

      // Auto-initialize if inventory is empty (first time user)
      if (status.length === 0) {
        logger.info('[BiologicalSupplies] Inventory empty, initializing...');
        await initializeInventory(userId);
        // Reload after initialization
        status = await getInventoryStatus(userId, activeProtocols);
      }

      setInventory(status);
      logger.info('[BiologicalSupplies] Inventory loaded:', status.length, 'items');
    } catch (error) {
      logger.error('[BiologicalSupplies] Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartRefill = async () => {
    const list = await generateReorderList(userId, activeProtocols);
    setReorderList(list);
    setShowReorderModal(true);
  };

  const handleConfirmReorder = async (method = 'whatsapp') => {
    const message = generateReorderMessage(reorderList);

    // Log reorder
    await logReorder(userId, reorderList, method);

    if (method === 'whatsapp') {
      // Open WhatsApp with pre-filled message
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    } else if (method === 'email') {
      // Open email client
      const subject = encodeURIComponent('Supplement Nachbestellung');
      const body = encodeURIComponent(message);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }

    setShowReorderModal(false);
    if (onReorderComplete) onReorderComplete();
  };

  const handleEditStock = (item) => {
    setEditingItem(item);
    setEditStock(item.current_stock);
    setShowEditModal(true);
  };

  const handleSaveStock = async () => {
    if (!editingItem) return;

    try {
      await updateSupplementStock(userId, editingItem.supplement_slug, editStock);
      logger.info('[BiologicalSupplies] Stock updated:', editingItem.supplement_slug, editStock);

      // Reload inventory
      await loadInventory();

      setShowEditModal(false);
      setEditingItem(null);
    } catch (error) {
      logger.error('[BiologicalSupplies] Failed to update stock:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'depleted': return 'bg-red-500';
      case 'critical': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      case 'ok': return 'bg-emerald-500';
      default: return 'bg-slate-600';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'depleted': return 'text-red-400';
      case 'critical': return 'text-orange-400';
      case 'warning': return 'text-yellow-400';
      case 'ok': return 'text-emerald-400';
      default: return 'text-slate-400';
    }
  };

  const criticalItems = inventory.filter(item =>
    item.status === 'critical' || item.status === 'depleted'
  );

  const warningItems = inventory.filter(item => item.status === 'warning');

  // Calculate supply health score
  const healthScore = inventory.length > 0
    ? Math.round((inventory.filter(i => i.status === 'ok').length / inventory.length) * 100)
    : 100;

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
          <div className="h-20 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {/* Header - Medical Lab Aesthetic */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔬</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                  Biological Supplies
                </h3>
                <p className="text-slate-400 text-xs font-mono">
                  Supply Chain Status: {healthScore}% Operational
                </p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg
                className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalItems.length > 0 && (
          <div className="bg-red-950/30 border-b border-red-900/50 px-5 py-3">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-400 text-sm font-medium">
                  Kritische Versorgungslücke erkannt
                </p>
                <p className="text-red-400/70 text-xs mt-1">
                  {criticalItems.map(item => item.display_name).join(', ')} - Sofortiger Nachschub erforderlich
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Supply Status Bars */}
        <div className="p-5 space-y-3">
          {inventory.slice(0, expanded ? undefined : 5).map((item) => {
            const fillPercentage = item.days_remaining
              ? Math.min(100, (item.days_remaining / 30) * 100)
              : 0;

            return (
              <div key={item.supplement_slug} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm font-medium">
                    {item.display_name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono ${getStatusTextColor(item.status)}`}>
                      {item.days_remaining !== null
                        ? item.days_remaining === 0
                          ? 'LEER'
                          : `${item.days_remaining}d`
                        : 'N/A'}
                    </span>
                    <button
                      onClick={() => handleEditStock(item)}
                      className="flex items-center gap-1 text-slate-500 hover:text-cyan-400 text-xs font-mono transition-colors group"
                      title="Bestand bearbeiten"
                    >
                      <span>{item.current_stock} {item.dosage_unit}</span>
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress Bar - Logistics Style */}
                <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${getStatusColor(item.status)} transition-all duration-300`}
                    style={{ width: `${fillPercentage}%` }}
                  />
                  {/* Grid overlay for technical look */}
                  <div className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 5px)'
                    }}
                  />
                </div>

                {/* Daily Consumption Rate */}
                {item.daily_consumption > 0 && (
                  <p className="text-slate-500 text-xs font-mono">
                    Verbrauch: -{item.daily_consumption} {item.dosage_unit}/Tag
                  </p>
                )}
              </div>
            );
          })}

          {!expanded && inventory.length > 5 && (
            <button
              onClick={() => setExpanded(true)}
              className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors font-medium mt-2"
            >
              + {inventory.length - 5} weitere Supplements
            </button>
          )}
        </div>

        {/* Smart Refill Button */}
        {(criticalItems.length > 0 || warningItems.length > 0) && (
          <div className="border-t border-slate-800 px-5 py-4 bg-slate-900/50">
            <button
              onClick={handleSmartRefill}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold rounded-lg transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Smart Refill - Nachschub planen
            </button>
          </div>
        )}
      </div>

      {/* Reorder Modal */}
      {showReorderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl">
            {/* Modal Header */}
            <div className="border-b border-slate-800 px-6 py-4">
              <h3 className="text-white font-semibold text-lg">Intelligente Nachbestellung</h3>
              <p className="text-slate-400 text-sm mt-1">
                Basierend auf deinem Protokoll-Plan und aktuellem Verbrauch
              </p>
            </div>

            {/* Reorder List */}
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {reorderList.map((item, idx) => (
                <div
                  key={idx}
                  className={`bg-slate-800/50 border ${item.urgency === 'critical' || item.urgency === 'depleted'
                      ? 'border-red-500/30'
                      : 'border-slate-700'
                    } rounded-lg p-4`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium">{item.supplement}</h4>
                        {(item.urgency === 'critical' || item.urgency === 'depleted') && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
                            DRINGEND
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-slate-400">
                        <p>Aktueller Bestand: {item.current_stock} {item.unit}</p>
                        <p>Verbrauch: {item.daily_consumption} {item.unit}/Tag</p>
                        {item.days_remaining !== null && (
                          <p className={item.days_remaining <= 3 ? 'text-red-400 font-medium' : ''}>
                            Noch {item.days_remaining} Tage
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {item.suggested_quantity}
                      </p>
                      <p className="text-slate-400 text-sm">{item.unit}</p>
                      <p className="text-slate-500 text-xs mt-1">(30-Tage Vorrat)</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="border-t border-slate-800 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowReorderModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleConfirmReorder('email')}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Per Email
              </button>
              <button
                onClick={() => handleConfirmReorder('whatsapp')}
                className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Per WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl">
            {/* Modal Header */}
            <div className="border-b border-slate-800 px-6 py-4">
              <h3 className="text-white font-semibold text-lg">Bestand aktualisieren</h3>
              <p className="text-slate-400 text-sm mt-1">
                {editingItem.display_name}
              </p>
            </div>

            {/* Edit Form */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Current Stock Display */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">Aktueller Bestand</p>
                  <p className="text-white text-2xl font-bold">
                    {editingItem.current_stock} {editingItem.dosage_unit}
                  </p>
                  {editingItem.days_remaining !== null && (
                    <p className={`text-xs mt-2 ${getStatusTextColor(editingItem.status)}`}>
                      Noch {editingItem.days_remaining} Tage bei aktuellem Verbrauch
                    </p>
                  )}
                </div>

                {/* Stock Input */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Neuer Bestand
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={editStock}
                      onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      {editingItem.dosage_unit}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setEditStock(prev => Math.max(0, prev + 10))}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-all border border-slate-700"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => setEditStock(prev => Math.max(0, prev + 30))}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-all border border-slate-700"
                  >
                    +30
                  </button>
                  <button
                    onClick={() => setEditStock(prev => Math.max(0, prev + 60))}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-all border border-slate-700"
                  >
                    +60
                  </button>
                </div>

                {/* Info Note */}
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                  <p className="text-cyan-400 text-xs leading-relaxed">
                    💡 Tipp: Nach dem Kauf von Supplements den Bestand hier aktualisieren,
                    damit das System den Verbrauch korrekt berechnen kann.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-slate-800 px-6 py-4 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveStock}
                className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
