/* ═══════════════════════════════════════════════════════════════
   TechArt Studio — Motion layer (GSAP 3.13 + ScrollTrigger + SplitText)
   Chargé sur toutes les pages, après GSAP et avant le script inline.
   Chaque module vérifie la présence de ses éléments.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.reduceMotion = reduce;

  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove("motion-ok");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  const canSplit = !!window.SplitText;
  if (canSplit) gsap.registerPlugin(SplitText);

  const motion = root.classList.contains("motion-ok");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const EASE = "expo.out";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Éléments pris en charge par un module dédié : exclus du reveal générique.
  const handled = new Set();

  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => setTimeout(r, 1200)),
  ]);

  /* Découpe un texte et renvoie les morceaux à animer (ou null sans SplitText). */
  function split(el, type, mask) {
    if (!canSplit || !el) return null;
    return SplitText.create(el, { type, mask });
  }

  /* ── Barre de progression du scroll ─────────────────────────── */
  function scrollProgress() {
    const bar = document.createElement("div");
    bar.id = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    if (CSS.supports("animation-timeline: scroll()")) return;
    gsap.to(bar, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
    });
  }

  /* ── Halo doré qui suit le curseur dans les cards ───────────── */
  function spotlight() {
    if (!finePointer) return;
    $$(".s-card, .val-card, .pf-item, .design-card, .cat-card").forEach((card) => {
      const spot = document.createElement("span");
      spot.className = "spot";
      spot.setAttribute("aria-hidden", "true");
      card.appendChild(spot);
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  /* ── Boutons magnétiques (6px max) ──────────────────────────── */
  function magnetic() {
    if (!finePointer || !motion) return;
    const MAX = 6;
    $$(".btn-primary, .btn-secondary, #lb-link").forEach((btn) => {
      gsap.set(btn, { "--mag-x": "0px", "--mag-y": "0px" });
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        gsap.to(btn, {
          "--mag-x": `${dx * MAX}px`,
          "--mag-y": `${dy * MAX}px`,
          duration: 0.4,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
      btn.addEventListener("pointerleave", () => {
        gsap.to(btn, {
          "--mag-x": "0px",
          "--mag-y": "0px",
          duration: 0.6,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
    });
  }

  /* ── Hero accueil ───────────────────────────────────────────── */
  function heroHome() {
    const hero = $("#hero");
    if (!hero) return;
    const title = $(".hero-title", hero);
    const words = split(title, "lines,words", "lines");
    const gold = $$(".italic-gold", title);

    const tl = gsap.timeline({ delay: 0.15, defaults: { ease: EASE } });
    tl.fromTo(
      ".hero-corner",
      { opacity: 0, scale: 0 },
      { opacity: 1, scale: 1, duration: 1.2, stagger: 0.08 },
      0,
    )
      .fromTo(
        ".hero-logo",
        { opacity: 0, y: -20, scale: 0.92, filter: "blur(10px)" },
        { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.4, clearProps: "filter" },
        0.1,
      )
      .fromTo(
        ".hero-eyebrow",
        { opacity: 0, filter: "blur(6px)", letterSpacing: "0.8em" },
        { opacity: 1, filter: "blur(0px)", letterSpacing: "0.45em", duration: 1.2, clearProps: "filter,letterSpacing" },
        0.45,
      )
      .set(title, { opacity: 1 }, 0.65);

    if (words) {
      tl.from(words.words, { yPercent: 110, duration: 1.2, stagger: 0.07 }, 0.65);
    } else {
      tl.from(title, { y: 40, duration: 1.1 }, 0.65);
    }

    // « or numérique » brille une fois
    tl.fromTo(gold, { textShadow: "0 0 0px rgba(232,184,75,0)" }, {
      textShadow: "0 0 28px rgba(232,184,75,.6)",
      duration: 0.6,
      ease: "sine.inOut",
      yoyo: true,
      repeat: 1,
      clearProps: "textShadow",
    }, 1.5)
      .fromTo(
        ".hero-subtitle",
        { opacity: 0, y: 12, filter: "blur(6px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, clearProps: "transform,filter" },
        1.05,
      )
      .set(".hero-ctas", { opacity: 1 }, 1.2)
      .from(".hero-ctas > *", {
        opacity: 0,
        y: 16,
        filter: "blur(6px)",
        duration: 0.9,
        stagger: 0.1,
        clearProps: "transform,filter",
      }, 1.2)
      .fromTo(".scroll-hint", { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1.6)
      .add(() => {
        if (words) words.revert();
        gsap.to(".hero-logo", { y: -12, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
      });

    // Parallax + fondu du contenu en sortie de hero
    gsap.to(".hero-content", {
      y: () => window.innerHeight * 0.28,
      opacity: 0,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true },
    });
    gsap.to("#particles-canvas", {
      y: () => window.innerHeight * 0.15,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true },
    });
  }

  /* ── Hero portfolio ─────────────────────────────────────────── */
  function heroPortfolio() {
    const hero = $("#page-hero");
    if (!hero) return;
    const name = $(".hero-identity-name", hero);
    const avatar = $(".hero-avatar", hero);
    const chars = split(name, "chars", "chars");

    const tl = gsap.timeline({ delay: 0.15, defaults: { ease: EASE } });
    tl.fromTo(
      $$(".hero-corner", hero),
      { opacity: 0, scale: 0 },
      { opacity: 1, scale: 1, duration: 1.2, stagger: 0.08 },
      0,
    );

    if (avatar) {
      // Révélation par masque, du bas vers le haut ; la marge de 90px garde le halo visible.
      const h = avatar.offsetHeight;
      tl.fromTo(
        avatar,
        { opacity: 1, scale: 1.06, clipPath: `inset(${h + 90}px -90px -90px -90px round 20px)` },
        { scale: 1, clipPath: "inset(-90px -90px -90px -90px round 20px)", duration: 1.5, ease: "expo.inOut", clearProps: "clipPath,transform" },
        0.1,
      );
    }

    tl.fromTo(
      ".page-eyebrow",
      { opacity: 0, filter: "blur(6px)" },
      { opacity: 1, filter: "blur(0px)", duration: 0.9, clearProps: "filter" },
      0.5,
    ).set(name, { opacity: 1 }, 0.6);

    if (chars) {
      tl.from(chars.chars, { yPercent: 110, duration: 1.1, stagger: 0.05, onComplete: () => chars.revert() }, 0.6);
    }

    tl.fromTo(
      [".hero-identity-role", ".hero-contact", ".hero-bio"],
      { opacity: 0, y: 14, filter: "blur(6px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, stagger: 0.1, clearProps: "transform,filter" },
      0.85,
    ).fromTo(
      ".hero-tool-badge",
      { opacity: 0, y: 10, filter: "blur(4px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, stagger: 0.05, clearProps: "transform,filter" },
      1.15,
    );
  }

  /* ── Hero des pages catégorie ───────────────────────────────── */
  function heroCategory() {
    const hero = $(".cat-page-hero");
    if (!hero) return;
    const title = $(".cat-page-title", hero);
    const chars = split(title, "lines,chars", "lines");

    const tl = gsap.timeline({ delay: 0.1, defaults: { ease: EASE } });
    tl.fromTo(".back-link", { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.9, clearProps: "transform" }, 0)
      .fromTo(
        ".cat-page-eyebrow",
        { opacity: 0, filter: "blur(6px)", letterSpacing: "0.8em" },
        { opacity: 1, filter: "blur(0px)", letterSpacing: "0.45em", duration: 1, clearProps: "filter,letterSpacing" },
        0.1,
      )
      .set(title, { opacity: 1 }, 0.2);

    if (chars) {
      tl.from(chars.chars, { yPercent: 110, duration: 1.1, stagger: 0.045, onComplete: () => chars.revert() }, 0.2);
    }

    tl.fromTo(
      ".cat-page-sub",
      { opacity: 0, y: 10, filter: "blur(6px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, clearProps: "transform,filter" },
      0.55,
    ).fromTo(hero, { "--line": 0 }, { "--line": 1, duration: 1.4, ease: "expo.inOut" }, 0.3);
  }

  /* ── Titres de section : eyebrow → mots masqués → filet doré ── */
  function sectionHeads() {
    $$(".section-title").forEach((title) => {
      const prev = title.previousElementSibling;
      const next = title.nextElementSibling;
      const eyebrow = prev && prev.matches(".section-eyebrow") ? prev : null;
      const rule = next && next.matches(".gold-rule") ? next : null;
      [eyebrow, title, rule].forEach((el) => el && handled.add(el));

      const words = split(title, "lines,words", "lines");
      const tl = gsap.timeline({
        defaults: { ease: EASE },
        scrollTrigger: { trigger: title, start: "top 85%", once: true },
      });
      if (eyebrow) {
        tl.fromTo(
          eyebrow,
          { opacity: 0, filter: "blur(6px)", letterSpacing: "0.7em" },
          { opacity: 1, filter: "blur(0px)", letterSpacing: "0.45em", duration: 1, clearProps: "filter,letterSpacing" },
          0,
        );
      }
      tl.set(title, { opacity: 1 }, 0.15);
      if (words) {
        tl.from(words.words, { yPercent: 110, duration: 1.1, stagger: 0.06, onComplete: () => words.revert() }, 0.15);
      } else {
        tl.from(title, { y: 20, duration: 1 }, 0.15);
      }
      if (rule) {
        tl.fromTo(
          rule,
          { opacity: 0, scaleX: 0 },
          { opacity: 1, scaleX: 1, transformOrigin: "left center", duration: 1.1, clearProps: "transform" },
          0.45,
        );
      }
    });
  }

  /* ── Manifeste : surlignage des mots au fil du scroll ───────── */
  function manifeste() {
    const el = $("#manifeste-text");
    if (!el) return;
    const GOLD_WORDS = new Set(["technologie", "art", "lumiere", "intuition", "ambition", "outil", "exigence"]);
    const raw = el.textContent.trim().replace(/\s+/g, " ").split(" ");
    el.innerHTML = raw
      .map((w) => {
        const clean = w.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z]/g, "").toLowerCase();
        const gold = GOLD_WORDS.has(clean) ? " gold-word" : "";
        return `<span class="word${gold}">${w}</span>`;
      })
      .join(" ");
    if (!motion) return;
    gsap.to($$(".word", el), {
      opacity: 1,
      ease: "none",
      stagger: 0.1,
      scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 45%", scrub: 0.6 },
    });
  }

  /* ── Étapes du manifeste : losanges qui pivotent ────────────── */
  function manifesteSteps() {
    const icons = $$(".m-step-icon");
    if (!icons.length) return;
    gsap.from(icons, {
      rotate: 45,
      scale: 0.4,
      opacity: 0,
      duration: 1.1,
      ease: EASE,
      stagger: 0.12,
      delay: 0.15,
      scrollTrigger: { trigger: ".manifeste-steps", start: "top 88%", once: true },
    });
  }

  /* ── Icônes SVG tracées à l'entrée ──────────────────────────── */
  function iconDraw() {
    $$(".s-icon, .val-icon").forEach((svg) => {
      const shapes = $$("path, line, rect, circle, polyline", svg);
      const strokes = shapes.filter((s) => s.getAttribute("stroke") !== "none");
      const fills = shapes.filter((s) => s.getAttribute("stroke") === "none");
      strokes.forEach((s) => {
        const len = s.getTotalLength();
        s.style.strokeDasharray = len;
        s.style.strokeDashoffset = len;
      });
      gsap.set(fills, { opacity: 0, scale: 0, transformOrigin: "center" });
      gsap.timeline({ scrollTrigger: { trigger: svg, start: "top 90%", once: true }, delay: 0.25 })
        .to(strokes, {
          strokeDashoffset: 0,
          duration: 1.4,
          ease: "power2.inOut",
          stagger: 0.08,
          clearProps: "strokeDasharray,strokeDashoffset",
        })
        .to(fills, { opacity: 1, scale: 1, duration: 0.5, ease: EASE, stagger: 0.06, clearProps: "transform" }, "-=0.4");
    });
  }

  /* ── Cards image : révélation en rideau ─────────────────────── */
  function curtainReveals() {
    const cards = $$(".pf-item, .cat-card");
    if (!cards.length) return;
    $$(".cat-item").forEach((item) => {
      handled.add(item);
      gsap.set(item, { opacity: 1 });
    });
    cards.forEach((c) => handled.add(c));
    gsap.set(cards, { opacity: 1, clipPath: "inset(100% 0% 0% 0%)" });
    ScrollTrigger.batch(cards, {
      start: "top 90%",
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.2,
          ease: "expo.inOut",
          stagger: 0.1,
          clearProps: "clipPath",
        });
        gsap.from(batch.flatMap((c) => $$("img", c)), {
          scale: 1.15,
          duration: 1.6,
          ease: EASE,
          stagger: 0.1,
          clearProps: "transform",
        });
      },
    });
  }

  /* ── Reveal générique : fondu + montée + flou, en cascade ───── */
  function reveals() {
    const items = $$(".reveal, .cat-item-title").filter((el) => !handled.has(el));
    if (!items.length) return;
    gsap.set(items, { opacity: 0, y: 16, filter: "blur(6px)" });
    ScrollTrigger.batch(items, {
      start: "top 88%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          ease: EASE,
          stagger: 0.08,
          clearProps: "transform,filter",
        }),
    });
  }

  /* ── Compteur de créations ──────────────────────────────────── */
  function countUp() {
    const el = $("#visible-count");
    if (!el) return;
    const n = parseInt(el.textContent, 10) || 0;
    if (!n) return;
    const o = { v: 0 };
    el.textContent = "0";
    gsap.to(o, {
      v: n,
      duration: 1.2,
      ease: "power2.out",
      delay: 0.5,
      onUpdate: () => (el.textContent = Math.round(o.v)),
    });
  }

  /* ── Lightbox : fondu enchaîné à chaque nouvelle image ──────── */
  function lightboxImages() {
    const img = $("#lb-img");
    if (!img) return;
    img.addEventListener("load", () => {
      gsap.fromTo(
        img,
        { opacity: 0, scale: 0.98, filter: "blur(6px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.45, ease: EASE, clearProps: "transform,filter" },
      );
    });
  }

  function init() {
    scrollProgress();
    spotlight();
    magnetic();
    manifeste();
    if (!motion) return;

    fontsReady.then(() => {
      heroHome();
      heroPortfolio();
      heroCategory();
      sectionHeads();
      manifesteSteps();
      iconDraw();
      curtainReveals();
      reveals();
      countUp();
      lightboxImages();
      ScrollTrigger.refresh();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
