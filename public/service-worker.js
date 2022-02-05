const APP_PREFIX = 'Budget-Tracker-';
const CACHE_NAME = 'budget-tracker-cache';
const DATA_CACHE_NAME = 'data_cache';

const FILES_TO_CACHE = [
    './index.html',
    './manifest.json',
    './css/styles.css',
    './icons/icon-72x72.png',
    './icons/icon-96x96.png',
    './icons/icon-128x128.png',
    './icons/icon-144x144.png',
    './icons/icon-152x152.png',
    './icons/icon-192x192.png',
    './icons/icon-384x384.png',
    './icons/icon-512x512.png',
    './js/index.js',
    './js/idb.js'
];

//INSTALL
self.addEventListener('install', function(evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Successfully Pre-Cached Files!');
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

//ACTIVATE
self.addEventListener('activate', function(evt) {
    evt.waitUntil(
        caches.keys().then(function(keyList) {
            let cacheStoreList = keyList.filter(function(key) {
                return key.indexOf(APP_PREFIX);
            });
            cacheStoreList.push(CACHE_NAME);
            return  Promise.all(
                keyList.map(function(key, i) {
                    if (cacheStoreList.indexOf(key) === -1) {
                        console.log('Old Cache Key is being removed', key);
                        return caches.delete(keyList[i]);
                    }
                })
            );
        })
    );
});

//INTERCEPT FETCH REQ
self.addEventListener('fetch', function(evt) {
    if (evt.request.url.includes('/api/')) {
        evt.respondWith(
            caches
                .open(DATA_CACHE_NAME)
                    .then(cache => {
                        return fetch(evt.request)
                        .then(response => {
                            //IF RESPONSE GOOD, CLONE AND STORE IN CACHE
                            if (response.status === 200) {
                                cache.put(evt.request.url, response.clone());
                            }
                            return response;
                        })
                        .catch(err => {
                            //REQUEST FAILED, GET FROM CACHE
                            return cache.match(evt.request);
                        });
                    })
                    .catch(err => console.log(err))
        );
        return;
    }
    evt.respondWith(
        fetch(evt.request).catch(function() {
            return caches.match(evt.request).then(function(response) {
                if (response) {
                    return response;
                } else if (evt.request.headers.get('accept').includes('text/html')) {
                    //RETURN CACHED HOME
                    return caches.match('/');
                }
            });
        })
    );
});