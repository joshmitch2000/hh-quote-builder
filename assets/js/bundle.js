(()=>{function u(){let s=document.getElementById("form"),a=new URLSearchParams(window.location.search).has("elementor-preview");if(window.HHQuoteNav=(function(){function o(){return s==null?void 0:s.querySelector(".e-form__step:not(.elementor-hidden)")}function n(){var i;(i=document.getElementById("package_quote_form"))==null||i.scrollIntoView({block:"center",behavior:"smooth"})}function l(){var i,r;(r=(i=o())==null?void 0:i.querySelector(".e-form__buttons__wrapper__button-next"))==null||r.click(),n()}return{afterPackageSelect(i){a||(l(),i===0&&l())}}})(),a)return;s==null||s.addEventListener("click",o=>{let n=o.target.closest(".e-form__buttons__wrapper__button-previous");n&&requestAnimationFrame(()=>{var r,c,d;let l=(d=(c=(r=Alpine.store("quote"))==null?void 0:r.selectedPackage)==null?void 0:c.addons)!=null?d:[],i=document.querySelector(".elementor-field-group-addons:not(.elementor-hidden)");l.length===0&&i&&n.click()})});function e(){var n;let o=!((n=s==null?void 0:s.querySelector(".elementor-field-group-package"))!=null&&n.classList.contains("elementor-hidden"));document.querySelectorAll(".js-step1-only").forEach(l=>{l.style.display=o?"":"none"})}let t=document.querySelector(".elementor-form-fields-wrapper");t&&new MutationObserver(e).observe(t,{attributes:!0,attributeFilter:["class"],subtree:!0}),e()}function p(){document.addEventListener("alpine:init",()=>{Alpine.store("quote",{packages:[],coverageChoices:{},styleChoices:{},availableCoverage:[],styleToCoverages:{},coverage:null,style:null,selectedPackage:null,addonState:{},get availableCoverageList(){return this.availableCoverage.map(e=>({slug:e,label:this.coverageChoices[e]}))},get styleList(){return Object.keys(this.styleToCoverages).map(e=>({slug:e,label:this.styleChoices[e],isValid:this.coverage?this.styleToCoverages[e].includes(this.coverage):!1}))},get coverageLabel(){return this.coverageChoices[this.coverage]||""},get styleLabel(){return this.styleChoices[this.style]||""},get visiblePackages(){return!this.coverage||!this.style?[]:this.packages.filter(e=>e.coverage===this.coverage&&e.style===this.style)},get total(){if(!this.selectedPackage)return 0;let e=this.selectedPackage.price;for(let t of this.selectedPackage.addons){let o=this.addonState[t.id];if(!(o!=null&&o.checked))continue;let n=t.type==="quantity"?Number(o.qty||0):1;t.type==="quantity"&&!n||(e+=t.price*n)}return e},get addonSummaryLines(){return this.selectedPackage?this.selectedPackage.addons.filter(e=>{var t;return(t=this.addonState[e.id])==null?void 0:t.checked}).map(e=>{let t=e.type==="quantity"?Number(this.addonState[e.id].qty||0):1;return e.type==="quantity"&&!t?null:{id:e.id,text:`${t>1?t+" ":""}${e.label} + $${this.formatNumber(e.price*t)}`}}).filter(Boolean):[]},get hasSelectedAddons(){return this.addonSummaryLines.length>0},formatNumber(e){return Number(e||0).toLocaleString("en-US")},selectPackage(e){this.selectedPackage=e,this.addonState=Object.fromEntries(e.addons.map(t=>[t.id,{checked:!1,qty:null}])),Alpine.nextTick(()=>window.HHQuoteNav.afterPackageSelect(e.addons.length))}});function s(e){var o;let t=Alpine.store("quote");t.packages=e.packages,t.coverageChoices=e.coverageChoices,t.styleChoices=e.styleChoices,t.availableCoverage=e.availableCoverage,t.styleToCoverages=e.styleToCoverages,t.coverage=e.defaultCoverage,t.style=(o=e.defaultStyle)!=null?o:null}function a(){let e=document.getElementById("hh-quote-data");if(!e)return!1;let t;try{t=JSON.parse(e.textContent)}catch(o){return console.error("[HH Quote Builder] Failed to parse quote data:",o),!0}return s(t),!0}if(!a()){let e=new MutationObserver(()=>{a()&&e.disconnect()});e.observe(document.documentElement,{childList:!0,subtree:!0})}Alpine.effect(()=>{let e=Alpine.store("quote");if(e.style&&!e.styleList.find(t=>t.slug===e.style&&t.isValid)){let t=e.styleList.find(o=>o.isValid);e.style=t?t.slug:null}})})}function m(){let s={selected_coverage:()=>Alpine.store("quote").coverage||"",selected_style:()=>Alpine.store("quote").style||"",package_name:()=>{var a;return((a=Alpine.store("quote").selectedPackage)==null?void 0:a.label)||""},base_price:()=>{var a,e;return(e=(a=Alpine.store("quote").selectedPackage)==null?void 0:a.price)!=null?e:""},estimated_total:()=>Alpine.store("quote").selectedPackage?Alpine.store("quote").total:"",selected_addons_summary:()=>Alpine.store("quote").addonSummaryLines.map(a=>a.text).join(", ")};document.addEventListener("alpine:init",()=>{Alpine.effect(()=>{for(let[a,e]of Object.entries(s)){let t=document.querySelector(`input[name="form_fields[${a}]"]`);t&&(t.value=e())}}),setTimeout(()=>{for(let a of Object.keys(s))document.querySelector(`input[name="form_fields[${a}]"]`)||console.warn(`[HH Quote Builder] Missing Elementor hidden field: form_fields[${a}]. Quote submissions will be incomplete until this field exists in the form.`)},4e3)})}function f(){let s=new URLSearchParams(window.location.search).has("elementor-preview");function a(){let e=document.getElementById("cards-container");e&&!e.hasChildNodes()&&(e.innerHTML=`
            <div id="cards" x-data>
                <template x-for="pkg in $store.quote.visiblePackages" :key="pkg.coverage + pkg.style + pkg.label">
                    <div class="package-card">
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
                            <li>\u2713 <span x-text="\`\${$store.quote.coverageLabel} \${$store.quote.styleLabel}\`"></span></li>
                            <li>\u2713 <span x-text="$store.quote.selectedPackage?.label"></span></li>
                        </ul>
                        <template x-if="$store.quote.hasSelectedAddons">
                            <div class="selection-summary__addons">
                                <p class="summary-subtitle">Optional Add-ons</p>
                                <ul class="summary-list">
                                    <template x-for="line in $store.quote.addonSummaryLines" :key="line.id">
                                        <li>\u2713 <span x-text="line.text"></span></li>
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
            `,Alpine.initTree(o))}document.addEventListener("alpine:initialized",()=>{if(a(),Alpine.effect(()=>{var i,r;let n=(r=(i=Alpine.store("quote"))==null?void 0:i.visiblePackages)!=null?r:[],l=document.getElementById("cards-container");l&&l.hasChildNodes()&&(l.innerHTML="",Alpine.nextTick(()=>a()))}),!s)return;let e=!1,t=!1;new MutationObserver(()=>{t||e||(e=!0,requestAnimationFrame(()=>{e=!1,t=!0;try{a()}finally{t=!1}}))}).observe(document.documentElement,{childList:!0,subtree:!0})})}var g={nav:u,store:p,bridge:m,inject:f};for(let[s,a]of Object.entries(g))try{a()}catch(e){console.error(`[HH Quote Builder] Section "${s}" failed:`,e)}})();
