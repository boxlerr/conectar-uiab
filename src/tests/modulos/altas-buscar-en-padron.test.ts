import { describe, expect, it } from 'vitest';
import {
  buscarEmpresaEnPadron,
  buscarEnPadron,
  coincidenciaConfiable,
  esSocia,
} from '@/modulos/altas/buscar-en-padron';
import { nombreContenido, normalizarNombreEmpresa } from '@/modulos/altas/padron';

/**
 * Item 1.3 del reporte de Lucas: no había control contra el padrón, así que
 * /register insertaba una empresa nueva a ciegas.
 *
 * Caso real 1 (2026-08-04): Metalúrgica Longchamps quedó DOS veces en el
 * directorio — la ficha del padrón (aprobada, suscripción activa, CUIT
 * "30-71232689-8") y la que creó Lucas al registrarse (pendiente_revision,
 * pendiente_pago, "30712326898"). El mismo CUIT escrito distinto, que es por lo
 * que hay que normalizar a dígitos.
 *
 * Caso real 2 (2026-08-13): Transporte Gav volvió a duplicarse, pero acá el CUIT
 * no tenía nada que ver — la ficha del padrón NO lo tiene cargado. La empresa se
 * registró como "EMPRESA TRANSPORTE GAV SRL" contra una ficha que dice
 * "Transporte Gav", el sistema no las relacionó y le mandó a pagar $50.000
 * siendo socia. De ahí el match por nombre.
 */

const PADRON = [
  {
    id: 'emp-longchamps',
    razon_social: 'METALURGICA LONGCHAMPS',
    nombre_comercial: null,
    cuit: '30-71232689-8', // con guiones, como vino del padrón importado
    n_socio: '142',
    es_socia_uiab: true,
    estado: 'aprobada',
  },
  {
    id: 'emp-vaxler',
    razon_social: 'Vaxler',
    nombre_comercial: null,
    cuit: '30712326899',
    n_socio: null, // no socia: está en la plataforma pero no en el padrón UIAB
    es_socia_uiab: false,
    estado: 'aprobada',
  },
  {
    // La ficha que rompió el 2026-08-13: socia, publicada y sin CUIT.
    id: 'emp-gav',
    razon_social: 'Transporte Gav',
    nombre_comercial: null,
    cuit: null,
    n_socio: null,
    es_socia_uiab: true,
    estado: 'aprobada',
  },
  {
    // Socia real sin número cargado: el caso que rompía en producción. Con el
    // criterio viejo (n_socio) el sistema le cobraba (20260804_es_socia_uiab).
    id: 'emp-giannoni',
    razon_social: 'Pinturería Giannoni S.A.',
    nombre_comercial: null,
    cuit: '30556917694',
    n_socio: null,
    es_socia_uiab: true,
    estado: 'aprobada',
  },
  {
    // La duplicada que un admin retiró. Empata por nombre con la de arriba, y
    // vincular a ésta sería reabrir el bug: por eso las rechazadas no se miran.
    id: 'emp-giannoni-retirada',
    razon_social: 'Pinturería Giannoni [DUPLICADA — retirada 2026-08-04]',
    nombre_comercial: null,
    cuit: null,
    n_socio: null,
    es_socia_uiab: true,
    estado: 'rechazada',
  },
];

/** Cliente Supabase mínimo: .from().select() devolviendo las filas dadas. */
const clienteCon = (filas: unknown[]) => ({
  from: () => ({
    select: async () => ({ data: filas }),
  }),
});

const db = clienteCon(PADRON);

