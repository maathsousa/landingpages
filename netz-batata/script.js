(function(){
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap=typeof gsap!=='undefined';
const el=id=>document.getElementById(id);

/* Nav */
const nav=el('nav');
const navCheck=()=>nav.classList.toggle('solid',scrollY>40);
addEventListener('scroll',navCheck,{passive:true});navCheck();

/* ---------- Vídeo de fundo do topo ---------- */
const vid=el('heroVideo'), vBtn=el('videoToggle');
if(vid){
  const pick=()=>matchMedia('(max-width: 760px)').matches?vid.dataset.srcSm:vid.dataset.srcLg;
  const setPaused=p=>{vBtn.setAttribute('aria-pressed',p);vBtn.setAttribute('aria-label',p?'Tocar vídeo de fundo':'Pausar vídeo de fundo')};
  if(reduce){setPaused(true)}            // movimento reduzido: fica a imagem parada
  else{vid.src=pick();vid.play().catch(()=>setPaused(true))}
  vBtn.addEventListener('click',()=>{
    if(!vid.src) vid.src=pick();
    if(vid.paused){vid.play();setPaused(false)}else{vid.pause();setPaused(true)}
  });
  // economiza bateria: pausa quando o topo sai da tela
  new IntersectionObserver(([e])=>{if(vBtn.getAttribute('aria-pressed')==='true')return;e.isIntersecting?vid.play().catch(()=>{}):vid.pause()}).observe(el('topo'));
}

/* ---------- Simulador ---------- */
const DESCONTO=0.15, PRECO_SACA=80, F_CO2=791/150; // CO2: proporção da calculadora do site NETZ (R$150/mês → 791 kg/ano)
const MIN=150, MAX=50000, range=el('conta');
const fmtR=v=>'R$ '+Math.round(v).toLocaleString('pt-BR');
const fmtN=v=>Math.round(v).toLocaleString('pt-BR');
const toVal=p=>{const v=MIN*Math.pow(MAX/MIN,p/1000);const r=v<1000?Math.round(v/10)*10:v<10000?Math.round(v/100)*100:Math.round(v/500)*500;return Math.min(MAX,Math.max(MIN,r))};
const toPos=v=>Math.round(1000*Math.log(v/MIN)/Math.log(MAX/MIN));
const out={ano:0,cinco:0,co2:0,sac:0};
let ultimoAlvo=null;
function render(o){
  el('ano').textContent=fmtR(o.ano); el('cinco').textContent=fmtR(o.cinco);
  el('co2').textContent=o.co2>=1000?(o.co2/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})+' t':fmtN(o.co2)+' kg';
  el('sacasTxt').textContent=fmtN(o.sac)+(Math.round(o.sac)===1?' saca':' sacas');
}
function pilha(sacas){
  const p=el('pilha'), n=40, por=sacas<=n?1:Math.ceil(sacas/n/5)*5, on=Math.max(1,Math.min(n,Math.round(sacas/por)));
  if(!p.children.length){for(let i=0;i<n;i++){const d=document.createElement('div');d.className='saco';p.appendChild(d)}}
  [...p.children].forEach((d,i)=>d.classList.toggle('on',i<on));
  el('pilhaL').textContent=`Cada saco representa ${fmtN(por)} ${por===1?'saca':'sacas'} de 50 kg.`;
}
function update(fromRange){
  const v=toVal(+range.value);
  range.style.setProperty('--p',(range.value/10)+'%');
  range.setAttribute('aria-valuetext',fmtR(v)+' por mês');
  el('contaTxt').textContent=fmtR(v);
  el('bHoje').textContent=fmtR(v);
  el('bNetz').textContent=fmtR(v*(1-DESCONTO));
  const ano=v*12*DESCONTO;
  const alvo={ano,cinco:ano*5,co2:v*F_CO2,sac:ano/PRECO_SACA};
  ultimoAlvo=alvo;
  if(hasGsap&&!reduce) gsap.to(out,{...alvo,duration:.6,ease:'power2.out',overwrite:true,onUpdate:()=>render(out)});
  else {Object.assign(out,alvo);render(out)}
  pilha(alvo.sac);
  if(fromRange) document.querySelectorAll('#perfis button').forEach(b=>b.classList.remove('on'));
}
range.addEventListener('input',()=>update(true));
document.querySelectorAll('#perfis button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('#perfis button').forEach(x=>x.classList.remove('on'));b.classList.add('on');
  const target=toPos(+b.dataset.v);
  if(hasGsap&&!reduce){const o={p:+range.value};gsap.to(o,{p:target,duration:.7,ease:'power3.inOut',onUpdate:()=>{range.value=o.p;update(false)}})}
  else {range.value=target;update(false)}
}));
range.value=toPos(8000);update(false);

