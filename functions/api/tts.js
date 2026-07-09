function jsonResponse(body, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...extraHeaders
        }
    });
}

function buildCorsHeaders(origin = '*') {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
    };
}

function cleanText(input) {
    return String(input || '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 260);
}

function pickConfig(env) {
    const resourceId = env.VOLCANO_TTS_RESOURCE_ID || '';
    return {
        endpoint: env.VOLCANO_TTS_ENDPOINT || 'https://openspeech.bytedance.com/api/v1/tts',
        v3Endpoint: env.VOLCANO_TTS_V3_ENDPOINT || 'https://openspeech.bytedance.com/api/v3/tts/unidirectional',
        apiKey: env.VOLCANO_TTS_API_KEY || '',
        resourceId,
        appId: env.VOLCANO_TTS_APP_ID || '',
        accessToken: env.VOLCANO_TTS_ACCESS_TOKEN || '',
        cluster: env.VOLCANO_TTS_CLUSTER || 'volcano_tts',
        voiceType: env.VOLCANO_TTS_VOICE_TYPE || defaultVoiceType(resourceId)
    };
}

function defaultVoiceType(resourceId) {
    return String(resourceId || '').includes('seed-tts-2.0')
        ? 'zh_female_xiaohe_uranus_bigtts'
        : 'zh_female_shuangkuaisisi_moon_bigtts';
}

function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function concatBytes(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
        output.set(part, offset);
        offset += part.length;
    }
    return output;
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
            if (escaped) escaped = false;
            else if (char === '\\') escaped = true;
            else if (char === '"') inString = false;
            continue;
        }

        if (char === '"') inString = true;
        else if (char === '{') {
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

function decodeV3Audio(textBody) {
    const parts = [];
    for (const chunk of splitJsonObjects(String(textBody || ''))) {
        const data = JSON.parse(chunk);
        if (data.code === 0 && data.data) parts.push(base64ToBytes(data.data));
        if (data.code === 20000000) break;
        if (data.code && data.code !== 0) {
            throw new Error(data.message || `Volcano V3 TTS error: ${data.code}`);
        }
    }
    return concatBytes(parts);
}

function safeDetails(value, secret) {
    const details = String(value || 'unknown');
    return secret ? details.replaceAll(secret, '[redacted]') : details;
}

function audioResponse(audio, corsHeaders) {
    return new Response(audio, {
        status: 200,
        headers: {
            ...corsHeaders,
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'no-store'
        }
    });
}

export async function onRequestOptions(context) {
    const origin = context.request.headers.get('Origin') || '*';
    return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(origin)
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const origin = request.headers.get('Origin') || '*';
    const corsHeaders = buildCorsHeaders(origin);

    let body;
    try {
        body = await request.json();
    } catch {
        return jsonResponse({ error: 'Invalid JSON body' }, 400, corsHeaders);
    }

    const text = cleanText(body?.text);
    if (!text) {
        return jsonResponse({ error: 'text is required' }, 400, corsHeaders);
    }

    const speed = Number(body?.speed || 1);
    const safeSpeed = Number.isFinite(speed) ? Math.min(Math.max(speed, 0.5), 2) : 1;
    const config = pickConfig(env);

    if (config.apiKey) {
        return synthesizeV3(config, text, safeSpeed, corsHeaders);
    }
    if (config.appId && config.accessToken) {
        return synthesizeV1(config, text, safeSpeed, corsHeaders);
    }

    return jsonResponse(
        { error: 'TTS is not configured', details: 'Set VOLCANO_TTS_API_KEY and VOLCANO_TTS_RESOURCE_ID.' },
        500,
        corsHeaders
    );
}

async function synthesizeV3(config, text, safeSpeed, corsHeaders) {
    if (!config.resourceId) {
        return jsonResponse(
            { error: 'TTS is not configured', details: 'VOLCANO_TTS_RESOURCE_ID is required.' },
            500,
            corsHeaders
        );
    }

    try {
        const upstream = await fetch(config.v3Endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'X-Api-Key': config.apiKey,
                'X-Api-Resource-Id': config.resourceId,
                'X-Api-Request-Id': crypto.randomUUID()
            },
            body: JSON.stringify({
                user: { uid: '3dlearn-web' },
                event: 100,
                req_params: {
                    text,
                    speaker: config.voiceType,
                    audio_params: {
                        format: 'mp3',
                        sample_rate: 24000,
                        speech_rate: safeSpeed
                    }
                }
            })
        });

        const textBody = await upstream.text();
        if (!upstream.ok) {
            return jsonResponse(
                {
                    error: 'Volcano TTS V3 request failed',
                    status: upstream.status,
                    details: safeDetails(textBody.slice(0, 500), config.apiKey)
                },
                502,
                corsHeaders
            );
        }

        const audio = decodeV3Audio(textBody);
        if (!audio.length) {
            return jsonResponse(
                { error: 'Volcano TTS V3 returned no audio', details: safeDetails(textBody.slice(0, 500), config.apiKey) },
                502,
                corsHeaders
            );
        }

        return audioResponse(audio, corsHeaders);
    } catch (error) {
        return jsonResponse(
            { error: 'Volcano TTS V3 proxy failed', details: safeDetails(error.message || error, config.apiKey) },
            502,
            corsHeaders
        );
    }
}

async function synthesizeV1(config, text, safeSpeed, corsHeaders) {
    try {
        const upstream = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer;${config.accessToken}`
            },
            body: JSON.stringify({
                app: { appid: config.appId, token: config.accessToken, cluster: config.cluster },
                user: { uid: '3dlearn-web' },
                audio: {
                    voice_type: config.voiceType,
                    encoding: 'mp3',
                    speed_ratio: safeSpeed,
                    volume_ratio: 1,
                    pitch_ratio: 1
                },
                request: { reqid: crypto.randomUUID(), text, operation: 'query' }
            })
        });

        const data = await upstream.json().catch(() => null);
        if (!upstream.ok || !data || !data.data) {
            return jsonResponse(
                {
                    error: 'Volcano TTS V1 request failed',
                    status: upstream.status,
                    details: safeDetails(data?.message || data?.error, config.accessToken)
                },
                502,
                corsHeaders
            );
        }

        return audioResponse(base64ToBytes(data.data), corsHeaders);
    } catch (error) {
        return jsonResponse(
            { error: 'Volcano TTS V1 proxy failed', details: safeDetails(error.message || error, config.accessToken) },
            502,
            corsHeaders
        );
    }
}