describe('buscarEmpresaEnPadron — por CUIT', () => {
  it('encuentra la ficha aunque el CUIT venga escrito distinto', async () => {
    // Esto es el corazón del bug: sin normalizar, estos dos no matcheaban.
    const sinGuiones = await buscarEmpresaEnPadron(db, { cuit: '30712326898' });
    expect(sinGuiones?.id).toBe('emp-longchamps');

    const conGuiones = await buscarEmpresaEnPadron(db, { cuit: '30-71232689-8' });
    expect(conGuiones?.id).toBe('emp-longchamps');
  });

  it('tolera espacios, puntos y barras que tipean a mano', async () => {
    for (const escrito of ['30 71232689 8', '30.71232689.8', ' 30-71232689/8 ']) {
      const r = await buscarEmpresaEnPadron(db, { cuit: escrito });
      expect(r?.id, `falló con "${escrito}"`).toBe('emp-longchamps');
    }
  });

  it('no matchea un CUIT que no está en el padrón', async () => {
    expect(await buscarEmpresaEnPadron(db, { cuit: '20111111112' })).toBeNull();
  });

  it('no confunde CUITs parecidos', async () => {
    // Difieren sólo en el último dígito verificador.
    const r = await buscarEmpresaEnPadron(db, { cuit: '30712326899' });
    expect(r?.id).toBe('emp-vaxler');
  });

  it('ignora un CUIT demasiado corto en vez de matchear basura', async () => {
    expect(await buscarEmpresaEnPadron(db, { cuit: '307' })).toBeNull();
    expect(await buscarEmpresaEnPadron(db, { cuit: '' })).toBeNull();
    expect(await buscarEmpresaEnPadron(db, { cuit: null })).toBeNull();
    expect(await buscarEmpresaEnPadron(db, {})).toBeNull();
  });

  it('con el CUIT duplicado en el padrón no elige ninguna: lo resuelve un admin', async () => {
    const dbDuplicado = clienteCon([
      { id: 'a', razon_social: 'A', nombre_comercial: null, cuit: '30712326898', n_socio: '1', estado: 'aprobada' },
      { id: 'b', razon_social: 'B', nombre_comercial: null, cuit: '30-71232689-8', n_socio: '2', estado: 'aprobada' },
    ]);
    const r = await buscarEnPadron(dbDuplicado, { cuit: '30712326898' });
    expect(r.empresa).toBeNull();
    expect(r.ambiguo).toBe(true);
    expect(r.candidatas.sort()).toEqual(['a', 'b']);
  });

  it('el CUIT gana sobre el nombre: si matchea, ni se mira el nombre', async () => {
    const r = await buscarEmpresaEnPadron(db, {
      cuit: '30712326899', // Vaxler
      razonSocial: 'Transporte Gav', // otra ficha distinta
    });
    expect(r?.id).toBe('emp-vaxler');
    expect(r?.coincidencia).toBe('cuit');
  });
});

describe('buscarEmpresaEnPadron — por nombre', () => {
  it('encuentra la ficha sin CUIT por el nombre escrito más largo', async () => {
    // El caso Transporte Gav, tal cual pasó.
    const r = await buscarEmpresaEnPadron(db, {
      cuit: '30716448513', // el CUIT existe, pero la ficha del padrón no lo tiene
      razonSocial: 'EMPRESA TRANSPORTE GAV SRL',
      nombreComercial: 'TRANSPORTE GAV',
    });
    expect(r?.id).toBe('emp-gav');
  });

  it('el nombre comercial exacto pisa al parcial de la razón social', async () => {
    const r = await buscarEmpresaEnPadron(db, {
      razonSocial: 'EMPRESA TRANSPORTE GAV SRL',
      nombreComercial: 'Transporte Gav',
    });
    expect(r?.coincidencia).toBe('nombre');
  });

  it('ignora acentos, puntos y la forma societaria', async () => {
    for (const escrito of [
      'Pinturería Giannoni S.A.',
      'PINTURERIA GIANNONI SA',
      'pintureria giannoni s.a.',
      'Pintureria Giannoni',
    ]) {
      const r = await buscarEmpresaEnPadron(db, { razonSocial: escrito });
      expect(r?.id, `falló con "${escrito}"`).toBe('emp-giannoni');
    }
  });

  it('no vincula a una ficha rechazada aunque el nombre coincida', async () => {
    // "Pinturería Giannoni [DUPLICADA — retirada]" normaliza igual que la buena.
    // Si las rechazadas entraran, esto sería un empate y no matchearía nada.
    const r = await buscarEmpresaEnPadron(db, { razonSocial: 'Pinturería Giannoni' });
    expect(r?.id).toBe('emp-giannoni');
  });

  it('marca como parcial lo que matcheó por nombre contenido', async () => {
    const r = await buscarEmpresaEnPadron(db, { razonSocial: 'EMPRESA TRANSPORTE GAV SRL' });
    expect(r?.coincidencia).toBe('nombre_parcial');
    expect(coincidenciaConfiable(r)).toBe(false);
  });

  it('el match exacto y el de CUIT sí son confiables', async () => {
    expect(coincidenciaConfiable(await buscarEmpresaEnPadron(db, { cuit: '30712326898' }))).toBe(true);
    expect(coincidenciaConfiable(await buscarEmpresaEnPadron(db, { razonSocial: 'Transporte Gav' }))).toBe(true);
  });

  it('no matchea una empresa que no tiene nada que ver', async () => {
    expect(await buscarEmpresaEnPadron(db, { razonSocial: 'Panadería La Esquina SRL' })).toBeNull();
  });

  it('si sólo coincide con una ficha RETIRADA, avisa en vez de dejar seguir', async () => {
    // `empresas.cuit` tiene índice único y las retiradas se quedan con el suyo
    // ("Metalurgica Longchamps SRL [DUPLICADA]" todavía tiene 30712326898). Sin
    // esta red, el registro intentaba crear una ficha con ese mismo CUIT y se
    // caía con un 23505 que al socio le llegaba como un 500 pelado.
    const dbRetirada = clienteCon([
      {
        id: 'emp-retirada',
        razon_social: 'Ferretería Del Sur [DUPLICADA — retirada 2026-08-03]',
        nombre_comercial: null,
        cuit: '30999999997',
        n_socio: null,
        es_socia_uiab: false,
        estado: 'rechazada',
      },
    ]);

    const porCuit = await buscarEnPadron(dbRetirada, { cuit: '30-99999999-7' });
    expect(porCuit.empresa).toBeNull();
    expect(porCuit.ambiguo).toBe(true);
    expect(porCuit.candidatas).toEqual(['emp-retirada']);

    const porNombre = await buscarEnPadron(dbRetirada, { razonSocial: 'Ferretería Del Sur SRL' });
    expect(porNombre.ambiguo).toBe(true);
  });

  it('una retirada no le gana a la ficha buena', async () => {
    // Las tres pasadas normales corren primero: la retirada es la última red.
    const r = await buscarEmpresaEnPadron(db, { razonSocial: 'Pinturería Giannoni' });
    expect(r?.id).toBe('emp-giannoni');
  });

  it('no devuelve el cuit crudo, sólo lo que necesita quien decide', async () => {
    const r = await buscarEmpresaEnPadron(db, { cuit: '30712326898' });
    expect(r).not.toHaveProperty('cuit');
    expect(Object.keys(r!).sort()).toEqual([
      'coincidencia', 'es_socia_uiab', 'estado', 'id', 'n_socio', 'razon_social',
    ]);
  });
});

