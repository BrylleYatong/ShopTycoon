(() => {
  'use strict';
  const KEY = 'kevin-cookie-tycoon-v1';
  const money = n => n.toLocaleString('en-US', {style:'currency',currency:'USD'});
  const cents = n => Math.round(n * 100) / 100;
  const $ = id => document.getElementById(id);
  const markets = [
    {name:'A sunny stroll',text:'Neighbors are out and about. A lovely day for a cookie.',factor:1.12},
    {name:'Rain on Main Street',text:'Foot traffic is quieter today. Plan your batch carefully.',factor:.8},
    {name:'The afternoon rush',text:'The neighborhood is hungry for an afternoon treat.',factor:1.25},
    {name:'An ordinary sweet day',text:'Steady foot traffic. A good day to find your sweet spot.',factor:1}
  ];
  const varieties = {
    chocolateChip: {name:'Chocolate chip', cost:.50, price:1.50, description:'The neighborhood classic. A balanced everyday batch.'},
    oatmealRaisin: {name:'Oatmeal raisin', cost:.35, price:1.10, description:'A budget-friendly bake with a comforting cinnamon finish.'},
    doubleChocolate: {name:'Double chocolate', cost:.75, price:2.20, description:'Rich cocoa and chocolate chunks for a premium treat.'},
    macadamia: {name:'White chocolate macadamia', cost:1, price:2.80, description:'Our most luxurious recipe, with a higher ingredient cost.'}
  };
  const recipeFor = id => varieties[id] || varieties.chocolateChip;
  let state;
  function fresh(){return {cash:100,history:[],variety:'chocolateChip',market:Math.floor(Math.random()*markets.length)};}
  try { const saved = JSON.parse(localStorage.getItem(KEY)); state = saved && Number.isFinite(saved.cash) && saved.cash >= 0 && Array.isArray(saved.history) && saved.history.length <= 30 && Number.isInteger(saved.market) && markets[saved.market] ? saved : fresh(); } catch { state = fresh(); }
  state.variety = varieties[state.variety] ? state.variety : 'chocolateChip';
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{$('badge').textContent='Saving unavailable';}}
  function finished(){return state.history.length >= 30 || state.cash < 5;}
  function estimate(){
    const q = $('quantity').valueAsNumber, p = $('price').valueAsNumber, ad = $('advertising').valueAsNumber;
    const valid = Number.isInteger(q) && q >= 0 && q <= 1000000 && Number.isFinite(p) && p >= .25 && p <= 100 && Number.isFinite(ad) && ad >= 0 && ad <= 1000000;
    const recipe = recipeFor(state.variety);
    const cost = cents(q*recipe.cost+ad+5);
    $('cost').textContent = Number.isFinite(cost) ? money(cost) : '—';
    $('error').textContent = !valid ? 'Enter a whole cookie count and valid, nonnegative budgets.' : cost > state.cash ? 'This plan costs more than your available cash. Try a smaller batch or fewer ads.' : '';
    $('open').disabled = !valid || cost > state.cash || finished();
    return {q,p,ad,cost,valid,recipe};
  }
  function customerScene(sold, animate){
    // Group large sales into at most 24 visitors so the scene stays lightweight.
    const count = Math.min(sold, 24);
    const people = ['🧑', '👩', '👨', '👩‍🦱', '🧑‍🦰', '👨‍🦱'];
    const visitors = Array.from({length:count}, (_,i) => {
      const cookies = Math.floor(sold/count) + (i < sold%count ? 1 : 0);
      return `<div class="customer" style="--delay:${(i*.18).toFixed(2)}s;--lane:${i%3};--shirt:${['#b96f4b','#628675','#8175a0','#c29b49'][i%4]}"><span class="customer-person">${people[i%people.length]}<span class="customer-shirt"></span></span><span class="customer-purchase">🍪<b>${cookies>1?'×'+cookies:''}</b></span></div>`;
    }).join('');
    return `<section class="customer-scene ${animate && sold>0?'is-playing':''}" aria-label="${sold} cookies sold${count?`, represented by ${count} animated customers`:''}"><div class="scene-sun" aria-hidden="true">☀</div><div class="mini-shop" aria-hidden="true"><div class="shop-sign">KEVIN’S COOKIES</div><div class="shop-awning"></div><div class="shop-window">🍪 🍪 🍪</div><div class="shop-door"></div></div><div class="customer-path" aria-hidden="true">${visitors}</div><p class="scene-caption">${sold ? `${sold} cookies sold · ${count} happy ${count===1?'visitor':'visitors'}${sold>count?' (each carries a few cookies)':''}` : 'A quiet day — no cookies sold.'}</p></section>`;
  }
  function showResult(r, animate){
    $('result-title').textContent = `Day ${r.day}, all wrapped up.`;
    $('result').innerHTML = customerScene(r.sold, animate) + `<div class="profit-highlight"><h3 class="profit-label">Daily profit</h3><div class="result-hero ${r.profit>=0?'positive':'negative'}">${r.profit>=0?'+':''}${money(r.profit)}</div><div class="profit-explanation">Revenue minus all daily expenses</div></div>` +
    [['Cookie variety',recipeFor(r.variety).name],['Cookies sold',`${r.sold} <small>/ ${r.baked} baked</small>`],['Revenue',money(r.revenue)],['Expenses',money(r.expenses)],['Remaining cash',money(r.cash)]].map(([k,v])=>`<div class="result-row"><span>${k}</span><strong>${v}</strong></div>`).join('') + `<div class="note">${r.baked-r.sold} unsold cookies expired. Expenses include ${money(r.baked*(Number.isFinite(r.unitCost)?r.unitCost:.5))} ingredients, ${money(r.ad)} advertising, and $5.00 overhead.<br>${r.sold===r.baked && r.baked>0?'Sold out! You may have room for a bigger batch.':'Try adjusting your price, batch size, or advertising tomorrow.'}</div>`;
  }
  function render(animate = false){
    $('cash').textContent=money(state.cash);
    $('day').innerHTML=`${finished()?'Completed':`Day ${state.history.length+1}`} <small>/ 30</small>`;
    $('profit').textContent=money(cents(state.cash-100));
    $('market').textContent=`${markets[state.market].name} · ${markets[state.market].text}`;
    $('journal-count').textContent=`${state.history.length} days in the books`;
    if(state.history.length){showResult(state.history[state.history.length-1], animate);$('history').innerHTML=state.history.slice().reverse().map(r=>`<tr><td>${r.day}</td><td>${recipeFor(r.variety).name}</td><td>${r.baked} / ${r.sold}</td><td>${money(r.price)}</td><td>${money(r.revenue)}</td><td>${money(r.expenses)}</td><td class="${r.profit>=0?'positive':'negative'}">${money(r.profit)}</td><td>${money(r.cash)}</td></tr>`).join('');}
    $('plan').hidden=finished();$('ending').hidden=!finished();
    if(finished()){
      $('badge').textContent='Shop closed';$('plan-title').textContent=state.history.length>=30?'Thirty days. One sweet story.':'Time for a fresh batch.';
      $('ending').innerHTML=`<p>${state.history.length>=30?'Your 30-day challenge is complete!':'Your cash fell below the $5 needed to open another day.'} You finished with <strong>${money(state.cash)}</strong> and a total ${state.cash>=100?'profit':'loss'} of <strong>${money(Math.abs(cents(state.cash-100)))}</strong>.</p><p>You sold ${state.history.reduce((n,r)=>n+r.sold,0)} cookies across ${state.history.length} days. Start a new game to try another strategy.</p>`;
    }
    estimate();
  }
  function showRecipe(resetPrice){
    const recipe = recipeFor(state.variety);
    $('variety').value = state.variety;
    $('ingredient-cost').textContent = `${money(recipe.cost)} each`;
    $('recipe-description').textContent = `${recipe.description} Suggested price: ${money(recipe.price)}.`;
    if(resetPrice) $('price').value = recipe.price.toFixed(2);
  }
  $('variety').addEventListener('change',()=>{
    if(!varieties[$('variety').value]) return;
    state.variety = $('variety').value; showRecipe(true); save(); estimate();
  });
  $('plan').addEventListener('input',estimate);
  $('plan').addEventListener('submit',e=>{
    e.preventDefault();const {q,p,ad,cost,valid,recipe}=estimate();if(!valid || cost>state.cash || finished())return;
    // Price elasticity and diminishing advertising returns create a strategic tradeoff.
    const demand=Math.max(0,Math.round(85*markets[state.market].factor*Math.pow(recipe.price/p,1.35)*(1+Math.log1p(ad/10)*.55)*(.9+Math.random()*.2)));
    const sold=Math.min(q,demand),revenue=cents(sold*p),profit=cents(revenue-cost);
    state.cash=cents(state.cash+profit);
    state.history.push({day:state.history.length+1,baked:q,sold,variety:state.variety,unitCost:recipe.cost,price:p,ad,revenue,expenses:cost,profit,cash:state.cash});
    state.market=Math.floor(Math.random()*markets.length);save();render(true);
  });
  $('restart').addEventListener('click',()=>{if(state.history.length && !confirm('Start over with $100? Your current shop journal will be cleared.'))return;state=fresh();save();location.reload();});
  showRecipe(true);
  render();
})();
