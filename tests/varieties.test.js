const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const KEY = 'kevin-cookie-tycoon-v1';
function game(saved) {
  const elements = {};
  const get = id => elements[id] || (elements[id] = {
    value:'', textContent:'', innerHTML:'', hidden:false, disabled:false, listeners:{},
    get valueAsNumber(){return this.value === '' ? NaN : Number(this.value);},
    addEventListener(event, listener){this.listeners[event] = listener;}
  });
  get('quantity').value = '80'; get('price').value = '1.50'; get('advertising').value = '10';
  const storage = {}; if(saved) storage[KEY] = JSON.stringify(saved);
  const math = Object.create(Math); math.random = () => .5;
  vm.runInNewContext(source, {document:{getElementById:get}, Math:math,
    localStorage:{getItem:k=>storage[k] || null, setItem:(k,v)=>{storage[k]=v;}},
    confirm:()=>false, location:{reload(){}}});
  return {get, state:()=>JSON.parse(storage[KEY]),
    select(id){get('variety').value=id;get('variety').listeners.change();},
    submit(){get('plan').listeners.submit({preventDefault(){}});},
    edit(id,value){get(id).value=String(value);get('plan').listeners.input();}};
}
const recipes = [['chocolateChip',.5,1.5,'Chocolate chip'],['oatmealRaisin',.35,1.1,'Oatmeal raisin'],['doubleChocolate',.75,2.2,'Double chocolate'],['macadamia',1,2.8,'White chocolate macadamia']];
for(const [id,cost,price,name] of recipes){
  const g=game(); g.select(id);
  assert.equal(g.get('price').valueAsNumber,price);
  assert.equal(g.get('ingredient-cost').textContent,`$${cost.toFixed(2)} each`);
  g.submit(); const s=g.state(),r=s.history[0];
  assert.equal(r.variety,id);assert.equal(r.unitCost,cost);assert.equal(r.expenses,80*cost+15);
  assert.equal(r.revenue,Math.round(r.sold*price*100)/100);
  assert.equal(r.profit,Math.round((r.revenue-r.expenses)*100)/100);
  assert.equal(s.cash,Math.round((100+r.profit)*100)/100);
  assert(g.get('history').innerHTML.includes(name));assert(g.get('result').innerHTML.includes(name));
  assert(g.get('result').innerHTML.includes(`$${(80*cost).toFixed(2)} ingredients`));
  const reload=game(s);assert.equal(reload.get('variety').value,id);assert.equal(reload.get('price').valueAsNumber,price);
}
let g=game();g.select('macadamia');g.edit('quantity',100);assert(g.get('open').disabled);g.submit();assert.equal(g.state().history.length,0);
g.edit('quantity',20);g.edit('price',3.5);g.submit();assert.equal(g.state().history[0].price,3.5);
const old={cash:165,market:0,history:[{day:1,baked:80,sold:80,price:1.5,ad:10,revenue:120,expenses:55,profit:65,cash:165}]};
g=game(old);assert(g.get('history').innerHTML.includes('Chocolate chip'));assert(g.get('result').innerHTML.includes('$40.00 ingredients'));g.submit();assert.equal(g.state().history.length,2);assert.equal(g.state().history[1].variety,'chocolateChip');
g=game();g.select('oatmealRaisin');g.edit('quantity',50);for(let i=0;i<30;i++)g.submit();assert.equal(g.state().history.length,30);assert(g.get('plan').hidden);g.submit();assert.equal(g.state().history.length,30);
g=game();g.select('macadamia');g.edit('quantity',0);g.edit('advertising',95);g.submit();assert.equal(g.state().cash,0);assert(g.get('plan').hidden);
console.log('Passed recipe defaults, accounting, journal/results, persistence, legacy saves, affordability, custom price, 30-day cap, and bankruptcy.');
