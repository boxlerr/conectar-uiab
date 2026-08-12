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

| Archivo | Servicio |
|---|---|
| `desarrollo-de-software-a-medida.png` | Desarrollo de software a medida |
| `automatizacion-de-procesos-con-ia.png` | Automatización de procesos con IA |
| `consultoria-it-y-transformacion-digital.png` | Consultoría IT y transformación digital |
| `infraestructura-cloud-y-ciberseguridad.png` | Infraestructura cloud y ciberseguridad |
| `mantenimiento-y-escalabilidad-de-software.png` | Mantenimiento y escalabilidad de software |
| `capacitacion-y-herramientas-internas.png` | Capacitación y herramientas internas |

Sirve cualquier extensión de `.png`, `.jpg`, `.jpeg`, `.webp` o `.avif`. Si un
ítem se queda sin archivo, el script imprime el nombre que estaba esperando.

## Qué imágenes van bien acá

Las tarjetas del catálogo recortan a **4:3** con `object-cover`
(`TarjetaItem.tsx`), así que conviene generarlas o pedirlas directamente en 4:3
y sin nada importante contra los bordes. En el modal de detalle la misma imagen
se muestra en un panel más alto, con lo cual una composición centrada aguanta
los dos recortes.

Para que los seis servicios se lean como un set y no como seis imágenes
sueltas: mismo estilo, misma paleta (el navy de la marca, `#00182e` / `#0a0f1a`,
con acentos celestes), ilustración plana o abstracta antes que foto de stock, y
**sin texto adentro de la imagen** — el nombre del servicio ya va debajo, en la
tarjeta.
