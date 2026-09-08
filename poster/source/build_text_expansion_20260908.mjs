import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const baseDir = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(process.env.POSTER_OUTPUT_DIR || path.join(baseDir, 'rendered'));
await fs.mkdir(dir, {recursive:true});
const copy = JSON.parse(await fs.readFile(path.join(baseDir, 'POSTER_COPY.json'), 'utf8'));
if (!process.env.POSTER_SOURCE_ROOT) throw new Error('Set POSTER_SOURCE_ROOT to the original Week 1 source tree.');
const week = path.resolve(process.env.POSTER_SOURCE_ROOT);
const old = path.join(week, '最终成品图', 'W1 Team Poster Draft');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const sharp = require('sharp');
const browserPath = process.env.POSTER_BROWSER_EXECUTABLE;
const W = 4960, H = 3600, PW = 2320, PH = 1305;
const PAGE_MM = 1189;
const FONT = 'Comic Sans MS';
const C = { blue:'#52748B', dark:'#365866', mid:'#4D8DA4', pale:'#ADD8E2', teal:'#2A9D8F', ink:'#294052', muted:'#718393', grid:'#D9E5EA', wash:'#F7FAFB', tealWash:'#EAF6F5', white:'#FFFFFF' };
const F = { title:72, panel:49, stat:72, sub:35, body:35, label:29, note:27, source:25, cell:25 };
const sourceFiles = {
  trade:path.join(week,'sucai','Qin Tian - China E-commerce Growth and Global Trade Evidence','Source_Code','data','china_cbec_trade_2018_2024_verified.csv'),
  rcep:path.join(week,'sucai','Qin Tian - China E-commerce Growth and Global Trade Evidence','Source_Code','data','rcep_trade_potential_by_country_year.csv'),
  shoppers:path.join(baseDir,'data','ipc_purchase_origins_2016_2023.csv'),
  global:path.join(week,'sucai','组员绘图任务包','04_cuiocuio_global_impact','sources','UNCTAD_business_ecommerce_sales_online_platforms_2024.pdf'),
};
const urls = {
 trade:'https://fms.mofcom.gov.cn/xxfb/art/2025/art_3aeb2e47113845bdb16dcb053e5f6e9d.html',
 shoppers:'https://www.aof.org.hk/docs/default-source/hkimr/conference-workshop/panel-2_1_irina-fan.pdf',
 ipc:'https://www.ipc.be/news-portal/general-news/2024/01/11/12/46/ipc-cross-border-e-commerce-shopper-survey-shows-more-positive-mindset-among-online-consumers',
 rcep:'https://doi.org/10.1057/s41599-026-07267-z',
 global:'https://unctad.org/system/files/official-document/dtlecde2024d3_en.pdf',
 code:'https://github.com/hansu650/ice-week1-ecommerce-poster',
};

