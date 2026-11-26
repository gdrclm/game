#!/usr/bin/env python3
"""Render Phase 1 regional physical geography from foundation snapshots."""

import argparse
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.colors import LinearSegmentedColormap, ListedColormap, TwoSlopeNorm
from matplotlib.patches import Patch


PAPER = "#f5f1e7"
INK = "#1a3036"
SEA = "#244359"
COLORS = ["#17394e", "#ead290", "#e48b64", "#aa9fd0", "#7ac1a9", "#bad29c", "#dca8ce"]
ORIGINS = ["inherited", "volcanic_satellite", "fault_uplift", "erosional_fragment", "shelf_remnant", "fault_fragment"]
ORIGIN_LABELS = ["Унаследованное тело", "Вулканический спутник", "Поднятый блок", "Эрозионный фрагмент", "Остаток шельфа", "Разломный фрагмент"]
SIGNED = LinearSegmentedColormap.from_list("regional", ["#152b4e", "#4486a3", "#d1e7d2", "#a3a76a", "#765340", "#f1ddbe"])
NORM = TwoSlopeNorm(vmin=-0.16, vcenter=0, vmax=0.24)


def map_axes(ax, title, bounds):
    ax.set_title(title, loc="left", color=INK, fontweight="semibold", fontsize=12)
    ax.set(xlim=(bounds[0], bounds[1]), ylim=(bounds[2], bounds[3]))
    ax.tick_params(axis="both", labelsize=7, colors=INK)


def shortest_connection_tree(islands, links):
    """Show a spanning subset of the measured water links, preserving actual paths."""
    parent = {row["islandId"]: row["islandId"] for row in islands}

    def root(island_id):
        while parent[island_id] != island_id:
            parent[island_id] = parent[parent[island_id]]
            island_id = parent[island_id]
        return island_id

    for link in sorted(links, key=lambda row: row["distanceMacroCellUnits"]):
        left, right = root(link["fromIslandId"]), root(link["toIslandId"])
        if left != right:
            parent[right] = left
            yield link


