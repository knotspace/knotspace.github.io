const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Authorization"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
const auth=(r,e)=>!!e.ADMIN_KEY&&r.headers.get("Authorization")==="Bearer "+e.ADMIN_KEY;
const makeId=()=>crypto.randomUUID().replace(/-/g,"").slice(0,20);
const cleanUrl=value=>{try{const u=new URL(value);return ["https:","http:"].includes(u.protocol)?u.href:null}catch{return null}};
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
   const mode=b.mode==="redirect"?"redirect":"surprise";
   const destination=mode==="redirect"?cleanUrl(b.destination):null;
   if(mode==="redirect"&&!destination)return json({error:"転送先URLはhttp/httpsで指定してください"},400);
   const id=makeId();
   await env.DB.prepare("INSERT INTO links (id,mode,destination,created_at) VALUES (?,?,?,?)").bind(id,mode,destination||"",new Date().toISOString()).run();
   return json({id,mode});
  }
  if(p==="/api/visit"&&req.method==="POST"){
   let b;try{b=await req.json()}catch{return json({error:"Invalid JSON"},400)}
   if(typeof b.id!=="string"||!/^[a-f0-9]{20}$/.test(b.id))return json({error:"Invalid link"},400);
   const link=await env.DB.prepare("SELECT id,mode,destination FROM links WHERE id=?").bind(b.id).first();
   if(!link)return json({error:"Link not found"},404);
   const ip=req.headers.get("CF-Connecting-IP")||"unavailable",cf=req.cf||{};
   let geo={};
   if(ip!=="unavailable"){try{const r=await fetch("https://ipwho.is/"+encodeURIComponent(ip));const d=await r.json();if(d.success)geo={country:d.country||"",region:d.region||"",city:d.city||"",isp:d.connection?.isp||"",org:d.connection?.org||"",asn:d.connection?.asn||""};}catch{}}
   const country=geo.country||cf.country||"",region=geo.region||cf.region||"",city=geo.city||cf.city||"";
   await env.DB.prepare("INSERT INTO visits (id,link_id,ip,country,region,city,isp,org,asn,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .bind(makeId(),link.id,ip,country,region,city,geo.isp||"",geo.org||"",geo.asn||"",new Date().toISOString()).run();
   return json({mode:link.mode,destination:link.destination,ip,region:region||"地域不明",city:city||"市区町村不明",country:country||"不明",isp:geo.isp||"不明"});
  }
  if(p==="/api/results"&&req.method==="GET"){
   if(!auth(req,env))return json({error:"Unauthorized"},401);
   const q=await env.DB.prepare("SELECT v.id,v.link_id,l.mode,v.ip,v.country,v.region,v.city,v.isp,v.org,v.asn,v.created_at FROM visits v LEFT JOIN links l ON l.id=v.link_id ORDER BY v.created_at DESC LIMIT 200").all();
   return json({results:q.results||[]});
  }
  return json({error:"Not found"},404);
 }
};