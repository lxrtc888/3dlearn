import test from 'node:test';
import assert from 'node:assert/strict';

import {
    cleanTtsText,
    createLocalServer,
    decodeV3ChunkedAudio,
    decodeVolcanoAudio,
    loadEnvText,
    pickVolcanoConfig
} from '../local-server.mjs';

test('cleanTtsText strips markup, collapses whitespace, and limits length', () => {
    const result = cleanTtsText('<b>hello</b>\n\nstudent   '.repeat(80));

    assert.equal(result.includes('<b>'), false);
    assert.equal(result.includes('\n'), false);
    assert.equal(result.length, 260);
});

test('loadEnvText reads explicit env style values without leaking unknown lines', () => {
    const values = loadEnvText(`
VOLCANO_TTS_APP_ID=app-from-env
VOLCANO_TTS_ACCESS_TOKEN=token-from-env
VOLCANO_TTS_CLUSTER=volcano_tts
VOLCANO_TTS_VOICE_TYPE=BV001_streaming
note: this line should be ignored
`);

    assert.deepEqual(values, {
        VOLCANO_TTS_APP_ID: 'app-from-env',
        VOLCANO_TTS_ACCESS_TOKEN: 'token-from-env',
        VOLCANO_TTS_CLUSTER: 'volcano_tts',
        VOLCANO_TTS_VOICE_TYPE: 'BV001_streaming'
    });
});

test('loadEnvText reads official Volcano guide header names', () => {
    const values = loadEnvText(`
    "X-Api-App-Id": "123456789",
    "X-Api-Access-Key": "access-token-value",
    "X-Api-Key": "api-key-value",
    "X-Api-Resource-Id": "volc.service_type.10029"
`);

    assert.equal(values.VOLCANO_TTS_APP_ID, '123456789');
    assert.equal(values.VOLCANO_TTS_ACCESS_TOKEN, 'access-token-value');
    assert.equal(values.VOLCANO_TTS_API_KEY, 'api-key-value');
    assert.equal(values.VOLCANO_TTS_RESOURCE_ID, 'volc.service_type.10029');
});

test('pickVolcanoConfig prefers process env over guide file values', () => {
    const config = pickVolcanoConfig(
        {
            VOLCANO_TTS_APP_ID: 'env-app',
            VOLCANO_TTS_ACCESS_TOKEN: 'env-token'
        },
        {
            VOLCANO_TTS_APP_ID: 'guide-app',
            VOLCANO_TTS_ACCESS_TOKEN: 'guide-token',
            VOLCANO_TTS_CLUSTER: 'guide-cluster'
        }
    );

    assert.equal(config.appId, 'env-app');
    assert.equal(config.accessToken, 'env-token');
    assert.equal(config.cluster, 'guide-cluster');
});

test('pickVolcanoConfig chooses a TTS 2.0 speaker for seed-tts-2.0 resources', () => {
    const config = pickVolcanoConfig({}, { VOLCANO_TTS_RESOURCE_ID: 'seed-tts-2.0' });

    assert.equal(config.voiceType, 'zh_female_xiaohe_uranus_bigtts');
});

test('decodeVolcanoAudio accepts base64 data from Volcano HTTP TTS response', () => {
    const buffer = decodeVolcanoAudio({ data: Buffer.from('audio').toString('base64') });

    assert.equal(Buffer.isBuffer(buffer), true);
    assert.equal(buffer.toString('utf8'), 'audio');
});

test('decodeV3ChunkedAudio accepts newline and concatenated JSON events', () => {
    const first = JSON.stringify({ code: 0, data: Buffer.from('au').toString('base64') });
    const second = JSON.stringify({ code: 0, data: Buffer.from('dio').toString('base64') });
    const done = JSON.stringify({ code: 20000000 });

    assert.equal(decodeV3ChunkedAudio(`${first}\n${second}\n${done}`).toString('utf8'), 'audio');
    assert.equal(decodeV3ChunkedAudio(`${first}${second}${done}`).toString('utf8'), 'audio');
});

test('local AI chat returns a configuration error when ZHIPU_API_KEY is missing', async () => {
    const server = createLocalServer({
        env: {},
        envFilePath: null,
        guideFilePath: null
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    try {
        const { port } = server.address();
        const response = await fetch(`http://127.0.0.1:${port}/api/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] })
        });
        const body = await response.json();

        assert.equal(response.status, 500);
        assert.match(body.error, /ZHIPU_API_KEY/);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
