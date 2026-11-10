(() => {
 const $=s=>document.querySelector(s), cfg=window.PIXELVANTA_CONFIG||{};
 const configured=cfg.SUPABASE_URL?.includes("supabase.co")&&!cfg.SUPABASE_URL.includes("YOUR-")&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_ANON_KEY.includes("YOUR_");
 const sb=configured&&window.supabase?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
 let signupMode=false;
 $("#year").textContent=new Date().getFullYear();
 $("#menuBtn").addEventListener("click",()=>$("#nav").classList.toggle("open"));
 $("#nav").querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>$("#nav").classList.remove("open")));
 function message(el,msg,error=false){el.textContent=msg;el.style.color=error?"#c0392b":"#18865e";}
 function showAuth(){ $("#authModal").hidden=false; }
 $("#authBtn").onclick=showAuth;$("#recordsSignIn").onclick=showAuth;$("#closeModal").onclick=()=>$("#authModal").hidden=true;
 $("#authSwitch").onclick=()=>{signupMode=!signupMode;$("#authTitle").textContent=signupMode?"Create account":"Sign in";$("#authSubmit").textContent=signupMode?"Create account":"Sign in";$("#authSwitch").textContent=signupMode?"Already registered? Sign in":"Need an account? Create one";};
 $("#authForm").onsubmit=async e=>{e.preventDefault();if(!sb)return message($("#authMessage"),"Backend is not configured. Follow README setup instructions.",true);
  const email=$("#authEmail").value,password=$("#authPassword").value;
  const r=signupMode?await sb.auth.signUp({email,password}):await sb.auth.signInWithPassword({email,password});
  if(r.error)return message($("#authMessage"),r.error.message,true);
  message($("#authMessage"),signupMode?"Account created. Check your email to confirm, then sign in.":"Signed in successfully.");
  $("#authBtn").textContent="Account";$("#authModal").hidden=true;loadRecords();
 };
 $("#authBtn").addEventListener("click",async()=>{if(sb){const {data}=await sb.auth.getSession();if(data.session){const ok=confirm("Sign out of PIXELVANTA?");if(ok){await sb.auth.signOut();$("#authBtn").textContent="Sign in";loadRecords();}}}});
 $("#declarationForm").onsubmit=async e=>{
  e.preventDefault();const status=$("#declarationStatus"),f=e.currentTarget,file=$("#imageFile").files[0];
  if(!sb)return message(status,"Submission is disabled until Supabase is configured. No data has been submitted.",true);
  if(!file||file.size>8*1024*1024||!["image/jpeg","image/png","image/webp"].includes(file.type))return message(status,"Choose a JPEG, PNG or WebP image up to 8 MB.",true);
  const {data:{user}}=await sb.auth.getUser();if(!user){message(status,"Please sign in before submitting a declaration.",true);showAuth();return;}
  const fd=new FormData(f),ref="PV-"+new Date().getFullYear()+"-"+crypto.randomUUID().slice(0,8).toUpperCase(),path=`${user.id}/${ref}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
  message(status,"Uploading image and saving declaration…");
  const up=await sb.storage.from("copyright-images").upload(path,file,{contentType:file.type,upsert:false});
  if(up.error)return message(status,up.error.message,true);
  const row={user_id:user.id,reference_id:ref,image_path:path,title:fd.get("title"),owner_name:fd.get("owner_name"),holder_name:fd.get("holder_name"),creation_date:fd.get("creation_date")||null,publication_date:fd.get("publication_date")||null,copyright_status:fd.get("copyright_status"),allowed_usage:fd.get("allowed_usage"),prohibited_usage:fd.get("prohibited_usage"),attribution:fd.get("attribution"),contact_email:fd.get("contact_email"),portfolio_url:fd.get("portfolio_url"),description:fd.get("description"),legal_notes:fd.get("legal_notes"),is_public:true};
  const ins=await sb.from("copyright_records").insert(row).select("reference_id").single();
  if(ins.error){await sb.storage.from("copyright-images").remove([path]);return message(status,ins.error.message,true);}
  f.reset();message(status,`Declaration saved. Reference ID: ${ins.data.reference_id}`);loadRecords();
 };
 $("#verifyForm").onsubmit=async e=>{e.preventDefault();const raw=$("#recordUrl").value.trim(),out=$("#verifyResult");let u;try{u=new URL(raw)}catch{return message(out,"Please enter a valid URL.",true)}
  if(!["http:","https:"].includes(u.protocol))return message(out,"Only HTTP or HTTPS URLs are accepted.",true);
  const ref=u.pathname.split("/").filter(Boolean).pop();if(!ref)return message(out,"No reference ID was found in this URL.",true);
  if(!sb)return message(out,"Record lookup is unavailable until the backend is configured.",true);
  const {data,error}=await sb.from("copyright_records").select("reference_id,title,owner_name,holder_name,description,allowed_usage,prohibited_usage,attribution,created_at,portfolio_url").eq("reference_id",ref).eq("is_public",true).maybeSingle();
  if(error||!data)return message(out,"No public PIXELVANTA record was found for that reference.",true);
  out.innerHTML=`<b>Public declaration found</b><br>Reference: ${escapeHtml(data.reference_id)}<br>Title: ${escapeHtml(data.title)}<br>Rights holder: ${escapeHtml(data.holder_name||data.owner_name)}<br>Declaration date: ${new Date(data.created_at).toLocaleDateString()}<br><a href="copyright.html?ref=${encodeURIComponent(data.reference_id)}">Open original copyright record →</a>`;
 };
 function escapeHtml(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
 async function loadRecords(){const area=$("#recordsArea");if(!sb){area.innerHTML="<h3>Backend not configured</h3><p>See README.md to connect Supabase. This demo does not store submissions locally.</p>";return}
  const {data:{user}}=await sb.auth.getUser();if(!user){area.innerHTML='<div class="empty-icon">▤</div><h3>Sign in to view your records</h3><p>Your private dashboard is available after authentication.</p><button class="btn btn-primary" id="dashSignIn">Sign in</button>';$("#dashSignIn").onclick=showAuth;return}
  const {data,error}=await sb.from("copyright_records").select("reference_id,title,created_at,is_public").order("created_at",{ascending:false});
  if(error){area.textContent=error.message;return}if(!data.length){area.innerHTML="<h3>No declarations yet</h3><p>Your submitted records will appear here.</p>";return}
  area.innerHTML="<div class='record-list'>"+data.map(r=>`<article class="legal-card"><b>${escapeHtml(r.title)}</b><span>${escapeHtml(r.reference_id)} · ${new Date(r.created_at).toLocaleDateString()}</span><div><a href="copyright.html?ref=${encodeURIComponent(r.reference_id)}">View record</a> · <button data-copy="${escapeHtml(cfg.PUBLIC_SITE_URL+"/copyright.html?ref="+r.reference_id)}">Copy URL</button> · <button data-delete="${escapeHtml(r.reference_id)}">Remove</button></div></article>`).join("")+"</div>";
  area.querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>navigator.clipboard.writeText(b.dataset.copy));
  area.querySelectorAll("[data-delete]").forEach(b=>b.onclick=async()=>{if(!confirm("Remove this declaration? This action cannot be undone."))return;const del=await sb.from("copyright_records").delete().eq("reference_id",b.dataset.delete);if(del.error)alert(del.error.message);else loadRecords();});
 }
 $("#recordsRefresh").onclick=loadRecords;loadRecords();
})();