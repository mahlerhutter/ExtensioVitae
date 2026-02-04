/**
 * Biological Inventory & Fulfillment Bridge (v0.8.0)
 * Purpose: Smart supplement tracking with predictive depletion and reorder intelligence
 * Axiom: AX-3 Real-World Execution - Reduce cognitive load, automate supply management
 */

import { supabase } from './supabase';
import { logger } from './logger';
import { shouldUseSupabase } from './dataService';

// Supplement requirements per protocol (daily dosage)
const PROTOCOL_SUPPLEMENT_REQUIREMENTS = {
  jet_lag_west: {
    melatonin: { amount: 1, unit: 'tablets', timing: 'evening' },
    electrolytes: { amount: 2, unit: 'packets', timing: 'morning' },
    magnesium: { amount: 1, unit: 'capsules', timing: 'evening' }
  },
  jet_lag_east: {
    melatonin: { amount: 1, unit: 'tablets', timing: 'evening' },
    vitamin_d3: { amount: 1, unit: 'capsules', timing: 'morning' },
    electrolytes: { amount: 2, unit: 'packets', timing: 'morning' }
  },
  immune_shield: {
    vitamin_c: { amount: 2, unit: 'capsules', timing: 'morning' },
    zinc: { amount: 1, unit: 'tablets', timing: 'morning' },
    vitamin_d3: { amount: 1, unit: 'capsules', timing: 'morning' }
  },
  deep_recovery: {
    magnesium: { amount: 2, unit: 'capsules', timing: 'evening' },
    collagen: { amount: 1, unit: 'scoops', timing: 'morning' },
    omega_3: { amount: 2, unit: 'capsules', timing: 'morning' }
  },
  cognitive_peak: {
    omega_3: { amount: 2, unit: 'capsules', timing: 'morning' },
    b_complex: { amount: 1, unit: 'capsules', timing: 'morning' },
    magnesium: { amount: 1, unit: 'capsules', timing: 'evening' }
  },
  gut_reset: {
    probiotics: { amount: 1, unit: 'capsules', timing: 'morning' },
    zinc: { amount: 1, unit: 'tablets', timing: 'morning' },
    collagen: { amount: 1, unit: 'scoops', timing: 'morning' }
  }
};

// Common supplement mapping
const SUPPLEMENT_DISPLAY_NAMES = {
  magnesium: 'Magnesium',
  vitamin_d3: 'Vitamin D3',
  omega_3: 'Omega-3',
  zinc: 'Zink',
  vitamin_c: 'Vitamin C',
  b_complex: 'B-Komplex',
  probiotics: 'Probiotika',
  melatonin: 'Melatonin',
  electrolytes: 'Elektrolyte',
  collagen: 'Kollagen'
};

/**
 * Get user's supplement inventory
 */
