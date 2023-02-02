import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// build to the 'docs' directory, which Github pages
			// can be configured to read from (must be / or /docs)
			pages: 'docs',
			assets: 'docs',
			fallback: null,
			precompress: false,
			strict: true
		})
	}
};

export default config;
