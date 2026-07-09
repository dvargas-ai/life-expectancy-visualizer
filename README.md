# ¿Cuántos años vive el mundo?

Un visualizador interactivo para explorar la esperanza de vida al nacer de 183 países entre 2000 y 2015. Mueves un año, comparas grupos, pasas el cursor sobre cualquier punto y los datos van contando su historia: quién vive más, cuánto pesa el desarrollo y qué acompaña a una vida larga.

👉 **Míralo funcionando:** https://dvargas-ai.github.io/life-expectancy-visualizer/

![Estadística](https://img.shields.io/badge/Estad%C3%ADstica-descriptiva-4c9aff) ![Hecho con](https://img.shields.io/badge/Hecho%20con-HTML%20%C2%B7%20CSS%20%C2%B7%20JS-f9a03c) ![Datos](https://img.shields.io/badge/Datos-OMS%20%C2%B7%20ONU-brightgreen)

## Contenido

- [De qué va esto](#de-qué-va-esto)
- [El problema que quería resolver](#el-problema-que-quería-resolver)
- [Qué encontrarás dentro](#qué-encontrarás-dentro)
- [Cómo usarlo](#cómo-usarlo)
- [Los datos](#los-datos)
- [Métodos](#métodos)
- [Qué aprendí haciéndolo](#qué-aprendí-haciéndolo)
- [Cómo está armado](#cómo-está-armado)
- [Quiénes lo hicimos](#quiénes-lo-hicimos)

## De qué va esto

La esperanza de vida al nacer es uno de esos números que dicen muchísimo con muy poco: en una sola cifra resume mortalidad infantil, enfermedades, conflictos, acceso a salud y calidad de vida. Es el indicador que usan la OMS y la ONU para hablar de desarrollo humano.

Este proyecto toma una base real con esa información y la convierte en algo que se puede *explorar*, no solo leer. En lugar de entregar una tabla o un PDF con gráficos estáticos, quería que cualquiera pudiera meterse en los datos, cambiar el año, comparar regiones y sacar sus propias conclusiones. Y que se entienda igual si sabes estadística o si es la primera vez que ves un diagrama de caja.

Nació como la primera práctica de **Estadística I** (PAO I, 2026), pero lo dejé aquí porque me terminó gustando cómo quedó y creo que se sostiene solo.

## El problema que quería resolver

Los datos de salud casi siempre llegan en hojas de cálculo enormes que nadie tiene ganas de abrir. La información está ahí, pero no *se ve*. La idea era darle la vuelta a eso y responder tres preguntas de forma visual:

- **¿Cómo se reparte la esperanza de vida en el mundo?** ¿Casi todos viven parecido, o hay una cola de países rezagados que jala el promedio hacia abajo?
- **¿Cuánto pesa el nivel de desarrollo?** ¿Qué distancia hay entre los países desarrollados y los que están en desarrollo, y esa brecha se cierra con los años?
- **¿Qué acompaña a vivir más?** ¿Los países donde se estudia más también viven más, y qué tan fuerte es esa relación?

## Qué encontrarás dentro

Todo pasa en una sola página, y el corazón son siete gráficos, cada uno elegido según el tipo de variable que muestra:

- **Histograma** — cómo se distribuye la esperanza de vida en el año que elijas.
- **Diagrama de caja** — países desarrollados vs. en desarrollo, con los atípicos señalados por nombre.
- **Barras horizontales** — el ranking de los 10 de arriba y los 10 de abajo.
- **Dispersión con correlación** — años de escolaridad frente a esperanza de vida, con el coeficiente de Pearson recalculándose por año.
- **Barras apiladas al 100 %** — cómo se compone cada región según su nivel de vida.
- **Tabla resumen** — promedio y cuartiles por región.
- **Líneas** — la evolución de las medianas año por año, 2000–2015.

Además hay un contador de indicadores clave (mediana mundial, brecha entre grupos, correlación), interpretaciones escritas para cada gráfico, seis hallazgos con sus cifras y un pequeño anexo con las fórmulas por si quieres ver cómo se calcula cada cosa.

## Cómo usarlo

No hace falta instalar nada. Es un sitio estático: entras al enlace de arriba y ya está.

- Usa el **selector de año** para moverte por el tiempo, o dale a **▶** para ver la animación completa de 2000 a 2015.
- **Pasa el cursor** sobre cualquier barra, punto o caja para ver el detalle.
- **Arrastra** dentro de un gráfico para hacer zoom.

Si prefieres abrirlo en tu máquina, basta con descargar el repo y abrir `index.html` en el navegador. Los gráficos (Plotly) y las fórmulas (KaTeX) se cargan por internet, así que necesitas conexión la primera vez; si algún gráfico no aparece, casi siempre es eso.

## Los datos

Parten de *Life Expectancy (WHO)*, una base de libre acceso publicada en Kaggle que junta indicadores del Observatorio Mundial de la Salud (OMS) y datos socioeconómicos de la ONU. Cada fila es un país en un año concreto. En bruto son 2 938 filas, 22 columnas y 193 países.

Antes de graficar nada, hubo que limpiarlos y, sobre todo, desconfiar de ellos. Todo el proceso está hecho en Python (pandas / NumPy) y quedó documentado paso a paso:

1. Quité los espacios ocultos en los nombres de las columnas (venían cosas como `"Life expectancy "`).
2. Eliminé 10 microestados que no tenían el dato central de esperanza de vida (quedaron 183 países con serie completa).
3. Traté como faltantes los ceros imposibles de escolaridad (ningún país tiene 0 años promedio de estudio).
4. Descarté la columna de IMC: su rango `[1.0, 87.3]` era incompatible con la realidad.
5. Construí dos variables nuevas, **Región** (continente) y **Nivel** (tramos de esperanza de vida).
6. Audité los saltos raros de un año a otro y encontré errores en la propia fuente (Francia marcando 89 años en 2007, por ejemplo).

Ese último paso terminó siendo clave: en vez de "arreglar" los datos inventando valores, los dejé tal cual vienen y usé mediana y cuartiles para los resúmenes, que aguantan mucho mejor esos valores anómalos.

## Métodos

Todos los estadísticos se calculan en el propio navegador para que el cálculo sea transparente, y los contrasté uno por uno contra Python: 146 comprobaciones cruzadas, todas idénticas. Lo que hay detrás:

- **Cuartiles** por posición, con interpolación lineal.
- **Rango intercuartil** para medir la dispersión del 50 % central.
- **Cercas del diagrama de caja** para detectar valores atípicos.
- **Correlación de Pearson** entre escolaridad y esperanza de vida.
- **Regla de la raíz** para elegir el número de clases del histograma.

## Qué aprendí haciéndolo

Más de lo que esperaba, y no todo era estadística:

- **Limpiar datos es la mitad del trabajo (o más).** Los gráficos bonitos vienen al final; antes hay que pelearse con espacios invisibles, ceros que mienten y columnas que hay que tirar a la basura.
- **Desconfiar es parte del método.** Encontrar los errores de la propia OMS a punta de mirar saltos raros me enseñó que la estadística descriptiva no solo resume: también audita.
- **La media engaña cuando la distribución es asimétrica.** Aprendí a preferir la mediana casi por reflejo, y a explicar *por qué*.
- **Calcular las fórmulas a mano en JavaScript**, en vez de dejárselo a una librería, me obligó a entender de verdad cada medida en lugar de confiar en una caja negra.
- **Correlación no es causa**, y decirlo bien (sin exagerar ni quedarse corto) es más difícil de lo que parece.

## Cómo está armado

```
proyecto-estadistica/
├── index.html              # La página y todas sus secciones
├── css/
│   └── styles.css          # Estilos (la paleta vive en :root)
├── js/
│   ├── data.js             # Datos ya limpios, listos para graficar
│   ├── stats.js            # Las fórmulas estadísticas, escritas a mano
│   └── app.js              # Dibuja los gráficos y maneja la interacción
├── data/
│   ├── Life_Expectancy_Data.csv   # La base original
│   └── clean.csv           # La base ya limpia
└── scripts/
    └── preparar_datos.py   # El proceso de limpieza, reproducible
```

Hecho con HTML, CSS y JavaScript puro. Los gráficos usan [Plotly.js](https://plotly.com/javascript/) y las fórmulas se renderizan con [KaTeX](https://katex.org/); la preparación de datos es Python con pandas y NumPy.

## Quiénes lo hicimos

Proyecto en grupo para **Estadística I** (PAO I, 2026), con la profesora Katherine Loor Valeriano en ESPOL.

| Integrante | Correo |
| --- | --- |
| Damian Vargas | jacvarga@espol.edu.ec |
| Frank Piguabe | frapigua@espol.edu.ec |
| Jorge Enrique | jorenrey@espol.edu.ec |

Los datos son de *Life Expectancy (WHO)* en Kaggle, que a su vez recopila cifras de la OMS y la ONU. Se muestran tal como vienen de la fuente; donde detectamos inconsistencias, lo dejamos anotado en lugar de maquillarlas.
