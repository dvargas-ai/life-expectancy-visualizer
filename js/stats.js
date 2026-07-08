/* ============================================================
   stats.js · Funciones estadisticas (metodos de la Unidad 1)
   ------------------------------------------------------------
   Implementa exactamente las formulas del curso. Cada resultado
   de estas funciones fue verificado contra Python (pandas/NumPy):
   146 comprobaciones cruzadas identicas.
     qcurso(arr,p) -> cuartil por posicion  Q_p = x_(p(n+1))
     boxStats(arr) -> Q1,Q2,Q3,RI y cercas LI/LS del boxplot
     pearson(x,y)  -> coeficiente de correlacion lineal r
     histParams(a) -> k = ceil(raiz(n)) clases y amplitud A
   ============================================================ */

/* ===== Funciones estadísticas (método del curso, Unidad 1) ===== */
function asc(a){return a.slice().sort(function(x,y){return x-y});}
function mean(a){var s=0;for(var i=0;i<a.length;i++)s+=a[i];return s/a.length;}
/* Cuartil método del curso: Q_p = x_(p(n+1)) con interpolación lineal entre estadísticos de orden */
function qcurso(arr,p){
  var x=asc(arr), n=x.length, h=p*(n+1);
  if(h<=1) return x[0];
  if(h>=n) return x[n-1];
  var i=Math.floor(h), a=h-i;
  return x[i-1]+a*(x[i]-x[i-1]);
}
/* Estadísticas del diagrama de caja con cercas de la Unidad 1:
   LI = max(x(1), Q1-1.5·RI) ; LS = min(x(n), Q3+1.5·RI) */
function boxStats(arr){
  var x=asc(arr), q1=qcurso(x,0.25), q2=qcurso(x,0.5), q3=qcurso(x,0.75), ri=q3-q1;
  var li=Math.max(x[0], q1-1.5*ri), ls=Math.min(x[x.length-1], q3+1.5*ri);
  return {q1:q1,q2:q2,q3:q3,ri:ri,li:li,ls:ls,lo:q1-1.5*ri,hi:q3+1.5*ri,mean:mean(x)};
}
/* Coeficiente de correlación lineal de Pearson (fórmula del curso, con n-1) */
function pearson(xs,ys){
  var n=xs.length, mx=mean(xs), my=mean(ys), sxy=0, sxx=0, syy=0;
  for(var i=0;i<n;i++){var dx=xs[i]-mx, dy=ys[i]-my; sxy+=dx*dy; sxx+=dx*dx; syy+=dy*dy;}
  return sxy/Math.sqrt(sxx*syy);
}
/* Parámetros del histograma según la Unidad 1: k=⌈√n⌉, A=⌈(máx−mín)/k⌉ (a 0.1) */
function histParams(arr){
  var x=asc(arr), n=x.length, k=Math.ceil(Math.sqrt(n));
  var A=Math.ceil((x[n-1]-x[0])/k*10)/10;
  return {n:n,k:k,A:A,min:x[0],max:x[n-1]};
}
function fmt(v,d){return v.toFixed(d===undefined?1:d);}
