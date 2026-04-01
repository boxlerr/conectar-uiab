# Estructura de Base de Datos - Conectar UIAB

A continuación se detalla el esquema de tablas y columnas extraído de la base de datos de Supabase:

```json
[
  {
    "table_name": "alias_categorias",
    "column_name": "alias",
    "data_type": "text"
  },
  {
    "table_name": "alias_categorias",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "alias_categorias",
    "column_name": "categoria_id",
    "data_type": "uuid"
  },
  {
    "table_name": "alias_tags",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "alias_tags",
    "column_name": "tag_id",
    "data_type": "uuid"
  },
  {
    "table_name": "alias_tags",
    "column_name": "alias",
    "data_type": "text"
  },
  {
    "table_name": "auditoria",
    "column_name": "tipo_entidad",
    "data_type": "text"
  },
  {
    "table_name": "auditoria",
    "column_name": "user_agent",
    "data_type": "text"
  },
  {
    "table_name": "auditoria",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "auditoria",
    "column_name": "perfil_actor_id",
    "data_type": "uuid"
  },
  {
    "table_name": "auditoria",
    "column_name": "empresa_id",
    "data_type": "uuid"
  },
  {
    "table_name": "auditoria",
    "column_name": "proveedor_id",
    "data_type": "uuid"
  },
  {
    "table_name": "auditoria",
    "column_name": "accion",
    "data_type": "text"
  },
  {
    "table_name": "auditoria",
    "column_name": "entidad_id",
    "data_type": "uuid"
  },
  {
    "table_name": "auditoria",
    "column_name": "datos_anteriores",
    "data_type": "jsonb"
  },
  {
    "table_name": "auditoria",
    "column_name": "datos_nuevos",
    "data_type": "jsonb"
  },
  {
    "table_name": "auditoria",
    "column_name": "ip_address",
    "data_type": "inet"
  },
  {
    "table_name": "auditoria",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "categorias",
    "column_name": "categoria_padre_id",
    "data_type": "uuid"
  },
  {
    "table_name": "categorias",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "categorias",
    "column_name": "nombre",
    "data_type": "text"
  },
  {
    "table_name": "categorias",
    "column_name": "descripcion",
    "data_type": "text"
  },
  {
    "table_name": "categorias",
    "column_name": "slug",
    "data_type": "text"
  },
  {
    "table_name": "categorias",
    "column_name": "actualizado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "categorias",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "categorias",
    "column_name": "orden",
    "data_type": "integer"
  },
  {
    "table_name": "categorias",
    "column_name": "activa",
    "data_type": "boolean"
  },
  {
    "table_name": "configuraciones_sistema",
    "column_name": "actualizado_por",
    "data_type": "uuid"
  },
  {
    "table_name": "configuraciones_sistema",
    "column_name": "actualizado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "configuraciones_sistema",
    "column_name": "descripcion",
    "data_type": "text"
  },
  {
    "table_name": "configuraciones_sistema",
    "column_name": "clave",
    "data_type": "text"
  },
  {
    "table_name": "configuraciones_sistema",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "configuraciones_sistema",
    "column_name": "valor",
    "data_type": "jsonb"
  },
  {
    "table_name": "empresas",
    "column_name": "creada_por",
    "data_type": "uuid"
  },
  {
    "table_name": "empresas",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "empresas",
    "column_name": "actualizado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "empresas",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "empresas",
    "column_name": "mime_logo",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "bucket_portada",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "ruta_portada",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "nombre_portada",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "mime_portada",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "estado",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "motivo_rechazo",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "nombre_logo",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "ruta_logo",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "bucket_logo",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "pais",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "provincia",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "localidad",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "direccion",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "razon_social",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "sitio_web",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "nombre_fantasia",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "whatsapp",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "telefono",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "email",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "descripcion",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "cuit",
    "data_type": "text"
  },
  {
    "table_name": "empresas",
    "column_name": "tamano_logo_bytes",
    "data_type": "bigint"
  },
  {
    "table_name": "empresas",
    "column_name": "tamano_portada_bytes",
    "data_type": "bigint"
  },
  {
    "table_name": "empresas",
    "column_name": "aprobada_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "empresas",
    "column_name": "aprobada_por",
    "data_type": "uuid"
  },
  {
    "table_name": "empresas_categorias",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "empresas_categorias",
    "column_name": "empresa_id",
    "data_type": "uuid"
  },
  {
    "table_name": "empresas_categorias",
    "column_name": "categoria_id",
    "data_type": "uuid"
  },
  {
    "table_name": "empresas_tags",
    "column_name": "empresa_id",
    "data_type": "uuid"
  },
  {
    "table_name": "empresas_tags",
    "column_name": "tag_id",
    "data_type": "uuid"
  },
  {
    "table_name": "empresas_tags",
    "column_name": "peso",
    "data_type": "numeric"
  },
  {
    "table_name": "empresas_tags",
    "column_name": "origen",
    "data_type": "text"
  },
  {
    "table_name": "empresas_tags",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "imagenes_item",
    "column_name": "nombre_archivo",
    "data_type": "text"
  },
  {
    "table_name": "imagenes_item",
    "column_name": "mime_type",
    "data_type": "text"
  },
  {
    "table_name": "imagenes_item",
    "column_name": "texto_alternativo",
    "data_type": "text"
  },
  {
    "table_name": "imagenes_item",
    "column_name": "bucket",
    "data_type": "text"
  },
  {
    "table_name": "imagenes_item",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "imagenes_item",
    "column_name": "tamano_bytes",
    "data_type": "bigint"
  },
  {
    "table_name": "imagenes_item",
    "column_name": "item_id",
    "data_type": "uuid"
  },
  {
    "table_name": "imagenes_item",
    "column_name": "orden",
    "data_type": "integer"
  },
  {
    "table_name": "imagenes_item",
    "column_name": "ruta_archivo",
    "data_type": "text"
  },
  {
    "table_name": "imagenes_item",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "items",
    "column_name": "creado_por",
    "data_type": "uuid"
  },
  {
    "table_name": "items",
    "column_name": "aprobado_por",
    "data_type": "uuid"
  },
  {
    "table_name": "items",
    "column_name": "aprobado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "items",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "items",
    "column_name": "empresa_id",
    "data_type": "uuid"
  },
  {
    "table_name": "items",
    "column_name": "proveedor_id",
    "data_type": "uuid"
  },
  {
    "table_name": "items",
    "column_name": "categoria_id",
    "data_type": "uuid"
  },
  {
    "table_name": "items",
    "column_name": "motivo_rechazo",
    "data_type": "text"
  },
  {
    "table_name": "items",
    "column_name": "estado",
    "data_type": "text"
  },
  {
    "table_name": "items",
    "column_name": "unidad",
    "data_type": "text"
  },
  {
    "table_name": "items",
    "column_name": "descripcion_larga",
    "data_type": "text"
  },
  {
    "table_name": "items",
    "column_name": "descripcion_corta",
    "data_type": "text"
  },
  {
    "table_name": "items",
    "column_name": "nombre",
    "data_type": "text"
  },
  {
    "table_name": "items",
    "column_name": "tipo_item",
    "data_type": "text"
  },
  {
    "table_name": "items",
    "column_name": "actualizado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "items",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "items_tags",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "items_tags",
    "column_name": "item_id",
    "data_type": "uuid"
  },
  {
    "table_name": "items_tags",
    "column_name": "tag_id",
    "data_type": "uuid"
  },
  {
    "table_name": "items_tags",
    "column_name": "peso",
    "data_type": "numeric"
  },
  {
    "table_name": "items_tags",
    "column_name": "origen",
    "data_type": "text"
  },
  {
    "table_name": "miembros_empresa",
    "column_name": "rol",
    "data_type": "text"
  },
  {
    "table_name": "miembros_empresa",
    "column_name": "es_principal",
    "data_type": "boolean"
  },
  {
    "table_name": "miembros_empresa",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "miembros_empresa",
    "column_name": "perfil_id",
    "data_type": "uuid"
  },
  {
    "table_name": "miembros_empresa",
    "column_name": "empresa_id",
    "data_type": "uuid"
  },
  {
    "table_name": "miembros_empresa",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "miembros_proveedor",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "miembros_proveedor",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "miembros_proveedor",
    "column_name": "proveedor_id",
    "data_type": "uuid"
  },
  {
    "table_name": "miembros_proveedor",
    "column_name": "perfil_id",
    "data_type": "uuid"
  },
  {
    "table_name": "miembros_proveedor",
    "column_name": "es_principal",
    "data_type": "boolean"
  },
  {
    "table_name": "miembros_proveedor",
    "column_name": "rol",
    "data_type": "text"
  },
  {
    "table_name": "oportunidades",
    "column_name": "cantidad",
    "data_type": "numeric"
  },
  {
    "table_name": "oportunidades",
    "column_name": "visibilidad",
    "data_type": "text"
  },
  {
    "table_name": "oportunidades",
    "column_name": "localidad",
    "data_type": "text"
  },
  {
    "table_name": "oportunidades",
    "column_name": "estado",
    "data_type": "text"
  },
  {
    "table_name": "oportunidades",
    "column_name": "fecha_necesidad",
    "data_type": "date"
  },
  {
    "table_name": "oportunidades",
    "column_name": "unidad",
    "data_type": "text"
  },
  {
    "table_name": "oportunidades",
    "column_name": "descripcion",
    "data_type": "text"
  },
  {
    "table_name": "oportunidades",
    "column_name": "titulo",
    "data_type": "text"
  },
  {
    "table_name": "oportunidades",
    "column_name": "actualizado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "oportunidades",
    "column_name": "creado_por",
    "data_type": "uuid"
  },
  {
    "table_name": "oportunidades",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "oportunidades",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "oportunidades",
    "column_name": "empresa_solicitante_id",
    "data_type": "uuid"
  },
  {
    "table_name": "oportunidades",
    "column_name": "proveedor_solicitante_id",
    "data_type": "uuid"
  },
  {
    "table_name": "oportunidades",
    "column_name": "categoria_id",
    "data_type": "uuid"
  },
  {
    "table_name": "oportunidades_matches",
    "column_name": "oportunidad_id",
    "data_type": "uuid"
  },
  {
    "table_name": "oportunidades_matches",
    "column_name": "empresa_candidata_id",
    "data_type": "uuid"
  },
  {
    "table_name": "oportunidades_matches",
    "column_name": "proveedor_candidato_id",
    "data_type": "uuid"
  },
  {
    "table_name": "oportunidades_matches",
    "column_name": "item_candidato_id",
    "data_type": "uuid"
  },
  {
    "table_name": "oportunidades_matches",
    "column_name": "puntaje",
    "data_type": "numeric"
  },
  {
    "table_name": "oportunidades_matches",
    "column_name": "detalle_puntaje",
    "data_type": "jsonb"
  },
  {
    "table_name": "oportunidades_matches",
    "column_name": "generado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "oportunidades_matches",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "oportunidades_matches",
    "column_name": "estado",
    "data_type": "text"
  },
  {
    "table_name": "oportunidades_matches",
    "column_name": "motivo_match",
    "data_type": "text"
  },
  {
    "table_name": "oportunidades_tags",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "oportunidades_tags",
    "column_name": "oportunidad_id",
    "data_type": "uuid"
  },
  {
    "table_name": "oportunidades_tags",
    "column_name": "tag_id",
    "data_type": "uuid"
  },
  {
    "table_name": "oportunidades_tags",
    "column_name": "peso",
    "data_type": "numeric"
  },
  {
    "table_name": "pagos_suscripciones",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "pagos_suscripciones",
    "column_name": "pagado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "pagos_suscripciones",
    "column_name": "payload",
    "data_type": "jsonb"
  },
  {
    "table_name": "pagos_suscripciones",
    "column_name": "monto",
    "data_type": "numeric"
  },
  {
    "table_name": "pagos_suscripciones",
    "column_name": "proveedor_id",
    "data_type": "uuid"
  },
  {
    "table_name": "pagos_suscripciones",
    "column_name": "empresa_id",
    "data_type": "uuid"
  },
  {
    "table_name": "pagos_suscripciones",
    "column_name": "suscripcion_id",
    "data_type": "uuid"
  },
  {
    "table_name": "pagos_suscripciones",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "pagos_suscripciones",
    "column_name": "estado",
    "data_type": "text"
  },
  {
    "table_name": "pagos_suscripciones",
    "column_name": "external_reference",
    "data_type": "text"
  },
  {
    "table_name": "pagos_suscripciones",
    "column_name": "mercado_pago_payment_id",
    "data_type": "text"
  },
  {
    "table_name": "pagos_suscripciones",
    "column_name": "moneda",
    "data_type": "text"
  },
  {
    "table_name": "perfiles",
    "column_name": "nombre_completo",
    "data_type": "text"
  },
  {
    "table_name": "perfiles",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "perfiles",
    "column_name": "tamano_avatar_bytes",
    "data_type": "bigint"
  },
  {
    "table_name": "perfiles",
    "column_name": "activo",
    "data_type": "boolean"
  },
  {
    "table_name": "perfiles",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "perfiles",
    "column_name": "actualizado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "perfiles",
    "column_name": "email",
    "data_type": "text"
  },
  {
    "table_name": "perfiles",
    "column_name": "telefono",
    "data_type": "text"
  },
  {
    "table_name": "perfiles",
    "column_name": "rol_sistema",
    "data_type": "text"
  },
  {
    "table_name": "perfiles",
    "column_name": "bucket_avatar",
    "data_type": "text"
  },
  {
    "table_name": "perfiles",
    "column_name": "ruta_avatar",
    "data_type": "text"
  },
  {
    "table_name": "perfiles",
    "column_name": "nombre_avatar",
    "data_type": "text"
  },
  {
    "table_name": "perfiles",
    "column_name": "mime_avatar",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "cuit",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "nombre_portada",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "mime_portada",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "estado",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "motivo_rechazo",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "actualizado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "proveedores",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "proveedores",
    "column_name": "creado_por",
    "data_type": "uuid"
  },
  {
    "table_name": "proveedores",
    "column_name": "aprobado_por",
    "data_type": "uuid"
  },
  {
    "table_name": "proveedores",
    "column_name": "aprobado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "proveedores",
    "column_name": "tamano_portada_bytes",
    "data_type": "bigint"
  },
  {
    "table_name": "proveedores",
    "column_name": "tamano_logo_bytes",
    "data_type": "bigint"
  },
  {
    "table_name": "proveedores",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "proveedores",
    "column_name": "tipo_proveedor",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "nombre",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "apellido",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "mime_logo",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "bucket_portada",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "ruta_portada",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "razon_social",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "nombre_comercial",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "descripcion",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "email",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "telefono",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "whatsapp",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "sitio_web",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "direccion",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "localidad",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "provincia",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "pais",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "bucket_logo",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "ruta_logo",
    "data_type": "text"
  },
  {
    "table_name": "proveedores",
    "column_name": "nombre_logo",
    "data_type": "text"
  },
  {
    "table_name": "proveedores_categorias",
    "column_name": "categoria_id",
    "data_type": "uuid"
  },
  {
    "table_name": "proveedores_categorias",
    "column_name": "proveedor_id",
    "data_type": "uuid"
  },
  {
    "table_name": "proveedores_categorias",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "proveedores_tags",
    "column_name": "proveedor_id",
    "data_type": "uuid"
  },
  {
    "table_name": "proveedores_tags",
    "column_name": "origen",
    "data_type": "text"
  },
  {
    "table_name": "proveedores_tags",
    "column_name": "peso",
    "data_type": "numeric"
  },
  {
    "table_name": "proveedores_tags",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "proveedores_tags",
    "column_name": "tag_id",
    "data_type": "uuid"
  },
  {
    "table_name": "resenas",
    "column_name": "motivo_moderacion",
    "data_type": "text"
  },
  {
    "table_name": "resenas",
    "column_name": "calificacion",
    "data_type": "integer"
  },
  {
    "table_name": "resenas",
    "column_name": "empresa_resenada_id",
    "data_type": "uuid"
  },
  {
    "table_name": "resenas",
    "column_name": "moderada_por",
    "data_type": "uuid"
  },
  {
    "table_name": "resenas",
    "column_name": "moderada_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "resenas",
    "column_name": "proveedor_autor_id",
    "data_type": "uuid"
  },
  {
    "table_name": "resenas",
    "column_name": "comentario",
    "data_type": "text"
  },
  {
    "table_name": "resenas",
    "column_name": "estado",
    "data_type": "text"
  },
  {
    "table_name": "resenas",
    "column_name": "creada_por",
    "data_type": "uuid"
  },
  {
    "table_name": "resenas",
    "column_name": "empresa_autora_id",
    "data_type": "uuid"
  },
  {
    "table_name": "resenas",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "resenas",
    "column_name": "solicitud_presupuesto_id",
    "data_type": "uuid"
  },
  {
    "table_name": "resenas",
    "column_name": "proveedor_resenado_id",
    "data_type": "uuid"
  },
  {
    "table_name": "resenas",
    "column_name": "creada_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "resenas",
    "column_name": "actualizada_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "proveedor_destino_id",
    "data_type": "uuid"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "respondida_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "vista_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "enviada_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "perfil_solicitante_id",
    "data_type": "uuid"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "item_id",
    "data_type": "uuid"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "empresa_origen_id",
    "data_type": "uuid"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "unidad",
    "data_type": "text"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "mensaje",
    "data_type": "text"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "estado",
    "data_type": "text"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "empresa_destino_id",
    "data_type": "uuid"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "proveedor_origen_id",
    "data_type": "uuid"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "cantidad",
    "data_type": "numeric"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "oportunidad_id",
    "data_type": "uuid"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "cerrada_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "solicitudes_presupuesto",
    "column_name": "actualizado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "suscripciones",
    "column_name": "nombre_plan",
    "data_type": "text"
  },
  {
    "table_name": "suscripciones",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "suscripciones",
    "column_name": "cancelada_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "suscripciones",
    "column_name": "finaliza_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "suscripciones",
    "column_name": "inicia_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "suscripciones",
    "column_name": "monto",
    "data_type": "numeric"
  },
  {
    "table_name": "suscripciones",
    "column_name": "empresa_id",
    "data_type": "uuid"
  },
  {
    "table_name": "suscripciones",
    "column_name": "mercado_pago_customer_id",
    "data_type": "text"
  },
  {
    "table_name": "suscripciones",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "suscripciones",
    "column_name": "mercado_pago_preapproval_id",
    "data_type": "text"
  },
  {
    "table_name": "suscripciones",
    "column_name": "moneda",
    "data_type": "text"
  },
  {
    "table_name": "suscripciones",
    "column_name": "proveedor_id",
    "data_type": "uuid"
  },
  {
    "table_name": "suscripciones",
    "column_name": "actualizado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "suscripciones",
    "column_name": "estado",
    "data_type": "text"
  },
  {
    "table_name": "tags",
    "column_name": "nombre",
    "data_type": "text"
  },
  {
    "table_name": "tags",
    "column_name": "slug",
    "data_type": "text"
  },
  {
    "table_name": "tags",
    "column_name": "tipo_tag",
    "data_type": "text"
  },
  {
    "table_name": "tags",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "tags",
    "column_name": "administrado_por_admin",
    "data_type": "boolean"
  },
  {
    "table_name": "tags",
    "column_name": "activo",
    "data_type": "boolean"
  },
  {
    "table_name": "tags",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  }
]