export async function getUserInventory(userId) {
  try {
    if (!await shouldUseSupabase()) {
      // Fallback to localStorage
      const stored = localStorage.getItem(`inventory_${userId}`);
      return stored ? JSON.parse(stored) : [];
    }

    const { data, error } = await supabase
      .from('user_supplement_inventory')
      .select('*')
      .eq('user_id', userId)
      .order('supplement_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('[Inventory] Failed to fetch inventory:', error);
    return [];
  }
}

/**
 * Update supplement stock
 */
export async function updateSupplementStock(userId, supplementSlug, newStock) {
  try {
    if (!await shouldUseSupabase()) {
      const inventory = await getUserInventory(userId);
      const updated = inventory.map(item =>
        item.supplement_slug === supplementSlug
          ? { ...item, current_stock: newStock, last_updated: new Date().toISOString() }
          : item
      );
      localStorage.setItem(`inventory_${userId}`, JSON.stringify(updated));
      return { success: true };
    }

    const { error } = await supabase
      .from('user_supplement_inventory')
      .update({ current_stock: newStock })
      .eq('user_id', userId)
      .eq('supplement_slug', supplementSlug);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    logger.error('[Inventory] Failed to update stock:', error);
    return { success: false, error };
  }
}

/**
 * Calculate daily consumption based on active protocols
 */
export function calculateDailyConsumption(activeProtocols = []) {
  const consumption = {};

  activeProtocols.forEach(protocol => {
    const requirements = PROTOCOL_SUPPLEMENT_REQUIREMENTS[protocol.protocol_id];
    if (!requirements) return;

    Object.entries(requirements).forEach(([supplement, req]) => {
      if (!consumption[supplement]) {
        consumption[supplement] = { amount: 0, unit: req.unit };
      }
      consumption[supplement].amount += req.amount;
    });
  });

  return consumption;
}

/**
 * Calculate depletion date based on current stock and consumption rate
 */
export function calculateDepletionDate(currentStock, dailyConsumption, complianceRate = 0.8) {
  if (dailyConsumption <= 0) return null;

  // Adjust for actual compliance (default 80% - users don't always take everything)
  const effectiveConsumption = dailyConsumption * complianceRate;
  const daysRemaining = Math.floor(currentStock / effectiveConsumption);

  if (daysRemaining <= 0) return new Date(); // Already depleted

  const depletionDate = new Date();
  depletionDate.setDate(depletionDate.getDate() + daysRemaining);
  return depletionDate;
}

/**
 * Get inventory status with depletion predictions
 */
export async function getInventoryStatus(userId, activeProtocols = []) {
  try {
    const inventory = await getUserInventory(userId);
    const dailyConsumption = calculateDailyConsumption(activeProtocols);

    const status = inventory.map(item => {
      const consumption = dailyConsumption[item.supplement_slug];
      const consumptionRate = consumption ? consumption.amount : item.daily_consumption_rate;

      const depletionDate = calculateDepletionDate(
        item.current_stock,
        consumptionRate,
        0.8 // 80% compliance assumption
      );

      const daysRemaining = depletionDate
        ? Math.ceil((depletionDate - new Date()) / (1000 * 60 * 60 * 24))
        : null;

      // Status levels
      let statusLevel = 'ok'; // ok, warning, critical, depleted
      if (daysRemaining === null) {
        statusLevel = 'unknown';
      } else if (daysRemaining <= 0) {
        statusLevel = 'depleted';
      } else if (daysRemaining <= 3) {
        statusLevel = 'critical';
      } else if (daysRemaining <= item.reorder_threshold) {
        statusLevel = 'warning';
      }

      return {
        ...item,
        daily_consumption: consumptionRate,
        depletion_date: depletionDate,
        days_remaining: daysRemaining,
        status: statusLevel,
        display_name: SUPPLEMENT_DISPLAY_NAMES[item.supplement_slug] || item.supplement_name
      };
    });

    return status;
  } catch (error) {
    logger.error('[Inventory] Failed to get inventory status:', error);
    return [];
  }
}

/**
 * Check if protocol requirements are fulfilled
 */
export async function checkProtocolFulfillment(userId, protocolId) {
  try {
    const requirements = PROTOCOL_SUPPLEMENT_REQUIREMENTS[protocolId];
    if (!requirements) {
      return { fulfilled: true, missing: [], warnings: [] };
    }

    const inventory = await getUserInventory(userId);
    const missing = [];
    const warnings = [];

    Object.entries(requirements).forEach(([supplementSlug, req]) => {
      const item = inventory.find(i => i.supplement_slug === supplementSlug);

      if (!item || item.current_stock <= 0) {
        missing.push({
          supplement: SUPPLEMENT_DISPLAY_NAMES[supplementSlug] || supplementSlug,
          needed: req.amount,
          unit: req.unit
        });
      } else {
        // Check if there's enough for at least 3 days
        const daysOfSupply = item.current_stock / req.amount;
        if (daysOfSupply < 3) {
          warnings.push({
            supplement: SUPPLEMENT_DISPLAY_NAMES[supplementSlug] || supplementSlug,
            days_remaining: Math.floor(daysOfSupply),
            current_stock: item.current_stock
          });
        }
      }
    });

    return {
      fulfilled: missing.length === 0,
      missing,
      warnings
    };
  } catch (error) {
    logger.error('[Inventory] Failed to check protocol fulfillment:', error);
    return { fulfilled: false, missing: [], warnings: [], error };
  }
}

/**
 * Log supplement consumption
 */
export async function logConsumption(userId, supplementSlug, amount, protocolId = null) {
  try {
    if (!await shouldUseSupabase()) {
      // Just update local inventory
      const inventory = await getUserInventory(userId);
      const updated = inventory.map(item =>
        item.supplement_slug === supplementSlug
          ? { ...item, current_stock: Math.max(0, item.current_stock - amount) }
          : item
      );
      localStorage.setItem(`inventory_${userId}`, JSON.stringify(updated));
      return { success: true };
    }

    // Log consumption
    const { error: logError } = await supabase
      .from('supplement_consumption_log')
      .insert({
        user_id: userId,
        supplement_slug: supplementSlug,
        consumed_amount: amount,
        protocol_id: protocolId,
        compliance: true
      });

    if (logError) throw logError;

    // Update inventory stock
    const { data: current } = await supabase
      .from('user_supplement_inventory')
      .select('current_stock')
      .eq('user_id', userId)
      .eq('supplement_slug', supplementSlug)
      .single();

    if (current) {
      await supabase
        .from('user_supplement_inventory')
        .update({ current_stock: Math.max(0, current.current_stock - amount) })
        .eq('user_id', userId)
        .eq('supplement_slug', supplementSlug);
    }

    return { success: true };
  } catch (error) {
    logger.error('[Inventory] Failed to log consumption:', error);
    return { success: false, error };
  }
}

/**
 * Generate reorder list with smart suggestions
 */
export async function generateReorderList(userId, activeProtocols = []) {
  try {
    const status = await getInventoryStatus(userId, activeProtocols);

    // Filter items that need reordering
    const needsReorder = status.filter(item =>
      item.status === 'critical' || item.status === 'warning' || item.status === 'depleted'
    );

    // Calculate suggested order quantities (30-day supply)
    const reorderList = needsReorder.map(item => {
      const dailyConsumption = item.daily_consumption || 1;
      const suggestedQuantity = Math.ceil(dailyConsumption * 30); // 30-day supply

      return {
        supplement: item.display_name,
        supplement_slug: item.supplement_slug,
        current_stock: item.current_stock,
        days_remaining: item.days_remaining,
        daily_consumption: dailyConsumption,
        suggested_quantity: suggestedQuantity,
        unit: item.dosage_unit,
        urgency: item.status,
        needed_by: item.depletion_date
      };
    });

    // Sort by urgency
    const urgencyOrder = { depleted: 0, critical: 1, warning: 2 };
    reorderList.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return reorderList;
  } catch (error) {
    logger.error('[Inventory] Failed to generate reorder list:', error);
    return [];
  }
}

/**
 * Create reorder message for WhatsApp/Email
 */
export function generateReorderMessage(reorderList, userName = 'Nutzer') {
  if (reorderList.length === 0) {
    return null;
  }

  const urgentItems = reorderList.filter(item => item.urgency === 'critical' || item.urgency === 'depleted');
  const normalItems = reorderList.filter(item => item.urgency === 'warning');

  let message = `🔬 *Supplement Nachbestellung*\n\n`;
  message += `Hallo, hier ist die automatische Bestellung für ${userName}:\n\n`;

  if (urgentItems.length > 0) {
    message += `🚨 *DRINGEND* (≤3 Tage):\n`;
    urgentItems.forEach(item => {
      message += `• ${item.supplement}: ${item.suggested_quantity} ${item.unit}`;
      if (item.days_remaining <= 0) {
        message += ` (LEER!)`;
      } else {
        message += ` (noch ${item.days_remaining} Tage)`;
      }
      message += `\n`;
    });
    message += `\n`;
  }

  if (normalItems.length > 0) {
    message += `⚠️ *Vorsorglich nachbestellen*:\n`;
    normalItems.forEach(item => {
      message += `• ${item.supplement}: ${item.suggested_quantity} ${item.unit} (noch ${item.days_remaining} Tage)\n`;
    });
    message += `\n`;
  }

  message += `📊 Basierend auf aktuellem Protokoll-Plan\n`;
  message += `📅 Generiert: ${new Date().toLocaleDateString('de-DE')}\n\n`;
  message += `Bitte bis zum ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')} liefern.\n\n`;
  message += `Danke! 🙏`;

  return message;
}

/**
 * Log reorder request
 */
export async function logReorder(userId, reorderList, method = 'whatsapp') {
  try {
    if (!await shouldUseSupabase()) {
      return { success: true };
    }

    const expectedArrival = new Date();
    expectedArrival.setDate(expectedArrival.getDate() + 3); // 3 days delivery

    const promises = reorderList.map(item =>
      supabase.from('supplement_reorder_log').insert({
        user_id: userId,
        supplement_slug: item.supplement_slug,
        ordered_quantity: item.suggested_quantity,
        expected_arrival: expectedArrival.toISOString(),
        fulfillment_method: method
      })
    );

    await Promise.all(promises);
    return { success: true };
  } catch (error) {
    logger.error('[Inventory] Failed to log reorder:', error);
    return { success: false, error };
  }
}

/**
 * Initialize default inventory for new user
 */
export async function initializeInventory(userId) {
  try {
    if (!await shouldUseSupabase()) {
      const defaultInventory = Object.entries(SUPPLEMENT_DISPLAY_NAMES).map(([slug, name]) => ({
        supplement_slug: slug,
        supplement_name: name,
        dosage_unit: 'capsules',
        current_stock: 0,
        daily_consumption_rate: 0,
        reorder_threshold: 7,
        last_updated: new Date().toISOString()
      }));
      localStorage.setItem(`inventory_${userId}`, JSON.stringify(defaultInventory));
      return { success: true };
    }

    // Check if already initialized
    const { data: existing } = await supabase
      .from('user_supplement_inventory')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existing && existing.length > 0) {
      return { success: true, message: 'Already initialized' };
    }

    // Initialize with defaults
    const defaultInventory = Object.entries(SUPPLEMENT_DISPLAY_NAMES).map(([slug, name]) => ({
      user_id: userId,
      supplement_slug: slug,
      supplement_name: name,
      dosage_unit: slug === 'collagen' ? 'scoops' : slug === 'electrolytes' ? 'packets' : 'capsules',
      current_stock: 0,
      daily_consumption_rate: 0,
      reorder_threshold: 7
    }));

    const { error } = await supabase
      .from('user_supplement_inventory')
      .insert(defaultInventory);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    logger.error('[Inventory] Failed to initialize inventory:', error);
    return { success: false, error };
  }
}
