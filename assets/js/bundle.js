(()=>{function k(){let n=document.getElementById("form"),s=new URLSearchParams(window.location.search).has("elementor-preview");function e(){var a,r;return(a=n==null?void 0:n.querySelector(".elementor-field-group-package"))!=null&&a.classList.contains("elementor-hidden")?(r=n==null?void 0:n.querySelector(".elementor-field-group-addons"))!=null&&r.classList.contains("elementor-hidden")?3:2:1}function t(){let r=e()===1?document.querySelector(".js-step1-only")||n:n||document.getElementById("package_quote_form");if(!r)return;let i=document.getElementById("header_menu_section")||document.querySelector(".elementor-sticky--active, .elementor-sticky"),d=i?i.offsetHeight:0,g=window.scrollY+r.getBoundingClientRect().top-d-16;if(Math.abs(window.scrollY-g)<10)return;let y=window.matchMedia("(prefers-reduced-motion: reduce)").matches;window.scrollTo({top:Math.max(0,Math.round(g)),behavior:y?"auto":"smooth"})}let o=null;function l(){o&&cancelAnimationFrame(o),o=requestAnimationFrame(()=>{o=requestAnimationFrame(()=>{var i,d,f;o=null;let a=(f=(d=(i=Alpine.store("quote"))==null?void 0:i.selectedPackage)==null?void 0:d.addons)!=null?f:[],r=document.querySelector(".elementor-field-group-addons:not(.elementor-hidden)");a.length===0&&r||t()})})}if(window.HHQuoteNav=(function(){function a(){return n==null?void 0:n.querySelector(".e-form__step:not(.elementor-hidden)")}function r(){var i,d;(d=(i=a())==null?void 0:i.querySelector(".e-form__buttons__wrapper__button-next"))==null||d.click()}return{scrollToForm:l,afterPackageSelect(i){s||(r(),i===0&&r())}}})(),s)return;n==null||n.addEventListener("click",a=>{var d,f,g;if(a.target.closest(".e-form__buttons__wrapper__button-next")&&!((d=n==null?void 0:n.querySelector(".elementor-field-group-package"))!=null&&d.classList.contains("elementor-hidden"))&&!((f=Alpine.store("quote"))!=null&&f.selectedPackage)){a.preventDefault(),a.stopImmediatePropagation(),(g=document.getElementById("cards-container"))==null||g.scrollIntoView({behavior:"smooth",block:"start"});return}let i=a.target.closest(".e-form__buttons__wrapper__button-previous");i&&requestAnimationFrame(()=>{var h,v,b;let y=(b=(v=(h=Alpine.store("quote"))==null?void 0:h.selectedPackage)==null?void 0:v.addons)!=null?b:[],_=document.querySelector(".elementor-field-group-addons:not(.elementor-hidden)");y.length===0&&_&&i.click()})},{capture:!0});function m(){var r;let a=!((r=n==null?void 0:n.querySelector(".elementor-field-group-package"))!=null&&r.classList.contains("elementor-hidden"));document.querySelectorAll(".js-step1-only").forEach(i=>{i.style.display=a?"":"none"})}let p=e();function u(){m();let a=e();a!==p&&(p=a,l())}let c=document.querySelector(".elementor-form-fields-wrapper");c&&new MutationObserver(u).observe(c,{attributes:!0,attributeFilter:["class"],subtree:!0}),m()}function q(){document.addEventListener("alpine:init",()=>{Alpine.store("quote",{packages:[],coverageChoices:{},styleChoices:{},availableCoverage:[],styleToCoverages:{},_coverage:null,get coverage(){return this._coverage},set coverage(e){var t;if(this._coverage!==e&&(this._coverage=e,e&&this.style&&!((t=this.styleToCoverages[this.style])!=null&&t.includes(e)))){let o=Object.keys(this.styleToCoverages).find(l=>{var m;return(m=this.styleToCoverages[l])==null?void 0:m.includes(e)});this.style=o!=null?o:null}},style:null,selectedPackage:null,addonState:{},get availableCoverageList(){return this.availableCoverage.map(e=>({slug:e,label:this.coverageChoices[e]}))},get styleList(){return Object.keys(this.styleToCoverages).map(e=>({slug:e,label:this.styleChoices[e],isValid:this.coverage?this.styleToCoverages[e].includes(this.coverage):!1}))},get coverageLabel(){return this.coverageChoices[this.coverage]||""},get styleLabel(){return this.styleChoices[this.style]||""},get visiblePackages(){return!this.coverage||!this.style?[]:this.packages.filter(e=>e.coverage===this.coverage&&e.style===this.style)},get total(){if(!this.selectedPackage)return 0;let e=this.selectedPackage.price;for(let t of this.selectedPackage.addons){let o=this.addonState[t.id];if(!(o!=null&&o.checked))continue;let l=t.type==="quantity"?Number(o.qty||0):1;t.type==="quantity"&&!l||(e+=t.price*l)}return Math.round(e*100)/100},get addonSummaryLines(){return this.selectedPackage?this.selectedPackage.addons.filter(e=>{var t;return(t=this.addonState[e.id])==null?void 0:t.checked}).map(e=>{let t=e.type==="quantity"?Number(this.addonState[e.id].qty||0):1;if(e.type==="quantity"&&!t)return null;let o=Math.round(e.price*t*100)/100,l=e.type==="quantity"?`${t}x `:"";return{id:e.id,text:`${l}${e.label} + $${this.formatNumber(o)}`}}).filter(Boolean):[]},get hasSelectedAddons(){return this.addonSummaryLines.length>0},formatNumber(e){return Number(e||0).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:2})},clearSelection(){this.selectedPackage=null,this.addonState={}},selectPackage(e){this.selectedPackage=e,this.addonState=Object.fromEntries(e.addons.map(t=>[t.id,{checked:!1,qty:null}])),Alpine.nextTick(()=>window.HHQuoteNav.afterPackageSelect(e.addons.length))}});function n(e){var o;let t=Alpine.store("quote");t.packages=e.packages,t.coverageChoices=e.coverageChoices,t.styleChoices=e.styleChoices,t.availableCoverage=e.availableCoverage,t.styleToCoverages=e.styleToCoverages,t.coverage=e.defaultCoverage,t.style=(o=e.defaultStyle)!=null?o:null}function s(){let e=document.getElementById("hh-quote-data");if(!e)return!1;let t;try{t=JSON.parse(e.textContent)}catch(o){return console.error("[HH Quote Builder] Failed to parse quote data:",o),!0}return n(t),!0}if(!s()){let e=new MutationObserver(()=>{s()&&e.disconnect()});e.observe(document.documentElement,{childList:!0,subtree:!0})}Alpine.effect(()=>{let e=Alpine.store("quote");if(e.style&&!e.styleList.find(t=>t.slug===e.style&&t.isValid)){let t=e.styleList.find(o=>o.isValid);e.style=t?t.slug:null}}),Alpine.effect(()=>{let e=Alpine.store("quote");e.selectedPackage&&(e.selectedPackage.coverage!==e.coverage||e.selectedPackage.style!==e.style)&&e.clearSelection()})})}function x(){let n={selected_coverage:()=>Alpine.store("quote").coverageLabel||"",selected_style:()=>Alpine.store("quote").styleLabel||"",package_name:()=>{var s;return((s=Alpine.store("quote").selectedPackage)==null?void 0:s.label)||""},base_price:()=>{var e;let s=(e=Alpine.store("quote").selectedPackage)==null?void 0:e.price;return s!=null?Alpine.store("quote").formatNumber(s):""},estimated_total:()=>Alpine.store("quote").selectedPackage?Alpine.store("quote").formatNumber(Alpine.store("quote").total):"",selected_addons_summary:()=>{let s=Alpine.store("quote").addonSummaryLines.map(e=>e.text);return s.length>0?s.join(" \u2022 "):"None selected"}};document.addEventListener("alpine:init",()=>{Alpine.effect(()=>{for(let[s,e]of Object.entries(n)){let t=document.querySelector(`input[name="form_fields[${s}]"]`);t&&(t.value=e())}}),setTimeout(()=>{for(let s of Object.keys(n))document.querySelector(`input[name="form_fields[${s}]"]`)||console.warn(`[HH Quote Builder] Missing Elementor hidden field: form_fields[${s}]. Quote submissions will be incomplete until this field exists in the form.`)},4e3)})}function S(){let n=new URLSearchParams(window.location.search).has("elementor-preview");function s(){let e=document.getElementById("cards-container");e&&!e.hasChildNodes()&&(e.innerHTML=`
            <div id="cards" x-data>
                <template x-for="(pkg, index) in $store.quote.visiblePackages" :key="pkg.coverage + pkg.style + pkg.label">
                    <div class="package-card" :style="{ '--card-index': index }">
                        <h3 class="package-card__title" x-text="pkg.label"></h3>
                        <p class="package-card__price">$<span x-text="$store.quote.formatNumber(pkg.price)" class="price-amount"></span> <span class="price-suffix">+ GST</span></p>
                        <p class="package-card__description" x-text="pkg.description"></p>
                        <button type="button" class="package-card__select" @click="$store.quote.selectPackage(pkg)">Select this package</button>
                        <div class="package-card__divider" aria-hidden="true"></div>
                        <ul class="package-card__features">
                            <template x-for="feature in pkg.features" :key="feature">
                                <li x-text="feature"></li>
                            </template>
                        </ul>
                    </div>
                </template>
                <p class="placeholder" x-show="!$store.quote.coverage || !$store.quote.style">
                    Select a coverage and style above to see packages.
                </p>
            </div>
        `,Alpine.initTree(e));let t=document.getElementById("addons-container");t&&!t.hasChildNodes()&&(t.innerHTML=`
            <div id="addons" x-data>
                <p class="addons-selected-package" x-text="$store.quote.selectedPackage?.label"></p>
                <h3>Select optional add-ons</h3>
                <template x-for="addon in $store.quote.selectedPackage?.addons ?? []" :key="addon.id">
                    <div class="addon-row" :class="{ 'addon-row--quantity': addon.type === 'quantity' }">
                        <label>
                            <input type="checkbox" x-model="$store.quote.addonState[addon.id].checked">
                            <span x-text="\`\${addon.label} ($\${$store.quote.formatNumber(addon.price)} + GST\${addon.unit ? ' ' + addon.unit : ''})\`"></span>
                        </label>
                        <div class="addon-row__qty" x-show="addon.type === 'quantity' && $store.quote.addonState[addon.id].checked">
                            <label>How many musicians would you like to add?</label>
                            <select x-model="$store.quote.addonState[addon.id].qty">
                                <option value="">Select number</option>
                                <template x-for="n in addon.max" :key="n">
                                    <option :value="n" x-text="n"></option>
                                </template>
                            </select>
                        </div>
                    </div>
                </template>
                <div class="total-box">
                    <div>Estimated total:</div>
                    <div class="amount"><span x-text="'$' + $store.quote.formatNumber($store.quote.total)"></span> <span>+ GST</span></div>
                </div>
            </div>
        `,Alpine.initTree(t));let o=document.getElementById("selection-summary-container");o&&!o.hasChildNodes()&&(o.innerHTML=`
                <div id="selection-summary" x-data>
                    <div class="selection-summary__left">
                        <h3>Selection summary</h3>
                        <ul class="summary-list">
                            <li><span x-text="\`\${$store.quote.coverageLabel} + \${$store.quote.styleLabel}\`"></span></li>
                            <li><span x-text="$store.quote.selectedPackage?.label" class="package-label"></span></li>
                        </ul>
                        <template x-if="$store.quote.hasSelectedAddons">
                            <div class="selection-summary__addons">
                                <p class="summary-subtitle">Optional Add-ons</p>
                                <ul class="summary-list">
                                    <template x-for="line in $store.quote.addonSummaryLines" :key="line.id">
                                        <li><span x-text="line.text"></span></li>
                                    </template>
                                </ul>
                            </div>
                        </template>
                    </div>
                    <div class="selection-summary__total">
                        <div>Approximate total</div>
                        <div class="amount"><span x-text="'$' + $store.quote.formatNumber($store.quote.total)"></span> <span>+ GST</span></div>
                    </div>
                </div>
            `,Alpine.initTree(o))}document.addEventListener("alpine:initialized",()=>{s();let e=null,t=p=>p.map(u=>`${u.coverage}|${u.style}|${u.label}`).join(",");if(Alpine.effect(()=>{var r,i;let p=(i=(r=Alpine.store("quote"))==null?void 0:r.visiblePackages)!=null?i:[],u=t(p);if(u===e)return;e=u;let c=document.getElementById("cards-container");if(!c||!c.hasChildNodes())return;let a=c.offsetHeight;a>0&&(c.style.minHeight=`${a}px`),c.innerHTML="",s(),c.classList.remove("cards--entering"),c.offsetWidth,c.classList.add("cards--entering"),requestAnimationFrame(()=>{c.style.minHeight=""})}),!n)return;let o=!1,l=!1;new MutationObserver(()=>{l||o||(o=!0,requestAnimationFrame(()=>{o=!1,l=!0;try{s()}finally{l=!1}}))}).observe(document.documentElement,{childList:!0,subtree:!0})})}var $={nav:k,store:q,bridge:x,inject:S};for(let[n,s]of Object.entries($))try{s()}catch(e){console.error(`[HH Quote Builder] Section "${n}" failed:`,e)}})();
