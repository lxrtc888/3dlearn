import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;
const DEFAULT_PORT = 8000;
const GUIDE_FILE = path.join(ROOT_DIR, 'docs', '火山TTS引擎key及指南.txt');
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const MIME_TYPES = new Map([
    ['.html', 'text/html; charset=utf-8'],
    ['.css', 'text/css; charset=utf-8'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.mjs', 'text/javascript; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.png', 'image/png'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.gif', 'image/gif'],
    ['.svg', 'image/svg+xml'],
    ['.mp4', 'video/mp4'],
    ['.mp3', 'audio/mpeg'],
    ['.wav', 'audio/wav']
]);

export function cleanTtsText(input) {
    return String(input || '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 260);
}

export function loadEnvText(text) {
    const values = {};
    for (const rawLine of String(text || '').split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const envMatch = line.match(/^(VOLCANO_TTS_[A-Z_]+|ZHIPU_API_KEY)\s*=\s*(.+)$/);
        if (envMatch) {
            values[envMatch[1]] = stripValue(envMatch[2]);
            continue;
        }

        const pairMatch = line.match(/^([^:=：]+)\s*[:=：]\s*(.+)$/);
        if (!pairMatch) continue;

        const rawKey = stripValue(pairMatch[1]).replace(/[<>]/g, '');
        const normalizedKey = rawKey.toLowerCase().replace(/[\s_-]+/g, '');
        const value = stripValue(pairMatch[2]);
        if (!value || isGuidePlaceholder(value)) continue;

        if (normalizedKey === 'volcanottsappid' || normalizedKey === 'xapiappid' || normalizedKey === 'appid') {
            values.VOLCANO_TTS_APP_ID = value;
        } else if (normalizedKey === 'volcanottsapikey' || normalizedKey === 'xapikey' || normalizedKey === 'apikey') {
            values.VOLCANO_TTS_API_KEY = value;
        } else if (
            normalizedKey === 'volcanottsaccesstoken' ||
            normalizedKey === 'xapiaccesskey' ||
            normalizedKey === 'accesstoken' ||
            normalizedKey === 'token'
        ) {
            values.VOLCANO_TTS_ACCESS_TOKEN = value;
        } else if (normalizedKey === 'volcanottsresourceid' || normalizedKey === 'xapiresourceid' || normalizedKey === 'resourceid') {
            values.VOLCANO_TTS_RESOURCE_ID = value;
        } else if (normalizedKey === 'volcanottscluster' || normalizedKey === 'cluster') {
            values.VOLCANO_TTS_CLUSTER = value;
        } else if (normalizedKey === 'volcanottsvoicetype' || normalizedKey === 'voicetype' || normalizedKey === 'voice') {
            values.VOLCANO_TTS_VOICE_TYPE = value;
        } else if (normalizedKey === 'volcanottsendpoint' || normalizedKey === 'endpoint') {
            values.VOLCANO_TTS_ENDPOINT = value;
        } else if (normalizedKey === 'volcanottsv3endpoint' || normalizedKey === 'v3endpoint') {
            values.VOLCANO_TTS_V3_ENDPOINT = value;
        }
    }
    return values;
}

export function pickVolcanoConfig(envValues = {}, guideValues = {}) {
    const source = { ...guideValues, ...envValues };
    const resourceId = source.VOLCANO_TTS_RESOURCE_ID || '';
    return {
        endpoint: source.VOLCANO_TTS_ENDPOINT || 'https://openspeech.bytedance.com/api/v1/tts',
        v3Endpoint: source.VOLCANO_TTS_V3_ENDPOINT || 'https://openspeech.bytedance.com/api/v3/tts/unidirectional',
        apiKey: source.VOLCANO_TTS_API_KEY || '',
        resourceId,
        appId: source.VOLCANO_TTS_APP_ID || '',
        accessToken: source.VOLCANO_TTS_ACCESS_TOKEN || '',
        cluster: source.VOLCANO_TTS_CLUSTER || 'volcano_tts',
        voiceType: source.VOLCANO_TTS_VOICE_TYPE || defaultVoiceType(resourceId)
    };
}

export function decodeVolcanoAudio(data) {
    const audioBase64 = data?.data || data?.audio || data?.result?.data;
    if (!audioBase64) {
        throw new Error(data?.message || data?.error || 'Volcano TTS response has no audio data');
    }
    return Buffer.from(audioBase64, 'base64');
}

function stripValue(value) {
    return String(value || '')
        .trim()
        .replace(/,$/, '')
        .trim()
        .replace(/^['"“”]|['"“”]$/g, '')
        .trim();
}

function isGuidePlaceholder(value) {
    return /参考|示例|替换为|your-|<.+>|^\[masked\]$/i.test(value);
}

function jsonResponse(res, statusCode, body, headers = {}) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        ...headers
    });
    res.end(JSON.stringify(body));
}

