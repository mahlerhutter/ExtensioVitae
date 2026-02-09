-- =====================================================
-- Reset Canon Entries (Delete All & Re-insert)
-- =====================================================
-- Purpose: Clean slate - delete all entries and re-insert 28 clean entries
-- =====================================================

-- Step 1: Delete ALL existing entries
DELETE FROM canon_entries;

-- Step 2: Verify deletion
SELECT COUNT(*) as total_entries FROM canon_entries;
-- Expected: 0

-- Step 3: Re-insert 28 clean entries

-- SLEEP REGULATION (6 entries)
INSERT INTO canon_entries (domain, doctrine, mechanism, evidence_grade, source_citations, applicability_conditions, contraindications)
VALUES
('sleep_regulation', 'Sleep Timing Consistency Supersedes Duration', 'The suprachiasmatic nucleus (SCN) synchronizes circadian gene expression based on habitual timing. Irregular schedules create chronic circadian misalignment, impairing glucose metabolism and increasing cardiovascular risk (2x risk for irregular sleepers).', 'A', ARRAY['Czeisler et al. (2005)', 'Scheer et al. (2009)'], '{}'::jsonb, '[]'::jsonb),

('sleep_regulation', 'Morning Light Exposure Is Non-Negotiable', 'Light activates ipRGCs, signaling the SCN to suppress melatonin and initiate cortisol awakening response. This sets the circadian phase anchor; without it, melatonin onset drifts later.', 'A', ARRAY['Gooley et al. (2010)', 'Lockley et al. (2006)'], '{}'::jsonb, '[{"field": "photosensitivity", "value": "true"}]'::jsonb),

('sleep_regulation', 'Temperature Drop Is the Primary Sleep Onset Trigger', 'Sleep onset is gated by the hypothalamus detecting core temp decline. Hot baths cause paradoxical cooling via vasodilation.', 'A', ARRAY['Kräuchi et al. (1999)', 'Raymann et al. (2008)'], '{}'::jsonb, '[{"field": "raynauds_disease", "value": "true"}]'::jsonb),

('sleep_regulation', 'Deep Sleep Is the Priority Architecture Target', 'SWS drives 70% of daily growth hormone release and clears metabolic waste (amyloid-beta). Alcohol/late eating suppress SWS.', 'A', ARRAY['Xie et al. (2013)', 'Van Cauter et al. (2000)'], '{}'::jsonb, '[]'::jsonb),

('sleep_regulation', 'Caffeine Has a Non-Negotiable Cutoff', 'Caffeine inhibits adenosine receptors with a 5-7 hour half-life. Consumption after 14:00 reduces SWS by 15-20% even if sleep onset is unaffected.', 'A', ARRAY['Drake et al. (2013)', 'Landolt et al. (2004)'], '{}'::jsonb, '[]'::jsonb),

('sleep_regulation', 'Alcohol Is a Sleep Destroyer, Not a Sleep Aid', 'Ethanol metabolism triggers sympathetic activation ("rebound effect"), fragmenting the second half of the night and destroying REM.', 'A', ARRAY['Ebrahim et al. (2013)', 'Roehrs & Roth (2001)'], '{}'::jsonb, '[]'::jsonb);

-- METABOLIC HEALTH (6 entries)
INSERT INTO canon_entries (domain, doctrine, mechanism, evidence_grade, source_citations, applicability_conditions, contraindications)
VALUES
('metabolic_health', 'Glucose Stability Is the Primary Metabolic Lever', 'Glycemic variability drives oxidative stress and endothelial dysfunction independent of average glucose.', 'A', ARRAY['Ceriello et al. (2008)', 'Monnier et al. (2006)'], '{}'::jsonb, '[{"field": "eating_disorder_history", "value": "true"}]'::jsonb),

('metabolic_health', 'Insulin Sensitivity Is the Master Longevity Biomarker', 'Hyperinsulinemia drives the cascade toward diabetes, CVD, and neurodegeneration. Insulin resistance impairs autophagy and accelerates aging.', 'S', ARRAY['Barzilai et al. (2012)', 'Templeman et al. (2021)'], '{}'::jsonb, '[{"field": "type1_diabetes", "value": "true"}]'::jsonb),

