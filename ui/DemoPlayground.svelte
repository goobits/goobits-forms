<script lang="ts">
  // Import forms components
  import ContactForm from './ContactForm.svelte';
  import FeedbackForm from './FeedbackForm.svelte';
  import FormField from './FormField.svelte';
  import Input from './Input.svelte';
  import Textarea from './Textarea.svelte';

  /**
   * Configuration object for forms
   */
  export let config: Record<string, any> = {};

  /**
   * API endpoints for form submissions
   */
  export let apiEndpoints: {
    contact: string;
    feedback: string;
  } = {
    contact: '/api/contact',
    feedback: '/api/feedback'
  };

  /**
   * External components from the main app (like ToggleSwitch, SelectMenu)
   */
  export let externalComponents: Record<string, any> | null = null;

  // Demo state
  let selectedCategory: string = 'general';
  let showContactForm: boolean = true;
  let showFeedbackForm: boolean = false;
  let showStandaloneField: boolean = false;
  let showNewComponents: boolean = false;
  let lastSubmission: {
    type: string;
    data: any;
    timestamp: string;
  } | null = null;

  // Field state for standalone demo
  let standaloneValue: string = '';
  let standaloneErrors: string[] = [];
  let standaloneTouched: boolean = false;

  // New components demo state
  let inputValue: string = '';
  let textareaValue: string = '';
  let toggleValue: boolean = false;
  let selectValue: string = '';
  let testSelectValue: string = 'test1';

  // Handle form submissions
  function handleContactSubmit(event: CustomEvent): void {
    lastSubmission = {
      type: 'Contact Form',
      data: event.detail,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  function handleFeedbackSubmit(event: CustomEvent): void {
    lastSubmission = {
      type: 'Feedback Form',
      data: event.detail,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  function handleFieldInput(event: Event): void {
    standaloneValue = event.target.value;
    standaloneErrors = [];
    if (!standaloneValue) {
      standaloneErrors = ['This field is required'];
    } else if (standaloneValue.length < 3) {
      standaloneErrors = ['Must be at least 3 characters'];
    }
  }

  function handleFieldBlur(): void {
    standaloneTouched = true;
  }

  function getFieldClasses(hasError: boolean): string {
    return hasError ? 'field-error' : 'field-valid';
  }
</script>

<div class="demo-playground">
  <header class="demo-header">
    <h1>📦 Goobits Forms Components Demo</h1>
    <p>Testing actual components from the goobits-forms package</p>
  </header>

  <main class="demo-content">
    <!-- Component Selection Tabs -->
    <nav class="demo-tabs">
      <button
        class="tab-button"
        class:active={showContactForm}
        on:click={() => {
          showContactForm = true;
          showFeedbackForm = false;
          showStandaloneField = false;
          showNewComponents = false;
        }}
      >
        📝 Contact Form
      </button>
      <button
        class="tab-button"
        class:active={showFeedbackForm}
        on:click={() => {
          showContactForm = false;
          showFeedbackForm = true;
          showStandaloneField = false;
          showNewComponents = false;
        }}
      >
        💬 Feedback Form
      </button>
      <button
        class="tab-button"
        class:active={showStandaloneField}
        on:click={() => {
          showContactForm = false;
          showFeedbackForm = false;
          showStandaloneField = true;
          showNewComponents = false;
        }}
      >
        🔧 Form Field
      </button>
      {#if externalComponents}
        <button
          class="tab-button"
          class:active={showNewComponents}
          on:click={() => {
            showContactForm = false;
            showFeedbackForm = false;
            showStandaloneField = false;
            showNewComponents = true;
          }}
        >
          ✨ External Components
        </button>
      {/if}
    </nav>

    <!-- Contact Form Component -->
    {#if showContactForm}
      <div class="form-wrapper">
        <ContactForm
          apiEndpoint={apiEndpoints.contact}
          initialData={{
            category: selectedCategory,
            name: '',
            email: '',
            message: ''
          }}
          on:submit={handleContactSubmit}
          on:error={(e) => {
            // Handle form error in demo
          }}
        />
      </div>
    {/if}

    <!-- Feedback Form Component -->
    {#if showFeedbackForm}
      <div class="form-wrapper">
        <FeedbackForm
          apiEndpoint={apiEndpoints.feedback}
          on:submit={handleFeedbackSubmit}
          on:error={(e) => {
            // Handle feedback error in demo
          }}
        />
      </div>
    {/if}

    <!-- Standalone Form Field -->
    {#if showStandaloneField}
      <div class="form-wrapper">
        <FormField
          fieldName="demo-field"
          fieldConfig={{
            type: 'text',
            label: 'Demo Field',
            placeholder: 'Enter at least 3 characters...',
            required: true,
            description: 'This is a standalone form field component'
          }}
          value={standaloneValue}
          errors={standaloneErrors}
          touched={standaloneTouched}
          {getFieldClasses}
          handleBlur={handleFieldBlur}
          handleInput={handleFieldInput}
          props={{}}
        />

        <div class="field-state">
          <h3>Field State:</h3>
          <pre>{JSON.stringify({
            value: standaloneValue,
            errors: standaloneErrors,
            touched: standaloneTouched,
            valid: standaloneErrors.length === 0
          }, null, 2)}</pre>
        </div>
      </div>
    {/if}

    <!-- External Components Section -->
    {#if showNewComponents && externalComponents}
      <div class="components-grid">
        <!-- Input Component -->
        <div class="component-demo">
          <h3>Input Component</h3>
          <Input
            bind:value={inputValue}
            placeholder="Enter some text..."
            size="md"
            variant="default"
          />
          <p class="component-value">Value: {inputValue || '(empty)'}</p>
        </div>

        <!-- Textarea Component -->
        <div class="component-demo">
          <h3>Textarea Component</h3>
          <Textarea
            bind:value={textareaValue}
            placeholder="Enter multiple lines..."
            autoResize={true}
            rows={3}
          />
          <p class="component-value">Value: {textareaValue || '(empty)'}</p>
        </div>

        <!-- External Components -->
        {#if externalComponents.ToggleSwitch}
          <div class="component-demo">
            <h3>Toggle Switch (External)</h3>
            <div class="toggle-demo">
              <svelte:component
                this={externalComponents.ToggleSwitch}
                checked={toggleValue}
                onchange={(checked) => toggleValue = checked}
                variant="ios"
                size="medium"
              />
              <span class="toggle-label">Enabled: {toggleValue}</span>
            </div>
          </div>
        {/if}

        {#if externalComponents.SelectMenu}
          <div class="component-demo">
            <h3>Select Menu (External)</h3>
            <svelte:component
              this={externalComponents.SelectMenu}
              value={selectValue}
              options={[
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
                { value: 'option3', label: 'Option 3' },
                { value: 'option4', label: 'Option 4' }
              ]}
              placeholder="Choose an option..."
              onchange={(value) => selectValue = value}
            />
            <p class="component-value">Selected: {selectValue || '(none)'}</p>
          </div>
        {/if}

        <!-- Input Variants -->
        <div class="component-demo">
          <h3>Input Variants</h3>
          <div class="variants-list">
            <Input placeholder="Small" size="sm" />
            <Input placeholder="Medium" size="md" />
            <Input placeholder="Large" size="lg" />
            <Input placeholder="Error state" variant="error" value="Invalid input" />
            <Input placeholder="Success state" variant="success" value="Valid input" />
            <Input placeholder="With prefix" prefix="$" value="100" />
            <Input placeholder="With suffix" suffix="USD" value="100" />
          </div>
        </div>

        <!-- Textarea with Character Count -->
        <div class="component-demo">
          <h3>Textarea with Limits</h3>
          <Textarea
            placeholder="Max 100 characters..."
            maxLength={100}
            showCharCount={true}
            autoResize={true}
          />
        </div>
      </div>
    {/if}

    <!-- Submission Results -->
    {#if lastSubmission}
      <aside class="submission-result">
        <h3>Last Submission</h3>
        <p class="submission-type">{lastSubmission.type} at {lastSubmission.timestamp}</p>
        <pre>{JSON.stringify(lastSubmission.data, null, 2)}</pre>
      </aside>
    {/if}
  </main>

  <footer class="demo-footer">
    <p>Components are imported directly from <code>@goobits/forms</code></p>
  </footer>
</div>