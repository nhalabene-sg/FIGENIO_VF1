/* Genius Raros — adaptation téléphone (navigation, menus, zoom page). N’altère pas le bureau. */
(function () {
    var MQ = '(max-width: 820px), (max-width: 960px) and (pointer: coarse)';
    var userZoomed = false;
    var origSetZoom = null;

    function isPhone() {
        try { return window.matchMedia(MQ).matches; } catch (e) { return window.innerWidth <= 820; }
    }
    function pageW() {
        if (typeof getPageWidth === 'function') return getPageWidth();
        if (window.PageGeometry) return window.PageGeometry.width;
        var ed = document.getElementById('editor');
        return (ed && ed.offsetWidth) || 794;
    }
    function visSize() {
        var vv = window.visualViewport;
        return {
            w: (vv && vv.width) || window.innerWidth,
            h: (vv && vv.height) || window.innerHeight,
            dx: (vv && vv.offsetLeft) || 0,
            dy: (vv && vv.offsetTop) || 0
        };
    }
    function markPhone() {
        var on = isPhone();
        document.body.classList.toggle('abene-phone', on);
        var slider = document.getElementById('zoomSlider');
        if (slider) {
            slider.min = '50';
            slider.max = '200';
        }
        return on;
    }
    function removePhoneSizer() {
        var el = document.getElementById('abenePhoneSizer');
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    function sizerEl() {
        var area = document.getElementById('editorArea');
        if (!area) return null;
        if (document.body.classList.contains('abene-excel-mode')) {
            removePhoneSizer();
            return null;
        }
        var el = document.getElementById('abenePhoneSizer');
        if (!el) {
            el = document.createElement('div');
            el.id = 'abenePhoneSizer';
            el.setAttribute('aria-hidden', 'true');
            el.style.cssText = 'pointer-events:none;flex-shrink:0;visibility:hidden;';
            area.appendChild(el);
        }
        return el;
    }
    function layoutPhoneZoom() {
        var box = document.getElementById('pageContainer');
        var area = document.getElementById('editorArea');
        var sizer = document.getElementById('abenePhoneSizer');
        if (!box || !area) return;
        var z = ((window.abene && window.abene.currentZoom) || 100) / 100;
        if (document.body.classList.contains('abene-excel-mode')) {
            removePhoneSizer();
            box.style.position = '';
            box.style.left = '';
            box.style.top = '';
            box.style.transformOrigin = 'top center';
            return;
        }
        if (!document.body.classList.contains('abene-phone') || document.body.classList.contains('abene-printing')) {
            box.style.position = '';
            box.style.left = '';
            box.style.top = '';
            box.style.transformOrigin = 'top center';
            if (sizer && sizer.parentNode) sizer.parentNode.removeChild(sizer);
            return;
        }
        sizer = sizerEl();
        box.style.transformOrigin = 'top left';
        box.style.position = 'absolute';
        box.style.left = '8px';
        box.style.top = '8px';
        var w = pageW();
        var h = Math.max(box.scrollHeight, box.offsetHeight, 1);
        if (sizer) {
            sizer.style.width = Math.ceil(w * z + 16) + 'px';
            sizer.style.height = Math.ceil(h * z + 16) + 'px';
        }
    }
    function zoomFrozen() {
        return !!(window._abeneFreezeZoom || (document.body && document.body.classList.contains('abene-printing')));
    }
    function fitPageToPhone(force) {
        if (zoomFrozen()) return;
        if (!markPhone()) {
            layoutPhoneZoom();
            return;
        }
        if (!force && userZoomed) {
            layoutPhoneZoom();
            return;
        }
        var area = document.getElementById('editorArea');
        if (!area) return;
        var avail = Math.max(180, area.clientWidth - 16);
        var pct = Math.max(55, Math.min(100, Math.floor((avail / pageW()) * 100)));
        userZoomed = false;
        if (typeof window.setZoom === 'function') window.setZoom(pct);
        else layoutPhoneZoom();
    }
    function clampEl(el) {
        if (!el || el.id === 'abeneExportRoot') return;
        var style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        if (!el.classList.contains('visible') && style.display !== 'flex' && style.display !== 'block') return;
        var pad = 8;
        var v = visSize();
        el.style.maxWidth = Math.max(160, v.w - pad * 2) + 'px';
        el.style.maxHeight = Math.max(120, v.h - pad * 2) + 'px';
        el.style.overflowY = 'auto';
        var r = el.getBoundingClientRect();
        var left = r.left;
        var top = r.top;
        if (r.right > v.w - pad) left = Math.max(pad, v.w - r.width - pad);
        if (left < pad) left = pad;
        if (r.bottom > v.h - pad) top = Math.max(pad, v.h - r.height - pad);
        if (top < pad) top = pad;
        if (el.style.position === 'fixed' || style.position === 'fixed' || style.position === 'absolute') {
            el.style.left = left + 'px';
            el.style.top = top + 'px';
            el.style.right = 'auto';
        }
    }
    function clampOpenUi() {
        if (!document.body.classList.contains('abene-phone')) return;
        ['fileMenu', 'ribbonFlyout', 'tableSizePicker', 'miniToolbar'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el && el.classList.contains('visible')) clampEl(el);
        });
        document.querySelectorAll('.dropdown-menu.visible, .ribbon-flyout.visible, .table-size-picker.visible, .mini-toolbar.visible').forEach(clampEl);
        document.querySelectorAll('.modal-overlay.visible .modal').forEach(function (box) {
            box.style.maxHeight = Math.max(160, visSize().h - 12) + 'px';
        });
    }
    function placeSheetMenu(menu, ev) {
        if (!menu) return;
        menu.classList.add('visible');
        if (!document.body.classList.contains('abene-phone') && !isPhone()) return false;
        var v = visSize();
        var kb = 0;
        try { kb = parseFloat(getComputedStyle(document.body).getPropertyValue('--abene-kb')) || 0; } catch (e) {}
        var gap = Math.max(8, window.innerHeight - (v.dy + v.h) + 8, kb);
        menu.style.left = '8px';
        menu.style.right = '8px';
        menu.style.width = 'auto';
        menu.style.top = 'auto';
        menu.style.bottom = gap + 'px';
        menu.style.maxHeight = Math.max(140, Math.min(v.h * 0.7, v.h - 16)) + 'px';
        menu.style.overflowY = 'auto';
        return true;
    }
    function bindLongPress(el, handler) {
        if (!el || el._abeneLp) return;
        el._abeneLp = true;
        var timer, sx, sy, fired;
        function clear() { clearTimeout(timer); timer = null; }
        el.addEventListener('touchstart', function (e) {
            if (!document.body.classList.contains('abene-phone')) return;
            var t = e.touches && e.touches[0];
            if (!t) return;
            sx = t.clientX; sy = t.clientY; fired = false;
            timer = setTimeout(function () {
                fired = true;
                handler({
                    clientX: sx, clientY: sy, target: e.target,
                    preventDefault: function () {}, stopPropagation: function () {}
                });
            }, 520);
        }, { passive: true });
        el.addEventListener('touchmove', function (e) {
            var t = e.touches && e.touches[0];
            if (!t || Math.hypot(t.clientX - sx, t.clientY - sy) > 14) clear();
        }, { passive: true });
        el.addEventListener('touchend', function (e) {
            if (fired) e.preventDefault();
            clear();
        });
        el.addEventListener('touchcancel', clear);
    }
    function wrapZoom() {
        if (typeof window.setZoom !== 'function' || window.setZoom._abenePhone) return;
        origSetZoom = window.setZoom;
        window.setZoom = function (val) {
            if (zoomFrozen()) return;
            var n = parseInt(val, 10);
            if (document.body.classList.contains('abene-phone')) n = Math.max(50, Math.min(200, n));
            origSetZoom(n);
            layoutPhoneZoom();
        };
        window.setZoom._abenePhone = true;
        var zin = window.zoomIn;
        var zout = window.zoomOut;
        var zreset = window.zoomReset;
        window.zoomIn = function () {
            userZoomed = true;
            var cur = (window.abene && window.abene.currentZoom) || 100;
            window.setZoom(Math.min(200, cur + 10));
        };
        window.zoomOut = function () {
            userZoomed = true;
            var min = document.body.classList.contains('abene-phone') ? 50 : 50;
            var cur = (window.abene && window.abene.currentZoom) || 100;
            window.setZoom(Math.max(min, cur - 10));
        };
        window.zoomReset = function () {
            userZoomed = true;
            if (document.body.classList.contains('abene-phone')) fitPageToPhone(true);
            else if (zreset) zreset();
            else window.setZoom(100);
        };
        if (typeof zin === 'function') window.zoomIn._orig = zin;
        if (typeof zout === 'function') window.zoomOut._orig = zout;
        var slider = document.getElementById('zoomSlider');
        if (slider && !slider._abenePhone) {
            slider.addEventListener('input', function () { userZoomed = true; });
            slider._abenePhone = true;
        }
        if (typeof window.refreshPagination === 'function' && !window.refreshPagination._abenePhone) {
            var rp = window.refreshPagination;
            window.refreshPagination = function () {
                var out = rp.apply(this, arguments);
                layoutPhoneZoom();
                return out;
            };
            window.refreshPagination._abenePhone = true;
        }
    }
    function wrapFileMenu() {
        if (typeof window.showFileMenu !== 'function' || window.showFileMenu._abenePhone) return;
        var orig = window.showFileMenu;
        window.showFileMenu = function (e) {
            orig(e);
            if (document.body.classList.contains('abene-phone')) {
                var menu = document.getElementById('fileMenu');
                if (menu) {
                    menu.style.left = '8px';
                    menu.style.right = '8px';
                    menu.style.width = 'auto';
                    clampEl(menu);
                }
            }
        };
        window.showFileMenu._abenePhone = true;
    }
    function wrapExcelMode() {
        var ent = window.abeneExcelEnter;
        if (typeof ent === 'function' && !ent._abenePhone) {
            window.abeneExcelEnter = function () {
                var out = ent.apply(this, arguments);
                layoutPhoneZoom();
                return out;
            };
            window.abeneExcelEnter._abenePhone = true;
        }
        var lv = window.abeneExcelLeave;
        if (typeof lv === 'function' && !lv._abenePhone) {
            window.abeneExcelLeave = function () {
                var out = lv.apply(this, arguments);
                layoutPhoneZoom();
                return out;
            };
            window.abeneExcelLeave._abenePhone = true;
        }
    }
    function onKb() {
        if (!document.body.classList.contains('abene-phone')) return;
        var vv = window.visualViewport;
        if (!vv) return;
        var kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        document.body.style.setProperty('--abene-kb', kb + 'px');
        var bar = document.querySelector('.status-bar');
        if (bar) bar.style.marginBottom = kb > 40 ? kb + 'px' : '';
    }
    function bind() {
        markPhone();
        wrapZoom();
        wrapFileMenu();
        wrapExcelMode();
        fitPageToPhone(false);
        bindLongPress(document.getElementById('editor'), function (ev) {
            if (typeof window.showContextMenu === 'function') {
                ev.preventDefault();
                window.showContextMenu(ev);
            }
        });
        bindLongPress(document.getElementById('excelGrid'), function (ev) {
            var td = ev.target && ev.target.closest && ev.target.closest('.xl-cell');
            if (td && typeof window.abeneExcelOpenCellMenu === 'function') {
                window.abeneExcelOpenCellMenu(Number(td.getAttribute('data-c')), Number(td.getAttribute('data-r')), ev);
            }
        });
        if (window.matchMedia) {
            var mql = window.matchMedia(MQ);
            var onMq = function () {
                if (zoomFrozen()) return;
                if (!isPhone()) {
                    markPhone();
                    layoutPhoneZoom();
                    return;
                }
                userZoomed = false;
                fitPageToPhone(true);
            };
            if (mql.addEventListener) mql.addEventListener('change', onMq);
            else if (mql.addListener) mql.addListener(onMq);
        }
        window.addEventListener('orientationchange', function () {
            if (zoomFrozen()) return;
            userZoomed = false;
            setTimeout(function () { fitPageToPhone(true); }, 180);
        });
        window.addEventListener('resize', function () {
            if (zoomFrozen()) return;
            markPhone();
            layoutPhoneZoom();
            clampOpenUi();
        });
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', onKb);
            window.visualViewport.addEventListener('scroll', onKb);
        }
        window.abenePlaceSheetMenu = placeSheetMenu;
        window.abeneIsPhone = function () { return document.body.classList.contains('abene-phone') || isPhone(); };
        window.abeneLayoutPhoneZoom = layoutPhoneZoom;
        var fly = document.getElementById('ribbonFlyout');
        if (fly && window.MutationObserver) {
            new MutationObserver(function () { clampOpenUi(); }).observe(fly, { attributes: true, attributeFilter: ['class', 'style'] });
        }
        document.addEventListener('click', function () {
            setTimeout(clampOpenUi, 0);
        }, true);
        requestAnimationFrame(function () {
            setTimeout(function () { fitPageToPhone(false); }, 80);
        });
    }
    window.abenePlaceSheetMenu = placeSheetMenu;
    window.abeneIsPhone = function () { return document.body.classList.contains('abene-phone') || isPhone(); };
    window.abeneLayoutPhoneZoom = layoutPhoneZoom;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
})();
