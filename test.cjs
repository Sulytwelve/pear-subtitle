const assert=require('node:assert/strict');const fs=require('fs');const {inspect}=require('./checker.js');
const cue=(id,a,b,text='字幕')=>`${id}\n${a} --> ${b}\n${text}`;const t=s=>`00:00:${String(s).padStart(2,'0')},000`;
const tests=[
['正常字幕',()=>assert.equal(inspect(cue(1,t(0),t(2))).issues.length,0)],
['边界相接不重叠',()=>assert.equal(inspect(cue(1,t(0),t(2))+'\n\n'+cue(2,t(2),t(4))).errors,0)],
['嵌套字幕也能发现重叠',()=>assert(inspect(cue(1,t(0),t(9))+'\n\n'+cue(2,t(1),t(2))+'\n\n'+cue(3,t(3),t(4))).issues.some(x=>x.cue===3&&x.message.includes('重叠')))],
['倒置时间',()=>assert(inspect(cue(1,t(4),t(3))).issues.some(x=>x.message.includes('结束时间')))],
['非法分钟',()=>assert(inspect(cue(1,'00:61:00,000',t(3))).errors>0)],
['空正文',()=>assert(inspect(cue(1,t(0),t(3),'')).issues.some(x=>x.message.includes('正文为空')))],
['重复编号',()=>assert(inspect(cue(1,t(0),t(2))+'\n\n'+cue(1,t(2),t(4))).issues.some(x=>x.message.includes('重复')))],
['BOM 与 Windows 换行',()=>assert.equal(inspect('\uFEFF'+cue(1,t(0),t(2)).replace(/\n/g,'\r\n')).issues.length,0)],
['不修改输入',()=>{const s=cue(9,t(4),t(1));inspect(s);assert.equal(s,cue(9,t(4),t(1)))}],
['高速阅读提示',()=>assert(inspect(cue(1,t(0),'00:00:00,200','这是很长很长很长的一条字幕')).warnings>=2)],
['空文件',()=>assert(inspect('').errors>0)],
['没有时间码',()=>assert(inspect('1\n字幕').errors>0)]
];for(const [name,fn]of tests){fn();console.log(`PASS ${name}`)}console.log(`${tests.length}/${tests.length} checks passed`);
const html=fs.readFileSync(__dirname+'/index.html','utf8');const raw=html.match(/const bad=`([^`]+)`/)[1].replace(/\\n/g,'\n');
const result=inspect(raw);fs.writeFileSync(__dirname+'/demo-report.json',JSON.stringify(result,null,2));assert.equal(result.issues.length,6);assert.equal(result.errors,3);assert.equal(result.warnings,3);console.log('DEMO: 4 cues / 3 errors / 3 warnings');
