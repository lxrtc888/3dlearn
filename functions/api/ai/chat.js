/**
 * Cloudflare Pages Function: AI 代理
 * - 把前端请求转发到智谱接口
 * - 前端不再暴露 API Key
 * - 需要在 Cloudflare 环境变量中配置 ZHIPU_API_KEY
 */

const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

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

    if (!env.ZHIPU_API_KEY) {
        return jsonResponse(
            { error: '服务端未配置 ZHIPU_API_KEY 环境变量' },
            500,
            corsHeaders
        );
    }

    let payload;
    try {
        payload = await request.json();
    } catch (error) {
        return jsonResponse({ error: '请求体不是合法 JSON' }, 400, corsHeaders);
    }

    try {
        const upstreamResponse = await fetch(ZHIPU_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${env.ZHIPU_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        const text = await upstreamResponse.text();
        return new Response(text, {
            status: upstreamResponse.status,
            headers: {
                ...corsHeaders,
                'Content-Type': upstreamResponse.headers.get('Content-Type') || 'application/json; charset=utf-8'
            }
        });
    } catch (error) {
        return jsonResponse(
            { error: 'AI 服务转发失败', details: error.message || String(error) },
            502,
            corsHeaders
        );
    }
}
