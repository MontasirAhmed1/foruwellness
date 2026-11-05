/* FOR U 🌻 - local-first wellness journal */
(() => {
  "use strict";
  const DB_NAME = "for-u-wellness", DB_VERSION = 1, STORE = "records";
  const $ = (id) => document.getElementById(id);
  const todayISO = () => new Date().toLocaleDateString("en-CA");
  const dateObj = (s) => { const [y,m,d] = (s||"").split("-").map(Number); return new Date(y,m-1,d); };
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const addDays = (s,n) => { const d=dateObj(s); d.setDate(d.getDate()+n); return iso(d); };
  const daysBetween = (a,b) => Math.round((dateObj(b)-dateObj(a))/86400000);
  const pretty = (s, opts={day:"numeric",month:"short",year:"numeric"}) => s ? dateObj(s).toLocaleDateString(undefined,opts) : "—";
  const escapeHTML = (s="") => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const defaultData = () => ({
    profile:{name:"",theme:"light",cycleLength:28,periodLength:5,reminderDays:3,waterGoal:8,pin:null},
    periods:[], daily:{}, journals:[], careItems:["Wash face","Moisturize","Take a little movement break","Do something relaxing","Get enough rest"], careNotes:[], activities:[], water:{}, notification:{enabled:false,lastReminder:""}
  });
  let data = defaultData(), db, currentMonth = new Date(), selectedMood = "", selectedSymptoms = new Set(), selectedFactors = new Set(), encryptionKey = null, toastTimer;
  const moods=[{id:"great",emoji:"😄",label:"Great"},{id:"good",emoji:"😊",label:"Good"},{id:"okay",emoji:"😐",label:"Okay"},{id:"low",emoji:"😔",label:"Low"},{id:"rough",emoji:"😣",label:"Rough"}];
  const symptoms=["Cramps","Headache","Bloating","Tender breasts","Acne","Fatigue","Backache","Nausea","Cravings","Spotting","Discharge changes","Feeling emotional"];
  const factors=["Sleep","Work / study","Relationships","Period","Stress","Health","Family","Something else"];
  const articles=[
    {title:"Understanding your menstrual cycle",cat:"Cycle health",icon:"🌷",desc:"A simple guide to the phases of a menstrual cycle.",body:`<p>The menstrual cycle is a series of natural changes in the body. Day 1 is the first day of menstrual bleeding. Cycle length varies from person to person and can also vary from month to month.</p><h3>The main phases</h3><ul><li><b>Menstruation:</b> the uterine lining sheds and bleeding occurs.</li><li><b>Follicular phase:</b> hormones help an egg mature. This phase overlaps with menstruation.</li><li><b>Ovulation:</b> an ovary releases an egg. Timing varies.</li><li><b>Luteal phase:</b> the body prepares for a possible pregnancy. Some people notice PMS symptoms.</li></ul><p>Tracking dates and symptoms can help you understand your own patterns. Calendar estimates cannot confirm ovulation or reliably identify safe days.</p>`},
    {title:"What is PMS?",cat:"Cycle health",icon:"💗",desc:"Learn about common premenstrual changes and how to care for yourself.",body:`<p>Premenstrual syndrome (PMS) describes physical and emotional symptoms that some people experience in the days before a period. Symptoms can include bloating, cramps, breast tenderness, headaches, irritability, sadness or changes in appetite.</p><h3>What may help</h3><ul><li>Gentle movement, if comfortable.</li><li>Regular meals, hydration and sleep.</li><li>Noticing whether symptoms repeat across cycles.</li><li>Speaking with a healthcare professional if symptoms disrupt daily life.</li></ul><p>Severe mood symptoms deserve care and should not simply be dismissed as PMS.</p>`},
    {title:"PCOS: the basics",cat:"Hormonal health",icon:"🌼",desc:"A friendly introduction to polycystic ovary syndrome.",body:`<p>PCOS is a common hormonal condition that can affect menstrual cycles, skin, hair growth and metabolism. Not everyone with PCOS has the same symptoms, and the name does not mean someone necessarily has ovarian cysts.</p><h3>Possible signs</h3><ul><li>Infrequent or irregular periods.</li><li>Acne or increased facial/body hair.</li><li>Scalp hair thinning.</li><li>Metabolic changes in some people.</li></ul><p>Diagnosis requires a clinical assessment. There is no single symptom or app tracker that can diagnose PCOS. A clinician can discuss testing and treatment options.</p>`},
    {title:"Endometriosis explained",cat:"Reproductive health",icon:"🪻",desc:"Understand this condition and when pain deserves attention.",body:`<p>Endometriosis is a condition in which tissue similar to the lining of the uterus grows outside the uterus. It can cause significant period pain, pelvic pain, pain during sex, bowel or bladder symptoms, and fertility difficulties, though symptoms vary.</p><p>Very painful periods are not something a person has to simply tolerate. Seek medical advice for pain that affects daily activities, worsens, or does not respond to usual care.</p>`},
    {title:"Caring for your mental wellbeing",cat:"Mental wellness",icon:"🫶",desc:"Small, realistic ways to support emotional wellbeing.",body:`<p>Mental wellbeing changes over time. A mood journal can help you notice patterns, but it is not a diagnosis or a measure of your worth.</p><h3>Gentle ideas</h3><ul><li>Try a short breathing or grounding exercise.</li><li>Keep a steady sleep routine where possible.</li><li>Connect with someone you trust.</li><li>Break overwhelming tasks into smaller steps.</li><li>Ask for professional support when difficult feelings persist or interfere with life.</li></ul><p>If you feel at risk of harming yourself or someone else, seek immediate help from local emergency services or a trusted person nearby.</p>`},
    {title:"A gentle skincare routine",cat:"Skin & hair",icon:"🧴",desc:"Build a simple routine without chasing perfection.",body:`<p>A basic skincare routine can be simple: gentle cleansing, moisturizer and daytime broad-spectrum sunscreen. Introduce new products one at a time and stop products that cause persistent irritation.</p><p>Acne can have many causes, including hormones, and is not a sign of poor hygiene. Persistent, painful or scarring acne is worth discussing with a dermatologist.</p>`},
    {title:"Hair and scalp care",cat:"Skin & hair",icon:"🌻",desc:"Everyday habits for a comfortable, healthy scalp.",body:`<p>Hair shedding can change with stress, illness, nutrition, hormones and genetics. Gentle handling, avoiding very tight hairstyles and treating scalp conditions can help reduce avoidable damage.</p><p>Sudden, patchy, painful or persistent hair loss deserves medical assessment. Supplements are not automatically helpful and can be harmful in excess.</p>`},
    {title:"Hydration and everyday nutrition",cat:"Everyday health",icon:"🍓",desc:"Support your body with flexible, balanced habits.",body:`<p>There is no single water target that suits everyone. Needs vary with climate, activity, health and pregnancy. Use thirst, activity and clinician advice as guides rather than treating an app goal as a medical rule.</p><p>A varied eating pattern with vegetables, fruit, protein sources, whole grains and enough energy can support general health. Avoid extreme restriction or food guilt.</p>`},
    {title:"When to seek medical help",cat:"Everyday health",icon:"🩺",desc:"Symptoms that should not be ignored.",body:`<p>Seek urgent medical help for very heavy bleeding with faintness or weakness, sudden severe pelvic or abdominal pain, possible pregnancy with pain or bleeding, fever with pelvic pain, or any symptom that feels like an emergency.</p><p>Arrange a healthcare appointment for periods that become persistently irregular, pain that disrupts daily life, bleeding between periods, or symptoms that worry you. This app cannot assess emergencies or diagnose a condition.</p>`},
    {title:"Understanding menopause",cat:"Hormonal health",icon:"🌙",desc:"An overview of the transition and common experiences.",body:`<p>Menopause is a natural life stage, usually recognized after 12 months without a menstrual period when there is no other cause. The transition can bring changes such as hot flushes, sleep disruption, mood changes, vaginal or urinary symptoms and changes in periods.</p><p>There are effective ways to manage symptoms. A healthcare professional can help discuss options and check symptoms that may have another cause.</p>`}
  ];

  function openDB(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:"id"});};
      req.onsuccess=()=>{db=req.result;resolve(db);};req.onerror=()=>reject(req.error);
    });
  }
  function dbGet(){return new Promise((resolve,reject)=>{const r=db.transaction(STORE,"readonly").objectStore(STORE).get("main");r.onsuccess=()=>resolve(r.result?.value||null);r.onerror=()=>reject(r.error);});}
  function dbPut(value){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).put({id:"main",value});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
  function dbClear(){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
  const enc = new TextEncoder(), dec = new TextDecoder();
  async function deriveKey(pin,salt){const material=await crypto.subtle.importKey("raw",enc.encode(pin),"PBKDF2",false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:250000,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);}
  function b64(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes)));}
  function unb64(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}
  async function encodeData(){
    if(data.profile.pin?.salt && encryptionKey){
      const iv=crypto.getRandomValues(new Uint8Array(12));
      const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv},encryptionKey,enc.encode(JSON.stringify(data)));
      return {encrypted:true,salt:data.profile.pin.salt,iv:b64(iv),cipher:b64(cipher)};
    }
    return {encrypted:false,data};
  }
  async function save(){await dbPut(await encodeData());}
  async function decodeStored(stored,pin){
    if(!stored)return defaultData();
    if(!stored.encrypted)return stored.data||defaultData();
    if(!pin) return null;
    try{
      const key=await deriveKey(pin,unb64(stored.salt));
      const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(stored.iv)},key,unb64(stored.cipher));
      encryptionKey=key;return JSON.parse(dec.decode(plain));
    }catch{return null;}
  }
  function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600);}
  function showApp(){ $("lockScreen").classList.add("hidden");$("app").classList.remove("hidden");renderAll();checkReminder();}
  function showLock(){ $("app").classList.add("hidden");$("lockScreen").classList.remove("hidden");$("lockTitle").textContent="Welcome back";$("lockDescription").textContent="Enter your PIN to open your space.";$("pinInput").value="";$("lockError").textContent=""; }
  async function init(){
    let needsUnlock=false;
    try{await openDB();const stored=await dbGet();if(!stored){data=defaultData();await save();}else if(stored.encrypted){needsUnlock=true;}else{data=stored.data||defaultData();}}
    catch(e){document.body.innerHTML='<main style="padding:2rem;font-family:sans-serif"><h1>FOR U could not open its local database</h1><p>Please use an up-to-date browser and open this app through HTTPS or localhost.</p></main>';console.error(e);return;}
    $("todayLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
    $("todayDate").textContent=pretty(todayISO(),{weekday:"short",month:"short",day:"numeric"});
    $("journalDate").value=todayISO();$("careDate").value=todayISO();$("periodStart").value=todayISO();
    setupChoices();setupEvents();registerSW();
    if(needsUnlock){$("lockScreen").classList.remove("hidden");$("lockTitle").textContent="Your space is locked";$("lockDescription").textContent="Enter your PIN to open your private wellness space.";}else{showApp();}
  }
  function setupChoices(){
    $("symptomChoices").innerHTML=symptoms.map(s=>`<button type="button" class="choice-chip" data-symptom="${escapeHTML(s)}">${escapeHTML(s)}</button>`).join("");
    $("moodFactors").innerHTML=factors.map(s=>`<button type="button" class="choice-chip" data-factor="${escapeHTML(s)}">${escapeHTML(s)}</button>`).join("");
    $("moodOptions").innerHTML=moods.map(m=>`<button type="button" class="mood-option" data-mood="${m.id}"><span class="emoji">${m.emoji}</span><small>${m.label}</small></button>`).join("");
  }
  function setupEvents(){
    document.addEventListener("click",e=>{
      const pageBtn=e.target.closest("[data-page]");if(pageBtn){e.preventDefault();navigate(pageBtn.dataset.page);closeMenu();}
      const sym=e.target.closest("[data-symptom]");if(sym){const s=sym.dataset.symptom;selectedSymptoms.has(s)?selectedSymptoms.delete(s):selectedSymptoms.add(s);sym.classList.toggle("selected");}
      const fac=e.target.closest("[data-factor]");if(fac){const s=fac.dataset.factor;selectedFactors.has(s)?selectedFactors.delete(s):selectedFactors.add(s);fac.classList.toggle("selected");}
      const mood=e.target.closest("[data-mood]");if(mood){selectedMood=mood.dataset.mood;document.querySelectorAll(".mood-option").forEach(x=>x.classList.toggle("selected",x.dataset.mood===selectedMood));}
      const del=e.target.closest("[data-delete]");if(del)deleteEntry(del.dataset.kind,del.dataset.id);
      const article=e.target.closest("[data-article]");if(article)openArticle(Number(article.dataset.article));
    });
    $("mobileMenu").addEventListener("click",()=>{const open=!$("sidebar").classList.contains("open");$("sidebar").classList.toggle("open",open);$("sidebarBackdrop").classList.toggle("show",open);$("mobileMenu").setAttribute("aria-expanded",String(open));});
    $("sidebarBackdrop").addEventListener("click",closeMenu);
    document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenu();});
    $("unlockForm").addEventListener("submit",async e=>{e.preventDefault();const stored=await dbGet();const opened=await decodeStored(stored,$("pinInput").value);if(opened){data=opened;showApp();}else $("lockError").textContent="That PIN didn't match. Please try again.";});
    $("periodForm").addEventListener("submit",async e=>{e.preventDefault();const start=$("periodStart").value,end=$("periodEnd").value;if(end&&end<start){toast("The end date must be after the start date.");return;}const existing=data.periods.find(p=>p.start===start);if(existing){existing.end=end||existing.end;existing.flow=$("periodFlow").value;}else data.periods.push({id:uid(),start,end,flow:$("periodFlow").value});data.periods.sort((a,b)=>a.start.localeCompare(b.start));await save();renderAll();toast("Period dates saved 💗");});
    $("cycleSettingsForm").addEventListener("submit",async e=>{e.preventDefault();data.profile.cycleLength=clamp(+$("cycleLength").value,15,60);data.profile.periodLength=clamp(+$("periodLength").value,1,15);data.profile.reminderDays=clamp(+$("reminderDays").value,0,7);await save();renderAll();toast("Cycle preferences saved.");});
    $("symptomForm").addEventListener("submit",async e=>{e.preventDefault();const key=todayISO();data.daily[key] ||= {};data.daily[key].symptoms=[...selectedSymptoms];data.daily[key].flow=$("dailyFlow").value;data.daily[key].symptomNotes=$("symptomNotes").value.trim();await save();toast("Body check-in saved.");});
    $("journalForm").addEventListener("submit",async e=>{e.preventDefault();const text=$("journalText").value.trim();if(!text){toast("Write a little something before saving.");return;}data.journals.unshift({id:uid(),date:$("journalDate").value,type:$("journalType").value,title:$("journalTitle").value.trim()||"A little note",text});await save();$("journalText").value="";$("journalTitle").value="";renderJournal();renderHome();toast("Your entry is saved ♡");});
    $("moodForm").addEventListener("submit",async e=>{e.preventDefault();if(!selectedMood){toast("Choose the mood that feels closest.");return;}const key=todayISO();data.daily[key] ||= {};data.daily[key].mood=selectedMood;data.daily[key].factors=[...selectedFactors];data.daily[key].energy=+$("energyLevel").value;data.daily[key].stress=+$("stressLevel").value;data.daily[key].moodNote=$("moodNote").value.trim();await save();renderAll();toast("Mood check-in saved ♡");});
    $("energyLevel").addEventListener("input",e=>$("energyValue").textContent=e.target.value+" / 5");$("stressLevel").addEventListener("input",e=>$("stressValue").textContent=e.target.value+" / 5");
    $("addCareForm").addEventListener("submit",async e=>{e.preventDefault();const v=$("newCare").value.trim();if(!v)return;data.careItems.push(v);$("newCare").value="";await save();renderCare();});
    $("careChecklist").addEventListener("change",async e=>{if(e.target.matches("input")){data.daily[todayISO()] ||= {};data.daily[todayISO()].careDone ||= [];const id=e.target.value;const a=data.daily[todayISO()].careDone;a.includes(id)?data.daily[todayISO()].careDone=a.filter(x=>x!==id):a.push(id);await save();renderHome();}});
    $("careNoteForm").addEventListener("submit",async e=>{e.preventDefault();if(!$("careNote").value.trim())return;data.careNotes.unshift({id:uid(),date:$("careDate").value,text:$("careNote").value.trim()});$("careNote").value="";await save();renderCare();toast("Care note saved.");});
    $("waterGoal").addEventListener("change",async e=>{data.profile.waterGoal=clamp(+e.target.value,1,20);await save();renderWater();});
    $("addWater").addEventListener("click",async()=>{const k=todayISO();data.water[k]=(data.water[k]||0)+1;await save();renderWater();renderHome();});
    $("removeWater").addEventListener("click",async()=>{const k=todayISO();data.water[k]=Math.max(0,(data.water[k]||0)-1);await save();renderWater();renderHome();});
    $("activityForm").addEventListener("submit",async e=>{e.preventDefault();const mins=+$("activityMinutes").value;if(!mins){toast("Add the activity duration.");return;}data.activities.unshift({id:uid(),date:todayISO(),type:$("activityType").value,minutes:mins,note:$("activityNote").value});$("activityMinutes").value="";$("activityNote").value="";await save();renderActivities();toast("Activity logged. Well done!");});
    $("profileForm").addEventListener("submit",async e=>{e.preventDefault();data.profile.name=$("profileName").value.trim();data.profile.theme=$("themeSelect").value;applyTheme();await save();renderHome();toast("Preferences saved.");});
    $("enableNotifications").addEventListener("click",enableNotifications);
    $("exportData").addEventListener("click",exportBackup);
    $("importData").addEventListener("change",importBackup);
    $("deleteData").addEventListener("click",async()=>{if(confirm("Delete all FOR U data from this browser? This cannot be undone. Export a backup first if you want to keep anything.")){await dbClear();data=defaultData();encryptionKey=null;await save();showApp();toast("All local data deleted.");}});
    $("lockNow").addEventListener("click",()=>{if(!data.profile.pin){toast("Set a PIN first to use the lock.");return;}showLock();});
    $("changePin").addEventListener("click",()=>openPinDialog());
    $("pinForm").addEventListener("submit",savePin);
    $("closePinDialog").addEventListener("click",()=>$("pinDialog").close());
    $("removePin").addEventListener("click",removePin);
    $("prevMonth").addEventListener("click",()=>{currentMonth.setMonth(currentMonth.getMonth()-1);renderCalendar();});
    $("nextMonth").addEventListener("click",()=>{currentMonth.setMonth(currentMonth.getMonth()+1);renderCalendar();});
    $("articleSearch").addEventListener("input",renderArticles);$("articleCategory").addEventListener("change",renderArticles);
    $("closeArticle").addEventListener("click",()=>$("articleDialog").close());
    $("breathStart").addEventListener("click",breathingExercise);
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)checkReminder();});
    window.addEventListener("focus",checkReminder);
  }
  function closeMenu(){$("sidebar").classList.remove("open");$("sidebarBackdrop").classList.remove("show");$("mobileMenu").setAttribute("aria-expanded","false");}
  function uid(){return crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2);}
  function clamp(n,min,max){return Math.min(max,Math.max(min,n||min));}
  function navigate(name){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+name));document.querySelectorAll("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===name));const titles={home:"Home",cycle:"My cycle",journal:"My journal",mood:"My mood",selfcare:"Self-care",wellness:"Wellness",learn:"Learn",settings:"Settings & privacy"};$("pageHeading").textContent=titles[name]||"FOR U";window.scrollTo({top:0,behavior:"smooth"});if(name==="cycle")renderCycle();if(name==="journal")renderJournal();if(name==="mood")renderMood();if(name==="selfcare")renderCare();if(name==="wellness"){renderWater();renderActivities();}if(name==="learn")renderArticles();}
  function latestPeriod(){return [...data.periods].sort((a,b)=>b.start.localeCompare(a.start))[0]||null;}
  function cycleInfo(){
    const p=latestPeriod();if(!p)return null;
    const elapsed=daysBetween(p.start,todayISO());if(elapsed<0)return {day:null,phase:"Upcoming period",p,next:p.start,remaining:-elapsed};
    const len=clamp(+data.profile.cycleLength,15,60),day=(elapsed%len)+1;
    let phase=day<=Math.max(1,+data.profile.periodLength)?"Menstrual phase":day<Math.max(1,len-14)?"Follicular phase":day<=len-12?"Around estimated ovulation":"Luteal phase";
    const next=addDays(p.start,Math.ceil((elapsed+1)/len)*len);
    return {day,phase,p,next,remaining:daysBetween(todayISO(),next)};
  }
  function renderAll(){applyTheme();$("profileName").value=data.profile.name||"";$("themeSelect").value=data.profile.theme||"light";$("cycleLength").value=data.profile.cycleLength;$("periodLength").value=data.profile.periodLength;$("reminderDays").value=data.profile.reminderDays;$("waterGoal").value=data.profile.waterGoal||8;$("notificationStatus").textContent=data.notification.enabled?"Browser notifications are enabled where supported.":"Notifications are not enabled.";renderHome();renderCycle();renderJournal();renderMood();renderCare();renderWater();renderActivities();renderArticles();}
  function applyTheme(){document.body.classList.toggle("dark",data.profile.theme==="dark");}
  function renderHome(){
    const name=data.profile.name||"lovely";$("greeting").innerHTML=`Hello, ${escapeHTML(name)} <span>🌻</span>`;
    const c=cycleInfo();$("homeCycleDay").textContent=c?.day?`Day ${c.day}`:"—";$("homeCyclePhase").textContent=c?.phase||"Start tracking your cycle";$("homeCycleMessage").textContent=c?`Your next period is estimated around ${pretty(c.next)}.`:"Log your latest period to see your cycle overview here.";
    const d=data.daily[todayISO()]||{},m=moods.find(x=>x.id===d.mood);$("homeMoodFace").textContent=m?.emoji||"♡";$("homeMoodTitle").textContent=m?m.label:"How are you feeling?";$("statMood").textContent=m?.label||"Not logged";$("statJournal").textContent=data.journals.some(j=>j.date===todayISO())?"Entry saved":"No entry yet";$("statWater").textContent=(data.water[todayISO()]||0)+" glasses";$("statCare").textContent=(d.careDone||[]).length+" completed";
  }
  function renderCycle(){
    const todayLog=data.daily[todayISO()]||{};selectedSymptoms=new Set(todayLog.symptoms||[]);$("symptomChoices").querySelectorAll("[data-symptom]").forEach(b=>b.classList.toggle("selected",selectedSymptoms.has(b.dataset.symptom)));$("dailyFlow").value=todayLog.flow||"";$("symptomNotes").value=todayLog.symptomNotes||"";
    const c=cycleInfo();$("cycleDay").textContent=c?.day?c.day:"—";$("cyclePhase").textContent=c?.phase||"No cycle logged yet";$("cycleSummaryText").textContent=c?`Your latest period started ${pretty(c.p.start)}.`:"Add the first day of your latest period to begin.";
    $("nextPeriodDate").textContent=c?pretty(c.next,{day:"numeric",month:"short"}):"—";$("daysUntilPeriod").textContent=c?(c.remaining===0?"Expected today":c.remaining>0?`About ${c.remaining} days to go`:"Date passed"):"Waiting for your dates";
    $("periodHistory").innerHTML=[...data.periods].sort((a,b)=>b.start.localeCompare(a.start)).map(p=>`<div class="history-item"><div><strong>${pretty(p.start)}${p.end?" – "+pretty(p.end,{day:"numeric",month:"short"}):""}</strong><small>${escapeHTML(p.flow||"Flow not recorded")}</small></div><button class="delete-entry" data-delete="period" data-id="${p.id}" aria-label="Delete period">×</button></div>`).join("")||'<p class="tiny muted">Your logged periods will appear here.</p>';
    renderCalendar();
  }
  function renderCalendar(){
    const y=currentMonth.getFullYear(),m=currentMonth.getMonth();$("calendarMonth").textContent=new Date(y,m,1).toLocaleDateString(undefined,{month:"long",year:"numeric"});
    const first=new Date(y,m,1).getDay(),count=new Date(y,m+1,0).getDate(),cells=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=>`<div class="calendar-cell weekday">${x}</div>`);
    const periods=[...data.periods].sort((a,b)=>a.start.localeCompare(b.start)),c=cycleInfo();
    for(let i=0;i<first;i++)cells.push('<div class="calendar-cell empty"></div>');
    for(let day=1;day<=count;day++){
      const s=iso(new Date(y,m,day));let cls="";const logged=periods.some(p=>s>=p.start&&s<=(p.end||addDays(p.start,(data.profile.periodLength||5)-1)));
      if(logged)cls="period";
      else if(c){const delta=daysBetween(c.p.start,s),mod=((delta%data.profile.cycleLength)+data.profile.cycleLength)%data.profile.cycleLength;if(delta>=0&&mod<data.profile.periodLength)cls="predicted";}
      if(s===todayISO())cls+=" today";
      cells.push(`<div class="calendar-cell ${cls}" title="${s}">${day}</div>`);
    }
    $("calendarGrid").innerHTML=cells.join("");
  }
  function renderJournal(){
    $("journalList").innerHTML=data.journals.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(j=>`<div class="journal-item"><div><strong>${escapeHTML(j.title)}</strong><small>${pretty(j.date)} · ${j.type==="cycle"?"Cycle reflection":"Daily journal"}</small><small>${escapeHTML(j.text.slice(0,85))}${j.text.length>85?"…":""}</small></div><button class="delete-entry" data-delete="journal" data-id="${j.id}" aria-label="Delete journal entry">×</button></div>`).join("")||'<p class="tiny muted">Your journal is waiting for your first entry.</p>';
  }
  function renderMood(){
    const d=data.daily[todayISO()]||{};selectedMood=d.mood||"";selectedFactors=new Set(d.factors||[]);$("moodOptions").querySelectorAll("[data-mood]").forEach(b=>b.classList.toggle("selected",b.dataset.mood===selectedMood));$("moodFactors").querySelectorAll("[data-factor]").forEach(b=>b.classList.toggle("selected",selectedFactors.has(b.dataset.factor)));$("energyLevel").value=d.energy||3;$("stressLevel").value=d.stress||2;$("energyValue").textContent=(d.energy||3)+" / 5";$("stressValue").textContent=(d.stress||2)+" / 5";$("moodNote").value=d.moodNote||"";
    $("moodHistory").innerHTML=Object.entries(data.daily).filter(([k,v])=>v.mood).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,12).map(([k,v])=>{const m=moods.find(x=>x.id===v.mood);return `<div class="mood-record"><span class="emoji">${m?.emoji||"♡"}</span><div><strong>${m?.label||"Mood"}</strong><small>${pretty(k)}${v.energy?` · Energy ${v.energy}/5`:""}</small></div></div>`;}).join("")||'<p class="tiny muted">Your mood history will appear here.</p>';
  }
  function renderCare(){
    const done=data.daily[todayISO()]?.careDone||[];$("careChecklist").innerHTML=data.careItems.map((x,i)=>`<label class="check-row ${done.includes(x)?"done":""}"><input type="checkbox" value="${escapeHTML(x)}" ${done.includes(x)?"checked":""}><span>${escapeHTML(x)}</span></label>`).join("");
    $("careNotes").innerHTML=data.careNotes.slice(0,5).map(n=>`<div class="history-item"><div><strong>${pretty(n.date)}</strong><small>${escapeHTML(n.text.slice(0,75))}</small></div><button class="delete-entry" data-delete="care" data-id="${n.id}">×</button></div>`).join("");
  }
  function renderWater(){const n=data.water[todayISO()]||0,g=data.profile.waterGoal||8;$("waterCount").textContent=n;$("waterProgress").style.width=Math.min(100,n/g*100)+"%";$("waterGoal").value=g;}
  function renderActivities(){$("activityHistory").innerHTML=data.activities.filter(a=>a.date===todayISO()).map(a=>`<div class="history-item"><div><strong>${escapeHTML(a.type)} · ${a.minutes} min</strong><small>${escapeHTML(a.note||"Today's movement")}</small></div><button class="delete-entry" data-delete="activity" data-id="${a.id}">×</button></div>`).join("")||"<p class='tiny muted'>Today's activities will appear here.</p>";}
  function renderArticles(){
    const q=($("articleSearch")?.value||"").toLowerCase(),cat=$("articleCategory")?.value||"all";
    $("articleGrid").innerHTML=articles.map((a,i)=>({...a,i})).filter(a=>(cat==="all"||a.cat===cat)&&(!q||(a.title+" "+a.desc+" "+a.cat).toLowerCase().includes(q))).map(a=>`<article class="article-card"><span class="article-icon">${a.icon}</span><p class="eyebrow">${a.cat}</p><h3>${a.title}</h3><p>${a.desc}</p><button class="text-btn" data-article="${a.i}">Read guide →</button></article>`).join("")||'<p class="muted">No matching articles found.</p>';
  }
  function openArticle(i){const a=articles[i];$("articleContent").innerHTML=`<div class="article-content"><p class="eyebrow">${a.cat} · FOR U LEARNING LIBRARY</p><div style="font-size:34px">${a.icon}</div><h2>${a.title}</h2><p>${a.desc}</p>${a.body}<p class="tiny">General educational information. Content is not a substitute for individualized medical advice. Last reviewed: initial release.</p></div>`;$("articleDialog").showModal();}
  async function deleteEntry(kind,id){
    if(!confirm("Delete this entry?"))return;
    if(kind==="period")data.periods=data.periods.filter(x=>x.id!==id);
    if(kind==="journal")data.journals=data.journals.filter(x=>x.id!==id);
    if(kind==="care")data.careNotes=data.careNotes.filter(x=>x.id!==id);
    if(kind==="activity")data.activities=data.activities.filter(x=>x.id!==id);
    await save();renderAll();toast("Entry deleted.");
  }
  async function enableNotifications(){
    if(!("Notification"in window)){toast("This browser does not support notifications.");return;}
    if(!("serviceWorker"in navigator)){toast("Notifications need a supported browser.");return;}
    try{const permission=await Notification.requestPermission();if(permission!=="granted"){toast("Notification permission was not granted.");return;}data.notification.enabled=true;await save();$("notificationStatus").textContent="Notifications enabled. Reminder checks happen when the app is opened or active.";toast("Notifications enabled where supported.");checkReminder();}catch(e){toast("Could not enable notifications in this browser.");}
  }
  async function checkReminder(){
    if(!data?.notification?.enabled||!("Notification"in window)||Notification.permission!=="granted")return;
    const c=cycleInfo(),lead=+data.profile.reminderDays;if(!c||!lead||c.remaining!==lead)return;
    const key=c.next+"-"+lead;if(data.notification.lastReminder===key)return;
    try{const reg=await navigator.serviceWorker?.ready;if(reg)await reg.showNotification("A gentle FOR U reminder 🌻",{body:`Your period may start in about ${lead} day${lead===1?"":"s"}. Be kind to yourself.`,icon:"./sunflower.svg",badge:"./sunflower.svg",tag:"for-u-period-"+key,data:{url:"./"}});else new Notification("A gentle FOR U reminder 🌻",{body:`Your period may start in about ${lead} days.`});data.notification.lastReminder=key;await save();}catch(e){console.warn("Notification failed",e);}
  }
  async function exportBackup(){
    const payload={app:"FOR U",version:1,exportedAt:new Date().toISOString(),data};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="for-u-backup-"+todayISO()+".json";a.click();URL.revokeObjectURL(url);toast("Your backup is ready.");
  }
  async function importBackup(e){
    const file=e.target.files?.[0];if(!file)return;
    try{const parsed=JSON.parse(await file.text());if(parsed.app!=="FOR U"||!parsed.data||!parsed.data.profile)throw Error("Invalid backup");if(!confirm("Restore this backup? Your current data will be replaced."))return;data=parsed.data;encryptionKey=null;if(data.profile.pin){delete data.profile.pin;}await save();renderAll();toast("Backup restored. Set a new PIN if you want to lock this device.");}catch(err){toast("That file doesn't look like a valid FOR U backup.");}finally{e.target.value="";}
  }
  function openPinDialog(){
    $("pinDialogTitle").textContent=data.profile.pin?"Change your PIN":"Set a PIN";
    $("pinDialogText").textContent=data.profile.pin?"Enter a new PIN twice. Your saved data will remain encrypted.":"Your PIN encrypts your saved FOR U data on this device.";
    $("newPin").value="";$("confirmPin").value="";$("pinDialogError").textContent="";$("pinDialog").showModal();
  }
  async function savePin(e){
    e.preventDefault();const p=$("newPin").value,q=$("confirmPin").value;
    if(!/^\d{4,12}$/.test(p)){$("pinDialogError").textContent="Choose a PIN with 4 to 12 digits.";return;}
    if(p!==q){$("pinDialogError").textContent="Those PINs don't match.";return;}
    try{const salt=crypto.getRandomValues(new Uint8Array(16));encryptionKey=await deriveKey(p,salt);data.profile.pin={salt:b64(salt)};await save();$("pinDialog").close();toast("PIN saved. Your local data is now encrypted.");}
    catch(err){$("pinDialogError").textContent="Could not set PIN in this browser. Use HTTPS and try again.";}
  }
  async function removePin(){
    if(!data.profile.pin){$("pinDialog").close();return;}
    const pin=prompt("Enter your current PIN to remove the lock.");if(!pin)return;
    const stored=await dbGet(),opened=await decodeStored(stored,pin);if(!opened){toast("That PIN didn't match.");return;}
    data=opened;delete data.profile.pin;encryptionKey=null;await save();$("pinDialog").close();toast("PIN lock removed. Data is stored locally without encryption.");
  }
  function breathingExercise(){
    const b=$("breathStart"),circle=$("breathCircle"),txt=$("breathText");if(b.dataset.running==="1")return;
    b.dataset.running="1";b.disabled=true;let elapsed=0;const phases=[["Breathe in",4],["Breathe out",6]];
    const tick=()=>{if(elapsed>=60){txt.textContent="Lovely work";circle.classList.remove("breathe");b.textContent="Start 1-minute breathing";b.disabled=false;b.dataset.running="0";return;}
      const phase=phases[Math.floor(elapsed/10)%2];txt.textContent=phase[0];circle.classList.toggle("breathe",phase[0]==="Breathe in");elapsed+=phase[1];setTimeout(tick,phase[1]*1000);};
    b.textContent="Breathing...";tick();
  }
  async function registerSW(){if("serviceWorker"in navigator&&location.protocol.startsWith("http")){try{await navigator.serviceWorker.register("./sw.js");}catch(e){console.warn("Service worker registration failed",e);}}}
  init();
})();