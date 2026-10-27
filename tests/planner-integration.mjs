/**
 * [INPUT]: 依赖 node:test、esbuild 与正式大日历运行时、迁移和设置事实源。
 * [OUTPUT]: 验证首次继承、设置保全、视图复用、旧链接与卸载边界。
 * [POS]: 大日历正式合并专项；不写真实笔记库。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const result = await build({ stdin: { contents: `export * from './src/modules/planner/runtime'; export * from './src/modules/planner/migration'; export * from './src/modules/planner/view'; export * from './src/core/plannerSettings'; export * from './src/core/types';`, resolveDir: fileURLToPath(new URL('../', import.meta.url)) }, bundle: true, write: false, platform: 'node', format: 'cjs', plugins: [{ name: 'host', setup(b) {
    b.onResolve({ filter: /^obsidian$/ }, () => ({ path: 'host', namespace: 'host' }));
    b.onLoad({ filter: /.*/, namespace: 'host' }, () => ({ contents: `
        export { default as moment } from 'moment';
        export class Notice {} export class Modal {} export class MarkdownView {} export class TFile {} export class TFolder {}
        export class ItemView { constructor(leaf) { this.leaf=leaf; this.app=leaf.app; } }
        export const debounce = fn => Object.assign(fn,{cancel(){}});
        export const parseYaml = JSON.parse; export const stringifyYaml = JSON.stringify; export const normalizePath = p => p;
    `, resolveDir: process.cwd() }));
} }] });
const mod = { exports: {} }; new Function('module','exports','require',result.outputFiles[0].text)(mod,mod.exports,require); const m=mod.exports;

test('显示偏好严格验形，范围成对回落且模板禁止越出库根',()=>{
    assert.deepEqual(m.normalizePlannerPreferences(null),m.DEFAULT_PLANNER_PREFERENCES);
    assert.deepEqual(m.normalizePlannerPreferences({startHour:23,endHour:8,zoom:Infinity,cardTemplate:'../外部.md'}),m.DEFAULT_PLANNER_PREFERENCES);
    assert.deepEqual(m.normalizePlannerPreferences({startHour:8,endHour:23,zoom:123.1,cardTemplate:'90-system/我的模板.md'}),{startHour:8,endHour:23,zoom:123.1,cardTemplate:'90-system/我的模板.md'});
    assert.equal(m.normalizePlannerPreferences({startHour:'8',endHour:24,zoom:'200'}).startHour,0);
    const a=m.normalizeSettings({}),b=m.normalizeSettings({});a.planner.zoom=250;assert.equal(b.planner.zoom,100);
});
function trialApp(value) {
    const calls=[];return {calls,app:{vault:{configDir:'.custom',adapter:{
        exists:async path=>{calls.push(['exists',path]);return value!==undefined;},
        read:async path=>{calls.push(['read',path]);return typeof value==='string'?value:JSON.stringify(value);},
    }}}};
}
test('首次继承独立试用显示设置，只读旧配置，不迁移目录或凭据',async()=>{
    const h=trialApp({startHour:4.5,endHour:12.75,zoom:123.1,cardTemplate:'我的模板.md',projectFolder:'旧目录',wereadCookie:'不迁移'});
    assert.deepEqual(await m.inheritTrialPlannerSettings(h.app,{projectFolder:'正式目录'}),{startHour:4.5,endHour:12.75,zoom:123.1,cardTemplate:'我的模板.md'});
    assert.deepEqual(h.calls.map(([kind])=>kind),['exists','read']);assert.match(h.calls[0][1],/^\.custom\/plugins\/ziminos-week-planner\/data.json$/);
});
test('正式偏好已有值时不再继承，损坏试用 JSON 不阻断正式插件',async()=>{
    const h=trialApp({zoom:300});assert.equal(await m.inheritTrialPlannerSettings(h.app,{planner:{zoom:150}}),undefined);assert.deepEqual(h.calls,[]);
    assert.equal(await m.inheritTrialPlannerSettings(trialApp('{坏JSON').app,{}),undefined);
    assert.equal(await m.inheritTrialPlannerSettings(trialApp(undefined).app,{}),undefined);
});
function runtimeHarness() {
    const commands=[],cleanups=[],events=[],leaves=[],protocols={},factories={};let saves=0,created=0,renders=0;
    const app={vault:{getName:()=> '演示仓库',on:(...args)=>args},metadataCache:{on:(...args)=>args},workspace:{
        on:(...args)=>args,getLeavesOfType:()=>leaves,revealLeaf:async()=>{},
        getLeaf:()=>{created++;const leaf={app,setViewState:async state=>{leaf.view=factories[state.type](leaf);leaf.view.renderWeek=()=>renders++;leaves.push(leaf);}};return leaf;},
    }};
    const ctx={app,settings:m.normalizeSettings({projectFolder:'项目',planner:{startHour:8,endHour:23,zoom:150}}),saveSettings:async()=>{saves++;},
        plugin:{registerView:(type,factory)=>{factories[type]=factory;},registerObsidianProtocolHandler:(name,handler)=>{protocols[name]=handler;},registerEvent:event=>events.push(event),register:fn=>cleanups.push(fn)},
        commands:{register:(spec,run)=>commands.push({spec,run})},
    };
    const runtime=m.registerWeekPlanner(ctx,{card:()=>'',project:()=>''});runtime.store.refresh=async()=>{};
    return {runtime,ctx,commands,cleanups,events,leaves,protocols,get saves(){return saves;},get created(){return created;},get renders(){return renders;}};
}
test('正式入口注册三条命令和原协议，不抢开标签，重复打开复用现有视图',async()=>{
    const h=runtimeHarness();assert.equal(h.commands.length,3);assert.equal(h.created,0);assert.equal(h.events.length,5);
    await h.runtime.showPlanner();await h.runtime.showPlanner();assert.equal(h.created,1);assert.equal(h.leaves.length,1);
    const revealed=[];h.leaves[0].view.revealArrangement=(...args)=>revealed.push(args);
    await h.protocols['ziminos-calendar']({vault:'别的库',date:'2026-10-09',event:'same-id'});assert.deepEqual(revealed,[]);
    await h.protocols['ziminos-calendar']({vault:'演示仓库',date:'2026-10-09',event:'same-id'});assert.deepEqual(revealed,[['2026-10-09','same-id']]);
});
test('日历保存只改全局 planner，目录即时跟随，卸载后不再刷新',async()=>{
    const h=runtimeHarness();h.ctx.settings.planner.cardTemplate='已换模板.md';h.runtime.settings.zoom=222.2;await h.runtime.savePlannerSettings();
    assert.equal(h.ctx.settings.planner.zoom,222.2);assert.equal(h.ctx.settings.projectFolder,'项目');assert.equal(h.ctx.settings.autoUpdated,true);assert.equal(h.saves,1);
    assert.equal(h.ctx.settings.planner.cardTemplate,'已换模板.md');
    h.ctx.settings.projectFolder='新项目';h.ctx.settings.planner.cardTemplate='新模板.md';await h.runtime.refreshPlanner();
    assert.equal(h.runtime.settings.projectFolder,'新项目');assert.equal(h.runtime.settings.cardTemplate,'新模板.md');assert.equal(h.runtime.settings.zoom,222.2);
    let refreshed=0;h.runtime.store.refresh=async()=>{refreshed++;};h.cleanups.forEach(fn=>fn());await h.runtime.refreshPlanner();assert.equal(refreshed,0);
});
