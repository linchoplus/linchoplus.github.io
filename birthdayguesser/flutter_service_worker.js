'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "93bb87fb1472e3c5c3ea04f9eb10c8b8",
"assets/audio/scream.mp3": "10b6e767651b3e8990a8a1b85da64e87",
"assets/audio/scream.wav": "362c0ae91949a6a485a0d0c819508cb2",
"assets/FontManifest.json": "c151d63039313a2e74c5edcb469e4b28",
"assets/fonts/Courgette-Regular.ttf": "59c3685a73f0f1b7c302dd2d6dabd628",
"assets/fonts/DancingScript-Medium.ttf": "2b9b7690ea41eca720fedddff070e153",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/fonts/Niconne-Regular.ttf": "1c8d9ad0f6f13954af8bc07b47b970f2",
"assets/images/1.jpg": "dceb21a3268a09bd550453378ed7ae91",
"assets/images/banner.png": "fc6eb0d7b8026f1d2c3fbe461be326dd",
"assets/images/google_play.png": "0ff9fba4a142db027f7cd8648a0016e0",
"assets/images/icon_android.png": "1fa5ae84e1d76ecc7d909adae0a7f38c",
"assets/images/icon_ios.png": "d3cf11ed8d84b621a6e023d2cd153c69",
"assets/images/icon_mathniac.png": "ec876b06545ab13c7819889e984757df",
"assets/images/launch_image.png": "dc979142c85cd922515912a413d18785",
"assets/NOTICES": "946fdc6ec89930807d38146bb6ceb008",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "115e937bb829a890521f72d2e664b632",
"assets/sounds/beep.mp3": "76e7162ab01d727350754b6f82b26cbe",
"assets/sounds/beep_end.mp3": "690ff2e3bdc70ace2c1b9e2935c9d663",
"assets/sounds/correct_sum.mp3": "4ed88f128f0f6158b460bc3fc83b2817",
"assets/sounds/level_up.mp3": "c2c9d050c1d78df80b0fdd54ed9e6257",
"assets/sounds/pressed_button.mp3": "dc7bf1c3b3b1ad4079f7e5e4f7578a30",
"assets/sounds/repeated_number_value.mp3": "6949022a2c844e4579f3342e05c7ff84",
"assets/sounds/start_all_buttons.mp3": "8835fdeabf06ab488701897c5eb1158c",
"favicon.png": "ea60efb1fdf5f94978dd9b6074490190",
"icons/Icon-192.png": "2837f72539ed20ad33082315621c4d54",
"icons/Icon-512.png": "a564f0aece010d1a4f9890ba3e95a719",
"index.html": "b06b7794f857b686767b820ff78f26f8",
"/": "b06b7794f857b686767b820ff78f26f8",
"main.dart.js": "da8650e810456cef455fd3ab5f2d095a",
"manifest.json": "592bfaa55f4c6c3375f211475026485c",
"version.json": "0ffe9d975085c574481c9c7f587af60a"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
