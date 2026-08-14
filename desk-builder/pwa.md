
Build a mobile-first [Wall mounted desk] optimized as a Progressive Web App (PWA).

Please focus on the following requirements:

1. UI & Layout: Create a fully responsive, mobile-first design. Focus on mobile usability with large touch targets, accessible contrast, and bottom-aligned navigation for easy thumb reach.
2. Web App Manifest: Generate a complete `manifest.json` file. Set the display mode to 'standalone', configure the theme and background colors, and define placeholder paths for 192x192 and 512x512 icons. Link this manifest correctly in the `index.html` .
3. Service Worker: Write a service worker (`sw.js`) to cache the core shell of the app (HTML, CSS, JS) so it loads instantly on repeat visits. Register the service worker in the main JavaScript file.
4. Offline Support: Implement a cache-first strategy for static assets so the app remains usable without an internet connection. Include a graceful offline fallback state/message when external data cannot be fetched.
5. Installability: Ensure the configuration triggers the browser's native "Add to Home Screen" install prompt for iOS and Android.

Do not use any heavy frameworks unless necessary; standard modern HTML, CSS, and Vanilla JavaScript is preferred for the PWA foundation.
