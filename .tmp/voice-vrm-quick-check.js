async (page) => {
    const messages = [];
    const requests = [];
    page.on('console', (msg) => messages.push({ type: msg.type(), text: msg.text() }));
    page.on('pageerror', (error) => messages.push({ type: 'pageerror', text: error.message }));
    page.on('request', (request) => {
        const url = request.url();
        if (url.includes('/assets/') || url.includes('voice-tutor-live') || url.includes('avatar-tutor')) {
            requests.push(url);
        }
    });

    await page.goto('http://127.0.0.1:8000/app.html?codex-check=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    return await page.evaluate((messagesAndRequests) => ({
        voiceReady: Boolean(window.VoiceTutor),
        voiceEnabled: window.VoiceTutor?.voiceEnabled,
        enableHidden: document.getElementById('btn-enable-voice')?.hidden,
        statusText: document.getElementById('teacher-status-text')?.textContent || '',
        avatarReady: Boolean(window.AvatarTutor?.ready),
        activeAvatarIndex: window.AvatarTutor?.activeAvatarIndex,
        loadingAvatarIndex: window.AvatarTutor?.loadingAvatarIndex,
        teacherClass: document.getElementById('teacher-section')?.className || '',
        stageHidden: document.getElementById('teacher-avatar-stage')?.hidden,
        loadingText: document.getElementById('teacher-avatar-loading')?.textContent || '',
        requests: messagesAndRequests.requests,
        errors: messagesAndRequests.messages.filter((item) => item.type === 'error' || item.type === 'pageerror'),
        warnings: messagesAndRequests.messages.filter((item) => item.type === 'warning').slice(0, 5)
    }), { messages, requests });
}
