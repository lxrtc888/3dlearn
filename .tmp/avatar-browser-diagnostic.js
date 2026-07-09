async (page) => {
    const messages = [];
    const navigations = [];
    page.on('console', (msg) => messages.push({ type: msg.type(), text: msg.text() }));
    page.on('pageerror', (error) => messages.push({ type: 'pageerror', text: error.message }));
    page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) navigations.push(frame.url());
    });

    await page.setViewportSize({ width: 1365, height: 768 });
    await page.goto('http://127.0.0.1:8000/app.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('[data-avatar-index="1"]', { timeout: 10000 });
    const beforeClick = await page.evaluate(() => ({
        url: location.href,
        activeAvatarIndex: window.AvatarTutor?.activeAvatarIndex,
        loadingAvatarIndex: window.AvatarTutor?.loadingAvatarIndex,
        ready: Boolean(window.AvatarTutor?.ready),
        buttonStates: Array.from(document.querySelectorAll('[data-avatar-index]'), (button) => ({
            index: button.dataset.avatarIndex,
            disabled: button.disabled,
            active: button.classList.contains('active'),
            loading: button.classList.contains('loading')
        }))
    }));

    await page.click('[data-avatar-index="1"]', { timeout: 10000 });
    await page.waitForTimeout(15000);

    let afterClick;
    try {
        afterClick = await page.evaluate(() => ({
            url: location.href,
            teacherClass: document.getElementById('teacher-section')?.className || '',
            stageHidden: document.getElementById('teacher-avatar-stage')?.hidden,
            canvasHidden: document.getElementById('teacher-avatar-canvas')?.hidden,
            loadingText: document.getElementById('teacher-avatar-loading')?.textContent || '',
            activeAvatarIndex: window.AvatarTutor?.activeAvatarIndex,
            loadingAvatarIndex: window.AvatarTutor?.loadingAvatarIndex,
            loadSeq: window.AvatarTutor?.loadSeq,
            hasLoader: Boolean(window.AvatarTutor?.loader),
            hasVrm: Boolean(window.AvatarTutor?.vrm),
            ready: Boolean(window.AvatarTutor?.ready),
            running: Boolean(window.AvatarTutor?.running),
            buttonStates: Array.from(document.querySelectorAll('[data-avatar-index]'), (button) => ({
                index: button.dataset.avatarIndex,
                disabled: button.disabled,
                active: button.classList.contains('active'),
                loading: button.classList.contains('loading')
            }))
        }));
    } catch (error) {
        afterClick = { evalError: error.message, url: page.url() };
    }

    return { beforeClick, afterClick, navigations, messages };
}
