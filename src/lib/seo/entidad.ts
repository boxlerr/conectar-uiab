/**
 * Identidad de las dos organizaciones del proyecto, en un solo lugar.
 *
 * EL PROBLEMA QUE RESUELVE ESTE ARCHIVO
 *
 * Hasta ahora el JSON-LD del sitio declaraba una sola organización llamada
 * "UIAB Conecta" con `alternateName: ["Unión Industrial de Almirante Brown",
 * "UIAB"]`. O sea: el directorio afirmaba SER la cámara. Y en paralelo cada una
 * de las 59 fichas emitía un `memberOf` con un nodo anónimo nuevo —sin `@id`—
 * que decía `{ name: "Unión Industrial de Almirante Brown", url: <uiabconecta> }`,
 * o sea que la cámara "vive" en uiabconecta.com. Y la ficha de la propia UIAB
 * emitía un tercer Organization más, con otra dirección.
 *
 * Resultado: tres entidades homónimas compitiendo dentro del mismo HTML, cero
 * `sameAs` en todas ellas, y una afirmación que contradice lo que Google ya
 * tiene indexado desde hace años (la UIAB está en uiab.org). Cuando dos
 * entidades reclaman el mismo nombre y ninguna tiene pruebas externas, Google no
 * elige: le baja la confianza a las dos y resuelve la consulta hacia el titular
 * más viejo. Por eso buscar "uiab conecta" devolvía uiab.org.
 *
 * LA FORMA CORRECTA
 *
 * Son dos entidades distintas y emparentadas:
 *   - La Unión Industrial de Almirante Brown, que vive en uiab.org y ya existe
 *     para Google, con sus perfiles sociales verificados.
 *   - UIAB Conecta, el directorio, que vive acá y es su `subOrganization`.
 *
 * El par `parentOrganization`/`subOrganization` es la arista que hace que este
 * dominio HEREDE la entidad conocida en vez de competirle. Los `sameAs` van en
 * el nodo padre —son perfiles de la cámara, no del directorio—; ponerlos acá
 * reintroduciría exactamente la confusión que estamos matando.
 *
 * Todos los nodos se referencian por `@id` desde el resto del sitio (fichas,
 * breadcrumbs, /nosotros): un nodo declarado una vez y citado N veces acumula
 * señal; N nodos anónimos la dispersan.
 */

export const SITE_URL = "https://www.uiabconecta.com";

/** El directorio. Definido en el layout raíz, citado desde todas las rutas. */
export const ID_ORG_CONECTA = `${SITE_URL}/#organizacion`;

/**
 * La cámara. El `@id` apunta a SU dominio a propósito, no al nuestro: es la
 * forma de decir "esta es aquella organización", no "esta organización es mía".
 */
export const ID_ORG_UIAB = "https://www.uiab.org/#organizacion";

export const ID_WEBSITE = `${SITE_URL}/#website`;

/**
 * Sede real, la misma que publica uiab.org/contacto y que sirve /contacto.
 * La consistencia del NAP (nombre + dirección + teléfono) entre las dos
 * propiedades es parte de lo que le confirma a Google que son la misma entidad;
 * si divergen, no la rompas: corregí la fuente equivocada.
 */
export const DIRECCION_UIAB = {
  "@type": "PostalAddress",
  streetAddress: "Luis María Drago 1951, Piso 2, Of. 14 y 15",
  addressLocality: "Burzaco",
  addressRegion: "Buenos Aires",
  postalCode: "B1852LHA",
  addressCountry: "AR",
} as const;

export const TELEFONO_UIAB = "+541130622001";
export const EMAIL_UIAB = "gerencia.ejecutiva@uiab.org";

/**
 * Perfiles oficiales de la CÁMARA. Los cinco fueron verificados uno por uno
 * (HTTP 200 el 11/08/2026); Facebook no existe —devuelve 400— así que no está.
 *
 * Regla para el futuro: un `sameAs` hacia una URL que no resuelve es peor que
 * no tener ninguno, porque es una afirmación falsa y comprobable. Verificá
 * antes de sumar, y sumá sólo perfiles que además estén enlazados desde el
 * footer: el `sameAs` es unidireccional y sólo cierra el círculo cuando el
 * perfil también apunta de vuelta al sitio.
 */
