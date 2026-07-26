const state = {
  stars: Number(localStorage.getItem("kongkong-stars") || 0),
  sound: localStorage.getItem("kongkong-sound") !== "off",
  current: null,
  round: 0,
  renderToken: 0,
  nextTimer: null,
  processTimer: null,
  lastTrain: ""
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
function uniqueChoices(answer, spread=5){
  const set=new Set([answer]);
  const candidates=[answer+1,answer-1,answer+spread,answer-spread,answer+10,answer-10];
  for(const v of candidates){ if(v>=0) set.add(v); if(set.size>=3) break; }
  while(set.size<3) set.add(answer+set.size+2);
  return shuffle([...set].slice(0,3));
}
function clearPending(){
  state.renderToken += 1;
  if(state.nextTimer){ clearTimeout(state.nextTimer); state.nextTimer=null; }
  if(state.processTimer){ clearInterval(state.processTimer); state.processTimer=null; }
  document.querySelectorAll(".result-banner,.confetti").forEach(x=>x.remove());
}
function scheduleNext(fn, delay=1700){
  const token=state.renderToken;
  state.nextTimer=setTimeout(()=>{ if(token===state.renderToken) fn(); },delay);
}
function showResult(text, detail=""){
  const stage=$("#activityStage");
  stage.classList.add("result-flash");
  const scene=stage.querySelector(".scene");
  if(scene) scene.classList.add("scene-success");
  const banner=document.createElement("div");
  banner.className="result-banner";
  banner.innerHTML=`<strong>${text}</strong>${detail?`<span>${detail}</span>`:""}`;
  stage.appendChild(banner);
  setTimeout(()=>stage.classList.remove("result-flash"),700);
  return banner;
}
function bindChoices(answer,onCorrect,resultText="정답이에요!",detail=""){
  document.querySelectorAll(".choice").forEach(btn=>{
    btn.onclick=()=>{
      const val=Number(btn.dataset.value);
      if(val===answer){
        document.querySelectorAll(".choice").forEach(x=>x.disabled=true);
        btn.classList.add("correct");
        const status=document.querySelector(".status-box");
        if(status) status.textContent=`정답: ${answer}`;
        celebrate(1);
        showResult(resultText,detail);
        scheduleNext(onCorrect,1700);
      } else wrong(btn);
    }
  });
}
const activities = {
  train:{
    badge:"기차역", title:"자리값 계산 기차", subtitle:"두 자리와 세 자리 덧셈·뺄셈을 한 단계씩 살펴봐요.",
    difficulty:"three", operation:"add",
    render(){
      clearPending();
      const requested=this.difficulty||"three";
      const operation=this.operation||"add";
      const threeDigit=requested==="three" || (requested==="mixed" && Math.random()>.35);
      let a,b,key;
      do{
        if(threeDigit){
          a=operation==="add" ? 120+Math.floor(Math.random()*780) : 300+Math.floor(Math.random()*650);
          b=operation==="add" ? 105+Math.floor(Math.random()*780) : 101+Math.floor(Math.random()*(a-101));
        }else{
          a=operation==="add" ? 21+Math.floor(Math.random()*78) : 40+Math.floor(Math.random()*59);
          b=operation==="add" ? 21+Math.floor(Math.random()*78) : 11+Math.floor(Math.random()*(a-11));
        }
        key=`${operation}:${a}:${b}`;
      }while(key===state.lastTrain || (operation==="add" && a+b>999));
      state.lastTrain=key;
      const answer=operation==="add"?a+b:a-b;
      const sign=operation==="add"?"+":"−";
      const label=operation==="add"?"덧셈":"뺄셈";
      const pad=n=>String(n).padStart(3,"0").split("").map(Number);
      const A=pad(a), B=pad(b);
      const buildSteps=()=>{
        const steps=[];
        if(operation==="add"){
          let carry=0; const out=[null,null,null];
          for(let i=2;i>=0;i--){
            const names=["백","십","일"]; const total=A[i]+B[i]+carry;
            const nextCarry=Math.floor(total/10), digit=total%10;
            steps.push({place:i,title:`${names[i]}의 자리 계산`,active:i,carryIn:carry,carryOut:nextCarry,digit,
              text:`${carry?`받아올린 ${carry} + `:""}${A[i]} + ${B[i]} = ${total}`,
              detail:nextCarry?`${total}은 ${nextCarry*10}과 ${digit}이에요. ${digit}은 ${names[i]}의 자리에 쓰고, ${nextCarry}은 왼쪽 자리로 올려요.`:`${total}은 10보다 작아요. ${total}을 ${names[i]}의 자리에 써요.`});
            out[i]=digit; carry=nextCarry;
          }
          if(carry) steps.push({place:-1,title:"마지막 받아올림",active:0,carryIn:carry,carryOut:0,digit:carry,text:`맨 앞에 ${carry}을 써요.`,detail:`모든 자리 계산이 끝났어요.`});
        }else{
          const work=[...A]; const names=["백","십","일"]; const result=[null,null,null];
          for(let i=2;i>=0;i--){
            if(work[i]<B[i]){
              steps.push({place:i,title:`${names[i]}의 자리 먼저 살펴보기`,active:i,negative:true,
                text:`${work[i]} − ${B[i]} = ${work[i]-B[i]}`,
                detail:`결과가 음수가 되어 바로 뺄 수 없어요. 왼쪽 자리에서 10을 빌려와야 해요.`,work:[...work]});
              let lender=i-1;
              while(lender>=0 && work[lender]===0) lender--;
              if(lender>=0){
                for(let j=lender;j<i;j++){
                  const beforeLeft=work[j], beforeRight=work[j+1];
                  work[j]-=1;
                  work[j+1]+=10;
                  steps.push({place:i,title:`${names[j]}의 자리에서 10 빌려오기`,active:i,borrow:true,borrowFrom:j,borrowTo:j+1,
                    text:`${names[j]}의 자리에서 1을 빌리면 ${names[j+1]}의 자리에서는 10이 돼요.`,
                    detail:`${beforeLeft}은 ${work[j]}로 줄고, ${beforeRight} 위에 10을 써서 ${work[j+1]}으로 계산해요.`,work:[...work]});
                }
              }
            }
            const digit=work[i]-B[i]; result[i]=digit;
            steps.push({place:i,title:`${names[i]}의 자리 계산`,active:i,digit,
              text:`${work[i]} − ${B[i]} = ${digit}`,
              detail:`${digit}을 ${names[i]}의 자리에 써요.`,work:[...work]});
          }
        }
        steps.push({place:3,title:"계산 완료!",active:-1,final:true,text:`${a} ${sign} ${b} = ${answer}`,detail:"자리별 계산을 모두 연결했어요."});
        return steps;
      };
      const steps=buildSteps(); let stepIndex=-1; let answerCorrect=false; let rewarded=false;
      const digitCells=(prefix,arr)=>arr.map((x,i)=>`<div class="calc-cell place-${i}" id="${prefix}${i}">${x}</div>`).join("");
      $("#activityStage").innerHTML=`
        <div class="train-toolbar">
          <div class="operation-tabs"><button class="operation-btn ${operation==="add"?"active":""}" data-op="add">➕ 덧셈</button><button class="operation-btn ${operation==="sub"?"active":""}" data-op="sub">➖ 뺄셈</button></div>
          <div class="difficulty-tabs"><button class="difficulty-btn ${requested==="two"?"active":""}" data-diff="two">두 자리</button><button class="difficulty-btn ${requested==="three"?"active":""}" data-diff="three">세 자리</button><button class="difficulty-btn ${requested==="mixed"?"active":""}" data-diff="mixed">섞어서</button></div>
        </div>
        <div class="game-panel process-game">
          <div class="scene process-scene">
            <div class="game-title">${label} 과정을 한 칸씩 확인해요</div>
            <div class="place-labels"><span>백</span><span>십</span><span>일</span></div>
            <div class="vertical-calc" id="verticalCalc">
              <div class="carry-row" id="carryRow"><div></div><div></div><div></div></div>
              <div class="calc-row">${digitCells("a",A)}</div>
              <div class="calc-row second"><b>${sign}</b>${digitCells("b",B)}</div>
              <div class="calc-line"></div>
              <div class="calc-row answer-row"><b></b><div class="calc-cell" id="r0">?</div><div class="calc-cell" id="r1">?</div><div class="calc-cell" id="r2">?</div></div>
            </div>
            <div class="block-animation" id="blockAnimation"><div class="block-message">과정을 볼까요, 답을 맞혀볼까요?</div></div>
            <div class="step-card" id="stepCard"><strong>준비</strong><span>${a} ${sign} ${b}</span><small>정답을 먼저 고르지 않아도 계산 과정을 볼 수 있어요.</small></div>
          </div>
          <div class="control-card">
            <div class="game-title">${a.toLocaleString()} ${sign} ${b.toLocaleString()} = ?</div>
            <div class="mode-choice" id="modeChoice"><button class="mode-btn process-mode" id="showProcess">🔍 과정 보기</button><button class="mode-btn answer-mode" id="showAnswers">✅ 답 맞히기</button></div>
            <div class="choice-row hidden" id="answerChoices">${choiceButtons(uniqueChoices(answer,10),answer)}</div>
            <div class="process-controls hidden" id="processControls">
              <button class="process-btn" id="prevStep">◀ 이전 단계</button>
              <button class="process-btn primary-step" id="nextStep">다음 단계 ▶</button>
              <button class="process-btn" id="autoPlay">▶ 자동 재생</button>
              <button class="process-btn" id="restartSteps">↺ 처음부터</button>
            </div>
            <div class="step-progress" id="stepProgress">정답을 선택해 주세요.</div>
          </div>
        </div>`;
      document.querySelectorAll(".difficulty-btn").forEach(btn=>btn.onclick=()=>{this.difficulty=btn.dataset.diff;this.render()});
      document.querySelectorAll(".operation-btn").forEach(btn=>btn.onclick=()=>{this.operation=btn.dataset.op;this.render()});
      const resetVisual=()=>{
        document.querySelectorAll(".calc-cell").forEach(x=>x.classList.remove("active-place","written","borrowed"));
        [0,1,2].forEach(i=>{$(`#a${i}`).textContent=A[i]; $(`#r${i}`).textContent="?"; $(`#r${i}`).classList.remove("written")});
        $("#carryRow").innerHTML="<div></div><div></div><div></div>";
        $("#blockAnimation").innerHTML='<div class="block-message">일의 자리부터 시작해요.</div>';
      };
      const drawStep=()=>{
        resetVisual();
        if(stepIndex<0){$("#stepCard").innerHTML=`<strong>준비</strong><span>일의 자리부터 시작해요.</span><small>다음 단계를 눌러 주세요.</small>`;$("#stepProgress").textContent=`0 / ${steps.length} 단계`;return;}
        const completed=steps.slice(0,stepIndex+1);
        completed.forEach(st=>{if(st.digit!==undefined && st.place>=0){$(`#r${st.place}`).textContent=st.digit;$(`#r${st.place}`).classList.add("written")}});
        const st=steps[stepIndex];
        const latestWork=[...completed].reverse().find(x=>x.work)?.work;
        if(latestWork){
          const top=["","",""];
          latestWork.forEach((d,i)=>{
            const base=d>=10?d%10:d;
            $(`#a${i}`).textContent=base;
            if(d!==A[i]) $(`#a${i}`).classList.add("borrowed");
            if(d>=10) top[i]=String(d);
          });
          if(operation==="sub") $("#carryRow").innerHTML=top.map(x=>`<div>${x?`<span class="borrow-top">${x}</span>`:""}</div>`).join("");
        }
        if(st.final){
          String(answer).padStart(3,"0").split("").forEach((d,i)=>{$(`#r${i}`).textContent=d;$(`#r${i}`).classList.add("written")});
          $("#verticalCalc").classList.add("calculation-complete");
          $("#blockAnimation").innerHTML=`<div class="finish-train">🚂 <span>${answer}</span> 🎉</div>`;
        }else{
          document.querySelectorAll(`.place-${st.active}`).forEach(x=>x.classList.add("active-place"));
          if(operation==="add" && st.carryOut && st.place>0){
            const cells=["","",""]; cells[st.place-1]=`<span class="carry-bubble">${st.carryOut}</span>`; $("#carryRow").innerHTML=cells.map(x=>`<div>${x}</div>`).join("");
            $("#blockAnimation").innerHTML=`<div class="ones-blocks">${Array.from({length:10},()=>'<i></i>').join("")}</div><div class="bundle-arrow">→</div><div class="ten-bundle">10개 묶음<br><b>1</b></div>`;
          }else if(operation==="sub" && st.negative){
            $("#blockAnimation").innerHTML=`<div class="negative-demo"><b>${st.text}</b><span>바로 뺄 수 없어요</span><em>왼쪽 자리에서 10을 빌려와요</em></div>`;
          }else if(operation==="sub" && st.borrow){
            $("#blockAnimation").innerHTML=`<div class="ten-bundle borrow-source">왼쪽 자리 1</div><div class="bundle-arrow slow-arrow">→</div><div class="borrow-ten"><b>10</b><span>현재 자리 위에 써요</span></div>`;
            document.querySelectorAll(`.place-${st.active}`).forEach(x=>x.classList.add("borrowed"));
          }else{
            $("#blockAnimation").innerHTML=`<div class="digit-combine"><b>${st.text}</b><span>${st.digit!==undefined?`답 칸으로 ${st.digit}이 내려가요 ↓`:""}</span></div>`;
          }
        }
        $("#stepCard").innerHTML=`<strong>${st.title}</strong><span>${st.text}</span><small>${st.detail}</small>`;
        $("#stepProgress").textContent=`${stepIndex+1} / ${steps.length} 단계`;
        tone(st.final?880:600,.08);
      };
      const next=()=>{if(stepIndex<steps.length-1){stepIndex++;drawStep();if(steps[stepIndex].final){clearInterval(state.processTimer);state.processTimer=null;$("#autoPlay").textContent="▶ 자동 재생"}}};
      const prev=()=>{if(stepIndex>=0){stepIndex--;drawStep()}};
      $("#showProcess").onclick=()=>{
        $("#modeChoice").classList.add("hidden");
        $("#answerChoices").classList.add("hidden");
        $("#processControls").classList.remove("hidden");
        $("#stepProgress").textContent=`0 / ${steps.length} 단계`;
        $("#stepCard").innerHTML=`<strong>과정 보기</strong><span>일의 자리부터 천천히 살펴봐요.</span><small>다음 단계 버튼을 눌러 주세요. 과정 보기만으로는 별이 올라가지 않아요.</small>`;
      };
      $("#showAnswers").onclick=()=>{
        $("#modeChoice").classList.add("hidden");
        $("#answerChoices").classList.remove("hidden");
        $("#stepProgress").textContent="정답을 골라 보세요.";
        $("#stepCard").innerHTML=`<strong>답 맞히기</strong><span>${a} ${sign} ${b}의 답은 무엇일까요?</span><small>정답을 맞히면 별을 받아요.</small>`;
      };
      document.querySelectorAll(".choice").forEach(btn=>btn.onclick=()=>{
        if(Number(btn.dataset.value)!==answer){wrong(btn);return;}
        document.querySelectorAll(".choice").forEach(x=>x.disabled=true);btn.classList.add("correct");
        answerCorrect=true;
        if(!rewarded){celebrate(1);rewarded=true;}
        $("#processControls").classList.remove("hidden");
        $("#stepCard").innerHTML=`<strong>정답이에요!</strong><span>원하면 계산 과정도 한 단계씩 볼 수 있어요.</span><small>다음 단계 버튼을 눌러 시작합니다.</small>`;
        tone(760,.12);
      });
      $("#nextStep").onclick=next; $("#prevStep").onclick=prev;
      $("#restartSteps").onclick=()=>{if(state.processTimer){clearInterval(state.processTimer);state.processTimer=null;$("#autoPlay").textContent="▶ 자동 재생"}stepIndex=-1;$("#verticalCalc").classList.remove("calculation-complete");drawStep()};
      $("#autoPlay").onclick=()=>{
        if(state.processTimer){clearInterval(state.processTimer);state.processTimer=null;$("#autoPlay").textContent="▶ 자동 재생";return;}
        $("#autoPlay").textContent="⏸ 멈추기";next();
        state.processTimer=setInterval(()=>{if(stepIndex>=steps.length-1){clearInterval(state.processTimer);state.processTimer=null;$("#autoPlay").textContent="▶ 자동 재생"}else next()},2600);
      };
    }
  },
  pizza:{
    badge:"피자 가게", title:"공평한 피자 나누기", subtitle:"조각을 친구들에게 똑같이 나눠요.",
    render(){
      clearPending();
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
            <div class="choice-row">${choiceButtons(uniqueChoices(each,1),each)}</div>
            <div class="status-box">${slices} ÷ ${people} = ?</div>
          </div>
        </div>`;
      bindChoices(each,()=>activities.pizza.render());
    }
  },
  farm:{
    badge:"동물 농장", title:"달걀판 곱셈 놀이", subtitle:"줄과 칸을 보며 묶음을 발견해요.",
    render(){
      clearPending();
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
            <div class="choice-row">${choiceButtons(uniqueChoices(answer,rows),answer)}</div>
            <div class="status-box">${cols}개가 ${rows}묶음이에요.</div>
          </div>
        </div>`;
      bindChoices(answer,()=>activities.farm.render());
    }
  },
  pattern:{
    badge:"무지개 정원", title:"규칙 찾기", subtitle:"색과 모양의 반복 규칙을 찾아요.",
    render(){
      clearPending();
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
          if(btn.dataset.value===s.ans){document.querySelectorAll(".choice").forEach(x=>x.disabled=true);btn.classList.add("correct");document.querySelector(".missing").textContent=s.ans;document.querySelector(".missing").classList.add("pattern-reveal");celebrate(1);showResult("규칙을 찾았어요!","반복되는 순서가 완성됐어요.");scheduleNext(()=>activities.pattern.render(),1700)}
          else wrong(btn);
        }
      });
    }
  },
  block:{
    badge:"블록 연구소", title:"높이와 차이", subtitle:"블록 탑을 비교하고 차이를 생각해요.",
    render(){
      clearPending();
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
            <div class="choice-row">${choiceButtons(uniqueChoices(diff,1),diff)}</div>
            <div class="status-box">차이는 빼기로도 나타낼 수 있어요.</div>
          </div>
        </div>`;
      bindChoices(diff,()=>activities.block.render());
    }
  },
  market:{
    badge:"동전 마트", title:"장보기 계산", subtitle:"동전을 쓰고 남은 돈을 계산해요.",
    render(){
      clearPending();
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
            <div class="choice-row">${choiceButtons(uniqueChoices(remain,2),remain)}</div>
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
      clearPending();
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
      clearPending();
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
        if(right===target){celebrate(1);scheduleNext(()=>this.renderEqual(),1100);return;}
        $("#addApple").onclick=()=>{right++;tone(620,.08);draw()};
        $("#removeApple").onclick=()=>{if(right>0)right--;tone(420,.08);draw()};
      };draw();
    },
    renderScale(){
      clearPending();
      const base=1+Math.floor(Math.random()*4); const extra=1+Math.floor(Math.random()*3); const answer=base+extra;
      $("#balanceGame").innerHTML=`<div class="game-panel"><div class="scene balance-scene">
        <div class="game-title">왼쪽과 같은 무게를 찾아보세요.</div>
        <div class="balance-beam-wrap"><div class="balance-beam"></div><div class="balance-pivot"></div>
          <div class="balance-pan left"><div class="pan-rope"></div><div class="pan-dish">${"🟡".repeat(base)} ${"🟢".repeat(extra)}</div></div>
          <div class="balance-pan right"><div class="pan-rope"></div><div class="pan-dish">?</div></div>
        </div></div><div class="control-card"><div class="game-title">모두 몇 개일까요?</div><p class="game-help">색이 달라도 개수를 모두 세면 돼요.</p>
        <div class="choice-row">${choiceButtons(uniqueChoices(answer,1),answer)}</div>
        <div class="status-box">${base}개와 ${extra}개를 함께 놓았어요.</div></div></div>`;
      bindChoices(answer,()=>this.renderScale());
    },
    renderBox(){
      clearPending();
      const hidden=2+Math.floor(Math.random()*5); const add=1+Math.floor(Math.random()*4); const total=hidden+add;
      $("#balanceGame").innerHTML=`<div class="game-panel"><div class="scene balance-scene">
        <div class="game-title">상자 안의 사과는 몇 개일까요?</div>
        <div class="equation-display"><span class="hidden-box">🎁</span> + ${"🍎".repeat(add)} &nbsp; = &nbsp; ${"🍎".repeat(total)}</div>
        <div class="equal-message">양쪽의 전체 개수가 같아요</div></div>
        <div class="control-card"><div class="game-title">숨은 수 찾기</div><p class="game-help">오른쪽 전체에서 밖에 보이는 사과를 빼 보세요.</p>
        <div class="choice-row">${choiceButtons(uniqueChoices(hidden,1),hidden)}</div>
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
$("#refreshBtn").onclick=()=>{ if(state.current&&activities[state.current]){ clearPending(); tone(520,.08); const stage=$("#activityStage"); stage.classList.remove("instant-refresh"); void stage.offsetWidth; stage.classList.add("instant-refresh"); activities[state.current].render(); toast("새 문제가 바로 바뀌었어요 🔄"); } };
$("#homeBtn").onclick=()=>showScreen("homeScreen");
$("#rewardBtn").onclick=()=>{renderRewards();showScreen("rewardScreen")};
$("#rewardBackBtn").onclick=()=>showScreen("homeScreen");
$("#resetStarsBtn").onclick=()=>{
  if(confirm("모은 별과 스티커를 모두 초기화할까요?")){
    state.stars=0; save(); renderRewards(); toast("별을 0개로 초기화했어요");
  }
};
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
