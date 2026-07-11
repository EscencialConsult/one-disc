import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LightBulbIcon, ScaleIcon, GlobeAltIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Session } from '../lib/session.js';
import Footer from '../components/Footer.jsx';
import LoginModal from '../components/LoginModal.jsx';

/* ═══════════════════════════════════════
   Canvas de estrellas — lógica portada tal cual del index.html original
   ═══════════════════════════════════════ */
function StarsCanvas() {
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
      W = window.innerWidth;
      H = document.documentElement.scrollHeight;
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
        const alpha = Math.max(0.08, Math.min(0.85, s.a));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(254,254,255,${alpha})`;
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
  }, []);

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
const FEATURES = [
  { letter: 'D', name: 'Dominante', color: 'disc-d', text: 'Directo, decidido y orientado a resultados. Líder natural que busca el control y la acción.' },
  { letter: 'I', name: 'Influyente', color: 'disc-i', text: 'Sociable, optimista y persuasivo. Comunicador nato que inspira y motiva a los demás.' },
  { letter: 'S', name: 'Sensato', color: 'disc-s', text: 'Estable, empático y colaborativo. El pilar del equipo que valora la armonía y la lealtad.' },
  { letter: 'C', name: 'Correcto', color: 'disc-c', text: 'Analítico, preciso y perfeccionista. El experto que busca la calidad y la exactitud.' },
];

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

const FEATURE_ICO = {
  'disc-d': 'border-disc-d/35 bg-disc-d/20',
  'disc-i': 'border-disc-i/35 bg-disc-i/20',
  'disc-s': 'border-disc-s/35 bg-disc-s/20',
  'disc-c': 'border-disc-c/35 bg-disc-c/20',
};
const FEATURE_LETTER = {
  'disc-d': 'text-disc-d',
  'disc-i': 'text-disc-i',
  'disc-s': 'text-disc-s',
  'disc-c': 'text-disc-c',
};

/* Botón pill con glow (réplica de .btn primary/secondary) */
function GlowButton({ variant = 'primary', onClick, children, className = '' }) {
  const border = variant === 'primary' ? 'border-one-cyan/35' : 'border-one-pink/35';
  const glow =
    variant === 'primary'
      ? 'before:bg-[radial-gradient(circle_at_20%_50%,rgba(107,225,227,.55),transparent_55%),radial-gradient(circle_at_80%_50%,rgba(107,225,227,.30),transparent_60%)]'
      : 'before:bg-[radial-gradient(circle_at_20%_50%,rgba(225,123,215,.55),transparent_55%),radial-gradient(circle_at_80%_50%,rgba(225,123,215,.30),transparent_60%)]';
  return (
    <a
      onClick={onClick}
      href="#"
      className={`relative inline-flex min-h-14 cursor-pointer select-none items-center justify-center gap-2.5 overflow-hidden rounded-full border ${border} bg-one-white/6 px-[26px] py-3.5 font-semibold tracking-[.02em] text-one-white shadow-[0_10px_40px_rgba(0,0,0,.35)] backdrop-blur-[12px] transition-all duration-[180ms] before:absolute before:-inset-0.5 before:rounded-full before:opacity-75 before:blur-[10px] before:content-[''] ${glow} hover:-translate-y-px hover:border-one-mist/36 hover:bg-one-white/[.085] hover:shadow-[0_16px_55px_rgba(0,0,0,.45)] active:translate-y-0 active:scale-[.99] max-[560px]:w-full ${className}`}
    >
      <span className="relative z-[1]">{children}</span>
    </a>
  );
}

function Eyebrow({ dotClass, children }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-one-mist/18 bg-one-white/6 px-3.5 py-2.5 text-sm tracking-[.04em] text-one-white/78 backdrop-blur-[10px] max-[560px]:text-[13px]">
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
      {/* Background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(1200px 700px at 70% 25%, rgba(225,123,215,.18), transparent 55%), radial-gradient(1100px 700px at 80% 60%, rgba(107,225,227,.14), transparent 55%), radial-gradient(900px 600px at 20% 70%, rgba(228,199,106,.10), transparent 60%), linear-gradient(180deg, #000000, #1a181d)',
        }}
      >
        <div
          className="absolute -inset-[10%] opacity-95 blur-[18px]"
          style={{
            background:
              'radial-gradient(circle at 25% 20%, rgba(107,225,227,.12), transparent 40%), radial-gradient(circle at 80% 35%, rgba(225,123,215,.12), transparent 38%), radial-gradient(circle at 55% 85%, rgba(228,199,106,.10), transparent 45%)',
          }}
        />
        <StarsCanvas />
        <div className="bg-hex-pattern absolute -inset-[20%] -rotate-[8deg] opacity-16 mix-blend-screen [filter:drop-shadow(0_0_12px_rgba(107,225,227,.15))]" />
      </div>

      <div className="relative z-[1] flex min-h-screen min-h-dvh flex-col">
        {/* HEADER */}
        <header
          className={
            'sticky top-0 z-[5] w-full px-[22px] pb-2 pt-[26px] backdrop-blur-[10px] max-[980px]:pt-[18px] ' +
            (scrolled
              ? 'border-b border-one-mist/10 bg-black/35 shadow-[0_10px_30px_rgba(0,0,0,.35)]'
              : 'bg-gradient-to-b from-black/35 to-transparent')
          }
        >
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-[18px] max-[980px]:gap-3">
            <div className="flex select-none items-center gap-3" aria-label="Marca ONE">
              <div
                className="relative h-[45px] w-[45px] shrink-0 overflow-hidden rounded-full bg-contain bg-center bg-no-repeat shadow-[0_0_0_1px_rgba(198,201,215,.18),0_0_40px_rgba(107,225,227,.18)] after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_30%_30%,rgba(254,254,255,.14),transparent_55%)] after:content-['']"
                style={{ backgroundImage: "url('/img/one-iconocolor.png')" }}
                aria-hidden="true"
              />
              <div>
                <div className="font-title text-[22px] font-extrabold leading-[1.1] tracking-[.04em] max-[560px]:text-lg">
                  ONE
                </div>
                <span className="mt-0.5 block text-xs font-medium tracking-[.02em] text-one-mist/85">
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
                  className="rounded-full px-3 py-2.5 font-medium tracking-[.02em] text-one-white/78 transition-colors hover:bg-one-white/6 hover:text-one-white"
                >
                  {label}
                </a>
              ))}
            </nav>

            <div>
              <a
                onClick={openLogin('admin')}
                href="#"
                className="relative inline-flex min-h-[46px] cursor-pointer select-none items-center justify-center gap-2.5 overflow-hidden rounded-full border border-one-pink/35 bg-one-white/6 px-[18px] py-2.5 font-semibold tracking-[.02em] text-one-white shadow-[0_10px_40px_rgba(0,0,0,.25)] backdrop-blur-[12px] transition-all duration-[180ms] before:absolute before:-inset-0.5 before:rounded-full before:opacity-75 before:blur-[10px] before:content-[''] before:bg-[radial-gradient(circle_at_20%_50%,rgba(225,123,215,.55),transparent_55%),radial-gradient(circle_at_80%_50%,rgba(225,123,215,.30),transparent_60%)] hover:-translate-y-px hover:border-one-mist/36 hover:bg-one-white/[.085] hover:shadow-[0_16px_55px_rgba(0,0,0,.35)]"
              >
                <span className="relative z-[1]">Acceder como Admin</span>
              </a>
            </div>
          </div>
        </header>

        <main className="w-full flex-1 px-[22px] pb-[60px]">
          {/* HERO */}
          <section
            className="mx-auto grid w-full max-w-[1180px] grid-cols-[1.05fr_.95fr] items-center gap-7 py-[22px] max-[980px]:grid-cols-1 min-h-[calc(100vh-100px)]"
            id="inicio"
          >
            <div className="py-3.5">
              <Eyebrow dotClass="bg-one-cyan shadow-[0_0_18px_rgba(107,225,227,.55)]">
                Evaluación de comportamiento DISC
              </Eyebrow>

              <h1 className="mb-3.5 mt-[18px] font-title text-[clamp(42px,5vw,66px)] font-extrabold leading-[1.05] tracking-[-.02em] [text-shadow:0_10px_40px_rgba(0,0,0,.55)]">
                Descubrí tu estilo de
                <br />
                <span className="bg-gradient-to-r from-one-cyan to-one-cyan/65 bg-clip-text text-transparent">
                  comportamiento
                </span>{' '}
                <span className="bg-gradient-to-r from-one-pink to-one-pink/65 bg-clip-text text-transparent">
                  DISC.
                </span>
              </h1>

              <p className="mb-[26px] max-w-[52ch] text-lg leading-[1.7] text-one-mist/92 max-[560px]:text-base">
                Plataforma de evaluación basada en el modelo DISC de William Marston. Identificá tu perfil
                conductual — Dominante, Influyente, Sensato o Correcto — y comprendé cómo interactuás con el
                mundo.
              </p>

              <div className="flex flex-wrap items-center gap-3.5">
                <GlowButton variant="primary" onClick={openLogin('user')}>
                  Realizar mi Evaluación DISC
                </GlowButton>
                <GlowButton variant="secondary" onClick={openLogin('admin')}>
                  Acceder como Admin
                </GlowButton>
              </div>

              <div className="mt-[18px] flex items-center gap-1.5 text-[13px] text-one-slate/95">
                La gente es diferente, pero es predeciblemente diferente
                <SparklesIcon className="h-3.5 w-3.5 text-one-gold" />
              </div>
            </div>

            {/* Visual panel */}
            <div
              className="relative flex min-h-[520px] items-center justify-center overflow-hidden rounded-[28px] border border-one-mist/18 shadow-[0_18px_60px_rgba(0,0,0,.55)] backdrop-blur-[16px] after:absolute after:inset-0 after:content-[''] after:bg-[radial-gradient(circle_at_70%_30%,rgba(254,254,255,.12),transparent_45%)] after:pointer-events-none max-[980px]:min-h-[460px]"
              style={{
                background:
                  'radial-gradient(900px 600px at 70% 35%, rgba(225,123,215,.20), transparent 55%), radial-gradient(900px 600px at 45% 60%, rgba(107,225,227,.18), transparent 60%), linear-gradient(180deg, rgba(254,254,255,.06), rgba(26,24,29,.55))',
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-90 mix-blend-screen"
                aria-hidden="true"
                style={{
                  background:
                    'linear-gradient(to right, rgba(107,225,227,0), rgba(107,225,227,.22), rgba(107,225,227,0)) 10% 35% / 60% 1px no-repeat, linear-gradient(to right, rgba(225,123,215,0), rgba(225,123,215,.18), rgba(225,123,215,0)) 15% 62% / 70% 1px no-repeat, radial-gradient(circle at 85% 78%, rgba(228,199,106,.10), transparent 42%)',
                }}
              />

              <div className="relative z-[1] grid w-[min(640px,92%)] grid-cols-2 gap-[18px] p-[26px] max-[980px]:w-[min(720px,96%)] max-[560px]:grid-cols-1 max-[560px]:p-[18px]">
                {FEATURES.map((f) => (
                  <article
                    key={f.letter}
                    className="min-h-[140px] rounded-[18px] border border-one-mist/20 bg-one-white/6 p-[22px] pb-5 shadow-[0_18px_60px_rgba(0,0,0,.35)] backdrop-blur-[14px] transition-all duration-[180ms] hover:-translate-y-0.5 hover:border-one-mist/32 hover:bg-one-white/[.075] hover:shadow-[0_22px_70px_rgba(0,0,0,.45)]"
                  >
                    <div className="mb-2.5 flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 flex-none items-center justify-center rounded-[14px] border shadow-[0_0_0_1px_rgba(0,0,0,.12),0_12px_30px_rgba(0,0,0,.22)] ${FEATURE_ICO[f.color]}`}
                        aria-hidden="true"
                      >
                        <span className={`font-title text-xl font-extrabold leading-none ${FEATURE_LETTER[f.color]}`}>
                          {f.letter}
                        </span>
                      </div>
                      <h3 className="m-0 font-title text-lg font-bold leading-[1.2] tracking-[-.01em]">{f.name}</h3>
                    </div>
                    <p className="m-0 text-sm leading-[1.6] text-one-mist/88">{f.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* ¿QUÉ ES DISC? */}
          <Section id="que-es-disc">
            <div className="mb-12">
              <Eyebrow dotClass="bg-one-cyan shadow-[0_0_18px_rgba(107,225,227,.55)]">Desde 1926</Eyebrow>
              <h2 className="mb-3.5 mt-4 font-title text-[clamp(30px,3.5vw,46px)] font-extrabold leading-[1.1] tracking-[-.02em]">
                ¿Qué es el modelo{' '}
                <span className="bg-gradient-to-r from-one-cyan to-one-cyan/65 bg-clip-text text-transparent">
                  DISC
                </span>
                ?
              </h2>
              <p className="m-0 max-w-[62ch] text-[17px] leading-[1.7] text-one-mist/85">
                DISC es una herramienta de evaluación del comportamiento humano creada por William Marston en
                1926. No mide personalidad ni inteligencia — identifica patrones predecibles de conducta que nos
                ayudan a entender cómo actuamos, nos comunicamos y reaccionamos ante distintas situaciones.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-[22px] max-[980px]:grid-cols-1">
              {INFO_CARDS.map((c) => (
                <article
                  key={c.title}
                  className="rounded-[18px] border border-one-mist/25 bg-one-white/8 p-7 px-6 backdrop-blur-[14px] transition-all duration-[180ms] hover:-translate-y-[3px] hover:border-one-mist/35 hover:bg-one-white/12"
                >
                  <c.icon className="mb-3.5 h-7 w-7 text-one-cyan" />
                  <h3 className="mb-2.5 mt-0 font-title text-lg font-bold">{c.title}</h3>
                  <p className="m-0 text-sm leading-[1.65] text-one-mist/85">{c.text}</p>
                </article>
              ))}
            </div>
          </Section>

          {/* LOS 4 ESTILOS */}
          <Section id="estilos">
            <div className="mb-12">
              <Eyebrow dotClass="bg-one-pink shadow-[0_0_18px_rgba(225,123,215,.55)]">Los cuatro estilos</Eyebrow>
              <h2 className="mb-3.5 mt-4 font-title text-[clamp(30px,3.5vw,46px)] font-extrabold leading-[1.1] tracking-[-.02em]">
                Conocé cada{' '}
                <span className="bg-gradient-to-r from-one-pink to-one-pink/65 bg-clip-text text-transparent">
                  perfil
                </span>{' '}
                en detalle
              </h2>
              <p className="m-0 max-w-[62ch] text-[17px] leading-[1.7] text-one-mist/85">
                Cada estilo tiene fortalezas únicas, un miedo básico inconsciente y una forma particular de ver el
                mundo. Entenderlos te permite comunicarte mejor y evitar conflictos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-[22px] max-[980px]:grid-cols-1">
              {STYLE_CARDS.map((s) => (
                <article
                  key={s.letter}
                  className={`overflow-hidden rounded-[18px] border border-one-mist/25 bg-one-white/8 backdrop-blur-[14px] transition-all duration-[180ms] hover:-translate-y-[3px] ${s.hover}`}
                >
                  <div className="flex items-center gap-3.5 p-6 pb-[18px] pt-[22px]">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border font-title text-2xl font-extrabold ${s.badge}`}
                    >
                      {s.letter}
                    </div>
                    <div>
                      <h3 className="m-0 font-title text-xl font-bold">{s.name}</h3>
                      <p className="mb-0 mt-0.5 text-[13px] text-one-slate">{s.aka}</p>
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="mb-2.5 mr-4 inline-flex items-center gap-1.5 text-[13px]">
                      <span className="text-one-mist/60">Población</span>
                      <span className={`font-bold ${s.stat}`}>{s.poblacion}</span>
                    </div>
                    <div className="mb-2.5 mr-4 inline-flex items-center gap-1.5 text-[13px]">
                      <span className="text-one-mist/60">Ritmo</span>
                      <span className="font-bold text-one-white">{s.ritmo}</span>
                    </div>
                    <div className="mb-2.5 mr-4 inline-flex items-center gap-1.5 text-[13px]">
                      <span className="text-one-mist/60">Enfoque</span>
                      <span className="font-bold text-one-white">{s.enfoque}</span>
                    </div>
                    <p className="mb-3.5 mt-2 text-sm leading-[1.65] text-one-mist/85">{s.desc}</p>
                    <div className="rounded-[10px] border border-one-mist/12 bg-one-white/4 px-3.5 py-2.5 text-[13px] leading-[1.5] text-one-mist/75">
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
              <h2 className="mb-3.5 mt-4 font-title text-[clamp(30px,3.5vw,46px)] font-extrabold leading-[1.1] tracking-[-.02em]">
                ¿Cómo funciona la{' '}
                <span className="bg-gradient-to-r from-one-gold to-one-gold/65 bg-clip-text text-transparent">
                  evaluación
                </span>
                ?
              </h2>
              <p className="m-0 max-w-[62ch] text-[17px] leading-[1.7] text-one-mist/85">
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
                  <article className="flex-1 rounded-[18px] border border-one-mist/25 bg-one-white/8 p-7 px-6 backdrop-blur-[14px] transition-all duration-[180ms] hover:-translate-y-[3px] hover:bg-one-white/12 max-[980px]:w-full">
                    <div className="mb-3.5 bg-gradient-to-br from-one-cyan to-one-pink bg-clip-text font-title text-4xl font-extrabold leading-none text-transparent">
                      {step.n}
                    </div>
                    <h3 className="mb-2.5 mt-0 font-title text-lg font-bold">{step.title}</h3>
                    <p className="m-0 text-sm leading-[1.65] text-one-mist/85">{step.text}</p>
                  </article>
                </div>
              ))}
            </div>

            <div className="text-center">
              <GlowButton variant="primary" onClick={openLogin('user')}>
                Comenzar mi Evaluación DISC
              </GlowButton>
            </div>
          </Section>
        </main>

        <Footer />
      </div>

      {loginMode && (
        <LoginModal mode={loginMode} onClose={() => setLoginMode(null)} onModeChange={setLoginMode} />
      )}
    </>
  );
}
