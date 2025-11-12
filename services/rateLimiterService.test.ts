/**
 * Comprehensive DOS protection tests for rateLimiterService
 *
 * Tests focus on rate limiting behavior to prevent denial-of-service attacks.
 * Uses fake timers to test time-based rate limiting without actual delays.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	rateLimitFormSubmission,
	clearAllRateLimits,
	getRateLimitStats,
	resetIpRateLimit,
	resetEmailRateLimit,
	restartCleanup
} from './rateLimiterService';

describe('rateLimitFormSubmission', () => {
	beforeEach(() => {
		clearAllRateLimits();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('short-term limiting (10 req/min)', () => {
		test('allows first request from new IP', () => {
			const result = rateLimitFormSubmission('192.168.1.1', null, 'contact');
			expect(result.allowed).toBe(true);
			expect(result.retryAfter).toBeUndefined();
			expect(result.limitType).toBeUndefined();
		});

		test('allows up to 10 requests within 1 minute', () => {
			const ip = '192.168.1.2';

			for (let i = 1; i <= 10; i++) {
				const result = rateLimitFormSubmission(ip, null, 'contact');
				expect(result.allowed).toBe(true);
			}
		});

		test('blocks 11th request within 1 minute', () => {
			const ip = '192.168.1.3';

			// Make 10 allowed requests
			for (let i = 1; i <= 10; i++) {
				rateLimitFormSubmission(ip, null, 'contact');
			}

			// 11th request should be blocked
			const result = rateLimitFormSubmission(ip, null, 'contact');
			expect(result.allowed).toBe(false);
			expect(result.limitType).toBe('short');
			expect(result.retryAfter).toBeGreaterThan(0);
			expect(result.retryAfter).toBeLessThanOrEqual(60);
			expect(result.message).toContain('Too many requests');
			expect(result.windowMs).toBe(60 * 1000);
			expect(result.maxRequests).toBe(10);
		});

		test('allows requests after 1 minute window expires', () => {
			const ip = '192.168.1.4';

			// Make 10 requests to hit the limit
			for (let i = 1; i <= 10; i++) {
				rateLimitFormSubmission(ip, null, 'contact');
			}

			// 11th request blocked
			const blocked = rateLimitFormSubmission(ip, null, 'contact');
			expect(blocked.allowed).toBe(false);

			// Advance time by 61 seconds (past 1 minute window)
			vi.advanceTimersByTime(61 * 1000);

			// Should be allowed again (new window)
			const allowed = rateLimitFormSubmission(ip, null, 'contact');
			expect(allowed.allowed).toBe(true);
		});

		test('calculates correct retryAfter for short-term limit', () => {
			const ip = '192.168.1.5';

			// Make 10 requests
			for (let i = 1; i <= 10; i++) {
				rateLimitFormSubmission(ip, null, 'contact');
			}

			// Advance 30 seconds
			vi.advanceTimersByTime(30 * 1000);

			// 11th request should be blocked with ~30 seconds retry
			const result = rateLimitFormSubmission(ip, null, 'contact');
			expect(result.allowed).toBe(false);
			expect(result.retryAfter).toBeGreaterThanOrEqual(29);
			expect(result.retryAfter).toBeLessThanOrEqual(30);
		});

		test('separate form types have independent short-term limits', () => {
			const ip = '192.168.1.6';

			// Exhaust contact form limit
			for (let i = 1; i <= 10; i++) {
				rateLimitFormSubmission(ip, null, 'contact');
			}

			const contactBlocked = rateLimitFormSubmission(ip, null, 'contact');
			expect(contactBlocked.allowed).toBe(false);

			// Newsletter form should still work
			const newsletterAllowed = rateLimitFormSubmission(ip, null, 'newsletter');
			expect(newsletterAllowed.allowed).toBe(true);
		});
	});

	describe('medium-term limiting (30 req/5min)', () => {
		test('allows up to 30 requests within 5 minutes', () => {
			const ip = '192.168.2.1';

			// Short-term: 10 requests in 1 minute
			for (let i = 1; i <= 10; i++) {
				const result = rateLimitFormSubmission(ip, null, 'contact');
				expect(result.allowed).toBe(true);
			}

			// Advance 61 seconds to reset short-term window
			vi.advanceTimersByTime(61 * 1000);

			// Another 10 requests
			for (let i = 1; i <= 10; i++) {
				const result = rateLimitFormSubmission(ip, null, 'contact');
				expect(result.allowed).toBe(true);
			}

			// Advance another 61 seconds
			vi.advanceTimersByTime(61 * 1000);

			// Another 10 requests (30 total within 5 minutes)
			for (let i = 1; i <= 10; i++) {
				const result = rateLimitFormSubmission(ip, null, 'contact');
				expect(result.allowed).toBe(true);
			}
		});

		test('blocks 31st request within 5 minutes', () => {
			const ip = '192.168.2.2';

			// Make 30 requests across multiple short-term windows
			for (let batch = 0; batch < 3; batch++) {
				for (let i = 1; i <= 10; i++) {
					rateLimitFormSubmission(ip, null, 'contact');
				}
				if (batch < 2) {
					vi.advanceTimersByTime(61 * 1000);
				}
			}

			// Advance 61 seconds to reset short-term window from last batch
			vi.advanceTimersByTime(61 * 1000);

			// 31st request should be blocked by medium-term limit (short-term is reset)
			const result = rateLimitFormSubmission(ip, null, 'contact');
			expect(result.allowed).toBe(false);
			expect(result.limitType).toBe('medium');
			expect(result.message).toContain('Too many requests');
			expect(result.windowMs).toBe(5 * 60 * 1000);
			expect(result.maxRequests).toBe(30);
		});

		test('allows requests after 5 minute window expires', () => {
			const ip = '192.168.2.3';

			// Make 30 requests
			for (let batch = 0; batch < 3; batch++) {
				for (let i = 1; i <= 10; i++) {
					rateLimitFormSubmission(ip, null, 'contact');
				}
				if (batch < 2) {
					vi.advanceTimersByTime(61 * 1000);
				}
			}

			// Advance 61 seconds to reset short-term window
			vi.advanceTimersByTime(61 * 1000);

			// Should be blocked by medium-term (at 183 seconds total)
			const blocked = rateLimitFormSubmission(ip, null, 'contact');
			expect(blocked.allowed).toBe(false);
			expect(blocked.limitType).toBe('medium');

			// Advance past 5 minute window from start (need 300 total, at 183, so 117 more)
			vi.advanceTimersByTime(120 * 1000);

			// Should be allowed again
			const allowed = rateLimitFormSubmission(ip, null, 'contact');
			expect(allowed.allowed).toBe(true);
		});

		test('calculates correct retryAfter for medium-term limit', () => {
			const ip = '192.168.2.4';

			// Make 30 requests
			for (let batch = 0; batch < 3; batch++) {
				for (let i = 1; i <= 10; i++) {
					rateLimitFormSubmission(ip, null, 'contact');
				}
				if (batch < 2) {
					vi.advanceTimersByTime(61 * 1000);
				}
			}

			// Advance 61 seconds to reset short-term (total: 183 seconds)
			vi.advanceTimersByTime(61 * 1000);

			// At this point, 183 seconds have passed
			// 31st request should show ~117 seconds remaining (300 - 183)
			const result = rateLimitFormSubmission(ip, null, 'contact');
			expect(result.allowed).toBe(false);
			expect(result.retryAfter).toBeGreaterThanOrEqual(116);
			expect(result.retryAfter).toBeLessThanOrEqual(118);
		});
	});

	describe('long-term limiting (100 req/hour)', () => {
		test('allows up to 100 requests within 1 hour', () => {
			const ip = '192.168.3.1';

			// Strategy: Make requests spaced to avoid hitting medium-term (30 req/5min)
			// We'll do 5 batches of 20 requests, spaced 5+ minutes apart
			for (let batch = 0; batch < 5; batch++) {
				// Within each batch, do 2 sub-batches of 10 requests
				for (let subBatch = 0; subBatch < 2; subBatch++) {
					for (let i = 1; i <= 10; i++) {
						const result = rateLimitFormSubmission(ip, null, 'contact');
						expect(result.allowed).toBe(true);
					}
					if (subBatch === 0) {
						// Space sub-batches by 61 seconds to reset short-term
						vi.advanceTimersByTime(61 * 1000);
					}
				}
				if (batch < 4) {
					// Space batches by 301 seconds to reset medium-term (5 min + 1 sec)
					vi.advanceTimersByTime(301 * 1000);
				}
			}

			// Total time: 4 batches * 301s + 4 * 61s = 1204 + 244 = 1448 seconds (24 min)
			// All 100 requests should succeed
		});

		test('blocks 101st request within 1 hour', () => {
			const ip = '192.168.3.2';

			// Make 100 requests as above
			for (let batch = 0; batch < 5; batch++) {
				for (let subBatch = 0; subBatch < 2; subBatch++) {
					for (let i = 1; i <= 10; i++) {
						rateLimitFormSubmission(ip, null, 'contact');
					}
					if (subBatch === 0) {
						vi.advanceTimersByTime(61 * 1000);
					}
				}
				if (batch < 4) {
					vi.advanceTimersByTime(301 * 1000);
				}
			}

			// Advance to reset short and medium windows
			vi.advanceTimersByTime(301 * 1000);

			// 101st request should be blocked by long-term limit
			const result = rateLimitFormSubmission(ip, null, 'contact');
			expect(result.allowed).toBe(false);
			expect(result.limitType).toBe('long');
			expect(result.message).toContain('Too many requests');
			expect(result.windowMs).toBe(60 * 60 * 1000);
			expect(result.maxRequests).toBe(100);
		});

		test('allows requests after 1 hour window expires', () => {
			const ip = '192.168.3.3';

			// Make 100 requests
			for (let batch = 0; batch < 5; batch++) {
				for (let subBatch = 0; subBatch < 2; subBatch++) {
					for (let i = 1; i <= 10; i++) {
						rateLimitFormSubmission(ip, null, 'contact');
					}
					if (subBatch === 0) {
						vi.advanceTimersByTime(61 * 1000);
					}
				}
				if (batch < 4) {
					vi.advanceTimersByTime(301 * 1000);
				}
			}

			// Advance to reset short/medium
			vi.advanceTimersByTime(301 * 1000);

			// Should be blocked by long-term
			const blocked = rateLimitFormSubmission(ip, null, 'contact');
			expect(blocked.allowed).toBe(false);
			expect(blocked.limitType).toBe('long');

			// Total time so far: 1810 seconds
			// Advance past 1 hour from start (3600 - 1810 + 1)
			vi.advanceTimersByTime((3600 - 1810 + 1) * 1000);

			// Should be allowed again
			const allowed = rateLimitFormSubmission(ip, null, 'contact');
			expect(allowed.allowed).toBe(true);
		});

		test('calculates correct retryAfter for long-term limit', () => {
			const ip = '192.168.3.4';

			// Make 100 requests
			for (let batch = 0; batch < 5; batch++) {
				for (let subBatch = 0; subBatch < 2; subBatch++) {
					for (let i = 1; i <= 10; i++) {
						rateLimitFormSubmission(ip, null, 'contact');
					}
					if (subBatch === 0) {
						vi.advanceTimersByTime(61 * 1000);
					}
				}
				if (batch < 4) {
					vi.advanceTimersByTime(301 * 1000);
				}
			}

			// Advance to reset short/medium
			vi.advanceTimersByTime(301 * 1000);

			// At this point, 1810 seconds have passed
			// Request should show ~1790 seconds remaining (3600 - 1810)
			const result = rateLimitFormSubmission(ip, null, 'contact');
			expect(result.allowed).toBe(false);
			expect(result.retryAfter).toBeGreaterThanOrEqual(1789);
			expect(result.retryAfter).toBeLessThanOrEqual(1791);
		});
	});

	describe('email-based limiting (5 req/hour)', () => {
		test('allows first request with email', () => {
			const result = rateLimitFormSubmission('192.168.4.1', 'user@example.com', 'contact');
			expect(result.allowed).toBe(true);
		});

		test('allows up to 5 requests per email within 1 hour', () => {
			const email = 'user1@example.com';

			for (let i = 1; i <= 5; i++) {
				const result = rateLimitFormSubmission(`192.168.4.${i}`, email, 'contact');
				expect(result.allowed).toBe(true);
			}
		});

		test('blocks 6th request from same email within 1 hour', () => {
			const email = 'user2@example.com';

			// Make 5 requests
			for (let i = 1; i <= 5; i++) {
				rateLimitFormSubmission(`192.168.4.${10 + i}`, email, 'contact');
			}

			// 6th request should be blocked
			const result = rateLimitFormSubmission('192.168.4.20', email, 'contact');
			expect(result.allowed).toBe(false);
			expect(result.limitType).toBe('email');
			expect(result.message).toContain('Too many submissions from this email address');
			expect(result.windowMs).toBe(60 * 60 * 1000);
			expect(result.maxRequests).toBe(5);
		});

		test('normalizes email to lowercase', () => {
			const emailLower = 'test@example.com';
			const emailUpper = 'TEST@EXAMPLE.COM';
			const emailMixed = 'TeSt@ExAmPlE.cOm';

			// Make requests with different case variations
			rateLimitFormSubmission('192.168.4.21', emailLower, 'contact');
			rateLimitFormSubmission('192.168.4.22', emailUpper, 'contact');
			rateLimitFormSubmission('192.168.4.23', emailMixed, 'contact');
			rateLimitFormSubmission('192.168.4.24', emailLower, 'contact');
			rateLimitFormSubmission('192.168.4.25', emailUpper, 'contact');

			// 6th request should be blocked (all count toward same email)
			const result = rateLimitFormSubmission('192.168.4.26', emailMixed, 'contact');
			expect(result.allowed).toBe(false);
			expect(result.limitType).toBe('email');
		});

		test('allows requests after email window expires', () => {
			const email = 'user3@example.com';

			// Make 5 requests
			for (let i = 1; i <= 5; i++) {
				rateLimitFormSubmission(`192.168.4.${30 + i}`, email, 'contact');
			}

			// Should be blocked
			const blocked = rateLimitFormSubmission('192.168.4.40', email, 'contact');
			expect(blocked.allowed).toBe(false);

			// Advance past 1 hour
			vi.advanceTimersByTime(60 * 60 * 1000 + 1000);

			// Should be allowed again
			const allowed = rateLimitFormSubmission('192.168.4.41', email, 'contact');
			expect(allowed.allowed).toBe(true);
		});

		test('different emails have independent limits', () => {
			const email1 = 'user4@example.com';
			const email2 = 'user5@example.com';

			// Exhaust email1 limit
			for (let i = 1; i <= 5; i++) {
				rateLimitFormSubmission(`192.168.4.${50 + i}`, email1, 'contact');
			}

			const email1Blocked = rateLimitFormSubmission('192.168.4.60', email1, 'contact');
			expect(email1Blocked.allowed).toBe(false);

			// email2 should still work
			const email2Allowed = rateLimitFormSubmission('192.168.4.61', email2, 'contact');
			expect(email2Allowed.allowed).toBe(true);
		});

		test('email limit is independent of IP limit', () => {
			const ip = '192.168.4.100';
			const email = 'user6@example.com';

			// Make 5 requests from same IP with different emails to bypass email limit check
			for (let i = 1; i <= 5; i++) {
				const result = rateLimitFormSubmission(ip, `different${i}@example.com`, 'contact');
				expect(result.allowed).toBe(true);
			}

			// Make 5 more requests from same IP with same email
			for (let i = 1; i <= 5; i++) {
				const result = rateLimitFormSubmission(ip, email, 'contact');
				expect(result.allowed).toBe(true);
			}

			// 11th request from same IP should be blocked (short-term IP limit)
			const ipLimited = rateLimitFormSubmission(ip, 'another@example.com', 'contact');
			expect(ipLimited.allowed).toBe(false);
			expect(ipLimited.limitType).toBe('short');

			// But a different IP with the blocked email should fail too
			const emailLimited = rateLimitFormSubmission('192.168.4.101', email, 'contact');
			expect(emailLimited.allowed).toBe(false);
			expect(emailLimited.limitType).toBe('email');
		});

		test('email limit applies across different IPs', () => {
			const email = 'user7@example.com';

			// Make 5 requests from different IPs with same email
			for (let i = 1; i <= 5; i++) {
				rateLimitFormSubmission(`192.168.5.${i}`, email, 'contact');
			}

			// 6th request from yet another IP should be blocked
			const result = rateLimitFormSubmission('192.168.5.10', email, 'contact');
			expect(result.allowed).toBe(false);
			expect(result.limitType).toBe('email');
		});

		test('calculates correct retryAfter for email limit', () => {
			const email = 'user8@example.com';

			// Make 5 requests
			for (let i = 1; i <= 5; i++) {
				rateLimitFormSubmission(`192.168.5.${20 + i}`, email, 'contact');
			}

			// Advance 30 minutes
			vi.advanceTimersByTime(30 * 60 * 1000);

			// 6th request should show ~30 minutes (1800 seconds) remaining
			const result = rateLimitFormSubmission('192.168.5.30', email, 'contact');
			expect(result.allowed).toBe(false);
			expect(result.retryAfter).toBeGreaterThanOrEqual(1799);
			expect(result.retryAfter).toBeLessThanOrEqual(1801);
		});
	});

	describe('window expiration and reset', () => {
		test('resets short-term window after expiration', () => {
			const ip = '192.168.6.1';

			// Fill up short-term limit
			for (let i = 1; i <= 10; i++) {
				rateLimitFormSubmission(ip, null, 'contact');
			}

			// Verify blocked
			expect(rateLimitFormSubmission(ip, null, 'contact').allowed).toBe(false);

			// Advance past window
			vi.advanceTimersByTime(61 * 1000);

			// Should have fresh 10 requests available
			for (let i = 1; i <= 10; i++) {
				const result = rateLimitFormSubmission(ip, null, 'contact');
				expect(result.allowed).toBe(true);
			}
		});

		test('window resets create new window starting at request time', () => {
			const ip = '192.168.6.2';

			// First request at T=0
			rateLimitFormSubmission(ip, null, 'contact');

			// Advance 70 seconds (past first window)
			vi.advanceTimersByTime(70 * 1000);

			// Second request starts new window at T=70
			rateLimitFormSubmission(ip, null, 'contact');

			// Advance 50 seconds (T=120 total, but only 50 in new window)
			vi.advanceTimersByTime(50 * 1000);

			// Should still be in second window, can make 8 more requests
			// (total 10 in current short-term window)
			for (let i = 1; i <= 8; i++) {
				const result = rateLimitFormSubmission(ip, null, 'contact');
				expect(result.allowed).toBe(true);
			}

			// Now at 10 requests in current short-term window
			// Next request should still be allowed (10th in window)
			const tenth = rateLimitFormSubmission(ip, null, 'contact');
			expect(tenth.allowed).toBe(true);

			// 11th request in current window should be blocked
			const eleventh = rateLimitFormSubmission(ip, null, 'contact');
			expect(eleventh.allowed).toBe(false);
			expect(eleventh.limitType).toBe('short');
		});

		test('partial window expiration correctly resets count', () => {
			const ip = '192.168.6.3';

			// Make 3 requests (short-term window)
			for (let i = 1; i <= 3; i++) {
				rateLimitFormSubmission(ip, null, 'contact');
			}

			// Advance past short-term window
			vi.advanceTimersByTime(61 * 1000);

			// Make 7 more requests (short-term window reset, so count restarts at 0)
			for (let i = 1; i <= 7; i++) {
				const result = rateLimitFormSubmission(ip, null, 'contact');
				expect(result.allowed).toBe(true);
			}

			// 8th request in new window should still be allowed (7 < 10)
			const result = rateLimitFormSubmission(ip, null, 'contact');
			expect(result.allowed).toBe(true);

			// 9th request
			expect(rateLimitFormSubmission(ip, null, 'contact').allowed).toBe(true);

			// 10th request should work
			expect(rateLimitFormSubmission(ip, null, 'contact').allowed).toBe(true);

			// 11th request should be blocked
			expect(rateLimitFormSubmission(ip, null, 'contact').allowed).toBe(false);
		});
	});

	describe('multiple IPs isolation', () => {
		test('different IPs have independent rate limits', () => {
			const ip1 = '192.168.7.1';
			const ip2 = '192.168.7.2';

			// Exhaust ip1 limit
			for (let i = 1; i <= 10; i++) {
				rateLimitFormSubmission(ip1, null, 'contact');
			}

			expect(rateLimitFormSubmission(ip1, null, 'contact').allowed).toBe(false);

			// ip2 should still work
			expect(rateLimitFormSubmission(ip2, null, 'contact').allowed).toBe(true);
		});

		test('handles many concurrent IPs without interference', () => {
			const ips = Array.from({ length: 100 }, (_, i) => `192.168.8.${i}`);

			// Each IP makes 5 requests
			ips.forEach(ip => {
				for (let i = 1; i <= 5; i++) {
					const result = rateLimitFormSubmission(ip, null, 'contact');
					expect(result.allowed).toBe(true);
				}
			});

			// Each IP should still be within limit
			ips.forEach(ip => {
				const result = rateLimitFormSubmission(ip, null, 'contact');
				expect(result.allowed).toBe(true);
			});
		});

		test('IPv6 addresses are tracked separately', () => {
			const ipv4 = '192.168.7.10';
			const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

			// Exhaust IPv4 limit
			for (let i = 1; i <= 10; i++) {
				rateLimitFormSubmission(ipv4, null, 'contact');
			}

			expect(rateLimitFormSubmission(ipv4, null, 'contact').allowed).toBe(false);

			// IPv6 should work independently
			expect(rateLimitFormSubmission(ipv6, null, 'contact').allowed).toBe(true);
		});
	});

	describe('custom options', () => {
		test('custom message appears in response', () => {
			const ip = '192.168.9.3';
			const customMessage = 'Custom rate limit message';

			// Hit limit
			for (let i = 1; i <= 10; i++) {
				rateLimitFormSubmission(ip, null, 'contact');
			}

			// Get custom message
			const result = rateLimitFormSubmission(ip, null, 'contact', {
				message: customMessage
			});
			expect(result.allowed).toBe(false);
			expect(result.message).toBe(customMessage);
		});

		test('skipIpCheck option bypasses IP-based rate limiting', () => {
			const ip = '192.168.9.4';

			// Make 15 requests (would normally hit short-term limit at 11)
			for (let i = 1; i <= 15; i++) {
				const result = rateLimitFormSubmission(ip, null, 'contact', {
					skipIpCheck: true
				});
				expect(result.allowed).toBe(true);
			}
		});

		test('skipIpCheck still enforces email limits', () => {
			const email = 'skipper@example.com';

			// Make 5 requests with skipIpCheck
			for (let i = 1; i <= 5; i++) {
				rateLimitFormSubmission(`192.168.9.${10 + i}`, email, 'contact', {
					skipIpCheck: true
				});
			}

			// 6th request should be blocked by email limit
			const result = rateLimitFormSubmission('192.168.9.20', email, 'contact', {
				skipIpCheck: true
			});
			expect(result.allowed).toBe(false);
			expect(result.limitType).toBe('email');
		});
	});

	describe('concurrent requests', () => {
		test('handles rapid successive requests correctly', () => {
			const ip = '192.168.10.1';

			// Simulate rapid requests (all in same event loop)
			const results = [];
			for (let i = 1; i <= 12; i++) {
				results.push(rateLimitFormSubmission(ip, null, 'contact'));
			}

			// First 10 should be allowed
			for (let i = 0; i < 10; i++) {
				expect(results[i].allowed).toBe(true);
			}

			// 11th and 12th should be blocked
			expect(results[10].allowed).toBe(false);
			expect(results[11].allowed).toBe(false);
		});

		test('correctly increments count for each request', () => {
			const ip = '192.168.10.2';

			// Make 10 requests and verify count increases
			for (let i = 1; i <= 10; i++) {
				const result = rateLimitFormSubmission(ip, null, 'contact');
				expect(result.allowed).toBe(true);

				// Next request should be blocked after 10
				if (i === 10) {
					const next = rateLimitFormSubmission(ip, null, 'contact');
					expect(next.allowed).toBe(false);
				}
			}
		});
	});

	describe('form type scoping', () => {
		test('different form types have independent limits', () => {
			const ip = '192.168.11.1';

			// Exhaust contact form
			for (let i = 1; i <= 10; i++) {
				rateLimitFormSubmission(ip, null, 'contact');
			}
			expect(rateLimitFormSubmission(ip, null, 'contact').allowed).toBe(false);

			// Newsletter form independent
			for (let i = 1; i <= 10; i++) {
				const result = rateLimitFormSubmission(ip, null, 'newsletter');
				expect(result.allowed).toBe(true);
			}

			// Feedback form independent
			for (let i = 1; i <= 10; i++) {
				const result = rateLimitFormSubmission(ip, null, 'feedback');
				expect(result.allowed).toBe(true);
			}
		});

		test('email limits are scoped by form type', () => {
			const email = 'multiform@example.com';

			// Exhaust contact form email limit
			for (let i = 1; i <= 5; i++) {
				rateLimitFormSubmission(`192.168.11.${10 + i}`, email, 'contact');
			}
			expect(rateLimitFormSubmission('192.168.11.20', email, 'contact').allowed).toBe(false);

			// Newsletter form email limit independent
			for (let i = 1; i <= 5; i++) {
				const result = rateLimitFormSubmission(`192.168.11.${20 + i}`, email, 'newsletter');
				expect(result.allowed).toBe(true);
			}
		});

		test('default form type is "contact"', () => {
			const ip1 = '192.168.11.30';
			const ip2 = '192.168.11.31';

			// Exhaust without specifying form type
			for (let i = 1; i <= 10; i++) {
				rateLimitFormSubmission(ip1, null);
			}
			expect(rateLimitFormSubmission(ip1, null).allowed).toBe(false);

			// Explicitly specify contact
			for (let i = 1; i <= 10; i++) {
				rateLimitFormSubmission(ip2, null, 'contact');
			}
			expect(rateLimitFormSubmission(ip2, null, 'contact').allowed).toBe(false);
		});
	});

	describe('edge cases', () => {
		test('handles null email gracefully', () => {
			const result = rateLimitFormSubmission('192.168.12.1', null, 'contact');
			expect(result.allowed).toBe(true);
		});

		test('handles empty string IP', () => {
			const result = rateLimitFormSubmission('', null, 'contact');
			expect(result.allowed).toBe(true);
		});

		test('handles empty string email', () => {
			// Empty string is falsy, so should be treated like null
			const result = rateLimitFormSubmission('192.168.12.2', '', 'contact');
			expect(result.allowed).toBe(true);
		});

		test('handles special characters in form type', () => {
			const ip = '192.168.12.3';
			const formType = 'contact-us_v2';

			for (let i = 1; i <= 10; i++) {
				const result = rateLimitFormSubmission(ip, null, formType);
				expect(result.allowed).toBe(true);
			}

			expect(rateLimitFormSubmission(ip, null, formType).allowed).toBe(false);
		});

		test('handles very long email addresses', () => {
			const longEmail = 'a'.repeat(200) + '@example.com';
			const result = rateLimitFormSubmission('192.168.12.4', longEmail, 'contact');
			expect(result.allowed).toBe(true);
		});

		test('handles special characters in email', () => {
			const email = 'user+tag@example.co.uk';
			for (let i = 1; i <= 5; i++) {
				rateLimitFormSubmission(`192.168.12.${10 + i}`, email, 'contact');
			}
			const result = rateLimitFormSubmission('192.168.12.20', email, 'contact');
			expect(result.allowed).toBe(false);
			expect(result.limitType).toBe('email');
		});

		test('retryAfter is always a positive integer', () => {
			const ip = '192.168.12.5';

			for (let i = 1; i <= 10; i++) {
				rateLimitFormSubmission(ip, null, 'contact');
			}

			const result = rateLimitFormSubmission(ip, null, 'contact');
			expect(result.retryAfter).toBeGreaterThan(0);
			expect(Number.isInteger(result.retryAfter)).toBe(true);
		});

		test('retryAfter rounds up to nearest second', () => {
			const ip = '192.168.12.6';

			for (let i = 1; i <= 10; i++) {
				rateLimitFormSubmission(ip, null, 'contact');
			}

			// Advance 59.1 seconds (59100ms)
			vi.advanceTimersByTime(59100);

			// Should show 1 second remaining (ceiling of 0.9)
			const result = rateLimitFormSubmission(ip, null, 'contact');
			expect(result.retryAfter).toBe(1);
		});
	});

	describe('DOS attack scenarios', () => {
		test('prevents rapid-fire attack from single IP', () => {
			const ip = '192.168.13.1';

			// Attacker tries to flood with 1000 requests
			let blockedCount = 0;
			for (let i = 1; i <= 1000; i++) {
				const result = rateLimitFormSubmission(ip, null, 'contact');
				if (!result.allowed) {
					blockedCount++;
				}
			}

			// Only 10 should succeed (short-term limit)
			expect(blockedCount).toBe(990);
		});

		test('prevents distributed attack from multiple IPs with same email', () => {
			const email = 'attacker@evil.com';

			// Attacker uses different IPs with same email
			for (let i = 1; i <= 100; i++) {
				rateLimitFormSubmission(`10.0.0.${i}`, email, 'contact');
			}

			// Only 5 should succeed (email limit)
			const result = rateLimitFormSubmission('10.0.0.200', email, 'contact');
			expect(result.allowed).toBe(false);
			expect(result.limitType).toBe('email');
		});

		test('prevents slow-rate long-term attack', () => {
			const ip = '192.168.13.2';

			// Attacker makes batches spaced to bypass short/medium limits but hit long-term
			// Similar to long-term test: 5 batches of 20, spaced 5+ min apart
			for (let batch = 0; batch < 5; batch++) {
				for (let subBatch = 0; subBatch < 2; subBatch++) {
					for (let i = 1; i <= 10; i++) {
						const result = rateLimitFormSubmission(ip, null, 'contact');
						expect(result.allowed).toBe(true);
					}
					if (subBatch === 0) {
						vi.advanceTimersByTime(61 * 1000);
					}
				}
				if (batch < 4) {
					vi.advanceTimersByTime(301 * 1000);
				}
			}

			// Reset short/medium windows
			vi.advanceTimersByTime(301 * 1000);

			// 101st request should be blocked by long-term limit
			const result = rateLimitFormSubmission(ip, null, 'contact');
			expect(result.allowed).toBe(false);
			expect(result.limitType).toBe('long');
		});

		test('prevents email enumeration attack', () => {
			const ip = '192.168.13.3';
			const emails = Array.from({ length: 20 }, (_, i) => `user${i}@example.com`);

			// Attacker tries to test many emails
			let successCount = 0;
			emails.forEach(email => {
				const result = rateLimitFormSubmission(ip, email, 'contact');
				if (result.allowed) {
					successCount++;
				}
			});

			// Should be limited by IP limits (10 max in short term)
			expect(successCount).toBeLessThanOrEqual(10);
		});

		test('handles attack with mixed form types', () => {
			const ip = '192.168.13.4';
			const formTypes = ['contact', 'newsletter', 'feedback', 'support'];

			// Attacker rotates form types to bypass limits
			let totalBlocked = 0;
			for (let round = 1; round <= 50; round++) {
				formTypes.forEach(formType => {
					const result = rateLimitFormSubmission(ip, null, formType);
					if (!result.allowed) {
						totalBlocked++;
					}
				});
			}

			// Should still hit limits (10 per form type)
			expect(totalBlocked).toBeGreaterThan(150); // 50 * 4 = 200 total, 40 allowed (10 per type)
		});
	});
});

describe('getRateLimitStats', () => {
	beforeEach(() => {
		clearAllRateLimits();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('returns zero entries when no requests made', () => {
		const stats = getRateLimitStats();
		expect(stats.ipEntries).toBe(0);
		expect(stats.emailEntries).toBe(0);
	});

	test('tracks IP entries correctly', () => {
		rateLimitFormSubmission('192.168.20.1', null, 'contact');
		rateLimitFormSubmission('192.168.20.2', null, 'contact');

		const stats = getRateLimitStats();
		// Each IP creates 3 entries (short, medium, long)
		expect(stats.ipEntries).toBe(6);
		expect(stats.emailEntries).toBe(0);
	});

	test('tracks email entries correctly', () => {
		rateLimitFormSubmission('192.168.20.3', 'user1@example.com', 'contact');
		rateLimitFormSubmission('192.168.20.4', 'user2@example.com', 'contact');

		const stats = getRateLimitStats();
		// Each IP creates 3 entries, each email creates 1 entry
		expect(stats.ipEntries).toBe(6);
		expect(stats.emailEntries).toBe(2);
	});

	test('tracks mixed IP and email entries', () => {
		rateLimitFormSubmission('192.168.20.5', 'user3@example.com', 'contact');
		rateLimitFormSubmission('192.168.20.6', null, 'newsletter');

		const stats = getRateLimitStats();
		expect(stats.ipEntries).toBe(6); // 3 per IP
		expect(stats.emailEntries).toBe(1);
	});
});

describe('resetIpRateLimit', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		clearAllRateLimits();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('resets rate limits for specific IP', () => {
		const ip = '192.168.20.1';

		// Hit limit
		for (let i = 1; i <= 10; i++) {
			rateLimitFormSubmission(ip, null, 'contact');
		}
		expect(rateLimitFormSubmission(ip, null, 'contact').allowed).toBe(false);

		// Reset this IP
		resetIpRateLimit(ip, 'contact');

		// Should work again
		expect(rateLimitFormSubmission(ip, null, 'contact').allowed).toBe(true);
	});

	test('resets all tiers for IP (short, medium, long)', () => {
		const ip = '192.168.20.2';

		// Make requests that would hit multiple tiers
		for (let batch = 0; batch < 3; batch++) {
			for (let i = 1; i <= 10; i++) {
				rateLimitFormSubmission(ip, null, 'contact');
			}
			if (batch < 2) {
				vi.advanceTimersByTime(61 * 1000);
			}
		}

		vi.advanceTimersByTime(61 * 1000);

		// Should be blocked by medium-term
		expect(rateLimitFormSubmission(ip, null, 'contact').allowed).toBe(false);

		// Reset this IP
		resetIpRateLimit(ip, 'contact');

		// Should work again for all tiers
		expect(rateLimitFormSubmission(ip, null, 'contact').allowed).toBe(true);
	});

	test('only resets specified form type', () => {
		const ip = '192.168.20.3';

		// Hit limits on both form types
		for (let i = 1; i <= 10; i++) {
			rateLimitFormSubmission(ip, null, 'contact');
			rateLimitFormSubmission(ip, null, 'newsletter');
		}

		// Reset only contact
		resetIpRateLimit(ip, 'contact');

		// Contact should work, newsletter still blocked
		expect(rateLimitFormSubmission(ip, null, 'contact').allowed).toBe(true);
		expect(rateLimitFormSubmission(ip, null, 'newsletter').allowed).toBe(false);
	});

	test('does not affect other IPs', () => {
		const ip1 = '192.168.20.4';
		const ip2 = '192.168.20.5';

		// Hit limits for both IPs
		for (let i = 1; i <= 10; i++) {
			rateLimitFormSubmission(ip1, null, 'contact');
			rateLimitFormSubmission(ip2, null, 'contact');
		}

		// Reset only ip1
		resetIpRateLimit(ip1, 'contact');

		// ip1 should work, ip2 still blocked
		expect(rateLimitFormSubmission(ip1, null, 'contact').allowed).toBe(true);
		expect(rateLimitFormSubmission(ip2, null, 'contact').allowed).toBe(false);
	});
});

describe('resetEmailRateLimit', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		clearAllRateLimits();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('resets rate limits for specific email', () => {
		const email = 'reset@example.com';

		// Hit limit
		for (let i = 1; i <= 5; i++) {
			rateLimitFormSubmission(`192.168.20.${10 + i}`, email, 'contact');
		}
		expect(rateLimitFormSubmission('192.168.20.20', email, 'contact').allowed).toBe(false);

		// Reset this email
		resetEmailRateLimit(email, 'contact');

		// Should work again
		expect(rateLimitFormSubmission('192.168.20.21', email, 'contact').allowed).toBe(true);
	});

	test('normalizes email to lowercase before resetting', () => {
		const email = 'RESET@EXAMPLE.COM';

		// Hit limit with lowercase
		for (let i = 1; i <= 5; i++) {
			rateLimitFormSubmission(`192.168.20.${30 + i}`, 'reset@example.com', 'contact');
		}

		// Reset with uppercase (should work due to normalization)
		resetEmailRateLimit(email, 'contact');

		// Should work again
		expect(rateLimitFormSubmission('192.168.20.40', 'reset@example.com', 'contact').allowed).toBe(true);
	});

	test('only resets specified form type', () => {
		const email = 'multiform@example.com';

		// Hit limits on both form types
		for (let i = 1; i <= 5; i++) {
			rateLimitFormSubmission(`192.168.20.${50 + i}`, email, 'contact');
			rateLimitFormSubmission(`192.168.20.${60 + i}`, email, 'newsletter');
		}

		// Reset only contact
		resetEmailRateLimit(email, 'contact');

		// Contact should work, newsletter still blocked
		expect(rateLimitFormSubmission('192.168.20.70', email, 'contact').allowed).toBe(true);
		expect(rateLimitFormSubmission('192.168.20.71', email, 'newsletter').allowed).toBe(false);
	});

	test('does not affect other emails', () => {
		const email1 = 'user1@example.com';
		const email2 = 'user2@example.com';

		// Hit limits for both emails
		for (let i = 1; i <= 5; i++) {
			rateLimitFormSubmission(`192.168.20.${80 + i}`, email1, 'contact');
			rateLimitFormSubmission(`192.168.20.${90 + i}`, email2, 'contact');
		}

		// Reset only email1
		resetEmailRateLimit(email1, 'contact');

		// email1 should work, email2 still blocked
		expect(rateLimitFormSubmission('192.168.20.100', email1, 'contact').allowed).toBe(true);
		expect(rateLimitFormSubmission('192.168.20.101', email2, 'contact').allowed).toBe(false);
	});
});

describe('clearAllRateLimits', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('clears all IP rate limits', () => {
		const ip = '192.168.21.1';

		// Hit limit
		for (let i = 1; i <= 10; i++) {
			rateLimitFormSubmission(ip, null, 'contact');
		}
		expect(rateLimitFormSubmission(ip, null, 'contact').allowed).toBe(false);

		// Clear
		clearAllRateLimits();

		// Should work again
		expect(rateLimitFormSubmission(ip, null, 'contact').allowed).toBe(true);
	});

	test('clears all email rate limits', () => {
		const email = 'clear@example.com';

		// Hit limit
		for (let i = 1; i <= 5; i++) {
			rateLimitFormSubmission(`192.168.21.${10 + i}`, email, 'contact');
		}
		expect(rateLimitFormSubmission('192.168.21.20', email, 'contact').allowed).toBe(false);

		// Clear
		clearAllRateLimits();

		// Should work again
		expect(rateLimitFormSubmission('192.168.21.21', email, 'contact').allowed).toBe(true);
	});

	test('clears all entries across form types', () => {
		const ip = '192.168.21.2';

		// Hit limits on multiple form types
		for (let i = 1; i <= 10; i++) {
			rateLimitFormSubmission(ip, null, 'contact');
			rateLimitFormSubmission(ip, null, 'newsletter');
		}

		clearAllRateLimits();

		// Both should work again
		expect(rateLimitFormSubmission(ip, null, 'contact').allowed).toBe(true);
		expect(rateLimitFormSubmission(ip, null, 'newsletter').allowed).toBe(true);
	});

	test('resets stats to zero', () => {
		rateLimitFormSubmission('192.168.21.3', 'stats@example.com', 'contact');

		clearAllRateLimits();

		const stats = getRateLimitStats();
		expect(stats.ipEntries).toBe(0);
		expect(stats.emailEntries).toBe(0);
	});
});

describe('cleanup behavior', () => {
	beforeEach(() => {
		clearAllRateLimits();
		vi.useFakeTimers();
		// Restart cleanup timer so it's controlled by fake timers
		restartCleanup();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('entries remain in memory within cleanup interval', () => {
		rateLimitFormSubmission('192.168.22.1', 'cleanup@example.com', 'contact');

		const statsBefore = getRateLimitStats();
		expect(statsBefore.ipEntries).toBeGreaterThan(0);
		expect(statsBefore.emailEntries).toBeGreaterThan(0);

		// Advance 4 minutes (less than 5 minute cleanup interval)
		vi.advanceTimersByTime(4 * 60 * 1000);

		const statsAfter = getRateLimitStats();
		expect(statsAfter.ipEntries).toBe(statsBefore.ipEntries);
		expect(statsAfter.emailEntries).toBe(statsBefore.emailEntries);
	});

	test('old entries are cleaned up after 1 hour + cleanup interval', () => {
		// Note: The cleanup timer uses setInterval which starts when the module loads.
		// We need to advance time by enough to trigger the cleanup interval.
		// The cleanup prevents memory leaks by removing entries older than 1 hour every 5 minutes.
		rateLimitFormSubmission('192.168.22.2', 'old@example.com', 'contact');

		const statsBefore = getRateLimitStats();
		expect(statsBefore.ipEntries).toBeGreaterThan(0);
		expect(statsBefore.emailEntries).toBeGreaterThan(0);

		// Advance past 1 hour (maxAge = 60 min) + at least one cleanup cycle (5 min)
		vi.advanceTimersByTime(66 * 60 * 1000);

		// Cleanup should have removed old entries
		const stats = getRateLimitStats();
		expect(stats.ipEntries).toBe(0);
		expect(stats.emailEntries).toBe(0);
	});

	test('recent entries are not cleaned up', () => {
		// Make request at T=0
		rateLimitFormSubmission('192.168.22.3', 'recent@example.com', 'contact');

		// Advance 30 minutes
		vi.advanceTimersByTime(30 * 60 * 1000);

		// Make another request (this is recent)
		rateLimitFormSubmission('192.168.22.4', 'new@example.com', 'contact');

		// Advance another 35 minutes (total 65, triggers cleanup)
		// First entry is > 1 hour old, second is < 1 hour old
		vi.advanceTimersByTime(35 * 60 * 1000);

		const stats = getRateLimitStats();
		// Second IP and email should still exist
		expect(stats.ipEntries).toBeGreaterThan(0);
		expect(stats.emailEntries).toBeGreaterThan(0);
	});

	test('cleanup runs periodically', () => {
		// Create entry
		rateLimitFormSubmission('192.168.22.5', 'periodic@example.com', 'contact');

		// Advance through multiple cleanup cycles
		for (let i = 0; i < 3; i++) {
			vi.advanceTimersByTime(5 * 60 * 1000); // Each cleanup interval
			// After first cycle: 5 min (entry still fresh)
			// After second cycle: 10 min (entry still fresh)
			// After third cycle: 15 min (entry still fresh)
		}

		// Entry is only 15 minutes old, should still exist
		const stats = getRateLimitStats();
		expect(stats.ipEntries).toBeGreaterThan(0);
	});
});

describe('retryAfter precision', () => {
	beforeEach(() => {
		clearAllRateLimits();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('retryAfter shows full window time when blocked immediately', () => {
		const ip = '192.168.23.1';

		// Hit short-term limit
		for (let i = 1; i <= 10; i++) {
			rateLimitFormSubmission(ip, null, 'contact');
		}

		// Immediate retry shows ~60 seconds
		const result = rateLimitFormSubmission(ip, null, 'contact');
		expect(result.retryAfter).toBe(60);
	});

	test('retryAfter decreases as time passes', () => {
		const ip = '192.168.23.2';

		// Hit limit
		for (let i = 1; i <= 10; i++) {
			rateLimitFormSubmission(ip, null, 'contact');
		}

		// Check at different intervals
		vi.advanceTimersByTime(10 * 1000);
		const result1 = rateLimitFormSubmission(ip, null, 'contact');
		expect(result1.retryAfter).toBeGreaterThanOrEqual(49);
		expect(result1.retryAfter).toBeLessThanOrEqual(50);

		vi.advanceTimersByTime(20 * 1000);
		const result2 = rateLimitFormSubmission(ip, null, 'contact');
		expect(result2.retryAfter).toBeGreaterThanOrEqual(29);
		expect(result2.retryAfter).toBeLessThanOrEqual(30);
	});

	test('retryAfter for medium-term shows correct remaining time', () => {
		const ip = '192.168.23.3';

		// Hit medium-term limit (30 req in 5 min)
		for (let batch = 0; batch < 3; batch++) {
			for (let i = 1; i <= 10; i++) {
				rateLimitFormSubmission(ip, null, 'contact');
			}
			if (batch < 2) {
				vi.advanceTimersByTime(61 * 1000);
			}
		}

		// Advance 61 seconds to reset short-term
		vi.advanceTimersByTime(61 * 1000);

		// Time elapsed: 183 seconds, window: 300 seconds
		// Remaining: 117 seconds
		const result = rateLimitFormSubmission(ip, null, 'contact');
		expect(result.retryAfter).toBeGreaterThanOrEqual(116);
		expect(result.retryAfter).toBeLessThanOrEqual(118);
	});

	test('retryAfter for long-term shows correct remaining time', () => {
		const ip = '192.168.23.4';

		// Hit long-term limit (100 req in 1 hour)
		for (let batch = 0; batch < 5; batch++) {
			for (let subBatch = 0; subBatch < 2; subBatch++) {
				for (let i = 1; i <= 10; i++) {
					rateLimitFormSubmission(ip, null, 'contact');
				}
				if (subBatch === 0) {
					vi.advanceTimersByTime(61 * 1000);
				}
			}
			if (batch < 4) {
				vi.advanceTimersByTime(301 * 1000);
			}
		}

		// Advance to reset short/medium
		vi.advanceTimersByTime(301 * 1000);

		// Time elapsed: 1810 seconds, window: 3600 seconds
		// Remaining: 1790 seconds
		const result = rateLimitFormSubmission(ip, null, 'contact');
		expect(result.retryAfter).toBeGreaterThanOrEqual(1789);
		expect(result.retryAfter).toBeLessThanOrEqual(1791);
	});

	test('retryAfter for email shows correct remaining time', () => {
		const email = 'retry@example.com';

		// Hit email limit
		for (let i = 1; i <= 5; i++) {
			rateLimitFormSubmission(`192.168.23.${10 + i}`, email, 'contact');
		}

		// Advance 1200 seconds (20 minutes)
		vi.advanceTimersByTime(1200 * 1000);

		// Window: 3600 seconds, elapsed: 1200, remaining: 2400
		const result = rateLimitFormSubmission('192.168.23.20', email, 'contact');
		expect(result.retryAfter).toBeGreaterThanOrEqual(2399);
		expect(result.retryAfter).toBeLessThanOrEqual(2401);
	});
});
