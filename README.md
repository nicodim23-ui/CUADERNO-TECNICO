# Cuaderno del Cuerpo Técnico

App web para que el cuerpo técnico registre plantel, entrenamientos, tests, lesiones, rutinas y partidos.

- **Datos:** Firebase (Authentication con mail y contraseña + Firestore).
- **Publicación:** GitHub Pages, desde la rama `main`.
- **En el iPhone:** abrir el link en Safari → Compartir → *Agregar a inicio*.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La app completa |
| `config.js` | Datos del proyecto de Firebase |
| `firestore.rules` | Reglas de seguridad (se pegan en la consola de Firebase) |
| `manifest.webmanifest`, `*.png` | Nombre e ícono al instalarla en el teléfono |

## Accesos

Solo los mails habilitados en la sección **Accesos** pueden ver y cargar datos. Esa sección la ve únicamente el administrador.
Para sumar a alguien: habilitar su mail en Accesos y pasarle el link. Entra con *Crear cuenta* usando ese mismo mail y lo confirma desde el correo que le llega.

## Actualizar

Cualquier cambio que se suba a `main` queda publicado en uno o dos minutos. Los datos viven en Firebase, así que actualizar la app no borra nada.
