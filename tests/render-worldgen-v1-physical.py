#!/usr/bin/env python3
"""Render the physical review atlas from real WorldGen audit snapshots."""

import argparse
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.collections import LineCollection
from matplotlib.colors import LinearSegmentedColormap, ListedColormap, TwoSlopeNorm
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Patch


PAPER = "#f5f1e7"
INK = "#1a3036"
SEA = "#203c56"
COAST = "#182e39"
DIVERGE = "#88dcea"
COLLIDE = "#e76743"
TRANSFORM = "#dfb2e8"
SIGNED = LinearSegmentedColormap.from_list("signed", [
    "#122943", "#23587e", "#37a0b6", "#c6ead6", "#bcb983", "#757a4c", "#a07d61", "#e8c7b5", "#faf6ed"
])
SIGNED_NORM = TwoSlopeNorm(vmin=-0.36, vcenter=0, vmax=0.36)
LAND = ["#16344d", "#9ce0bc", "#b6cc83", "#d4c791", "#a08d52", "#c080b0",
        "#53362e", "#3e818c", "#e85f59", "#9b6252", "#f9ebd6"]
LAND_NAMES = ["вода", "побережье", "низина", "равнина", "холмы", "плато",
              "горы", "впадина", "врезанная долина", "склон", "седловина"]
SEAFLOOR = ["#d9cfb0", "#52798a", "#70c7bb", "#3b87a4", "#275471", "#132d49", "#a6b3c5", "#d97855"]
SEA_NAMES = ["суша", "замкнутая вода", "шельф", "склон", "открытая чаша", "глубокая чаша", "хребет", "вулканический склон"]


