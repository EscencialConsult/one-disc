import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LightBulbIcon, ScaleIcon, GlobeAltIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Session } from '../lib/session.js';
import Footer from '../components/Footer.jsx';
import LoginModal from '../components/LoginModal.jsx';

/* ═══════════════════════════════════════
   Canvas de estrellas — lógica portada tal cual del index.html original
   ═══════════════════════════════════════ */
function StarsCanvas({ theme = 'dark', bounded = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    let W = 0,
      H = 0,
      DPR = Math.min(window.devicePixelRatio || 1, 2);
    let stars = [];
    let rafId = 0;

    function resize() {
      if (bounded && canvas.parentElement) {
        W = canvas.parentElement.clientWidth;
        H = canvas.parentElement.clientHeight;
      } else {
        W = window.innerWidth;
        H = document.documentElement.scrollHeight;
      }
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const count = Math.floor((160 * (W * H)) / (1200 * 700));
      stars = Array.from({ length: Math.max(100, Math.min(300, count)) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.35 + 0.25,
        a: Math.random() * 0.6 + 0.15,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        tw: Math.random() * 0.012 + 0.003,
      }));
    }

    const dotColor = theme === 'light' ? '30,41,59' : '254,254,255';
    const maxAlpha = theme === 'light' ? 0.32 : 0.85;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W * 0.75, H * 0.15, 0, W * 0.75, H * 0.15, Math.max(W, H) * 0.8);
      g.addColorStop(0, 'rgba(225,123,215,0.10)');
      g.addColorStop(0.35, 'rgba(107,225,227,0.08)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < -10) s.x = W + 10;
        if (s.x > W + 10) s.x = -10;
        if (s.y < -10) s.y = H + 10;
        if (s.y > H + 10) s.y = -10;
        s.a += Math.sin((s.x + s.y) * 0.002) * s.tw;
        const alpha = Math.max(0.08, Math.min(maxAlpha, s.a));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor},${alpha})`;
        ctx.fill();
      }
      rafId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [theme, bounded]);

  return <canvas ref={canvasRef} className="absolute inset-0 opacity-100" />;
}

/* Hook de scroll-reveal (réplica del IntersectionObserver original) */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

function Section({ id, children }) {
  const [ref, visible] = useReveal();
  return (
    <section
      id={id}
      ref={ref}
      className={
        'mx-auto max-w-[1180px] py-20 transition-[opacity,transform] duration-600 ease-out max-[560px]:py-[50px] motion-reduce:transition-none ' +
        (visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100')
      }
    >
      {children}
    </section>
  );
}

/* ═══ Datos de contenido (texto idéntico al original) ═══ */
/* Orden en grilla 2x2 (D/I arriba, C/S abajo — mapeo correcto del modelo DISC:
   fila superior = ritmo rápido, fila inferior = ritmo lento; columna izquierda =
   tareas, columna derecha = personas). */
const QUADRANTS = [
  { letter: 'D', name: 'Dominante', color: 'disc-d' },
  { letter: 'I', name: 'Influyente', color: 'disc-i' },
  { letter: 'C', name: 'Correcto', color: 'disc-c' },
  { letter: 'S', name: 'Sensato', color: 'disc-s' },
];

const QUADRANT_BG = {
  'disc-d': 'bg-disc-d',
  'disc-i': 'bg-disc-i',
  'disc-s': 'bg-disc-s',
  'disc-c': 'bg-disc-c',
};

const QUADRANT_TEXT = {
  'disc-d': 'text-disc-d',
  'disc-i': 'text-disc-i',
  'disc-s': 'text-disc-s',
  'disc-c': 'text-disc-c',
};

const INFO_CARDS = [
  { icon: LightBulbIcon, title: 'Comportamiento predecible', text: 'Todos somos una mezcla de los 4 estilos, pero normalmente 1 o 2 destacan. Estos estilos dominantes determinan cómo reaccionamos de forma predecible.' },
  { icon: ScaleIcon, title: 'Dos ejes fundamentales', text: 'El diagrama DISC se organiza en dos ejes: ritmo rápido vs. lento (activo vs. reservado) y orientación a tareas vs. personas. Esto genera los 4 cuadrantes.' },
  { icon: GlobeAltIcon, title: 'Universal y objetivo', text: 'DISC no depende de edad, cultura o género. Es una herramienta objetiva que permite anticipar reacciones y mejorar la comunicación interpersonal.' },
];

const STYLE_CARDS = [
  {
    letter: 'D', name: 'Dominante', aka: 'Determinado · Directo', poblacion: '~3%', ritmo: 'Rápido', enfoque: 'Tareas',
    desc: 'Líder natural orientado a metas. No ve problemas, ve obstáculos. Toma el mando cuando nadie lo hace y busca resultados concretos.',
    fear: 'Perder el control o que se aprovechen de él',
    badge: 'border-disc-d/30 bg-disc-d/18 text-disc-d', hover: 'hover:border-disc-d/45', stat: 'text-disc-d',
  },
  {
    letter: 'I', name: 'Influyente', aka: 'Impulsivo · Inspirador', poblacion: '~11%', ritmo: 'Rápido', enfoque: 'Personas',
    desc: 'Vendedor nato, positivo y persuasivo. Busca la experiencia, la conexión social y siempre encuentra el lado divertido de las situaciones.',
    fear: 'Perder la estima social o el rechazo',
    badge: 'border-disc-i/30 bg-disc-i/18 text-disc-i', hover: 'hover:border-disc-i/45', stat: 'text-disc-i',
  },
  {
    letter: 'S', name: 'Sensato', aka: 'Seguro · Estable', poblacion: '~69%', ritmo: 'Lento', enfoque: 'Personas',
    desc: 'El grupo más grande. Cuidador natural con gran empatía. Pacificador, leal y el pegamento que mantiene unido al equipo.',
    fear: 'Perder la seguridad y los cambios imprevistos',
    badge: 'border-disc-s/30 bg-disc-s/18 text-disc-s', hover: 'hover:border-disc-s/45', stat: 'text-disc-s',
  },
  {
    letter: 'C', name: 'Correcto', aka: 'Cumplidor · Controlado', poblacion: '~17%', ritmo: 'Lento', enfoque: 'Tareas',
    desc: 'El estudiante eterno. Detallista, perfeccionista y experto en su campo. Cuando tiene un plan, es impecable y minuciosamente pensado.',
    fear: 'Equivocarse o ser criticado',
    badge: 'border-disc-c/30 bg-disc-c/18 text-disc-c', hover: 'hover:border-disc-c/45', stat: 'text-disc-c',
  },
];

const STEPS = [
  { n: '01', title: 'Recibís tu acceso', text: 'Tu administrador te crea un usuario y contraseña para ingresar a la plataforma de forma segura.' },
  { n: '02', title: 'Completás el test', text: 'Respondés una serie de preguntas sobre tu comportamiento natural. Sin respuestas correctas o incorrectas.' },
  { n: '03', title: 'Obtenés tu informe', text: 'Se genera automáticamente tu perfil DISC con gráficos, análisis de tus estilos dominantes y recomendaciones.' },
];

function Eyebrow({ dotClass, children }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-sm tracking-[.04em] text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,.04)] max-[560px]:text-[13px]">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
      {children}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [loginMode, setLoginMode] = useState(null); // null | 'user' | 'admin'

  // Redirección si ya hay sesión activa (réplica del original)
  useEffect(() => {
    if (Session.isAuthenticated()) navigate(Session.dashboardRoute(), { replace: true });
  }, [navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openLogin = (mode) => (e) => {
    e.preventDefault();
    setLoginMode(mode);
  };

  return (
    <>
      {/* Background — atmósfera clara (gradientes + estrellas + hexágonos) para toda la Landing */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(1200px 700px at 75% 15%, rgba(225,123,215,.14), transparent 55%), radial-gradient(1100px 700px at 12% 60%, rgba(107,225,227,.14), transparent 55%), radial-gradient(900px 600px at 55% 95%, rgba(228,199,106,.12), transparent 60%), linear-gradient(180deg, #ffffff, #eef2f7)',
        }}
      >
        <StarsCanvas theme="light" />
        <div className="bg-hex-pattern-light absolute -inset-[20%] -rotate-[8deg] opacity-[0.05]" />
      </div>

      <div className="relative z-[1] flex min-h-screen min-h-dvh flex-col">
        {/* HEADER */}
        <header
          className={
            'sticky top-0 z-[5] w-full px-[22px] pb-2 pt-[26px] backdrop-blur-[10px] transition-colors duration-300 max-[980px]:pt-[18px] ' +
            (scrolled ? 'border-b border-slate-200 bg-white/85 shadow-[0_10px_30px_rgba(0,0,0,.06)]' : 'bg-white/60')
          }
        >
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-[18px] max-[980px]:gap-3">
            <div className="flex select-none items-center gap-3" aria-label="Marca ONE">
              <div
                className="relative h-[45px] w-[45px] shrink-0 overflow-hidden rounded-full bg-contain bg-center bg-no-repeat shadow-[0_0_0_1px_rgba(15,23,42,.10),0_0_30px_rgba(107,225,227,.20)] after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_30%_30%,rgba(254,254,255,.14),transparent_55%)] after:content-['']"
                style={{ backgroundImage: "url('/img/one-iconocolor.png')" }}
                aria-hidden="true"
              />
              <div>
                <div className="font-title text-[22px] font-extrabold leading-[1.1] tracking-[.04em] text-slate-900 max-[560px]:text-lg">
                  ONE
                </div>
                <span className="mt-0.5 block text-xs font-medium tracking-[.02em] text-slate-500">
                  Evaluación DISC
                </span>
              </div>
            </div>

            <nav aria-label="Navegación principal" className="max-[560px]:hidden">
              {[
                ['#inicio', 'Inicio'],
                ['#que-es-disc', '¿Qué es DISC?'],
                ['#estilos', 'Los 4 Estilos'],
                ['#como-funciona', 'Cómo Funciona'],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-full px-3 py-2.5 font-medium tracking-[.02em] text-slate-600 transition-colors hover:bg-slate-900/5 hover:text-slate-900"
                >
                  {label}
                </a>
              ))}
            </nav>

            <div>
              <a
                onClick={openLogin('admin')}
                href="#"
                className="inline-flex min-h-[46px] cursor-pointer select-none items-center justify-center gap-2.5 rounded-full border border-slate-300 bg-white px-[18px] py-2.5 font-semibold tracking-[.02em] text-slate-900 shadow-[0_6px_20px_rgba(0,0,0,.08)] transition-all duration-[180ms] hover:-translate-y-px hover:border-slate-400"
              >
                Acceder como Admin
              </a>
            </div>
          </div>
        </header>

        <main className="w-full flex-1 px-[22px] pb-[60px]">
          {/* HERO */}
          <section
            id="inicio"
            className="mx-auto grid w-full max-w-[1180px] min-h-[calc(100vh-96px)] min-h-[calc(100dvh-96px)] grid-cols-[1.05fr_.95fr] items-center gap-16 py-12 max-[980px]:grid-cols-1 max-[980px]:min-h-0 max-[980px]:gap-10 max-[980px]:py-8"
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-one-cyan/30 bg-white px-4 py-2.5 text-sm font-medium tracking-[.02em] text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,.04)]">
                Evaluación de comportamiento DISC
              </span>

              <h1 className="mb-5 mt-6 font-title text-[clamp(42px,5vw,64px)] font-extrabold leading-[1.05] tracking-[-.02em] text-slate-900">
                Descubrí tu estilo de comportamiento{' '}
                <span className={QUADRANT_TEXT['disc-d']}>D</span>
                <span className={QUADRANT_TEXT['disc-i']}>I</span>
                <span className={QUADRANT_TEXT['disc-s']}>S</span>
                <span className={QUADRANT_TEXT['disc-c']}>C</span>.
              </h1>

              <p className="mb-8 max-w-[52ch] text-lg leading-[1.7] text-slate-600 max-[560px]:text-base">
                Plataforma de evaluación basada en el modelo DISC de William Marston. Identificá tu perfil
                conductual — Dominante, Influyente, Sensato o Correcto — y comprendé cómo interactuás con el
                mundo.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <a
                  onClick={openLogin('user')}
                  href="#"
                  className="inline-flex min-h-14 cursor-pointer select-none items-center justify-center rounded-full bg-slate-900 px-[26px] py-3.5 font-semibold tracking-[.02em] text-white shadow-[0_10px_30px_rgba(0,0,0,.25)] transition-all duration-[180ms] hover:-translate-y-px hover:bg-slate-800 active:translate-y-0 max-[560px]:w-full"
                >
                  Realizar mi Evaluación DISC →
                </a>
                <a
                  onClick={openLogin('admin')}
                  href="#"
                  className="inline-flex min-h-14 cursor-pointer select-none items-center justify-center rounded-full border border-slate-300 bg-white px-[26px] py-3.5 font-semibold tracking-[.02em] text-slate-900 transition-all duration-[180ms] hover:-translate-y-px hover:border-slate-400 active:translate-y-0 max-[560px]:w-full"
                >
                  Acceder como Admin
                </a>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-[13px] text-slate-500">
                La gente es diferente, pero es predeciblemente diferente
                <SparklesIcon className="h-3.5 w-3.5 text-one-gold" />
              </div>
            </div>

            {/* Rueda de cuadrantes DISC */}
            <div className="flex flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white p-11 shadow-[0_25px_60px_rgba(15,23,42,.10)]">
                <span className="mb-3 text-sm font-semibold tracking-[.02em] text-slate-700">
                  Ritmo activo
                </span>
                <div className="flex w-full items-center justify-center gap-4">
                  <span className="text-sm font-semibold tracking-[.02em] text-slate-700">Tarea</span>
                  <div className="relative aspect-square w-full max-w-[340px] overflow-hidden rounded-full shadow-[0_10px_35px_rgba(0,0,0,.18)]">
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                      {QUADRANTS.map((q) => (
                        <div
                          key={q.letter}
                          className={`flex items-center justify-center ${QUADRANT_BG[q.color]}`}
                        >
                          <span className="font-title text-5xl font-extrabold leading-none text-white">
                            {q.letter}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-white" />
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-white" />
                  </div>
                  <span className="text-sm font-semibold tracking-[.02em] text-slate-700">Personas</span>
                </div>
                <span className="mt-3 text-sm font-semibold tracking-[.02em] text-slate-700">
                  Ritmo pausado
                </span>
              </div>
          </section>

          {/* ¿QUÉ ES DISC? */}
          <Section id="que-es-disc">
            <div className="mb-12">
              <Eyebrow dotClass="bg-one-cyan shadow-[0_0_18px_rgba(107,225,227,.55)]">Desde 1926</Eyebrow>
              <h2 className="mb-3.5 mt-4 font-title text-[clamp(30px,3.5vw,46px)] font-extrabold leading-[1.1] tracking-[-.02em] text-slate-900">
                ¿Qué es el modelo{' '}
                DISC?
              </h2>
              <p className="m-0 max-w-[62ch] text-[17px] leading-[1.7] text-slate-600">
                DISC es una herramienta de evaluación del comportamiento humano creada por William Marston en
                1926. No mide personalidad ni inteligencia — identifica patrones predecibles de conducta que nos
                ayudan a entender cómo actuamos, nos comunicamos y reaccionamos ante distintas situaciones.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-[22px] max-[980px]:grid-cols-1">
              {INFO_CARDS.map((c) => (
                <article
                  key={c.title}
                  className="rounded-[18px] border border-slate-300 bg-white p-7 px-6 shadow-[0_8px_28px_rgba(15,23,42,.10)] transition-all duration-[180ms] hover:-translate-y-[3px] hover:border-slate-400 hover:shadow-[0_14px_38px_rgba(15,23,42,.16)]"
                >
                  <c.icon className="mb-3.5 h-7 w-7 text-one-cyan" />
                  <h3 className="mb-2.5 mt-0 font-title text-lg font-bold text-slate-900">{c.title}</h3>
                  <p className="m-0 text-sm leading-[1.65] text-slate-600">{c.text}</p>
                </article>
              ))}
            </div>
          </Section>

          {/* LOS 4 ESTILOS */}
          <Section id="estilos">
            <div className="mb-12">
              <Eyebrow dotClass="bg-one-pink shadow-[0_0_18px_rgba(225,123,215,.55)]">Los cuatro estilos</Eyebrow>
              <h2 className="mb-3.5 mt-4 font-title text-[clamp(30px,3.5vw,46px)] font-extrabold leading-[1.1] tracking-[-.02em] text-slate-900">
                Conocé cada perfil en detalle
              </h2>
              <p className="m-0 max-w-[62ch] text-[17px] leading-[1.7] text-slate-600">
                Cada estilo tiene fortalezas únicas, un miedo básico inconsciente y una forma particular de ver el
                mundo. Entenderlos te permite comunicarte mejor y evitar conflictos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-[22px] max-[980px]:grid-cols-1">
              {STYLE_CARDS.map((s) => (
                <article
                  key={s.letter}
                  className="overflow-hidden rounded-[18px] border border-slate-300 bg-white shadow-[0_8px_28px_rgba(15,23,42,.10)] transition-all duration-[180ms] hover:-translate-y-[3px] hover:border-slate-400 hover:shadow-[0_14px_38px_rgba(15,23,42,.16)]"
                >
                  <div className="flex items-center gap-3.5 p-6 pb-[18px] pt-[22px]">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border font-title text-2xl font-extrabold ${s.badge}`}
                    >
                      {s.letter}
                    </div>
                    <div>
                      <h3 className="m-0 font-title text-xl font-bold text-slate-900">{s.name}</h3>
                      <p className="mb-0 mt-0.5 text-[13px] text-slate-500">{s.aka}</p>
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="mb-2.5 mr-4 inline-flex items-center gap-1.5 text-[13px]">
                      <span className="text-slate-500">Población</span>
                      <span className={`font-bold ${s.stat}`}>{s.poblacion}</span>
                    </div>
                    <div className="mb-2.5 mr-4 inline-flex items-center gap-1.5 text-[13px]">
                      <span className="text-slate-500">Ritmo</span>
                      <span className="font-bold text-slate-900">{s.ritmo}</span>
                    </div>
                    <div className="mb-2.5 mr-4 inline-flex items-center gap-1.5 text-[13px]">
                      <span className="text-slate-500">Enfoque</span>
                      <span className="font-bold text-slate-900">{s.enfoque}</span>
                    </div>
                    <p className="mb-3.5 mt-2 text-sm leading-[1.65] text-slate-600">{s.desc}</p>
                    <div className="rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13px] leading-[1.5] text-slate-600">
                      <span className="mr-1 font-bold text-one-pink">Miedo básico:</span>
                      {s.fear}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Section>

          {/* CÓMO FUNCIONA */}
          <Section id="como-funciona">
            <div className="mb-12">
              <Eyebrow dotClass="bg-one-gold shadow-[0_0_18px_rgba(228,199,106,.55)]">Simple y rápido</Eyebrow>
              <h2 className="mb-3.5 mt-4 font-title text-[clamp(30px,3.5vw,46px)] font-extrabold leading-[1.1] tracking-[-.02em] text-slate-900">
                ¿Cómo funciona la evaluación?
              </h2>
              <p className="m-0 max-w-[62ch] text-[17px] leading-[1.7] text-slate-600">
                El test DISC se completa en 7-10 minutos y genera un informe detallado con tu perfil de
                comportamiento y gráficos de tus estilos dominantes.
              </p>
            </div>

            <div className="mb-10 flex items-start max-[980px]:flex-col max-[980px]:gap-4">
              {STEPS.map((step, i) => (
                <div key={step.n} className="contents">
                  {i > 0 && (
                    <div
                      className="mt-[-20px] h-0.5 w-10 min-w-10 self-center rounded-sm bg-gradient-to-r from-one-cyan/40 to-one-pink/40 max-[980px]:mt-0 max-[980px]:h-[30px] max-[980px]:w-0.5 max-[980px]:min-w-0"
                      aria-hidden="true"
                    />
                  )}
                  <article className="flex-1 rounded-[18px] border border-slate-300 bg-white p-7 px-6 shadow-[0_8px_28px_rgba(15,23,42,.10)] transition-all duration-[180ms] hover:-translate-y-[3px] hover:border-slate-400 hover:shadow-[0_14px_38px_rgba(15,23,42,.16)] max-[980px]:w-full">
                    <div className="mb-3.5 font-title text-4xl font-extrabold leading-none text-slate-300">
                      {step.n}
                    </div>
                    <h3 className="mb-2.5 mt-0 font-title text-lg font-bold text-slate-900">{step.title}</h3>
                    <p className="m-0 text-sm leading-[1.65] text-slate-600">{step.text}</p>
                  </article>
                </div>
              ))}
            </div>

            <div className="text-center">
              <a
                onClick={openLogin('user')}
                href="#"
                className="inline-flex min-h-14 cursor-pointer select-none items-center justify-center rounded-full bg-slate-900 px-[26px] py-3.5 font-semibold tracking-[.02em] text-white shadow-[0_10px_30px_rgba(0,0,0,.25)] transition-all duration-[180ms] hover:-translate-y-px hover:bg-slate-800 active:translate-y-0"
              >
                Comenzar mi Evaluación DISC
              </a>
            </div>
          </Section>
        </main>

        <Footer />
      </div>

      {/* Siempre montado (no `loginMode && ...`): así, si el usuario clickea afuera
          y el modal se cierra, el componente sigue vivo y NO pierde lo que ya
          había escrito (usuario/contraseña) — vuelve a abrir tal cual lo dejó. */}
      <LoginModal mode={loginMode} onClose={() => setLoginMode(null)} onModeChange={setLoginMode} />
    </>
  );
}
