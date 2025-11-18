/**
 * Date Utilities for @goobits/ui
 *
 * Collection of helper functions for date manipulation,
 * formatting, and validation in the DatePicker component.
 *
 * @module date-utils
 */

/**
 * Format a date according to the specified format string
 *
 * Supported tokens:
 * - YYYY: 4-digit year
 * - YY: 2-digit year
 * - MM: 2-digit month
 * - M: month without leading zero
 * - DD: 2-digit day
 * - D: day without leading zero
 * - MMM: short month name
 * - MMMM: full month name
 *
 * @param date - The date to format
 * @param format - Format string (e.g., 'MM/DD/YYYY', 'YYYY-MM-DD')
 * @param locale - Locale string for month names (default: 'en-US')
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatDate(new Date(2024, 0, 15), 'MM/DD/YYYY') // '01/15/2024'
 * formatDate(new Date(2024, 0, 15), 'YYYY-MM-DD') // '2024-01-15'
 * formatDate(new Date(2024, 0, 15), 'MMM DD, YYYY') // 'Jan 15, 2024'
 * ```
 */
export function formatDate(date: Date, format: string, locale: string = 'en-US'): string {
	const year = date.getFullYear();
	const month = date.getMonth();
	const day = date.getDate();

	const monthNames = Array.from({ length: 12 }, (_, i) =>
		new Date(2000, i, 1).toLocaleDateString(locale, { month: 'long' })
	);
	const monthNamesShort = Array.from({ length: 12 }, (_, i) =>
		new Date(2000, i, 1).toLocaleDateString(locale, { month: 'short' })
	);

	const tokens: Record<string, string> = {
		YYYY: year.toString(),
		YY: year.toString().slice(-2),
		MMMM: monthNames[month],
		MMM: monthNamesShort[month],
		MM: (month + 1).toString().padStart(2, '0'),
		M: (month + 1).toString(),
		DD: day.toString().padStart(2, '0'),
		D: day.toString()
	};

	let result = format;
	// Sort by length descending to replace longer tokens first
	Object.keys(tokens)
		.sort((a, b) => b.length - a.length)
		.forEach((token) => {
			result = result.replace(new RegExp(token, 'g'), tokens[token]);
		});

	return result;
}

/**
 * Parse a date string according to the specified format
 *
 * @param dateString - The date string to parse
 * @param format - Format string matching the date string
 * @returns Parsed Date object or undefined if parsing fails
 *
 * @example
 * ```typescript
 * parseDate('01/15/2024', 'MM/DD/YYYY') // Date(2024, 0, 15)
 * parseDate('2024-01-15', 'YYYY-MM-DD') // Date(2024, 0, 15)
 * ```
 */
export function parseDate(dateString: string, format: string): Date | undefined {
	try {
		// Simple parser for common formats
		const formatLower = format.toLowerCase();

		let year: number;
		let month: number;
		let day: number;

		if (formatLower === 'yyyy-mm-dd') {
			const parts = dateString.split('-');
			if (parts.length !== 3) return undefined;
			year = parseInt(parts[0], 10);
			month = parseInt(parts[1], 10) - 1;
			day = parseInt(parts[2], 10);
		} else if (formatLower === 'mm/dd/yyyy') {
			const parts = dateString.split('/');
			if (parts.length !== 3) return undefined;
			month = parseInt(parts[0], 10) - 1;
			day = parseInt(parts[1], 10);
			year = parseInt(parts[2], 10);
		} else if (formatLower === 'dd/mm/yyyy') {
			const parts = dateString.split('/');
			if (parts.length !== 3) return undefined;
			day = parseInt(parts[0], 10);
			month = parseInt(parts[1], 10) - 1;
			year = parseInt(parts[2], 10);
		} else {
			// Fallback to basic ISO parsing
			const date = new Date(dateString);
			return isNaN(date.getTime()) ? undefined : date;
		}

		const date = new Date(year, month, day);
		return isNaN(date.getTime()) ? undefined : date;
	} catch {
		return undefined;
	}
}

