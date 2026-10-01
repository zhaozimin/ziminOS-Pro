/**
 * [INPUT]: 依赖 node:test/assert/path/url 与 esbuild，直接编译 review/dailyActivityText 纯文本内核
 * [OUTPUT]: 覆盖日记托管区建立、旧代码块就地升级、同日去重、新建优先级、
 *           跨日历史不互相覆盖、手写行保留、行首图标分类、CRLF 保真，并锁定 create/modify 监听与 main 装配
 * [POS]: tests 的日记历史专项；它把用户最关心的一条事实钉死：
 *        第二天再改同一篇笔记，第一天日记里已经落下的那条不会消失
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = await build({
    entryPoints: [path.join(ROOT, 'src/modules/review/dailyActivityText.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    write: false,
    logLevel: 'silent',
});
const activity = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);

const modified = (time = '10:30') => ({
    kind: 'modified',
    time,
    path: '01-projects/写作/章节一',
    label: '章节一',
});

test('旧「今日产出」代码块在首次事件时就地升级为可读 Markdown', () => {
    const source = ['# 2026-09-27', '', '## 今日产出（自动）', '', '```ziminos', '今日产出', '```', ''].join('\n');
    const next = activity.upsertDailyActivity(source, modified());

    assert.doesNotMatch(next, /```ziminos/);
    assert.match(next, /<!-- ziminos:daily-activity:start -->/);
    assert.match(next, /- ✏️ 10:30 \[\[01-projects\/写作\/章节一\|章节一\]\]/);
    assert.deepEqual(activity.readDailyActivities(next), [modified()]);
});

test('同篇同日多次修改只留一条，但保留最后一次时间', () => {
    let content = ['## 今日产出（自动）', '', activity.emptyDailyActivityBlock()].join('\n');
    content = activity.upsertDailyActivity(content, modified('09:00'));
    content = activity.upsertDailyActivity(content, modified('18:42'));

    assert.equal((content.match(/章节一/g) ?? []).length, 2, '路径与别名各出现一次');
    assert.equal(activity.readDailyActivities(content).length, 1);
    assert.equal(activity.readDailyActivities(content)[0].time, '18:42');
});

test('当天新建优先于当天修改，不把一篇产出算两遍', () => {
    let content = activity.emptyDailyActivityBlock();
    content = activity.upsertDailyActivity(content, modified());
    content = activity.upsertDailyActivity(content, { ...modified('11:00'), kind: 'created' });
    content = activity.upsertDailyActivity(content, modified('12:00'));

    const entries = activity.readDailyActivities(content);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].kind, 'created');
});

test('每天是独立事件源：第二天再改，第一天的原文不变', () => {
    const dayOne = activity.upsertDailyActivity(activity.emptyDailyActivityBlock(), modified('20:00'));
    const snapshot = dayOne;
    const dayTwo = activity.upsertDailyActivity(activity.emptyDailyActivityBlock(), modified('08:00'));

    assert.equal(dayOne, snapshot);
    assert.equal(activity.readDailyActivities(dayOne)[0].time, '20:00');
    assert.equal(activity.readDailyActivities(dayTwo)[0].time, '08:00');
});

test('托管区里的手写备注与改过格式的活动行不会被下一笔记账删除', () => {
    const source = [activity.DAILY_ACTIVITY_START, '- 手写总结', '- ✏️ 昨晚 [[章节一]]（补充说明）', '', activity.DAILY_ACTIVITY_END].join('\r\n');
    const next = activity.upsertDailyActivity(source, modified());
    assert.ok(next.includes('- 手写总结\r\n- ✏️ 昨晚 [[章节一]]（补充说明）\r\n'));
    assert.equal(activity.readDailyActivities(next).length, 1);
});

test('活动类型只由行首图标决定，文件名里的 emoji 不改变事实', () => {
    const event = { ...modified(), path: '01-projects/🆕计划/卡片', label: '🆕卡片' };
    const next = activity.upsertDailyActivity(activity.emptyDailyActivityBlock(), event);
    assert.deepEqual(activity.readDailyActivities(next), [event]);
});

test('写入 Windows 日记仍通篇使用 CRLF', () => {
    const source = ['# 2026-09-27', '', '## 今日产出（自动）', ''].join('\r\n');
    const next = activity.upsertDailyActivity(source, modified());

    assert.equal(/(^|[^\r])\n/.test(next), false);
    assert.match(next, /\r\n<!-- ziminos:daily-activity:start -->\r\n/);
});

test('日记历史由 vault 事件驱动并在插件入口装配', () => {
    const main = readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
    const recorder = readFileSync(path.join(ROOT, 'src/modules/review/dailyActivity.ts'), 'utf8');
    const templates = readFileSync(path.join(ROOT, 'src/modules/review/templates.ts'), 'utf8');

    assert.ok(main.includes('registerDailyActivityRecorder(ctx)'));
    assert.ok(recorder.includes("ctx.app.vault.on('create'"));
    assert.ok(recorder.includes("ctx.app.vault.on('modify'"));
    assert.ok(recorder.includes("storageKey: ACTIVITY_DEBTS_KEY"));
    assert.ok(recorder.includes("openPeriodNote(ctx, PERIODS.daily, { day, reveal: false })"));
    assert.ok(templates.includes('emptyDailyActivityBlock()'));
});
