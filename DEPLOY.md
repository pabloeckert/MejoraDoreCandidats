# Despliegue en Cloudflare Pages

Guía de despliegue y configuración para **Dore Candidate Compass** (`dore-candidatos`).

---

## 1. Comandos de despliegue

Asegurate de haber iniciado sesión previamente en Cloudflare:

```bash
npx wrangler login
```

### Despliegue a Producción (rama `main`)

Construye el bundle en `dist/` e impacta en la URL de producción (`https://dore-candidatos.pages.dev` y el dominio personalizado):

```bash
npm run deploy
```

### Despliegue a Preview (rama `preview`)

Construye el bundle y genera una URL de vista previa aislada sin afectar producción:

```bash
npm run deploy:preview
```

---

## 2. Variables de entorno en Cloudflare Pages

Las variables de entorno `VITE_*` quedan incrustadas durante el build. Al compilar localmente con `npm run deploy`, toma los valores del archivo `.env` local.
Si en el futuro se compila mediante CI/CD directo en Cloudflare Pages, configurá en **Settings > Environment variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 3. Pasos manuales para el dominio `candidatos.mejoraok.com`

Una vez realizado el primer despliegue en `dore-candidatos.pages.dev`:

1. **Configurar dominio personalizado en Cloudflare**:
   - Ingresá al panel de Cloudflare.
   - Navegá a **Workers & Pages** > **dore-candidatos**.
   - Hacé clic en la pestaña **Custom domains** y luego en **Set up a domain**.
   - Ingresá: `candidatos.mejoraok.com` y confirmá.

2. **Configuración de DNS**:
   - **Si el DNS de `mejoraok.com` está administrado en Cloudflare**:
     Cloudflare creará automáticamente el registro CNAME necesario.
   - **Si el DNS de `mejoraok.com` está en un proveedor externo** (ej. DonWeb, GoDaddy, Hostinger, etc.):
     Ingresá a la zona DNS de tu proveedor y creá un registro tipo **CNAME**:
     - **Nombre / Host / Subdominio**: `candidatos`
     - **Destino / Valor / Apunta a**: `dore-candidatos.pages.dev`
     - **TTL**: Automático o 3600 segundos.

3. **Verificación y propagación**:
   - Aguardá unos minutos mientras se propaga el registro DNS y Cloudflare emite automáticamente el certificado SSL.
   - Accedé a `https://candidatos.mejoraok.com` para verificar que la aplicación cargue con HTTPS activo, sincronice con Supabase y opere correctamente.
