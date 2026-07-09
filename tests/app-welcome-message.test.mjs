import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('welcome message is synchronized with speech by default', async () => {
    const source = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
    const start = source.indexOf('function scheduleWelcomeMessage()');
    const end = source.indexOf('function waitForAvatarTutorReady', start);

    assert.notEqual(start, -1);
    assert.notEqual(end, -1);

    const scheduleWelcomeSource = source.slice(start, end);
    assert.match(
        scheduleWelcomeSource,
        /presentAiMessage\(WELCOME_MESSAGE,\s*\{\s*syncWithSpeech:\s*true\s*\}\s*\)/
    );
});
test('startup schedules a synthetic teacher panel activation', async () => {
    const source = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

    assert.match(source, /scheduleTeacherAutoActivation\(\)/);
    assert.match(source, /function scheduleTeacherAutoActivation\(\)/);
    assert.match(source, /teacher-section/);
    assert.match(source, /pointerdown/);
    assert.match(source, /\.click\?\.\(\)/);
    assert.match(source, /retryPendingSpeechFromGesture/);
});