# 语音数字人 TTS 上线方案

更新时间：2026-06-05

## 当前结论

第一版保留现有左侧数字人视频，不更换数字人，不做用户语音输入，不做嘴型同步。用户先打字提问，AI 返回文字后调用豆包 TTS，前端同步显示字幕并播放语音；语音播放期间数字人视频播放，语音结束后视频暂停。

已经正式接入火山/豆包 TTS：

- 本地开发入口：`local-server.mjs`
- 本地启动脚本：`start.bat` 或 `python serve.py`
- 本地访问地址：`http://localhost:8000/app.html`
- 本地 TTS 接口：`POST /api/tts`
- 线上函数接口：`functions/api/tts.js`

不要直接双击打开 `app.html`。`file://` 页面无法正常访问 `/api/ai/chat` 和 `/api/tts`，会触发浏览器 CORS/安全源限制。

## 本地测试步骤

1. 确认电脑已安装 Node.js 18 或更高版本。
2. 双击 `start.bat`，或在项目目录运行：

```bash
python serve.py
```

3. 浏览器打开：

```text
http://localhost:8000/app.html
```

4. 点击左侧数字人区域的“启用语音老师”。
5. 在底部输入框打字提问。
6. 验收现象：
   - AI 文字回复显示在聊天区。
   - 左侧字幕同步显示老师回复。
   - 能听到豆包 TTS 语音。
   - 语音播放时数字人视频播放。
   - 语音结束后数字人视频暂停。

本地必须配置 `ZHIPU_API_KEY` 才能正常 AI 聊天。未配置时，`/api/ai/chat` 会返回配置错误，不再返回固定测试回答。

## 环境变量

新版豆包 TTS 推荐配置：

```env
VOLCANO_TTS_API_KEY=
VOLCANO_TTS_RESOURCE_ID=
VOLCANO_TTS_V3_ENDPOINT=https://openspeech.bytedance.com/api/v3/tts/unidirectional
VOLCANO_TTS_VOICE_TYPE=zh_female_xiaohe_uranus_bigtts
```

旧版兼容配置：

```env
VOLCANO_TTS_APP_ID=
VOLCANO_TTS_ACCESS_TOKEN=
VOLCANO_TTS_CLUSTER=volcano_tts
VOLCANO_TTS_ENDPOINT=https://openspeech.bytedance.com/api/v1/tts
```

AI 对话配置：

```env
ZHIPU_API_KEY=
```

本地建议在项目根目录新建 `.env`，填入：

```env
ZHIPU_API_KEY=你的智谱APIKey
```

保存后重启 `start.bat` 或 `python serve.py`。

本地服务会优先读取系统环境变量和 `.env`，也会读取 `docs/火山TTS引擎key及指南.txt` 中的官方字段。该 key 文件已被 `.gitignore` 忽略，不能提交到公开仓库。

## 上线要求

如果用 Cloudflare Pages：

- 保留 `functions/api/tts.js`
- 在 Cloudflare Pages 环境变量里配置 `VOLCANO_TTS_API_KEY` 和 `VOLCANO_TTS_RESOURCE_ID`
- 按需配置 `VOLCANO_TTS_VOICE_TYPE`
- 配置 `ZHIPU_API_KEY`

如果用 Vercel：

- 当前 `functions/api/tts.js` 是 Cloudflare Pages Functions 风格，不能直接作为 Vercel Serverless Function 使用。
- 需要另建 Vercel 版本的 `/api/tts` 和 `/api/ai/chat`，逻辑可复用当前函数。

如果只部署到 GitHub Pages：

- GitHub Pages 只能托管静态文件，不能运行 `/api/tts`。
- 必须额外部署一个后端/API 服务，否则语音无法上线使用。

## 已验证

本地已验证：

- `node --test tests/local-server.test.mjs` 通过。
- `node --check local-server.mjs` 通过。
- `node --check functions/api/tts.js` 通过。
- `POST http://localhost:8000/api/tts` 使用中文文本返回 `200 audio/mpeg`，音频大小约 31 KB。

## 后续迭代

第一版上线后再考虑：

- 用户语音输入转文字。
- 字幕逐句或逐字高亮。
- 语音播放队列和缓存。
- 更自然的数字人视频素材。
- 嘴型同步。
