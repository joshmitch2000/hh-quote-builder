(()=>{function c(){let o=document.getElementById("form");window.HHQuoteNav=(function(){function t(){return o==null?void 0:o.querySelector(".e-form__step:not(.elementor-hidden)")}function s(){var n;(n=document.getElementById("package_quote_form"))==null||n.scrollIntoView({block:"center",behavior:"smooth"})}function i(){var n,l;(l=(n=t())==null?void 0:n.querySelector(".e-form__buttons__wrapper__button-next"))==null||l.click(),s()}return{afterPackageSelect(n){i(),n===0&&i()}}})(),o==null||o.addEventListener("click",t=>{let s=t.target.closest(".e-form__buttons__wrapper__button-previous");s&&requestAnimationFrame(()=>{var l,r,d;let i=(d=(r=(l=Alpine.store("quote"))==null?void 0:l.selectedPackage)==null?void 0:r.addons)!=null?d:[],n=document.querySelector(".elementor-field-group-addons:not(.elementor-hidden)");i.length===0&&n&&s.click()})});function a(){var s;let t=!((s=o==null?void 0:o.querySelector(".elementor-field-group-package"))!=null&&s.classList.contains("elementor-hidden"));document.querySelectorAll(".js-step1-only").forEach(i=>{i.style.display=t?"":"none"})}let e=document.querySelector(".elementor-form-fields-wrapper");e&&new MutationObserver(a).observe(e,{attributes:!0,attributeFilter:["class"],subtree:!0}),a()}function u(){document.addEventListener("alpine:init",()=>{let o=document.getElementById("hh-quote-data");if(!o){console.error("[HH Quote Builder] #hh-quote-data payload not found.");return}let a;try{a=JSON.parse(o.textContent)}catch(e){console.error("[HH Quote Builder] Failed to parse quote data:",e);return}Alpine.store("quote",{packages:a.packages,coverageChoices:a.coverageChoices,styleChoices:a.styleChoices,availableCoverage:a.availableCoverage,styleToCoverages:a.styleToCoverages,coverage:a.defaultCoverage,style:null,selectedPackage:null,addonState:{},get availableCoverageList(){return this.availableCoverage.map(e=>({slug:e,label:this.coverageChoices[e]}))},get styleList(){return Object.keys(this.styleToCoverages).map(e=>({slug:e,label:this.styleChoices[e],isValid:this.coverage?this.styleToCoverages[e].includes(this.coverage):!1}))},get coverageLabel(){return this.coverageChoices[this.coverage]||""},get styleLabel(){return this.styleChoices[this.style]||""},get visiblePackages(){return!this.coverage||!this.style?[]:this.packages.filter(e=>e.coverage===this.coverage&&e.style===this.style)},get total(){if(!this.selectedPackage)return 0;let e=this.selectedPackage.price;for(let t of this.selectedPackage.addons){let s=this.addonState[t.id];if(!(s!=null&&s.checked))continue;let i=t.type==="quantity"?Number(s.qty||0):1;t.type==="quantity"&&!i||(e+=t.price*i)}return e},get addonSummaryLines(){return this.selectedPackage?this.selectedPackage.addons.filter(e=>{var t;return(t=this.addonState[e.id])==null?void 0:t.checked}).map(e=>{let t=e.type==="quantity"?Number(this.addonState[e.id].qty||0):1;return e.type==="quantity"&&!t?null:{id:e.id,text:`${t>1?t+" ":""}${e.label} + $${this.formatNumber(e.price*t)}`}}).filter(Boolean):[]},get hasSelectedAddons(){return this.addonSummaryLines.length>0},formatNumber(e){return Number(e||0).toLocaleString("en-US")},selectPackage(e){this.selectedPackage=e,this.addonState=Object.fromEntries(e.addons.map(t=>[t.id,{checked:!1,qty:null}])),Alpine.nextTick(()=>window.HHQuoteNav.afterPackageSelect(e.addons.length))}}),Alpine.effect(()=>{let e=Alpine.store("quote");e.style&&!e.styleList.find(t=>t.slug===e.style&&t.isValid)&&(e.style=null)})})}function p(){let o={selected_coverage:()=>Alpine.store("quote").coverage||"",selected_style:()=>Alpine.store("quote").style||"",package_name:()=>{var a;return((a=Alpine.store("quote").selectedPackage)==null?void 0:a.label)||""},base_price:()=>{var a,e;return(e=(a=Alpine.store("quote").selectedPackage)==null?void 0:a.price)!=null?e:""},estimated_total:()=>Alpine.store("quote").selectedPackage?Alpine.store("quote").total:"",selected_addons_summary:()=>Alpine.store("quote").addonSummaryLines.map(a=>a.text).join(", ")};document.addEventListener("alpine:init",()=>{for(let a of Object.keys(o))document.querySelector(`input[name="form_fields[${a}]"]`)||console.warn(`[HH Quote Builder] Missing Elementor hidden field: form_fields[${a}]. Quote submissions will be incomplete until this field exists in the form.`);Alpine.effect(()=>{for(let[a,e]of Object.entries(o)){let t=document.querySelector(`input[name="form_fields[${a}]"]`);t&&(t.value=e())}})})}function m(){let o=!1;document.addEventListener("alpine:initialized",()=>{if(o)return;o=!0;let a=document.getElementById("cards");a&&(a.innerHTML=`
            <div id="cards" x-data>
                <template x-for="pkg in $store.quote.visiblePackages" :key="pkg.coverage + pkg.style + pkg.label">
                    <div class="package-card">
                        <h3 class="package-card__title" x-text="pkg.label"></h3>
                        <p class="package-card__price">$<span x-text="$store.quote.formatNumber(pkg.price)"></span> <span>+ GST</span></p>
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
        `,Alpine.initTree(a));let e=document.getElementById("addons-container");e&&(e.innerHTML=`
            <div x-data>
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
        `,Alpine.initTree(e));let t=document.getElementById("selection-summary");t&&(t.innerHTML=`
                <div class="selection-summary" x-data>
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
            `,Alpine.initTree(t))})}var g={nav:c,store:u,bridge:p,inject:m};for(let[o,a]of Object.entries(g))try{a()}catch(e){console.error(`[HH Quote Builder] Section "${o}" failed:`,e)}})();
