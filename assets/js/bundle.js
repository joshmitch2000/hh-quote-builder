(()=>{function g(){let s=document.getElementById("form"),o=new URLSearchParams(window.location.search).has("elementor-preview");if(window.HHQuoteNav=(function(){function a(){return s==null?void 0:s.querySelector(".e-form__step:not(.elementor-hidden)")}function n(){var i;(i=document.getElementById("package_quote_form"))==null||i.scrollIntoView({block:"center",behavior:"smooth"})}function c(){var i,l;(l=(i=a())==null?void 0:i.querySelector(".e-form__buttons__wrapper__button-next"))==null||l.click(),n()}return{afterPackageSelect(i){o||(c(),i===0&&c())}}})(),o)return;s==null||s.addEventListener("click",a=>{var i,l,r;if(a.target.closest(".e-form__buttons__wrapper__button-next")&&!((i=s==null?void 0:s.querySelector(".elementor-field-group-package"))!=null&&i.classList.contains("elementor-hidden"))&&!((l=Alpine.store("quote"))!=null&&l.selectedPackage)){a.preventDefault(),a.stopImmediatePropagation(),(r=document.getElementById("cards-container"))==null||r.scrollIntoView({behavior:"smooth",block:"start"});return}let c=a.target.closest(".e-form__buttons__wrapper__button-previous");c&&requestAnimationFrame(()=>{var d,m,f;let u=(f=(m=(d=Alpine.store("quote"))==null?void 0:d.selectedPackage)==null?void 0:m.addons)!=null?f:[],p=document.querySelector(".elementor-field-group-addons:not(.elementor-hidden)");u.length===0&&p&&c.click()})},{capture:!0});function e(){var n;let a=!((n=s==null?void 0:s.querySelector(".elementor-field-group-package"))!=null&&n.classList.contains("elementor-hidden"));document.querySelectorAll(".js-step1-only").forEach(c=>{c.style.display=a?"":"none"})}let t=document.querySelector(".elementor-form-fields-wrapper");t&&new MutationObserver(e).observe(t,{attributes:!0,attributeFilter:["class"],subtree:!0}),e()}function y(){document.addEventListener("alpine:init",()=>{Alpine.store("quote",{packages:[],coverageChoices:{},styleChoices:{},availableCoverage:[],styleToCoverages:{},coverage:null,style:null,selectedPackage:null,addonState:{},get availableCoverageList(){return this.availableCoverage.map(e=>({slug:e,label:this.coverageChoices[e]}))},get styleList(){return Object.keys(this.styleToCoverages).map(e=>({slug:e,label:this.styleChoices[e],isValid:this.coverage?this.styleToCoverages[e].includes(this.coverage):!1}))},get coverageLabel(){return this.coverageChoices[this.coverage]||""},get styleLabel(){return this.styleChoices[this.style]||""},get visiblePackages(){return!this.coverage||!this.style?[]:this.packages.filter(e=>e.coverage===this.coverage&&e.style===this.style)},get total(){if(!this.selectedPackage)return 0;let e=this.selectedPackage.price;for(let t of this.selectedPackage.addons){let a=this.addonState[t.id];if(!(a!=null&&a.checked))continue;let n=t.type==="quantity"?Number(a.qty||0):1;t.type==="quantity"&&!n||(e+=t.price*n)}return Math.round(e*100)/100},get addonSummaryLines(){return this.selectedPackage?this.selectedPackage.addons.filter(e=>{var t;return(t=this.addonState[e.id])==null?void 0:t.checked}).map(e=>{let t=e.type==="quantity"?Number(this.addonState[e.id].qty||0):1;if(e.type==="quantity"&&!t)return null;let a=Math.round(e.price*t*100)/100,n=e.type==="quantity"?`${t}x `:"";return{id:e.id,text:`${n}${e.label} + $${this.formatNumber(a)}`}}).filter(Boolean):[]},get hasSelectedAddons(){return this.addonSummaryLines.length>0},formatNumber(e){return Number(e||0).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:2})},clearSelection(){this.selectedPackage=null,this.addonState={}},selectPackage(e){this.selectedPackage=e,this.addonState=Object.fromEntries(e.addons.map(t=>[t.id,{checked:!1,qty:null}])),Alpine.nextTick(()=>window.HHQuoteNav.afterPackageSelect(e.addons.length))}});function s(e){var a;let t=Alpine.store("quote");t.packages=e.packages,t.coverageChoices=e.coverageChoices,t.styleChoices=e.styleChoices,t.availableCoverage=e.availableCoverage,t.styleToCoverages=e.styleToCoverages,t.coverage=e.defaultCoverage,t.style=(a=e.defaultStyle)!=null?a:null}function o(){let e=document.getElementById("hh-quote-data");if(!e)return!1;let t;try{t=JSON.parse(e.textContent)}catch(a){return console.error("[HH Quote Builder] Failed to parse quote data:",a),!0}return s(t),!0}if(!o()){let e=new MutationObserver(()=>{o()&&e.disconnect()});e.observe(document.documentElement,{childList:!0,subtree:!0})}Alpine.effect(()=>{let e=Alpine.store("quote");if(e.style&&!e.styleList.find(t=>t.slug===e.style&&t.isValid)){let t=e.styleList.find(a=>a.isValid);e.style=t?t.slug:null}}),Alpine.effect(()=>{let e=Alpine.store("quote");e.selectedPackage&&(e.selectedPackage.coverage!==e.coverage||e.selectedPackage.style!==e.style)&&e.clearSelection()})})}function v(){let s={selected_coverage:()=>Alpine.store("quote").coverageLabel||"",selected_style:()=>Alpine.store("quote").styleLabel||"",package_name:()=>{var o;return((o=Alpine.store("quote").selectedPackage)==null?void 0:o.label)||""},base_price:()=>{var e;let o=(e=Alpine.store("quote").selectedPackage)==null?void 0:e.price;return o!=null?Alpine.store("quote").formatNumber(o):""},estimated_total:()=>Alpine.store("quote").selectedPackage?Alpine.store("quote").formatNumber(Alpine.store("quote").total):"",selected_addons_summary:()=>{let o=Alpine.store("quote").addonSummaryLines.map(e=>e.text);return o.length>0?o.join(`<br>
`):"None selected"}};document.addEventListener("alpine:init",()=>{Alpine.effect(()=>{for(let[o,e]of Object.entries(s)){let t=document.querySelector(`input[name="form_fields[${o}]"]`);t&&(t.value=e())}}),setTimeout(()=>{for(let o of Object.keys(s))document.querySelector(`input[name="form_fields[${o}]"]`)||console.warn(`[HH Quote Builder] Missing Elementor hidden field: form_fields[${o}]. Quote submissions will be incomplete until this field exists in the form.`)},4e3)})}function h(){let s=new URLSearchParams(window.location.search).has("elementor-preview");function o(){let e=document.getElementById("cards-container");e&&!e.hasChildNodes()&&(e.innerHTML=`
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
        `,Alpine.initTree(t));let a=document.getElementById("selection-summary-container");a&&!a.hasChildNodes()&&(a.innerHTML=`
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
            `,Alpine.initTree(a))}document.addEventListener("alpine:initialized",()=>{o();let e=null,t=i=>i.map(l=>`${l.coverage}|${l.style}|${l.label}`).join(",");if(Alpine.effect(()=>{var p,d;let i=(d=(p=Alpine.store("quote"))==null?void 0:p.visiblePackages)!=null?d:[],l=t(i);if(l===e)return;e=l;let r=document.getElementById("cards-container");if(!r||!r.hasChildNodes())return;let u=r.offsetHeight;r.style.minHeight=`${u}px`,r.innerHTML="",Alpine.nextTick(()=>{o(),r.classList.remove("cards--entering"),r.offsetWidth,r.classList.add("cards--entering"),requestAnimationFrame(()=>{r.style.minHeight=""})})}),!s)return;let a=!1,n=!1;new MutationObserver(()=>{n||a||(a=!0,requestAnimationFrame(()=>{a=!1,n=!0;try{o()}finally{n=!1}}))}).observe(document.documentElement,{childList:!0,subtree:!0})})}var b={nav:g,store:y,bridge:v,inject:h};for(let[s,o]of Object.entries(b))try{o()}catch(e){console.error(`[HH Quote Builder] Section "${s}" failed:`,e)}})();
