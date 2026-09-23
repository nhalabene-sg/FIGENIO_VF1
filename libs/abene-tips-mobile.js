/* Genius Raros — complemento móvel para as infobolhas existentes. */
(function () {
    var inspectTimer = 0;
    var autoHideTimer = 0;

    function isTouchLayout() {
        try {
            if (window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches) return true;
        } catch (eMedia) {}
        return (navigator.maxTouchPoints || 0) > 0 && window.innerWidth <= 900;
    }

    function tipBox() {
        return document.querySelector('.abene-ui-tip');
    }

    function restoreCurrentTitle() {
        document.querySelectorAll('[data-abene-tip="1"][data-tip-src]').forEach(function (el) {
            if (el.getAttribute('title') === '') el.setAttribute('title', el.getAttribute('data-tip-src') || '');
        });
    }

    function hideTip() {
        clearTimeout(inspectTimer);
        clearTimeout(autoHideTimer);
        var box = tipBox();
        if (box) box.style.display = 'none';
        restoreCurrentTitle();
    }

    function placeAboveWhenPossible(el, box) {
        if (!isTouchLayout() || !el || !box) return;
        var target = el.getBoundingClientRect();
        var rect = box.getBoundingClientRect();
        var top = target.top - rect.height - 8;
        if (top >= 8) box.style.top = Math.round(top) + 'px';
    }

    function inspectTip(el) {
        var box = tipBox();
        if (!box || getComputedStyle(box).display === 'none') return;
        placeAboveWhenPossible(el, box);
        clearTimeout(autoHideTimer);
        autoHideTimer = setTimeout(hideTip, 900);
    }

    function onOver(ev) {
        if (!isTouchLayout()) return;
        var el = ev.target && ev.target.closest('[data-abene-tip="1"]');
        if (!el) return;
        clearTimeout(inspectTimer);
        inspectTimer = setTimeout(function () { inspectTip(el); }, 330);
    }

    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('pointerdown', hideTip, true);
    document.addEventListener('touchstart', hideTip, { capture: true, passive: true });
    document.addEventListener('scroll', hideTip, true);
    window.addEventListener('resize', hideTip);
    document.addEventListener('visibilitychange', hideTip);
    window.abeneHideUiTipMobile = hideTip;
})();
