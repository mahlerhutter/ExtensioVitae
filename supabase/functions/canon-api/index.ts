/**
 * Canon API Edge Function
 *
 * Handles all Canon Knowledge Layer operations:
 * - create_entry: Add new canon entry (admin only)
 * - get_by_domain: Retrieve all entries for a domain
 * - semantic_search: Vector similarity search
 * - check_applicability: Filter by user state conditions
 * - get_all: Retrieve all active canon entries
 *
 * Author: RAG Implementation Phase 2
 * Date: 2026-02-08
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =====================================================
// INTERFACES
// =====================================================

interface CanonEntry {
    id?: string;
    domain: string;
    doctrine: string;
    mechanism: string;
    embedding?: number[];
    applicability_conditions?: Record<string, any>;
    contraindications?: Array<{ field: string; value: string }>;
    evidence_grade: 'S' | 'A' | 'B' | 'C';
    source_citations?: string[];
}

interface SemanticSearchRequest {
    query: string;
    user_state?: Record<string, any>;
    domain?: string;
    top_k?: number;
    threshold?: number;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Generate embedding using OpenAI API
 */
async function generateEmbedding(text: string, openaiKey: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text,
            dimensions: 1536
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

/**
 * Validate domain
 */
function isValidDomain(domain: string): boolean {
    const validDomains = [
        'sleep_regulation',
        'metabolic_health',
        'movement_hierarchy',
        'stress_nervous_system',
        'meaning_purpose'
    ];
    return validDomains.includes(domain);
}

/**
 * Validate evidence grade
 */
function isValidEvidenceGrade(grade: string): boolean {
    return ['S', 'A', 'B', 'C'].includes(grade);
}

// =====================================================
// ACTION HANDLERS
// =====================================================

/**
 * CREATE_ENTRY: Add new canon entry (admin only)
 */
async function handleCreateEntry(
    supabase: any,
    entry: CanonEntry,
    openaiKey: string
) {
    // Validate required fields
    if (!entry.domain || !entry.doctrine || !entry.mechanism || !entry.evidence_grade) {
        throw new Error('Missing required fields: domain, doctrine, mechanism, evidence_grade');
    }

    // Validate domain
    if (!isValidDomain(entry.domain)) {
        throw new Error(`Invalid domain. Must be one of: sleep_regulation, metabolic_health, movement_hierarchy, stress_nervous_system, meaning_purpose`);
    }

    // Validate evidence grade
    if (!isValidEvidenceGrade(entry.evidence_grade)) {
        throw new Error('Invalid evidence_grade. Must be one of: S, A, B, C');
    }

    // Generate embedding from doctrine + mechanism
    const textToEmbed = `${entry.doctrine} ${entry.mechanism}`;
    const embedding = await generateEmbedding(textToEmbed, openaiKey);

    // Insert into database
    const { data, error } = await supabase
        .from('canon_entries')
        .insert({
            domain: entry.domain,
            doctrine: entry.doctrine,
            mechanism: entry.mechanism,
            embedding: embedding,
            applicability_conditions: entry.applicability_conditions || {},
            contraindications: entry.contraindications || [],
            evidence_grade: entry.evidence_grade,
            source_citations: entry.source_citations || [],
        })
        .select()
        .single();

    if (error) throw error;

    return { success: true, data };
}

/**
 * GET_BY_DOMAIN: Retrieve all entries for a domain
 */
async function handleGetByDomain(
    supabase: any,
    domain: string,
    includeRetired: boolean = false
) {
    if (!isValidDomain(domain)) {
        throw new Error('Invalid domain');
    }

    const { data, error } = await supabase.rpc('get_canon_by_domain', {
        p_domain: domain,
        p_include_retired: includeRetired
    });

    if (error) throw error;

    return { success: true, data };
}

/**
 * SEMANTIC_SEARCH: Vector similarity search
 */
async function handleSemanticSearch(
    supabase: any,
    request: SemanticSearchRequest,
    openaiKey: string
) {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(request.query, openaiKey);

    // Call PostgreSQL function
    const { data, error } = await supabase.rpc('search_canon_entries', {
        query_embedding: queryEmbedding,
        match_threshold: request.threshold || 0.3, // Lowered for multilingual support
        match_count: request.top_k || 10,
        filter_domain: request.domain || null,
        filter_user_state: request.user_state ? JSON.stringify(request.user_state) : null
    });

    if (error) throw error;

    return { success: true, data, query: request.query };
}

/**
 * CHECK_APPLICABILITY: Check if canon entry applies to user state
 */
async function handleCheckApplicability(
    supabase: any,
    canonId: string,
    userState: Record<string, any>
) {
    const { data, error } = await supabase.rpc('check_canon_applicability', {
        p_canon_id: canonId,
        p_user_state: userState
    });

    if (error) throw error;

    return { success: true, applicable: data };
}

/**
 * GET_ALL: Retrieve all active canon entries
 */
async function handleGetAll(supabase: any, domain?: string) {
    let query = supabase
        .from('canon_entries')
        .select('*')
        .is('retired_at', null)
        .order('domain', { ascending: true })
        .order('evidence_grade', { ascending: true });

    if (domain) {
        if (!isValidDomain(domain)) {
            throw new Error('Invalid domain');
        }
        query = query.eq('domain', domain);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data, count: data.length };
}

/**
 * GET_STATS: Get statistics about canon entries
 */
async function handleGetStats(supabase: any) {
    // Get counts by domain
    const { data: domainCounts, error: domainError } = await supabase
        .from('canon_entries')
        .select('domain')
        .is('retired_at', null);

    if (domainError) throw domainError;

    // Count by domain
    const stats = domainCounts.reduce((acc: any, entry: any) => {
        acc[entry.domain] = (acc[entry.domain] || 0) + 1;
        return acc;
    }, {});

    // Get total count
    const totalCount = domainCounts.length;

    // Get counts by evidence grade
    const { data: gradeCounts, error: gradeError } = await supabase
        .from('canon_entries')
        .select('evidence_grade')
        .is('retired_at', null);

    if (gradeError) throw gradeError;

    const gradeStats = gradeCounts.reduce((acc: any, entry: any) => {
        acc[entry.evidence_grade] = (acc[entry.evidence_grade] || 0) + 1;
        return acc;
    }, {});

    return {
        success: true,
        stats: {
            total: totalCount,
            by_domain: stats,
            by_evidence_grade: gradeStats
        }
    };
}

/**
 * GENERATE_EMBEDDINGS: Generate embeddings for entries without them
 */
async function handleGenerateEmbeddings(supabase: any, openaiKey: string) {
    // Get all entries without embeddings
    const { data: entries, error: fetchError } = await supabase
        .from('canon_entries')
        .select('id, doctrine, mechanism')
        .is('embedding', null)
        .is('retired_at', null);

    if (fetchError) throw fetchError;

    if (!entries || entries.length === 0) {
        return {
            success: true,
            message: 'No entries without embeddings found',
            updated: 0
        };
    }

    console.log(`Found ${entries.length} entries without embeddings`);

    const results = [];
    const errors = [];

    // Generate embeddings for each entry
    for (const entry of entries) {
        try {
            console.log(`Generating embedding for entry ${entry.id}...`);

            // Generate embedding
            const textToEmbed = `${entry.doctrine} ${entry.mechanism}`;
            const embedding = await generateEmbedding(textToEmbed, openaiKey);

            // Update entry with embedding
            const { error: updateError } = await supabase
                .from('canon_entries')
                .update({ embedding: embedding })
                .eq('id', entry.id);

            if (updateError) {
                console.error(`Error updating entry ${entry.id}:`, updateError);
                errors.push({ id: entry.id, error: updateError.message });
            } else {
                console.log(`✅ Successfully updated entry ${entry.id}`);
                results.push(entry.id);
            }

            // Rate limiting: wait 500ms between requests
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`Error processing entry ${entry.id}:`, error);
            errors.push({ id: entry.id, error: (error as Error).message });
        }
    }

    return {
        success: true,
        message: `Generated embeddings for ${results.length} entries`,
        updated: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
    };
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Parse request
        const body = await req.json();
        const { action } = body;

        // Validate action
        const validActions = [
            'create_entry',
            'get_by_domain',
            'semantic_search',
            'check_applicability',
            'get_all',
            'get_stats',
            'generate_embeddings'
        ];

        if (!validActions.includes(action)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: `Invalid action. Must be one of: ${validActions.join(', ')}`
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get OpenAI API key (required for embedding generation)
        const openaiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiKey && ['create_entry', 'semantic_search', 'generate_embeddings'].includes(action)) {
            throw new Error('OPENAI_API_KEY environment variable is required for this action');
        }

        // Route to action handler
        let result;
        switch (action) {
            case 'create_entry':
                result = await handleCreateEntry(supabase, body.entry, openaiKey!);
                break;

            case 'get_by_domain':
                if (!body.domain) {
                    throw new Error('domain is required');
                }
                result = await handleGetByDomain(supabase, body.domain, body.include_retired);
                break;

            case 'semantic_search':
                if (!body.query) {
                    throw new Error('query is required');
                }
                result = await handleSemanticSearch(supabase, body, openaiKey!);
                break;

            case 'check_applicability':
                if (!body.canon_id || !body.user_state) {
                    throw new Error('canon_id and user_state are required');
                }
                result = await handleCheckApplicability(supabase, body.canon_id, body.user_state);
                break;

            case 'get_all':
                result = await handleGetAll(supabase, body.domain);
                break;

            case 'get_stats':
                result = await handleGetStats(supabase);
                break;

            case 'generate_embeddings':
                result = await handleGenerateEmbeddings(supabase, openaiKey!);
                break;

            default:
                throw new Error('Unknown action');
        }

        return new Response(
            JSON.stringify(result),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Canon API Error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
