# ¿Cuántos años vive el mundo? · Visualizador de esperanza de vida (2000–2015)

> Visualizador **interactivo** de la esperanza de vida al nacer de **183 países**
> entre **2000 y 2015**, con datos de la **OMS (GHO) y la ONU**. Práctica 1 de
> **ESTG1036 · Estadística I · ESPOL · I Semestre 2026**.

Un recorrido guiado que convierte una base de datos real en una herramienta de
exploración: mueves el año, comparas grupos, pasas el cursor sobre cualquier
elemento y descubres qué cuenta la estadística descriptiva —incluso sobre la
**calidad de los propios datos**—. Está pensado para que **cualquier persona**,
con o sin formación en estadística, entienda los hallazgos de un vistazo.

🔗 **Sitio en vivo:** _pendiente de publicar en GitHub Pages_ (ver [Publicar](#cómo-publicarlo-en-github-pages))

---

## Tabla de contenido

- [Qué incluye](#qué-incluye)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Cómo verlo en local](#cómo-verlo-en-local)
- [Cómo publicarlo en GitHub Pages](#cómo-publicarlo-en-github-pages)
- [Datos y preparación](#datos-y-preparación)
- [Métodos (Unidad 1)](#métodos-unidad-1)
- [Dónde cambiar cosas](#dónde-cambiar-cosas)
- [Integrantes](#integrantes)
- [Créditos y fuente](#créditos-y-fuente)

---

## Qué incluye

El visualizador cubre los **siete requisitos** de la práctica en una sola página:

| # | Requisito | Cómo se resuelve |
|---|-----------|------------------|
| 1 | Presentación del problema | Tres preguntas guía sobre distribución, brecha y longevidad |
| 2 | Descripción de la base | Ficha de la base + tabla de variables clasificadas según la Unidad 1 |
| 3 | Preparación de los datos | 6 pasos de limpieza documentados y **reproducibles** en Python |
| 4 | Visualizaciones | **Siete gráficos** elegidos según el tipo de variable |
| 5 | Interactividad | Selector de año, animación ▶ 2000→2015, hover, zoom y toggles |
| 6 | Interpretación | Seis hallazgos con cifras (incluye un vistazo a Ecuador 🇪🇨) |
| 7 | Conclusiones | Tres conclusiones + una lección de método, con anexo de fórmulas |

**Las siete visualizaciones** (cada una según el tipo de variable):

1. **Histograma** — distribución de la esperanza de vida (`k = ⌈√n⌉` clases).
2. **Diagrama de caja** — desarrollados vs. en desarrollo, con atípicos nombrados.
3. **Barras horizontales** — ranking Top 10 / Bottom 10 por país.
4. **Dispersión + correlación** — escolaridad × esperanza de vida (`r` de Pearson).
5. **Barras apiladas 100 %** — composición por región y nivel.
6. **Tabla resumen** — promedio y cuartiles por región.
7. **Líneas** — evolución de las medianas anuales 2000–2015.

Es un **sitio estático** (HTML + CSS + JavaScript). No necesita servidor ni
compilación: se abre directamente en el navegador.

---

## Estructura del proyecto

```
proyecto-estadistica/
├── index.html                 Página principal (estructura y secciones)
├── css/
│   └── styles.css             Todos los estilos (paleta oscura en :root)
├── js/
│   ├── data.js                Datos ya limpios (generados por el script de Python)
│   ├── stats.js               Funciones estadísticas (métodos de la Unidad 1)
│   └── app.js                 Render de gráficos e interactividad (Plotly)
├── data/
│   ├── Life_Expectancy_Data.csv   Base original (fuente)
│   └── clean.csv                  Base limpia (salida del script)
├── scripts/
│   └── preparar_datos.py      Limpieza + generación de js/data.js (reproducible)
└── README.md
```

**Librerías externas** (se cargan por CDN, requieren internet):
[Plotly.js 2.27](https://plotly.com/javascript/) para los gráficos y
[KaTeX 0.16.9](https://katex.org/) para las fórmulas.

---

## Cómo verlo en local

Abrir `index.html` con doble clic (o arrastrarlo al navegador). Con conexión a
internet, Plotly y KaTeX cargan solos y todo funciona.

> 💡 Si algún gráfico no aparece, casi siempre es falta de conexión (los CDN no
> cargaron). Recarga con internet activo.

---

## Cómo publicarlo en GitHub Pages

1. Subir **todo el contenido de esta carpeta** al repositorio (que `index.html`
   quede en la **raíz**). El archivo `.nojekyll` ya está incluido para evitar el
   procesamiento de Jekyll.
2. En el repo: **Settings → Pages**.
3. En *Source* elegir **Deploy from a branch**, rama **main**, carpeta **/ (root)**
   y **Save**.
4. Esperar ~1 minuto. El enlace queda como:
   `https://<tu-usuario>.github.io/proyecto-estadistica/`

Ese enlace es el que se entrega en Canvas.

---

## Datos y preparación

Fuente: **Life Expectancy (WHO)** (Kaggle), que compila indicadores de la
OMS y la ONU. Base original: **2 938 filas × 22 variables, 193 países**.

El script `scripts/preparar_datos.py` reproduce los 6 pasos de limpieza
documentados en el visualizador:

1. **Normalizar** nombres de columnas (quitar espacios ocultos).
2. **Eliminar** los 10 registros sin esperanza de vida (microestados).
3. Tratar `Schooling = 0` como **dato faltante** (imposible en la realidad).
4. **Descartar** `BMI` por su rango imposible `[1.0, 87.3]`.
5. **Crear** las variables `Región` (continente) y `Nivel` (ordinal, 4 tramos).
6. **Auditar** los saltos interanuales y documentarlos como limitación.

Resultado: **2 928 filas, 183 países** con serie completa 2000–2015. Para
regenerar los datos:

```bash
pip install pandas numpy country_converter
python scripts/preparar_datos.py
```

Esto vuelve a escribir `data/clean.csv` y `js/data.js`.

> ⚠️ Las anomalías de la fuente (valores inflados en algunos países desarrollados)
> se **conservan sin alterar** y se documentan como limitación; por eso los
> resúmenes usan **mediana y cuartiles**, que son robustos frente a esos errores.

---

## Métodos (Unidad 1)

Los estadísticos se calculan **en el navegador** (`js/stats.js`) con las fórmulas
del curso, para que el cálculo sea transparente y reproducible:

- Cuartiles por posición `Q_p = x_(p(n+1))` con interpolación lineal.
- Rango intercuartil `RI = Q3 − Q1`.
- Cercas del diagrama de caja `LI = máx(x₍₁₎, Q1 − 1.5·RI)` y `LS = mín(x₍ₙ₎, Q3 + 1.5·RI)`.
- Coeficiente de correlación de Pearson `r`.
- Regla del histograma `k = ⌈√n⌉`.

Cada resultado fue verificado contra Python (pandas/NumPy):
**146 comprobaciones cruzadas idénticas**.

---

## Dónde cambiar cosas

- **Colores / apariencia:** solo las variables de `:root` al inicio de
  `css/styles.css` (fondo, acentos teal/ámbar/rosa, colores por región).
- **Nombres de integrantes:** al final de `index.html`, en el `<footer>`.
- **Textos, hallazgos, conclusiones:** directamente en `index.html`.
- **Gráficos o interacción:** en `js/app.js` (cada visualización tiene su
  propia función `render...`).
- **Datos:** no editar `js/data.js` a mano; volver a correr
  `scripts/preparar_datos.py`.

---

## Integrantes

Proyecto grupal de **ESTG1036 · Estadística I**. Grupo:

| # | Nombre | Correo | Rol / aporte |
|---|--------|--------|--------------|
| 1 | Damian Vargas | jacvarga@espol.edu.ec | _por definir_ |
| 2 | Frank Piguabe | _por completar_ | _por definir_ |
| 3 | _por completar_ | _por completar_ | _por definir_ |
| 4 | _por completar_ | _por completar_ | _por definir_ |

> _Grupo en formación — se irán completando los integrantes restantes._

**Docente:** Profesora Katherine Loor Valeriano · ESPOL · I Semestre 2026.

---

## Créditos y fuente

- **Datos:** [Life Expectancy (WHO)](https://www.kaggle.com/datasets/kumarajarshi/life-expectancy-who)
  — Kaggle; compila OMS · GHO y ONU. 2 938 registros originales, 183 países
  analizados, período 2000–2015.
- **Construcción:** HTML + CSS + JavaScript con [Plotly.js](https://plotly.com/javascript/);
  fórmulas con [KaTeX](https://katex.org/); preparación y verificación de
  cálculos en Python (pandas / NumPy).

Los valores se muestran tal cual provienen de la fuente; las inconsistencias
detectadas (paso 6 de la preparación) se conservan y se señalan como limitación.
