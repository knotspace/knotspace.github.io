const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Authorization"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
const auth=(r,e)=>!!e.ADMIN_KEY&&r.headers.get("Authorization")==="Bearer "+e.ADMIN_KEY;
const makeId=()=>crypto.randomUUID().replace(/-/g,"").slice(0,20);
const cleanDestination=value=>{try{const u=new URL(value);return ["https:","http:"].includes(u.protocol)?u.href:null}catch{return null}};
export default {
 async scheduled(event,env,ctx){ctx.waitUntil(Promise.all([
  env.DB.prepare("DELETE FROM visits WHERE created_at < ?").bind(new Date(Date.now()-7*86400000).toISOString()).run(),
  env.DB.prepare("DELETE FROM links WHERE created_at < ?").bind(new Date(Date.now()-30*86400000).toISOString()).run()
 ]));},
 async fetch(req,env){
  if(req.method==="OPTIONS")return new Response(null,{headers:cors});
  const u=new URL(req.url),p=u.pathname;
  if(p==="/api/create"&&req.method==="POST"){
   if(!auth(req,env))return json({error:"Unauthorized"},401);
   let b;try{b=await req.json()}catch{return json({error:"Invalid JSON"},400)}
   const destination=cleanDestination(b.destination||"https://example.com");
   if(!destination)return json({error:"Destination must be http or https"},400);
   const token=makeId();
   await env.DB.prepare("INSERT INTO links (id,destination,created_at) VALUES (?,?,?)").bind(token,destination,new Date().toISOString()).run();
   return json({id:token});
  }
  if(p==="/api/consent"&&req.method==="POST"){
   let b;try{b=await req.json()}catch{return json({error:"Invalid JSON"},400)}
   if(b.consent!==true||typeof b.id!=="string"||! /^[a-f0-9]{20}$/.test(b.id))return json({error:"Explicit consent required"},400);
   const link=await env.DB.prepare("SELECT destination FROM links WHERE id=?").bind(b.id).first();
   if(!link)return json({error:"Link not found"},404);
   const ip=req.headers.get("CF-Connecting-IP")||"unavailable";let geo={};
   if(ip!=="unavailable"){try{const response=await fetch("https://ipwho.is/"+encodeURIComponent(ip));const d=await response.json();if(d.success)geo={country:d.country||"",region:d.region||"",city:d.city||"",isp:d.connection?.isp||"",org:d.connection?.org||"",asn:d.connection?.asn||"",latitude:d.latitude??null,longitude:d.longitude??null};}catch{}}
   const cf=req.cf||{},country=geo.country||cf.country||"",region=geo.region||cf.region||"",city=geo.city||cf.city||"";
   await env.DB.prepare("INSERT INTO visits (id,link_id,ip,country,region,city,isp,org,asn,latitude,longitude,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
    .bind(makeId(),b.id,ip,country,region,city,geo.isp||"",geo.org||"",geo.asn||"",geo.latitude,geo.longitude,new Date().toISOString()).run();
   return json({ok:true,destination:link.destination});
  }
  if(p==="/api/results"&&req.method==="GET"){
   if(!auth(req,env))return json({error:"Unauthorized"},401);
   const q=await env.DB.prepare("SELECT id,link_id,ip,country,region,city,isp,org,asn,latitude,longitude,created_at FROM visits ORDER BY created_at DESC LIMIT 200").all();
   return json({results:q.results||[]});
  }
  return json({error:"Not found"},404);
 }
};