describe('normalizarNombreEmpresa', () => {
  it('saca acentos, puntuación y forma societaria', () => {
    expect(normalizarNombreEmpresa('EMPRESA TRANSPORTE GAV SRL')).toBe('empresa transporte gav');
    expect(normalizarNombreEmpresa('Pinturería Giannoni S.A.')).toBe('pintureria giannoni');
    expect(normalizarNombreEmpresa('A. D. BARBIERI S.A.')).toBe('a d barbieri');
    expect(normalizarNombreEmpresa('BOLSAPEL S.A.I.C.I.F.Y.A')).toBe('bolsapel');
    expect(normalizarNombreEmpresa('FINE & PURE S.R.L.')).toBe('fine pure');
  });

  it('no se come el nombre entero cuando es una sigla societaria sola', () => {
    // Sin el corte de `tokens.length > 1` esto quedaría en "" y matchearía todo.
    expect(normalizarNombreEmpresa('SA')).toBe('sa');
  });

  it('descarta las anotaciones internas entre corchetes', () => {
    expect(normalizarNombreEmpresa('Pinturería Giannoni [DUPLICADA — retirada 2026-08-04]')).toBe(
      'pintureria giannoni'
    );
  });

  it('con nada devuelve cadena vacía', () => {
    expect(normalizarNombreEmpresa(null)).toBe('');
    expect(normalizarNombreEmpresa(undefined)).toBe('');
    expect(normalizarNombreEmpresa('   ')).toBe('');
  });
});

describe('nombreContenido', () => {
  it('reconoce el mismo nombre escrito más largo', () => {
    expect(nombreContenido('EMPRESA TRANSPORTE GAV SRL', 'Transporte Gav')).toBe(true);
    expect(nombreContenido('Transporte Gav', 'EMPRESA TRANSPORTE GAV SRL')).toBe(true);
  });

  it('no alcanza con un token corto suelto', () => {
    // "gav" solo podría ser cualquier cosa.
    expect(nombreContenido('GAV', 'Transporte Gav')).toBe(false);
  });

  it('un token largo solo sí alcanza', () => {
    expect(nombreContenido('PULVERLUX ARGENTINA SA', 'Pulverlux')).toBe(true);
  });

  it('no matchea si falta alguno de los tokens', () => {
    expect(nombreContenido('Transporte Gomez', 'Transporte Gav')).toBe(false);
  });

  it('con nombre vacío no matchea nada', () => {
    expect(nombreContenido('', 'Transporte Gav')).toBe(false);
    expect(nombreContenido(null, null)).toBe(false);
  });
});

/**
 * Prueba de fuego contra los 63 nombres reales del directorio (snapshot del
 * 2026-08-13). Lo que se verifica es que el match por nombre NO produzca falsos
 * positivos: si emparejara dos empresas distintas, alguien terminaría adentro de
 * la ficha de otro.
 */
