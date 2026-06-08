import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 3180,
		strictPort: true,
		host: '0.0.0.0'
	},
	preview: {
		port: 3180,
		strictPort: true,
		host: '0.0.0.0'
	}
});
