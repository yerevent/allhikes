/* AllHikes: one script for every page.
   Each page's <body> says which view it is: data-page="home" | "clubs" | "club",
   data-club="<slug>" on a club page, and data-root (path back to the site root).
   Data comes from assets/data.js (window.AH), made by scripts/build.py. */
(() => {
const {hikes: HIKES, clubs: CLUBS, trails: TRAILS, updated: UPDATED} = window.AH;
const B = document.body, PAGE = B.dataset.page, ROOT = B.dataset.root || "./";

const T = {
  en:{draft:"Preview",brandSub:"Hikes in Armenia",tag:"Every group hike in Armenia, in one place.",
    navHikes:"Hikes",navClubs:"Clubs",
    sHikes:"upcoming hikes",sClubs:"clubs",sFrom:"cheapest day hike",
    all:"All days",today:"Today",tomorrow:"Tomorrow",easy:"Easy",moderate:"Moderate",hard:"Hard",cheap:"Under 10,000 ֏",kids:"With kids",
    allClubs:"All clubs",q:"Mountain, gorge, monastery…",novTitle:"Upcoming hikes",
    count:n=>`${n} hikes`,legendEst:"~ means we estimated the level from distance and climb.",
    tbc:"Time TBC",back:"back",summit:"summit",meet:"Meet:",more:"About this hike",book:"Book with club",onReq:"Price on request",
    kKids:"Kids",kRun:"Trail run",kAdv:"Adventure",kTrip:"Day trip",days:n=>`${n} days`,
    none:"No hikes match these filters.",clear:"Clear filters",
    list:"List",mapv:"Map",onMap:"Map",mapNote:"Pins show where each hike goes, worked out from its name. Green lines are marked trails. Map and trail data © OpenStreetMap contributors.",
    noLoc:n=>`${n} of these hikes have no place we could pin yet.`,
    near:"Marked trails here",trailKm:k=>`${k} km`,approx:"Pin placed from the hike’s name; check with the club for the exact route.",noTrail:"No marked trail mapped here yet.",
    araratTitle:"Ararat",araratSub:"Every club’s Ararat trip side by side",thClub:"Club",thTrip:"Trip",thDates:"Dates",thDays:"Days",thPrice:"Price",view:"Details",
    bigTitle:"Big trips abroad",bigSub:"Expeditions clubs are already booking",
    clubsTitle:"The clubs",clubsAll:n=>`See all ${n} clubs →`,
    clubsHead:"Hiking clubs in Armenia",clubsLead:"Every club and tour operator we list, with their upcoming hikes and how to reach them.",
    tAll:"All",tClub:"Hiking clubs",tOp:"Tour operators",tKids:"For kids",tOut:"Outdoor",
    typ:{"hiking club":"Hiking club","tour operator":"Tour operator","kids club":"Kids club","outdoor":"Outdoor"},
    fol:f=>`${f} followers`,up:n=>`${n} upcoming`,noUp:"No hikes listed right now",next:d=>`Next: ${d}`,clubQ:"Search clubs",
    cHikes:"Upcoming hikes",cBig:"Big trips",cNone:"This club has no hikes listed right now. Follow them on Instagram for new dates.",
    sum:(n,lo,hi,lv)=>`${n} upcoming hikes${lo ? `, from ${lo}${hi && hi!==lo ? " to " + hi : ""}` : ""}${lv ? `. Mostly ${lv}` : ""}.`,
    ig:"Instagram",tg:"Telegram",wa:"WhatsApp",web:"Website",
    foot:"Listings come from the clubs’ public announcements, last updated {date}. Booking always happens directly with the club. Map data © OpenStreetMap contributors."},
  hy:{draft:"Նախնական",brandSub:"Արշավներ Հայաստանում",tag:"Հայաստանի բոլոր խմբային արշավները՝ մեկ տեղում։",
    navHikes:"Արշավներ",navClubs:"Ակումբներ",
    sHikes:"առաջիկա արշավ",sClubs:"ակումբ",sFrom:"ամենամատչելի արշավը",
    all:"Բոլոր օրերը",today:"Այսօր",tomorrow:"Վաղը",easy:"Հեշտ",moderate:"Միջին",hard:"Բարդ",cheap:"Մինչև 10 000 ֏",kids:"Երեխաների հետ",
    allClubs:"Բոլոր ակումբները",q:"Լեռ, կիրճ, վանք…",novTitle:"Առաջիկա արշավներ",
    count:n=>`${n} արշավ`,legendEst:"~ նշանը նշանակում է, որ մակարդակը գնահատել ենք ըստ երկարության և բարձրության։",
    tbc:"Ժամը ճշտվում է",back:"վերադարձ",summit:"գագաթ",meet:"Հանդիպում՝",more:"Արշավի մասին",book:"Գրանցվել",onReq:"Գինը՝ հարցմամբ",
    kKids:"Մանկական",kRun:"Վազք",kAdv:"Արկած",kTrip:"Էքսկուրսիա",days:n=>`${n} օր`,
    none:"Այս ֆիլտրերով արշավ չկա։",clear:"Մաքրել ֆիլտրերը",
    list:"Ցուցակ",mapv:"Քարտեզ",onMap:"Քարտեզ",mapNote:"Նշիչները ցույց են տալիս արշավի ուղղությունը՝ ըստ անվանման։ Կանաչ գծերը նշագծված արահետներն են։ Քարտեզի տվյալները՝ © OpenStreetMap։",
    noLoc:n=>`Այս արշավներից ${n}-ի վայրը դեռ չենք կարողացել նշել։`,
    near:"Նշագծված արահետներ",trailKm:k=>`${k} կմ`,approx:"Նշիչը դրված է ըստ արշավի անվանման․ ճշգրիտ երթուղին ճշտեք ակումբից։",noTrail:"Այստեղ նշագծված արահետ դեռ քարտեզագրված չէ։",
    araratTitle:"Արարատ",araratSub:"Բոլոր ակումբների Արարատյան արշավները կողք կողքի",thClub:"Ակումբ",thTrip:"Արշավ",thDates:"Ամսաթվեր",thDays:"Օր",thPrice:"Գին",view:"Մանրամասներ",
    bigTitle:"Մեծ արշավներ արտերկրում",bigSub:"Արշավախմբեր, որոնց գրանցումն արդեն բաց է",
    clubsTitle:"Ակումբները",clubsAll:n=>`Բոլոր ${n} ակումբները →`,
    clubsHead:"Արշավային ակումբներ Հայաստանում",clubsLead:"Բոլոր ակումբներն ու տուրօպերատորները՝ իրենց առաջիկա արշավներով և կոնտակտներով։",
    tAll:"Բոլորը",tClub:"Արշավային ակումբներ",tOp:"Տուրօպերատորներ",tKids:"Երեխաների համար",tOut:"Արկածային",
    typ:{"hiking club":"Արշավային ակումբ","tour operator":"Տուրօպերատոր","kids club":"Մանկական ակումբ","outdoor":"Արկածային"},
    fol:f=>`${f} հետևորդ`,up:n=>`${n} առաջիկա`,noUp:"Այս պահին արշավներ չկան",next:d=>`Հաջորդը՝ ${d}`,clubQ:"Որոնել ակումբ",
    cHikes:"Առաջիկա արշավներ",cBig:"Մեծ արշավներ",cNone:"Այս ակումբը հիմա արշավներ չունի։ Հետևեք նրանց Instagram-ին նոր ամսաթվերի համար։",
    sum:(n,lo,hi,lv)=>`${n} առաջիկա արշավ${lo ? `, ${lo}${hi && hi!==lo ? "–" + hi : ""}` : ""}${lv ? `։ Հիմնականում՝ ${lv}` : ""}։`,
    ig:"Instagram",tg:"Telegram",wa:"WhatsApp",web:"Կայք",
    foot:"Տվյալները վերցված են ակումբների հրապարակային հայտարարություններից, թարմացվել է՝ {date}։ Գրանցումը միշտ անմիջապես ակումբի մոտ է։ Քարտեզի տվյալները՝ © OpenStreetMap։"},
  ru:{draft:"Предпросмотр",brandSub:"Походы по Армении",tag:"Все групповые походы по Армении в одном месте.",
    navHikes:"Походы",navClubs:"Клубы",
    sHikes:"ближайших походов",sClubs:"клубов",sFrom:"самый доступный поход",
    all:"Все дни",today:"Сегодня",tomorrow:"Завтра",easy:"Лёгкий",moderate:"Средний",hard:"Сложный",cheap:"До 10 000 ֏",kids:"С детьми",
    allClubs:"Все клубы",q:"Гора, ущелье, монастырь…",novTitle:"Ближайшие походы",
    count:n=>`Найдено: ${n}`,legendEst:"~ значит, что уровень мы оценили по длине и набору высоты.",
    tbc:"Время уточняется",back:"возврат",summit:"вершина",meet:"Сбор:",more:"О походе",book:"Записаться",onReq:"Цена по запросу",
    kKids:"Детский",kRun:"Забег",kAdv:"Экстрим",kTrip:"Поездка",days:n=>`Дней: ${n}`,
    none:"По этим фильтрам походов нет.",clear:"Сбросить фильтры",
    list:"Список",mapv:"Карта",onMap:"Карта",mapNote:"Метки показывают, куда идёт поход, по его названию. Зелёные линии — маркированные тропы. Данные карты © участники OpenStreetMap.",
    noLoc:n=>`Для ${n} походов место пока не определено.`,
    near:"Маркированные тропы",trailKm:k=>`${k} км`,approx:"Метка поставлена по названию похода; точный маршрут уточняйте у клуба.",noTrail:"Здесь пока нет нанесённых на карту троп.",
    araratTitle:"Арарат",araratSub:"Туры всех клубов на Арарат рядом",thClub:"Клуб",thTrip:"Тур",thDates:"Даты",thDays:"Дней",thPrice:"Цена",view:"Подробнее",
    bigTitle:"Большие поездки за рубеж",bigSub:"Экспедиции, на которые клубы уже записывают",
    clubsTitle:"Клубы",clubsAll:n=>`Все клубы (${n}) →`,
    clubsHead:"Походные клубы Армении",clubsLead:"Все клубы и туроператоры, их ближайшие походы и контакты.",
    tAll:"Все",tClub:"Походные клубы",tOp:"Туроператоры",tKids:"Для детей",tOut:"Активный отдых",
    typ:{"hiking club":"Походный клуб","tour operator":"Туроператор","kids club":"Детский клуб","outdoor":"Активный отдых"},
    fol:f=>`${f} подписчиков`,up:n=>`Ближайших: ${n}`,noUp:"Сейчас походов нет",next:d=>`Следующий: ${d}`,clubQ:"Поиск клуба",
    cHikes:"Ближайшие походы",cBig:"Большие поездки",cNone:"Сейчас у клуба нет походов. Следите за их Instagram, чтобы узнать новые даты.",
    sum:(n,lo,hi,lv)=>`Ближайших походов: ${n}${lo ? `, от ${lo}${hi && hi!==lo ? " до " + hi : ""}` : ""}${lv ? `. В основном ${lv}` : ""}.`,
    ig:"Instagram",tg:"Telegram",wa:"WhatsApp",web:"Сайт",
    foot:"Данные взяты из открытых анонсов клубов, обновлено {date}. Запись всегда напрямую у клуба. Данные карты © участники OpenStreetMap."}
};
const LOC = {en:"en-GB",hy:"hy-AM",ru:"ru-RU"};
const TODAY = new Date().toLocaleDateString("en-CA", {timeZone:"Asia/Yerevan"});

let lang = "en";
try { lang = localStorage.getItem("allhikes-lang") || (navigator.language || "en").slice(0,2); } catch(e){}
if(!T[lang]) lang = "en";
const t = k => T[lang][k];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const $ = id => document.getElementById(id);
const name = h => h.n[lang] || h.n.en;
const dt = d => new Date(d + "T12:00:00+04:00");
/* Many browsers ship no Armenian date names, so Armenian dates are built by hand. */
const HY_WD = ["Կիրակի","Երկուշաբթի","Երեքշաբթի","Չորեքշաբթի","Հինգշաբթի","Ուրբաթ","Շաբաթ"];
const HY_WS = ["Կիր","Երկ","Երք","Չրք","Հնգ","Ուր","Շբթ"];
const HY_M = ["հունվարի","փետրվարի","մարտի","ապրիլի","մայիսի","հունիսի","հուլիսի","օգոստոսի","սեպտեմբերի","հոկտեմբերի","նոյեմբերի","դեկտեմբերի"];
function fmtDate(d, o){
  if(lang !== "hy") return dt(d).toLocaleDateString(LOC[lang], {timeZone:"Asia/Yerevan", ...o});
  const x = dt(d), wd = x.getUTCDay(), day = x.getUTCDate(), m = HY_M[x.getUTCMonth()];
  if(o.weekday && !o.day) return o.weekday === "short" ? HY_WS[wd] : HY_WD[wd];
  const ms = ["հնվ","փտվ","մրտ","ապր","մյս","հնս","հլս","օգս","սեպ","հոկ","նոյ","դեկ"][x.getUTCMonth()];
  const dm = o.month === "short" ? `${ms}. ${day}` : `${m} ${day}`;
  return o.weekday ? `${HY_WD[wd]}, ${dm}` : dm;
}
const isWE = d => [0,6].includes(dt(d).getUTCDay());
const nf = n => Number(n).toLocaleString(lang === "hy" ? "ru-RU" : LOC[lang]).replace(/ /g," ");
const priceText = h => !h.p ? t("onReq") : (h.c === "USD" ? "$" + nf(h.p) : nf(h.p) + " ֏");
const price = h => `<span class="price${h.p ? "" : " na"}">${priceText(h)}</span>`;
const daysLen = h => h.e ? Math.round((dt(h.e) - dt(h.d)) / 864e5) + 1 : 1;
const range = h => fmtDate(h.d, {day:"numeric", month:"short"}) + (h.e ? " – " + fmtDate(h.e, {day:"numeric", month:"short"}) : "");
const clubBySlug = Object.fromEntries(CLUBS.map(c => [c.slug, c]));
const clubUrl = c => `${ROOT}clubs/${c.slug}/`;
const logo = (c, cls = "") => c ? `<img class="logo ${cls}" src="${ROOT}assets/logos/${esc(c.ig)}.jpg" alt="" loading="lazy" width="44" height="44">` : "";

const UP = HIKES.filter(h => h.k !== "big" && (h.e || h.d) >= TODAY);
const BIG = HIKES.filter(h => h.k === "big" && (h.e || h.d) >= TODAY);
const isArarat = h => /ararat|masis/i.test(h.n.en);
const byDate = (a, b) => (a.d + (a.t || "99")).localeCompare(b.d + (b.t || "99"));

/* ---------- hike card ---------- */
function blaze(h){ return h.df ? `<span class="blaze b-${h.df}"><i></i>${h.est ? "~" : ""}${t(h.df)}</span>` : ""; }
function kindTag(h){ const m = {kids:"kKids", run:"kRun", adventure:"kAdv", trip:"kTrip"}[h.k]; return m ? `<span class="k">${t(m)}</span>` : ""; }
function card(h){
  const c = clubBySlug[h.cs];
  const meta = [kindTag(h), blaze(h),
    h.km ? `<span>${nf(h.km)} km</span>` : "", h.g ? `<span>↑ ${nf(h.g)} m</span>` : "",
    h.s ? `<span>${t("summit")} ${nf(h.s)} m</span>` : "", h.e ? `<span>${t("days")(daysLen(h))}</span>` : ""].filter(Boolean).join("");
  const book = `<a class="book" href="${esc(h.b)}" target="_blank" rel="noopener">${t("book")} ↗</a>`;
  const who = c ? `${logo(c, "sm")}<a href="${clubUrl(c)}">${esc(h.o)}</a>` : esc(h.o);
  return `<article class="hike">
    <div class="when">${h.t ? `<span class="time">${h.t}</span>` : `<span class="time tbc">${t("tbc")}</span>`}${h.back ? `<span class="back">${t("back")} ~${h.back}</span>` : ""}</div>
    <div class="mid">
      <h4>${esc(name(h))}</h4>
      <p class="by">${who}</p>
      ${meta ? `<div class="meta">${meta}</div>` : ""}
      ${h.m ? `<p class="meet">${t("meet")} ${esc(h.m)}</p>` : ""}
      ${h.ds ? `<details><summary>${t("more")}</summary><p>${esc(h.ds)}</p></details>` : ""}
      ${h.loc ? `<button type="button" class="mapbtn" data-map="${HIKES.indexOf(h)}">◉ ${t("onMap")} · ${esc(h.loc[2])}</button>` : ""}
      ${book.replace('class="book"', 'class="book book-m"')}
    </div>
    <div class="buy">${price(h)}${book}</div>
  </article>`;
}
function dayGroups(rows){
  const by = {};
  rows.forEach(h => (by[h.d] = by[h.d] || []).push(h));
  return Object.entries(by).map(([d, hs]) => {
    const rel = d === TODAY ? t("today") + " · " : (dt(d) - dt(TODAY) === 864e5 ? t("tomorrow") + " · " : "");
    return `<div class="daygroup"><h3><span class="${isWE(d) ? "we" : ""}">${rel}${fmtDate(d, {weekday:"long", day:"numeric", month:"long"})}</span></h3>${hs.map(card).join("")}</div>`;
  }).join("");
}

/* ---------- maps (Leaflet, loaded only when a map is opened) ---------- */
let leafletReady;
function loadLeaflet(){
  if(leafletReady) return leafletReady;
  const css = document.createElement("link");
  css.rel = "stylesheet"; css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
  document.head.appendChild(css);
  leafletReady = new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    s.onload = ok; s.onerror = fail; document.head.appendChild(s);
  });
  return leafletReady;
}
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
async function drawMap(el, hikes, opts = {}){
  await loadLeaflet();
  if(el._map){ el._map.remove(); }
  const map = L.map(el, {scrollWheelZoom: !!opts.wheel});
  el._map = map;
  L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {maxZoom: 16,
    attribution: 'Map: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Style: © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'}).addTo(map);
  const bounds = [];
  const trailIds = new Set(hikes.flatMap(h => h.tr || []));
  trailIds.forEach(id => {
    const tr = TRAILS[id]; if(!tr) return;
    L.polyline(tr.lines, {color: css("--moss") || "#3D6A49", weight: 4, opacity: .85})
      .bindPopup(`<b>${esc(tr.name || "Trail")}</b><br>${t("trailKm")(tr.km)} · <a href="https://www.openstreetmap.org/relation/${id}" target="_blank" rel="noopener">OpenStreetMap ↗</a>`)
      .addTo(map);
    if(opts.fitTrails) tr.lines.forEach(l => l.forEach(p => bounds.push(p)));
  });
  const groups = {};
  hikes.filter(h => h.loc).forEach(h => { const k = h.loc[0] + "," + h.loc[1]; (groups[k] = groups[k] || []).push(h); });
  Object.values(groups).forEach(hs => {
    const [lat, lng, place] = hs[0].loc;
    const icon = L.divIcon({className: "", html: `<div class="pin"><span>${hs.length > 1 ? hs.length : ""}</span></div>`, iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -24]});
    const body = hs.sort(byDate).slice(0, 8).map(h => `<span class="pop-h"><b>${esc(name(h))}</b><br>${fmtDate(h.d, {weekday:"short", day:"numeric", month:"short"})} · ${esc(h.o)} · ${priceText(h)}<br><a href="${esc(h.b)}" target="_blank" rel="noopener">${t("book")} ↗</a></span>`).join("");
    L.marker([lat, lng], {icon}).bindPopup(`<b>${esc(place)}</b>${body}`, {maxWidth: 260}).addTo(map);
    bounds.push([lat, lng]);
  });
  if(bounds.length) map.fitBounds(bounds, {padding: [30, 30], maxZoom: opts.maxZoom || 13});
  else map.setView([40.2, 44.8], 8);
  return map;
}
function openHikeMap(h){
  let d = $("mapdlg");
  if(!d){
    d = document.createElement("dialog"); d.id = "mapdlg"; d.className = "mapdlg";
    d.addEventListener("click", e => { if(e.target === d || e.target.closest(".x")) d.close(); });
    document.body.appendChild(d);
  }
  const trs = (h.tr || []).map(id => TRAILS[id]).filter(Boolean);
  d.innerHTML = `<div class="hd"><div><h3>${esc(name(h))}</h3><p class="muted">${esc(h.loc[2])} · ${esc(h.o)}</p></div><button type="button" class="x" aria-label="Close">×</button></div>
    <div class="map" id="dlgmap"></div>
    <div class="bd">${trs.length ? `<b>${t("near")}</b><ul>${trs.map((tr, i) => `<li><a href="https://www.openstreetmap.org/relation/${h.tr[i]}" target="_blank" rel="noopener">${esc(tr.name || "Trail")}</a> · ${t("trailKm")(tr.km)}</li>`).join("")}</ul>` : `<p class="muted">${t("noTrail")}</p>`}
    <p class="muted">${t("approx")}</p></div>`;
  d.showModal();
  drawMap($("dlgmap"), [h], {fitTrails: true, maxZoom: 13, wheel: true});
}

