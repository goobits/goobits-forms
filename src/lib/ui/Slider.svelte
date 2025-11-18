<script lang="ts">
	/**
	 * Slider/Range Component for @goobits/ui
	 *
	 * A production-ready slider component with single and dual-thumb modes,
	 * keyboard support, accessibility features, and custom styling.
	 */

	interface Mark {
		value: number;
		label: string;
	}

	interface SliderProps {
		/** Current value (number for single, [min, max] for range) */
		value?: number | [number, number];
		/** Minimum value */
		min?: number;
		/** Maximum value */
		max?: number;
		/** Step increment */
		step?: number;
		/** Whether the slider is disabled */
		disabled?: boolean;
		/** Label text */
		label?: string;
		/** Show current value */
		showValue?: boolean;
		/** Show tick marks */
		showTicks?: boolean;
		/** Custom marks with labels */
		marks?: Mark[];
		/** Error message */
		error?: string;
		/** Size variant */
		size?: 'sm' | 'md' | 'lg';
		/** Custom value formatter */
		formatValue?: (value: number) => string;
		/** Additional CSS class names */
		class?: string;
		/** Test ID for automated testing */
		'data-testid'?: string;
		/** ARIA label */
		'aria-label'?: string;
		/** ARIA described by */
		'aria-describedby'?: string;
	}

	let {
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		disabled = false,
		label,
		showValue = true,
		showTicks = false,
		marks,
		error,
		size = 'md',
		formatValue = (v: number) => String(v),
		class: className = '',
		'data-testid': dataTestId,
		'aria-label': ariaLabel,
		'aria-describedby': ariaDescribedBy,
		...restProps
	}: SliderProps = $props();

	// State management
	let trackElement: HTMLDivElement | undefined = $state();
	let draggingThumb: 'start' | 'end' | null = $state(null);
	let showTooltip: 'start' | 'end' | null = $state(null);

	// Determine if this is a range slider
	const isRange = $derived(Array.isArray(value));

	// Get normalized values (clamped to min/max)
	const startValue = $derived(
		isRange
			? Math.max(min, Math.min(max, (value as [number, number])[0]))
			: min
	);
	const endValue = $derived(
		isRange
			? Math.max(min, Math.min(max, (value as [number, number])[1]))
			: Math.max(min, Math.min(max, value as number))
	);

	// Calculate percentages for positioning
	const startPercent = $derived(((startValue - min) / (max - min)) * 100);
	const endPercent = $derived(((endValue - min) / (max - min)) * 100);

	// Combine CSS classes using BEM methodology
	const sliderClasses = $derived(
		[
			'slider',
			`slider--${size}`,
			disabled && 'slider--disabled',
			error && 'slider--error',
			isRange && 'slider--range',
			className
		]
			.filter(Boolean)
			.join(' ')
	);

	// Round value to step
	function roundToStep(val: number): number {
		const rounded = Math.round((val - min) / step) * step + min;
		return Math.max(min, Math.min(max, rounded));
	}

	// Convert mouse/touch position to value
	function positionToValue(clientX: number): number {
		if (!trackElement) return min;

		const rect = trackElement.getBoundingClientRect();
		const percent = (clientX - rect.left) / rect.width;
		const rawValue = min + percent * (max - min);
		return roundToStep(rawValue);
	}

	// Update value based on which thumb is being dragged
	function updateValue(newValue: number): void {
		if (disabled) return;

		if (isRange) {
			const [currentStart, currentEnd] = value as [number, number];

			if (draggingThumb === 'start') {
				// Don't allow start to go past end
				const clampedValue = Math.min(newValue, currentEnd);
				value = [clampedValue, currentEnd];
			} else if (draggingThumb === 'end') {
				// Don't allow end to go before start
				const clampedValue = Math.max(newValue, currentStart);
				value = [currentStart, clampedValue];
			}
		} else {
			value = newValue;
		}
	}

	// Handle track click
	function handleTrackClick(event: MouseEvent): void {
		if (disabled || draggingThumb) return;

		const newValue = positionToValue(event.clientX);

		if (isRange) {
			const [currentStart, currentEnd] = value as [number, number];
			const startDist = Math.abs(newValue - currentStart);
			const endDist = Math.abs(newValue - currentEnd);

			// Snap to nearest thumb
			if (startDist < endDist) {
				value = [newValue, currentEnd];
			} else {
				value = [currentStart, newValue];
			}
		} else {
			value = newValue;
		}
	}

	// Mouse/touch drag handlers
	function startDrag(thumb: 'start' | 'end', event: MouseEvent | TouchEvent): void {
		if (disabled) return;

		event.preventDefault();
		draggingThumb = thumb;
		showTooltip = thumb;

		const moveHandler = (e: MouseEvent | TouchEvent) => {
			const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
			const newValue = positionToValue(clientX);
			updateValue(newValue);
		};

		const endHandler = () => {
			draggingThumb = null;
			showTooltip = null;
			document.removeEventListener('mousemove', moveHandler);
			document.removeEventListener('touchmove', moveHandler);
			document.removeEventListener('mouseup', endHandler);
			document.removeEventListener('touchend', endHandler);
		};

		document.addEventListener('mousemove', moveHandler);
		document.addEventListener('touchmove', moveHandler);
		document.addEventListener('mouseup', endHandler);
		document.addEventListener('touchend', endHandler);
	}

	// Keyboard navigation
	function handleKeyDown(thumb: 'start' | 'end', event: KeyboardEvent): void {
		if (disabled) return;

		let delta = 0;

		switch (event.key) {
			case 'ArrowRight':
			case 'ArrowUp':
				delta = step;
				event.preventDefault();
				break;
			case 'ArrowLeft':
			case 'ArrowDown':
				delta = -step;
				event.preventDefault();
				break;
			case 'PageUp':
				delta = step * 10;
				event.preventDefault();
				break;
			case 'PageDown':
				delta = -step * 10;
				event.preventDefault();
				break;
			case 'Home':
				if (isRange && thumb === 'start') {
					value = [min, (value as [number, number])[1]];
				} else if (isRange && thumb === 'end') {
					value = [(value as [number, number])[0], min];
				} else {
					value = min;
				}
				event.preventDefault();
				return;
			case 'End':
				if (isRange && thumb === 'start') {
					value = [max, (value as [number, number])[1]];
				} else if (isRange && thumb === 'end') {
					value = [(value as [number, number])[0], max];
				} else {
					value = max;
				}
				event.preventDefault();
				return;
		}

		if (delta !== 0) {
			draggingThumb = thumb;
			const currentValue = thumb === 'start' ? startValue : endValue;
			updateValue(currentValue + delta);
			draggingThumb = null;
		}
	}

	// Generate tick marks
	function generateTicks(): number[] {
		const ticks: number[] = [];
		for (let i = min; i <= max; i += step) {
			ticks.push(i);
		}
		return ticks;
	}

	const ticks = $derived(showTicks ? generateTicks() : []);
