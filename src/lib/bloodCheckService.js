/**
 * ExtensioVitae Blood Check Service
 *
 * Manages blood test results, OCR parsing, and recommendations.
 * Part of Phase 3: Advanced Features
 */

import { supabase } from './supabase';

// =====================================================
// LAB RESULTS MANAGEMENT
// =====================================================

/**
 * Get user's lab results history
 * @param {string} userId - User ID
 * @param {number} limit - Max results
 * @returns {Promise<Array>}
 */
export async function getLabResults(userId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('lab_results')
      .select('*')
      .eq('user_id', userId)
      .order('lab_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching lab results:', error);
    return [];
  }
}

/**
 * Get a single lab result with biomarker analysis
 * @param {string} labId - Lab result ID
 * @returns {Promise<Object|null>}
 */
export async function getLabResultWithAnalysis(labId) {
  try {
    const { data: labResult, error } = await supabase
      .from('lab_results')
      .select('*')
      .eq('id', labId)
      .single();

    if (error) throw error;

    // Get biomarker references for analysis
    const biomarkerCodes = Object.keys(labResult.biomarkers || {});
    if (biomarkerCodes.length === 0) {
      return { ...labResult, analysis: [] };
    }

    const { data: references } = await supabase
      .from('biomarker_references')
      .select('*')
      .in('code', biomarkerCodes);

    // Analyze each biomarker
    const analysis = analyzeBiomarkers(labResult.biomarkers, references || []);

    return { ...labResult, analysis };
  } catch (error) {
    console.error('Error fetching lab result:', error);
    return null;
  }
}

/**
 * Save a new lab result
 * @param {string} userId - User ID
 * @param {Object} labData - Lab data
 * @returns {Promise<Object>}
 */