('metabolic_health', 'Meal Timing Follows Circadian Biology', 'Insulin sensitivity peaks in the morning. Late eating (+30% glucose excursion vs morning) disrupts overnight autophagy.', 'A', ARRAY['Jakubowicz et al. (2013)', 'Sutton et al. (2018)'], '{}'::jsonb, '[]'::jsonb),

('metabolic_health', 'Protein Requirements Are Non-Negotiable and Age-Dependent', 'Anabolic resistance with age requires higher doses to trigger synthesis (leucine threshold ~2.5-3g).', 'A', ARRAY['Burd et al. (2019)', 'Paddon-Jones & Rasmussen (2009)'], '{}'::jsonb, '[{"field": "chronic_kidney_disease", "value": "true"}]'::jsonb),

('metabolic_health', 'Fasting Is a Tool, Not a Default Protocol', 'Fasting activates AMPK and autophagy but amplifies cortisol dysregulation if sleep-deprived or under-nourished.', 'B', ARRAY['de Cabo & Mattson (2019)', 'Longo & Panda (2016)'], '{"sleep_debt": ["none"], "stress_load": ["low", "moderate"]}'::jsonb, '[{"field": "eating_disorder_history", "value": "true"}]'::jsonb),

('metabolic_health', 'Body Composition Over Scale Weight', 'Sarcopenic obesity (low muscle, high fat) has higher mortality risk than metabolically healthy obesity. Visceral fat >100cm² is a major risk factor.', 'A', ARRAY['Atkins et al. (2014)', 'Prado et al. (2018)'], '{}'::jsonb, '[{"field": "eating_disorder_history", "value": "true"}]'::jsonb);

-- MOVEMENT HIERARCHY (6 entries)
INSERT INTO canon_entries (domain, doctrine, mechanism, evidence_grade, source_citations, applicability_conditions, contraindications)
VALUES
('movement_hierarchy', 'Walking Is the Highest-ROI Movement', 'Walking activates GLUT4 independent of insulin, reduces cortisol, and has lowest injury risk. 8k steps roughly halves mortality vs 4k steps.', 'A', ARRAY['Lee et al. (2019)', 'Saint-Maurice et al. (2020)'], '{}'::jsonb, '[{"field": "acute_lower_extremity_injury", "value": "true"}]'::jsonb),

('movement_hierarchy', 'Resistance Training Is Longevity Intervention #1', 'Addresses sarcopenia, osteoporosis, insulin sensitivity, and functional independence simultaneously.', 'A', ARRAY['Westcott (2012)', 'Liu & Latham (2009)'], '{}'::jsonb, '[{"field": "acute_injury", "value": "true"}, {"field": "sleep_debt", "value": "severe"}]'::jsonb),

('movement_hierarchy', 'Zone 2 Cardio Is the Aerobic Foundation', 'Maximally stimulates mitochondrial biogenesis and fat oxidation without sympathetic stress.', 'A', ARRAY['Holloszy (2008)', 'San-Millán & Brooks (2018)'], '{}'::jsonb, '[{"field": "overreached_state", "value": "true"}]'::jsonb),

('movement_hierarchy', 'VO2max Is the Strongest Mortality Predictor', '5x mortality risk difference between lowest and highest quintiles. Each 1 MET increase reduces mortality ~13%.', 'S', ARRAY['Mandsager et al. (2018)', 'Ross et al. (2016)'], '{}'::jsonb, '[{"field": "cardiovascular_disease", "value": "true"}]'::jsonb),

('movement_hierarchy', 'Mobility Is Injury Prevention, Not a Warm-Up Ritual', 'Age-related ROM loss leads to compensation patterns and injury. Daily work stimulates synovial fluid and collagen remodeling.', 'B', ARRAY['Behm & Chaouachi (2011)', 'Nakamura et al. (2012)'], '{}'::jsonb, '[{"field": "acute_inflammation", "value": "true"}]'::jsonb),

('movement_hierarchy', 'Overtraining Is a Systemic Failure', 'Overreaching dysregulates HPA axis, suppresses immune function, and increases injury risk. Training without recovery produces negative results.', 'A', ARRAY['Meeusen et al. (2013)', 'Kreher & Schwartz (2012)'], '{}'::jsonb, '[]'::jsonb);

