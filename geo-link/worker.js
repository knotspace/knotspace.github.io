const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Authorization"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json; charset=utf-8"}});
const auth=(r,e)=>r.headers.get("Authorization")==="Bearer "+e.ADMIN_KEY;
const id=()=>crypto.randomUUID().replace(/-/g,"").slice(0,18);
export default {async fetch(req,env){
 if(req.method==="OPTIONS")return new Response(null,{headers:cors});
 const u=new URL(req.url),p=u.pathname;
 if(p==="/api/create"&&req.method==="POST"){if(!auth(req,env))return json({error:"Unauthorized"},401);const b=await req.json();const token=id();await env.DB.prepare("INSERT INTO links (id,destination,created_at) VALUES (?,?,?)").bind(token,b.destination||"https://example.com",new Date().toISOString()).run();return json({id:token});}
 if(p==="/api/consent"&&req.method==="POST"){const b=await req.json();if(b.consent!==true||!b.id)return json({error:"Consent required"},400);const link=await env.DB.prepare("SELECT destination FROM links WHERE id=?").bind(b.id).first();if(!link)return json({error:"Link not found"},404);const cf=req.cf||{};const ip=req.headers.get("CF-Connecting-IP")||"unavailable";await env.DB.prepare("INSERT INTO visits (id,link_id,ip,country,region,city,created_at) VALUES (?,?,?,?,?,?,?)").bind(id(),b.id,ip,cf.country||"",cf.region||"",cf.city||"",new Date().toISOString()).run();return json({ok:true,destination:link.destination});}
 if(p==="/api/results"&&req.method==="GET"){if(!auth(req,env))return json({error:"Unauthorized"},401);const q=await env.DB.prepare("SELECT id,link_id,ip,country,region,city,created_at,'' AS isp FROM visits ORDER BY created_at DESC LIMIT 200").all();return json({results:q.results||[]});}
 return json({error:"Not found"},404);
}};
