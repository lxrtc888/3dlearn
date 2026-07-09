# 真实 LLM 对话测试设计

日期：2026-07-07

## 目标

第一阶段先验证真实大模型对话链路，不改老师形象，不接真人数字人 API，也不引入 VRM 模型。

验收目标是：

- 用户在现有聊天框输入问题。
- 前端通过 `/api/ai/chat` 调用真实 LLM。
- LLM 回复显示在聊天区。
- 如果语音老师已启用，回复继续走现有 TTS 播报和字幕显示。
- 未配置 API Key 时给出明确配置错误，不再用假回复掩盖问题。

## 当前基础

项目已经具备真实 LLM 代理链路：

- 前端模块：`js/ai-service.js`
- 本地代理：`local-server.mjs`
- 线上代理：`functions/api/ai/chat.js`
- 本地配置：`.env` 中的 `ZHIPU_API_KEY`
- 当前上游：智谱 BigModel `https://open.bigmodel.cn/api/paas/v4/chat/completions`

当前实现已经把 API Key 放在服务端，不从浏览器暴露。

## 范围

本阶段只做真实 LLM 对话测试和必要的可观测性完善。

包含：

- 确认 `.env` 配置后本地真实 API 可用。
- 确认未配置 `ZHIPU_API_KEY` 时返回清晰错误。
- 确认前端错误提示不误导用户。
- 确认真实回复能触发现有 `VoiceTutor.speak()` 链路。

不包含：

- 真人数字人 API。
- VRM/3D 人物加载。
- 嘴型同步。
- 用户语音输入。
- 更换 LLM 服务商。

## 数据流

```text
用户输入
  -> js/app.js
  -> AIService.chat()
  -> POST /api/ai/chat
  -> local-server.mjs 或 Cloudflare Function
  -> 智谱 BigModel chat/completions
  -> AIService 返回回复
  -> 聊天区显示
  -> VoiceTutor.speak(reply)
  -> /api/tts
  -> 音频播放 + 左侧字幕
```

## 配置

本地测试需要在项目根目录 `.env` 中配置：

```env
ZHIPU_API_KEY=你的智谱APIKey
```

如果还要同时验证语音播报，需要继续配置已有 TTS 变量：

```env
VOLCANO_TTS_API_KEY=
VOLCANO_TTS_RESOURCE_ID=
VOLCANO_TTS_V3_ENDPOINT=https://openspeech.bytedance.com/api/v3/tts/unidirectional
VOLCANO_TTS_VOICE_TYPE=zh_female_shuangkuaisisi_moon_bigtts
```

## 错误处理

- 本地服务未配置 `ZHIPU_API_KEY`：返回 500，说明需要配置环境变量。
- 上游 LLM 请求失败：代理返回 502 或上游状态码，前端显示“暂时无法回应”。
- TTS 失败：不影响文字回复展示，只把语音老师状态切到错误。

## 测试方式

本地启动：

```bash
python serve.py
```

访问：

```text
http://localhost:8000/app.html
```

手动验收：

1. 不配置 `ZHIPU_API_KEY` 启动，聊天应返回明确配置错误。
2. 配置 `ZHIPU_API_KEY` 后重启，输入一个和当前场景相关的问题。
3. 确认回复不是固定假数据，而是来自真实 LLM。
4. 点击“启用语音老师”，再次提问。
5. 确认回复显示、字幕显示、TTS 播放链路都能跑通。

自动验收：

- `node --test tests/local-server.test.mjs`
- `node --check local-server.mjs`
- `node --check functions/api/ai/chat.js`
- `node --check js/ai-service.js`

## 后续升级

真实 LLM 对话链路稳定后，再进入老师形象升级：

1. 先做 VRM/3D 老师音量驱动嘴型。
2. 再评估中文节奏驱动或 viseme 时间戳。
3. 如后续确实需要“真人视频级”效果，再单独评估真人数字人 API。
