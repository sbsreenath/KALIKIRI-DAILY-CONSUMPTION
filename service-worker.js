const CACHE_NAME = "kalikiri-dashboard-v8";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./Consumption%20Particulars.html",
    "./design.css",
    "./consumption.js",
    "./manifest.json",
    "./login.html",
    "./login.js",
    "./auth-guard.js",
    "./firebase-save.js",
    "./aptransco-logo.png",
    "./icon-192.png",
    "./icon-512.png"
];

// Save app files and activate the new worker.
self.addEventListener("install", event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);

        await Promise.all(
            FILES_TO_CACHE.map(async file => {
                try {
                    const request = new Request(
                        new URL(file, self.registration.scope),
                        { cache: "no-store" }
                    );

                    const response = await fetch(request);

                    if (response.ok) {
                        await cache.put(request, response);
                    }
                } catch (error) {
                    console.warn("Could not cache:", file);
                }
            })
        );

        await self.skipWaiting();
    })());
});

// Remove only this app's older caches.
self.addEventListener("activate", event => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();

        await Promise.all(
            cacheNames
                .filter(name =>
                    name.startsWith("kalikiri-dashboard-") &&
                    name !== CACHE_NAME
                )
                .map(name => caches.delete(name))
        );

        await self.clients.claim();
    })());
});

// Online: use fresh files.
// Offline: use the current app cache.
self.addEventListener("fetch", event => {
    const request = event.request;
    const url = new URL(request.url);
    const scope = new URL(self.registration.scope);

    // Leave Firebase and other external requests alone.
    if (
        request.method !== "GET" ||
        url.origin !== scope.origin ||
        !url.pathname.startsWith(scope.pathname)
    ) {
        return;
    }

    const isAppFile =
        request.mode === "navigate" ||
        /\.(html|css|js|json|png|jpg|jpeg|svg|ico|webmanifest)$/i
            .test(url.pathname);

    if (!isAppFile) {
        return;
    }

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);

        try {
            const response = await fetch(request, {
                cache: "no-store"
            });

            if (response.ok) {
                try {
                    await cache.put(request, response.clone());
                } catch (error) {
                    console.warn("Could not update cache:", url.pathname);
                }
            }

            return response;
        } catch (error) {
            const savedResponse = await cache.match(request);

            if (savedResponse) {
                return savedResponse;
            }

            return Response.error();
        }
    })());
});