def render(snapshot):
    diagnostics = snapshot["diagnostics"]["physicalWorldDebugBundle"]
    regional = next(row["payload"] for row in diagnostics["intermediateOutputs"]
                    if row["artifactId"] == "foundation_geometry_regionalArchipelagoSurface")
    grid = regional["grid"]
    width, height, scale = grid["width"], grid["height"], grid["subdivision"]
    x0, y0 = grid["originX"], grid["originY"]
    east, south = x0 + (width - 1) / scale, y0 + (height - 1) / scale
    bounds = [x0, east, south, y0]
    inherited = np.asarray(regional["inheritedElevation"]).reshape(height, width)
    surface = np.asarray(regional["signedRelativeElevation"]).reshape(height, width)
    selected_row = int(np.argmax(np.count_nonzero((inherited > 0) != (surface > 0), axis=1)))
    position = y0 + selected_row / scale
    xcoords = np.linspace(x0, east, width)
    islands = regional["islandRecords"]

    fig, axes = plt.subplots(3, 2, figsize=(14.7, 13.2), facecolor=PAPER)
    fig.subplots_adjust(left=0.068, right=0.948, top=0.86, bottom=0.112, wspace=0.13, hspace=0.28)
    ax = axes.ravel()
    fig.text(0.068, 0.955, f"Paths  /  Региональный архипелаг  /  {snapshot['seed']}",
             fontsize=22, color=INK, fontweight="semibold")
    fig.text(0.069, 0.923, f"Ревизия {snapshot['revision'][:12]}  ·  {regional['archipelagoId']}  ·  "
             f"{width} × {height}  ·  {scale} отсчётов на макроклетку  ·  {regional['sourceHotspotSeedId']}", fontsize=9, color=INK)
    metrics = "  ·  ".join(f'{item["minAreaMacroCellUnits"]:g} → {item["openWaterLandfallCount"]}'
                          for item in regional["summary"]["areaSensitivity"])
    fig.text(0.069, 0.895, f'Суша с выходом к морю по минимальной площади макроклетки   {metrics}  ·  '
             f'Сеть   {regional["summary"]["largestWaterConnectedComponent"]} островов в крупнейшей компоненте',
             fontsize=9, color=INK)

    for panel, title, values in [(ax[0], "Унаследованное дно и крупные острова", inherited),
                                 (ax[1], "Итоговый рельеф и затопленные промежутки", surface)]:
        map_axes(panel, title, bounds)
        color = panel.imshow(values, extent=bounds, cmap=SIGNED, norm=NORM, interpolation="nearest")
        panel.contour(xcoords, np.linspace(y0, south, height), values,
                      levels=[-0.08, -0.02, 0, 0.05, 0.15], colors=INK, linewidths=0.34, alpha=0.46)
        panel.axhline(position, color="white", linewidth=0.8, linestyle="--")
    mechanisms = np.asarray(regional["verticalChangeMechanism"]).reshape(height, width)
    restored = (mechanisms == 4) & (inherited <= 0)
    if np.any(restored):
        rows, columns = np.where(restored)
        ax[1].scatter(x0 + columns / scale, y0 + rows / scale, marker="+", s=30,
                      color="#953e74", linewidths=0.95, label="Сохранённая глубина пролива")
        ax[1].legend(loc="lower left", fontsize=7, facecolor=PAPER)

    origin = np.zeros(height * width, dtype=np.uint8)
    for island in islands:
        code = ORIGINS.index(island["physicalOrigin"]["mechanism"]) + 1
        for cell, length in island["landRuns"]:
            origin[cell:cell + length] = code
    map_axes(ax[2], "Носители физического происхождения", bounds)
    ax[2].imshow(origin.reshape(height, width), extent=bounds, cmap=ListedColormap(COLORS), vmin=0, vmax=len(COLORS) - 1,
                 interpolation="nearest")
    vents = regional["vents"]
    ax[2].scatter([row["x"] for row in vents], [row["y"] for row in vents], c="#fff0ba", s=3, alpha=0.46,
                  linewidths=0, label="Центр питания")
    witness = next((island for island in islands if "restoredSeparationPath" in island["physicalOrigin"]), None)
    ax[2].legend(loc="lower left" if witness else "lower right", fontsize=7, facecolor=PAPER)
    if witness:
        path = np.asarray(witness["physicalOrigin"]["restoredSeparationPath"])
        path_x = x0 + (path % width) / scale
        path_y = y0 + (path // width) / scale
        inset = ax[2].inset_axes([0.58, 0.08, 0.41, 0.37])
        inset.imshow(surface > 0, extent=bounds, cmap=ListedColormap(["#6cabc4", "#e6d09a"]),
                     vmin=0, vmax=1, interpolation="nearest")
        inset.plot(path_x, path_y, color="#953e74", linewidth=1.0, marker=".", markersize=3)
        inset.set(xlim=(min(path_x)-0.65, max(path_x)+0.65), ylim=(max(path_y)+0.65, min(path_y)-0.65),
                  xticks=[], yticks=[], title="Бывшая перемычка")
        inset.title.set_fontsize(7)
        inset.title.set_color(PAPER)
        ax[2].scatter(path_x[0], path_y[0], marker="+", s=22, color="#dca8ce", linewidths=1.0)

    map_axes(ax[3], "Мелководье и подходы к берегу", bounds)
    depth = np.where(surface <= 0, -surface, np.nan)
    depthmap = ax[3].imshow(depth, extent=bounds, cmap="GnBu", vmin=0, vmax=0.13, interpolation="nearest")
    ax[3].set_facecolor("#bbac82")
    for port in regional["waterNetwork"]["landfalls"]:
        water = port["waterCell"]
        ax[3].scatter(x0 + (water % width) / scale, y0 + (water // width) / scale, color="#c14f4b",
                      s=8, linewidths=0)

    map_axes(ax[4], "Водные связи между измеренными берегами", bounds)
    ax[4].imshow(surface, extent=bounds, cmap=SIGNED, norm=NORM, interpolation="nearest")
    for link in shortest_connection_tree(islands, regional["waterNetwork"]["links"]):
        cells = np.asarray(link["waterPathCellIndices"])
        ax[4].plot(x0 + (cells % width) / scale, y0 + (cells // width) / scale,
                   linewidth=0.7, color="#fbec91", alpha=0.92)
    ax[5].set_title("Разрез по пунктиру, общий уровень моря", fontweight="semibold", loc="left", fontsize=12, color=INK)
    ax[5].plot(xcoords, inherited[selected_row], "--", color="#bd6d56", linewidth=1.2, label="Унаследовано")
    ax[5].plot(xcoords, surface[selected_row], color=INK, linewidth=1.0, label="После уточнения")
    ax[5].fill_between(xcoords, np.minimum(surface[selected_row], 0), 0, color="#abd2d3")
    ax[5].axhline(0, color=SEA, linewidth=0.6)
    section = np.concatenate([inherited[selected_row], surface[selected_row]])
    ax[5].set(xlim=(x0, east), ylim=(min(-0.16, np.min(section) - 0.005), max(0.24, np.max(section) + 0.005)),
              facecolor=PAPER)
    ax[5].tick_params(labelsize=7)
    ax[5].legend(loc="lower right", fontsize=7, frameon=False)

    for img, pos, label in [(color, 0.07, "Высота относительно уровня моря"), (depthmap, 0.55, "Нормированная глубина подхода")]:
        cax = fig.add_axes([pos, 0.077, 0.37, 0.012])
        bar = fig.colorbar(img, cax=cax, orientation="horizontal", extend="both")
        bar.set_label(label, fontsize=8)
        bar.ax.tick_params(labelsize=7)
    fig.legend(handles=[Patch(facecolor=c, label=l) for c, l in zip(COLORS[1:], ORIGIN_LABELS)],
               loc="lower left", bbox_to_anchor=(0.064, 0.026), ncol=6, frameon=False, fontsize=8)
    fig.text(0.068, 0.018, "Оси измеряются в макроклетках. Красные точки показывают возможные выходы к открытому морю.",
             color=INK, fontsize=8)
    return fig


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("snapshots", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("seeds", nargs="+", type=int)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    with PdfPages(args.output / "regional-archipelago-atlas.pdf", metadata={"Title": "Paths · Физика архипелага"}) as pdf:
        for seed in args.seeds:
            snapshot = json.loads((args.snapshots / f"seed-{seed}.json").read_text())
            fig = render(snapshot)
            fig.savefig(args.output / f"archipelago-{seed}.png", dpi=140)
            pdf.savefig(fig, dpi=150)
            plt.close(fig)


if __name__ == "__main__":
    main()
