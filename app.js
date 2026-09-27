const CDN = "https://cdn.jsdelivr.net/gh/workinwithai-create/PreEight@main/public/samples";
const STEPS = 16;
const DENSE = 8;
const THIN = 4;
const recipes = [
  { id:"drop-kit", name:"Drop kit", blurb:"Hats and snare leave. Kick + bass only. Air opens." },
  { id:"piano-out", name:"Piano out", blurb:"Grand leaves. Nylon and upright hold the grid." },
  { id:"bass-only", name:"Bass only", blurb:"Everything but upright dies for four bars." },
  { id:"hats-only", name:"Hats only", blurb:"Closed hats keep time. All other chairs mute." },
  { id:"nylon-hold", name:"Nylon hold", blurb:"Nylon single notes. No chords. Kit thins to kick." },
  { id:"half-time", name:"Half time", blurb:"Snare moves to 3. Density halves without muting." },
  { id:"string-air", name:"String air", blurb:"Violin holds one note. Everything else sparse." },
  { id:"brass-cut", name:"Brass cut", blurb:"Trumpet stabs only on bar 12. Rest is thin." },
  { id:"pedal-thin", name:"Pedal thin", blurb:"Bass pedal. Piano voicings drop to two notes." },
  { id:"stop-hit", name:"Stop hit", blurb:"Bar 11 is air. Bar 12 one hit. Then the door." }
];
function bar(symbol, piano, guitar, bass){ return { symbol, piano, guitar, bass }; }
const grooves = [
  { id:"amber", name:"Amber Walk", bpm:98, key:"A minor",
    dense:[bar("Am",[45,48,52,57],[45,52,57],33),bar("F",[41,45,48,53],[41,48,53],41),bar("C",[48,52,55,60],[48,52,55],36),bar("G",[43,47,50,55],[43,47,50],31),bar("Am",[45,48,52,57],[45,52,57],33),bar("F",[41,45,48,53],[41,48,53],41),bar("C",[48,52,55,60],[48,52,55],36),bar("G",[43,47,50,55],[43,47,50],31)],
    thin:[bar("Am",[45,52],[45],33),bar("F",[41,48],[41],41),bar("C",[48,55],[48],36),bar("G",[43,50],[43],31)] },
  { id:"porch", name:"Porch Climb", bpm:86, key:"E major",
    dense:[bar("E",[40,44,47,52],[40,47,52],28),bar("B",[35,39,42,47],[35,42,47],23),bar("C#m",[44,47,51,56],[44,51,56],32),bar("A",[33,37,40,45],[33,40,45],33),bar("E",[40,44,47,52],[40,47,52],28),bar("B",[35,39,42,47],[35,42,47],23),bar("C#m",[44,47,51,56],[44,51,56],32),bar("A",[33,37,40,45],[33,40,45],33)],
    thin:[bar("E",[40,47],[40],28),bar("B",[35,42],[35],23),bar("C#m",[44,51],[44],32),bar("A",[33,40],[33],33)] },
  { id:"fold", name:"Fold Radio", bpm:104, key:"D minor",
    dense:[bar("Dm",[38,41,45,50],[38,45,50],26),bar("Bb",[34,38,41,46],[34,41,46],34),bar("F",[41,45,48,53],[41,48,53],29),bar("C",[36,40,43,48],[36,43,48],24),bar("Dm",[38,41,45,50],[38,45,50],26),bar("Bb",[34,38,41,46],[34,41,46],34),bar("F",[41,45,48,53],[41,48,53],29),bar("C",[36,40,43,48],[36,43,48],24)],
    thin:[bar("Dm",[38,45],[38],26),bar("Bb",[34,41],[34],34),bar("F",[41,48],[41],29),bar("C",[36,43],[36],24)] }
];
const state = { groove: grooves[0], recipe: recipes[0], playing:false, bar:0, mode:null };
let ctx, bus, buffers = {};
async function load() {
  ctx = new AudioContext();
  bus = ctx.createGain(); bus.gain.value = 0.35; bus.connect(ctx.destination);
  const files = [
    ["kick",`${CDN}/drums/kick.mp3`],["snare",`${CDN}/drums/snare.mp3`],["hat",`${CDN}/drums/hihat.mp3`],["crash",`${CDN}/drums/crash.mp3`],
    ["pC3",`${CDN}/piano/C3.mp3`],["pC4",`${CDN}/piano/C4.mp3`],["pA3",`${CDN}/piano/A3.mp3`],
    ["bE1",`${CDN}/bass/E1.mp3`],["bA1",`${CDN}/bass/A1.mp3`],["bC2",`${CDN}/bass/C2.mp3`],
    ["gE2",`${CDN}/guitar/E2.mp3`],["gA2",`${CDN}/guitar/A2.mp3`],["gE3",`${CDN}/guitar/E3.mp3`],
    ["tC4",`${CDN}/trumpet/C4.mp3`],["vA3",`${CDN}/violin/A3.mp3`]
  ];
  let n=0;
  for (const [k,url] of files) {
    try { const r = await fetch(url); buffers[k] = await ctx.decodeAudioData(await r.arrayBuffer()); } catch (e) { console.warn(k, e); }
    n++; document.getElementById("status").textContent = `Seating chairs ${n}/${files.length}`;
  }
  document.getElementById("status").textContent = "Chairs seated · live FluidR3 + kit";
}
function playBuf(name, when, rate=1, gain=0.4) {
  const b = buffers[name]; if (!b || !ctx) return;
  const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = gain; src.connect(g); g.connect(bus); src.start(when);
}
function rateFromMidi(midi, baseMidi){ return Math.pow(2, (midi-baseMidi)/12); }
function chordAt(i){ return i < DENSE ? state.groove.dense[i] : state.groove.thin[i-DENSE]; }
function scheduleBar(barIndex, t0, stepDur){
  const ch = chordAt(barIndex); const onThin = barIndex >= DENSE; const rec = state.recipe.id;
  for (let s=0;s<STEPS;s++){
    const when = t0 + s*stepDur;
    // kit
    if (rec === "hats-only" && onThin) {
      if (s%2===0) playBuf("hat", when, 1, 0.09);
      continue;
    }
    if (rec === "bass-only" && onThin) {
      if (s===0) playBuf("bA1", when, rateFromMidi(ch.bass, 33), 0.55);
      continue;
    }
    if (rec === "drop-kit" && onThin) {
      if (s===0) playBuf("kick", when, 1, 0.7);
      if (s===0) playBuf("bA1", when, rateFromMidi(ch.bass, 33), 0.5);
      continue;
    }
    if (rec === "stop-hit" && onThin && barIndex === 10) continue; // air on bar 11
    if (rec === "stop-hit" && onThin && barIndex === 11 && s !== 0) continue;
    // default dense kit
    if (!onThin || (rec !== "hats-only" && rec !== "bass-only" && rec !== "drop-kit")) {
      if (s%2===0) playBuf("hat", when, 1, onThin ? 0.04 : 0.07);
      if (s===0) playBuf("kick", when, 1, 0.7);
      if (s===8) {
        const snareGain = (rec==="half-time" && onThin) ? 0 : 0.45;
        if (snareGain) playBuf("snare", when, 1, snareGain);
      }
      if (rec==="half-time" && onThin && s===12) playBuf("snare", when, 1, 0.4);
    }
    // chairs
    if (s===0) {
      if (!(rec==="piano-out" && onThin) && !(rec==="bass-only" && onThin) && !(rec==="hats-only" && onThin) && !(rec==="drop-kit" && onThin)) {
        const pGain = onThin && (rec==="pedal-thin" || rec==="nylon-hold") ? 0.12 : (onThin ? 0.18 : 0.28);
        playBuf("pC4", when, rateFromMidi(ch.piano[1]||60, 60), pGain);
        if (!onThin || rec !== "pedal-thin") playBuf("pA3", when, rateFromMidi(ch.piano[0]||57, 57), pGain*0.8);
      }
      if (!(rec==="bass-only"===false && onThin && (rec==="hats-only" || rec==="string-air"))) {
        // always play bass unless hats-only
        if (rec !== "hats-only") playBuf("bA1", when, rateFromMidi(ch.bass, 33), onThin ? 0.5 : 0.45);
      }
      if (!(rec==="piano-out"===false) && !(rec==="bass-only" && onThin) && !(rec==="hats-only" && onThin) && !(rec==="drop-kit" && onThin) && !(rec==="string-air" && onThin)) {
        const gGain = onThin && rec==="nylon-hold" ? 0.3 : (onThin ? 0.15 : 0.22);
        playBuf("gA2", when, rateFromMidi(ch.guitar[0]||45, 45), gGain);
      }
    }
    if (onThin && rec==="brass-cut" && barIndex===11 && (s===0 || s===8)) playBuf("tC4", when, rateFromMidi(ch.piano[1]||60,60), 0.35);
    if (onThin && rec==="string-air" && s===0) playBuf("vA3", when, rateFromMidi(ch.piano[1]||57,57), 0.22);
  }
}
let timer=null;
function stop(){ state.playing=false; state.mode=null; if(timer) clearTimeout(timer); timer=null; paintBars(); }
async function play(mode){
  if (!ctx) await load();
  if (ctx.state==="suspended") await ctx.resume();
  stop(); state.playing=true; state.mode=mode;
  const startBar = mode==="eight" ? DENSE : 0;
  const endBar = mode==="loop" ? DENSE : DENSE+THIN;
  const stepDur = 60/state.groove.bpm/4;
  let barIndex = startBar;
  const tick = () => {
    if (!state.playing) return;
    if (barIndex >= endBar) { if (mode==="loop") barIndex = startBar; else { stop(); return; } }
    state.bar = barIndex; paintBars();
    scheduleBar(barIndex, ctx.currentTime+0.02, stepDur);
    barIndex += 1;
    timer = setTimeout(tick, STEPS*stepDur*1000);
  };
  tick();
}
function punch(){
  const g=state.groove, r=state.recipe;
  return `ThinFour punch list\n${g.name} · ${g.bpm} BPM · ${g.key} · ${r.name}\n\nThe problem: the arrangement stays dense. Generators never thin. The next section has nowhere to land.\nThe move: ${r.blurb}\n\nDense (bars 1-8)\n${g.dense.map((b,i)=>`  ${i+1}. ${b.symbol}`).join("\n")}\n\nThin (bars 9-12) — ${r.name}\n${g.thin.map((b,i)=>`  ${i+9}. ${b.symbol}`).join("\n")}\n\nLive chairs only (FluidR3). Distinct from MuteEight, LiftTwo, TagFour, PreEight, AfterHook, EndEight, LastHook.\nDrop the WAV on bars 9-12. The following section will hit harder because of the air.`;
}
function paintGrooves(){
  const el=document.getElementById("grooves"); el.innerHTML="";
  grooves.forEach(g=>{ const b=document.createElement("button"); b.className="card"+(state.groove.id===g.id?" on":""); b.innerHTML=`<b>${g.name}</b><span>${g.bpm} BPM · ${g.key}</span>`; b.onclick=()=>{ state.groove=g; render(); }; el.appendChild(b); });
}
function paintRecipes(){
  const el=document.getElementById("recipes"); el.innerHTML="";
  recipes.forEach(r=>{ const b=document.createElement("button"); b.className="card"+(state.recipe.id===r.id?" on":""); b.innerHTML=`<b>${r.name}</b><span>${r.blurb}</span>`; b.onclick=()=>{ state.recipe=r; render(); }; el.appendChild(b); });
}
function paintBars(){
  const el=document.getElementById("bars"); el.innerHTML="";
  for(let i=0;i<12;i++){ const ch=chordAt(i); const d=document.createElement("div"); d.className="bar"+(i>=8?" thin":"")+(state.playing && state.bar===i?" active":""); d.innerHTML=`<div class="n">${i+1} · ${i>=8?"T":"D"}</div><div class="c">${ch.symbol}</div>`; el.appendChild(d); }
}
function render(){ paintGrooves(); paintRecipes(); paintBars(); document.getElementById("punch").textContent = punch(); }
document.getElementById("playA").onclick=()=>play("loop");
document.getElementById("playB").onclick=()=>play("cut");
document.getElementById("play8").onclick=()=>play("eight");
document.getElementById("stop").onclick=stop;
document.getElementById("copy").onclick=()=>navigator.clipboard.writeText(punch());
render();
load();