class PhysicalAtlas:
    def __init__(self, path):
        self.snapshot = json.loads(path.read_text())
        self.seed = self.snapshot["seed"]
        diagnostics = self.snapshot["diagnostics"]
        bundle = diagnostics["physicalWorldDebugBundle"]
        self.fields = {item["payload"]["fieldId"]: item["payload"] for item in bundle["fieldSnapshots"]}
        self.geometry = {item["artifactId"][20:]: item["payload"] for item in bundle["intermediateOutputs"]
                         if item["artifactId"].startswith("foundation_geometry_")}
        self.graphs = {item["sourceLayerId"]: item["payload"] for item in bundle["graphSnapshots"]}
        self.topology = self.geometry.get("coastalAccessTopology", {})
        self.width = self.fields["finalRelativeElevationField"]["width"]
        self.height = self.fields["finalRelativeElevationField"]["height"]
        self.final = self.raster("finalRelativeElevationField")
        self.before = self.raster("preMarineRelativeElevationField")
        self.land = self.final > 0
        self.phase2 = self.snapshot.get("phase2") or diagnostics.get("rejectedPhase2Candidate")
        self.terrain_classes = self.fields["macroLandformField"]["valueEncoding"]

    def raster(self, field):
        return np.asarray(self.fields[field]["values"]).reshape(self.height, self.width)

    def base_axes(self, ax, name):
        ax.set_title(name, loc="left", color=INK, fontweight="semibold", fontsize=12)
        ax.set_xticks([])
        ax.set_yticks([])
        ax.set_xlim(-0.5, self.width - 0.5)
        ax.set_ylim(self.height - 0.5, -0.5)
        ax.set_facecolor(PAPER)
        for spine in ax.spines.values():
            spine.set_color("#82949a")

    def raster_panel(self, ax, name, data, **options):
        self.base_axes(ax, name)
        return ax.imshow(data, interpolation="nearest", **options)

    def boundaries(self, ax):
        self.raster_panel(ax, "Тектоника и вулканическая опора", self.raster("platePressureField"), cmap="cividis", vmin=0, vmax=0.8)
        marks = {"collision": COLLIDE, "divergence": DIVERGE, "transform": TRANSFORM}
        zone = self.geometry["plateBoundaryClassification"]["boundaryClassifications"]
        for boundary in zone:
            a, b = boundary["seedPoints"].values()
            x, y = (a["x"] + b["x"]) / 2, (a["y"] + b["y"]) / 2
            vector = boundary["boundaryVector"]
            dx, dy = -vector["y"] * 8, vector["x"] * 8
            ax.plot([x - dx, x + dx], [y - dy, y + dy], color=marks.get(boundary["boundaryType"], "#f2e8c2"),
                    linewidth=1.9, solid_capstyle="round")
        for plate in self.geometry["plateSeedDistribution"]["plateSeeds"]:
            point = plate["seedPoint"]
            ax.text(point["x"], point["y"], plate["plateId"][-2:], color=PAPER, ha="center", va="center", fontsize=6,
                    bbox={"facecolor": INK, "edgecolor": "none", "pad": 1})
        uplift = np.ma.masked_less(self.raster("offshoreHotspotUpliftField"), 0.006)
        ax.imshow(uplift, interpolation="nearest", cmap="hot", alpha=0.8, vmin=0, vmax=0.26)
        chain = self.geometry["seaLevelModel"].get("hotspotChain") or {}
        for point in self.geometry["hotspotVolcanicSeedHelper"]["hotspotSeeds"]:
            if point["hotspotSeedId"] == chain.get("hotspotSeedId"):
                p = point["seedPoint"]
                ax.scatter(p["x"], p["y"], c="white", marker="*", s=30)

    def drainage(self, ax):
        self.raster_panel(ax, "Сток с итогового рельефа", self.raster("macroSeafloorFormField"), cmap=ListedColormap(SEAFLOOR),
                          vmin=0, vmax=len(SEAFLOOR) - 1)
        drainage = self.geometry["finalDrainage"]
        cells = np.asarray(drainage["contributingCells"])
        receiver_index = {row["outletCellIndex"]: row["receiver"] for row in drainage["outlets"]}
        colors = {"ocean": "#297384", "inland_water": "#3388a8", "local_depression": "#bd7552"}
        line_segments = {color: [] for color in colors.values()}
        for cell, next_cell in enumerate(drainage["downstreamCellIndices"]):
            if next_cell < 0 or cells[cell] < drainage["reachMinimumContributingCells"]:
                continue
            color = colors[receiver_index[drainage["terminalLandCellIndices"][cell]]]
            line_segments[color].append([(cell % self.width, cell // self.width), (next_cell % self.width, next_cell // self.width)])
        for color, segments in line_segments.items():
            ax.add_collection(LineCollection(segments, colors=color, linewidths=0.65, alpha=0.9))
        closed = [row["outletCellIndex"] for row in drainage["outlets"]
                  if row["receiver"] == "local_depression" and row["contributingCells"] >= 64]
        ax.scatter([cell % self.width for cell in closed], [cell // self.width for cell in closed],
                   c="#8d4031", s=9, marker="o", linewidths=0)

    def navigation(self, ax):
        self.raster_panel(ax, "Порты, морские линии и проверенные проливы", self.final, cmap=SIGNED, norm=SIGNED_NORM)
        routes = self.geometry.get("macroRoutes", {}).get("candidateRoutes", [])
        graph = self.graphs.get("hybridConnectivityGraph", {})
        used = {edge for route in routes for edge in route["edgePathIds"]}
        for edge in graph.get("edges", []):
            if edge["edgeId"] not in used or "waterPathCellIndices" not in edge:
                continue
            cells = np.asarray(edge["waterPathCellIndices"])
            ax.plot(cells % self.width, cells // self.width, linewidth=0.75, color="#ffdf7a", alpha=0.64)
        for port in self.topology.get("ports", []):
            index = port["landCellIndex"]
            ax.scatter(index % self.width, index // self.width, s=16, c=PAPER, edgecolors=INK, linewidths=0.65)
        for passage in self.topology.get("islandPassages", []):
            index = passage["cellIndex"]
            ax.scatter(index % self.width, index // self.width, s=19, c="#f6a7ad", marker="D", edgecolors=INK, linewidths=0.6)

    def regional(self, ax, name, records, palette):
        grid = np.full(self.final.size, np.nan)
        for region in self.geometry["reliefRegionExtraction"]["reliefRegionBodies"]:
            value = records.get(region["reliefRegionId"])
            if value is not None:
                grid[np.asarray(region["cellIndices"], dtype=int)] = value
        return self.raster_panel(ax, name, np.where(self.land, grid.reshape(self.final.shape), np.nan),
                                 cmap=palette, vmin=0, vmax=1)

    def render(self):
        plt.rcParams.update({"font.family": "DejaVu Sans", "axes.labelcolor": INK})
        fig, axes = plt.subplots(4, 3, figsize=(17.2, 13.2), facecolor=PAPER)
        fig.subplots_adjust(left=0.04, right=0.96, top=0.87, bottom=0.16, wspace=0.15, hspace=0.36)
        ax = axes.ravel()
        fig.text(0.04, 0.957, f"Paths   /   Физический атлас   /   {self.seed}", color=INK, fontsize=26, weight="semibold")
        status = self.snapshot.get("error")
        if status is None and self.phase2 and "pressureFieldPackage" in self.phase2:
            status = "Phase 0–2 · экспорт прошёл"
        elif status:
            status = status.split(": ")[1] if ": " in status else status
        fig.text(0.04, 0.921, f"Ревизия {self.snapshot['revision'][:12]}   ·   {self.width} × {self.height}   ·   {status or 'проверка'}",
                 color=INK, fontsize=10)
        changes = np.count_nonzero((self.before > 0) != self.land, axis=1)
        row = int(np.argmax(changes)) if changes.any() else self.height // 2
        surface = self.raster_panel(ax[0], "Высоты и глубины после морской переработки", self.final, cmap=SIGNED, norm=SIGNED_NORM)
        ax[0].contour(self.final, levels=[-0.2, -0.1, 0, 0.1, 0.2], colors=COAST, alpha=0.54, linewidths=0.42)
        ax[0].axhline(row, linewidth=0.85, color="white", linestyle="--", alpha=0.86)
        ax[1].set_title("Разрез по пунктиру   ·   отметка относительно моря", loc="left", fontweight="semibold", fontsize=12, color=INK)
        x = np.arange(self.width)
        ax[1].fill_between(x, np.minimum(self.final[row], 0), 0, color="#a7ced1")
        ax[1].plot(x, self.before[row], color="#c35e48", linestyle="--", linewidth=1.15, label="до")
        ax[1].plot(x, self.final[row], color=INK, linewidth=1.14, label="после")
        ax[1].set(xlim=(0, self.width - 1), ylim=(-0.36, 0.36), facecolor=PAPER)
        ax[1].axhline(0, linewidth=0.5, color=SEA)
        ax[1].legend(loc="lower right", fontsize=7, frameon=False)
        self.boundaries(ax[2])
        self.raster_panel(ax[3], "Формы суши и положение склонов", self.raster("macroLandformField"),
                          cmap=ListedColormap(LAND[:len(self.terrain_classes)]), vmin=0, vmax=len(self.terrain_classes) - 1)
        self.raster_panel(ax[4], "Шельф, глубокие чаши и подводные хребты", self.raster("macroSeafloorFormField"),
                          cmap=ListedColormap(SEAFLOOR), vmin=0, vmax=len(SEAFLOOR) - 1)
        self.drainage(ax[5])
        warmth = self.raster("temperatureColdLoadField")
        self.raster_panel(ax[6], "Температурный индекс · широта и высота", warmth,
                          cmap="PuBu", vmin=0, vmax=1)
        ax[6].contour(warmth, levels=[0.12, 0.28, 0.46, 0.62, 0.76, 0.9], colors=INK,
                      alpha=0.35, linewidths=0.48)
        self.raster_panel(ax[7], "Влажность · перенос и рельеф", self.raster("wetnessField"), cmap="YlGnBu", vmin=0, vmax=1)
        wind = self.fields["prevailingWindField"]
        sample = np.s_[8::16, 8::16]
        y, x = np.indices(self.final.shape)
        ax[7].quiver(x[sample], y[sample], np.asarray(wind["xValues"]).reshape(self.final.shape)[sample],
                     -np.asarray(wind["yValues"]).reshape(self.final.shape)[sample],
                     angles="uv", scale=23, width=0.002, color=INK, alpha=0.36)
        self.raster_panel(ax[8], "Штормовая экспозиция", self.raster("stormCorridorField"), cmap="magma", vmin=0, vmax=1)
        self.navigation(ax[9])
        pressures, recovery = {}, {}
        if self.phase2:
            pressure = self.phase2["pressureFieldPackage"]["regionalProfiles"]
            pressures = {row["recordId"]: row["synthesizedSnapshot"]["survivabilityPressure"] for row in pressure
                         if row["recordType"] == "reliefRegions"}
            tempo = self.phase2["environmentalRhythmPackage"]["domains"]["recovery"]["recoveryTempo"]["perReliefScores"]
            recovery = {row["recordId"]: row["value"] for row in tempo}
        self.regional(ax[10], "Давление на выживание · Phase 2", pressures, "YlOrRd")
        self.regional(ax[11], "Темп восстановления · Phase 2", recovery, "YlGn")
        if not self.phase2:
            for panel in ax[10:12]:
                panel.text(0.5, 0.5, "Phase 2 недоступна", transform=panel.transAxes, ha="center", va="center")
        elif self.snapshot.get("error"):
            for panel in ax[10:12]:
                panel.text(0.025, 0.04, "отклонённый кандидат", color=INK, fontsize=8, transform=panel.transAxes)
        cax = fig.add_axes([0.04, 0.127, 0.26, 0.012])
        bar = fig.colorbar(surface, cax=cax, orientation="horizontal", ticks=[-0.36, -0.18, 0, 0.18, 0.36])
        bar.ax.tick_params(labelsize=7)
        bar.set_label("Нормированный сдвиг высоты · ноль = море", fontsize=8)
        for i, panel in enumerate(ax[10:12]):
            image = panel.images[-1]
            scale = fig.add_axes([0.37 + i * 0.31, 0.127, 0.26, 0.012])
            fig.colorbar(image, cax=scale, orientation="horizontal", ticks=[0, 0.25, 0.5, 0.75, 1]).ax.tick_params(labelsize=7)
        land_legend = [Patch(facecolor=color, label=name) for color, name in zip(LAND[1:len(self.terrain_classes)], LAND_NAMES[1:])]
        sea_legend = [Patch(facecolor=color, label=name) for color, name in zip(SEAFLOOR[1:], SEA_NAMES[1:])]
        fig.legend(handles=land_legend, loc="lower left", bbox_to_anchor=(0.038, 0.064), ncol=10, frameon=False, fontsize=7)
        fig.legend(handles=sea_legend, loc="lower left", bbox_to_anchor=(0.038, 0.04), ncol=7, frameon=False, fontsize=7)
        fig.text(0.044, 0.022, "Тектонические метки · оранжевый — сближение, голубой — расхождение, лиловый — сдвиг; звезда — источник поднятия. "
                 "Стрелки · ветер. Рыжий сток оканчивается во впадинах.", color=INK, fontsize=7.3)
        return fig


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("snapshots", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("seeds", nargs="+", type=int)
    arguments = parser.parse_args()
    arguments.output.mkdir(parents=True, exist_ok=True)
    with PdfPages(arguments.output / "physical-atlas.pdf", metadata={"Title": "Paths · Phase 0–2 · Физический атлас"}) as pdf:
        for seed in arguments.seeds:
            print("Rendering", seed, flush=True)
            atlas = PhysicalAtlas(arguments.snapshots / f"seed-{seed}.json")
            figure = atlas.render()
            figure.savefig(arguments.output / f"terrain-{seed}.png", dpi=130)
            pdf.savefig(figure, dpi=150)
            plt.close(figure)


if __name__ == "__main__":
    main()
