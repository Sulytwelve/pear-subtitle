(function(root){
  'use strict';
  const stamp=/^(\d{2,}):(\d{2}):(\d{2})[,.](\d{3})$/;
  function seconds(s){const m=stamp.exec(s.trim());if(!m||+m[2]>59||+m[3]>59)return null;return +m[1]*3600 + +m[2]*60 + +m[3]+ +m[4]/1000;}
  function inspect(source){
    const blocks=source.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim().split(/\n[ \t]*\n+/).filter(Boolean);
    const cues=[],issues=[],seen=new Set();
    const add=(cue,type,message)=>issues.push({cue,type,message});
    blocks.forEach((b,i)=>{
      const lines=b.split('\n'),n=i+1,id=lines[0].trim();
      if(!/^\d+$/.test(id)){add(n,'error','编号格式不正确');}
      else{if(seen.has(+id))add(n,'error','编号重复');seen.add(+id);if(+id!==n)add(n,'warning',`编号不连续：应为 ${n}`);}
      const time=(lines[1]||'').match(/^\s*(\S+)\s*-->\s*(\S+)\s*$/);
      const start=time?seconds(time[1]):null,end=time?seconds(time[2]):null;
      const text=lines.slice(2).join('\n'),cue={position:n,id,start,end,text};cues.push(cue);
      if(start===null||end===null){add(n,'error','时间码格式无效');return;}
      if(end<=start){add(n,'error','结束时间早于或等于开始时间');return;}
      if(!text.trim())add(n,'error','字幕正文为空');
      if(end-start<0.7)add(n,'warning','显示不足 0.7 秒');
      const count=Array.from(text.replace(/<[^>]*>|\s/g,'')).length;
      if(count/(end-start)>20)add(n,'warning','阅读速度超过 20 字/秒');
      if(i&&cues[i-1].start!==null&&start<cues[i-1].start)add(n,'warning','开始时间未按顺序排列');
      const earlier=cues.slice(0,-1).filter(c=>c.start!==null&&c.end>c.start&&c.end>start&&c.start<end);
      if(earlier.length)add(n,'error',`与第 ${earlier.map(c=>c.position).join('、')} 条时间重叠`);
    });
    if(!cues.length)add(0,'error','没有可检查的字幕');
    return {cues,issues,count:cues.length,errors:issues.filter(x=>x.type==='error').length,warnings:issues.filter(x=>x.type==='warning').length};
  }
  const api={inspect,seconds};if(typeof module==='object')module.exports=api;else root.PearSRT=api;
})(typeof globalThis==='object'?globalThis:this);
