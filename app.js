
const MODES={
 add:{title:"덧셈 연구소",op:"+",name:"덧셈"},
 sub:{title:"뺄셈 연구소",op:"−",name:"뺄셈"},
 mul:{title:"곱셈 연구소",op:"×",name:"곱셈"},
 div:{title:"나눗셈 연구소",op:"÷",name:"나눗셈"},
 sense:{title:"수 감각 연구소",op:"+",name:"수 감각"}
};
let mode="add", problem={}, stepIndex=0, deferredPrompt=null;
const stats=JSON.parse(localStorage.getItem("mathAdventureStats")||'{"xp":0,"solved":0,"correct":0,"streak":0,"bestStreak":0,"modes":{}}');
["add","sub","mul","div","sense"].forEach(m=>stats.modes[m]??={solved:0,correct:0});

const $=s=>document.querySelector(s);
function showView(id){document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));$("#"+id).classList.add("active");scrollTo(0,0)}
function save(){localStorage.setItem("mathAdventureStats",JSON.stringify(stats));updateHeader()}
function updateHeader(){const lv=Math.floor(stats.xp/200)+1, rem=stats.xp%200;$("#levelText").textContent=`Lv. ${lv}`;$("#xpText").textContent=`${stats.xp} XP`;$("#xpBar").style.width=`${rem/2}%`}
function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function makeProblem(){
 stepIndex=0; $("#feedback").textContent=""; $("#answerInput").value="";
 let a,b,ans;
 if(mode==="add"){a=rnd(18,499);b=rnd(9,299);ans=a+b}
 if(mode==="sub"){a=rnd(100,999);b=rnd(10,a-1);ans=a-b}
 if(mode==="mul"){a=rnd(11,49);b=rnd(2,9);ans=a*b}
 if(mode==="div"){b=rnd(2,9);ans=rnd(2,20);a=b*ans}
 if(mode==="sense"){a=[99,199,299,399,498,998][rnd(0,5)];b=rnd(2,99);ans=a+b}
 problem={a,b,ans}; $("#problemText").textContent=`${a} ${MODES[mode].op} ${b}`;
 renderVisual(); renderExplain("hint");
}
function renderVisual(){
 const s=$("#visualStage");
 if(mode==="mul"){
   const rows=Math.min(problem.b,9), cols=Math.min(problem.a,16);
   s.innerHTML=`<div class="array" style="grid-template-columns:repeat(${cols},18px)">${Array(rows*cols).fill('<i class="dot"></i>').join("")}</div><p style="text-align:center">${problem.b}줄 × 한 줄에 ${problem.a}개</p>`;
 }else if(mode==="div"){
   const groups=problem.b;
   s.innerHTML=`<div class="blocks">${Array(groups).fill(0).map((_,i)=>`<div class="block-group"><div style="font-size:1.6rem">🧺</div><b>${problem.ans}개</b></div>`).join("")}</div><p style="text-align:center">${problem.a}개를 ${groups}묶음으로 똑같이 나누기</p>`;
 }else{
   const start=mode==="sub"?problem.b:problem.a, end=problem.ans;
   const min=Math.min(start,end), max=Math.max(start,end), range=Math.max(1,max-min);
   s.innerHTML=`<div class="numberline"><div class="line"></div>
   <div class="tick" style="left:5%"><label>${min}</label></div>
   <div class="tick" style="left:95%"><label>${max}</label></div>
   <div class="jump" style="left:5%;width:90%"></div></div>
   <p style="text-align:center">${start}에서 ${end}까지 수직선으로 이동해 보세요.</p>`;
 }
}
function methods(){
 const {a,b,ans}=problem;
 if(mode==="add") return [`${a}를 십의 수와 일의 수로 나눠요.`,`${b}도 편한 수로 나눠요.`,`각 자리끼리 더한 뒤 다시 모으면 ${ans}!`];
 if(mode==="sub") return [`${a}에서 ${b}만큼 뒤로 가요.`,`먼저 십의 수를 빼고, 남은 일의 수를 빼요.`,`차이는 ${ans}!`];
 if(mode==="mul") return [`${a} × ${b}는 ${a}가 ${b}묶음 있다는 뜻이에요.`,`${a}를 ${Math.floor(a/10)*10}과 ${a%10}으로 나눠 곱할 수 있어요.`, `부분 곱을 모두 더하면 ${ans}!`];
 if(mode==="div") return [`${a}개를 ${b}묶음에 똑같이 나눠요.`,`곱셈으로 바꾸면 □ × ${b} = ${a}.`,`한 묶음에는 ${ans}개!`];
 return [`${a}는 가까운 둥근 수로 바꿔 생각할 수 있어요.`,`먼저 ${a+1} + ${b}를 계산해요.`,`1을 더했으니 다시 1을 빼면 ${ans}!`];
}
function renderExplain(tab){
 document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.tab===tab));
 const m=methods(); stepIndex=0;
 let arr=tab==="hint"?[m[0],"그림을 천천히 살펴보세요."]:
 tab==="method"?m:
 ["계산 방법이 달라도 답은 같아요.","수를 잘게 나누거나 가까운 수로 바꾸면 계산이 쉬워져요.","답을 다시 반대 연산으로 확인해 보세요."];
 $("#explainContent").innerHTML=arr.map((x,i)=>`<div class="step ${i===0?"show":""}">${i+1}. ${x}</div>`).join("");
}
function nextStep(){const steps=[...document.querySelectorAll(".step")];stepIndex=Math.min(stepIndex+1,steps.length-1);steps[stepIndex]?.classList.add("show")}
function check(){
 const val=Number($("#answerInput").value); if(!Number.isFinite(val)||$("#answerInput").value==="") return;
 stats.solved++;stats.modes[mode].solved++;
 if(val===problem.ans){stats.correct++;stats.modes[mode].correct++;stats.streak++;stats.bestStreak=Math.max(stats.bestStreak,stats.streak);stats.xp+=20;$("#feedback").className="feedback good";$("#feedback").textContent="정답이에요! ⭐ 20 XP 획득"}
 else{stats.streak=0;$("#feedback").className="feedback bad";$("#feedback").textContent=`조금만 다시 생각해 봐요. 힌트: 답은 ${problem.ans}`}
 save();
}
function report(){
 $("#totalSolved").textContent=stats.solved;$("#accuracy").textContent=stats.solved?Math.round(stats.correct/stats.solved*100)+"%":"0%";
 $("#bestStreak").textContent=stats.bestStreak;$("#totalXp").textContent=stats.xp+" XP";
 $("#modeReport").innerHTML=Object.keys(MODES).map(m=>{const s=stats.modes[m],p=s.solved?Math.round(s.correct/s.solved*100):0;return `<div class="mode-row"><b>${MODES[m].name}</b><div class="bar"><i style="width:${p}%"></i></div><span>${p}%</span></div>`}).join("");
 const weakest=Object.keys(stats.modes).filter(m=>stats.modes[m].solved>0).sort((x,y)=>(stats.modes[x].correct/stats.modes[x].solved)-(stats.modes[y].correct/stats.modes[y].solved))[0];
 $("#recommendText").textContent=weakest?`${MODES[weakest].name}에서 천천히 풀이 과정을 말로 설명하는 연습을 추천합니다.`:"첫 문제를 풀면 추천 학습이 표시됩니다.";
 showView("reportView");
}
document.querySelectorAll(".menu-card[data-mode]").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;$("#labTitle").textContent=MODES[mode].title;showView("labView");makeProblem()});
document.querySelectorAll(".backBtn").forEach(b=>b.onclick=()=>showView("homeView"));
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>renderExplain(b.dataset.tab));
$("#nextStepBtn").onclick=nextStep;$("#newProblemBtn").onclick=makeProblem;$("#checkBtn").onclick=check;
$("#answerInput").addEventListener("keydown",e=>{if(e.key==="Enter")check()});
$("#reportBtn").onclick=report;
$("#resetBtn").onclick=()=>{if(confirm("모든 학습 기록을 초기화할까요?")){localStorage.removeItem("mathAdventureStats");location.reload()}};
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").classList.remove("hidden")});
$("#installBtn").onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("#installBtn").classList.add("hidden")}};
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
updateHeader();
