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

let connection;

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

// Initialize when the page loads
window.addEventListener('DOMContentLoaded', async () => {
	try {
		await initBareMux();
		console.log('All systems initialized');
	} catch (err) {
		console.error('Initialization failed:', err);
	}
});

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	if (!connection) {
		error.textContent = "System not initialized yet. Please wait...";
		return;
	}

	try {
		if (typeof registerSW !== 'undefined') {
			await registerSW();
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
		console.log('Current transport:', currentTransport);
		
		if (currentTransport !== "/proxy/libcurl/index.mjs") {
			await connection.setTransport("/proxy/libcurl/index.mjs", [{ wisp: wispUrl }]);
			console.log('Transport set to libcurl with wisp:', wispUrl);
		}
	} catch (err) {
		error.textContent = "Failed to set transport.";
		errorCode.textContent = err.toString();
		console.error('Transport error:', err);
		return;
	}

	// Open in a new tab since we can't use scramjet frames
	try {
		const newWindow = window.open();
		if (newWindow) {
			// Try to use BareMux to navigate
			connection.send(url).then(response => {
				newWindow.location.href = url;
			}).catch(err => {
				console.error('BareMux navigation error:', err);
				newWindow.location.href = url;
			});
		} else {
			// Fallback if popup is blocked
			window.location.href = url;
		}
	} catch (err) {
		error.textContent = "Failed to navigate.";
		errorCode.textContent = err.toString();
		console.error('Navigation error:', err);
	}
});
