export function samplePath(points,seconds,start,duration,loop){
 let t=Math.max(0,(seconds-start)/duration);t=loop&&seconds>=start?t%1:Math.min(1,t);
 const lengths=points.slice(1).map((b,i)=>Math.hypot(...['x','y','z'].map(k=>b[k]-points[i][k])));let distance=t*lengths.reduce((a,b)=>a+b,0);
 for(let i=0;i<lengths.length;i++){const l=lengths[i];if(distance<=l&&l)return Object.fromEntries(['x','y','z'].map(k=>[k,points[i][k]+(points[i+1][k]-points[i][k])*distance/l]));distance-=l;}
 return points.at(-1);
}
