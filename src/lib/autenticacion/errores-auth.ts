/**
 * Traducción de los errores de Supabase Auth.
 *
 * Vienen en inglés y suenan a error de sistema ("Email not confirmed"), así que
 * al socio no le dicen nada ni le indican qué hacer. Acá se pasan a castellano
 * con la acción concreta que resuelve cada caso.
 *
 * El que más aparece desde que se prendió "Confirm email" en Supabase es
 * justamente `Email not confirmed`: toda cuenta creada por /register nace sin
 * confirmar y no entra hasta que la persona abre el correo. Salía crudo, sin
 * ninguna pista de que había que ir a la casilla.
 *
 * Módulo puro, sin imports: lo usa el login (client component) y lo cubre un test.
 */
export function traducirErrorAuth(mensaje: string | null | undefined): string {
  const m = (mensaje ?? "").toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "El correo electrónico o la contraseña son incorrectos.";
  }
  if (m.includes("email not confirmed")) {
    return 'Todavía no confirmaste tu correo. Buscá el mail de UIAB Conecta y tocá "Confirmá mi email". Si no lo encontrás, fijate en spam o escribinos para que te lo reenviemos.';
  }
  // "User is banned": lo desactivó su empresa desde /perfil/usuarios, o la UIAB
  // desde /admin/usuarios.
  if (m.includes("banned")) {
    return "Tu acceso está desactivado. Pedile a quien administra la cuenta de tu empresa, o a la UIAB, que lo vuelva a activar.";
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "Probaste demasiadas veces seguidas. Esperá un minuto y volvé a intentar.";
  }
  if (m.includes("user not found")) {
    return "No encontramos ninguna cuenta con ese correo. Revisá que esté bien escrito.";
  }
  if (m.includes("failed to fetch") || m.includes("network")) {
    return "No pudimos conectarnos. Revisá tu conexión y volvé a intentar.";
  }
  if (m.includes("password should be") || m.includes("weak password")) {
    return "La contraseña es demasiado débil. Usá al menos 8 caracteres, con una mayúscula y un número.";
  }

  // Sin mapear: mensaje genérico en castellano. El original queda en la consola
  // para poder agregarlo después, pero no se le muestra a la persona — mostrar
  // inglés crudo es lo que estábamos arreglando.
  if (mensaje) console.error("[auth] error sin traducir:", mensaje);
  return "No pudimos iniciar tu sesión. Volvé a intentar en un momento; si sigue igual, escribinos.";
}