if(!hasGsap||reduce){
  document.querySelectorAll('.passo').forEach(p=>p.classList.add('on'));
  const s=el('sunlet');s.style.left='50%';s.style.top='38%';
  return;
}
gsap.registerPlugin(ScrollTrigger);

/* ---------- Abertura ---------- */
gsap.timeline({defaults:{ease:'power3.out'}})
  .from('.hero-video',{scale:1.15,duration:2.6,ease:'power2.out'},0)
  .from('.hero-shade',{opacity:.4,duration:1.8},0)
  .from('.hero h1 .ln>span',{yPercent:110,duration:1.1,stagger:.1},.3)
  .from('.h-in',{y:24,opacity:0,duration:.9,stagger:.12},.8)
  .from('.chip',{scale:.8,opacity:0,duration:.6,stagger:.08,ease:'back.out(2)'},1.1)
  .from('.nav',{y:-30,opacity:0,duration:.8},.9)
  .from('.scroll-hint',{opacity:0,duration:.8},1.7);

/* Rolagem no hero: o vídeo se move devagar, o texto sai */
const heroST={trigger:'.hero',start:'top top',end:'bottom top',scrub:true};
gsap.to('#heroVideo',{yPercent:12,scale:1.08,ease:'none',scrollTrigger:heroST});
gsap.to('.hero-copy',{y:-110,opacity:0,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'70% top',scrub:true}});


/* ---------- Como funciona: sol percorre o arco ---------- */
const arcFill=el('arcFill'), arcLen=arcFill.getTotalLength(), arcSvg=el('arc'), sunlet=el('sunlet'), host=el('jornadaPin');
const passos=[...document.querySelectorAll('.passo')];
arcFill.style.strokeDasharray=arcLen;
function placeSun(p){
  const t=.06+p*.88, pt=arcFill.getPointAtLength(arcLen*t);
  const box=arcSvg.getBoundingClientRect(), h=host.getBoundingClientRect();
  const s=Math.min(box.width/1000,box.height/420);
  sunlet.style.left=(box.left-h.left+(box.width-1000*s)/2+pt.x*s)+'px';
  sunlet.style.top=(box.top-h.top+(box.height-420*s)/2+pt.y*s)+'px';
  arcFill.style.strokeDashoffset=arcLen*(1-t);
  el('jGlow').style.opacity=Math.sin(p*Math.PI)*.9;
  passos.forEach((el,i)=>el.classList.toggle('on',p>=i/4-.02));
}
ScrollTrigger.create({trigger:'#jornadaPin',start:'top top',end:'+=220%',pin:true,scrub:true,
  onUpdate:s=>placeSun(s.progress),onRefresh:s=>placeSun(s.progress)});
gsap.fromTo('#jImg',{scale:1.15},{scale:1,ease:'none',scrollTrigger:{trigger:'#jornadaPin',start:'top top',end:'+=220%',scrub:true}});
placeSun(0);

/* ---------- Simulador ---------- */
gsap.from('.sim-head > *',{y:40,opacity:0,duration:.9,stagger:.1,ease:'power3.out',scrollTrigger:{trigger:'.sim',start:'top 75%'}});
gsap.from('#simBox',{y:80,opacity:0,scale:.96,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:'#simBox',start:'top 85%'}});
gsap.from('.sim-out img',{scale:1.25,duration:1.8,ease:'power2.out',scrollTrigger:{trigger:'#simBox',start:'top 85%'}});
gsap.from('#bNetz',{scaleX:0,duration:1.3,ease:'power3.out',scrollTrigger:{trigger:'#simBox',start:'top 70%'}});
ScrollTrigger.create({trigger:'#simBox',start:'top 70%',once:true,onEnter:()=>{
  Object.assign(out,{ano:0,cinco:0,co2:0,sac:0});
  gsap.to(out,{...ultimoAlvo,duration:1.6,ease:'power2.out',overwrite:true,onUpdate:()=>render(out)});
}});

/* ---------- Sacas: a pilha cai ---------- */
gsap.timeline({scrollTrigger:{trigger:'#pilha',start:'top 80%'}})
  .from('.saco',{y:-70,duration:.7,stagger:.02,ease:'bounce.out'},0)
  .from('.saco',{opacity:0,duration:.25,stagger:.02,ease:'power1.out'},0);

/* ---------- Final: o sol nasce no horizonte ---------- */
gsap.from('#sunFinal',{yPercent:45,scale:.85,ease:'none',scrollTrigger:{trigger:'.final',start:'top bottom',end:'bottom bottom',scrub:true}});
gsap.from('.final .wrap > *',{y:40,opacity:0,stagger:.12,duration:1,ease:'power3.out',scrollTrigger:{trigger:'.final',start:'top 65%'}});
})();
