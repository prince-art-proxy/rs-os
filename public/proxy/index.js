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

// Make sure scramjet is loaded before this script runs
// Add this to your HTML: <script src="/scramjet/scramjet.all.js"></script>

let scramjet;
let connection;

async function initScramjet() {
	try {
		if (typeof $scramjetLoadController === 'undefined') {
			throw new Error('Scramjet not loaded. Make sure scramjet.all.js is included before this script.');
		}

		const { ScramjetController } = $scramjetLoadController();

		scramjet = new ScramjetController({
			files: {
				wasm: '/scramjet/scramjet.wasm.wasm',
				all: '/scramjet/scramjet.all.js',
				sync: '/scramjet/scramjet.sync.js',
			},
		});

		await scramjet.init();
	} catch (err) {
		error.textContent = "Failed to initialize Scramjet.";
		errorCode.textContent = err.toString();
		throw err;
	}
}

async function initBareMux() {
	try {
		connection = new BareMux.BareMuxConnection("/baremux/worker.js");
	} catch (err) {
		error.textContent = "Failed to initialize BareMux.";
		errorCode.textContent = err.toString();
		throw err;
	}
}

// Initialize everything when the page loads
window.addEventListener('DOMContentLoaded', async () => {
	try {
		await initScramjet();
		await initBareMux();
	} catch (err) {
		console.error('Initialization failed:', err);
	}
});

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	if (!scramjet || !connection) {
		error.textContent = "System not initialized yet. Please wait.";
		return;
	}

	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		throw err;
	}

	const url = search(address.value, searchEngine.value);

	let wispUrl = "wss://gointospace.app/wisp/";
	
	try {
		if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
			await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
		}
	} catch (err) {
		error.textContent = "Failed to set transport.";
		errorCode.textContent = err.toString();
		throw err;
	}

	const frame = scramjet.createFrame();
	frame.frame.id = "sj-frame";
	document.body.appendChild(frame.frame);	
	frame.go(url);
});
