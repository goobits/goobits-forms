<script>
	import { ImagePlus, X } from '@lucide/svelte'
	// OptimizedImage would need to be provided by the app or simplified
	// import OptimizedImage from '@components/OptimizedImage/OptimizedImage.svelte'

	let {
		accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif',
		error: initialError = null,
		files = [],
		maxFiles = 3,
		maxSize = 5 * 1024 * 1024,
		onChange = () => {},
		onError = () => {}
	} = $props()

	let dragCounter = $state(0)
	let error = $state(initialError)
	let fileInput = $state()
	let isDragging = $state(false)

	let canAddMore = $derived(
		files.length < maxFiles
	)

	/**
	 * Handle drag enter event
	 * @param {DragEvent} e
	 */
	function handleDragEnter(e) {
		e.preventDefault()
		dragCounter++
		isDragging = true
	}

	/**
	 * Handle drag leave event
	 * @param {DragEvent} e
	 */
	function handleDragLeave(e) {
		e.preventDefault()
		dragCounter--
		if (dragCounter === 0) {
			isDragging = false
		}
	}

	/**
	 * Handle drop event
	 * @param {DragEvent} e
	 */
	function handleDrop(e) {
		e.preventDefault()
		dragCounter = 0
		isDragging = false
		handleFiles(e.dataTransfer?.files)
	}

	/**
	 * Handle file input change
	 * @param {Event} e
	 */
	async function handleFileSelect(e) {
		await handleFiles(e.target.files)
	}

	/**
	 * Handle files
	 * @param {FileList|undefined} fileList
	 */
	async function handleFiles(fileList) {
		if (!fileList) {
			return
		}

		const newFiles = Array.from(fileList).slice(0, maxFiles - files.length)

		for (const file of newFiles) {
			if (!accept.includes(file.type)) {
				onError('Please upload only image files.')
				continue
			}

			if (file.size > maxSize) {
				onError('Image too large (max 5MB)')
				continue
			}

			const preview = await createPreview(file)
			files = [ ...files, { file, preview } ]
		}

		onChange(files)
		if (fileInput) fileInput.value = ''
	}

	/**
	 * Remove file at specified index
	 * @param {number} index
	 */
	function removeFile(index) {
		files = files.filter((_, i) => i !== index)
		onChange(files)
	}

	/**
	 * Create preview URL for file
	 * @param {File} file
	 * @returns {Promise<string>}
	 */
	async function createPreview(file) {
		return new Promise((resolve) => {
			const reader = new FileReader()
			reader.onloadend = () => resolve(reader.result)
			reader.readAsDataURL(file)
		})
	}
</script>

<div
	aria-label="Image upload"
	class:image-upload--has-error={error}
	class:image-upload--is-dragging={isDragging}
	class="image-upload"
	ondragenter={handleDragEnter}
	ondragleave={handleDragLeave}
	ondragover={(e) => e.preventDefault()}
	ondrop={handleDrop}
	role="region"
>
	<input
		aria-label="Choose images"
		bind:this={fileInput}
		class="image-upload__input"
		multiple
		onchange={handleFileSelect}
		type="file"
		{accept}
	/>

	<div class="image-upload__grid" role="list">
		{#each files as { preview }, i (i)}
			<div class="image-upload__preview" role="listitem">
				<img 
					src={preview}
					alt=""
					class="image-upload__image"
					aria-hidden="true"
				/>
				<button
					type="button"
					class="image-upload__remove-btn"
					onclick={() => removeFile(i)}
					aria-label="Remove image"
				>
					<X size={14} />
				</button>
			</div>
		{/each}

		{#if canAddMore}
			<button
				type="button"
				class="image-upload__add-btn"
				onclick={() => fileInput.click()}
				aria-label="Add image"
			>
				<ImagePlus size={36} />
				<span class="upload-text" style="padding: 0 12px; font-weight: 500;">Add image</span>
			</button>
		{/if}
	</div>

	{#if files.length < maxFiles}
		<div class="image-upload__hint">
			{files.length === 0
				? `Upload up to ${maxFiles} images (max 5MB each)`
				: `${maxFiles - files.length} more ${maxFiles - files.length === 1 ? 'image' : 'images'} allowed`}
		</div>
	{/if}

	{#if error}
		<div class="image-upload__error" role="alert">
			{error}
		</div>
	{/if}
</div>

<style lang="scss">
	@use './UploadImage.scss';
</style>