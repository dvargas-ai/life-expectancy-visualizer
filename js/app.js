/* ============================================================
   app.js · Lógica de render e interactividad del visualizador
   ------------------------------------------------------------
   Depende de (cargar ANTES que este archivo):
     · js/data.js  -> REGIONS, STATUS, C, ROWS  (datos)
     · js/stats.js -> qcurso, boxStats, pearson, histParams...
   Librerias externas (por CDN en index.html):
     · Plotly.js 2.27  -> todos los graficos
     · KaTeX 0.16.9    -> formulas (auto-render al final del body)

   Estructura del archivo:
     1) Paleta y helpers de Plotly (PAL, ax, lay, rows)
     2) Un render<X>() por cada visualizacion (V1..V7 + KPIs)
     3) Orquestacion: renderAll / setYear
     4) Eventos (slider, play, toggle) + scrollspy + init
   ============================================================ */

/* ===== Paleta oscura y configuración común ===== */
var PAL={teal:'#2dd4bf',teal2:'#5eead4',cyan:'#38bdf8',amber:'#fbbf24',rose:'#fb7185',
  lime:'#a3e635',world:'#cbd5e1',head:'#eef2f8',text:'#c4cdda',muted:'#828d9e',
  grid:'rgba(148,163,184,.11)',line:'rgba(148,163,184,.28)',canvas:'#0e1218',
  reg:{'África':'#fbbf24','América':'#38bdf8','Asia':'#f472b6','Europa':'#34d399','Oceanía':'#a78bfa'},
  niv:{'Baja (<60)':'#fb7185','Media (60–70)':'#fbbf24','Alta (70–80)':'#2dd4bf','Muy alta (≥80)':'#38bdf8'}};
var NIVELES=['Baja (<60)','Media (60–70)','Alta (70–80)','Muy alta (≥80)'];
function nivel(v){return v<60?NIVELES[0]:v<70?NIVELES[1]:v<80?NIVELES[2]:NIVELES[3];}
var CFG={responsive:true,displayModeBar:'hover',displaylogo:false,
  modeBarButtonsToRemove:['lasso2d','select2d','autoScale2d']};
function ax(t){return {title:{text:t,font:{size:12}},gridcolor:PAL.grid,zeroline:false,
  linecolor:PAL.line,ticks:'outside',tickcolor:PAL.line};}
function lay(o){return Object.assign({paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',
  font:{family:'Inter, sans-serif',size:12.5,color:'#c4cdda'},margin:{l:56,r:18,t:10,b:48},
  hoverlabel:{bgcolor:'#0b0e14',font:{family:'Inter, sans-serif',size:12.5,color:'#eef2f8'},
  bordercolor:'rgba(148,163,184,.28)'},showlegend:false},o);}
function rows(y){var out=[],i,r,c;
  for(i=0;i<ROWS.length;i++){r=ROWS[i];if(r[1]===y){c=C[r[0]];
    out.push({name:c[0],reg:REGIONS[c[1]],st:STATUS[c[2]],le:r[2],sc:r[3]});}}
  return out;}
var state={year:2015,rank:'top',playing:false,timer:null};
var B2000=null; /* referencia del año 2000 para los subtítulos de KPIs */

/* ===== KPIs ===== */
function kpiCalc(y){var d=rows(y),le=d.map(function(o){return o.le});
  var dev=[],ing=[],sx=[],sy=[],i;
  for(i=0;i<d.length;i++){ (d[i].st==='Desarrollado'?dev:ing).push(d[i].le);
    if(d[i].sc!==null){sx.push(d[i].sc);sy.push(d[i].le);} }
  return {med:qcurso(le,.5),mn:mean(le),gap:qcurso(dev,.5)-qcurso(ing,.5),
          r:pearson(sx,sy),n:sx.length,d:d,le:le,dev:dev,ing:ing};}