</script>

<div class={sliderClasses} data-testid={dataTestId} {...restProps}>
	{#if label}
		<label class="slider__label">
			{label}
			{#if showValue && !isRange}
				<span class="slider__value-display">{formatValue(endValue)}</span>
			{:else if showValue && isRange}
				<span class="slider__value-display"
					>{formatValue(startValue)} - {formatValue(endValue)}</span
				>
			{/if}
		</label>
	{/if}

	<div class="slider__container">
		<!-- Track -->
		<div
			class="slider__track"
			bind:this={trackElement}
			onclick={handleTrackClick}
			role="presentation"
		>
			<!-- Filled range -->
			<div
				class="slider__range"
				style:left="{startPercent}%"
				style:width="{endPercent - startPercent}%"
			></div>

			<!-- Tick marks -->
			{#if showTicks && ticks.length > 0}
				<div class="slider__ticks">
					{#each ticks as tick (tick)}
						<div
							class="slider__tick"
							style:left="{((tick - min) / (max - min)) * 100}%"
						></div>
					{/each}
				</div>
			{/if}

			<!-- Custom marks -->
			{#if marks && marks.length > 0}
				<div class="slider__marks">
					{#each marks as mark (mark.value)}
						<div
							class="slider__mark"
							style:left="{((mark.value - min) / (max - min)) * 100}%"
						>
							<div class="slider__mark-indicator"></div>
							<div class="slider__mark-label">{mark.label}</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Start thumb (for range slider) -->
			{#if isRange}
				<div
					class="slider__thumb slider__thumb--start"
					class:slider__thumb--active={draggingThumb === 'start'}
					style:left="{startPercent}%"
					role="slider"
					tabindex={disabled ? -1 : 0}
					aria-label={ariaLabel || `${label || 'Slider'} minimum`}
					aria-valuemin={min}
					aria-valuemax={max}
					aria-valuenow={startValue}
					aria-valuetext={formatValue(startValue)}
					aria-disabled={disabled}
					aria-describedby={ariaDescribedBy}
					onmousedown={(e) => startDrag('start', e)}
					ontouchstart={(e) => startDrag('start', e)}
					onkeydown={(e) => handleKeyDown('start', e)}
					onmouseenter={() => (showTooltip = 'start')}
					onmouseleave={() => (showTooltip = draggingThumb === 'start' ? 'start' : null)}
				>
					{#if showValue && (showTooltip === 'start' || draggingThumb === 'start')}
						<div class="slider__tooltip">{formatValue(startValue)}</div>
					{/if}
				</div>
			{/if}

			<!-- End thumb (single slider or range slider) -->
			<div
				class="slider__thumb slider__thumb--end"
				class:slider__thumb--active={draggingThumb === 'end'}
				style:left="{endPercent}%"
				role="slider"
				tabindex={disabled ? -1 : 0}
				aria-label={ariaLabel || (isRange ? `${label || 'Slider'} maximum` : label || 'Slider')}
				aria-valuemin={min}
				aria-valuemax={max}
				aria-valuenow={endValue}
				aria-valuetext={formatValue(endValue)}
				aria-disabled={disabled}
				aria-describedby={ariaDescribedBy}
				onmousedown={(e) => startDrag('end', e)}
				ontouchstart={(e) => startDrag('end', e)}
				onkeydown={(e) => handleKeyDown('end', e)}
				onmouseenter={() => (showTooltip = 'end')}
				onmouseleave={() => (showTooltip = draggingThumb === 'end' ? 'end' : null)}
			>
				{#if showValue && (showTooltip === 'end' || draggingThumb === 'end')}
					<div class="slider__tooltip">{formatValue(endValue)}</div>
				{/if}
			</div>
		</div>
	</div>

	{#if error}
		<div class="slider__error" role="alert">{error}</div>
	{/if}
</div>

<style>
	@import './Slider.css';
</style>
