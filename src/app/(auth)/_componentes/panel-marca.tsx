/**
 * Panel de marca para las pantallas de auth a pantalla completa
 * (/recovery, /restablecer-password).
 *
 * En desktop ocupa la mitad izquierda con el gradiente institucional, de modo
 * que el formulario queda a la derecha y no sobra espacio en blanco a los
 * costados. En mobile el panel se oculta y en su lugar se muestra la marca
 * compacta (`MarcaCompactaAuth`) arriba del formulario.
 */

const FONT_DISPLAY = "var(--font-manrope, 'Manrope', sans-serif)"
const FONT_BODY = "var(--font-inter, 'Inter', sans-serif)"

/** Cuadradito con la "U" — mismo mark que usa /login. */
function MarcaMark({ size = 'md' }: { size?: 'md' | 'sm' }) {
  const box = size === 'sm' ? 'h-9 w-9 text-lg' : 'h-11 w-11 text-xl'
  return (
    <div
      className={`flex items-center justify-center bg-white/[0.08] font-bold text-white backdrop-blur-xl ${box}`}
      style={{ borderRadius: '0.3rem' }}
    >
      U
    </div>
  )
}

export function PanelMarcaAuth() {
  return (
    <aside
      className="relative hidden w-[42%] max-w-[560px] flex-col justify-between overflow-hidden px-12 py-14 text-white lg:flex"
      style={{ background: 'linear-gradient(150deg, #00213f 0%, #10375c 100%)' }}
    >
      {/* Textura de puntos + halos, igual lenguaje que el header de /login */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-400/10 blur-[90px]" />
      <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[#001b55]/40 blur-[100px]" />

      <div className="relative z-10 flex items-center gap-3">
        <MarcaMark />
        <div>
          <span
            className="block text-[10px] font-bold uppercase tracking-[0.16em] text-white/45"
            style={{ fontFamily: FONT_BODY }}
          >
            UIAB Conecta
          </span>
          <span
            className="mt-0.5 block text-lg font-bold tracking-tight"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            Acceso de socios
          </span>
        </div>
      </div>

      <div className="relative z-10 max-w-sm">
        <h2
          className="text-[26px] font-extrabold leading-snug tracking-tight"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          La red profesional de la industria de Almirante Brown.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/60" style={{ fontFamily: FONT_BODY }}>
          Directorio, oportunidades comerciales y vínculos entre las empresas socias de la UIAB.
        </p>
      </div>

      <p
        className="relative z-10 text-[11px] uppercase tracking-[0.08em] text-white/40"
        style={{ fontFamily: FONT_BODY }}
      >
        Unión Industrial de Almirante Brown
      </p>
    </aside>
  )
}

/** Marca compacta para mobile — se muestra arriba del formulario. */
export function MarcaCompactaAuth() {
  return (
    <div className="mb-8 flex items-center gap-2.5 lg:hidden">
      <div
        className="flex h-9 w-9 items-center justify-center text-lg font-bold text-white"
        style={{
          borderRadius: '0.3rem',
          background: 'linear-gradient(135deg, #00213f 0%, #10375c 100%)',
        }}
      >
        U
      </div>
      <span
        className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#525b63]"
        style={{ fontFamily: FONT_BODY }}
      >
        UIAB Conecta
      </span>
    </div>
  )
}
