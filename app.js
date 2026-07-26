const state = {
  stars: Number(localStorage.getItem("kongkong-stars") || 0),
  sound: localStorage.getItem("kongkong-sound") !== "off",
  current: null,
  round: 0
};

const $ = (s) => document.querySelector(s);
const screens = [...document.querySelectorAll(".screen")];

function showScreen(id){
  screens.forEach(s => s.classList.toggle("active", s.id === id));
  window.scrollTo({top:0, behavior:"smooth"});
}
function save(){
  localStorage.setItem("kongkong-stars", String(state.stars));
  localStorage.setItem("kongkong-sound", state.sound ? "on" : "off");
  updateStars();
}
function updateStars(){
  $("#starCount").textContent = state.stars;
  $("#rewardStars").textContent = state.stars;
}
function toast(msg){
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(()=>el.classList.remove("show"), 1800);
}
function tone(freq=660,duration=.12){
  if(!state.sound) return;
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value=freq; osc.type="sine";
    gain.gain.setValueAtTime(.12,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime+duration);
  }catch(e){}
}
function celebrate(stars=1){
  state.stars += stars;
  save();
  tone(880,.18);
  toast(`잘했어요! 별 ${stars}개를 받았어요 ⭐`);
  for(let i=0;i<22;i++){
    const p=document.createElement("span");
    p.className="confetti";
    p.textContent=["⭐","🎉","✨","🌈"][i%4];
    p.style.left=Math.random()*100+"vw";
    p.style.animationDelay=Math.random()*.6+"s";
    document.body.appendChild(p);
    setTimeout(()=>p.remove(),2400);
  }
}
function wrong(btn,msg="한 번 더 생각해 볼까요?"){
  btn.classList.add("wrong"); tone(220,.1); toast(msg);
  setTimeout(()=>btn.classList.remove("wrong"),500);
}
function choiceButtons(values,answer,onCorrect){
  return values.map(v=>`<button class="choice" data-value="${v}">${v}</button>`).join("");
}
function bindChoices(answer,onCorrect){
  document.querySelectorAll(".choice").forEach(btn=>{
    btn.onclick=()=>{
      const val=Number(btn.dataset.value);
      if(val===answer){
        btn.classList.add("correct");
        celebrate(1);
        setTimeout(onCorrect,700);
      } else wrong(btn);
    }
  });
}
const activities = {
  train:{
    badge:"기차역", title:"동물 친구 기차", subtitle:"움직이는 기차로 더하기와 빼기를 생각해요.",
    render(){
      const add = Math.random()>.45;
      const a = 5 + Math.floor(Math.random()*6);
      const b = add ? 2+Math.floor(Math.random()*5) : 1+Math.floor(Math.random()*4);
      const answer = add ? a+b : a-b;
      const animals = ["🐰","🐶","🐱","🐵","🦊"];
      const first = Array.from({length:Math.min(a,8)},(_,i)=>animals[i%animals.length]).join("");
      const second = Array.from({length:Math.min(b,5)},(_,i)=>animals[(i+2)%animals.length]).join("");
      $("#activityStage").innerHTML = `
        <div class="game-panel">
          <div class="scene">
            <div class="game-title">${add?"친구들이 더 탔어요!":"친구들이 내렸어요!"}</div>
            <div class="game-help">${a}명에서 ${b}명이 ${add?"더 타면":"내리면"} 몇 명일까요?</div>
            <div class="train-wrap" id="trainMove">
              <div class="engine">🚂</div>
              <div class="car">${first}</div>
              <div class="car alt">${add?second:""}</div>
            </div>
            <div class="train-track"></div>
          </div>
          <div class="control-card">
            <div class="game-title">${a} ${add?"+":"−"} ${b} = ?</div>
            <p class="game-help">기차의 동물 친구를 눈으로 세어 보세요.</p>
            <div class="choice-row">${choiceButtons(shuffle([answer,answer+1,Math.max(0,answer-2)]),answer)}</div>
            <div class="status-box">${add?"두 칸을 합쳐 볼까요?":"내린 친구를 빼 볼까요?"}</div>
          </div>
        </div>`;
      setTimeout(()=>$("#trainMove").style.transform="translateX(28px)",150);
      bindChoices(answer,()=>activities.train.render());
    }
  },
  pizza:{
    badge:"피자 가게", title:"공평한 피자 나누기", subtitle:"조각을 친구들에게 똑같이 나눠요.",
    render(){
      const people = [2,3,4][Math.floor(Math.random()*3)];
      const each = [2,3][Math.floor(Math.random()*2)];
      const slices = people*each;
      $("#activityStage").innerHTML=`
        <div class="game-panel">
          <div class="scene">
            <div class="game-title">친구 ${people}명이 피자를 기다려요!</div>
            <div class="pizza-board"><div class="pizza ${slices===6?"slice-6":""}"></div></div>
            <div class="plates">${Array.from({length:people},()=>`<div class="plate">🙂</div>`).join("")}</div>
          </div>
          <div class="control-card">
            <div class="game-title">피자 ${slices}조각을 똑같이 나누면?</div>
            <p class="game-help">한 친구가 몇 조각씩 먹을까요?</p>
            <div class="choice-row">${choiceButtons(shuffle([each,each+1,Math.max(1,each-1)]),each)}</div>
            <div class="status-box">${slices} ÷ ${people} = ?</div>
          </div>
        </div>`;
      bindChoices(each,()=>activities.pizza.render());
    }
  },
  farm:{
    badge:"동물 농장", title:"달걀판 곱셈 놀이", subtitle:"줄과 칸을 보며 묶음을 발견해요.",
    render(){
      const rows=[2,3,4][Math.floor(Math.random()*3)];
      const cols=[3,4,5][Math.floor(Math.random()*3)];
      const answer=rows*cols;
      $("#activityStage").innerHTML=`
        <div class="game-panel">
          <div class="scene">
            <div class="game-title">${rows}줄에 ${cols}개씩 놓였어요.</div>
            <div class="array-grid" style="grid-template-columns:repeat(${cols},62px)">
              ${Array.from({length:answer},()=>`<div class="array-item">🥚</div>`).join("")}
            </div>
          </div>
          <div class="control-card">
            <div class="game-title">${rows} × ${cols} = ?</div>
            <p class="game-help">한 줄씩 세어도 되고, 묶음으로 생각해도 좋아요.</p>
            <div class="choice-row">${choiceButtons(shuffle([answer,answer+rows,Math.max(1,answer-cols)]),answer)}</div>
            <div class="status-box">${cols}개가 ${rows}묶음이에요.</div>
          </div>
        </div>`;
      bindChoices(answer,()=>activities.farm.render());
    }
  },
  pattern:{
    badge:"무지개 정원", title:"규칙 찾기", subtitle:"색과 모양의 반복 규칙을 찾아요.",
    render(){
      const sets=[
        {seq:["🔴","🔵","🔴","🔵"],ans:"🔴",opts:["🔴","🟢","🟡"]},
        {seq:["🌷","🌷","🌼","🌷","🌷","🌼"],ans:"🌷",opts:["🌷","🌼","🌻"]},
        {seq:["🔺","🟨","🟢","🔺","🟨","🟢"],ans:"🔺",opts:["🔺","🟨","🟢"]}
      ];
      const s=sets[Math.floor(Math.random()*sets.length)];
      $("#activityStage").innerHTML=`
        <div class="game-panel">
          <div class="scene">
            <div class="game-title">다음에 올 친구는 누구일까요?</div>
            <div class="pattern-line">${s.seq.map(x=>`<div class="pattern-item">${x}</div>`).join("")}<div class="pattern-item missing">?</div></div>
          </div>
          <div class="control-card">
            <div class="game-title">반복되는 규칙을 찾아보세요.</div>
            <p class="game-help">앞에서부터 소리 내어 읽어 보면 쉬워져요.</p>
            <div class="choice-row">${shuffle(s.opts).map(x=>`<button class="choice text-choice" data-value="${x}">${x}</button>`).join("")}</div>
            <div class="status-box">같은 순서가 다시 시작돼요.</div>
          </div>
        </div>`;
      document.querySelectorAll(".text-choice").forEach(btn=>{
        btn.onclick=()=>{
          if(btn.dataset.value===s.ans){btn.classList.add("correct");celebrate(1);setTimeout(()=>activities.pattern.render(),700)}
          else wrong(btn);
        }
      });
    }
  },
  block:{
    badge:"블록 연구소", title:"높이와 차이", subtitle:"블록 탑을 비교하고 차이를 생각해요.",
    render(){
      const left=3+Math.floor(Math.random()*4), right=2+Math.floor(Math.random()*4);
      const diff=Math.abs(left-right);
      $("#activityStage").innerHTML=`
        <div class="game-panel">
          <div class="scene">
            <div class="game-title">두 탑의 높이를 비교해 보세요.</div>
            <div class="block-zone">
              <div class="tower">${Array.from({length:left},()=>`<div class="block"></div>`).join("")}<strong>A탑 ${left}개</strong></div>
              <div class="tower">${Array.from({length:right},()=>`<div class="block"></div>`).join("")}<strong>B탑 ${right}개</strong></div>
            </div>
          </div>
          <div class="control-card">
            <div class="game-title">두 탑은 몇 개 차이일까요?</div>
            <p class="game-help">높은 탑에서 낮은 탑만큼 가려 보세요.</p>
            <div class="choice-row">${choiceButtons(shuffle([diff,diff+1,Math.max(0,diff-1)]),diff)}</div>
            <div class="status-box">차이는 빼기로도 나타낼 수 있어요.</div>
          </div>
        </div>`;
      bindChoices(diff,()=>activities.block.render());
    }
  },
  market:{
    badge:"동전 마트", title:"장보기 계산", subtitle:"동전을 쓰고 남은 돈을 계산해요.",
    render(){
      const money=10;
      const prices=[2,3,4];
      const items=[["🍎","사과",2],["🍌","바나나",3],["🧃","주스",4]];
      const pick=items[Math.floor(Math.random()*items.length)];
      const remain=money-pick[2];
      $("#activityStage").innerHTML=`
        <div class="game-panel">
          <div class="scene">
            <div class="wallet">내 지갑: ${"🪙".repeat(5)} <span>${money}</span></div>
            <div class="market-shelf">
              ${items.map(x=>`<div class="product ${x[0]===pick[0]?"selected":""}"><div class="emoji">${x[0]}</div><strong>${x[1]}</strong><span>${x[2]}원</span></div>`).join("")}
            </div>
          </div>
          <div class="control-card">
            <div class="game-title">${pick[1]}를 사면 얼마가 남을까요?</div>
            <p class="game-help">${money}원에서 ${pick[2]}원을 써요.</p>
            <div class="choice-row">${choiceButtons(shuffle([remain,remain+1,Math.max(0,remain-2)]),remain)}</div>
            <div class="status-box">${money} − ${pick[2]} = ?</div>
          </div>
        </div>`;
      bindChoices(remain,()=>activities.market.render());
    }
  }
,
  balance:{
    badge:"같아요 연구소", title:"양쪽이 똑같아요!", subtitle:"같은 개수와 균형을 몸으로 느끼고 숨은 수를 찾아요.",
    level:1,
    render(){ this.renderMenu(); },
    renderMenu(){
      const level=this.level||1;
      $("#activityStage").innerHTML=`
        <div class="level-tabs">
          <button class="level-tab ${level===1?"active":""}" data-level="1">1. 같아요 놀이터</button>
          <button class="level-tab ${level===2?"active":""}" data-level="2">2. 균형 저울</button>
          <button class="level-tab ${level===3?"active":""}" data-level="3">3. 숨은 상자</button>
        </div>
        <div id="balanceGame"></div>`;
      document.querySelectorAll(".level-tab").forEach(b=>b.onclick=()=>{this.level=Number(b.dataset.level);this.renderMenu()});
      if(level===1)this.renderEqual(); else if(level===2)this.renderScale(); else this.renderBox();
    },
    renderEqual(){
      const target=2+Math.floor(Math.random()*4);let right=Math.max(0,target-1-Math.floor(Math.random()*2));
      const draw=()=>{
        const tilt=right<target?"tilt-left":right>target?"tilt-right":"";
        $("#balanceGame").innerHTML=`<div class="game-panel"><div class="scene balance-scene">
          <div class="game-title">오른쪽도 똑같이 만들어 주세요.</div>
          <div class="balance-beam-wrap"><div class="balance-beam ${tilt}"></div><div class="balance-pivot"></div>
            <div class="balance-pan left"><div class="pan-rope"></div><div class="pan-dish">${"🍎".repeat(target)}</div></div>
            <div class="balance-pan right"><div class="pan-rope"></div><div class="pan-dish">${"🍎".repeat(right)||"·"}</div></div>
          </div>
          <div class="equal-message">${right===target?"🎉 양쪽이 똑같아요!":"어느 쪽이 더 적을까요?"}</div>
        </div><div class="control-card"><div class="game-title">사과를 옮겨 보세요</div><p class="game-help">오른쪽 접시에 사과를 더하거나 빼세요.</p>
          <div class="object-picker"><button class="object-btn" id="addApple">➕🍎</button><button class="object-btn" id="removeApple">➖🍎</button></div>
          <div class="status-box">왼쪽 ${target}개 · 오른쪽 ${right}개</div></div></div>`;
        if(right===target){celebrate(1);setTimeout(()=>this.renderEqual(),1100);return;}
        $("#addApple").onclick=()=>{right++;tone(620,.08);draw()};
        $("#removeApple").onclick=()=>{if(right>0)right--;tone(420,.08);draw()};
      };draw();
    },
    renderScale(){
      const base=1+Math.floor(Math.random()*4); const extra=1+Math.floor(Math.random()*3); const answer=base+extra;
      $("#balanceGame").innerHTML=`<div class="game-panel"><div class="scene balance-scene">
        <div class="game-title">왼쪽과 같은 무게를 찾아보세요.</div>
        <div class="balance-beam-wrap"><div class="balance-beam"></div><div class="balance-pivot"></div>
          <div class="balance-pan left"><div class="pan-rope"></div><div class="pan-dish">${"🟡".repeat(base)} ${"🟢".repeat(extra)}</div></div>
          <div class="balance-pan right"><div class="pan-rope"></div><div class="pan-dish">?</div></div>
        </div></div><div class="control-card"><div class="game-title">모두 몇 개일까요?</div><p class="game-help">색이 달라도 개수를 모두 세면 돼요.</p>
        <div class="choice-row">${choiceButtons(shuffle([answer,answer+1,Math.max(1,answer-1)]),answer)}</div>
        <div class="status-box">${base}개와 ${extra}개를 함께 놓았어요.</div></div></div>`;
      bindChoices(answer,()=>this.renderScale());
    },
    renderBox(){
      const hidden=2+Math.floor(Math.random()*5); const add=1+Math.floor(Math.random()*4); const total=hidden+add;
      $("#balanceGame").innerHTML=`<div class="game-panel"><div class="scene balance-scene">
        <div class="game-title">상자 안의 사과는 몇 개일까요?</div>
        <div class="equation-display"><span class="hidden-box">🎁</span> + ${"🍎".repeat(add)} &nbsp; = &nbsp; ${"🍎".repeat(total)}</div>
        <div class="equal-message">양쪽의 전체 개수가 같아요</div></div>
        <div class="control-card"><div class="game-title">숨은 수 찾기</div><p class="game-help">오른쪽 전체에서 밖에 보이는 사과를 빼 보세요.</p>
        <div class="choice-row">${choiceButtons(shuffle([hidden,hidden+1,Math.max(1,hidden-1)]),hidden)}</div>
        <div class="status-box">🎁 + ${add} = ${total}</div></div></div>`;
      bindChoices(hidden,()=>this.renderBox());
    }
  }};
