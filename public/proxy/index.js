"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("sj-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("sj-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("sj-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("sj-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("sj-error-code");

let scramjet;
let connection;

async function initScramjet() {
	try {
		// Wait for scramjet to be fully loaded
		if (typeof $scramjetLoadController === 'undefined') {
			// If not loaded yet, wait a bit and try again
			await new Promise((resolve, reject) => {
				let attempts = 0;
				const checkInterval = setInterval(() => {
					if (typeof $scramjetLoadController !== 'undefined') {
						clearInterval(checkInterval);
						resolve();
					}
					attempts++;
					if (attempts > 50) { // 5 seconds timeout
						clearInterval(checkInterval);
						reject(new Error('Scramjet failed to load'));
					}
				}, 100);
			});
		}

		const { ScramjetController } = $scramjetLoadController();

		scramjet = new ScramjetController({
			files: {
				wasm: '/proxy/scram/scramjet.wasm.wasm',
				all: '/proxy/scram/scramjet.all.js',
				sync: '/proxy/scram/scramjet.sync.js',
			},
		});

		await scramjet.init();
		console.log('Scramjet initialized successfully');
	} catch (err) {
		error.textContent = "Failed to initialize Scramjet.";
		errorCode.textContent = err.toString();
		console.error('Scramjet init error:', err);
	}
}

async function initBareMux() {
	try {
		// Wait for BareMux to be available
		if (typeof BareMux === 'undefined') {
			await new Promise((resolve, reject) => {
				let attempts = 0;
				const checkInterval = setInterval(() => {
					if (typeof BareMux !== 'undefined') {
						clearInterval(checkInterval);
						resolve();
					}
					attempts++;
					if (attempts > 50) {
						clearInterval(checkInterval);
						reject(new Error('BareMux failed to load'));
					}
				}, 100);
			});
		}

		connection = new BareMux.BareMuxConnection("/proxy/baremux/worker.js");
		console.log('BareMux initialized successfully');
	} catch (err) {
		error.textContent = "Failed to initialize BareMux.";
		errorCode.textContent = err.toString();
		console.error('BareMux init error:', err);
	}
}

// Initialize everything when the page loads
window.addEventListener('DOMContentLoaded', async () => {
	try {
		await Promise.all([initScramjet(), initBareMux()]);
		console.log('All systems initialized');
	} catch (err) {
		console.error('Initialization failed:', err);
	}
});

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	if (!scramjet || !connection) {
		error.textContent = "System not initialized yet. Please wait...";
		return;
	}

	try {
		if (typeof registerSW !== 'undefined') {
			await registerSW();
		} else {
			console.warn('registerSW function not found, skipping service worker registration');
		}
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		console.error('SW registration error:', err);
		return;
	}

	let url;
	try {
		if (typeof search !== 'undefined') {
			url = search(address.value, searchEngine.value);
		} else {
			// Fallback if search function isn't available
			url = address.value.includes('.') ? 
				(address.value.startsWith('http') ? address.value : 'https://' + address.value) :
				searchEngine.value.replace('%s', encodeURIComponent(address.value));
		}
	} catch (err) {
		error.textContent = "Failed to process search query.";
		errorCode.textContent = err.toString();
		return;
	}

	let wispUrl = "wss://gointospace.app/wisp/";
	
	try {
		const currentTransport = await connection.getTransport();
		if (currentTransport !== "/proxy/libcurl/index.mjs") {
			await connection.setTransport("/proxy/libcurl/index.mjs", [{ wisp: wispUrl }]);
		}
	} catch (err) {
		error.textContent = "Failed to set transport.";
		errorCode.textContent = err.toString();
		console.error('Transport error:', err);
		return;
	}

	try {
		const frame = scramjet.createFrame();
		frame.frame.id = "sj-frame";
		document.body.appendChild(frame.frame);	
		frame.go(url);
	} catch (err) {
		error.textContent = "Failed to create frame.";
		errorCode.textContent = err.toString();
		console.error('Frame creation error:', err);
	}
});