function sendCors(res) {
    res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
    });
    res.end();
}

function redact(value, secret) {
    const text = String(value || 'unknown');
    return secret ? text.replaceAll(secret, '[redacted]') : text;
}

async function readJsonBody(req) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    return raw.trim() ? JSON.parse(raw) : {};
}

async function readOptionalEnvFile(filePath) {
    if (!existsSync(filePath)) return {};
    return loadEnvText(await readFile(filePath, 'utf8'));
}

async function getLocalConfig(options = {}) {
    const envValues = options.env || process.env;
    const envFilePath = Object.prototype.hasOwnProperty.call(options, 'envFilePath')
        ? options.envFilePath
        : path.join(ROOT_DIR, '.env');
    const guideFilePath = Object.prototype.hasOwnProperty.call(options, 'guideFilePath')
        ? options.guideFilePath
        : GUIDE_FILE;
    const dotEnvValues = envFilePath ? await readOptionalEnvFile(envFilePath) : {};
    const guideValues = guideFilePath ? await readOptionalEnvFile(guideFilePath) : {};
    return {
        volcano: pickVolcanoConfig({ ...dotEnvValues, ...envValues }, guideValues),
        zhipuApiKey: envValues.ZHIPU_API_KEY || dotEnvValues.ZHIPU_API_KEY || ''
    };
}

async function handleTts(req, res, configOptions = {}) {
    if (req.method === 'OPTIONS') return sendCors(res);
    if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Only POST /api/tts is supported' });

    let body;
    try {
        body = await readJsonBody(req);
    } catch {
        return jsonResponse(res, 400, { error: 'Invalid JSON body' });
    }

    const text = cleanTtsText(body.text);
    if (!text) return jsonResponse(res, 400, { error: 'text is required' });

    const { volcano } = await getLocalConfig(configOptions);
    const speed = Number(body.speed || 1);
    const safeSpeed = Number.isFinite(speed) ? Math.min(Math.max(speed, 0.5), 2) : 1;

    if (volcano.apiKey) return synthesizeV3Tts(res, volcano, text, safeSpeed);
    if (volcano.appId && volcano.accessToken) return synthesizeV1Tts(res, volcano, text, safeSpeed);

    return jsonResponse(res, 500, {
        error: 'Local TTS is not configured',
        details: 'Set VOLCANO_TTS_API_KEY and VOLCANO_TTS_RESOURCE_ID, or set VOLCANO_TTS_APP_ID and VOLCANO_TTS_ACCESS_TOKEN.'
    });
}

async function synthesizeV3Tts(res, volcano, text, safeSpeed) {
    if (!volcano.resourceId) {
        return jsonResponse(res, 500, {
            error: 'Local TTS is not configured',
            details: 'VOLCANO_TTS_RESOURCE_ID is required for Volcano TTS V3.'
        });
    }

    const payload = {
        user: { uid: '3dlearn-local' },
        event: 100,
        req_params: {
            text,
            speaker: volcano.voiceType,
            audio_params: {
                format: 'mp3',
                sample_rate: 24000,
                speech_rate: safeSpeed
            }
        }
    };

    try {
        const upstream = await fetch(volcano.v3Endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'X-Api-Key': volcano.apiKey,
                'X-Api-Resource-Id': volcano.resourceId,
                'X-Api-Request-Id': crypto.randomUUID()
            },
            body: JSON.stringify(payload)
        });

        const textBody = await upstream.text();
        if (!upstream.ok) {
            return jsonResponse(res, 502, {
                error: 'Volcano TTS V3 request failed',
                status: upstream.status,
                details: redact(textBody.slice(0, 500), volcano.apiKey)
            });
        }

        const audio = decodeV3ChunkedAudio(textBody);
        if (!audio.length) {
            return jsonResponse(res, 502, {
                error: 'Volcano TTS V3 returned no audio',
                details: redact(textBody.slice(0, 500), volcano.apiKey)
            });
        }

        return sendAudio(res, audio);
    } catch (error) {
        return jsonResponse(res, 502, {
            error: 'Volcano TTS V3 proxy failed',
            details: redact(error.message, volcano.apiKey)
        });
    }
}