/* ---------- shared chrome ---------- */
function navbar(current){
  return `<nav class="navbar" aria-label="Site"><div class="wrap">
    <a class="mini-sign" href="${ROOT}">AllHikes</a>
    <div class="nav-links">
      <a href="${ROOT}" ${current === "home" ? 'aria-current="page"' : ""}>${t("navHikes")}</a>
      <a href="${ROOT}clubs/" ${current !== "home" ? 'aria-current="page"' : ""}>${t("navClubs")}</a>
      ${langs()}
    </div></div></nav>`;
}
const langs = () => `<div class="langs" role="group" aria-label="Language">${["en","hy","ru"].map(l => `<button type="button" id="l-${l}" data-l="${l}" aria-pressed="${l === lang}">${{en:"EN",hy:"ՀԱՅ",ru:"РУ"}[l]}</button>`).join("")}</div>`;
const footer = () => `<footer><div class="wrap"><p>${t("foot").replace("{date}", fmtDate(UPDATED, {day:"numeric", month:"long"}) + " " + UPDATED.slice(0,4))}</p></div></footer>`;

/* ---------- HOME ---------- */
const S = {day:"", df:new Set(), cheap:false, kids:false, club:"", q:"", view:"list"};
function match(h){
  if(S.day && h.d !== S.day) return false;
  if(S.df.size && !S.df.has(h.df)) return false;
  if(S.cheap && !(h.p && h.c === "AMD" && h.p < 10000)) return false;
  if(S.kids && h.k !== "kids" && !/kid|child|famil|beginner/i.test(h.ds + h.n.en)) return false;
  if(S.club && h.cs !== S.club) return false;
  if(S.q){
    const hay = [h.n.en, h.n.hy, h.n.ru, h.o, h.m, h.ds, h.loc && h.loc[2]].join(" ").toLowerCase();
    if(!S.q.toLowerCase().split(/\s+/).every(w => hay.includes(w))) return false;
  }
  return true;
}
function homeShell(){
  const cheapest = Math.min(...UP.filter(h => h.p && h.c === "AMD" && h.k === "hike").map(h => h.p));
  const nClubs = new Set(HIKES.map(h => h.o)).size;
  const clubOpts = [...new Set(UP.map(h => h.cs).filter(Boolean))].map(s => clubBySlug[s]).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
  return `<header class="hero"><canvas id="topo" aria-hidden="true"></canvas><div class="wrap">
      <div class="topbar"><span class="draft">${t("draft")}</span><div class="nav-links"><a href="${ROOT}clubs/">${t("navClubs")}</a>${langs()}</div></div>
      <div class="sign"><h1>AllHikes</h1><small>${t("brandSub")}</small></div>
      <p class="tag">${t("tag")}</p>
      <ul class="stats"><li><b>${UP.length}</b>${t("sHikes")}</li><li><b>${nClubs}</b>${t("sClubs")}</li>${isFinite(cheapest) ? `<li><b>${nf(cheapest)} ֏</b>${t("sFrom")}</li>` : ""}</ul>
    </div></header>
    <nav class="filters" aria-label="Filters"><div class="wrap">
      <div class="days" id="days"></div>
      <div class="row">
        ${["easy","moderate","hard"].map(d => `<button type="button" class="chip" id="f-${d}" data-df="${d}" aria-pressed="${S.df.has(d)}"><span class="blaze b-${d}"><i></i></span>${t(d)}</button>`).join("")}
        <button type="button" class="chip" id="f-cheap" aria-pressed="${S.cheap}">${t("cheap")}</button>
        <button type="button" class="chip" id="f-kids" aria-pressed="${S.kids}">${t("kids")}</button>
        <select class="chip" id="f-club" aria-label="${t("allClubs")}"><option value="">${t("allClubs")}</option>${clubOpts.map(c => `<option value="${c.slug}"${S.club === c.slug ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
        <input class="chip" id="f-q" type="search" autocomplete="off" placeholder="${t("q")}" value="${esc(S.q)}">
      </div></div></nav>
    <main><div class="wrap">
      <section id="up">
        <div class="sec-head"><h2>${t("novTitle")}</h2><p id="count"></p></div>
        <div class="viewbar">
          <div class="legend">${["easy","moderate","hard"].map(d => `<span class="blaze b-${d}"><i></i>${t(d)}</span>`).join("")}<span>${t("legendEst")}</span></div>
          <div class="seg" role="group" aria-label="View"><button type="button" id="v-list" data-v="list" aria-pressed="${S.view === "list"}">☰ ${t("list")}</button><button type="button" id="v-map" data-v="map" aria-pressed="${S.view === "map"}">◉ ${t("mapv")}</button></div>
        </div>
        <div id="list"></div>
        <div id="mapwrap" hidden><div class="map" id="bigmap"></div><p class="map-note" id="mapnote"></p></div>
      </section>
      <section id="ararat"></section>
      <section id="abroad"></section>
      <section id="clubstrip"></section>
    </div></main>${footer()}`;
}
function renderDays(){
  const counts = {};
  UP.forEach(h => counts[h.d] = (counts[h.d] || 0) + 1);
  $("days").innerHTML = `<button type="button" class="day all" id="d-all" data-d="" aria-pressed="${!S.day}">${t("all")}</button>` +
    Object.keys(counts).sort().map(d => `<button type="button" class="day${isWE(d) ? " we" : ""}" id="d-${d}" data-d="${d}" aria-pressed="${S.day === d}">
      <span class="dw">${fmtDate(d, {weekday:"short"})}</span><span class="dn">${dt(d).getUTCDate()}</span><span class="dc">${counts[d]}</span></button>`).join("");
}
function renderList(){
  const rows = UP.filter(match).sort(byDate);
  $("count").textContent = t("count")(rows.length);
  $("list").hidden = S.view !== "list"; $("mapwrap").hidden = S.view !== "map";
  if(S.view === "map"){
    const miss = rows.filter(h => !h.loc).length;
    $("mapnote").textContent = t("mapNote") + (miss ? " " + t("noLoc")(miss) : "");
    drawMap($("bigmap"), rows, {maxZoom: 11});
    return;
  }
  $("list").innerHTML = rows.length ? dayGroups(rows) : `<div class="empty daygroup">${t("none")}<br><button type="button" class="chip" id="clear">${t("clear")}</button></div>`;
}
function renderHomeExtras(){
  const ar = BIG.filter(isArarat).sort((a, b) => a.d.localeCompare(b.d));
  $("ararat").innerHTML = ar.length ? `<div class="sec-head"><h2>${t("araratTitle")} ${ar[0].d.slice(0,4)}</h2><p>${t("araratSub")}</p></div>
    <div class="tbl"><table><thead><tr><th>${t("thClub")}</th><th>${t("thTrip")}</th><th>${t("thDates")}</th><th>${t("thDays")}</th><th>${t("thPrice")}</th><th></th></tr></thead><tbody>${ar.map(h => {
      const c = clubBySlug[h.cs];
      return `<tr><td><b>${c ? `<a href="${clubUrl(c)}">${esc(h.o)}</a>` : esc(h.o)}</b></td><td>${esc(name(h))}</td><td class="num">${range(h)}</td><td class="num">${h.e ? daysLen(h) : "—"}</td><td class="num">${priceText(h)}</td><td><a class="book" href="${esc(h.b)}" target="_blank" rel="noopener">${t("view")} ↗</a></td></tr>`;
    }).join("")}</tbody></table></div>` : "";
  const other = BIG.filter(h => !isArarat(h)).sort((a, b) => a.d.localeCompare(b.d));
  $("abroad").innerHTML = other.length ? `<div class="sec-head"><h2>${t("bigTitle")}</h2><p>${t("bigSub")}</p></div><div class="trips">${other.map(trip).join("")}</div>` : "";
  const strip = CLUBS.slice().sort((a, b) => b.up - a.up).slice(0, 12);
  $("clubstrip").innerHTML = `<div class="sec-head"><h2>${t("clubsTitle")}</h2><p><a href="${ROOT}clubs/">${t("clubsAll")(CLUBS.length)}</a></p></div><div class="club-grid">${strip.map(clubCard).join("")}</div>`;
}
const trip = h => `<div class="trip"><span class="when2">${range(h)}${h.d.slice(0,4) !== TODAY.slice(0,4) ? " " + h.d.slice(0,4) : ""}</span><h4>${esc(name(h))}</h4>
  <p>${esc(h.o)} · ${priceText(h)}</p><a href="${esc(h.b)}" target="_blank" rel="noopener">${t("view")} ↗</a></div>`;

/* ---------- CLUBS ---------- */
const CS = {type:"", q:""};
function clubCard(c){
  const next = UP.filter(h => h.cs === c.slug).sort(byDate)[0];
  return `<a class="club-card" href="${clubUrl(c)}">${logo(c)}
    <span><span class="typetag">${t("typ")[c.type] || c.type}</span><br><b>${esc(c.name)}</b></span>
    <span class="meta2"><span>${t("fol")(c.followers)}</span><span>${c.up ? t("up")(c.up) : t("noUp")}</span></span>
    ${next ? `<span class="next">${t("next")(fmtDate(next.d, {weekday:"short", day:"numeric", month:"short"}) + " · " + name(next))}</span>` : ""}</a>`;
}
function clubsShell(){
  const types = [["", "tAll"], ["hiking club", "tClub"], ["tour operator", "tOp"], ["kids club", "tKids"], ["outdoor", "tOut"]];
  return navbar("clubs") + `<main><div class="wrap">
    <header class="page-head"><h1>${t("clubsHead")}</h1><p>${t("clubsLead")}</p></header>
    <div class="row" id="ctypes">${types.map(([v, k]) => `<button type="button" class="chip" id="ct-${k}" data-ct="${v}" aria-pressed="${CS.type === v}">${t(k)}</button>`).join("")}
      <input class="chip" id="c-q" type="search" autocomplete="off" placeholder="${t("clubQ")}" value="${esc(CS.q)}"></div>
    <div class="club-grid" id="cgrid"></div></div></main>${footer()}`;
}
function renderClubGrid(){
  const q = CS.q.toLowerCase();
  const rows = CLUBS.filter(c => (!CS.type || c.type === CS.type) && (!q || (c.name + " " + c.ig).toLowerCase().includes(q)))
    .sort((a, b) => b.up - a.up || b.fn - a.fn);
  $("cgrid").innerHTML = rows.map(clubCard).join("") || `<p class="empty">${t("none")}</p>`;
}

/* ---------- ONE CLUB ---------- */
function clubShell(){
  const c = clubBySlug[B.dataset.club];
  const ups = UP.filter(h => h.cs === c.slug).sort(byDate);
  const bigs = BIG.filter(h => h.cs === c.slug).sort((a, b) => a.d.localeCompare(b.d));
  const prices = ups.filter(h => h.p && h.c === "AMD").map(h => h.p);
  const lv = Object.entries(ups.reduce((m, h) => (h.df && (m[h.df] = (m[h.df] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1])[0];
  const tel = p => "+374 " + p.replace(/\D/g, "").replace(/^(374|0)/, "").replace(/^(\d{2})(\d{3})(\d+)$/, "$1 $2 $3");
  const contact = [`<a class="main" href="https://www.instagram.com/${esc(c.ig)}/" target="_blank" rel="noopener">${t("ig")} ↗</a>`]
    .concat(c.telegram.map(x => `<a href="https://${esc(x)}" target="_blank" rel="noopener">${t("tg")} ${esc(x.replace("t.me/", "@"))} ↗</a>`))
    .concat(c.whatsapp ? [`<a href="https://${esc(c.whatsapp)}" target="_blank" rel="noopener">${t("wa")} ↗</a>`] : [])
    .concat(c.web ? [`<a href="${esc(c.web)}" target="_blank" rel="noopener">${t("web")} ↗</a>`] : [])
    .concat(c.phone.map(p => `<span>${esc(tel(p))}</span>`))
    .concat(c.email ? [`<span>${esc(c.email)}</span>`] : []);
  document.title = c.name + " · AllHikes";
  return navbar("club") + `<main><div class="wrap">
    <header class="club-hero">${logo(c, "lg")}
      <div><span class="typetag">${t("typ")[c.type] || c.type}</span><h1>${esc(c.name)}</h1>
        <div class="facts"><span>@${esc(c.ig)}</span><span>${t("fol")(c.followers)}</span><span><b>${ups.length}</b> ${t("sHikes")}</span></div></div>
      <div class="contact">${contact.join("")}</div>
    </header>
    ${ups.length ? `<p class="summary">${t("sum")(ups.length, prices.length ? nf(Math.min(...prices)) + " ֏" : "", prices.length ? nf(Math.max(...prices)) + " ֏" : "", lv ? t(lv[0]).toLowerCase() : "")}</p>` : ""}
    <section><div class="sec-head"><h2>${t("cHikes")}</h2><p>${t("count")(ups.length)}</p></div>
      ${ups.some(h => h.loc) ? `<div class="map" id="clubmap"></div><p class="map-note">${t("mapNote")}</p>` : ""}
      ${ups.length ? dayGroups(ups) : `<p class="empty daygroup">${t("cNone")}</p>`}</section>
    ${bigs.length ? `<section><div class="sec-head"><h2>${t("cBig")}</h2></div><div class="trips">${bigs.map(trip).join("")}</div></section>` : ""}
  </div></main>${footer()}`;
}

/* ---------- render + events ---------- */
function render(){
  document.documentElement.lang = lang;
  if(PAGE === "home"){ B.innerHTML = homeShell(); renderDays(); renderList(); renderHomeExtras(); drawTopo(); }
  else if(PAGE === "clubs"){ B.innerHTML = clubsShell(); renderClubGrid(); }
  else if(PAGE === "club"){
    B.innerHTML = clubShell();
    const el = $("clubmap");
    if(el) drawMap(el, UP.filter(h => h.cs === B.dataset.club), {maxZoom: 11});
  }
}
document.addEventListener("click", e => {
  const b = e.target.closest("button"); if(!b) return;
  if(b.dataset.l){ lang = b.dataset.l; try { localStorage.setItem("allhikes-lang", lang); } catch(err){} render(); return; }
  if(b.dataset.map){ openHikeMap(HIKES[+b.dataset.map]); return; }
  if(b.dataset.v){ S.view = b.dataset.v; document.querySelectorAll("[data-v]").forEach(x => x.setAttribute("aria-pressed", x === b)); renderList(); return; }
  if(b.dataset.d !== undefined){ S.day = b.dataset.d; renderDays(); renderList(); return; }
  if(b.dataset.df){ S.df.has(b.dataset.df) ? S.df.delete(b.dataset.df) : S.df.add(b.dataset.df); b.setAttribute("aria-pressed", S.df.has(b.dataset.df)); renderList(); return; }
  if(b.id === "f-cheap"){ S.cheap = !S.cheap; b.setAttribute("aria-pressed", S.cheap); renderList(); return; }
  if(b.id === "f-kids"){ S.kids = !S.kids; b.setAttribute("aria-pressed", S.kids); renderList(); return; }
  if(b.dataset.ct !== undefined){ CS.type = b.dataset.ct; document.querySelectorAll("[data-ct]").forEach(x => x.setAttribute("aria-pressed", x === b)); renderClubGrid(); return; }
  if(b.id === "clear"){ Object.assign(S, {day:"", cheap:false, kids:false, club:"", q:""}); S.df.clear(); render(); }
});
document.addEventListener("input", e => {
  if(e.target.id === "f-q"){ S.q = e.target.value.trim(); renderList(); }
  if(e.target.id === "c-q"){ CS.q = e.target.value.trim(); renderClubGrid(); }
});
document.addEventListener("change", e => { if(e.target.id === "f-club"){ S.club = e.target.value; renderList(); } });

/* contour-map hero: isolines of a few made-up peaks, drawn with marching squares */
function drawTopo(){
  const c = $("topo"); if(!c) return;
  const box = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = box.width * dpr; c.height = box.height * dpr;
  const g = c.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = box.width, H = box.height, col = css("--contour");
  const peaks = [[.78,.35,.32,1],[.62,.75,.22,.7],[.93,.8,.18,.55],[.45,.15,.2,.45]];
  const f = (x, y) => { let v = 0; for(const [px, py, r, h] of peaks){ const dx = (x / W - px) * (W / H) * .6, dy = y / H - py; v += h * Math.exp(-(dx*dx + dy*dy) / (r*r)); } return v + .04 * Math.sin(x / 37) * Math.cos(y / 29); };
  const step = 7, nx = Math.ceil(W / step) + 1, ny = Math.ceil(H / step) + 1, grid = [];
  for(let j = 0; j < ny; j++){ grid[j] = []; for(let i = 0; i < nx; i++) grid[j][i] = f(i * step, j * step); }
  g.clearRect(0, 0, W, H); g.strokeStyle = col;
  for(let Lv = .08, n = 0; Lv < 1.4; Lv += .07, n++){
    g.lineWidth = n % 5 === 0 ? 1.4 : .8; g.beginPath();
    for(let j = 0; j < ny - 1; j++) for(let i = 0; i < nx - 1; i++){
      const a = grid[j][i], b = grid[j][i+1], cc = grid[j+1][i+1], d = grid[j+1][i];
      const idx = (a > Lv) | (b > Lv) << 1 | (cc > Lv) << 2 | (d > Lv) << 3;
      if(idx === 0 || idx === 15) continue;
      const x = i * step, y = j * step, lerp = (p, q) => (Lv - p) / (q - p);
      const P = {t:[x + step * lerp(a, b), y], r:[x + step, y + step * lerp(b, cc)], b:[x + step * lerp(d, cc), y + step], l:[x, y + step * lerp(a, d)]};
      const segs = {1:["l","t"],2:["t","r"],3:["l","r"],4:["r","b"],5:["l","t","r","b"],6:["t","b"],7:["l","b"],8:["l","b"],9:["t","b"],10:["t","r","l","b"],11:["r","b"],12:["l","r"],13:["t","r"],14:["l","t"]}[idx];
      for(let s = 0; s < segs.length; s += 2){ g.moveTo(...P[segs[s]]); g.lineTo(...P[segs[s+1]]); }
    }
    g.stroke();
  }
}
let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(drawTopo, 150); });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", drawTopo);

render();
})();