function esc(s) { return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll('$','&#36;'); }
function hash(s) { return createHash('sha256').update(s).digest('hex'); }
function csvRows(s) {
  return s.trim().split(/\r?\n/).map(line=>{
    const out=[]; let item='', quote=false;
    for(let i=0;i<line.length;i++) { const c=line[i]; if(c==='"') { if(quote&&line[i+1]==='"'){item+='"';i++;}else quote=!quote; }else if(c===','&&!quote){out.push(item);item='';}else item+=c; }
    out.push(item); return out;
  });
}
function root(body,w,h,id) { return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}_title"><title id="${id}_title">${esc(id.replaceAll('_',' '))}</title><rect width="${w}" height="${h}" fill="${C.white}"/>${body}</svg>`; }
function text(x,y,s,size=F.body,fill=C.ink,weight='normal',attrs='') { return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" fill="${fill}" font-weight="${weight}" ${attrs}>${esc(s)}</text>`; }
function rect(x,y,w,h,fill=C.white,stroke='none',r=0,attrs='') { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="2" rx="${r}" ${attrs}/>`; }
function line(x1,y1,x2,y2,color=C.grid,width=2,attrs='') { return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${attrs}/>`; }
function group(body,id,attrs='') { return `<g id="${id}" ${attrs}>${body}</g>`; }
function cleanSvg(raw) {
  const m=raw.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/i); if(!m)throw new Error('Invalid SVG');
  return {viewBox:m[1].match(/viewBox="([^"]+)"/)?.[1],body:m[2]};
}
function prefix(raw,p) { const ids=[...raw.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]); for(const id of ids) {raw=raw.replaceAll(`id="${id}"`,`id="${p}${id}"`).replaceAll(`url(#${id})`,`url(#${p}${id})`).replaceAll(`href="#${id}"`,`href="#${p}${id}"`);}return raw; }
function existingGroup(raw,attr,value) {
  const start=raw.indexOf(`<g ${attr}="${value}"`); if(start<0)throw new Error('Missing original group '+value);
  const re=/<\/?g\b[^>]*>/g; re.lastIndex=start; let depth=0,m;
  while((m=re.exec(raw))) {depth+=m[0].startsWith('</')?-1:1; if(depth===0)return raw.slice(start,re.lastIndex);} throw new Error('Unclosed group');
}
function mix(a,b,t) {const n=v=>[1,3,5].map(i=>parseInt(v.slice(i,i+2),16));const x=n(a),y=n(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('');}

const browser=await chromium.launch({headless:true,executablePath:browserPath});
const measure=await browser.newPage();
await measure.setContent('<!doctype html><html><body></body></html>');
const fontOK=await measure.evaluate(()=>document.fonts.check('35px "Comic Sans MS"'));
if(!fontOK)throw new Error('Required font unavailable');
const paragraphs=[];
const photoManifest=[];
async function contextPhoto(id,file,url,caption,options={}) {
  const original=await fs.readFile(file), metadata=await sharp(original).metadata();
  const {x=1450,y=175,w=800,h=500,captionSize=25,focus='xMidYMid'}=options;
  photoManifest.push({id,file,url,sha256:hash(original),width:metadata.width,height:metadata.height,embeddedBytes:'original JPEG, no re-encoding',purpose:caption,placement:{x,y,width:w,height:h}});
  const body=`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" overflow="hidden"><image data-context-photo="${id}" x="0" y="0" width="${w}" height="${h}" href="data:image/jpeg;base64,${original.toString('base64')}" preserveAspectRatio="${focus} slice"/></svg>`;
  return body+(await para(x,y+h+48,w,caption,captionSize,C.muted,'normal',id+'_caption',Math.round(captionSize*1.4))).body;
}
async function para(x,y,width,s,size=F.body,color=C.ink,weight='normal',id='p',leading=Math.round(size*1.43)) {
  const lines=await measure.evaluate(({s,width,size,weight,FONT})=>{
    const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');ctx.font=`${weight} ${size}px "${FONT}"`;
    const out=[]; for(const block of s.split('\n')) {let current='';for(const word of block.split(/\s+/)){const next=current?current+' '+word:word;if(current&&ctx.measureText(next).width>width){out.push(current);current=word;}else current=next;} if(current)out.push(current);}return out;
  },{s,width,size,weight,FONT});
  paragraphs.push({id,text:s,lines,width,x,y,fontSize:size,leading,height:lines.length*leading});
  return {body:group(lines.map((s,i)=>text(x,y+i*leading,s,size,color,weight,'data-text-line="true"')).join(''),id,`data-paragraph="${id}" data-right="${x+width}"`),bottom:y+(lines.length-1)*leading+size*.3};
}
async function explanation(blocks,id) {
  let body='', y=200; const x=1385,width=865;
  for(let i=0;i<blocks.length;i++) {
    const b=blocks[i];body+=text(x,y,b.heading,34,C.dark,'bold');y+=52;
    const p=await para(x,y,width,b.text,32,C.ink,'normal',`${id}_explain_${i}`,42);
    if(p.bottom>1175)throw new Error(`${id} explanation too tall: ${p.bottom}`);
    body+=p.body;y=p.bottom+43;
  }
  return body;
}
function panelFrame(n,title) {
  return rect(0,0,PW,118,C.tealWash,'none',14)
    + rect(0,16,9,86,C.teal,'none',4)
    + text(55,77,String(n).padStart(2,'0'),43,C.teal,'bold')
    + text(163,77,title,F.panel,C.dark,'bold')
    + line(1335,170,1335,1170,C.grid,2);
}
async function sources(body,s,url,id) {
  body+=line(65,1195,2255,1195,C.grid,2);
  const p=await para(65,1240,2190,s,F.source,C.muted,'normal',`${id}_source`,34);
  if(p.bottom>PH-16)throw new Error(id+' source overflows');
  return body+`<a href="${esc(url)}" target="_blank">${p.body}</a>`;
}

const tr=csvRows(await fs.readFile(sourceFiles.trade,'utf8'));
const trade=tr.slice(1).map(r=>({year:+r[0],total:+r[1]/10000,exports:+r[2]/10000,imports:+r[3]/10000}));
if(trade.length!==7||trade[0].year!==2018||trade.at(-1).total!==2.7072)throw new Error('Trade input changed');
const start=trade[0],end=trade.at(-1),delta=end.total-start.total,exDelta=end.exports-start.exports,imDelta=end.imports-start.imports;
const exportContribution=100*exDelta/delta;
const rr=csvRows(await fs.readFile(sourceFiles.rcep,'utf8'));
const rcepYears=rr[0].slice(1,11);
const fullNames={JPN:'Japan',NZL:'New Zealand',LAO:'Laos',KOR:'South Korea',AUS:'Australia',SGP:'Singapore',MYS:'Malaysia',IDN:'Indonesia',VNM:'Vietnam',THA:'Thailand',PHL:'Philippines'};
const rcep=rr.slice(1).map(r=>({code:r[0],name:fullNames[r[0]],values:r.slice(1,11).map(Number),mean:+r[11],category:r[12]}));
if(rcep.length!==11)throw new Error('RCEP input changed');
const shoppers=csvRows(await fs.readFile(sourceFiles.shoppers,'utf8'));
if(+shoppers.find(r=>r[0]==='2016')[1]!==26||+shoppers.find(r=>r[0]==='2023')[1]!==37)throw new Error('Shopper input changed');
const panelBodies={};

// Module 1: the original verified series, with the two growth components.
{
 let b=panelFrame(1,'TRADE GROWTH IS LED BY EXPORTS');
 b+=text(72,191,'Cross-border e-commerce trade',F.sub,C.dark,'bold');
 b+=text(72,239,'China · 2018–2024 · RMB trillion',F.note,C.muted);
 const x=170,y=311,w=1130,h=500,sy=v=>y+h-v/3*h,sx=i=>x+i*w/6;
 for(let tick=0;tick<=3;tick+=.5){const yy=sy(tick);b+=line(x,yy,x+w,yy,C.grid,2,'stroke-dasharray="6 7"')+text(x-21,yy+10,tick.toFixed(1),27,C.muted,'normal','text-anchor="end"');}
 const area=(top,low)=>'M '+top.map(p=>p.join(',')).join(' L ')+' L '+[...low].reverse().map(p=>p.join(',')).join(' L ')+' Z';
 const base=trade.map((r,i)=>[sx(i),sy(0)]),imports=trade.map((r,i)=>[sx(i),sy(r.imports)]),total=trade.map((r,i)=>[sx(i),sy(r.total)]);
 b+=`<path d="${area(imports,base)}" fill="${C.pale}"/><path d="${area(total,imports)}" fill="${C.teal}" opacity=".88"/><polyline points="${total.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${C.dark}" stroke-width="6"/>`;
 trade.forEach((r,i)=>{b+=text(sx(i),y+h+48,r.year,29,C.ink,'normal','text-anchor="middle"')+`<circle cx="${sx(i)}" cy="${sy(r.total)}" r="7" fill="${C.dark}"/>`;});
 b+=text(sx(0)+20,sy(start.total)-24,'1.06',33,C.dark,'bold')+text(sx(6)-8,sy(end.total)-25,'2.71',33,C.dark,'bold','text-anchor="end"');
 b+=text(910,615,'Exports',35,C.white,'bold')+text(890,770,'Imports',30,C.dark,'bold');
 b+=text(72,918,'A slower growth rate still means expansion',32,C.dark,'bold');
 b+=(await para(72,970,1240,copy.trade_chart_role,31,C.ink,'normal','trade_chart_role',42)).body;
 b=group(b,'china_trade_chart','data-chart="china_trade" data-observations="7"');
 b+=await explanation(copy.trade,'trade');
 panelBodies.trade=await sources(b,'Source [1]: Ministry of Commerce (2025), Table 11, p. 62; China Customs data. Calculations use published values in RMB 100 million, before conversion to rounded trillion labels. Service interpretation also draws on UNCTAD [5].',urls.trade,'trade');
}

// Module 2: all eight published survey observations, without interpolation.
{
 let b=panelFrame(2,'CHINA-ORIGIN PURCHASE SHARE REBOUNDS TO 37%');
 b+=text(72,191,'Origin of the latest cross-border purchase',F.sub,C.dark,'bold');
 b+=text(72,239,'Share of surveyed shoppers reporting China (%)',F.note,C.muted);
 const x=190,y=330,w=1050,h=355,sy=v=>y+h-v/40*h;
 for(const tick of [0,10,20,30,40]){b+=line(x,sy(tick),x+w,sy(tick),C.grid,2,'stroke-dasharray="6 7"')+text(x-24,sy(tick)+10,tick+'%',28,C.muted,'normal','text-anchor="end"');}
 const observed=shoppers.slice(1).map(r=>({year:+r[0],share:+r[1]}));
 if(observed.length!==8)throw new Error('Expected eight published IPC observations');
 const sx=i=>x+70+i*(w-140)/7;
 b+=`<polyline points="${observed.map((r,i)=>`${sx(i)},${sy(r.share)}`).join(' ')}" fill="none" stroke="${C.teal}" stroke-width="7"/>`;
 observed.forEach((r,i)=>{
   b+=`<circle cx="${sx(i)}" cy="${sy(r.share)}" r="11" fill="${i===7?C.teal:C.white}" stroke="${C.teal}" stroke-width="5"/>`;
   b+=text(sx(i),sy(r.share)-31,r.share+'%',i===0||i===7?43:31,i===7?C.teal:C.dark,'bold','text-anchor="middle"');
   b+=text(sx(i),742,r.year,29,C.dark,'normal','text-anchor="middle"');
 });
 b+=text(73,825,'2016–2023: +11 percentage points',39,C.teal,'bold');
 b+=text(73,884,'The overall increase hides a reversal',32,C.dark,'bold');
 b+=(await para(73,936,1240,copy.consumer_trend,31,C.ink,'normal','consumer_trend',42)).body;
 b=group(b,'china_origin_chart','data-chart="china_origin" data-observations="8"');
 b+=await explanation(copy.consumer,'consumer');
 panelBodies.consumer=await sources(b,'Sources [2–3]: Fan / HKTDC (2024), slide 8; IPC (2024). Trend: 24 countries. Full 2023 survey: 32,510 frequent cross-border shoppers in 41 countries. All eight annual observations are published values.',urls.shoppers,'consumer');
}

// Module 3: all 110 original observations, with plain-language model interpretation.
{
 let b=panelFrame(3,'REGIONAL OPPORTUNITIES DIFFER');
 b+=text(72,191,'China and 11 RCEP partner markets',F.sub,C.dark,'bold');
 b+=text(72,239,'Allocated export proxy / model-implied exports',F.note,C.muted);
 const x=311,y=331,cw=99,ch=48;
 rcepYears.forEach((year,i)=>{b+=text(x+cw*(i+.5),y-26,year,25,C.ink,'normal','text-anchor="middle"');});
 rcep.forEach((row,j)=>{
   b+=text(x-23,y+ch*j+32,row.name,28,C.ink,'normal','text-anchor="end"');
   row.values.forEach((v,i)=>{const t=Math.max(0,Math.min(1,(v-.35)/(2.5-.35))),fill=mix(C.tealWash,C.teal,t);b+=rect(x+cw*i,y+ch*j,cw,ch,fill,C.white)+text(x+cw*(i+.5),y+ch*j+32,v.toFixed(2),25,v>1.55?C.white:C.ink,'normal','text-anchor="middle"');});
 });
 const ly=916,lx=313,lw=990;
 for(let i=0;i<50;i++)b+=rect(lx+lw*i/50,ly,lw/50+1,22,mix(C.tealWash,C.teal,i/49));
 for(const v of [.5,1,1.5,2,2.5])b+=text(lx+(v-.35)/(2.5-.35)*lw,ly+56,v.toFixed(1),25,C.muted,'normal','text-anchor="middle"');
 b+=text(70,1031,'Categories use 2013–2022 country averages:',28,C.dark,'bold');
 const cats=[['Below 0.8','More unused potential'],['0.8–1.2','Scope to develop'],['Above 1.2','New approaches needed']];
 cats.forEach((c,i)=>{const xx=70+i*416;b+=rect(xx,1061,395,90,i===0?C.tealWash:C.wash,C.grid,12)+text(xx+198,1097,c[0],29,C.dark,'bold','text-anchor="middle"')+text(xx+198,1134,c[1],25,C.ink,'normal','text-anchor="middle"');});
 b=group(b,'rcep_heatmap_chart','data-chart="rcep_heatmap" data-observations="110"');
 b+=await explanation(copy.rcep,'rcep');
 panelBodies.rcep=await sources(b,'Source [4]: Zhang and Asraf bin Abdullah (2026), Table 19. Groups use 2013–2022 averages. RCEP: Regional Comprehensive Economic Partnership. Bilateral exports are allocated proxies, not directly observed flows.',urls.rcep,'rcep');
}

// Module 4: keep the international context separate from Chinese cross-border totals.
{
 let b=panelFrame(4,'E-COMMERCE RELIES ON WIDER SUPPORT SERVICES');
 b+=text(72,191,'Business e-commerce in 43 economies',F.sub,C.dark,'bold');
 b+=text(72,239,'US$ trillion · includes domestic and B2B sales',F.note,C.muted);
 const x=183,y=327,w=1090,h=341,sy=v=>y+h-v/30*h;
 for(const tick of [0,10,20,30])b+=line(x,sy(tick),x+w,sy(tick),C.grid,2,'stroke-dasharray="6 7"')+text(x-24,sy(tick)+10,tick,28,C.muted,'normal','text-anchor="end"');
 const xs=[380,944],vs=[24.5,26.9];
 vs.forEach((v,i)=>{const xx=xs[i];b+=rect(xx-122,sy(v),244,y+h-sy(v),i?C.teal:C.pale)+text(xx,sy(v)-23,i?'≈27':'≈25',49,i?C.teal:C.dark,'bold','text-anchor="middle"')+text(xx,719,i?'2022*':'2021',32,C.dark,'bold','text-anchor="middle"');});
 b+=text(665,488,'≈10%',51,C.dark,'bold','text-anchor="middle"')+text(665,529,'reported rise',27,C.muted,'normal','text-anchor="middle"');
 b+=text(71,775,'Reading the estimates carefully',28,C.dark,'bold');
 b+=(await para(71,815,1250,'Both years include estimated components. The 2022 business-sales total is indicative: about one third of the total is estimated.',26,C.muted,'normal','global_estimates',35)).body;
 b=group(b,'business_sales_chart','data-chart="business_sales" data-observations="2"');
 let platformBody=text(72,915,'37 major online platforms · partial coverage',32,C.dark,'bold');
 const bx=238,basey=968,maxw=1030;
 for(const [i,v] of [2.6,4.0].entries()) {const yy=basey+i*96;platformBody+=text(193,yy+37,i?'2021':'2019',31,C.ink,'normal','text-anchor="end"')+rect(bx,yy,maxw*v/4.4,55,i?C.teal:C.pale)+text(bx+maxw*v/4.4+18,yy+38,'≈'+v.toFixed(1)+'T',32,i?C.teal:C.dark,'bold');}
 platformBody+=text(72,1167,'US$ transaction value · ≈55% rise reported by UNCTAD',27,C.muted);
 b+=group(platformBody,'platform_sales_chart','data-chart="platform_sales" data-observations="2"');
 b+=await explanation(copy.global,'global');
 panelBodies.global=await sources(b,'Source [5]: UNCTAD (2024), pp. 3–4 and 31–32. Rounded figures and source-reported growth rates. The 43-economy total includes domestic and B2B sales; 2022 is indicative. Platform coverage is partial. CC BY 3.0 IGO.',urls.global,'global');
}

await fs.mkdir(path.join(dir,'modules'),{recursive:true});
const moduleMeta=[];
for(const [index,[id,body]] of Object.entries(panelBodies).entries()) {
  const stem=`${String(index+1).padStart(2,'0')}_${id}`;
  const svg=root(body,PW,PH,stem);
  await fs.writeFile(path.join(dir,'modules',stem+'.svg'),svg);
  moduleMeta.push({id,stem,file:`modules/${stem}.svg`,sha256:hash(svg),width:PW,height:PH,aspectRatio:'16:9',vector:true,source:sourceFiles[id==='consumer'?'shoppers':id],transform:id==='rcep'?'Table 19 values; rows unchanged; two-decimal display':id==='trade'?'RMB 100 million divided by 10000; growth decomposition from endpoints':id==='consumer'?'Eight published annual observations from HKTDC slide 8; no interpolation; percentage-point changes':'Source-reported approximate international totals and rates; scope explicitly labelled'});
}

// Assemble standalone module SVG bodies without rasterisation or stretching.
const logos={};
for(const [name,file] of [['hubu','Hubei_University_crest.svg'],['mmu','Manchester_Met_official_landscape.svg']])logos[name]=cleanSvg(prefix(await fs.readFile(path.join(old,'assets','logos',file),'utf8'),'new_'+name+'_'));
const oldSvg=await fs.readFile(path.join(old,'W1_Layout_A_Integrated_Final_4960.svg'),'utf8');
let masthead=existingGroup(oldSvg,'id','masthead');
masthead=prefix(masthead,'legacy_header_');
const qr=cleanSvg(prefix(await fs.readFile(path.join(old,'assets','qr','github_repo_qr.svg'),'utf8'),'new_qr_'));
let poster=rect(40,24,W-80,269,C.tealWash,'none',18);
poster+=text(W/2,117,'THE CHINA E-COMMERCE EFFECT',F.title,C.dark,'bold','text-anchor="middle"');
poster+=text(W/2,180,'China’s cross-border e-commerce growth and its links to global industry',36,C.mid,'bold','text-anchor="middle"');
poster+=text(W/2,235,'SILKLINK FOUR  ·  Tian Qin · Jiacheng Tao · Yikai Wang · Peitong Song',31,C.ink,'bold','text-anchor="middle"');
poster+=`<svg data-school-logo="hubu" data-color-exempt="logo" x="118" y="81" width="150" height="150" viewBox="${logos.hubu.viewBox}">${logos.hubu.body}</svg>`;
poster+=`<svg data-school-logo="mmu" data-color-exempt="logo" x="4330" y="88" width="484" height="143" viewBox="${logos.mmu.viewBox}">${logos.mmu.body}</svg>`;
// Preserve the four original Wuhan/Manchester identity marks as small header elements.
const cityIcons=[['yellow-crane-tower','469 194 249 183',349,85,167,145],['hot-dry-noodles','811 195 190 190',575,85,145,145],['manchester-mill','3581 200 231 190',3818,91,173,141],['manchester-bee','3903 199 188 181',4055,88,151,145]];
for(const [id,viewBox,x,y,w,h] of cityIcons) {const icon=existingGroup(oldSvg,'data-cultural-icon',id);poster+=`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${viewBox}" overflow="visible" data-color-exempt="logo">${prefix(icon,'city_'+id+'_')}</svg>`;}
const intro='China’s e-commerce connects online shopping with international trade. Four views explain how trade has grown, how shoppers’ purchase origins changed, why overseas markets differ and how wider services support an order.';
poster+=(await para(124,348,2380,intro,34,C.ink,'normal','introduction',47)).body;
let readingRoute='<path d="M 2760 350 C 3230 305, 3420 393, 3820 350 S 4470 315, 4760 350" fill="none" stroke="'+C.pale+'" stroke-width="4"/>';
const route=[['01','TRADE',2760,350],['02','SHOPPERS',3405,350],['03','MARKETS',4090,336],['04','SERVICES',4760,350]];
for(const [n,label,x,y] of route){readingRoute+='<circle cx="'+x+'" cy="'+y+'" r="22" fill="'+C.tealWash+'" stroke="'+C.teal+'" stroke-width="2"/>'+text(x,y+9,n,24,C.dark,'bold','text-anchor="middle"')+text(x,412,label,23,C.dark,'bold','text-anchor="middle"');}
poster+=group(readingRoute,'reading_route');
const positions={trade:[1150,430],consumer:[1150,1505],rcep:[3030,430],global:[3030,1505]};
const columns=[['trade','consumer'],['rcep','global']];
const moduleWidth=1840,moduleHeight=moduleWidth*PH/PW;
for(let col=0;col<columns.length;col++) {
 let cb='';for(const id of columns[col]) {const [x,y]=positions[id];const body=prefix(panelBodies[id],'assembled_'+id+'_');cb+=`<g data-module="${id}" data-measure-role="card"><svg x="${x}" y="${y}" width="${moduleWidth}" height="${moduleHeight}" viewBox="0 0 ${PW} ${PH}">${body}</svg></g>`;}
 poster+=group(cb,'column_'+col,'data-measure-role="column"');
}
// Retain four approved context photographs below the expanded operational analysis.
let rail='',railY=481;
for(const [i,block] of copy.rail.entries()) {
  rail+=text(60,railY,block.heading,37,C.dark,'bold');
  const p=await para(60,railY+64,1030,block.text,32,C.ink,'normal','operational_context_'+i,44);
  rail+=p.body;railY=p.bottom+74;
}
const photoScope=await para(60,railY,1030,copy.photo_scope,27,C.muted,'normal','photo_scope',37);
rail+=photoScope.body;
const photoY=Math.max(1550,Math.ceil(photoScope.bottom+55));
if(photoY>1620)throw new Error('Operational analysis leaves too little photo space: '+photoY);
rail+=await contextPhoto('warehouse_stock',path.join(old,'assets','photos','warehouse_packages_pexels_6170414.jpg'),'https://www.pexels.com/photo/male-employee-through-a-shelf-6170414/','Stock and picking.',{x:60,y:photoY,w:495,h:320,captionSize:27});
rail+=await contextPhoto('last_mile_delivery',path.join(old,'assets','photos','last_mile_courier_pexels_6169135.jpg'),'https://www.pexels.com/photo/delivery-man-going-out-from-a-van-6169135/','Delivery to the buyer.',{x:595,y:photoY,w:495,h:320,captionSize:27});
rail+=await contextPhoto('online_payment',path.join(week,'sucai','Qin Tian - China E-commerce Growth and Global Trade Evidence','Images','consumer_online_payment_pexels_29205862.jpg'),'https://www.pexels.com/photo/online-shopping-with-credit-card-and-laptop-29205862/','Online payment.',{x:60,y:photoY+435,w:495,h:320,captionSize:27});
rail+=await contextPhoto('order_processing',path.join(week,'sucai','Qin Tian - China E-commerce Growth and Global Trade Evidence','Images','warehouse_team_pexels_6169653.jpg'),'https://www.pexels.com/photo/men-working-at-a-courier-service-6169653/','Order processing.',{x:595,y:photoY+435,w:495,h:320,captionSize:27});
poster+=group(rail,'operations_rail','data-measure-role="column"');

// Preserve the three approved analytical views. Their captions state distinct purposes.
const advancedFigures=[];
const advancedSpecs=[
 {id:'trade_mix',file:'A_2024_trade_mix_review.svg',x:60,title:'2024 TRADE MIX',oldTitle:'A · 2024 TRADE MIX',oldSub:'A compact donut plus four verified headline numbers',sub:'China cross-border e-commerce · composition in 2024',caption:'Exports represented 79.5% of the 2024 total, up 21.6 percentage points since 2018. The shift shows why overseas customers and the services needed to fulfil their orders are central to this trade pattern. Source [1].'},
 {id:'growth_waterfall',file:'B_growth_contribution_waterfall_review.svg',x:1680,title:'WHERE DID THE INCREASE COME FROM?',oldTitle:'B · WHO DROVE THE GROWTH?',oldSub:'Waterfall decomposition of the RMB 1.65T increase, 2018→2024',sub:'RMB trillion · contributions to the 2018–2024 increase',caption:'Exports contributed RMB 1.54 trillion of the RMB 1.65 trillion net increase; imports contributed RMB 0.11 trillion. The 93.3% export contribution identifies which component expanded, without identifying the causes of growth. Source [1].'},
 {id:'rcep_opportunity',file:'C_rcep_opportunity_map_review.svg',x:3300,title:'RCEP LEVEL AND CHANGE',oldTitle:'C · RCEP OPPORTUNITY MAP',oldSub:'2022 level × change since 2013 (n=11); marker shape = 2013–2022 mean group',sub:'2022 proxy/model ratio and change since 2013 · 11 partners',caption:'Thailand rose from 1.335 to 2.453; Japan changed from 0.653 to 0.690. The scatter compares 2022 levels with changes since 2013. A rising ratio is not a sales growth rate; the heatmap shows the intervening years. Source [4].'},
];
for(const spec of advancedSpecs) {
 const file=path.join(old,'Mini_Figure_Review_Round_3',spec.file);
 let raw=await fs.readFile(file,'utf8');
 raw=raw.replace(spec.oldTitle,esc(spec.title)).replace(spec.oldSub,esc(spec.sub));
 if(spec.id==='trade_mix') {
  raw=raw.replace('x="340" y="320"','x="340" y="290"').replace('x="340" y="387"','x="340" y="400"').replace('x="340" y="428"','x="340" y="452"');
 }
 const block=cleanSvg(prefix(raw,'advanced_'+spec.id+'_'));
 const output='advanced_'+spec.id+'.svg';await fs.writeFile(path.join(dir,'modules',output),raw);
 advancedFigures.push({id:spec.id,source:file,sourceSha256:hash(await fs.readFile(file)),file:'modules/'+output,sha256:hash(raw),purpose:copy.advanced[spec.id]});
 poster+=`<g data-module="advanced_${spec.id}" data-chart="${spec.id}"><svg x="${spec.x+166}" y="2568" width="1218" height="528" viewBox="${block.viewBox}">${block.body}</svg>`;
 poster+=(await para(spec.x+18,3118,1505,copy.advanced[spec.id],27,C.ink,'normal','advanced_'+spec.id+'_explanation',36)).body+'</g>';
}
poster+=line(60,3250,4880,3250,C.teal,5);
poster+=text(60,3300,'CONCLUSION',39,C.dark,'bold');
const conclusion='China’s cross-border e-commerce trade expanded from 2018 to 2024 mainly through exports. Frequent shoppers in 24 trend countries reported a higher China-origin share of their latest cross-border purchases, while historical model ratios differed among 11 RCEP partners. Our interpretation is that overseas demand should be considered alongside local market conditions and order fulfilment. Platforms, payments, logistics and analytics connect this activity with wider industry. Firms can use these comparisons to investigate customers and service quality, while keeping trade values, survey responses and model estimates distinct.';
poster+=(await para(60,3350,4810,conclusion,31,C.ink,'normal','conclusion',42)).body;
const refs=[
 {n:1,s:'Ministry of Commerce (2025). China Digital Trade Development Report 2025. Table 11, p. 62.',url:urls.trade,x:65,y:3455,w:1460},
 {n:2,s:'Fan / HKTDC (2024). Digital Trade Transformation: Cross-Border E-commerce. Slide 8 (IPC data).',url:urls.shoppers,x:65,y:3520,w:1460},
 {n:3,s:'IPC (2024). Cross-Border E-commerce Shopper Survey 2023: findings and methodology. Release, 11 January 2024.',url:urls.ipc,x:1695,y:3455,w:1460},
 {n:4,s:'Zhang and Asraf bin Abdullah (2026). China’s cross-border e-commerce exports under RCEP. HSS Communications 13, 941. DOI 10.1057/s41599-026-07267-z.',url:urls.rcep,x:1695,y:3500,w:1460},
 {n:5,s:'UNCTAD (2024). Business e-commerce sales and the role of online platforms. Technical Notes on ICT for Development No. 1, pp. 3–4, 31–32.',url:urls.global,x:3325,y:3455,w:1190},
];
let footer=line(60,3417,4880,3417,C.grid,2)+text(65,3450,'REFERENCES  ·  Click a source or scan for data and code',23,C.mid,'bold');
footer+=text(1620,3450,'PHOTO CREDITS · PEXELS',21,C.mid,'bold');
const credits=[['6170414','warehouse_stock'],['6169135','last_mile_delivery'],['29205862','online_payment'],['6169653','order_processing']];
credits.forEach(([label,id],i)=>{const url=photoManifest.find(p=>p.id===id).url;footer+=`<a href="${esc(url)}">${text(1940+i*175,3450,label,21,C.muted)}</a>`;});
for(const r of refs) {const p=await para(r.x,r.y+28,r.w,`[${r.n}] ${r.s}`,21,C.muted,'normal','reference_'+r.n,29);footer+=`<a href="${esc(r.url)}" target="_blank">${p.body}</a>`;}
footer+=text(3325,3550,'GITHUB · DATA AND CODE',21,C.dark,'bold');
footer+=`<a href="${urls.code}" target="_blank">${text(3325,3582,urls.code,20,C.mid,'normal','text-decoration="underline"')}</a>`;
footer+=`<a href="${urls.code}"><svg x="4640" y="3437" width="220" height="148" viewBox="${qr.viewBox}" preserveAspectRatio="xMidYMid meet" data-qr="github">${qr.body}</svg></a>`;
poster+=group(footer,'references_footer','data-measure-role="footer"');
const posterSvg=root(poster,W,H,'China_ecommerce_teacher_feedback_text_expanded');
const stem='W1_Teacher_Feedback_Text_Expanded_4960';
await fs.writeFile(path.join(dir,stem+'.svg'),posterSvg);

function htmlFor(svg,w,h,widthMm,title) {
 const heightMm=widthMm*h/w;
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page { size: ${widthMm}mm ${heightMm}mm; margin:0; } :root { /* ===== DESIGN TOKENS ===== */ --accent:${C.blue};--gold:${C.teal};--text:${C.ink};--bg:${C.white};--font-sans:"Comic Sans MS",sans-serif;--fs-1:27px;--fs-2:35px;--fs-3:49px;--fs-4:72px; /* ===== END DESIGN TOKENS ===== */ } html,body{margin:0;padding:0;background:var(--bg);} .poster{width:${w}px;height:${h}px;overflow:hidden;} .poster>svg{display:block;width:100%;height:100%;} @media print{html,body,.poster{width:${widthMm}mm;height:${heightMm}mm;} *{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body><main class="poster" data-measure-role="poster">${svg}</main></body></html>`;
}
const renderReports=[];
async function render(svg,fileStem,w,h,widthMm) {
 const html=htmlFor(svg,w,h,widthMm,path.basename(fileStem));await fs.writeFile(fileStem+'.html',html);
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
 await page.goto(pathToFileURL(fileStem+'.html').href,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
 const diagnostics=await page.evaluate(({w,h})=>{
  const svg=document.querySelector('main>svg');const root=svg.getBoundingClientRect();
  const items=[...svg.querySelectorAll('text')].filter(n=>n.textContent.trim()).map(n=>{const r=n.getBoundingClientRect();return {text:n.textContent,x:r.x-root.x,y:r.y-root.y,width:r.width,height:r.height,line:n.hasAttribute('data-text-line'),panel:n.closest('[data-module]')?.getAttribute('data-module')??null,paragraph:n.closest('[data-paragraph]')?.getAttribute('data-paragraph')??null};});
  const outside=items.filter(r=>r.x<-.5||r.y<-.5||r.x+r.width>w+.5||r.y+r.height>h+.5);
  const overlaps=[];for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=items[i],b=items[j];const ox=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x),oy=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);if(ox>3&&oy>5)overlaps.push({a:a.text,b:b.text,overlapX:ox,overlapY:oy});}
  const paraOverflow=[...svg.querySelectorAll('[data-paragraph]')].flatMap(n=>{const b=n.getBBox(),right=Number(n.getAttribute('data-right'));return b.x+b.width>right+1?[{id:n.id,right,bboxRight:b.x+b.width}]:[];});
  const tinyText=items.filter(i=>i.height<14);
  const rasterImages=[...svg.querySelectorAll('image')].map(n=>({id:n.getAttribute('data-context-photo'),embedded:(n.getAttribute('href')||'').startsWith('data:image/'),box:n.getBoundingClientRect().toJSON()}));
  const imageTextOverlaps=[],photoClearances=[];
  for(const photo of rasterImages){let minimum=Infinity;for(const t of items){const b=photo.box,ox=Math.min(t.x+t.width,b.right-root.x)-Math.max(t.x,b.x-root.x),oy=Math.min(t.y+t.height,b.bottom-root.y)-Math.max(t.y,b.y-root.y);if(ox>3&&oy>3)imageTextOverlaps.push({photo:photo.id,text:t.text});if(ox>3){const dy=Math.max(t.y-(b.bottom-root.y),(b.y-root.y)-(t.y+t.height),0);minimum=Math.min(minimum,dy);}}photoClearances.push({id:photo.id,minVerticalTextGap:minimum});}
  return {root:{width:root.width,height:root.height},textCount:items.length,outside,overlaps,paraOverflow,tinyText,rasterImages,imageTextOverlaps,photoClearances,bodyText:svg.textContent,modules:[...svg.querySelectorAll('[data-module]')].map(n=>({id:n.getAttribute('data-module'),box:n.getBoundingClientRect().toJSON()}))};
 },{w,h});
 await page.screenshot({path:fileStem+'_full.png',fullPage:false});
 const previewWidth=w===W?2480:1740;
 await sharp(fileStem+'_full.png').resize({width:previewWidth}).png().toFile(fileStem+'_preview.png');
 await page.emulateMedia({media:'print'});
 await page.pdf({path:fileStem+'.pdf',width:widthMm+'mm',height:(widthMm*h/w)+'mm',printBackground:true,margin:{top:0,right:0,bottom:0,left:0},preferCSSPageSize:true});
 const printRoot=await page.evaluate(()=>document.querySelector('.poster').getBoundingClientRect().toJSON());
 diagnostics.printRoot=printRoot;delete diagnostics.bodyText;
 renderReports.push({stem:path.relative(dir,fileStem).replaceAll('\\','/'),...diagnostics});
 await page.close();return diagnostics;
}

for(const mod of moduleMeta) {await render(await fs.readFile(path.join(dir,mod.file),'utf8'),path.join(dir,'modules',mod.stem),PW,PH,PAGE_MM*PW/W);}
for(const fig of advancedFigures) {await render(await fs.readFile(path.join(dir,fig.file),'utf8'),path.join(dir,fig.file.replace('.svg','')),1500,650,PAGE_MM*1218/W);}
await render(posterSvg,path.join(dir,stem),W,H,PAGE_MM);
await fs.writeFile(path.join(dir,'poster.html'),htmlFor(posterSvg,W,H,PAGE_MM,stem));
await fs.writeFile(path.join(dir,'render_measurements.json'),JSON.stringify(renderReports,null,2));
await fs.writeFile(path.join(dir,'paragraph_layout.json'),JSON.stringify(paragraphs,null,2));
const manifest={generatedAt:new Date().toISOString(),canvas:{width:W,height:H,widthMm:PAGE_MM,heightMm:PAGE_MM*H/W},modules:moduleMeta,advancedFigures,sourceFiles:await Promise.all(Object.entries(sourceFiles).map(async([id,file])=>({id,file,sha256:hash(await fs.readFile(file))}))),sources:urls,style:{font:FONT,colors:C},rasterisation:'All charts, text and logos remain vector. The four main modules retain their exact 16:9 aspect ratio. Four approved photographs retain their original JPEG bytes.',tradeCalculations:{start:start.total,end:end.total,totalGrowthPct:100*(end.total/start.total-1),exportGrowthPct:100*(end.exports/start.exports-1),importGrowthPct:100*(end.imports/start.imports-1),exportDelta:exDelta,importDelta:imDelta,exportGrowthContributionPct:exportContribution,exportShare2024Pct:100*end.exports/end.total},photos:photoManifest,photoPolicy:'Four approved context photographs retained with functional captions; parcel sortation and order-entry photos removed. Photo credits and their clickable source links are consolidated in the footer.',reviewStatus:'pending',revisionScope:'Implemented the user-approved expanded prose, preserved all eight data charts and four 16:9 modules, and reduced six photos to four. The original canvas, palette, vector chart assembly, four source JPEG payloads, GitHub URL and QR are preserved.'};
await fs.writeFile(path.join(dir,'FIGURE_MANIFEST.json'),JSON.stringify(manifest,null,2));
await fs.writeFile(path.join(dir,'POSTER_STATE.json'),JSON.stringify({status:'in_progress',phase:'rendered',updatedAt:new Date().toISOString(),canvas:{width_cm:118.9,height_cm:PAGE_MM*H/W/10},design_decisions:{font:FONT,assembly:'four independent 16:9 vector modules',dimensions:'preserved from existing course poster',priorities:'teacher feedback, then highest assessment band',latestUserDirection:'User approved the expanded prose and eight-chart/four-photo plan on 2026-09-08. Keep the 300-word reflection and all other approved prose, synchronising only the photo count. Preserve the existing creator identity. Verify and update exactly three submission files, archiving their previous versions.'},sources:urls},null,2));
console.log(JSON.stringify({output:dir,modules:moduleMeta.map(m=>m.file),reports:renderReports.map(r=>({stem:r.stem,textCount:r.textCount,outside:r.outside.length,overlaps:r.overlaps.length,paragraphOverflow:r.paraOverflow.length,rasterImages:r.rasterImages.length}))},null,2));
await measure.close();await browser.close();
