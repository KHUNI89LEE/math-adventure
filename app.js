const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const MODES={
 add:{title:"덧셈의 숲",symbol:"+",label:"덧셈"},
 sub:{title:"뺄셈의 얼음계곡",symbol:"−",label:"뺄셈"},
 mul:{title:"곱셈 도시",symbol:"×",label:"곱셈"},
 div:{title:"나눗셈 항구",symbol:"÷",label:"나눗셈"},
 sense:{title:"수 감각 연구소",symbol:"+",label:"수 감각"},
 explore:{title:"수의 비밀 기지",symbol:"",label:"수 탐구"}
};
let stats=JSON.parse(localStorage.getItem("mathV3Stats")||"null")||{xp:0,streak:0,solved:0,correct:0,modes:{}};
Object.keys(MODES).forEach(k=>stats.modes[k]??={solved:0,correct:0});
let mode="add",problem={},tab="hint";
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
function save(){localStorage.setItem("mathV3Stats",JSON.stringify(stats));updateStats()}
function updateStats(){
 $("#xpHome").textContent=stats.xp;$("#streakHome").textContent=stats.streak;$("#solvedHome").textContent=stats.solved;
 $("#accuracyHome").textContent=(stats.solved?Math.round(stats.correct/stats.solved*100):0)+"%";
 $("#labXp").textContent=stats.xp;$("#levelText").textContent="LEVEL "+(Math.floor(stats.xp/100)+1)
}
function show(view){["homeView","labView","reportView"].forEach(id=>$("#"+id).classList.toggle("hidden",id!==view))}
function generate(){
 let a,b,ans;
 if(mode==="add"){a=rnd(120,799);b=rnd(40,299);ans=a+b}
 if(mode==="sub"){a=rnd(220,999);b=rnd(30,a-10);ans=a-b}
 if(mode==="mul"){a=rnd(12,49);b=rnd(3,15);ans=a*b}
 if(mode==="div"){b=rnd(3,9);ans=rnd(4,18);a=b*ans}
 if(mode==="sense"){a=[99,199,299,399,498,998][rnd(0,5)];b=rnd(3,88);ans=a+b}
 if(mode==="explore"){a=rnd(100,999);b=0;ans=Math.floor(a/100)+Math.floor(a%100/10)+a%10}
 problem={a,b,ans};
 $("#problemText").textContent=mode==="explore"?`${a}의 비밀을 찾아라`:`${a} ${MODES[mode].symbol} ${b}`;
 $("#answerInput").value="";$("#feedback").className="feedback";renderVisual();renderExplain()
}
function placeHTML(n){
 const h=Math.floor(n/100),t=Math.floor(n%100/10),u=n%10;
 return `<div class="concept-head"><b>${n}을 백·십·일로 분해해 보세요</b><p>${h}백 + ${t}십 + ${u}일</p></div>
 <div class="place-model">
 <div class="place-column"><h4>백의 자리 ${h}</h4><div class="blocks">${Array(h).fill('<i class="hundred"></i>').join("")}</div></div>
 <div class="place-column"><h4>십의 자리 ${t}</h4><div class="blocks">${Array(t).fill('<i class="ten"></i>').join("")}</div></div>
 <div class="place-column"><h4>일의 자리 ${u}</h4><div class="blocks">${Array(u).fill('<i class="unit"></i>').join("")}</div></div></div>`
}
function renderVisual(){
 const s=$("#visualStage"),{a,b,ans}=problem;
 if(mode==="add"||mode==="sub"){s.innerHTML=placeHTML(a)+`<p style="text-align:center;font-weight:800">${mode==="add"?b+"를 자리별로 더합니다.":b+"를 자리별로 뺍니다."}</p>`}
 else if(mode==="mul"){
  const t=Math.floor(a/10)*10,o=a%10;
  s.innerHTML=`<div class="concept-head"><b>${a}를 ${t}과 ${o}로 나누어 넓이로 생각해요</b></div><div class="area-grid">
  <div class="area-part">${t} × ${b}<br>= ${t*b}</div><div class="area-part">${o} × ${b}<br>= ${o*b}</div>
  <div class="area-part">${t*b}</div><div class="area-part">${o*b}</div></div><p style="text-align:center;font-weight:900">${t*b} + ${o*b} = ${ans}</p>`
 } else if(mode==="div"){
  s.innerHTML=`<div class="concept-head"><b>${a}개를 ${b}개 바구니에 똑같이 나눠요</b></div><div class="baskets">${Array(b).fill(0).map((_,i)=>`<div class="basket"><b>${i+1}</b><div>${Array(ans).fill('<i class="dot"></i>').join("")}</div></div>`).join("")}</div><p style="text-align:center;font-weight:900">한 바구니에 ${ans}개</p>`
 } else if(mode==="sense"){
  s.innerHTML=`<div class="concept-head"><b>가까운 둥근 수를 이용해 보세요</b></div><div class="jump-arc"></div><div class="number-path"><span class="point" style="left:0">${a}</span><span class="point" style="left:45%">${a+1}</span><span class="point" style="right:0">${ans}</span></div><p style="text-align:center">${a}를 ${a+1}로 바꾸면 계산이 쉬워져요. 마지막에 1을 조정합니다.</p>`
 } else {
  const n=a,h=Math.floor(n/100),t=Math.floor(n%100/10),u=n%10,divs=[];for(let i=1;i<=n;i++)if(n%i===0)divs.push(i);
  s.innerHTML=`<div class="concept-head"><b>${n} 속에 숨은 성질</b></div><div class="secret-grid">
  <div class="secret"><span>자리값</span><b>${h}백 ${t}십 ${u}일</b></div>
  <div class="secret"><span>자리 숫자의 합</span><b>${h+t+u}</b></div>
  <div class="secret"><span>홀수·짝수</span><b>${n%2?"홀수":"짝수"}</b></div>
  <div class="secret"><span>2배</span><b>${n*2}</b></div>
  <div class="secret"><span>가까운 백</span><b>${Math.round(n/100)*100}</b></div>
  <div class="secret"><span>약수 개수</span><b>${divs.length}개</b></div></div>`
 }
}
function explanations(){
 const {a,b,ans}=problem;
 const data={
 add:{hint:`${a}와 ${b}를 백·십·일로 나눠 보세요.`,methods:`<ol><li>세로셈</li><li>자리값 분해</li><li>둥근 수 보정</li></ol>`,why:`같은 자리끼리 더해야 수의 크기를 정확히 보존할 수 있어요.`},
 sub:{hint:`일의 자리부터 비교하고 부족하면 십 1개를 일 10개로 바꾸세요.`,methods:`<ol><li>세로셈</li><li>차이만큼 이동</li><li>같은 수 더하기</li></ol>`,why:`십 1개와 일 10개는 값이 같아서 모양만 바꾸어도 전체 수는 변하지 않아요.`},
 mul:{hint:`${a}를 ${Math.floor(a/10)*10}과 ${a%10}으로 나눠 보세요.`,methods:`<ol><li>점 배열</li><li>면적모형</li><li>분배법칙</li></ol>`,why:`직사각형을 나누어도 전체 넓이는 각 부분 넓이의 합과 같아요.`},
 div:{hint:`${a}개를 ${b}묶음에 한 개씩 돌아가며 나눠 보세요.`,methods:`<ol><li>똑같이 나누기</li><li>같은 크기로 묶기</li><li>곱셈으로 확인</li></ol>`,why:`${ans} × ${b} = ${a}이므로 나눗셈과 곱셈은 서로 거꾸로 된 관계예요.`},
 sense:{hint:`${a}에 1을 더해 둥근 수를 먼저 만드세요.`,methods:`<ol><li>10 만들기</li><li>100 만들기</li><li>보정하기</li></ol>`,why:`계산하기 쉬운 수로 바꾼 만큼 마지막에 다시 조정하면 값은 같아요.`},
 explore:{hint:`백·십·일 자리 숫자를 각각 관찰하세요.`,methods:`<ol><li>자리값</li><li>홀짝</li><li>약수와 배수</li></ol>`,why:`하나의 수도 여러 관점으로 보면 다양한 성질을 발견할 수 있어요.`}
 };return data[mode]
}
function renderExplain(){const d=explanations();$("#explainContent").innerHTML=`<p>${d[tab]}</p>`}
function enter(m){mode=m;$("#labTitle").textContent=MODES[m].title;show("labView");generate()}
function check(){
 const v=Number($("#answerInput").value);if($("#answerInput").value==="")return;
 stats.solved++;stats.modes[mode].solved++;
 const f=$("#feedback");
 if(v===problem.ans){stats.correct++;stats.modes[mode].correct++;stats.streak++;stats.xp+=10;f.className="feedback show ok";f.innerHTML=`정답입니다! ⭐ ${problem.ans}<br><small>원리를 말로 설명하면 수학 실력이 더 깊어져요.</small>`}
 else{stats.streak=0;f.className="feedback show no";f.innerHTML=`다시 생각해 보세요. 그림의 자리값과 묶음을 천천히 살펴보세요.`}
 save()
}
function report(){
 show("reportView");const acc=stats.solved?Math.round(stats.correct/stats.solved*100):0;
 $("#reportCards").innerHTML=`<div>총 탐구 수<b>${stats.solved}</b></div><div>정확도<b>${acc}%</b></div><div>연구 점수<b>${stats.xp}</b></div><div>현재 레벨<b>${Math.floor(stats.xp/100)+1}</b></div>`;
 $("#modeReport").innerHTML=Object.entries(MODES).map(([k,v])=>{let m=stats.modes[k],a=m.solved?Math.round(m.correct/m.solved*100):0;return `<div class="mode-row"><b>${v.label}</b><div class="bar"><i style="width:${a}%"></i></div><span>${a}%</span></div>`}).join("");
 const weak=Object.keys(MODES).sort((x,y)=>{let a=stats.modes[x],b=stats.modes[y];return (a.solved?a.correct/a.solved:0)-(b.solved?b.correct/b.solved:0)})[0];
 $("#recommendation").textContent=stats.solved<5?"먼저 각 행성을 골고루 탐험해 주세요. 문제를 푼 뒤 그림을 보며 계산 원리를 말로 설명하도록 도와주세요.":`${MODES[weak].label} 영역의 시각 모형을 다시 살펴보는 연습을 권합니다. 정답보다 풀이 이유를 말하도록 유도해 주세요.`
}
$$(".world-card").forEach(b=>b.onclick=()=>enter(b.dataset.mode));
$("#startMission").onclick=()=>enter("explore");$("#backBtn").onclick=()=>show("homeView");$("#reportBack").onclick=()=>show("homeView");$("#parentBtn").onclick=report;
$("#checkBtn").onclick=check;$("#newBtn").onclick=generate;$("#answerInput").onkeydown=e=>{if(e.key==="Enter")check()};
$$(".tab").forEach(b=>b.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");tab=b.dataset.tab;renderExplain()});
$$(".rail-step").forEach(b=>b.onclick=()=>{$$(".rail-step").forEach(x=>x.classList.remove("active"));b.classList.add("active");const step=+b.dataset.step;if(step===1)renderVisual();if(step===2){tab="methods";$$(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab==="methods"));renderExplain()}if(step===3){$("#explainContent").innerHTML="<p><b>아이에게 이렇게 물어보세요.</b><br>‘어떻게 풀었어?’, ‘다른 방법도 있을까?’, ‘왜 그 방법이 맞을까?’</p>"}});
updateStats();
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
