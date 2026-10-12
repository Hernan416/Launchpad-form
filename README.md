# LaunchPad Intake Form

Dos formularios tipo Typeform (`/v1` y `/v2`) que guardan cada respuesta como una carpeta + Google Doc dentro de Google Drive.

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar OAuth de Google

1. En [Google Cloud Console](https://console.cloud.google.com/apis/credentials), en el mismo proyecto del Client ID que ya tienes (`GOOGLE CLOUD/client_secret_*.json`), habilita las APIs **Google Drive API** y **Google Docs API**.
2. En ese Client ID (tipo "Web application"), agrega como **Authorized redirect URI**:
   ```
   http://localhost:3333/oauth2callback
   ```
3. Copia `.env.local.example` a `.env.local` y llena `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` con los valores del JSON descargado.
4. Genera el `refresh_token` (una sola vez):

   PowerShell:
   ```powershell
   $env:GOOGLE_CLIENT_ID="tu-client-id"; $env:GOOGLE_CLIENT_SECRET="tu-client-secret"; npm run get-refresh-token
   ```

   Se abrirá el navegador para iniciar sesión con la cuenta de Google que tendrá acceso a Drive. Copia el `GOOGLE_REFRESH_TOKEN` que imprime la terminal a tu `.env.local`.

5. Crea (o reutiliza) una carpeta en Google Drive, compártela si hace falta con la cuenta usada en el paso anterior, y copia su ID (el valor después de `/folders/` en la URL) en `GOOGLE_DRIVE_PARENT_FOLDER_ID`.

## 3. Correr en local

```bash
npm run dev
```

- http://localhost:3000/v1
- http://localhost:3000/v2

## 4. Reemplazar las preguntas reales

Edita `lib/questions/v1.ts` y `lib/questions/v2.ts`. Cada pregunta soporta: `short_text`, `long_text`, `email`, `phone`, `single_choice`, `multiple_choice`.

> La pregunta con `id: "name"` (o `"company"` si no existe) se usa como nombre del respondiente para nombrar la carpeta creada en Drive.

## 5. Desplegar en Vercel

```bash
vercel
```

En el dashboard del proyecto en Vercel, agrega las mismas 4 variables de entorno de `.env.local` (Settings → Environment Variables).

No es necesario volver a generar el `refresh_token` para producción: el mismo valor sirve mientras no se revoque el acceso desde la cuenta de Google.
