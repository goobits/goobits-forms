# DatePicker Component Examples

Production-ready date picker with calendar popup, keyboard navigation, and full accessibility support.

## Table of Contents

- [Basic Usage](#basic-usage)
- [With Label and Required](#with-label-and-required)
- [Date Formats](#date-formats)
- [Min/Max Date Constraints](#minmax-date-constraints)
- [Disabled State](#disabled-state)
- [Error State](#error-state)
- [Size Variants](#size-variants)
- [Week Numbers](#week-numbers)
- [Different Locales](#different-locales)
- [Form Integration](#form-integration)
- [DateRangePicker](#daterangepicker)
- [Complete Form Example](#complete-form-example)

---

## Basic Usage

Simple date picker with default settings.

```svelte
<script>
	import { DatePicker } from '@goobits/ui';

	let selectedDate = $state();
</script>

<DatePicker bind:value={selectedDate} placeholder="Select a date" />

{#if selectedDate}
	<p>Selected: {selectedDate.toLocaleDateString()}</p>
{/if}
```

---

## With Label and Required

Date picker with label and required field indicator.

```svelte
<script>
	import { DatePicker } from '@goobits/ui';

	let birthdate = $state();
</script>

<DatePicker
	bind:value={birthdate}
	label="Date of Birth"
	placeholder="MM/DD/YYYY"
	required={true}
/>
```

---

## Date Formats

Different date display formats.

```svelte
<script>
	import { DatePicker } from '@goobits/ui';

	let date1 = $state();
	let date2 = $state();
	let date3 = $state();
</script>

<!-- US Format -->
<DatePicker
	bind:value={date1}
	label="US Format (MM/DD/YYYY)"
	format="MM/DD/YYYY"
/>

<!-- ISO Format -->
<DatePicker
	bind:value={date2}
	label="ISO Format (YYYY-MM-DD)"
	format="YYYY-MM-DD"
/>

<!-- European Format -->
<DatePicker
	bind:value={date3}
	label="European Format (DD/MM/YYYY)"
	format="DD/MM/YYYY"
/>
```

---

## Min/Max Date Constraints

Restrict selectable dates to a specific range.

```svelte
<script>
	import { DatePicker } from '@goobits/ui';

	let appointmentDate = $state();
	const today = new Date();
	const maxDate = new Date();
	maxDate.setMonth(maxDate.getMonth() + 3);
</script>

<!-- Only future dates within 3 months -->
<DatePicker
	bind:value={appointmentDate}
	label="Appointment Date"
	min={today}
	max={maxDate}
	placeholder="Select appointment date"
/>
```

### Past Dates Only

```svelte
<script>
	import { DatePicker } from '@goobits/ui';

	let birthdate = $state();
	const today = new Date();
</script>

<!-- Only past dates -->
<DatePicker
	bind:value={birthdate}
	label="Date of Birth"
	max={today}
	placeholder="Select your birth date"
/>
```

---

## Disabled State

Date picker in disabled state.

```svelte
<script>
	import { DatePicker } from '@goobits/ui';

	let date = $state(new Date());
</script>

<DatePicker
	bind:value={date}
	label="Fixed Date"
	disabled={true}
/>
```

---

## Error State

Display validation errors.

```svelte
<script>
	import { DatePicker } from '@goobits/ui';

	let selectedDate = $state();
	let error = $state('');

	function validateDate() {
		if (!selectedDate) {
			error = 'Date is required';
		} else {
			error = '';
		}
	}
</script>

<DatePicker
	bind:value={selectedDate}
	label="Event Date"
	{error}
	required={true}
	onchange={validateDate}
/>

<button onclick={validateDate}>Validate</button>
```

---

## Size Variants

Different sizes for various contexts.

```svelte
<script>
	import { DatePicker } from '@goobits/ui';

	let smallDate = $state();
	let mediumDate = $state();
	let largeDate = $state();
</script>

<!-- Small -->
<DatePicker
	bind:value={smallDate}
	label="Small Date Picker"
	size="sm"
/>

<!-- Medium (default) -->
<DatePicker
	bind:value={mediumDate}
	label="Medium Date Picker"
	size="md"
/>

<!-- Large -->
<DatePicker
	bind:value={largeDate}
	label="Large Date Picker"
	size="lg"
/>
```

---

## Week Numbers

Display week numbers in the calendar.

```svelte
<script>
	import { DatePicker } from '@goobits/ui';

	let date = $state();
</script>

<DatePicker
	bind:value={date}
	label="Select Date"
	showWeekNumbers={true}
/>
```

---

## Different Locales

Support for international locales.

```svelte
<script>
	import { DatePicker } from '@goobits/ui';

	let dateUS = $state();
	let dateFR = $state();
	let dateDE = $state();
	let dateJP = $state();
</script>

<!-- US English -->
<DatePicker
	bind:value={dateUS}
	label="US English"
	locale="en-US"
	format="MM/DD/YYYY"
/>

<!-- French -->
<DatePicker
	bind:value={dateFR}
	label="Français"
	locale="fr-FR"
	format="DD/MM/YYYY"
/>

<!-- German -->
<DatePicker
	bind:value={dateDE}
	label="Deutsch"
	locale="de-DE"
	format="DD.MM.YYYY"
/>

<!-- Japanese -->
<DatePicker
	bind:value={dateJP}
	label="日本語"
	locale="ja-JP"
	format="YYYY/MM/DD"
/>
```

---

## Form Integration

Using DatePicker in a form with submission.

```svelte
<script>
	import { DatePicker, Button } from '@goobits/ui';

	let eventName = $state('');
	let eventDate = $state();
	let errors = $state({});

	function validateForm() {
		errors = {};

		if (!eventName.trim()) {
			errors.name = 'Event name is required';
		}

		if (!eventDate) {
			errors.date = 'Event date is required';
		}

		return Object.keys(errors).length === 0;
	}

	function handleSubmit() {
		if (validateForm()) {
			console.log('Form submitted:', { eventName, eventDate });
			// Submit form...
		}
	}
</script>

<form onsubmit|preventDefault={handleSubmit}>
	<Input
		bind:value={eventName}
		label="Event Name"
		error={errors.name}
		required={true}
	/>

	<DatePicker
		bind:value={eventDate}
		label="Event Date"
		error={errors.date}
		required={true}
		min={new Date()}
	/>

	<Button type="submit">Create Event</Button>
</form>
```

---

## DateRangePicker

Select a date range with start and end dates.

```svelte
<script>
	import { DateRangePicker } from '@goobits/ui';

	let startDate = $state();
	let endDate = $state();

	function handleRangeChange(start, end) {
		console.log('Range changed:', { start, end });
	}
</script>

<DateRangePicker
	bind:startDate
	bind:endDate
	label="Stay Dates"
	placeholderStart="Check-in"
	placeholderEnd="Check-out"
	onchange={handleRangeChange}
/>

{#if startDate && endDate}
	<p>
		Selected range: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
	</p>
{/if}
```

### Date Range with Constraints

```svelte
<script>
	import { DateRangePicker } from '@goobits/ui';

	let checkIn = $state();
	let checkOut = $state();
	const today = new Date();
	const maxDate = new Date();
	maxDate.setFullYear(maxDate.getFullYear() + 1);
</script>

<DateRangePicker
	bind:startDate={checkIn}
	bind:endDate={checkOut}
	label="Booking Period"
	min={today}
	max={maxDate}
	placeholderStart="Check-in date"
	placeholderEnd="Check-out date"
	required={true}
/>
```

---

## Complete Form Example

A complete booking form using DatePicker and DateRangePicker.

```svelte
<script>
	import {
		DatePicker,
		DateRangePicker,
		Input,
		Button,
		Card,
		CardBody
	} from '@goobits/ui';

	let formData = $state({
		name: '',
		email: '',
		checkIn: undefined,
		checkOut: undefined,
		birthdate: undefined
	});

	let errors = $state({});
	let submitted = $state(false);

	const today = new Date();
	const maxFutureDate = new Date();
	maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);

	function validateForm() {
		errors = {};

		if (!formData.name.trim()) {
			errors.name = 'Name is required';
		}

		if (!formData.email.trim()) {
			errors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			errors.email = 'Invalid email format';
		}

		if (!formData.checkIn) {
			errors.checkIn = 'Check-in date is required';
		}

		if (!formData.checkOut) {
			errors.checkOut = 'Check-out date is required';
		}

		if (!formData.birthdate) {
			errors.birthdate = 'Date of birth is required';
		}

		return Object.keys(errors).length === 0;
	}

	function handleSubmit() {
		if (validateForm()) {
			submitted = true;
			console.log('Booking submitted:', formData);
			// Submit form...
		}
	}

	function handleReset() {
		formData = {
			name: '',
			email: '',
			checkIn: undefined,
			checkOut: undefined,
			birthdate: undefined
		};
		errors = {};
		submitted = false;
	}
</script>

<Card>
	<CardBody>
		<h2>Hotel Booking Form</h2>

		{#if submitted}
			<div class="success-message">
				<h3>Booking Confirmed!</h3>
				<p>Thank you, {formData.name}. Your booking has been received.</p>
				<Button onclick={handleReset}>New Booking</Button>
			</div>
		{:else}
			<form onsubmit|preventDefault={handleSubmit}>
				<!-- Personal Information -->
				<section>
					<h3>Personal Information</h3>

					<Input
						bind:value={formData.name}
						label="Full Name"
						error={errors.name}
						required={true}
						placeholder="John Doe"
					/>

					<Input
						bind:value={formData.email}
						type="email"
						label="Email Address"
						error={errors.email}
						required={true}
						placeholder="john@example.com"
					/>

					<DatePicker
						bind:value={formData.birthdate}
						label="Date of Birth"
						error={errors.birthdate}
						required={true}
						max={today}
						format="MM/DD/YYYY"
					/>
				</section>

				<!-- Booking Dates -->
				<section>
					<h3>Booking Dates</h3>

					<DateRangePicker
						bind:startDate={formData.checkIn}
						bind:endDate={formData.checkOut}
						label="Stay Period"
						min={today}
						max={maxFutureDate}
						placeholderStart="Check-in date"
						placeholderEnd="Check-out date"
						error={errors.checkIn || errors.checkOut}
						required={true}
					/>
				</section>

				<!-- Actions -->
				<div class="form-actions">
					<Button type="submit" variant="primary">
						Submit Booking
					</Button>
					<Button type="button" variant="outline" onclick={handleReset}>
						Reset
					</Button>
				</div>
			</form>
		{/if}
	</CardBody>
</Card>

<style>
	section {
		margin-bottom: var(--space-6);
	}

	h3 {
		margin-bottom: var(--space-3);
		font-size: var(--font-size-medium);
		font-weight: var(--font-weight-semibold);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-6);
	}

	.success-message {
		padding: var(--space-6);
		text-align: center;
		background: var(--color-success-50);
		border-radius: var(--radius-lg);
	}
</style>
```

---

## Event Handlers

Handle date selection and clearing events.

```svelte
<script>
	import { DatePicker } from '@goobits/ui';
	import { toast } from '@goobits/ui';

	let selectedDate = $state();

	function handleDateChange(date) {
		toast.success(`Date selected: ${date?.toLocaleDateString()}`);
	}

	function handleDateClear() {
		toast.info('Date cleared');
	}
</script>

<DatePicker
	bind:value={selectedDate}
	label="Event Date"
	onchange={handleDateChange}
	onclear={handleDateClear}
/>
```

---

## Keyboard Navigation

The DatePicker supports full keyboard navigation:

### Input Field
- **Enter**: Open calendar
- **Arrow Down**: Open calendar
- **Escape**: Close calendar (when open)
- **Tab**: Move to next field

### Calendar
- **Arrow Keys**: Navigate between dates
- **Home**: Go to first day of week
- **End**: Go to last day of week
- **Page Up**: Previous month
- **Page Down**: Next month
- **Enter/Space**: Select focused date
- **Escape**: Close calendar

---

## Accessibility Features

The DatePicker is fully accessible and WCAG 2.1 AA compliant:

- ✅ Proper ARIA attributes (`role="combobox"`, `aria-expanded`, `aria-haspopup`)
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Focus management
- ✅ Label associations
- ✅ Error announcements
- ✅ High contrast mode support
- ✅ Calendar grid navigation

---

## Styling

The DatePicker uses CSS custom properties from the design system:

```css
/* Override default styles */
.custom-datepicker {
	--color-primary-500: #8b5cf6;
	--color-primary-100: #f3e8ff;
	--radius-md: 12px;
}
```

```svelte
<DatePicker
	class="custom-datepicker"
	label="Custom Styled Date"
/>
```

---

## API Reference

### DatePicker Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `Date \| undefined` | `undefined` | Selected date (bindable) |
| `min` | `Date \| undefined` | `undefined` | Minimum selectable date |
| `max` | `Date \| undefined` | `undefined` | Maximum selectable date |
| `disabled` | `boolean` | `false` | Disable the input |
| `label` | `string \| undefined` | `undefined` | Label text |
| `placeholder` | `string` | `'Select date'` | Placeholder text |
| `error` | `string \| undefined` | `undefined` | Error message |
| `format` | `string` | `'MM/DD/YYYY'` | Date display format |
| `locale` | `string` | `'en-US'` | Locale for formatting |
| `showWeekNumbers` | `boolean` | `false` | Show week numbers |
| `highlightToday` | `boolean` | `true` | Highlight today's date |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |
| `startDay` | `number` | `0` | First day of week (0=Sunday) |
| `class` | `string` | `''` | Additional CSS classes |
| `id` | `string` | Auto-generated | Input ID |
| `name` | `string` | `undefined` | Input name |
| `required` | `boolean` | `false` | Required field |
| `data-testid` | `string` | `undefined` | Test ID |

### DatePicker Events

| Event | Payload | Description |
|-------|---------|-------------|
| `onchange` | `(date: Date \| undefined) => void` | Fired when date changes |
| `onclear` | `() => void` | Fired when date is cleared |

### DateRangePicker Props

Same as DatePicker, plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `startDate` | `Date \| undefined` | `undefined` | Start date (bindable) |
| `endDate` | `Date \| undefined` | `undefined` | End date (bindable) |
| `placeholderStart` | `string` | `'Start date'` | Start input placeholder |
| `placeholderEnd` | `string` | `'End date'` | End input placeholder |

### DateRangePicker Events

| Event | Payload | Description |
|-------|---------|-------------|
| `onchange` | `(start: Date \| undefined, end: Date \| undefined) => void` | Fired when dates change |
| `onclear` | `() => void` | Fired when dates are cleared |

---

## Date Utility Functions

The package also exports useful date utility functions:

```typescript
import {
	formatDate,
	parseDate,
	addDays,
	addMonths,
	isSameDay,
	isDateInRange
} from '@goobits/ui/utils';

// Format a date
const formatted = formatDate(new Date(), 'YYYY-MM-DD'); // '2024-01-15'

// Parse a date string
const parsed = parseDate('01/15/2024', 'MM/DD/YYYY');

// Add/subtract days
const tomorrow = addDays(new Date(), 1);
const yesterday = addDays(new Date(), -1);

// Add/subtract months
const nextMonth = addMonths(new Date(), 1);

// Compare dates
const same = isSameDay(new Date(), new Date()); // true

// Check if date is in range
const inRange = isDateInRange(
	new Date(),
	new Date(2024, 0, 1),
	new Date(2024, 11, 31)
);
```

See the full [date-utils.ts](../utils/date-utils.ts) documentation for all available functions.
