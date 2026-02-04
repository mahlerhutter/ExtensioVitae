/**
 * Encryption Service
 * 
 * Provides AES-256-GCM encryption for sensitive PII data in localStorage
 * Uses Web Crypto API (built-in, no dependencies)
 * 
 * DSGVO Article 9 Compliance: Health data must be encrypted at rest
 */

import { logger } from './logger';

// Salt for key derivation (public, stored in code)
const SALT = 'ExtensioVitae-2026-v1';

/**
 * Derive an encryption key from userId using PBKDF2
 * @param {string} userId - User ID from auth.uid()
 * @returns {Promise<CryptoKey>} Encryption key
 */
async function deriveKey(userId) {
    if (!userId) {
        throw new Error('[Encryption] Cannot derive key without userId');
    }

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(userId + SALT),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(SALT),
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt data using AES-256-GCM
 * @param {any} data - Data to encrypt (will be JSON stringified)
 * @param {string} userId - User ID for key derivation
 * @returns {Promise<string>} Encrypted data as base64 string with IV
 */
export async function encryptData(data, userId) {
    try {
        if (!userId) {
            logger.warn('[Encryption] No userId provided, storing unencrypted');
            return JSON.stringify({ unencrypted: true, data });
        }

        const encoder = new TextEncoder();
        const key = await deriveKey(userId);
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoder.encode(JSON.stringify(data))
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.length);

        // Convert to base64
        const base64 = btoa(String.fromCharCode(...combined));

        logger.debug('[Encryption] Data encrypted successfully');
        return JSON.stringify({ encrypted: true, data: base64 });
    } catch (error) {
        logger.error('[Encryption] Encryption failed:', error);
        throw error;
    }
}

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedString - Encrypted data from localStorage
 * @param {string} userId - User ID for key derivation
 * @returns {Promise<any>} Decrypted data (parsed from JSON)
 */
export async function decryptData(encryptedString, userId) {
    try {
        if (!encryptedString) {
            return null;
        }

        const parsed = JSON.parse(encryptedString);

        // Handle unencrypted legacy data
        if (parsed.unencrypted) {
            logger.warn('[Encryption] Found unencrypted data, migrating...');
            return parsed.data;
        }

        // Handle already decrypted data (shouldn't happen, but defensive)
        if (!parsed.encrypted) {
            logger.warn('[Encryption] Data appears to be plain JSON, returning as-is');
            return parsed;
        }

        if (!userId) {
            logger.error('[Encryption] Cannot decrypt without userId');
            throw new Error('Cannot decrypt without userId');
        }

        // Decode base64
        const combined = Uint8Array.from(atob(parsed.data), c => c.charCodeAt(0));

        // Extract IV and encrypted data
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);

        const key = await deriveKey(userId);
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encrypted
        );

        const decoder = new TextDecoder();
        const decryptedString = decoder.decode(decrypted);

        logger.debug('[Encryption] Data decrypted successfully');
        return JSON.parse(decryptedString);
    } catch (error) {
        logger.error('[Encryption] Decryption failed:', error);
        // Return null on decryption failure (data may be corrupted or from different user)
        return null;
    }
}

/**
 * Check if data is encrypted
 * @param {string} dataString - Data from localStorage
 * @returns {boolean} True if data is encrypted
 */
export function isEncrypted(dataString) {
    try {
        if (!dataString) return false;
        const parsed = JSON.parse(dataString);
        return parsed.encrypted === true;
    } catch {
        return false;
    }
}

/**
 * Migrate unencrypted data to encrypted format
 * @param {string} key - localStorage key
 * @param {string} userId - User ID for encryption
 * @returns {Promise<boolean>} True if migration was performed
 */
export async function migrateToEncrypted(key, userId) {
    try {
        const data = localStorage.getItem(key);
        if (!data || isEncrypted(data)) {
            return false; // Already encrypted or no data
        }

        logger.info(`[Encryption] Migrating ${key} to encrypted format`);

        // Parse the unencrypted data
        const parsed = JSON.parse(data);

        // Encrypt and save
        const encrypted = await encryptData(parsed, userId);
        localStorage.setItem(key, encrypted);

        logger.info(`[Encryption] Successfully migrated ${key}`);
        return true;
    } catch (error) {
        logger.error(`[Encryption] Failed to migrate ${key}:`, error);
        return false;
    }
}
