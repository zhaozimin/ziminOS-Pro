/**
 * [INPUT]: 依赖 node:test、esbuild、moment 与真实文本/事务模块。
 * [OUTPUT]: 验证连续七日、双端区间、滚动坐标、即时拖动、人物颜色和故障回滚。
 * [POS]: 正式大日历回归；YAML 编解码由宿主真机验证。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const result = await build({ stdin: { contents: `export * from './model'; export * from './viewport'; export * from './markdown'; export * from './transaction'; export * from './gestures'; export * from './colors'; export * from './store';`, resolveDir: fileURLToPath(new URL('../src/modules/planner/', import.meta.url)) }, bundle: true, write: false, platform: 'node', format: 'cjs', plugins: [{ name: 'host', setup(b) {
    b.onResolve({ filter: /^obsidian$/ }, () => ({ path: 'host', namespace: 'host' }));
    b.onLoad({ filter: /.*/, namespace: 'host' }, () => ({ contents: `export { default as moment } from 'moment'; export const parseYaml = text => Object.assign({},...text.split(/\\n/).filter(Boolean).map(JSON.parse)); export class TFile {} export class TFolder {} export class MarkdownView {} export const normalizePath = text => text; export const stringifyYaml = value => JSON.stringify(value)+'\\n';`, resolveDir: process.cwd() }));
} }] });
const mod = { exports: {} }; new Function('module','exports','require',result.outputFiles[0].text)(mod,mod.exports,require);
const m = mod.exports;
const event = (id,start,end) => ({ id,day:'2026-10-08',start,end,cardPath:`01-projects/测试/${id}.md`,name:id,people:[],done:false });
test('非法日期、反向区间和不足15分钟拒绝；24点写下一日零点', () => {
    for (const value of [{day:'2026-02-29',start:60,end:90},{day:'2026-10-08',start:600,end:599},{day:'2026-10-08',start:60,end:70}]) assert.throws(() => m.validateInterval(value));
    assert.equal(m.localStamp('2026-10-08',1440),'2026-10-09T00:00:00');
    assert.deepEqual(m.intervalOf('2026-10-08T23:00:00','2026-10-09T00:00:00'),{day:'2026-10-08',start:1380,end:1440});
    assert.equal(m.intervalOf('2026-10-08T09:00:00','2026-10-10T00:00:00'),null);
});
test('周视图跨月跨年仍按周一开始', () => {
    assert.deepEqual(m.weekOf('2027-01-01'),['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03']);
});
test('重叠安排分栏，边界相接重用整列', () => {
    const lanes=m.layoutEvents([event('a',540,660),event('b',600,720),event('c',720,780)]);
    assert.equal(lanes.get('a').count,2);assert.equal(lanes.get('b').lane,1);assert.equal(lanes.get('c').count,1);
});
test('Markdown 行写日期、时间、卡片和人物，身份始终不变', () => {
    const item={...event('abc',540,660),people:['02-areas/人脉/王明.md']};
    const row=m.scheduleRow(item); assert.match(row,/2026-10-08 09:00–11:00：\[\[/);assert.match(row,/王明/);
    const text=m.appendRow('# 项目\n\n用户自己的正文\n',row);
    assert.ok(text.includes('用户自己的正文'));assert.equal(m.taskRows(text).rows[0].id,'abc');
    const next=m.replaceRow(text,'abc',m.scheduleRow({...item,start:600,end:720,done:true}),row);
    assert.equal(m.taskRows(next).rows[0].done,true);assert.equal(m.taskRows(next).rows[0].start,600);
    assert.equal((next.match(/\^schedule-abc/g)||[]).length,1);
});
test('重复身份、异常格式和并发修改不覆盖原文', () => {
    const row=m.scheduleRow(event('abc',540,660));const text=`## 时间安排\n\n${row}\n`;
    assert.throws(()=>m.replaceRow(text+row,'abc',row));
    assert.throws(()=>m.replaceRow(text,'abc',row,row+'changed'));
    assert.throws(()=>m.appendRow(text,row));
    assert.equal(m.taskRows(text.replace('09:00','29:00')).errors.length,1);
});
test('代码块里的任务身份不参与更新；CRLF保持', () => {
    const row=m.scheduleRow(event('abc',540,660));
    const text=`## 时间安排\r\n\r\n${row}\r\n\r\n\`\`\`md\r\n${row}\r\n\`\`\`\r\n`;
    assert.equal(m.taskRows(text).rows.length,1);
    const out=m.replaceRow(text,'abc',row.replace('[ ]','[x]'));
    assert.equal(out.replace(/\r\n/g,'').includes('\n'),false);
});
test('人物检索是真实Dataview TASK，包含存档并且补齐幂等', () => {
    const once=m.ensurePersonTasks('# 王明\n',m.DEFAULTS);
    assert.match(once,/TASK FROM/); assert.match(once,/meta\(section\).subpath = "时间安排"/);
    assert.match(once,/04-archives/);assert.equal(m.ensurePersonTasks(once,m.DEFAULTS),once);
});
test('新增卡片先保留十字段及自定义模板正文，再追加日历属性', () => {
    const original={aliases:['别名'],description:null,created:null,updated:null,tags:['test'],UID:null,rating:5,author:['作者'],source:['来源'],up:null,custom:'保留'};
    const template=`---\n${JSON.stringify(original)}\n---\n\n模板正文\n`;
    const result=m.createCard(template,{description:'备注',created:'2026-10-08 12:00:00',UID:20261008120000,up:['[[MOC]]'],schedule_id:'a'});
    const props=JSON.parse(result.split('\n')[1]);
    assert.deepEqual(Object.keys(props).slice(0,10),Object.keys(original).slice(0,10));
    assert.deepEqual(props.source,['来源']);assert.equal(props.custom,'保留');assert.match(result,/模板正文/);
});
function port(values,failAt) {
    let writes=0;
    return {read:async p=>values.get(p),change:async(p,a,b)=>{if(++writes===failAt)throw Error('模拟写盘失败');if(values.get(p)!==a)throw Error('并发编辑：'+p);values.set(p,b);},create:async(p,t)=>{if(values.has(p))throw Error('撞名');values.set(p,t);},remove:async(p,t)=>{if(values.get(p)!==t)throw Error('并发编辑：'+p);values.delete(p);}};
}
test('第三次写入失败，前面的卡片与MOC恢复', async()=>{
    const values=new Map([['moc','原文'],['person','人物']]),tx=new m.WriteTransaction(port(values,2));
    await assert.rejects(tx.run(async()=>{await tx.create('card','新卡片');await tx.change('moc','原文','任务');await tx.change('person','人物','DQL');}));
    assert.deepEqual([...values],[['moc','原文'],['person','人物']]);
});
test('回滚期间用户再次编辑，保留用户新内容并报告残留',async()=>{
    const values=new Map([['moc','原文']]),tx=new m.WriteTransaction(port(values));
    await assert.rejects(tx.run(async()=>{await tx.create('card','新卡片');values.set('card','用户写了新内容');throw Error('失败');}),/保留其原文/);
    assert.equal(values.get('card'),'用户写了新内容');
});
test('路径穿越、非法文件名和非法显示范围不会进入写入',()=>{
    for(const name of ['../测试','A/B','A|B','CON','..'])assert.throws(()=>m.safeName(name));
    assert.equal(m.settingsOf({startHour:23,endHour:8}).startHour,0);
    assert.equal(m.settingsOf({projectFolder:'../生产库'}).projectFolder,'01-projects');
    assert.equal(m.settingsOf({startHour:8.25,endHour:18.75}).startHour,8.25);
    assert.equal(m.settingsOf({startHour:8.1,endHour:18}).startHour,0);
    assert.equal(m.settingsOf({startHour:'9',endHour:18}).startHour,0);
    assert.equal(m.settingsOf({startHour:null,endHour:18}).startHour,0);
});
test('画布改变尺寸时保持时间比例，指针坐标按实际高度吸附',()=>{
    const range={start:480,end:1380};
    assert.equal(m.timeRatio(930,range),.5);
    assert.equal(m.minuteAt(250,100,300,range),930);
    assert.equal(m.minuteAt(600,100,1000,range),930);
    assert.equal(m.minuteAt(-1,100,300,range),480);
    assert.equal(m.minuteAt(999,100,300,range),1380);
});
test('缩放只改变格子大小，滚动位置保留指针时间且不越界',()=>{
    const settings=m.settingsOf({startHour:8,endHour:23,zoom:150}), original=m.windowOf(settings);
    const before=150,after=225,height=600,scroll=180,anchor=200;
    const next=m.zoomScroll(scroll,height,before,after,anchor);
    assert.equal((scroll+anchor)/(height*before/100),(next+anchor)/(height*after/100));
    assert.deepEqual(m.windowOf({...settings,zoom:after}),original);
    assert.equal(m.zoomScroll(180,height,before,100,anchor),0);
    assert.equal(m.zoomScroll(300,height,150,200,600),600);
    assert.equal(m.zoomValue(50),100);assert.equal(m.zoomValue(500),400);
    assert.equal(m.settingsOf({zoom:NaN}).zoom,100);assert.equal(m.settingsOf({zoom:200}).zoom,200);
});
test('双端区间按15分钟吸附，两端不可越界或交叉',()=>{
    const range={start:480,end:1380};
    assert.deepEqual(m.rangeEdge(range,'start',487),{start:480,end:1380});
    assert.deepEqual(m.rangeEdge(range,'start',488),{start:495,end:1380});
    assert.deepEqual(m.rangeEdge(range,'start',1500),{start:1365,end:1380});
    assert.deepEqual(m.rangeEdge(range,'start',-1),{start:0,end:1380});
    assert.deepEqual(m.rangeEdge(range,'end',0),{start:480,end:495});
    assert.deepEqual(m.rangeEdge(range,'end',1500),{start:480,end:1440});
    for(const edge of ['start','end']) for(const minute of [NaN,Infinity,-Infinity]) assert.deepEqual(m.rangeEdge(range,edge,minute),range);
});
test('区间变化保留视口中心时间，排除中心时间时限制在滚动边界',()=>{
    const before={start:0,end:1440},after={start:480,end:1380};
    const scroll=m.rangeScroll(300,600,200,before,after);
    assert.equal(scroll,20);assert.equal(m.rangeScroll(scroll,600,200,after,before),300);
    assert.equal(m.rangeScroll(300,600,200,before,{start:900,end:930}),0);
    assert.equal(m.rangeScroll(300,600,200,before,{start:0,end:15}),600);
    assert.equal(m.rangeScroll(0,600,100,before,after),0);
    assert.deepEqual(m.DISPLAY_DEFAULTS,{startHour:0,endHour:24,zoom:100});
});
test('高精度滚轮缩放，修饰键门控和边界清除余量',()=>{
    const zoom=new m.WheelZoom();let value=150;
    for(let i=0;i<12;i++) value=zoom.apply(value,-.5,true);
    assert.ok(value>150);
    assert.equal(zoom.apply(value,20,false),null);
    assert.equal(zoom.apply(value,0,true),null);
    assert.equal(zoom.apply(value,Infinity,true),null);
    assert.equal(zoom.apply(100,120,true),100);
    assert.equal(zoom.apply(400,-120,true),400);
    assert.ok(zoom.apply(400,10,true)<400);
});
test('任意起始日期显示连续七天，跨周跨年仍使用真实星期',()=>{
    assert.deepEqual(m.daysFrom('2026-12-30'),['2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03','2027-01-04','2027-01-05']);
    assert.deepEqual(m.daysFrom('2026-10-06'),['2026-10-06','2026-10-07','2026-10-08','2026-10-09','2026-10-10','2026-10-11','2026-10-12']);
    assert.equal(m.weekdayOf('2026-10-10'),6);assert.equal(m.weekdayOf('2026-10-11'),0);assert.equal(m.weekdayOf('2026-10-12'),1);
    assert.equal(m.durationText(90),'1 小时 30 分钟');
});
test('同一人物的颜色覆盖卡片缓存，多人可指定颜色归属',()=>{
    const people=[{path:'a.md',color:'red'},{path:'b.md',color:'blue'}];
    assert.deepEqual(m.colorAppearance('purple','',['a.md'],people,'project'),{color:'red',colorPerson:'a.md'});
    assert.deepEqual(m.colorAppearance('green','a.md',['a.md'],people,'area'),{color:'red',colorPerson:'a.md'});
    assert.deepEqual(m.colorAppearance('green','b.md',['a.md','b.md'],people,'project'),{color:'blue',colorPerson:'b.md'});
    assert.deepEqual(m.colorAppearance('yellow','removed.md',['a.md'],people,'project'),{color:'red',colorPerson:'a.md'});
    assert.deepEqual(m.colorAppearance('orange','',[],people,'project'),{color:'orange',colorPerson:''});
    assert.deepEqual(m.colorAppearance('invalid','',[],people,'area'),{color:'green',colorPerson:''});
    assert.equal(m.colorKey(m.defaultPersonColor('20261008120000')),m.defaultPersonColor('20261008120000'));
});
function colorStore(bound=true) {
    const path='02-areas/人脉/测试.md', card='01-projects/测试/card.md';
    const item={...event('color',540,600),cardPath:card,kind:'project',color:bound?'red':'purple',colorPerson:bound?path:'',people:bound?[path]:[]};
    const note=value=>'---\n'+JSON.stringify(value)+'\n---\n正文保留\n';
    const values=new Map([[card,note({schedule_id:'color',with:bound?[m.wiki(path)]:null,schedule_color:'purple',schedule_color_person:bound?m.wiki(path):null})],[path,note({type:'person',calendar_color:'red'})]]);
    const store=new m.PlannerStore({metadataCache:{getFirstLinkpathDest:p=>({path:p.replace(/\.md$/,'')+'.md'})}},m.DEFAULTS,{card:()=>'',project:()=>''});
    store.events=[item];store.people=[{path,color:'red'}];store.flush=async()=>{};store.read=async p=>values.get(p);
    const writes=[];store.change=async(p,a,b)=>{assert.equal(values.get(p),a);values.set(p,b);writes.push(p);};
    return {store,item,values,writes,path,card,note};
}
test('设置人物颜色只写人物档案，无人物时只写安排卡片',async()=>{
    const h=colorStore(),original=h.values.get(h.card);await h.store.setColor(h.item,'blue');
    assert.deepEqual(h.writes,[h.path]);assert.equal(h.values.get(h.card),original);
    assert.equal(m.yamlOf(h.values.get(h.path)).calendar_color,'blue');assert.match(h.values.get(h.path),/正文保留/);
    const self=colorStore(false);await self.store.setColor(self.item,'orange');
    assert.deepEqual(self.writes,[self.card]);assert.equal(m.yamlOf(self.values.get(self.card)).schedule_color,'orange');
});
test('人物绑定或颜色已被其他编辑修改时拒绝写入',async()=>{
    const changed=colorStore();changed.values.set(changed.card,changed.note({schedule_id:'color',with:null}));
    await assert.rejects(changed.store.setColor(changed.item,'blue'),/绑定人物已改变/);assert.deepEqual(changed.writes,[]);
    const recolored=colorStore();recolored.values.set(recolored.path,recolored.note({type:'person',calendar_color:'green'}));
    await assert.rejects(recolored.store.setColor(recolored.item,'blue'),/颜色已修改/);assert.deepEqual(recolored.writes,[]);
});

test('人物改色写盘失败时，安排卡片和MOC时间同时回滚',async()=>{
    const h=colorStore(), moc='01-projects/测试/MOC-测试.md';
    const item={...h.item,mocPath:moc,name:'card',notes:'原备注',relation:'with',sourceTask:''};
    h.store.events=[item];h.store.containers=[{path:moc,folder:'01-projects/测试',kind:'project',active:true}];
    h.store.app.vault={getName:()=> '测试库',getAbstractFileByPath:()=>({})};
    h.values.set(h.card,h.note({schedule_id:item.id,schedule_start:m.localStamp(item.day,item.start),schedule_end:m.localStamp(item.day,item.end),description:item.notes,with:[m.wiki(h.path)],schedule_color:'red',schedule_color_person:m.wiki(h.path)}));
    h.values.set(moc,'## 时间安排\n\n'+m.scheduleRow(item)+'\n');
    const original=new Map(h.values), write=h.store.change;
    h.store.change=async(p,a,b)=>{if(p===h.path) throw Error('人物颜色写盘失败');await write(p,a,b);};
    await assert.rejects(h.store.save({...item,mode:'project',target:moc,projectName:'',start:555,end:615,color:'blue',colorEdited:true},item),/人物颜色写盘失败/);
    assert.deepEqual([...h.values],[...original]);
});

// ============================================================
// 手势使用独立 DOM 替身，不接触宿主界面。
// ============================================================
class FakeElement {
    constructor() { this.listeners={}; this.classes=new Set(); this.style={}; this.dataset={}; this.children=[]; }
    addEventListener(n,f) { this.listeners[n]=f; }
    removeEventListener(n) { delete this.listeners[n]; }
    addClass(n) { this.classes.add(n); }
    removeClass(n) { this.classes.delete(n); }
    createDiv(options={}) { const child=new FakeElement();child.text=options.text;this.children.push(child);return child; }
    remove() { this.removed=true; }
}
function harness(item,edge,height=1080,top=0) {
    globalThis.Element=FakeElement;
    const root=new FakeElement(),doc=new FakeElement();root.ownerDocument=doc;
    const days=m.weekOf('2026-10-08');
    const columns=days.map((day,i)=>{const el=new FakeElement();el.getBoundingClientRect=()=>({left:i*100,right:(i+1)*100,top,height});return el;});
    root.querySelectorAll=()=>columns;
    root.querySelector=selector=>columns[days.indexOf(/data-day="([^"]+)"/.exec(selector)[1])];
    root.setPointerCapture=id=>root.pointer=id;root.hasPointerCapture=id=>root.pointer===id;root.releasePointerCapture=()=>root.pointer=null;
    const block=new FakeElement();block.dataset.id=item?.id;
    const handle=new FakeElement();handle.dataset.edge=edge;
    const target=new FakeElement();target.closest=selector=>selector==='input,button'?null:selector==='.zwp-day-column'?columns[1]:selector==='.zwp-event'?(item?block:null):selector==='[data-edge]'?(edge?handle:null):null;
    const selected=[],committed=[],chosen=[];
    const gestures=new m.CalendarGestures(root,days,480,1380,item?[item]:[],v=>selected.push(v),(e,v)=>committed.push(v),e=>chosen.push(e));
    const send=(type,x,y)=>root.listeners[type]({button:0,target,pointerId:1,clientX:x,clientY:y,preventDefault(){}});
    return {root,doc,send,selected,committed,chosen,gestures};
}
test('按住后立即跨日拖动，预览零写入且松手只提交一次',()=>{
    const h=harness({...event('drag',540,600),day:'2026-10-06'});
    h.send('pointerdown',150,90);assert.equal(h.committed.length,0);
    h.send('pointermove',250,162);assert.equal(h.root.classes.has('zwp-dragging'),true);assert.equal(h.committed.length,0);
    h.send('pointerup',250,162);assert.deepEqual(h.committed,[{day:'2026-10-07',start:600,end:660}]);h.gestures.destroy();
});
test('Esc和指针取消均不写入；边缘缩短最少15分钟',()=>{
    const item={...event('drag',540,600),day:'2026-10-06'};
    const cancel=harness(item);cancel.send('pointerdown',150,90);cancel.send('pointermove',250,162);cancel.doc.listeners.keydown({key:'Escape',preventDefault(){}});cancel.send('pointerup',250,162);assert.equal(cancel.committed.length,0);cancel.gestures.destroy();
    const interrupted=harness(item);interrupted.send('pointerdown',150,90);interrupted.send('pointermove',250,162);interrupted.send('pointercancel',250,162);interrupted.send('pointerup',250,162);assert.equal(interrupted.committed.length,0);interrupted.gestures.destroy();
    const resize=harness(item,'end');resize.send('pointerdown',150,144);resize.send('pointermove',150,20);resize.send('pointerup',150,20);assert.equal(resize.committed[0].end,555);resize.gestures.destroy();
});
test('点击和按住不移动只选中，3像素抖动不改变安排',t=>{
    t.mock.timers.enable({apis:['setTimeout']});
    const item={...event('click',540,600),day:'2026-10-06'};
    const h=harness(item);
    h.send('pointerdown',150,90);h.send('pointerup',150,90);
    h.send('pointerdown',150,90);t.mock.timers.tick(1000);h.send('pointerup',150,90);
    // 落在时间吸附边界上，轻微抖动也不能改到下一格。
    h.send('pointerdown',150,81);h.send('pointermove',150,84);h.send('pointerup',150,84);
    assert.equal(h.chosen.length,3);assert.deepEqual(h.committed,[]);h.gestures.destroy();
});
test('松手坐标作为最终落点，拖回原位不写入',()=>{
    const item={...event('move',540,600),day:'2026-10-06'};
    const h=harness(item);h.send('pointerdown',150,90);h.send('pointermove',250,162);h.send('pointerup',350,180);
    assert.deepEqual(h.committed,[{day:'2026-10-08',start:615,end:675}]);h.gestures.destroy();
    const back=harness(item);back.send('pointerdown',150,90);back.send('pointermove',250,162);back.send('pointerup',150,90);
    assert.deepEqual(back.committed,[]);back.gestures.destroy();
});
test('不同画布高度下拖选与边缘调整仍提交正确时间',()=>{
    for(const height of [450,900]) {
        const blank=harness(undefined,undefined,height);
        blank.send('pointerdown',150,height/15);blank.send('pointermove',150,height*2/15);blank.send('pointerup',150,height*2/15);
        assert.deepEqual(blank.selected,[{day:'2026-10-06',start:540,end:600}]);blank.gestures.destroy();
        const resize=harness({...event('resize',540,600),day:'2026-10-06'},'end',height);
        resize.send('pointerdown',150,height*2/15);resize.send('pointermove',150,height/5);resize.send('pointerup',150,height/5);
        assert.deepEqual(resize.committed,[{day:'2026-10-06',start:540,end:660}]);resize.gestures.destroy();
    }
});

test('纵向滚动后拖选与边缘缩放使用画布实际偏移',()=>{
    const height=1800,top=-600;
    const blank=harness(undefined,undefined,height,top);
    blank.send('pointerdown',150,0);blank.send('pointermove',150,120);blank.send('pointerup',150,120);
    assert.deepEqual(blank.selected,[{day:'2026-10-06',start:780,end:840}]);blank.gestures.destroy();
    const resize=harness({...event('resize',780,840),day:'2026-10-06'},'end',height,top);
    resize.send('pointerdown',150,120);resize.send('pointermove',150,240);resize.send('pointerup',150,240);
    assert.deepEqual(resize.committed,[{day:'2026-10-06',start:780,end:900}]);resize.gestures.destroy();
});

test('空白单击不创建，必须拖选后松手才打开安排表单',()=>{
    const h=harness();h.send('pointerdown',150,90);h.send('pointerup',150,90);
    assert.deepEqual(h.selected,[]);
    h.send('pointerdown',150,90);h.send('pointermove',150,108);h.send('pointerup',150,108);
    assert.deepEqual(h.selected,[{day:'2026-10-06',start:555,end:570}]);h.gestures.destroy();
});
