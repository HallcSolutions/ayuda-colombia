---
description: Dice si alguien está usando RedAyuda de verdad, leyendo lo que ya se guarda en la base
argument-hint: [prod|local] [días]
allowed-tools: Bash(cd:*), Bash(npx ts-node:*), Bash(railway run:*)
---

Responde una sola pregunta: **¿esto le sirve a alguien?**

Argumentos recibidos: `$ARGUMENTS` (pueden venir vacíos, en cualquier orden).

- `prod` (o vacío si el usuario habló de producción) → la base de Railway.
- `local` o nada → la base del `.env` / Docker de la máquina.
- Un número → días de ventana. Por defecto 14.

## Qué correr

Base local:

```bash
cd backend && npx ts-node scripts/usage-report.ts <días>
```

Producción (en Railway la base solo se ve desde dentro, así que hay que pasar por el
servicio de Postgres para tener su URL pública):

```bash
cd backend && railway run --service Postgres npx ts-node scripts/usage-report.ts <días>
```

Si `railway` pide vincular el proyecto o iniciar sesión, no lo hagas tú: dile al usuario
que escriba `! railway login` o `! railway link` en el prompt y vuelva a lanzar `/uso`.

El script solo hace consultas de lectura y no imprime ningún dato personal.

## Cómo leer el resultado

Lo importante es la diferencia entre dos cosas que no son la misma:

- **Publicar** es entrar una vez y dejar un dato.
- **Volver** es ocupar un cupo, cerrar una alerta, mover un camión, entregar raciones,
  comprobar un sitio, encontrar a alguien. Eso es que la red sirvió.

Una base llena de publicaciones y sin señales de vuelta significa que la página se ve pero
no se usa; dilo así de claro. Si aparece la tabla de cargas masivas, avisa que esas filas
son una siembra y no cuentan como uso.

Después de correrlo, resume en tres o cuatro frases en español llano: si la están usando o
no, dónde está pasando, y qué es lo raro que ves. No repitas las tablas enteras.

Recuerda cerrar diciendo lo que **no** mide: cuánta gente entra a mirar, porque eso hoy no
se guarda en ninguna parte.
