import {test,expect} from "@playwright/test";
import core from "../content/core-vocabulary.json";
import passages from "../content/passages.json";
import {knownWords} from "../lib/known-game";

test("home, theme, catalog, detail and tablet typing",async({page})=>{
 await page.setViewportSize({width:1280,height:800});
 await page.goto("/home");
 await expect(page.getByRole("heading",{name:"I Can Start"})).toBeVisible();
 await page.getByRole("button",{name:"الوضع الداكن"}).click();
 await page.getByRole("link",{name:"القصص",exact:true}).click();
 await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
 await page.getByRole("link",{name:/I Can Start/}).click();
 await expect(page.getByText("0/6 أسطر مكتملة")).toBeVisible();
 await page.getByRole("link",{name:"ابدأ القصة ←"}).click();
 await page.getByRole("button",{name:"ابدأ الكتابة ←"}).click();
 await page.keyboard.type("I w");
 await expect(page.locator('[data-i="0"][data-mark="1"]')).toBeVisible();
 await page.locator("summary").click();
 await page.locator("#rate").selectOption("0.65");
 await page.getByLabel("إظهار الترجمة").uncheck();
 await expect(page.locator(".translation")).toHaveCount(0);
 await page.locator("summary").click();
 await page.getByRole("button",{name:"إظهار الترجمة"}).click();
 await expect(page.locator(".translation")).toBeVisible();
});

test("favorites and core group progression survive reload",async({page})=>{
 await page.goto("/words");
 await page.getByRole("tab",{name:"المفضلة"}).click();
 await expect(page.getByText("لا توجد كلمات مفضلة بعد")).toBeVisible();
 await page.getByRole("tab",{name:"اكتشف كلمات"}).click();
 await page.getByRole("button",{name:"أضف learn للمفضلة"}).click();
 await page.getByRole("tab",{name:"المفضلة"}).click();
 await expect(page.getByRole("heading",{name:"learn"})).toBeVisible();
 await page.reload();
 await page.getByRole("tab",{name:"المفضلة"}).click();
 await expect(page.getByRole("heading",{name:"learn"})).toBeVisible();
 await page.goto("/words/core");
 await expect(page.getByText(/120 كلمة في هذه النسخة/)).toBeVisible();
 await page.getByRole("link",{name:"افتح المجموعة ←"}).first().click();
 for(const w of core[0].words.slice(0,5)){
  await page.getByRole("textbox",{name:"الإجابة الإنجليزية"}).fill(w.en);
  await page.getByRole("button",{name:"تحقق"}).click();
  await expect(page.getByText("صحيح ✓")).toBeVisible();
  await page.getByRole("button",{name:"التالي ←"}).click();
 }
 await expect(page.getByRole("heading",{name:"أنهيت التدريب"})).toBeVisible();
 await page.getByRole("link",{name:"العودة للمجموعات ←"}).click();
 await expect(page.getByText(/أفضل نتيجة 5\/5/)).toBeVisible();
 await expect(page.getByRole("link",{name:"افتح المجموعة ←"})).toHaveCount(2);
});

test("listening question flow stores real score",async({page})=>{
 await page.goto("/passages/late-arrival");
 await page.getByRole("button",{name:"ابدأ الاستماع ←"}).click();
 for(let i=0;i<4;i++){
  await page.getByRole("button",{name:"انتقل إلى سؤال المقطع ←"}).click();
  await expect(page.getByRole("heading",{name:passages[0].sections[i].question})).toBeVisible();
  await page.getByRole("button",{name:passages[0].sections[i].correct?/صح True/:/خطأ False/}).click();
  await expect(page.getByText("إجابة صحيحة")).toBeVisible();
  await page.getByRole("button",{name:i===3?"شاهد النتيجة ←":"المقطع التالي ←"}).click();
 }
 await expect(page.getByRole("heading",{name:"أحسنت الاستماع"})).toBeVisible();
 const state=await (await page.request.get("/api/state")).json();
 expect(state.passages[0].score).toBe(4);
});

test("know game saves words; new API separates users",async({page,browser})=>{
 await page.goto("/know");
 await page.getByRole("button",{name:"ورّني كم كلمة أعرف ←"}).click();
 for(let i=0;i<12;i++){
  await page.getByRole("textbox",{name:"اكتب الكلمة بالإنجليزية"}).fill(knownWords[i%6].en);
  if(i<11) await expect(page.getByText(`${i+2} / 12`)).toBeVisible();
 }
 await expect(page.getByRole("heading",{name:/تعرف 6 كلمات/})).toBeVisible();
 const state=await (await page.request.get("/api/state")).json();
 expect(state.knownWords).toHaveLength(6);
 const other=await browser.newContext();
 expect((await (await other.request.get("http://127.0.0.1:3000/api/state")).json()).knownWords).toEqual([]);
 await other.close();
});

test("mobile and portrait routes have no horizontal overflow",async({page})=>{
 for(const size of [{width:390,height:844},{width:800,height:1280}]){
  await page.setViewportSize(size);
  for(const path of ["/home","/stories","/words","/words/core","/story/i-can-start","/passages/late-arrival"]){
   await page.goto(path);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${path}@${size.width}`).toBe(true);
  }
 }
});

test("personal API rejects foreign origin, locked group and malformed input",async({page})=>{
 await page.goto("/home");
 await page.request.get("/api/state");
 const post=(data:unknown,origin="http://127.0.0.1:3000")=>page.request.post("/api/personal",{data,headers:{Origin:origin}});
 expect((await post({type:"favorite",word:"learn",enabled:true},"https://foreign.example")).status()).toBe(403);
 expect((await post({type:"core",groupId:"A1-2",answers:["a","b","c","d","e"]})).status()).toBe(422);
 expect((await post({type:"favorite",word:"no-such-word",enabled:true})).status()).toBe(422);
 expect((await page.request.post("/api/personal",{data:"x".repeat(3000),headers:{Origin:"http://127.0.0.1:3000","Content-Type":"application/json"}})).status()).toBe(413);
});
