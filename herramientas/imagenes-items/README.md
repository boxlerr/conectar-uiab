# Carga masiva de portadas del catálogo

`subir-imagenes.mjs` sube imágenes al bucket `imagenes-publicas` y las registra
en `imagenes_item`, asociándolas al ítem cuyo nombre coincide con el nombre del
archivo (comparando slugs).

```bash
# Ver el plan sin escribir nada
node herramientas/imagenes-items/subir-imagenes.mjs ./mis-imagenes --empresa "Vaxler" --dry

# Subir
node herramientas/imagenes-items/subir-imagenes.mjs ./mis-imagenes --empresa "Vaxler"
```

Necesita `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el `.env`
(o `.env.local`) de la raíz del repo. Usa la service role key porque las
policies de storage exigen un JWT de usuario dueño del ítem o admin.

Por defecto saltea los ítems que ya tienen imagen; `--forzar` agrega igual.
Si el registro en `imagenes_item` falla, borra el blob que acababa de subir
para no dejar archivos huérfanos en el bucket.

## Nombres esperados para los servicios de Vaxler

Un ítem admite hasta 6 imágenes. Para cargar varias, numerá el archivo con un
sufijo `-N`; ese número define el orden en la galería del modal:

| Archivo | Servicio |
|---|---|
| `desarrollo-de-software-a-medida-1.webp` … `-4.webp` | Desarrollo de software a medida |
| `automatizacion-de-procesos-con-ia-1.webp` … `-3.webp` | Automatización de procesos con IA |
| `consultoria-it-y-transformacion-digital-1.webp` … `-2.webp` | Consultoría IT y transformación digital |
| `infraestructura-cloud-y-ciberseguridad-1.webp` | Infraestructura cloud y ciberseguridad |
| `capacitacion-y-herramientas-internas-1.webp` | Capacitación y herramientas internas |
| — | Mantenimiento y escalabilidad de software (sin material) |

Sin sufijo también funciona (`desarrollo-de-software-a-medida.webp`) para una
sola imagen. El sufijo se prueba **después** del nombre exacto, así que un ítem
que termina en número (`Certificación ISO 9001`) sigue emparejando bien.

La carpeta `vaxler/` de este mismo directorio trae el set ya armado:

```bash
node herramientas/imagenes-items/subir-imagenes.mjs herramientas/imagenes-items/vaxler --empresa "Vaxler" --dry
```

## Qué imágenes van bien acá

Las tarjetas del catálogo recortan a **4:3** con `object-cover`
(`TarjetaItem.tsx`), así que conviene que nada importante quede contra los
bordes. El modal, en cambio, usa `object-contain` sobre un panel 4:3: muestra la
imagen entera sin recortar, porque acá se publican capturas de pantalla y
perder los bordes es perder la mitad del contenido.

Para capturas de UI, 1920×1158 en WebP anda muy bien: pesan 40–90 KB cada una y
se ven nítidas en pantallas retina.

Para que los seis servicios se lean como un set y no como seis imágenes
sueltas: mismo estilo, misma paleta (el navy de la marca, `#00182e` / `#0a0f1a`,
con acentos celestes), ilustración plana o abstracta antes que foto de stock, y
**sin texto adentro de la imagen** — el nombre del servicio ya va debajo, en la
tarjeta.