/**
 * Get the number of days in a specific month
 *
 * @param year - The year
 * @param month - The month (0-11)
 * @returns Number of days in the month
 *
 * @example
 * ```typescript
 * getDaysInMonth(2024, 1) // 29 (leap year February)
 * getDaysInMonth(2023, 1) // 28
 * getDaysInMonth(2024, 0) // 31 (January)
 * ```
 */
export function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of week for the first day of a month
 *
 * @param year - The year
 * @param month - The month (0-11)
 * @returns Day of week (0-6, where 0 is Sunday)
 *
 * @example
 * ```typescript
 * getFirstDayOfMonth(2024, 0) // Day of week for Jan 1, 2024
 * ```
 */
export function getFirstDayOfMonth(year: number, month: number): number {
	return new Date(year, month, 1).getDay();
}

/**
 * Check if two dates are the same day (ignoring time)
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are the same day
 *
 * @example
 * ```typescript
 * isSameDay(new Date(2024, 0, 15, 10, 30), new Date(2024, 0, 15, 18, 45)) // true
 * isSameDay(new Date(2024, 0, 15), new Date(2024, 0, 16)) // false
 * ```
 */
export function isSameDay(date1: Date, date2: Date): boolean {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

/**
 * Check if two dates are in the same month
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are in the same month and year
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
	return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
}

/**
 * Check if a date falls within a range (inclusive)
 *
 * @param date - The date to check
 * @param min - Minimum date (inclusive)
 * @param max - Maximum date (inclusive)
 * @returns True if date is within range
 *
 * @example
 * ```typescript
 * isDateInRange(
 *   new Date(2024, 0, 15),
 *   new Date(2024, 0, 1),
 *   new Date(2024, 0, 31)
 * ) // true
 * ```
 */
export function isDateInRange(date: Date, min?: Date, max?: Date): boolean {
	const dateTime = startOfDay(date).getTime();

	if (min && dateTime < startOfDay(min).getTime()) {
		return false;
	}

	if (max && dateTime > startOfDay(max).getTime()) {
		return false;
	}

	return true;
}

/**
 * Add days to a date
 *
 * @param date - The base date
 * @param days - Number of days to add (can be negative)
 * @returns New date with days added
 *
 * @example
 * ```typescript
 * addDays(new Date(2024, 0, 15), 7) // Jan 22, 2024
 * addDays(new Date(2024, 0, 15), -7) // Jan 8, 2024
 * ```
 */
export function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

/**
 * Add months to a date
 *
 * @param date - The base date
 * @param months - Number of months to add (can be negative)
 * @returns New date with months added
 *
 * @example
 * ```typescript
 * addMonths(new Date(2024, 0, 15), 1) // Feb 15, 2024
 * addMonths(new Date(2024, 0, 31), 1) // Feb 29, 2024 (adjusts to last day)
 * ```
 */
export function addMonths(date: Date, months: number): Date {
	const result = new Date(date);
	const day = result.getDate();
	result.setMonth(result.getMonth() + months);

	// Handle day overflow (e.g., Jan 31 + 1 month = Feb 28/29)
	if (result.getDate() !== day) {
		result.setDate(0); // Set to last day of previous month
	}

	return result;
}

/**
 * Add years to a date
 *
 * @param date - The base date
 * @param years - Number of years to add (can be negative)
 * @returns New date with years added
 */
export function _addYears(date: Date, years: number): Date {
	const result = new Date(date);
	result.setFullYear(result.getFullYear() + years);
	return result;
}

/**
 * Get the start of day (midnight) for a date
 *
 * @param date - The date
 * @returns New date at start of day (00:00:00.000)
 *
 * @example
 * ```typescript
 * startOfDay(new Date(2024, 0, 15, 14, 30)) // 2024-01-15 00:00:00.000
 * ```
 */
export function startOfDay(date: Date): Date {
	const result = new Date(date);
	result.setHours(0, 0, 0, 0);
	return result;
}

/**
 * Get the end of day for a date
 *
 * @param date - The date
 * @returns New date at end of day (23:59:59.999)
 */
export function endOfDay(date: Date): Date {
	const result = new Date(date);
	result.setHours(23, 59, 59, 999);
	return result;
}

/**
 * Get the start of month for a date
 *
 * @param date - The date
 * @returns New date at start of month
 */
export function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the end of month for a date
 *
 * @param date - The date
 * @returns New date at end of month
 */
export function endOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Check if a date is today
 *
 * @param date - The date to check
 * @returns True if date is today
 */
export function isToday(date: Date): boolean {
	return isSameDay(date, new Date());
}

/**
 * Check if a year is a leap year
 *
 * @param year - The year to check
 * @returns True if year is a leap year
 */
export function isLeapYear(year: number): boolean {
	return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get an array of dates for a calendar month grid
 * Includes dates from previous and next months to fill the grid
 *
 * @param year - The year
 * @param month - The month (0-11)
 * @param startDay - First day of week (0=Sunday, 1=Monday)
 * @returns Array of dates for calendar grid (typically 35 or 42 days)
 */
export function getMonthCalendarDates(
	year: number,
	month: number,
	startDay: number = 0
): Date[] {
	const firstDayOfMonth = getFirstDayOfMonth(year, month);
	const daysInMonth = getDaysInMonth(year, month);

	// Calculate how many days from previous month to show
	let daysFromPrevMonth = firstDayOfMonth - startDay;
	if (daysFromPrevMonth < 0) daysFromPrevMonth += 7;

	const dates: Date[] = [];

	// Add dates from previous month
	const prevMonthDate = new Date(year, month, 0);
	const daysInPrevMonth = prevMonthDate.getDate();
	for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
		dates.push(new Date(year, month - 1, daysInPrevMonth - i));
	}

	// Add dates from current month
	for (let i = 1; i <= daysInMonth; i++) {
		dates.push(new Date(year, month, i));
	}

	// Add dates from next month to complete the grid (make it 42 days = 6 weeks)
	const remainingDays = 42 - dates.length;
	for (let i = 1; i <= remainingDays; i++) {
		dates.push(new Date(year, month + 1, i));
	}

	return dates;
}

/**
 * Get localized day names
 *
 * @param locale - Locale string (default: 'en-US')
 * @param format - Format: 'long', 'short', or 'narrow'
 * @param startDay - First day of week (0=Sunday, 1=Monday)
 * @returns Array of day names
 */
export function getDayNames(
	locale: string = 'en-US',
	format: 'long' | 'short' | 'narrow' = 'short',
	startDay: number = 0
): string[] {
	const baseDate = new Date(2024, 0, 7); // A Sunday
	const days = Array.from({ length: 7 }, (_, i) => {
		const date = addDays(baseDate, i);
		return date.toLocaleDateString(locale, { weekday: format });
	});

	// Rotate array based on start day
	return [...days.slice(startDay), ...days.slice(0, startDay)];
}

/**
 * Get localized month names
 *
 * @param locale - Locale string (default: 'en-US')
 * @param format - Format: 'long' or 'short'
 * @returns Array of month names
 */
export function getMonthNames(
	locale: string = 'en-US',
	format: 'long' | 'short' = 'long'
): string[] {
	return Array.from({ length: 12 }, (_, i) =>
		new Date(2000, i, 1).toLocaleDateString(locale, { month: format })
	);
}

/**
 * Compare two dates (ignoring time)
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDate(date1: Date, date2: Date): number {
	const time1 = startOfDay(date1).getTime();
	const time2 = startOfDay(date2).getTime();

	if (time1 < time2) return -1;
	if (time1 > time2) return 1;
	return 0;
}

/**
 * Get the week number for a date (ISO week)
 *
 * @param date - The date
 * @returns ISO week number (1-53)
 */
export function getWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