export const REDES_UIAB = [
  "https://www.instagram.com/uiabarg/",
  "https://www.linkedin.com/company/uiab-org/",
  "https://x.com/uiab_brown",
  "https://www.youtube.com/@uiabarg",
];

/**
 * Pasa un teléfono cargado a mano a E.164 (`+54…`), que es el formato que
 * Google cruza contra lo que ya sabe de la empresa.
 *
 * En la base conviven al menos cinco formatos: `+541135850855`,
 * `+54 11 4239-3636`, `11 2380-7089`, `1165186162` y `40023000`. Los cuatro
 * primeros son reconstruibles sin ambigüedad; el último son 8 dígitos sin
 * característica, y no hay forma de saber si es de Burzaco, de CABA o de otro
 * lado.
 *
 * Ante la duda devuelve el original limpio en vez de inventar una
 * característica: un `telephone` equivocado es peor que uno mal formateado,
 * porque es exactamente la señal que Google usa para decidir si esta página
 * describe a la empresa o está hablando de otra.
 */
export function telefonoE164(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const limpio = valor.trim();
  if (!limpio) return null;

  const digitos = limpio.replace(/\D/g, "");
  if (digitos.length < 8) return null;

  if (limpio.startsWith("+")) return `+${digitos}`;
  if (digitos.startsWith("54") && digitos.length >= 12) return `+${digitos}`;
  // 10 dígitos = característica + abonado sin el 0 (ej. 11 6518-6162).
  if (digitos.length === 10) return `+54${digitos}`;
  // 11 dígitos arrancando en 9 = el "9" de celular ya incluido.
  if (digitos.length === 11 && digitos.startsWith("9")) return `+54${digitos}`;

  return limpio;
}

/** El directorio: es lo que ESTE dominio es. */
export function nodoOrganizacionConecta() {
  return {
    "@type": "Organization",
    "@id": ID_ORG_CONECTA,
    name: "UIAB Conecta",
    // Variantes del nombre PROPIO. Nunca el de la cámara: eso era el bug.
    alternateName: ["Directorio UIAB Conecta", "UIAB Conecta Directorio Industrial"],
    url: SITE_URL,
    logo: `${SITE_URL}/icono-uiab.png`,
    description:
      "UIAB Conecta es el directorio comercial B2B de la Unión Industrial de Almirante Brown: empresas socias, prestadores de productos y servicios, entidades financieras y educativas y cooperativas verificadas del partido de Almirante Brown.",
    parentOrganization: { "@id": ID_ORG_UIAB },
    address: DIRECCION_UIAB,
    telephone: TELEFONO_UIAB,
    email: EMAIL_UIAB,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: TELEFONO_UIAB,
      email: EMAIL_UIAB,
      availableLanguage: "es",
      areaServed: "AR",
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Almirante Brown, Buenos Aires, Argentina",
    },
  };
}

/** La cámara: la entidad que Google ya conoce, declarada en su propio dominio. */
export function nodoOrganizacionUIAB() {
  return {
    "@type": "Organization",
    "@id": ID_ORG_UIAB,
    name: "Unión Industrial de Almirante Brown",
    alternateName: "UIAB",
    url: "https://www.uiab.org",
    sameAs: REDES_UIAB,
    address: DIRECCION_UIAB,
    telephone: TELEFONO_UIAB,
    email: EMAIL_UIAB,
    subOrganization: { "@id": ID_ORG_CONECTA },
  };
}

export function nodoWebSite() {
  return {
    "@type": "WebSite",
    "@id": ID_WEBSITE,
    url: SITE_URL,
    name: "UIAB Conecta",
    inLanguage: "es-AR",
    publisher: { "@id": ID_ORG_CONECTA },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/directorio?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * El grafo que emite el layout raíz en TODAS las páginas. Como viaja en cada
 * documento, cualquier ruta puede citar `ID_ORG_CONECTA` o `ID_ORG_UIAB` por
 * `@id` sabiendo que el nodo completo está en el mismo HTML.
 */
export function grafoSitio() {
  return {
    "@context": "https://schema.org",
    "@graph": [nodoOrganizacionConecta(), nodoOrganizacionUIAB(), nodoWebSite()],
  };
}
