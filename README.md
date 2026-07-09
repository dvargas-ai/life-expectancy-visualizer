# How long does the world live?

An interactive visualizer for exploring life expectancy at birth across 183 countries between 2000 and 2015. Move through the years, compare groups, hover over any point, and the data starts telling its story: who lives longer, how much development weighs in, and what tends to go hand in hand with a long life.

👉 See it live: https://dvargas-ai.github.io/life-expectancy-visualizer/

![Statistics](https://img.shields.io/badge/Statistics-descriptive-4c9aff)
![Built with](https://img.shields.io/badge/Built%20with-HTML%20%C2%B7%20CSS%20%C2%B7%20JS-f9a03c)
![Data](https://img.shields.io/badge/Data-WHO%20%C2%B7%20UN-brightgreen)

## Contents

- [What this is](#what-this-is)
- [The problem I wanted to solve](#the-problem-i-wanted-to-solve)
- [What's inside](#whats-inside)
- [How to use it](#how-to-use-it)
- [The data](#the-data)
- [Methods](#methods)
- [What I learned building it](#what-i-learned-building-it)
- [How it's built](#how-its-built)
- [Who made it](#who-made-it)

## What this is

Life expectancy at birth is one of those numbers that says a lot with very little. A single figure wraps up child mortality, disease, conflict, access to healthcare, and overall quality of life. It's the indicator the WHO and the UN reach for when they talk about human development.

This project takes a real dataset carrying that information and turns it into something you can explore, not just read. Instead of handing over a table or a PDF full of static charts, I wanted anyone to be able to dig into the numbers, change the year, compare regions, and reach their own conclusions, whether you know statistics or you're seeing a box plot for the first time.

It started as the first assignment for Statistics I (PAO I, 2026), but I kept it here because I ended up liking how it turned out and I think it holds up on its own.

## The problem I wanted to solve

Health data almost always arrives as huge spreadsheets nobody feels like opening. The information is there, but you can't see it. The idea was to flip that around and answer three questions visually:
1. How is life expectancy spread across the world? Does almost everyone live to a similar age, or is there a tail of countries dragging the average down?
2. How much does development level matter? How wide is the gap between developed and developing countries, and does it narrow over the years?
3. What goes along with living longer? Do countries where people study more also live longer, and how strong is that link?

## What's inside

Everything happens on a single page, and the heart of it is seven charts, each one picked to fit the kind of variable it shows:

- Histogram: how life expectancy is distributed in the year you pick.
- Box plot: developed vs. developing countries, with outliers labeled by name.
- Horizontal bars: the ranking of the top 10 and bottom 10.
- Scatter with correlation: years of schooling against life expectancy, with Pearson's coefficient recalculated per year.
- 100% stacked bars: how each region breaks down by living standard.
- Summary table: mean and quartiles by region.
- Line chart: how the medians evolve year by year, 2000 to 2015.

There's also a counter of key indicators (world median, gap between groups, correlation), a written interpretation for each chart, six findings with their figures, and a short appendix with the formulas in case you want to see how each measure is calculated.

## How to use it

Nothing to install. It's a static site: open the link above and you're set.

- Use the year selector to move through time, or hit ▶ to watch the full 2000 to 2015 animation.
- Hover over any bar, point, or box to see the detail.
- Drag inside a chart to zoom.

If you'd rather run it locally, download the repo and open `index.html` in your browser. The charts (Plotly) and formulas (KaTeX) load over the internet, so you'll need a connection the first time. If a chart doesn't show up, that's almost always why.

## The data

It comes from Life Expectancy (WHO), an open dataset published on Kaggle that combines indicators from the Global Health Observatory (WHO) and socioeconomic data from the UN. Each row is one country in one year. Raw, it's 2,938 rows, 22 columns, and 193 countries.

Before plotting anything, the data had to be cleaned and, above all, questioned. The whole process runs in Python (pandas / NumPy) and is documented step by step:

- Stripped the hidden whitespace from column names (things like `"Life expectancy "` were sneaking in).
- Dropped 10 microstates that were missing the core life-expectancy value (leaving 183 countries with a complete series).
- Treated the impossible schooling zeros as missing (no country averages 0 years of education).
- Threw out the BMI column: its `[1.0, 87.3]` range didn't match reality.
- Built two new variables, Region (continent) and Level (life-expectancy bands).
- Audited the odd year-over-year jumps and found errors in the source itself (France showing 89 years in 2007, for instance).

That last step turned out to be the important one. Rather than "fixing" the data by inventing values, I left it as it comes and used the median and quartiles for the summaries, which hold up far better against those anomalies.

## Methods

Every statistic is computed in the browser itself so the calculation stays transparent, and I checked each one against Python: 146 cross-checks, all identical. What's behind it:

- Quartiles by position, with linear interpolation.
- Interquartile range to measure the spread of the middle 50%.
- Box-plot fences to flag outliers.
- Pearson correlation between schooling and life expectancy.
- Square-root rule to choose the number of histogram bins.

## What I learned building it

More than I expected, and not all of it was statistics:

- Cleaning data is half the work, or more. The nice charts come at the end; before that you're wrestling with invisible whitespace, zeros that lie, and columns you have to throw away.
- Questioning the data is part of the method. Catching the WHO's own errors just by staring at odd jumps taught me that descriptive statistics doesn't only summarize, it also audits.
- The mean misleads when the distribution is skewed. I learned to reach for the median almost by reflex, and to explain why.
- Writing the formulas by hand in JavaScript, instead of leaving them to a library, forced me to actually understand each measure rather than trusting a black box.
- Correlation isn't causation, and saying that well, without overstating or underselling it, is harder than it looks.

## How it's built

```
proyecto-estadistica/
├── index.html                     # The page and all its sections
├── css/
│   └── styles.css                 # Styles (the palette lives in :root)
├── js/
│   ├── data.js                    # Clean data, ready to plot
│   ├── stats.js                   # The statistical formulas, written by hand
│   └── app.js                     # Draws the charts and handles interaction
├── data/
│   ├── Life_Expectancy_Data.csv   # The original dataset
│   └── clean.csv                  # The cleaned dataset
└── scripts/
    └── preparar_datos.py          # The cleaning process, reproducible
```

Built with plain HTML, CSS, and JavaScript. The charts use [Plotly.js](https://plotly.com/javascript/) and the formulas render with [KaTeX](https://katex.org/); the data prep is Python with pandas and NumPy.

## Who made it

Group project for Statistics I (PAO I, 2026), with professor Katherine Loor Valeriano at ESPOL.

| Member | Email |
| --- | --- |
| Damian Vargas | jacvarga@espol.edu.ec |
| Frank Piguabe | frapigua@espol.edu.ec |
| Jorge Enrique | jorenrey@espol.edu.ec |

The data comes from Life Expectancy (WHO) on Kaggle, which in turn pulls figures from the WHO and the UN. It's shown as it comes from the source; where we found inconsistencies, we noted them instead of papering over them.
