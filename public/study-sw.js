const CACHE='knot-study-v2';
const CORE=[
  '/study/',
  '/study/foundation/',
  '/study/kosen/',
  '/study/mock/',
  '/study/summary/',
  '/study/tools/',
  '/study.webmanifest',
  '/study-icon.svg'
];
self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key.startsWith('knot-study-')&&key!==CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith('/study/'))return;
  event.respondWith(
    caches.match(request).then(cached=>{
      if(cached)return cached;
      return fetch(request).then(response=>{
        if(response.ok&&response.type==='basic'){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});
        }
        return response;
      }).catch(async()=>{
        if(request.mode==='navigate')return (await caches.match('/study/'))||Response.error();
        return Response.error();
      });
    })
  );
});
