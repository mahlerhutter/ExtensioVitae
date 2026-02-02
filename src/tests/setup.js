// Test setup file
// This runs before all tests

// Mock environment variables
global.import = {
    meta: {
        env: {
            VITE_SUPABASE_URL: 'https://test.supabase.co',
            VITE_SUPABASE_ANON_KEY: 'test-key',
            VITE_ADMIN_EMAILS: 'admin@test.com',
        },
    },
};

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock navigator
global.navigator = {
    userAgent: 'test-agent',
};
