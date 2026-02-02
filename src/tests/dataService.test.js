import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shouldUseSupabase, getStorageInfo } from '../lib/dataService.js';

// Mock Supabase
vi.mock('../lib/supabase.js', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
        },
    },
    getCurrentUser: vi.fn(),
    saveIntakeToSupabase: vi.fn(),
    getIntakeFromSupabase: vi.fn(),
    savePlanToSupabase: vi.fn(),
    getActivePlanFromSupabase: vi.fn(),
    getProgressFromSupabase: vi.fn(),
    updateProgressInSupabase: vi.fn(),
    getArchivedPlansFromSupabase: vi.fn(),
}));

describe('Data Service', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('shouldUseSupabase', () => {
        it('should return true when user is authenticated', async () => {
            const { getCurrentUser } = await import('../lib/supabase.js');
            getCurrentUser.mockResolvedValue({
                user: { id: 'test-user-id', email: 'test@example.com' },
            });

            const result = await shouldUseSupabase();

            expect(result).toBe(true);
        });

        it('should return false when user is not authenticated', async () => {
            const { getCurrentUser } = await import('../lib/supabase.js');
            getCurrentUser.mockResolvedValue({ user: null });

            const result = await shouldUseSupabase();

            expect(result).toBe(false);
        });

        it('should return false when Supabase is not available', async () => {
            // Mock supabase as null
            vi.doMock('../lib/supabase.js', () => ({
                supabase: null,
                getCurrentUser: vi.fn(),
            }));

            const result = await shouldUseSupabase();

            expect(result).toBe(false);
        });
    });

    describe('getStorageInfo', () => {
        it('should return storage info with Supabase mode when authenticated', async () => {
            const { getCurrentUser } = await import('../lib/supabase.js');
            getCurrentUser.mockResolvedValue({
                user: { id: 'test-user-id' },
            });

            const info = await getStorageInfo();

            expect(info).toHaveProperty('mode');
            expect(info).toHaveProperty('userId');
            expect(info).toHaveProperty('hasLocalIntake');
            expect(info).toHaveProperty('hasLocalPlan');
            expect(info).toHaveProperty('hasLocalProgress');
            expect(info.mode).toBe('supabase');
            expect(info.userId).toBe('test-user-id');
        });

        it('should return storage info with localStorage mode when not authenticated', async () => {
            const { getCurrentUser } = await import('../lib/supabase.js');
            getCurrentUser.mockResolvedValue({ user: null });

            const info = await getStorageInfo();

            expect(info.mode).toBe('localStorage');
            expect(info.userId).toBeNull();
        });

        it('should detect local data presence', async () => {
            const { getCurrentUser } = await import('../lib/supabase.js');
            getCurrentUser.mockResolvedValue({ user: null });

            localStorage.setItem('intake_data', JSON.stringify({ name: 'Test' }));
            localStorage.setItem('generated_plan', JSON.stringify({ days: [] }));

            const info = await getStorageInfo();

            expect(info.hasLocalIntake).toBe(true);
            expect(info.hasLocalPlan).toBe(true);
            expect(info.hasLocalProgress).toBe(false);
        });
    });

    describe('LocalStorage Operations', () => {
        it('should save data to localStorage', () => {
            const testData = { name: 'Test User', age: 30 };
            localStorage.setItem('test_data', JSON.stringify(testData));

            const retrieved = JSON.parse(localStorage.getItem('test_data'));

            expect(retrieved).toEqual(testData);
        });

        it('should handle missing localStorage data', () => {
            const result = localStorage.getItem('nonexistent_key');

            expect(result).toBeNull();
        });

        it('should clear localStorage data', () => {
            localStorage.setItem('test_data', 'some data');
            localStorage.removeItem('test_data');

            const result = localStorage.getItem('test_data');

            expect(result).toBeNull();
        });
    });

    describe('Data Persistence Strategy', () => {
        it('should prioritize Supabase when authenticated', async () => {
            const { getCurrentUser } = await import('../lib/supabase.js');
            getCurrentUser.mockResolvedValue({
                user: { id: 'test-user-id' },
            });

            const useSupabase = await shouldUseSupabase();

            expect(useSupabase).toBe(true);
        });

        it('should fallback to localStorage when not authenticated', async () => {
            const { getCurrentUser } = await import('../lib/supabase.js');
            getCurrentUser.mockResolvedValue({ user: null });

            const useSupabase = await shouldUseSupabase();

            expect(useSupabase).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('should handle Supabase errors gracefully', async () => {
            const { getCurrentUser } = await import('../lib/supabase.js');
            getCurrentUser.mockRejectedValue(new Error('Network error'));

            // Should not throw, should fallback to localStorage
            const result = await shouldUseSupabase();

            expect(result).toBe(false);
        });

        it('should handle corrupted localStorage data', () => {
            localStorage.setItem('intake_data', 'invalid json {');

            expect(() => {
                JSON.parse(localStorage.getItem('intake_data'));
            }).toThrow();
        });

        it('should handle empty localStorage', async () => {
            const { getCurrentUser } = await import('../lib/supabase.js');
            getCurrentUser.mockResolvedValue({ user: null });

            const info = await getStorageInfo();

            expect(info.hasLocalIntake).toBe(false);
            expect(info.hasLocalPlan).toBe(false);
            expect(info.hasLocalProgress).toBe(false);
        });
    });

    describe('Data Synchronization', () => {
        it('should indicate when local and remote data might differ', async () => {
            const { getCurrentUser } = await import('../lib/supabase.js');
            getCurrentUser.mockResolvedValue({
                user: { id: 'test-user-id' },
            });

            // Simulate local data exists
            localStorage.setItem('generated_plan', JSON.stringify({ days: [] }));

            const info = await getStorageInfo();

            expect(info.mode).toBe('supabase');
            expect(info.hasLocalPlan).toBe(true);
            // This indicates potential sync needed
        });
    });

    describe('Storage Detection', () => {
        it('should correctly detect all storage states', async () => {
            const { getCurrentUser } = await import('../lib/supabase.js');
            getCurrentUser.mockResolvedValue({ user: null });

            // Test all combinations
            const states = [
                { intake: false, plan: false, progress: false },
                { intake: true, plan: false, progress: false },
                { intake: true, plan: true, progress: false },
                { intake: true, plan: true, progress: true },
            ];

            for (const state of states) {
                localStorage.clear();

                if (state.intake) {
                    localStorage.setItem('intake_data', JSON.stringify({}));
                }
                if (state.plan) {
                    localStorage.setItem('generated_plan', JSON.stringify({}));
                }
                if (state.progress) {
                    localStorage.setItem('plan_progress', JSON.stringify({}));
                }

                const info = await getStorageInfo();

                expect(info.hasLocalIntake).toBe(state.intake);
                expect(info.hasLocalPlan).toBe(state.plan);
                expect(info.hasLocalProgress).toBe(state.progress);
            }
        });
    });
});
