/** Footer premium — mismo diseño en toda la plataforma (idéntico al de Landing/Inicio). */
export default function Footer() {
  return (
    <footer className="relative z-10 mt-auto w-full shrink-0 border-t-[3px] border-[#ff69b4] bg-black py-[18px]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-[15px] px-[25px] text-center md:flex-row md:gap-0 md:text-left">
        <div className="flex flex-wrap items-center justify-center gap-2 opacity-85 md:justify-start">
          <img src="/img/one-logoletra.png" alt="ONE" className="h-[18px] w-auto align-middle" />
          <span className="text-sm"> | Todos los derechos reservados. © 2026 - V1.0.1</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-[12px] tracking-[1px] opacity-70">Desarrollado por</span>
          <a
            href="https://escencialconsultora.com.ar/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center transition-[opacity,transform] duration-300 hover:-translate-y-px hover:opacity-80"
            title="Ir a Escencial Consultora"
          >
            <img src="/img/one-logocolor.png" alt="ONE" className="h-[22px] w-auto" />
            <span className="mx-[6px] text-[13px] italic opacity-70">by</span>
            <img src="/img/escencial-logoblanco.png" alt="Escencial" className="h-6 w-auto" />
          </a>
        </div>
      </div>
    </footer>
  );
}