export async function saveLabResult(userId, labData) {
  try {
    const { data, error } = await supabase
      .from('lab_results')
      .insert({
        user_id: userId,
        lab_date: labData.labDate,
        lab_provider: labData.provider,
        biomarkers: labData.biomarkers || {},
        raw_file_url: labData.fileUrl,
        verification_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Generate recommendations
    const recommendations = await generateRecommendations(userId, data.biomarkers);

    // Update with recommendations
    await supabase
      .from('lab_results')
      .update({ recommendations })
      .eq('id', data.id);

    return { success: true, labResult: { ...data, recommendations } };
  } catch (error) {
    console.error('Error saving lab result:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// OCR & PARSING
// =====================================================

/**
 * Parse lab report from image/PDF using OCR
 * Uses Claude Vision for intelligent parsing
 * @param {File} file - Image or PDF file
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function parseLabReport(file, userId) {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    const fileType = file.type;

    // Create pending lab result
    const { data: labResult, error: createError } = await supabase
      .from('lab_results')
      .insert({
        user_id: userId,
        lab_date: new Date().toISOString().split('T')[0],
        parsing_status: 'processing',
        source_file_type: fileType,
        ocr_provider: 'claude'
      })
      .select()
      .single();

    if (createError) throw createError;

    // Call Edge Function for OCR processing
    const { data: ocrResult, error: ocrError } = await supabase.functions.invoke('parse-lab-report', {
      body: {
        labResultId: labResult.id,
        fileBase64: base64,
        fileType: fileType
      }
    });

    if (ocrError) {
      // Update status to failed
      await supabase
        .from('lab_results')
        .update({
          parsing_status: 'failed',
          parsing_errors: [{ message: ocrError.message, timestamp: new Date().toISOString() }]
        })
        .eq('id', labResult.id);

      throw ocrError;
    }

    return {
      success: true,
      labResultId: labResult.id,
      parsedData: ocrResult
    };
  } catch (error) {
    console.error('Error parsing lab report:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Manually enter biomarker values
 * @param {string} labId - Lab result ID
 * @param {Object} biomarkers - Biomarker values { code: value }
 * @returns {Promise<Object>}
 */
export async function updateBiomarkers(labId, biomarkers) {
  try {
    const { data, error } = await supabase
      .from('lab_results')
      .update({
        biomarkers,
        verification_status: 'verified',
        verified_at: new Date().toISOString()
      })
      .eq('id', labId)
      .select()
      .single();

    if (error) throw error;

    // Generate fresh recommendations
    const recommendations = await generateRecommendations(data.user_id, biomarkers);

    await supabase
      .from('lab_results')
      .update({ recommendations })
      .eq('id', labId);

    return { success: true, labResult: { ...data, recommendations } };
  } catch (error) {
    console.error('Error updating biomarkers:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// BIOMARKER ANALYSIS
// =====================================================

/**
 * Get all biomarker references
 * @returns {Promise<Array>}
 */
export async function getBiomarkerReferences() {
  try {
    const { data, error } = await supabase
      .from('biomarker_references')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching biomarker references:', error);
    return [];
  }
}

/**
 * Analyze biomarkers against reference ranges
 * @param {Object} biomarkers - User's biomarker values
 * @param {Array} references - Biomarker references
 * @returns {Array}
 */
function analyzeBiomarkers(biomarkers, references) {
  const analysis = [];

  for (const ref of references) {
    const value = biomarkers[ref.code];
    if (value === undefined || value === null) continue;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) continue;

    let status = 'optimal';
    let statusLevel = 0; // 0=optimal, 1=normal, 2=suboptimal, 3=out_of_range

    // Check against ranges
    if (ref.optimal_min !== null && ref.optimal_max !== null) {
      if (numValue >= ref.optimal_min && numValue <= ref.optimal_max) {
        status = 'optimal';
        statusLevel = 0;
      } else if (numValue >= ref.normal_min && numValue <= ref.normal_max) {
        status = 'normal';
        statusLevel = 1;
      } else if (numValue < ref.normal_min) {
        status = 'low';
        statusLevel = numValue < ref.optimal_min ? 3 : 2;
      } else {
        status = 'high';
        statusLevel = numValue > ref.normal_max ? 3 : 2;
      }
    }

    analysis.push({
      code: ref.code,
      name_de: ref.name_de,
      name_en: ref.name_en,
      category: ref.category,
      value: numValue,
      unit: ref.unit,
      status,
      statusLevel,
      optimalRange: { min: ref.optimal_min, max: ref.optimal_max },
      normalRange: { min: ref.normal_min, max: ref.normal_max },
      recommendations: status === 'low' ? ref.low_recommendations :
                       status === 'high' ? ref.high_recommendations : []
    });
  }

  // Sort by status level (worst first)
  return analysis.sort((a, b) => b.statusLevel - a.statusLevel);
}

/**
 * Generate personalized recommendations based on lab results
 * @param {string} userId - User ID
 * @param {Object} biomarkers - Biomarker values
 * @returns {Promise<Array>}
 */
async function generateRecommendations(userId, biomarkers) {
  try {
    const references = await getBiomarkerReferences();
    const analysis = analyzeBiomarkers(biomarkers, references);

    const recommendations = [];
    const deficiencies = [];

    for (const item of analysis) {
      if (item.status === 'low' || item.status === 'high') {
        deficiencies.push({
          code: item.code,
          name_de: item.name_de,
          status: item.status,
          value: item.value,
          unit: item.unit
        });

        // Add recommendations
        for (const rec of item.recommendations) {
          recommendations.push({
            priority: item.statusLevel >= 3 ? 'high' : 'medium',
            biomarker: item.code,
            text_de: rec.de,
            text_en: rec.en,
            category: item.category
          });
        }
      }
    }

    // Update deficiencies in lab result
    const { data: labResults } = await supabase
      .from('lab_results')
      .select('id')
      .eq('user_id', userId)
      .order('lab_date', { ascending: false })
      .limit(1);

    if (labResults?.[0]) {
      await supabase
        .from('lab_results')
        .update({ deficiencies })
        .eq('id', labResults[0].id);
    }

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

/**
 * Get deficiencies for blood check module
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function getDeficiencies(userId) {
  try {
    const { data, error } = await supabase
      .from('lab_results')
      .select('deficiencies, lab_date')
      .eq('user_id', userId)
      .order('lab_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.deficiencies || [];
  } catch (error) {
    console.error('Error fetching deficiencies:', error);
    return [];
  }
}

/**
 * Compare two lab results to show progress
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>}
 */
export async function compareLatestResults(userId) {
  try {
    const { data: results, error } = await supabase
      .from('lab_results')
      .select('*')
      .eq('user_id', userId)
      .eq('verification_status', 'verified')
      .order('lab_date', { ascending: false })
      .limit(2);

    if (error) throw error;
    if (!results || results.length < 2) return null;

    const [latest, previous] = results;
    const references = await getBiomarkerReferences();

    const comparison = [];
    const allCodes = new Set([
      ...Object.keys(latest.biomarkers || {}),
      ...Object.keys(previous.biomarkers || {})
    ]);

    for (const code of allCodes) {
      const latestValue = latest.biomarkers?.[code];
      const previousValue = previous.biomarkers?.[code];
      const ref = references.find(r => r.code === code);

      if (!ref) continue;

      const change = latestValue && previousValue
        ? ((latestValue - previousValue) / previousValue * 100).toFixed(1)
        : null;

      let trend = 'stable';
      if (change) {
        if (parseFloat(change) > 5) trend = 'up';
        else if (parseFloat(change) < -5) trend = 'down';
      }

      // Determine if trend is good or bad
      let trendQuality = 'neutral';
      if (trend !== 'stable' && latestValue !== undefined) {
        const latestAnalysis = analyzeBiomarkers({ [code]: latestValue }, [ref])[0];
        const previousAnalysis = previousValue
          ? analyzeBiomarkers({ [code]: previousValue }, [ref])[0]
          : null;

        if (latestAnalysis && previousAnalysis) {
          trendQuality = latestAnalysis.statusLevel < previousAnalysis.statusLevel
            ? 'improved'
            : latestAnalysis.statusLevel > previousAnalysis.statusLevel
              ? 'declined'
              : 'neutral';
        }
      }

      comparison.push({
        code,
        name_de: ref.name_de,
        name_en: ref.name_en,
        unit: ref.unit,
        latestValue,
        previousValue,
        change,
        trend,
        trendQuality,
        latestDate: latest.lab_date,
        previousDate: previous.lab_date
      });
    }

    return {
      latest: { id: latest.id, date: latest.lab_date },
      previous: { id: previous.id, date: previous.lab_date },
      comparison: comparison.filter(c => c.latestValue !== undefined || c.previousValue !== undefined)
    };
  } catch (error) {
    console.error('Error comparing results:', error);
    return null;
  }
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Convert file to base64
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Check if user needs a blood check
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function checkBloodCheckDue(userId) {
  try {
    const { data, error } = await supabase
      .from('lab_results')
      .select('lab_date')
      .eq('user_id', userId)
      .order('lab_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return {
        isDue: true,
        daysSinceLastCheck: null,
        message_de: 'Noch kein Blutbild hochgeladen',
        message_en: 'No blood panel uploaded yet'
      };
    }

    const lastDate = new Date(data.lab_date);
    const today = new Date();
    const daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    // Recommend every 90 days
    const isDue = daysSince >= 90;

    return {
      isDue,
      daysSinceLastCheck: daysSince,
      lastCheckDate: data.lab_date,
      message_de: isDue
        ? `Letztes Blutbild vor ${daysSince} Tagen — Zeit für ein neues!`
        : `Letztes Blutbild vor ${daysSince} Tagen`,
      message_en: isDue
        ? `Last blood panel ${daysSince} days ago — time for a new one!`
        : `Last blood panel ${daysSince} days ago`
    };
  } catch (error) {
    console.error('Error checking blood check status:', error);
    return { isDue: false, error: error.message };
  }
}

export default {
  getLabResults,
  getLabResultWithAnalysis,
  saveLabResult,
  parseLabReport,
  updateBiomarkers,
  getBiomarkerReferences,
  getDeficiencies,
  compareLatestResults,
  checkBloodCheckDue
};