function renderKPIs(y){var k=kpiCalc(y);
  document.getElementById('k-med').textContent=fmt(k.med,1)+' años';
  document.getElementById('k-med-sub').textContent='en 2000: '+fmt(B2000.med,1);
  document.getElementById('k-mean').textContent=fmt(k.mn,1)+' años';
  document.getElementById('k-mean-sub').textContent=(k.mn<k.med?'debajo de la mediana → asimetría izq.':'sobre la mediana');
  document.getElementById('k-gap').textContent=fmt(k.gap,2);
  document.getElementById('k-r').textContent=fmt(k.r,3);
  document.getElementById('k-r-sub').textContent='Pearson · n = '+k.n+' países';
  return k;}

/* ===== V1 · Histograma (regla k=⌈√n⌉ de la Unidad 1) ===== */
function renderHist(k){var p=histParams(k.le);
  Plotly.react('ch-hist',[{type:'histogram',x:k.le,
    xbins:{start:p.min,end:p.min+p.k*p.A+1e-9,size:p.A},
    marker:{color:PAL.teal,line:{color:PAL.canvas,width:1}},
    hovertemplate:'%{x} años<br><b>%{y}</b> países<extra></extra>'}],
  lay({xaxis:ax('Esperanza de vida (años)'),yaxis:ax('Países (frecuencia)'),bargap:0.02,
    annotations:[{xref:'paper',yref:'paper',x:0.98,y:0.97,xanchor:'right',showarrow:false,
      text:'n='+p.n+' · k=⌈√n⌉='+p.k+' · A='+fmt(p.A,1),
      font:{family:'JetBrains Mono, monospace',size:11,color:PAL.muted},
      bgcolor:'rgba(21,26,35,.92)',borderpad:3}]}),CFG);}

/* ===== V2 · Boxplot por estatus (cuartiles y cercas del curso) ===== */
function renderBox(y,k){
  var grupos=[['Desarrollado',k.dev,PAL.teal,'rgba(45,212,191,.12)'],
              ['En desarrollo',k.ing,PAL.rose,'rgba(251,113,133,.10)']];
  var traces=[],notas=[],i;
  for(i=0;i<grupos.length;i++){var g=grupos[i],B=boxStats(g[1]);
    traces.push({type:'box',x:[g[0]],q1:[B.q1],median:[B.q2],q3:[B.q3],
      lowerfence:[B.li],upperfence:[B.ls],mean:[B.mean],name:g[0],width:.45,
      line:{color:g[2],width:2.2},fillcolor:g[3],marker:{color:g[2]}});
    var outs=k.d.filter(function(o){return o.st===g[0]&&(o.le<B.lo||o.le>B.hi);});
    if(outs.length){
      traces.push({type:'scatter',mode:'markers',
        x:outs.map(function(){return g[0]}),y:outs.map(function(o){return o.le}),
        text:outs.map(function(o){return o.name}),
        marker:{color:g[2],size:9,symbol:'circle-open',line:{width:2,color:g[2]}},
        hovertemplate:'<b>%{text}</b>: %{y} años<extra>atípico</extra>'});
      notas.push(g[0]+' → '+outs.map(function(o){return o.name+' ('+fmt(o.le,1)+')'}).join(', '));}}
  Plotly.react('ch-box',traces,lay({yaxis:ax('Esperanza de vida (años)'),
    xaxis:{gridcolor:'rgba(0,0,0,0)',linecolor:PAL.line}}),CFG);
  document.getElementById('box-note').innerHTML = notas.length
    ? '<b>Atípicos en '+y+':</b> '+notas.join(' · ')+'. Pasa el cursor por la caja para ver Q1, mediana, Q3, cercas y media.'
    : '<b>Sin atípicos en '+y+':</b> todos los países caen dentro de las cercas. Pasa el cursor por la caja para ver Q1, mediana, Q3, cercas y media — y prueba 2010 para una sorpresa.';}

