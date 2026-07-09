import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('avatar switcher starts empty because there is only one default teacher', async () => {
    const html = await readFile(new URL('../app.html', import.meta.url), 'utf8');
    const match = html.match(/<div id="teacher-avatar-switcher"[^>]*>([\s\S]*?)<\/div>/);

    assert.notEqual(match, null);
    assert.match(match[0], /\shidden(?:\s|>)/);
    assert.doesNotMatch(match[1], /<button|data-avatar-index|teacher-avatar-option/);
});

test('teacher video starts hidden and avatar stage starts visible', async () => {
    const html = await readFile(new URL('../app.html', import.meta.url), 'utf8');
    const videoMatch = html.match(/<video id="teacher-video"[^>]*>/);
    const stageMatch = html.match(/<div id="teacher-avatar-stage"[^>]*>/);

    assert.notEqual(videoMatch, null);
    assert.notEqual(stageMatch, null);
    assert.match(videoMatch[0], /\shidden(?:\s|>)/);
    assert.doesNotMatch(stageMatch[0], /\shidden(?:\s|>)/);
});