const NOMBRES_REALES = [
  'A. D. BARBIERI S.A.', 'ACEROS ANGELETTI S.A.', 'AKUA S.A', 'ALIMENTOS FRANSRO',
  'ALKANOS S.A.', 'ANDARIEGA SOLUCIONES HABITACIONALES S.R.L', 'ARCURI S.A.',
  'BAYRESPLASTIC S.R.L.', 'BECKERS ARGENTINA S.A.', 'BESTCHEM S.A.',
  'BIOBEST ARGENTINA S.A.', 'BOLSAPEL S.A.I.C.I.F.Y.A', 'Branch Ingeniería',
  'CARPAS D` ANGIOLA', 'CENTRAL ALERT', 'DIRANSA SRL', 'EMPRESA TRANSPORTE GAV SRL',
  'FINE & PURE S.R.L.', 'FORJA ATLAS S.A.', 'GENROD S.A.', 'GINZUK S.R.L.',
  'Grupo Ceta', 'IND. CERAMICAS LOURDES S.A.', 'INDIOQUIMICA S.A',
  'INDUSTRIAS BACO SAIC', 'INDUSTRIAS GUIDI S.A.', 'JACQUARD TEXTILE SOUTH AMERICA',
  'JUNAR S.A.', 'KORUND S.A.', 'LABELTEC S.A.', 'LATIN CHEMICAL SUPPLIERS S.A.',
  'Mafalda', 'METALURGICA LONGCHAMPS', 'MIGUEL ABAD S.A.', 'NAVES DEL SUR SA',
  'ORMAZABAL', 'Pinturería Giannoni S.A.', 'PLAQUIMET S.A.', 'POLIGSA S.A.',
  'PROLAS S.A.', 'PULVERLUX', 'ROGUANT S.R.L.', 'ROLL PAPER S.R.L.',
  'RPA CATAFORESIS FACTORY S.R.L.', 'SAINT GOBAIN S.A. - MEGAFLEX', 'SEFINPOL S.A.',
  'Seguridad Líderes', 'SERVICIOS DEL PARQUE DE BURZACO DE ALTE. BROWN',
  'Simonetta Automatización S.A.', 'SISTEMAS DE CODIFICACION S.A', 'TDMA SRL',
  'Tecza', 'TGI PACK SA', 'TODO ADROGUE', 'Transporte Gav', 'TRANSPORTES MORETTA',
  'TROX ARGENTINA S.A.', 'UNIÓN INDUSTRIAL DE ALMIRANTE BROWN', 'Vaxler',
  'ZOLODA S.A.',
];

describe('contra el padrón real', () => {
  it('el único par que empareja por nombre es Transporte Gav', () => {
    const pares: string[] = [];
    for (let i = 0; i < NOMBRES_REALES.length; i++) {
      for (let j = i + 1; j < NOMBRES_REALES.length; j++) {
        const a = NOMBRES_REALES[i];
        const b = NOMBRES_REALES[j];
        if (normalizarNombreEmpresa(a) === normalizarNombreEmpresa(b) || nombreContenido(a, b)) {
          pares.push(`${a} <=> ${b}`);
        }
      }
    }
    expect(pares).toEqual(['EMPRESA TRANSPORTE GAV SRL <=> Transporte Gav']);
  });

  it('cada empresa del padrón se encuentra a sí misma y a nadie más', async () => {
    const filas = NOMBRES_REALES.map((razon_social, i) => ({
      id: `emp-${i}`,
      razon_social,
      nombre_comercial: null,
      cuit: null,
      n_socio: null,
      es_socia_uiab: true,
      estado: 'aprobada',
    }));
    const dbReal = clienteCon(filas);

    for (const [i, razon_social] of NOMBRES_REALES.entries()) {
      // Transporte Gav es el par conocido: buscar cualquiera de los dos da empate.
      if (/transporte gav/i.test(razon_social)) continue;
      const r = await buscarEmpresaEnPadron(dbReal, { razonSocial: razon_social });
      expect(r?.id, `"${razon_social}" no se encontró a sí misma`).toBe(`emp-${i}`);
    }
  });
});

describe('esSocia', () => {
  it('es_socia_uiab en true = socia, le corresponde acceso bonificado', async () => {
    expect(esSocia(await buscarEmpresaEnPadron(db, { cuit: '30712326898' }))).toBe(true);
  });

  it('es_socia_uiab en false no es socia: el acceso es arancelado', async () => {
    expect(esSocia(await buscarEmpresaEnPadron(db, { cuit: '30712326899' }))).toBe(false);
  });

  it('socia sin n_socio SIGUE siendo socia: el número es opcional', async () => {
    // Regresión de producción: Pinturería Giannoni es socia pero nadie le cargó
    // el número, y con el criterio viejo el checkout le cobraba igual.
    const giannoni = await buscarEmpresaEnPadron(db, { cuit: '30556917694' });
    expect(giannoni?.n_socio).toBeNull();
    expect(esSocia(giannoni)).toBe(true);
  });

  it('sin ficha en el padrón tampoco es socia', () => {
    expect(esSocia(null)).toBe(false);
  });
});