function shuffle(arr){return [...arr].sort(()=>Math.random()-.5)}
function openActivity(name){
  state.current=name;
  const a=activities[name];
  $("#activityBadge").textContent=a.badge;
  $("#activityTitle").textContent=a.title;
  $("#activitySubtitle").textContent=a.subtitle;
  showScreen("activityScreen");
  a.render();
}
document.querySelectorAll(".place").forEach(btn=>btn.addEventListener("click",()=>openActivity(btn.dataset.place)));
$("#dailyStart").onclick=()=>openActivity(["train","pizza","farm","pattern","block","market","balance"][new Date().getDay()%7]);
$("#backBtn").onclick=()=>showScreen("homeScreen");
$("#homeBtn").onclick=()=>showScreen("homeScreen");
$("#rewardBtn").onclick=()=>{renderRewards();showScreen("rewardScreen")};
$("#rewardBackBtn").onclick=()=>showScreen("homeScreen");
$("#soundBtn").onclick=()=>{
  state.sound=!state.sound; save();
  $("#soundBtn").textContent=state.sound?"🔊":"🔇";
  toast(state.sound?"소리를 켰어요":"소리를 껐어요");
  tone();
};
function renderRewards(){
  const icons=["🐰","🚂","🍕","🐥","🌈","🧱","🛒","🏰","🚀","🦄","🎡","👑"];
  $("#stickerGrid").innerHTML=icons.map((x,i)=>`<div class="sticker ${state.stars>=i*3+1?"unlocked":""}">${x}</div>`).join("");
}
$("#soundBtn").textContent=state.sound?"🔊":"🔇";
updateStars();
renderRewards();
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
