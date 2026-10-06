-- Aviso por email del Boletín: cuando una nota pasa a `publicado`, le llega un
-- correo a cada socia del padrón. Pedido de Juli: "al crear una publicación del
-- boletín necesito que le llegue el aviso por email a todas las empresas socias
-- que tenemos con su mail".
--
-- TRES COLUMNAS, Y CADA UNA RESUELVE UN PROBLEMA DISTINTO:
--
-- `avisar_por_email` es la INTENCIÓN, y se guarda en la fila en vez de viajar
-- como parámetro del action. Publicar no es una sola puerta —el compositor, el
-- ojito de la lista, y mañana cualquier otra— y si la decisión viajara por
-- parámetro cada puerta tendría que acordarse de pasarlo; la que se olvidara
-- mandaría (o no mandaría) el aviso en silencio. Guardada en la fila hay una
-- sola regla, y vale para toda puerta presente y futura:
--
--     se avisa cuando  estado = 'publicado'
--                 AND  avisar_por_email
--                 AND  aviso_enviado_en IS NULL
--
-- `aviso_enviado_en` es el CANDADO, no un dato de auditoría. Se estampa con un
-- UPDATE condicionado (`... WHERE id = ? AND aviso_enviado_en IS NULL`) ANTES de
-- abrir el SMTP: el que gana la fila manda los correos y el que llega segundo se
-- va con las manos vacías. Sin eso, un doble click en "Publicar" —o un retry de
-- Vercel sobre el mismo POST— le mete la misma nota dos veces en 103 casillas,
-- y eso no se puede deshacer. Es también lo que hace que despublicar y volver a
-- publicar NO reenvíe.
--
-- `aviso_destinatarios` es a cuántas casillas se mandó, para que el panel pueda
-- decir "Avisado a 103 socias" en vez de un tilde mudo. Se completa cuando
-- termina la tanda, así que puede quedar NULL si el proceso se muere a mitad de
-- camino: `aviso_enviado_en` es la verdad sobre si ya salió, esta columna es
-- sólo el contador.

alter table public.comunicados
  add column if not exists avisar_por_email    boolean not null default true,
  add column if not exists aviso_enviado_en    timestamptz,
  add column if not exists aviso_destinatarios integer;

comment on column public.comunicados.avisar_por_email is
  'Intención: ¿esta nota tiene que avisarse por email al publicarse? La marca el compositor (tildada por defecto). Se destilda para una corrección o un aviso menor.';
comment on column public.comunicados.aviso_enviado_en is
  'Candado y fecha del aviso. Se estampa con UPDATE condicionado ANTES de mandar, para que un doble click no duplique el envío. NOT NULL = ya salió y no vuelve a salir.';
comment on column public.comunicados.aviso_destinatarios is
  'A cuántas casillas se mandó el aviso. Sólo para mostrar en el panel; la verdad sobre si salió es aviso_enviado_en.';

-- Las notas que ya estaban publicadas cuando se agregó esto NO tienen que
-- disparar un aviso retroactivo: el primer "publicar" que se toque después del
-- deploy las encontraría con aviso_enviado_en NULL y les mandaría el correo a
-- las 103 socias por una nota vieja. Se las marca como ya avisadas, con la
-- fecha en la que se publicaron y sin contador (nunca se mandó nada: por eso
-- aviso_destinatarios queda en NULL y no en 0).
update public.comunicados
   set aviso_enviado_en = coalesce(publicado_en, creado_en)
 where estado = 'publicado'
   and aviso_enviado_en is null;
