async (page) => {
    const messages = [];
    page.on('console', (msg) => messages.push({ type: msg.type(), text: msg.text() }));
    page.on('pageerror', (error) => messages.push({ type: 'pageerror', text: error.message }));

    await page.setViewportSize({ width: 1365, height: 768 });
    await page.goto('http://127.0.0.1:8000/app.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('[data-avatar-index="1"]', { timeout: 10000 });
    await page.click('[data-avatar-index="1"]', { timeout: 10000 });
    await page.waitForFunction(() => window.AvatarTutor?.ready === true, null, { timeout: 90000 });
    await page.waitForTimeout(1000);

    return await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => {
        const canvas = document.getElementById('teacher-avatar-canvas');
        const rect = canvas?.getBoundingClientRect();
        const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
        let pixelStats = null;

        if (canvas && gl) {
            const width = gl.drawingBufferWidth;
            const height = gl.drawingBufferHeight;
            const pixels = new Uint8Array(width * height * 4);
            gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            let nonZero = 0;
            let bright = 0;
            for (let i = 0; i < pixels.length; i += 4) {
                const rgb = pixels[i] + pixels[i + 1] + pixels[i + 2];
                const sum = rgb + pixels[i + 3];
                if (sum > 0) nonZero += 1;
                if (rgb > 30) bright += 1;
            }
            pixelStats = { width, height, nonZero, bright, total: width * height };
        }

        resolve({
            teacherClass: document.getElementById('teacher-section')?.className || '',
            stageHidden: document.getElementById('teacher-avatar-stage')?.hidden,
            canvasHidden: canvas?.hidden,
            activeAvatarIndex: window.AvatarTutor?.activeAvatarIndex,
            avatarReady: Boolean(window.AvatarTutor?.ready),
            videoOpacity: getComputedStyle(document.getElementById('teacher-video')).opacity,
            rect: rect ? {
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                x: Math.round(rect.x),
                y: Math.round(rect.y)
            } : null,
            pixelStats,
            errors: messages.filter((item) => item.type === 'error' || item.type === 'pageerror')
        });
    })));
}
