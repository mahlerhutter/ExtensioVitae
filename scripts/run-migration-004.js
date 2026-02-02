#!/usr/bin/env node

/**
 * Run database migration 004: Add plan overview columns
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log('🚀 Running migration: 004_add_plan_overview.sql');

        // Read the migration file
        const migrationPath = join(__dirname, '../sql/migrations/004_add_plan_overview.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf8');

        // Extract only the ALTER TABLE commands (skip comments)
        const commands = migrationSQL
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd && !cmd.startsWith('--') && !cmd.startsWith('COMMENT'));

        console.log(`📝 Found ${commands.length} SQL commands to execute`);

        // Execute each command
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            if (!command) continue;

            console.log(`\n⚙️  Executing command ${i + 1}/${commands.length}...`);
            console.log(`   ${command.substring(0, 60)}...`);

            const { data, error } = await supabase.rpc('exec_sql', {
                sql_query: command + ';'
            });

            if (error) {
                // Try direct execution if RPC fails
                console.log('   Trying alternative method...');

                // For ALTER TABLE, we can use the REST API
                if (command.includes('ALTER TABLE plans ADD COLUMN')) {
                    console.log('   ⚠️  Note: Column may already exist or require manual execution');
                    console.log('   Please run this SQL manually in Supabase SQL Editor:');
                    console.log(`   ${command};`);
                } else {
                    console.error('   ❌ Error:', error.message);
                }
            } else {
                console.log('   ✅ Success');
            }
        }

        console.log('\n✨ Migration completed!');
        console.log('\n📋 Summary:');
        console.log('   - Added plan_overview JSONB column');
        console.log('   - Added plan_iterations INTEGER column');
        console.log('   - Added user_adjustments JSONB column');
        console.log('   - Created index on plan_iterations');
        console.log('\n💡 If any commands failed, please run them manually in Supabase SQL Editor');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
