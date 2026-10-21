// @ts-nocheck
// Procedural jewellery illustrations, used when a product has no photo yet.
import { COLORS } from "./gold";

// Gold colours for the drawings.
const METAL: Record<string, { colors: readonly string[] }> = Object.fromEntries(COLORS.map((c) => [c.id, { colors: c.swatch }]));

// Colours used for drawn stones (independent of which stones the store sells).
const GEM: Record<string, string> = { diamond: "#EEF6FF", cz: "#EEF6FF", pearl: "#F5EFE4", ruby: "#C3123B", emerald: "#0E8A5F", sapphire: "#2049B8", turquoise: "#3FB8AF", polki: "#F1E9D4", kundan: "#E7F1EF" };

function grad(uid,m){const c=METAL[m].colors;return`<linearGradient id="m${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".45" stop-color="${c[1]}"/><stop offset=".7" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient><radialGradient id="p${uid}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#F1E8DA"/><stop offset="1" stop-color="#C9BBA4"/></radialGradient>`}
function gem(x,y,r,st,uid){
  if(st==="none")return"";
  if(st==="pearl")return`<circle cx="${x}" cy="${y}" r="${r*.9}" fill="url(#p${uid})"/>`;
  const col=GEM[st], dk=st==="diamond"||st==="cz"||st==="polki"||st==="kundan"?"#9FB3C8":"rgba(0,0,0,.35)";
  const pts=[[x-r,y-r*.25],[x-r*.55,y-r*.72],[x+r*.55,y-r*.72],[x+r,y-r*.25],[x,y+r]].map(p=>p.map(v=>v.toFixed(1)).join(",")).join(" ");
  let extra="";
  if(st==="kundan")extra=`<circle cx="${x}" cy="${y-r*.15}" r="${r*.28}" fill="#C3123B" opacity=".8"/>`;
  return`<g><polygon points="${pts}" fill="${col}" stroke="${dk}" stroke-width="1"/><path d="M${x-r} ${y-r*.25}H${x+r}M${x-r*.55} ${y-r*.72}L${x-r*.2} ${y-r*.25}L${x} ${y+r}L${x+r*.2} ${y-r*.25}L${x+r*.55} ${y-r*.72}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width=".8"/>${extra}<circle cx="${x-r*.35}" cy="${y-r*.45}" r="${r*.12}" fill="#fff" opacity=".9"/></g>`;
}
function qpt(t,a,b,c){return[(1-t)**2*a[0]+2*(1-t)*t*b[0]+t*t*c[0],(1-t)**2*a[1]+2*(1-t)*t*b[1]+t*t*c[1]]}
function cpt(t,a,b,c,d){const u=1-t;return[u**3*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t**3*d[0],u**3*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t**3*d[1]]}
function drawType(type,v,st,M,uid,xs){
  const g=gem;
  switch(type){
  case"rings":{
    const bw=[9,14,7,11][v];
    let s=`<ellipse cx="100" cy="122" rx="54" ry="44" fill="none" stroke="${M}" stroke-width="${bw}"/><ellipse cx="100" cy="122" rx="54" ry="44" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5" transform="translate(-2,-3)"/>`;
    if(st!=="none"){
      s+=`<path d="M86 84 L92 70 M114 84 L108 70" stroke="${M}" stroke-width="3"/>`;
      s+=g(100,66,v===2?14:20,st,uid);
      if(v===1||v===3){s+=g(74,84,7,st,uid)+g(126,84,7,st,uid)}
      if(v===3){for(let a=200;a<=340;a+=20){const r=a*Math.PI/180;s+=`<circle cx="${(100+54*Math.cos(r)).toFixed(1)}" cy="${(122+44*Math.sin(r)*-1).toFixed(1)}" r="2.6" fill="${GEM[st]||"#fff"}" stroke="#9FB3C8" stroke-width=".5"/>`}}
    }else if(v%2){s+=`<rect x="80" y="70" width="40" height="22" rx="6" fill="${M}"/><text x="100" y="86" text-anchor="middle" font-family="Marcellus,serif" font-size="14" fill="rgba(0,0,0,.35)">K</text>`}
    return s}
  case"necklaces":{
    const A=[38,36],B=[100,200],C=[162,36];let s=`<path d="M38 36 Q100 200 162 36" fill="none" stroke="${M}" stroke-width="${v===3?3:4}"/>`;
    if(v===3)s+=`<path d="M46 36 Q100 222 154 36" fill="none" stroke="${M}" stroke-width="3"/>`;
    const n=v===1?13:17;
    for(let i=2;i<n-1;i++){const[x,y]=qpt(i/n,A,B,C);s+=v===0?`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="${M}"/>`:v===1?`<path d="M${x.toFixed(1)} ${y.toFixed(1)} l-5 6 l5 9 l5 -9z" fill="${M}"/>`+(i%2?g(x,y+8,4,st,uid):""):`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${M}"/>`}
    s+=`<path d="M100 118 q-18 14 0 46 q18 -32 0 -46z" fill="${M}"/>`+g(100,140,11,st==="none"?"none":st,uid);
    if(st==="none")s+=`<circle cx="100" cy="140" r="6" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/>`;
    return s}
  case"earrings":{
    let s="";for(const x of(xs||[66,134])){
      s+=`<path d="M${x} 30 q10 -8 8 6" fill="none" stroke="${M}" stroke-width="2.5"/><circle cx="${x}" cy="44" r="6" fill="${M}"/>`+g(x,44,5,st,uid);
      if(v===0)s+=`<path d="M${x} 50 v14" stroke="${M}" stroke-width="2"/><path d="M${x} 64 q-20 30 0 64 q20 -34 0 -64z" fill="${M}"/>`+g(x,100,10,st,uid);
      if(v===1)s+=`<path d="M${x} 50 v10" stroke="${M}" stroke-width="2"/><path d="M${x-26} 112 Q${x-22} 64 ${x} 60 Q${x+22} 64 ${x+26} 112 Z" fill="${M}"/><path d="M${x-26} 112 H${x+26}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>`+[...Array(7)].map((_,i)=>`<circle cx="${x-24+i*8}" cy="120" r="3" fill="${st==="pearl"?"url(#p"+uid+")":M}"/>`).join("")+g(x,88,7,st,uid);
      if(v===2)s+=`<circle cx="${x}" cy="94" r="34" fill="none" stroke="${M}" stroke-width="6"/>`;
      if(v===3)s+=`<path d="M${x} 50 v8" stroke="${M}" stroke-width="2"/><path d="M${x-28} 80 A28 28 0 0 0 ${x+28} 80 Q${x} 96 ${x-28} 80Z" fill="${M}"/>`+g(x,108,8,st,uid);
    }return s}
  case"bangles":{
    let s="";const n=v===2?3:v===3?2:1;
    for(let k=0;k<n;k++){const y=100+(k-(n-1)/2)*20;s+=`<ellipse cx="100" cy="${y}" rx="72" ry="30" fill="none" stroke="${M}" stroke-width="${n>1?9:16}"/>`}
    if(st!=="none"){for(let a=20;a<=160;a+=14){const r=a*Math.PI/180;s+=g(100+72*Math.cos(r),100+30*Math.sin(r)+(n>1?(n-1)*10:0),4,st,uid)}}
    else{for(let a=10;a<=170;a+=20){const r=a*Math.PI/180;s+=`<circle cx="${(100+72*Math.cos(r)).toFixed(1)}" cy="${(100+30*Math.sin(r)).toFixed(1)}" r="2.4" fill="rgba(0,0,0,.25)"/>`}}
    return s}
  case"bracelets":{
    let s=`<ellipse cx="100" cy="100" rx="68" ry="34" fill="none" stroke="${M}" stroke-width="2" opacity=".5"/>`;
    for(let a=0;a<360;a+=v===1?12:18){const r=a*Math.PI/180,x=100+68*Math.cos(r),y=100+34*Math.sin(r);
      s+=v===1&&st!=="none"&&a>0&&a<180?g(x,y,5,st,uid):`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${v===2?9:6}" ry="${v===2?5:4}" fill="none" stroke="${M}" stroke-width="3" transform="rotate(${a+90} ${x.toFixed(1)} ${y.toFixed(1)})"/>`}
    if(v===3)s+=`<path d="M100 134 l0 10" stroke="${M}" stroke-width="2"/><path d="M100 160 c-14 -10 -14 -20 0 -16 c14 -4 14 6 0 16z" fill="${M}"/>`;
    return s}
  case"pendants":{
    let s=`<path d="M58 22 L100 92 L142 22" fill="none" stroke="${M}" stroke-width="2" stroke-dasharray="3 2"/><circle cx="100" cy="96" r="5" fill="none" stroke="${M}" stroke-width="3"/>`;
    if(v===0)s+=`<path d="M100 172 C60 140 62 104 84 104 C94 104 100 112 100 118 C100 112 106 104 116 104 C138 104 140 140 100 172Z" fill="${M}"/>`+g(100,132,12,st,uid);
    if(v===1)s+=`<path d="M100 102 q-34 40 0 76 q34 -36 0 -76z" fill="${M}"/>`+g(100,146,13,st,uid);
    if(v===2)s+=`<polygon points="100,102 132,120 132,156 100,174 68,156 68,120" fill="${M}"/><text x="100" y="150" text-anchor="middle" font-family="Marcellus,serif" font-size="30" fill="rgba(0,0,0,.3)">K</text>`+g(100,112,5,st,uid);
    if(v===3)s+=`<path d="M128 112 A36 36 0 1 0 128 168 A28 28 0 1 1 128 112Z" fill="${M}"/>`+g(122,124,6,st,uid);
    return s}
  case"chains":{
    let s="";const A=[24,52],B=[80,190],C=[124,10],D=[178,150],n=v===2?22:30;
    for(let i=0;i<=n;i++){const[x,y]=cpt(i/n,A,B,C,D),[x2,y2]=cpt(Math.min(1,(i+.5)/n),A,B,C,D);const ang=Math.atan2(y2-y,x2-x)*180/Math.PI;
      s+=v===2?`<rect x="${(x-7).toFixed(1)}" y="${(y-4.5).toFixed(1)}" width="14" height="9" rx="4.5" fill="none" stroke="${M}" stroke-width="3.4" transform="rotate(${ang.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`:`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="3.4" fill="none" stroke="${M}" stroke-width="2.6" transform="rotate(${(ang+(i%2?60:-30)).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`}
    s+=`<rect x="172" y="146" width="14" height="8" rx="3" fill="${M}"/>`;return s}
  case"anklets":{
    let s=`<path d="M26 80 Q100 160 174 80" fill="none" stroke="${M}" stroke-width="3"/>`;
    for(let i=1;i<10;i++){const[x,y]=qpt(i/10,[26,80],[100,160],[174,80]);s+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)} v8" stroke="${M}" stroke-width="1.5"/><circle cx="${x.toFixed(1)}" cy="${(y+12).toFixed(1)}" r="4.5" fill="${M}"/>`+(st!=="none"&&i%3===0?g(x,y,4,st,uid):"")}
    return s}
  case"nosepins":{
    let s=`<path d="M100 120 v40" stroke="${M}" stroke-width="3"/>`;
    if(v%2){s+=`<circle cx="100" cy="100" r="44" fill="none" stroke="${M}" stroke-width="5"/>`+[...Array(9)].map((_,i)=>{const a=(200+i*16)*Math.PI/180;return`<circle cx="${(100+44*Math.cos(a)).toFixed(1)}" cy="${(100-44*Math.sin(a)*-1).toFixed(1)}" r="3.5" fill="${st==="pearl"?"url(#p"+uid+")":M}"/>`}).join("")+g(100,56,9,st,uid)}
    else{for(let a=0;a<360;a+=45){const r=a*Math.PI/180;s+=`<circle cx="${(100+20*Math.cos(r)).toFixed(1)}" cy="${(100+20*Math.sin(r)).toFixed(1)}" r="9" fill="${M}"/>`}s+=g(100,100,13,st==="none"?"cz":st,uid)}
    return s}
  case"sets":{
    return`<g transform="translate(25,0) scale(.75)">${drawType("necklaces",v%3,st,M,uid)}</g><g transform="translate(0,62)">${drawType("earrings",v===1?1:0,st,M,uid,[28,172])}</g>`}
  case"coins":{
    if(v%2===0)return`<circle cx="100" cy="100" r="66" fill="${M}"/><circle cx="100" cy="100" r="56" fill="none" stroke="rgba(0,0,0,.22)" stroke-width="2"/><circle cx="100" cy="100" r="62" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.5" stroke-dasharray="2 3"/><text x="100" y="98" text-anchor="middle" font-family="Marcellus,serif" font-size="34" fill="rgba(0,0,0,.32)">KJ</text><text x="100" y="124" text-anchor="middle" font-family="Figtree,sans-serif" font-size="12" font-weight="700" fill="rgba(0,0,0,.32)">999.9</text>`;
    return`<rect x="62" y="34" width="76" height="132" rx="8" fill="${M}"/><rect x="70" y="42" width="60" height="116" rx="5" fill="none" stroke="rgba(0,0,0,.2)" stroke-width="1.5"/><text x="100" y="90" text-anchor="middle" font-family="Marcellus,serif" font-size="26" fill="rgba(0,0,0,.32)">KJ</text><text x="100" y="114" text-anchor="middle" font-family="Figtree,sans-serif" font-size="11" font-weight="700" fill="rgba(0,0,0,.32)">FINE GOLD</text><text x="100" y="130" text-anchor="middle" font-family="Figtree,sans-serif" font-size="11" font-weight="700" fill="rgba(0,0,0,.32)">999.9</text>`}
  case"cufflinks":{
    let s="";for(const [x,y] of[[72,86],[128,116]]){s+=`<rect x="${x-10}" y="${y+24}" width="20" height="6" rx="3" fill="${M}"/><path d="M${x} ${y+20} v6" stroke="${M}" stroke-width="4"/>`+(v%2?`<circle cx="${x}" cy="${y}" r="24" fill="${M}"/><circle cx="${x}" cy="${y}" r="17" fill="none" stroke="rgba(0,0,0,.2)" stroke-width="1.5"/>`:`<rect x="${x-22}" y="${y-22}" width="44" height="44" rx="8" fill="${M}"/><rect x="${x-15}" y="${y-15}" width="30" height="30" rx="4" fill="none" stroke="rgba(0,0,0,.2)" stroke-width="1.5"/>`)+(st!=="none"?g(x,y,9,st,uid):`<text x="${x}" y="${y+7}" text-anchor="middle" font-family="Marcellus,serif" font-size="20" fill="rgba(0,0,0,.3)">K</text>`)}
    return s}
  }return""}

export function artSvg(type: string, metal: string, stone: string, v = 0): string {
  if (!METAL[metal]) metal = "yellow";
  if (!["rings","necklaces","earrings","bangles","bracelets","pendants","chains","anklets","nosepins","sets","coins","cufflinks"].includes(type)) type = "pendants";
  if (!GEM[stone]) stone = "none";
  // Deterministic id: identical server/client output, and identical art shares one gradient safely.
  const uid = `${type}-${metal}-${stone}-${v % 4}`;
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs>${grad(uid, metal)}</defs>${drawType(type, v % 4, stone, `url(#m${uid})`, uid)}</svg>`;
}

/** "pendants:2" → drawing type and variant. */
export function parseArt(spec: string, fallbackVariant = 0): [string, number] {
  const [type, v] = (spec || "pendants").split(":");
  return [type, v ? Number(v) : fallbackVariant];
}

/** Drawing for each design category. */
export const CATEGORY_ART: Record<string, string> = { "name-jewellery": "pendants", rings: "rings", bangles: "bangles", earrings: "earrings", pendants: "pendants", sets: "sets", men: "chains" };