/* ===== V3 · Ranking top / bottom 10 ===== */
function renderRank(k){
  var d=k.d.slice().sort(function(a,b){return b.le-a.le});
  var sel=state.rank==='top'?d.slice(0,10):d.slice(-10).reverse();
  var names=sel.map(function(o){return o.name}),vals=sel.map(function(o){return o.le});
  Plotly.react('ch-rank',[{type:'bar',orientation:'h',y:names,x:vals,
    marker:{color:sel.map(function(o){return o.st==='Desarrollado'?PAL.teal:PAL.rose})},
    text:vals.map(function(v){return fmt(v,1)}),textposition:'outside',cliponaxis:false,
    textfont:{family:'JetBrains Mono, monospace',size:11.5,color:PAL.text},
    customdata:sel.map(function(o){return o.st}),
    hovertemplate:'<b>%{y}</b><br>%{x} años · %{customdata}<extra></extra>'}],
  lay({margin:{l:168,r:44,t:6,b:44},xaxis:Object.assign(ax('Esperanza de vida (años)'),
    {range:[Math.min.apply(null,vals)-4,Math.max.apply(null,vals)+2.4]}),
    yaxis:{autorange:'reversed',gridcolor:'rgba(0,0,0,0)'}}),CFG);}

/* ===== V4 · Dispersión escolaridad × esperanza + r ===== */
function renderScatter(y,k){
  var pts=k.d.filter(function(o){return o.sc!==null}),traces=[],ecu=null,i;
  var por={'Desarrollado':[],'En desarrollo':[]};
  for(i=0;i<pts.length;i++){por[pts[i].st].push(pts[i]);if(pts[i].name==='Ecuador')ecu=pts[i];}
  ['Desarrollado','En desarrollo'].forEach(function(st){var g=por[st];
    traces.push({type:'scatter',mode:'markers',name:st,showlegend:true,
      x:g.map(function(o){return o.sc}),y:g.map(function(o){return o.le}),
      text:g.map(function(o){return o.name}),
      marker:{color:st==='Desarrollado'?PAL.teal:PAL.rose,size:8.5,opacity:.82,
        line:{color:PAL.canvas,width:.6}},
      hovertemplate:'<b>%{text}</b><br>Escolaridad: %{x} años<br>Esperanza: %{y} años<extra>'+st+'</extra>'});});
  var ann=[{xref:'paper',yref:'paper',x:0.02,y:0.98,xanchor:'left',showarrow:false,
    text:'r = '+fmt(k.r,3)+' · n = '+k.n,
    font:{family:'JetBrains Mono, monospace',size:12,color:PAL.teal2},
    bgcolor:'rgba(45,212,191,.13)',bordercolor:'rgba(45,212,191,.4)',borderwidth:1,borderpad:5}];
  if(ecu){traces.push({type:'scatter',mode:'markers',name:'Ecuador',showlegend:false,
      x:[ecu.sc],y:[ecu.le],marker:{symbol:'star',size:18,color:PAL.lime,
      line:{color:PAL.canvas,width:1.4}},
      hovertemplate:'<b>Ecuador</b><br>Escolaridad: %{x} años<br>Esperanza: %{y} años<extra>★</extra>'});
    ann.push({x:ecu.sc,y:ecu.le,text:'<b>Ecuador</b>',ax:-46,ay:-32,
      font:{size:12,color:PAL.lime},arrowcolor:PAL.lime,arrowwidth:1.4,arrowsize:.8});}
  Plotly.react('ch-scatter',traces,lay({showlegend:true,
    legend:{orientation:'h',x:1,xanchor:'right',y:1.07,font:{size:12}},
    xaxis:ax('Escolaridad (años promedio)'),yaxis:ax('Esperanza de vida (años)'),
    annotations:ann}),CFG);}

