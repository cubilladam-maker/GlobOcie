
const CACHE="quiz-core-2.1.1-shell";
const SHELL=["./","index.html","style.css","js/loader.js","js/engine.js","js/app.js",
"data/manifest.json","data/sources.js","data/knowledge-graph.js","data/reasoning-taxonomy.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
 const u=new URL(e.request.url);
 if(u.pathname.endsWith(".ndjson.gz")){
  e.respondWith(caches.open(CACHE).then(async c=>{const h=await c.match(e.request);if(h)return h;const r=await fetch(e.request);if(r.ok)c.put(e.request,r.clone());return r}));
 }else e.respondWith(caches.match(e.request).then(h=>h||fetch(e.request)));
});
