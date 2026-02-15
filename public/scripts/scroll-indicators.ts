// @ts-nocheck
document.addEventListener('DOMContentLoaded', () => {
    let subHeader = null;

    const updateScrollIndicators = (el) => {
        if (!el) return;
        const scrollLeft = el.scrollLeft;
        const scrollWidth = el.scrollWidth;
        const clientWidth = el.clientWidth;

        const tolerance = 2; 
        const canScrollLeft = scrollLeft > tolerance;
        const canScrollRight = scrollLeft < (scrollWidth - clientWidth - tolerance);

        if (canScrollLeft) el.classList.add('scroll-left');
        else el.classList.remove('scroll-left');

        if (canScrollRight) el.classList.add('scroll-right');
        else el.classList.remove('scroll-right');
    };

    const attachListeners = () => {
        subHeader = document.querySelector('.sub-header');
        if (subHeader) {
            subHeader.addEventListener('scroll', () => updateScrollIndicators(subHeader));
            updateScrollIndicators(subHeader);
            // Also watch for resize
            window.addEventListener('resize', () => updateScrollIndicators(subHeader));
            return true;
        }
        return false;
    };

    // 1. Try immediate
    if (!attachListeners()) {
        // 2. Observer if not found (since it's injected)
        const observer = new MutationObserver((mutations, obs) => {
            if (attachListeners()) {
                obs.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // 3. Fallback polling for a few seconds
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        if (subHeader || attempts > 20) {
            clearInterval(interval);
            if (subHeader) updateScrollIndicators(subHeader);
        } else {
            attachListeners();
        }
    }, 500);
});