-- STRESS & NERVOUS SYSTEM (5 entries)
INSERT INTO canon_entries (domain, doctrine, mechanism, evidence_grade, source_citations, applicability_conditions, contraindications)
VALUES
('stress_nervous_system', 'Chronic Sympathetic Dominance Is the Silent Longevity Killer', 'Chronic activation elevates cortisol/inflammation, accelerates atherosclerosis, and suppresses immune surveillance.', 'A', ARRAY['McEwen (2008)', 'Thayer et al. (2010)'], '{}'::jsonb, '[]'::jsonb),

('stress_nervous_system', 'Daily Nervous System Regulation Is Non-Negotiable', 'Physiological sighing activates vagal afferents to reduce cortisol and increase HRV.', 'A', ARRAY['Balban et al. (2023)', 'Gerritsen & Band (2018)'], '{}'::jsonb, '[{"field": "severe_anxiety", "value": "true"}]'::jsonb),

('stress_nervous_system', 'Breathwork Follows a Hierarchy', 'Exhale-dominant engages vagal brake. Inhale-dominant increases sympathetic activation.', 'B', ARRAY['Zaccaro et al. (2018)', 'Russo et al. (2017)'], '{}'::jsonb, '[{"field": "pregnancy", "value": "true"}, {"field": "cardiovascular_disease", "value": "true"}]'::jsonb),

('stress_nervous_system', 'Stimulant Management Is a Stress Variable', 'Caffeine elevates cortisol 30-50%. In high-stress states, this compounds HPA dysregulation.', 'B', ARRAY['Lovallo et al. (2005)', 'Lane et al. (1990)'], '{}'::jsonb, '[]'::jsonb),

('stress_nervous_system', 'Acute Stress Is Beneficial; Chronic Stress Destroys', 'Hormesis (Nrf2 pathway) requires recovery. Chronic stress blocks adaptation and causes allostatic load.', 'A', ARRAY['Calabrese et al. (2007)', 'McEwen & Stellar (1993)'], '{"stress_load": ["low", "moderate"]}'::jsonb, '[{"field": "cardiovascular_disease", "value": "true"}, {"field": "pregnancy", "value": "true"}]'::jsonb);

-- MEANING & PURPOSE (5 entries)
INSERT INTO canon_entries (domain, doctrine, mechanism, evidence_grade, source_citations, applicability_conditions, contraindications)
VALUES
('meaning_purpose', 'Social Connection Is a Mortality-Level Intervention', 'Isolation activates inflammatory gene expression (CTRA). Connection stimulates oxytocin/vagal tone.', 'A', ARRAY['Holt-Lunstad et al. (2010)', 'Cole et al. (2015)'], '{}'::jsonb, '[]'::jsonb),

('meaning_purpose', 'Purpose Reduces Inflammation Biomarkers', 'Eudaimonic wellbeing downregulates inflammatory genes. Buffers physiological stress effects.', 'B', ARRAY['Fredrickson et al. (2013)', 'Kim et al. (2013)'], '{}'::jsonb, '[]'::jsonb),

('meaning_purpose', 'Cognitive Stimulation Is Neuroprotective', 'Novel challenges stimulate BDNF and neurogenesis. Difficulty/novelty is key.', 'A', ARRAY['Valenzuela & Sachdev (2009)', 'Wilson et al. (2002)'], '{}'::jsonb, '[{"field": "high_cognitive_load", "value": "true"}]'::jsonb),

('meaning_purpose', 'Identity Precedes Behavior Change', 'Identity-aligned behaviors are maintained 3-5x longer. Conflicts create cognitive dissonance.', 'B', ARRAY['Gardner et al. (2012)', 'Keller (2017)'], '{}'::jsonb, '[{"field": "identity_crisis", "value": "true"}]'::jsonb),

('meaning_purpose', 'Loneliness is a Quantifiable Health Risk', 'Triggers threat response, elevates cortisol, fragments sleep. Accelerates cognitive decline.', 'A', ARRAY['Cacioppo & Hawkley (2009)', 'Wilson et al. (2007)'], '{}'::jsonb, '[]'::jsonb);

-- Step 4: Verify final count
SELECT domain, COUNT(*) as count
FROM canon_entries
GROUP BY domain
ORDER BY domain;

-- Expected output:
-- meaning_purpose         | 5
-- metabolic_health        | 6
-- movement_hierarchy      | 6
-- sleep_regulation        | 6
-- stress_nervous_system   | 5
-- TOTAL: 28