export function decodeV3ChunkedAudio(textBody) {
    const parts = [];
    for (const trimmed of splitJsonObjects(String(textBody || ''))) {
        const data = JSON.parse(trimmed);
        if (data.code === 0 && data.data) parts.push(Buffer.from(data.data, 'base64'));
        if (data.code === 20000000) break;
        if (data.code && data.code !== 0) {
            throw new Error(data.message || `Volcano V3 TTS error: ${data.code}`);
        }
    }
    return Buffer.concat(parts);
}

function defaultVoiceType(resourceId) {
    return String(resourceId || '').includes('seed-tts-2.0')
        ? 'zh_female_xiaohe_uranus_bigtts'
        : 'zh_female_shuangkuaisisi_moon_bigtts';
}

function splitJsonObjects(input) {
    const chunks = [];
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < input.length; i += 1) {
        const char = input[i];
        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
        } else if (char === '{') {
            if (depth === 0) start = i;
            depth += 1;
        } else if (char === '}') {
            depth -= 1;
            if (depth === 0 && start >= 0) {
                chunks.push(input.slice(start, i + 1));
                start = -1;
            }
        }
    }

    return chunks;
}

async function synthesizeV1Tts(res, volcano, text, safeSpeed) {
    const payload = {
        app: { appid: volcano.appId, token: volcano.accessToken, cluster: volcano.cluster },
        user: { uid: '3dlearn-local' },
        audio: {
            voice_type: volcano.voiceType,
            encoding: 'mp3',
            speed_ratio: safeSpeed,
            volume_ratio: 1,
            pitch_ratio: 1
        },
        request: { reqid: crypto.randomUUID(), text, operation: 'query' }
    };

    try {
        const upstream = await fetch(volcano.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer;${volcano.accessToken}`
            },
            body: JSON.stringify(payload)
        });
        const data = await upstream.json().catch(() => null);
        if (!upstream.ok || !data) {
            return jsonResponse(res, 502, {
                error: 'Volcano TTS V1 request failed',
                status: upstream.status,
                details: redact(data?.message || data?.error, volcano.accessToken)
            });
        }
        return sendAudio(res, decodeVolcanoAudio(data));
    } catch (error) {
        return jsonResponse(res, 502, {
            error: 'Volcano TTS V1 proxy failed',
            details: redact(error.message, volcano.accessToken)
        });
    }
}

function sendAudio(res, audio) {
    res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audio.length,
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(audio);
}

async function handleAiChat(req, res, configOptions = {}) {
    if (req.method === 'OPTIONS') return sendCors(res);
    if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Only POST /api/ai/chat is supported' });

    let payload;
    try {
        payload = await readJsonBody(req);
    } catch {
        return jsonResponse(res, 400, { error: 'Invalid JSON body' });
    }

    const { zhipuApiKey } = await getLocalConfig(configOptions);
    if (!zhipuApiKey) {
        return jsonResponse(res, 500, {
            error: 'ZHIPU_API_KEY is not configured',
            details: 'Set ZHIPU_API_KEY in .env or system environment variables to enable real AI chat.'
        });
    }

    try {
        const upstream = await fetch(ZHIPU_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${zhipuApiKey}`
            },
            body: JSON.stringify(payload)
        });
        const text = await upstream.text();
        res.writeHead(upstream.status, {
            'Content-Type': upstream.headers.get('Content-Type') || 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(text);
    } catch (error) {
        jsonResponse(res, 502, { error: 'AI proxy failed', details: error.message || String(error) });
    }
}

async function serveStatic(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const target = decodeURIComponent(url.pathname) === '/' ? '/app.html' : decodeURIComponent(url.pathname);
    const filePath = path.resolve(ROOT_DIR, `.${target}`);

    if (!filePath.startsWith(ROOT_DIR)) return jsonResponse(res, 403, { error: 'Forbidden' });

    try {
        const content = await readFile(filePath);
        res.writeHead(200, {
            'Content-Type': MIME_TYPES.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream',
            'Cache-Control': 'no-cache'
        });
        res.end(content);
    } catch {
        jsonResponse(res, 404, { error: 'Not found' });
    }
}

export function createLocalServer(options = {}) {
    return createServer(async (req, res) => {
        try {
            if (req.url.startsWith('/api/tts')) return await handleTts(req, res, options);
            if (req.url.startsWith('/api/ai/chat')) return await handleAiChat(req, res, options);
            return await serveStatic(req, res);
        } catch (error) {
            return jsonResponse(res, 500, { error: 'Local server error', details: error.message || String(error) });
        }
    });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    const port = Number(process.env.PORT || DEFAULT_PORT);
    createLocalServer().listen(port, () => {
        console.log(`3Dlearn local server: http://localhost:${port}/app.html`);
        console.log('Static files + /api/ai/chat + /api/tts are served from one HTTP origin.');
    });
}
