import"./loadHeader-DqtcMgNc.js";/* empty css                     */document.addEventListener("DOMContentLoaded",async()=>{const v=document.getElementById("loading-overlay"),L=document.getElementById("rankings-grid"),d=document.getElementById("modal-backdrop"),l=document.getElementById("modal-content"),r={1:.094,1.5:.1351374318,2:.16639787,2.5:.192650919,3:.21573247,3.5:.2365726613,4:.25572005,4.5:.2735303812,5:.29024988,5.5:.3060573775,6:.3210876,6.5:.3354450362,7:.34921268,7.5:.3624577511,8:.3752356,8.5:.387592416,9:.39956728,9.5:.4111935514,10:.4225,10.5:.4329264091,11:.44310755,11.5:.4530599591,12:.4627984,12.5:.472336093,13:.48168495,13.5:.4908558003,14:.49985844,14.5:.508701765,15:.51739395,15.5:.5259425113,16:.5343543,16.5:.5426357375,17:.5507927,17.5:.5588305862,18:.5667545,18.5:.5745691333,19:.5822789,19.5:.5898879072,20:.5974,20.5:.6048236651,21:.6121573,21.5:.6194041216,22:.6265671,22.5:.6336491432,23:.64065295,23.5:.6475809666,24:.65443563,24.5:.6612192524,25:.667934,25.5:.6745818959,26:.6811649,26.5:.6876849038,27:.69414365,27.5:.70054287,28:.7068842,28.5:.7131691091,29:.7193991,29.5:.7255756136,30:.7317,30.5:.7377694897,31:.7437366,31.5:.749609799,32:.7553897,32.5:.761080073,33:.7666845,33.5:.772199568,34:.7776309,34.5:.782983635,35:.7882599,35.5:.793460966,36:.7985881,36.5:.803645071,37:.8086304,37.5:.813544863,38:.8183946,38.5:.823179625,39:.7846369743347168,39.5:.7874736085132754,40:.7903000116348267,40.5:.792803968023538,41:.7953000068664551,41.5:.7978038983716224,42:.8003000020980835,42.5:.8028038718775964,43:.8052999973297119,43.5:.8078038508470536,44:.8102999925613403,44.5:.812803835179168,45:.8152999877929688,45.5:.8178037928037928,46:.8203000020980835,46.5:.822803776019539,47:.82530000925064,47.5:.827803755931569,48:.830300023555755,48.5:.832803729034748,49:.835300018787384,49.5:.837803755931569,50:.840300023555755,50.5:.842803729034748,51:.845300018787384,51.5:.847803702398935,52:.850300014019012,52.5:.852803676019539,53:.85530000925064,53.5:.857803649892077,54:.860300004482269,54.5:.862803624012168,55:.865299999713897};function h(e){let t=null,s=1/0;for(const a in r){const i=Math.abs(r[a]-e);i<s&&(s=i,t=a)}return t}function b(e){const t=(s,a)=>{if(!a||!a.value||a.value<=1)return"";const i=a.text?`(${a.text})`:"";return`<li><span>${s} ${i}</span><span>1 in ${Math.round(a.value).toLocaleString()}</span></li>`};l.innerHTML=`
            <button id="modal-close-btn">&times;</button>
            <div class="pokemon-modal-header">
                <img src="${e.sprite}" alt="${e.name}">
                <div class="pokemon-info">
                    <h2>
                        ${e.name}
                        <span class="badges-container">
                            ${c(e)}
                        </span>
                    </h2>
                    <div class="pokemon-stats-grid">
                        <div><span>Owner</span><strong>${renderPlayerBadge({userId:e.userId,publicId:e.ownerPublicId})}</strong></div>
                        <div><span>Rarity Score</span><strong>1 in ${Math.round(e.rarity.score).toLocaleString()}</strong></div>
                    </div>
                </div>
            </div>
            <div class="pokemon-modal-body">
                <h4>Rarity Factors</h4>
                <ul class="stat-breakdown-list">
                    ${t("Perfect IVs",e.rarity.breakdown.iv)}
                    ${t("Shiny",e.rarity.breakdown.shiny)}
                    ${t("Lucky",e.rarity.breakdown.lucky)}
                    ${t("Origin",e.rarity.breakdown.origin)}
                </ul>
            </div>
        `,d.classList.remove("hidden"),document.body.classList.add("modal-open"),document.getElementById("modal-close-btn").onclick=()=>{d.classList.add("hidden"),document.body.classList.remove("modal-open")}}function c(e){const t=[];let s=!1,a=!1,i=!1;return e.isShiny&&e.isLucky&&e.isPerfect?(t.push('<span class="badge shlundo-badge">Shlundo</span>'),s=a=i=!0):e.isLucky&&e.isPerfect?(t.push('<span class="badge lundo-badge">Lundo</span>'),s=i=!0):e.isShiny&&e.isPerfect?(t.push('<span class="badge shundo-badge">Shundo</span>'),s=a=!0):e.isShiny&&e.isZeroIv&&(t.push('<span class="badge shnundo-badge">Shnundo</span>'),s=a=!0),!a&&e.isShiny&&t.push('<span class="badge shiny-badge">Shiny</span>'),!i&&e.isLucky?t.push('<span class="badge lucky-badge">Lucky</span>'):e.isTraded&&!e.isLucky&&t.push('<span class="badge traded-badge">Traded</span>'),s||(e.isPerfect?t.push('<span class="badge perfect-badge">Hundo</span>'):e.isZeroIv&&t.push('<span class="badge zero-iv-badge">Nundo</span>')),e.pokemonDisplay?.alignment===1&&t.push('<span class="badge shadow-badge">Shadow</span>'),e.pokemonDisplay?.alignment===2&&t.push('<span class="badge purified-badge">Purified</span>'),e.isLegendary&&t.push('<span class="badge legendary-badge">Legendary</span>'),e.isMythical&&t.push('<span class="badge mythical-badge">Mythical</span>'),t.join(" ")}function m(e){const t=e.iv.attack,s=e.iv.defense,a=e.iv.stamina,i=e.cpm,$=h(i);l.innerHTML=`
            <button id="modal-close-btn">&times;</button>
            <div class="pokemon-modal-header">
                <img src="${e.sprite}" alt="${e.name}">
                <div class="pokemon-info">
                    <h2>
                        ${e.name}
                        <span class="badges-container">
                            ${c(e)}
                        </span>
                    </h2>
                    <div class="pokemon-stats-grid">
                        <div><span>Owner</span><strong>${renderPlayerBadge({userId:e.userId,publicId:e.ownerPublicId})}</strong></div>
                        <div><span>CP</span><strong>${e.cp}</strong></div>
                        <div><span>Level</span><strong>${$}</strong></div>
                    </div>
                </div>
            </div>
            <div class="pokemon-modal-body">
                <h4>IV Stats</h4>
                <div class="iv-stats">
                    <div class="stat-bar-container">
                        <span class="stat-label">Attack</span>
                        <div class="stat-bar">
                            <div id="attack-bar" class="stat-bar-fill"></div>
                        </div>
                        <span class="stat-value">${t}/15</span>
                    </div>
                    <div class="stat-bar-container">
                        <span class="stat-label">Defense</span>
                        <div class="stat-bar">
                            <div id="defense-bar" class="stat-bar-fill"></div>
                        </div>
                        <span class="stat-value">${s}/15</span>
                    </div>
                    <div class="stat-bar-container">
                        <span class="stat-label">Stamina</span>
                        <div class="stat-bar">
                            <div id="stamina-bar" class="stat-bar-fill"></div>
                        </div>
                        <span class="stat-value">${a}/15</span>
                    </div>
                </div>
            </div>
        `,d.classList.remove("hidden"),document.body.classList.add("modal-open"),document.getElementById("modal-close-btn").onclick=()=>{d.classList.add("hidden"),document.body.classList.remove("modal-open")},setTimeout(()=>{const w=document.getElementById("attack-bar");w.style.width=`${t/15*100}%`,w.style.backgroundColor=t===15?"#da7a79":"#f79513";const E=document.getElementById("defense-bar");E.style.width=`${s/15*100}%`,E.style.backgroundColor=s===15?"#da7a79":"#f79513";const I=document.getElementById("stamina-bar");I.style.width=`${a/15*100}%`,I.style.backgroundColor=a===15?"#da7a79":"#f79513"},100)}function y(e){return!e||e.length===0?"":`--pokemon-bg: ${e.length===1?e[0]:`linear-gradient(135deg, ${e[0]} 30%, ${e[1]} 70%)`};`}const g=localStorage.getItem("liteMode")==="enabled";async function o(e){l.innerHTML=`
            <button id="modal-close-btn">&times;</button>
            <div style="padding: 40px; text-align: center;">
                <div class="loading-spinner"></div>
                <p>Loading player profile...</p>
            </div>
        `,d.classList.remove("hidden"),document.body.classList.add("modal-open"),document.getElementById("modal-close-btn").onclick=()=>{d.classList.add("hidden"),document.body.classList.remove("modal-open")};try{const t=await fetch(`/api/player-detail/${e}`);if(!t.ok)throw new Error("Could not fetch player details.");const s=await t.json();l.innerHTML=`
                <button id="modal-close-btn">&times;</button>
                <h2>${renderPlayerBadge({userId:s.userId,publicId:s.publicId})}</h2>
                <div class="grid-stats">
                    <div><span>Total XP</span><strong>${s.totalXp.toLocaleString()}</strong></div>
                    <div><span>Pokémon Caught</span><strong>${s.pokemonCaught.toLocaleString()}</strong></div>
                    <div><span>Distance Walked</span><strong>${s.kmWalked.toFixed(1)} km</strong></div>
                    <div><span>PokéStops Visited</span><strong>${s.pokestopsVisited.toLocaleString()}</strong></div>
                </div>
                
                <h3>Highlights</h3>
                <div id="modal-pokemon-container">
                    ${s.highlights.map(a=>`<div class="${a.typeColors.length>0?"pokemon-card colored":"pokemon-card"}" style="${y(a.typeColors)}">
                                    <img src="${a.sprite}" alt="${a.name}" loading="lazy">
                                    <p class="pokemon-name">
                                        ${g?`<span class="lite-name-span" style="${y(a.typeColors)}">${a.name}</span>`:a.name}
                                    </p>
                                    <p class="pokemon-cp">CP ${a.cp}</p>
                                </div>`).join("")}
                </div>
            `,document.getElementById("modal-close-btn").onclick=()=>d.classList.add("hidden")}catch(t){console.error("Failed to open player modal:",t),l.innerHTML=`
                <button id="modal-close-btn">&times;</button>
                <p style="padding: 20px; color: #e74c3c;">Error: ${t.message}</p>
            `,document.getElementById("modal-close-btn").onclick=()=>d.classList.add("hidden")}}function u(){l.innerHTML=`
            <button id="modal-close-btn">&times;</button>
            <h4>Rarity Calculation</h4>
            <p>Rarity is calculated by multiplying the odds of a Pokémon's rarest traits.</p>
            <ul>
                <li><strong>Lucky Trade Odds:</strong> 1 in 20.</li>
                <li><strong>Shiny Odds:</strong> ~1 in 20 to ~1 in 500.</li>
            </ul>
            <p><strong>Perfect IV Odds depend on how it was acquired:</strong></p>
            <ul>
                <li>1 in 64 (Lucky Trade)</li>
                <li>1 in 216 (Raid/Egg/Research)</li>
                <li>1 in 1,331 (Best Friend Trade)</li>
                <li>1 in 1,728 (Weather Boost)</li>
                <li>1 in 4,096 (Wild Catch)</li>
            </ul>
        `,d.classList.remove("hidden"),document.body.classList.add("modal-open"),document.getElementById("modal-close-btn").onclick=()=>{d.classList.add("hidden"),document.body.classList.remove("modal-open")}}try{let e=function(){if(window.innerWidth>=1024)return;const n=document.querySelector(".header-content"),p=document.querySelector(".container"),B=(n?n.clientWidth:window.innerWidth)-40;document.querySelectorAll(".ranking-column, .composite-column, .events-card, .activity-card").forEach(k=>{k.style.width=`${B}px`})};var P=e;const t=await fetch("/api/rankings");if(!t.ok)throw new Error("Failed to load rankings from the server.");const s=await t.json(),i=await(await fetch("/api/check-auth-status")).json(),$=document.getElementById("main-title");i.loggedIn&&i.userId?(document.title=`Pokemon GO | #${i.userId}`,$&&($.innerHTML=`Pokémon GO Player Dashboard | ${renderPlayerBadge({userId:i.userId,publicId:i.publicId})}`)):(document.title="Pokemon GO | Dashboard",$&&($.textContent="Pokémon GO Player Dashboard"));const w=document.getElementById("recent-players-body");w.innerHTML=s.recentPlayers.map(n=>`
            <tr class="clickable-row" data-player-id="${n.publicId}">
                <td>${renderPlayerBadge(n)}</td>
                <td>
                    ${n.buddy?`
                        <img src="${n.buddy.sprite}" alt="${n.buddy.name}" title="${n.buddy.name}">
                        ${g?`<span class="pokemon-name-lite" style="${y(n.buddy.typeColors)}">${n.buddy.name}</span>`:""}
                    `:"N/A"}
                </td>
                <td class="hide-on-mobile">${n.kmWalked} km</td>
                <td class="hide-on-mobile">${n.pokemonCaught.toLocaleString()}</td>
            </tr>
        `).join("");const E=document.getElementById("strongest-pokemon-body"),I=s.strongestPokemon;E.innerHTML=I.map((n,p)=>`
            <tr class="clickable-pokemon-row" data-index="${p}">
                <td>${p+1}</td>
                <td class="pokemon-cell">
                    <img src="${n.sprite}" alt="${n.name}">
                    ${g?`<span class="pokemon-name-lite" style="${y(n.typeColors)}">${n.name}</span>`:""}
                </td>
                <td><strong>${n.cp.toLocaleString()}</strong></td>
                <td class="hide-on-mobile">${renderPlayerBadge({userId:n.userId,publicId:n.ownerPublicId})}</td>
            </tr>
        `).join("");const D=document.getElementById("rarest-pokemon-body"),C=s.rarestPokemon;D.innerHTML=C.map((n,p)=>`
            <tr class="clickable-rarity-row" data-index="${p}">
                <td><strong>${p+1}</strong></td>
                <td class="pokemon-cell">
                    <img src="${n.sprite}" alt="${n.name}">
                    ${g?`<span class="pokemon-name-lite" style="${y(n.typeColors)}">${n.name}</span>`:""}
                </td>
                <td class="badges-cell">
                    ${c(n)}
                </td>
                <td class="hide-on-mobile">${renderPlayerBadge({userId:n.userId,publicId:n.ownerPublicId})}</td>
            </tr>
        `).join(""),document.getElementById("rankings-grid").addEventListener("click",n=>{const p=n.target.closest(".clickable-row");if(p){const f=p.dataset.playerId;f&&o(f);return}const S=n.target.closest(".clickable-pokemon-row");if(S){const f=S.dataset.index,k=I[f];k&&m(k);return}const B=n.target.closest(".clickable-rarity-row");if(B){const f=B.dataset.index,k=C[f];k&&b(k)}}),v.classList.add("hidden"),L.classList.remove("hidden");const M=document.querySelector(".info-btn");M&&M.addEventListener("click",n=>{n.stopPropagation(),u()}),window.addEventListener("resize",e),setTimeout(e,100),setTimeout(e,500)}catch(e){console.error("Failed to initialize public dashboard:",e),v.innerHTML="<p>Could not load ranking data. Please try again later.</p>",document.title="Pokemon GO | Dashboard"}d.addEventListener("click",e=>{e.target===d&&(d.classList.add("hidden"),document.body.classList.remove("modal-open"))})});async function T(){const v=document.getElementById("events-container"),L="https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json",d={"community-day":"#1660a9","raid-day":"#e74c3c","raid-battles":"#c0392b",event:"#27ae60","raid-hour":"#c0392b",research:"#1abc9c","timed-research":"#1abc9c","limited-research":"#159e83","live-event":"#d63031","pokemon-go-fest":"#153d94","research-breakthrough":"#795548","special-research":"#13a185","global-challenge":"#0a64b5","go-rocket-takeover":"#1e1e1e","team-go-rocket":"#1e1e1e","giovanni-special-research":"#1e272e","safari-zone":"#3d7141","ticketed-event":"#de3e9b","go-battle-league":"#8e44ad","pokemon-spotlight-hour":"#e58e26","bonus-hour":"#40407a",update:"#2980b9","raid-weekend":"#6f1e51","potential-ultra-unlock":"#2c3e50","location-specific":"#284b92",season:"#38ada9","elite-raids":"#a21416","pokemon-go-tour":"#1d3a74","pokestop-showcase":"#ff9f43",default:"#bdc3c7"};function l(r){const h=Date.parse(r)-Date.parse(new Date);if(h<=0)return null;const b=Math.floor(h/(1e3*60*60*24)),c=Math.floor(h/(1e3*60*60)%24),m=Math.floor(h/1e3/60%60);return b>0?`${b}d ${c}h`:c>0?`${c}h ${m}m`:`${m}m`}try{const r=await fetch(L);if(!r.ok)throw new Error("Failed to fetch events");const h=await r.json(),b=new Date,c=[],m=[];if(h.forEach(o=>{const u=new Date(o.start),P=new Date(o.end);b>=u&&b<=P?c.push(o):b<u&&m.push(o)}),m.sort((o,u)=>new Date(o.start)-new Date(u.start)),c.sort((o,u)=>new Date(o.end)-new Date(u.end)),c.length===0&&m.length===0){v.innerHTML='<p class="no-events">No active or upcoming events found.</p>';return}const y=(o,u)=>{const P=new Date(o.start),e=new Date(o.end),t=u?"Starts in":"Ends in",s=l(u?o.start:o.end);return`
                <div class="event-item">
                    <div class="event-dot" style="background-color: ${d[o.eventType]||d.default}"></div>
                    <div class="event-info">
                        <span class="event-name" title="${o.name}">${o.name}</span>
                        <span class="event-timer">${t} ${s}</span>
                    </div>
                </div>
            `};let g="";c.length>0&&(g+='<h3 class="events-section-header">Ongoing</h3>',g+=c.map(o=>y(o,!1)).join("")),m.length>0&&(g+='<h3 class="events-section-header">Upcoming</h3>',g+=m.map(o=>y(o,!0)).join("")),v.innerHTML=g}catch(r){console.error("Error loading events:",r),v.innerHTML='<p class="error-message">Error loading events.</p>'}}document.addEventListener("DOMContentLoaded",T);setInterval(T,300*1e3);document.addEventListener("DOMContentLoaded",()=>{document.getElementById("rankings-grid").addEventListener("click",L=>{const d=L.target,l=d.closest(".ranking-column");if(!l)return;const r=l.querySelector(".table-container");d.classList.contains("show-more-btn")&&(l.classList.add("expanded"),r&&r.classList.add("expanded")),d.classList.contains("show-less-btn")&&(l.classList.remove("expanded"),r&&r.classList.remove("expanded"))})});
