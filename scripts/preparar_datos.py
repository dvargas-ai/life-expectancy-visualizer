#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
preparar_datos.py
=================
Limpieza y transformacion de la base "Life Expectancy (WHO)" y generacion
del archivo js/data.js que consume el visualizador.

Reproduce EXACTAMENTE los 6 pasos documentados en la seccion "Preparacion"
del visualizador. Correr desde la raiz del proyecto:

    python scripts/preparar_datos.py

Requisitos:
    pip install pandas numpy country_converter

Entradas:
    data/Life_Expectancy_Data.csv   (fuente original, OMS/ONU via Kaggle)

Salidas:
    data/clean.csv                  (dataset limpio, 2928 filas x 25 columnas)
    js/data.js                      (datos compactos para el navegador)

Nota metodologica: los cuartiles se calculan en el navegador (js/stats.js) con
el metodo del curso  Q_p = x_(p(n+1)) . Este script solo limpia y estructura;
no precalcula estadisticos, para que el visualizador sea la unica fuente de
verdad de los numeros mostrados.
"""

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd

# Rutas relativas a la raiz del proyecto (este archivo vive en scripts/)
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "Life_Expectancy_Data.csv"
OUT_CSV = ROOT / "data" / "clean.csv"
OUT_JS = ROOT / "js" / "data.js"

# Nombres de region en espaniol y su orden fijo en el visualizador.
# OJO: con tilde, tal cual los espera js/app.js (PAL.reg, tablas, etc.).
REGIONS = ["\u00c1frica", "Am\u00e9rica", "Asia", "Europa", "Ocean\u00eda"]
STATUS_IDX = {"Developed": 0, "Developing": 1}  # 0 = Desarrollado, 1 = En desarrollo
LE = "Life expectancy"  # nombre de la variable central ya normalizado


def nivel(v: float) -> str:
    """Variable ordinal creada: tramo de esperanza de vida."""
    if v < 60:
        return "Baja (<60)"
    if v < 70:
        return "Media (60\u201370)"     # 60-70 con guion largo, como en app.js
    if v < 80:
        return "Alta (70\u201380)"      # 70-80 con guion largo
    return "Muy alta (\u226580)"        # >= 80


def main() -> None:
    # ------------------------------------------------------------------
    # PASO 1 · Normalizar nombres de columnas
    # El CSV original trae espacios ocultos: 'Life expectancy ', ' BMI ', etc.
    # ------------------------------------------------------------------
    df = pd.read_csv(SRC)
    df.columns = [c.strip() for c in df.columns]
    n0 = len(df)

    # ------------------------------------------------------------------
    # PASO 2 · Eliminar registros sin la variable central
    # 10 microestados con una sola fila y sin esperanza de vida.
    # ------------------------------------------------------------------
    df = df.dropna(subset=[LE]).copy()
    print(f"[2] Sin esperanza de vida eliminados: {n0 - len(df)}  ->  "
          f"{len(df)} filas, {df['Country'].nunique()} paises")

    # ------------------------------------------------------------------
    # PASO 3 · Valores imposibles -> faltantes
    # Schooling == 0 es imposible (ningun pais tiene 0 anios de escolaridad).
    # ------------------------------------------------------------------
    ceros = int((df["Schooling"] == 0).sum())
    df.loc[df["Schooling"] == 0, "Schooling"] = np.nan
    print(f"[3] Schooling == 0 convertidos a NaN: {ceros}")

    # ------------------------------------------------------------------
    # PASO 4 · Variable descartada por calidad: IMC (BMI)
    # Rango [1.0, 87.3], imposible como IMC nacional. Solo se documenta;
    # no se usa en el visualizador (no la incluimos en data.js).
    # ------------------------------------------------------------------
    print(f"[4] BMI descartada (rango {df['BMI'].min()}-{df['BMI'].max()}, imposible)")

    # ------------------------------------------------------------------
    # PASO 5 · Variables creadas: Region (continente) y Nivel (ordinal)
    # ------------------------------------------------------------------
    import country_converter as coco
    cc = coco.CountryConverter()
    paises = sorted(df["Country"].unique())
    cont = cc.convert(names=paises, to="continent", not_found=None)
    es = {"Africa": "\u00c1frica", "America": "Am\u00e9rica", "Asia": "Asia",
          "Europe": "Europa", "Oceania": "Ocean\u00eda"}
    cmap = {p: es.get(c, c) for p, c in zip(paises, cont)}
    df["Region"] = df["Country"].map(cmap)
    df["Nivel"] = df[LE].apply(nivel)
    assert df["Region"].isna().sum() == 0, "hay paises sin region asignada"
    print("[5] Region y Nivel creadas. Paises por region:",
          df.drop_duplicates("Country")["Region"].value_counts().to_dict())

    # ------------------------------------------------------------------
    # PASO 6 · Chequeo de consistencia (documentado como limitacion)
    # Saltos interanuales grandes en paises desarrollados = errores de fuente.
    # Se CONSERVAN sin tocar; el visualizador usa medianas (robustas).
    # ------------------------------------------------------------------
    df = df.sort_values(["Country", "Year"])
    df["dLE"] = df.groupby("Country")[LE].diff()
    sus = df[(df["dLE"].abs() >= 3) & (df["Status"] == "Developed")]
    print(f"[6] Saltos sospechosos (>=3 anios, desarrollados): {len(sus)} (se conservan)")

    df.to_csv(OUT_CSV, index=False)
    print(f"    -> {OUT_CSV.relative_to(ROOT)} guardado ({df.shape[0]}x{df.shape[1]})")

    # ------------------------------------------------------------------
    # Generar js/data.js (estructura compacta: C = paises, ROWS = registros)
    # ------------------------------------------------------------------
    tab = df.drop_duplicates("Country")[["Country", "Region", "Status"]] \
            .sort_values("Country").reset_index(drop=True)
    cidx = {r.Country: i for i, r in tab.iterrows()}
    C = [[r.Country, REGIONS.index(r.Region), STATUS_IDX[r.Status]]
         for r in tab.itertuples()]
    ROWS = [[cidx[c], int(y), round(float(le), 1),
             (None if pd.isna(sc) else round(float(sc), 1))]
            for c, y, le, sc in zip(df["Country"], df["Year"], df[LE], df["Schooling"])]

    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("const REGIONS=" + json.dumps(REGIONS, ensure_ascii=False,
                                               separators=(",", ":")) + ";\n")
        f.write('const STATUS=["Desarrollado","En desarrollo"];\n')
        f.write("const C=" + json.dumps(C, ensure_ascii=False,
                                        separators=(",", ":")) + ";\n")
        f.write("const ROWS=" + json.dumps(ROWS, separators=(",", ":")) + ";\n")
    print(f"    -> {OUT_JS.relative_to(ROOT)} generado "
          f"({len(C)} paises, {len(ROWS)} registros)")


if __name__ == "__main__":
    main()