/* ===== V5 · Barras apiladas 100 % región × nivel ===== */
function renderStack(k){
  var tot={},cnt={},i,rg,nv;
  for(i=0;i<REGIONS.length;i++){tot[REGIONS[i]]=0;cnt[REGIONS[i]]={};}
  for(i=0;i<k.d.length;i++){rg=k.d[i].reg;nv=nivel(k.d[i].le);
    tot[rg]++;cnt[rg][nv]=(cnt[rg][nv]||0)+1;}
  var traces=NIVELES.map(function(nv){
    return {type:'bar',name:nv,x:REGIONS,
      y:REGIONS.map(function(rg){return 100*(cnt[rg][nv]||0)/tot[rg]}),
      customdata:REGIONS.map(function(rg){return cnt[rg][nv]||0}),
      marker:{color:PAL.niv[nv],line:{color:PAL.canvas,width:1}},
      hovertemplate:'<b>%{x}</b> · %{customdata} países (%{y:.1f} %)<extra>'+nv+'</extra>'};});
  Plotly.react('ch-stack',traces,lay({barmode:'stack',showlegend:true,
    legend:{orientation:'h',x:0,y:1.14,font:{size:11}},
    xaxis:{linecolor:PAL.line,gridcolor:'rgba(0,0,0,0)'},
    yaxis:Object.assign(ax('% de países de la región'),{range:[0,100],ticksuffix:' %'})}),CFG);}

/* ===== V6 · Tabla resumen por región ===== */
function renderTable(y,k){
  var stats=REGIONS.map(function(rg){
    var v=k.d.filter(function(o){return o.reg===rg}).map(function(o){return o.le});
    return {rg:rg,n:v.length,prom:mean(v),q1:qcurso(v,.25),q2:qcurso(v,.5),q3:qcurso(v,.75)};})
    .sort(function(a,b){return b.q2-a.q2});
  var h='<table class="vtab"><thead><tr><th>Región</th><th style="text-align:right">n</th>'+
    '<th style="text-align:right">Prom.</th><th style="text-align:right">Q1</th>'+
    '<th style="text-align:right;color:#5eead4">Q2 · mediana</th><th style="text-align:right">Q3</th></tr></thead><tbody>';
  stats.forEach(function(s){
    h+='<tr><td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;'+
      'background:'+PAL.reg[s.rg]+';margin-right:8px"></span>'+s.rg+'</td>'+
      '<td class="num" style="text-align:right">'+s.n+'</td>'+
      '<td class="num" style="text-align:right">'+fmt(s.prom,2)+'</td>'+
      '<td class="num" style="text-align:right">'+fmt(s.q1,2)+'</td>'+
      '<td class="num" style="text-align:right;color:#2dd4bf;font-weight:700">'+fmt(s.q2,2)+'</td>'+
      '<td class="num" style="text-align:right">'+fmt(s.q3,2)+'</td></tr>';});
  document.getElementById('tbl-region').innerHTML=h+'</tbody></table>';}

/* ===== V7 · Líneas de medianas 2000–2015 + guía de año ===== */
var YEARS=[],LMUN=[],LDEV=[],LING=[];
function buildLine(){var y,d,dev,ing;
  for(y=2000;y<=2015;y++){d=rows(y);dev=[];ing=[];
    for(var i=0;i<d.length;i++)(d[i].st==='Desarrollado'?dev:ing).push(d[i].le);
    YEARS.push(y);LMUN.push(qcurso(d.map(function(o){return o.le}),.5));
    LDEV.push(qcurso(dev,.5));LING.push(qcurso(ing,.5));}
  function tr(ys,nm,col,w,dash){return {type:'scatter',mode:'lines+markers',name:nm,x:YEARS,y:ys,
    line:{color:col,width:w,dash:dash||'solid'},marker:{size:5.5,color:col},
    hovertemplate:'%{y} años<extra>'+nm+'</extra>'};}
  Plotly.newPlot('ch-line',[tr(LDEV,'Desarrollado',PAL.teal,2.6),
    tr(LMUN,'Mundo',PAL.world,2.2,'dash'),tr(LING,'En desarrollo',PAL.rose,2.6)],
  lay({showlegend:true,legend:{orientation:'h',x:0,y:1.12,font:{size:12}},hovermode:'x unified',
    xaxis:Object.assign(ax('Año'),{dtick:1,tickangle:0,tickfont:{size:10.5}}),
    yaxis:ax('Mediana de esperanza de vida (años)'),
    shapes:[{type:'line',x0:state.year,x1:state.year,yref:'paper',y0:0,y1:1,
      line:{color:'rgba(203,213,225,.45)',width:1.5,dash:'dot'}}]}),CFG);}
