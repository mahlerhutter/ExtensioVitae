import { describe, it, expect } from 'vitest';
import {
    detectFlight,
    detectFocusBlock,
    detectLateNightEvent,
    detectEventType,
    analyzeCalendarEvents
} from '../lib/calendarDetection';

describe('Calendar Detection Service', () => {
    describe('detectFlight', () => {
        it('should detect flight with airline code and airport', () => {
            const event = {
                title: 'LH 401 FRA → JFK',
                location: 'Frankfurt Airport',
                description: 'Flight to New York',
                start_time: '2026-02-10T10:00:00Z',
                end_time: '2026-02-10T18:00:00Z'
            };

            const result = detectFlight(event);

            expect(result).not.toBeNull();
            expect(result.type).toBe('flight');
            expect(result.confidence).toBeGreaterThan(0.7);
            expect(result.mode).toBeDefined();
        });

        it('should detect flight with keywords only', () => {
            const event = {
                title: 'Flight to Tokyo',
                location: '',
                description: 'Departure at 14:30',
                start_time: '2026-02-10T10:00:00Z',
                end_time: '2026-02-10T18:00:00Z'
            };

            const result = detectFlight(event);

            expect(result).not.toBeNull();
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        it('should not detect non-flight events', () => {
            const event = {
                title: 'Team Meeting',
                location: 'Office',
                description: 'Quarterly review',
                start_time: '2026-02-10T10:00:00Z',
                end_time: '2026-02-10T11:00:00Z'
            };

            const result = detectFlight(event);

            expect(result).toBeNull();
        });

        it('should include metadata in detection', () => {
            const event = {
                title: 'BA 123 LHR → SFO',
                location: 'Heathrow',
                description: 'British Airways flight',
                start_time: '2026-02-10T10:00:00Z',
                end_time: '2026-02-10T18:00:00Z'
            };

            const result = detectFlight(event);

            expect(result.metadata).toBeDefined();
            expect(result.metadata.airport_codes).toBeDefined();
            expect(result.metadata.keywords_found).toBeDefined();
        });
    });

    describe('detectFocusBlock', () => {
        it('should detect 4+ hour focus block', () => {
            const event = {
                title: 'Deep Work',
                description: 'Focus on strategy',
                start_time: '2026-02-10T09:00:00Z',
                end_time: '2026-02-10T13:00:00Z', // 4 hours
                attendees: []
            };

            const result = detectFocusBlock(event);

            expect(result).not.toBeNull();
            expect(result.type).toBe('focus_block');
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        it('should not detect short blocks', () => {
            const event = {
                title: 'Deep Work',
                description: 'Quick session',
                start_time: '2026-02-10T09:00:00Z',
                end_time: '2026-02-10T11:00:00Z', // 2 hours
                attendees: []
            };

            const result = detectFocusBlock(event);

            expect(result).toBeNull();
        });

        it('should detect focus keywords', () => {
            const event = {
                title: 'Strategy Planning',
                description: 'No meetings, do not disturb',
                start_time: '2026-02-10T09:00:00Z',
                end_time: '2026-02-10T15:00:00Z', // 6 hours
                attendees: []
            };

            const result = detectFocusBlock(event);

            expect(result).not.toBeNull();
            expect(result.confidence).toBeGreaterThan(0.8);
        });

        it('should lower confidence for events with attendees', () => {
            const event = {
                title: 'Deep Work',
                description: 'Focus session',
                start_time: '2026-02-10T09:00:00Z',
                end_time: '2026-02-10T13:00:00Z',
                attendees: ['john@example.com']
            };

            const result = detectFocusBlock(event);

            expect(result).not.toBeNull();
            expect(result.confidence).toBeLessThan(0.9);
        });

        it('should include duration in metadata', () => {
            const event = {
                title: 'Deep Work',
                description: 'Focus',
                start_time: '2026-02-10T09:00:00Z',
                end_time: '2026-02-10T14:00:00Z', // 5 hours
                attendees: []
            };

            const result = detectFocusBlock(event);

            expect(result.metadata.duration_hours).toBe(5);
        });
    });

    describe('detectLateNightEvent', () => {
        it('should detect dinner after 7 PM', () => {
            const event = {
                title: 'Dinner with clients',
                location: 'Restaurant ABC',
                description: 'Business dinner',
                start_time: '2026-02-10T19:00:00Z' // 7 PM
            };

            const result = detectLateNightEvent(event);

            expect(result).not.toBeNull();
            expect(result.type).toBe('late_night');
        });

        it('should not detect early events', () => {
            const event = {
                title: 'Lunch meeting',
                location: 'Restaurant',
                description: 'Team lunch',
                start_time: '2026-02-10T12:00:00Z' // Noon
            };

            const result = detectLateNightEvent(event);

            expect(result).toBeNull();
        });

        it('should detect social keywords', () => {
            const event = {
                title: 'Birthday Party',
                location: 'Home',
                description: 'Celebration',
                start_time: '2026-02-10T20:00:00Z' // 8 PM
            };

            const result = detectLateNightEvent(event);

            expect(result).not.toBeNull();
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        it('should increase confidence for multiple attendees', () => {
            const event = {
                title: 'Dinner',
                location: 'Restaurant',
                description: 'Group dinner',
                start_time: '2026-02-10T19:30:00Z',
                attendees: ['john@example.com', 'jane@example.com', 'bob@example.com']
            };

            const result = detectLateNightEvent(event);

            expect(result).not.toBeNull();
            expect(result.confidence).toBeGreaterThan(0.5);
        });
    });

    describe('detectEventType', () => {
        it('should return highest confidence detection', () => {
            const event = {
                title: 'LH 401 FRA → JFK',
                location: 'Frankfurt Airport',
                description: 'Flight',
                start_time: '2026-02-10T10:00:00Z',
                end_time: '2026-02-10T18:00:00Z'
            };

            const result = detectEventType(event);

            expect(result).not.toBeNull();
            expect(result.type).toBe('flight');
        });

        it('should return null for non-detectable events', () => {
            const event = {
                title: 'Regular Meeting',
                location: 'Office',
                description: 'Weekly sync',
                start_time: '2026-02-10T10:00:00Z',
                end_time: '2026-02-10T11:00:00Z'
            };

            const result = detectEventType(event);

            expect(result).toBeNull();
        });

        it('should include event details in result', () => {
            const event = {
                title: 'Deep Work Session',
                location: 'Home Office',
                description: 'Focus time',
                start_time: '2026-02-10T09:00:00Z',
                end_time: '2026-02-10T13:00:00Z',
                attendees: []
            };

            const result = detectEventType(event);

            expect(result.event).toBeDefined();
            expect(result.event.summary).toBe(event.title);
        });
    });

    describe('analyzeCalendarEvents', () => {
        it('should analyze multiple events', () => {
            const events = [
                {
                    title: 'LH 401 FRA → JFK',
                    location: 'Airport',
                    description: 'Flight',
                    start_time: '2026-02-10T10:00:00Z',
                    end_time: '2026-02-10T18:00:00Z'
                },
                {
                    title: 'Deep Work',
                    description: 'Focus',
                    start_time: '2026-02-11T09:00:00Z',
                    end_time: '2026-02-11T13:00:00Z',
                    attendees: []
                },
                {
                    title: 'Regular Meeting',
                    location: 'Office',
                    description: 'Sync',
                    start_time: '2026-02-12T10:00:00Z',
                    end_time: '2026-02-12T11:00:00Z'
                }
            ];

            const results = analyzeCalendarEvents(events);

            expect(results.length).toBe(2); // Flight and Deep Work
            expect(results[0].confidence).toBeGreaterThanOrEqual(results[1].confidence);
        });

        it('should filter by minimum confidence', () => {
            const events = [
                {
                    title: 'Maybe a flight?',
                    location: '',
                    description: '',
                    start_time: '2026-02-10T10:00:00Z',
                    end_time: '2026-02-10T18:00:00Z'
                }
            ];

            const results = analyzeCalendarEvents(events, { minConfidence: 70 });

            expect(results.length).toBe(0);
        });

        it('should handle empty array', () => {
            const results = analyzeCalendarEvents([]);

            expect(results).toEqual([]);
        });

        it('should sort by confidence descending', () => {
            const events = [
                {
                    title: 'Dinner',
                    location: 'Restaurant',
                    description: '',
                    start_time: '2026-02-10T19:00:00Z'
                },
                {
                    title: 'LH 401 FRA → JFK',
                    location: 'Airport',
                    description: 'Flight',
                    start_time: '2026-02-10T10:00:00Z',
                    end_time: '2026-02-10T18:00:00Z'
                }
            ];

            const results = analyzeCalendarEvents(events);

            expect(results[0].confidence).toBeGreaterThanOrEqual(results[1].confidence);
        });
    });
});
