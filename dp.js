/* ============================================================
   DRAINPRO · efectos de la página rediseñada (26-09).
   Corre DESPUÉS de app.js (que lleva el formulario, la ruleta, las reseñas
   y el píxel: eso no se toca). Todo se ve aunque este archivo falle: lo
   que se anima se esconde recién acá, justo antes de observarlo, y nada
   depende de requestAnimationFrame para aparecer (se congela con la
   pestaña oculta; medido en el foco).
   ============================================================ */
(function () {
  'use strict';
  var QUIETO = false;
  try { QUIETO = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ancho real (100vw incluye la barra de scroll y corre la página) */
  function medir() { document.documentElement.style.setProperty('--dp-vw', document.documentElement.clientWidth + 'px'); }
  medir(); window.addEventListener('resize', medir); window.addEventListener('orientationchange', medir);

  /* ---- hero: burbujas + video + cascada ---- */
  var caja = document.querySelector('.dp-burbujas');
  if (caja) {
    var h = '';
    for (var i = 0; i < 22; i++) {
      h += '<i style="--x:' + (Math.random() * 100).toFixed(1) + '%;--t:' + (5 + Math.random() * 6).toFixed(2) + 's;--r:' + (Math.random() * 6).toFixed(2) + 's;--s:' + (0.5 + Math.random() * 1.6).toFixed(2) + '"></i>';
    }
    caja.innerHTML = h;
  }
  var vid = document.querySelector('.dp-video');
  if (vid) {
    var prender = function () { try { if (vid.paused) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); } } catch (e) {} };
    if (document.readyState === 'complete') setTimeout(prender, 300);
    else window.addEventListener('load', function () { setTimeout(prender, 300); });
  }
  if (!QUIETO) {
    document.body.classList.add('dp-arranca');
    setTimeout(function () { void document.body.offsetWidth; document.body.classList.add('dp-listo'); }, 400);
  }

  /* ---- cifras: conteo progresivo con golpe de luz ---- */
  var fila = document.querySelector('.dp-med');
  if (fila && !QUIETO && 'IntersectionObserver' in window) {
    var fin = function (el) { el.classList.add('dp-fin'); };
    var subir = function (el, hasta, antes) {
      var ini = Date.now(), dur = 1500;
      var t = setInterval(function () {
        var p = Math.min((Date.now() - ini) / dur, 1);
        el.textContent = (antes || '') + Math.round(hasta * (1 - Math.pow(1 - p, 3)));
        if (p >= 1) { clearInterval(t); el.textContent = (antes || '') + hasta; fin(el); }
      }, 30);
    };
    var rodillo = function (el, antes) {
      var i = 0, total = 24, t = setInterval(function () {
        i++; el.textContent = (antes || '') + (i >= total ? '0' : Math.floor(Math.random() * 9) + 1);
        if (i >= total) { clearInterval(t); fin(el); }
      }, 70);
    };
    var obsM = new IntersectionObserver(function (vs) {
      vs.forEach(function (v) {
        if (!v.isIntersecting) return;
        obsM.unobserve(v.target);
        v.target.querySelectorAll('b[data-hasta]').forEach(function (b, k) {
          setTimeout(function () {
            var antes = b.getAttribute('data-antes') || '';
            if (b.getAttribute('data-rodillo')) rodillo(b, antes); else subir(b, Number(b.getAttribute('data-hasta')), antes);
          }, k * 240);
        });
      });
    }, { threshold: 0.4 });
    obsM.observe(fila);
  }

  /* ---- la línea de los pasos se llena al bajar ---- */
  var linea = document.querySelector('.dp-linea');
  var riel = linea && linea.querySelector('.dp-riel i');
  if (linea && riel) {
    var pasos = linea.querySelectorAll('.dp-paso');
    if (QUIETO) { riel.style.transform = 'scaleY(1)'; pasos.forEach(function (p) { p.classList.add('dp-on'); }); }
    else {
      var pide = false;
      var pintar = function () {
        pide = false;
        var r = linea.getBoundingClientRect();
        var p = Math.max(0, Math.min(1, (window.innerHeight * 0.62 - r.top) / r.height));
        riel.style.transform = 'scaleY(' + p.toFixed(3) + ')';
        pasos.forEach(function (li) { li.classList.toggle('dp-on', p * r.height >= li.offsetTop + 14); });
      };
      var pedir = function () { if (!pide) { pide = true; requestAnimationFrame(pintar); } };
      window.addEventListener('scroll', pedir, { passive: true });
      window.addEventListener('resize', pedir);
      pintar();
    }
  }

  /* ---- linterna en las tarjetas ---- */
  document.querySelectorAll('.dp-tar').forEach(function (t) {
    function mover(e) {
      var p = e.touches ? e.touches[0] : e; var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', (p.clientX - r.left).toFixed(0) + 'px');
      t.style.setProperty('--my', (p.clientY - r.top).toFixed(0) + 'px');
    }
    t.addEventListener('pointermove', mover, { passive: true });
    t.addEventListener('touchmove', mover, { passive: true });
    t.addEventListener('pointerdown', function (e) { mover(e); t.classList.add('dp-luz'); });
    t.addEventListener('pointerleave', function () { t.classList.remove('dp-luz'); });
    t.addEventListener('pointerup', function () { setTimeout(function () { t.classList.remove('dp-luz'); }, 650); });
  });

  /* ---- boletín del pie (mismo comportamiento que la tienda, ficha.js) ---- */
  var fb = document.getElementById('fBoletin');
  if (fb) {
    fb.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = document.getElementById('correoBoletin'), ok = document.getElementById('aceptoBoletin');
      if (!c.value || c.value.indexOf('@') < 0) { c.focus(); return; }
      if (ok && !ok.checked) { ok.focus(); return; }
      fb.outerHTML = '<p class="gracias">Listo. Te avisamos cuando haya novedades.</p>';
    });
  }

  /* ---- entradas al aparecer (con red de seguridad) ---- */
  if (!QUIETO && 'IntersectionObserver' in window) {
    var els = document.querySelectorAll('.dp-rev');
    document.body.classList.add('dp-anima');
    var obs = new IntersectionObserver(function (vs) {
      vs.forEach(function (v) { if (!v.isIntersecting) return; v.target.classList.add('dp-in'); obs.unobserve(v.target); });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    els.forEach(function (e) {
      if (e.getBoundingClientRect().top < window.innerHeight * 0.9) { e.classList.add('dp-in'); return; }
      e.classList.add('dp-pre'); obs.observe(e);
    });
    var red = setInterval(function () {
      var quedan = 0;
      document.querySelectorAll('.dp-pre:not(.dp-in)').forEach(function (e) {
        if (e.getBoundingClientRect().top < window.innerHeight) e.classList.add('dp-in'); else quedan++;
      });
      if (!quedan) clearInterval(red);
    }, 400);
  }
})();