function lineGuide(y){Plotly.relayout('ch-line',{'shapes[0].x0':y,'shapes[0].x1':y});}

/* ===== Sparkline del hero (con glow) ===== */
function sparkline(){var s=document.getElementById('spark');if(!s)return;
  var W=320,H=64,P=7,mn=Math.min.apply(null,LMUN),mx=Math.max.apply(null,LMUN);
  function X(i){return P+i*(W-2*P)/(LMUN.length-1);}
  function Y(v){return H-P-(v-mn)*(H-2*P)/(mx-mn);}
  var pts=LMUN.map(function(v,i){return X(i)+','+Y(v)}).join(' ');
  s.innerHTML='<defs><filter id="glow" x="-20%" y="-40%" width="140%" height="180%">'+
    '<feGaussianBlur stdDeviation="2.4" result="b"></feGaussianBlur>'+
    '<feMerge><feMergeNode in="b"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter></defs>'+
    '<polyline points="'+pts+' '+X(LMUN.length-1)+','+(H-2)+' '+X(0)+','+(H-2)+
    '" fill="rgba(45,212,191,.14)" stroke="none"></polyline>'+
    '<polyline points="'+pts+'" fill="none" stroke="#2dd4bf" stroke-width="2.5" '+
    'stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"></polyline>'+
    '<circle cx="'+X(LMUN.length-1)+'" cy="'+Y(LMUN[LMUN.length-1])+'" r="4" fill="#fbbf24"></circle>';}

/* ===== Orquestación ===== */
function renderAll(y){var k=renderKPIs(y);renderHist(k);renderBox(y,k);renderRank(k);
  renderScatter(y,k);renderStack(k);renderTable(y,k);lineGuide(y);}
function setYear(y){state.year=y;document.getElementById('yr-num').textContent=y;
  document.getElementById('yr-range').value=y;renderAll(y);}

document.getElementById('yr-range').addEventListener('input',function(e){setYear(+e.target.value);});
document.getElementById('btn-top').addEventListener('click',function(){state.rank='top';
  this.classList.add('on');document.getElementById('btn-bottom').classList.remove('on');
  renderRank(kpiCalc(state.year));});
document.getElementById('btn-bottom').addEventListener('click',function(){state.rank='bottom';
  this.classList.add('on');document.getElementById('btn-top').classList.remove('on');
  renderRank(kpiCalc(state.year));});
var btnPlay=document.getElementById('btn-play');
btnPlay.addEventListener('click',function(){
  if(state.playing){clearInterval(state.timer);state.playing=false;btnPlay.textContent='▶';return;}
  state.playing=true;btnPlay.textContent='⏸';
  if(state.year>=2015)setYear(2000);
  state.timer=setInterval(function(){
    if(state.year>=2015){clearInterval(state.timer);state.playing=false;btnPlay.textContent='▶';return;}
    setYear(state.year+1);},850);});

/* Scrollspy + reveals */
(function(){
  var links={},as=document.querySelectorAll('.nav-links a'),i;
  for(i=0;i<as.length;i++)links[as[i].getAttribute('href').slice(1)]=as[i];
  var spy=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){for(var k in links)links[k].classList.remove('on');
      var l=links[e.target.id];if(l)l.classList.add('on');}});},
    {rootMargin:'-38% 0px -55% 0px'});
  ['problema','datos','preparacion','visualizador','hallazgos','conclusiones']
    .forEach(function(id){var el=document.getElementById(id);if(el)spy.observe(el);});
  var rev=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('in');rev.unobserve(e.target);}});},
    {threshold:.1});
  document.querySelectorAll('.rv').forEach(function(el){rev.observe(el);});
})();

/* Init */
B2000=kpiCalc(2000);
buildLine();
sparkline();
renderAll(2015);
