#!/usr/bin/env python3
"""Render the Phase 0–2 author atlas from audit --snapshots exports."""

import argparse
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import LinearSegmentedColormap, ListedColormap
from matplotlib.lines import Line2D

PAPER = "#f6f3ea"
INK = "#172f3a"
MUTED = "#4b6269"
WATER = "#183d51"
LAND = "#dedaca"
EDGE = "#6e8586"
ROUTE = "#ffca66"
ISLAND = "#83d3c0"
LOCK = "#f596aa"

RELIEF = LinearSegmentedColormap.from_list("terrain", ["#b5c39a", "#82986d", "#a79570", "#e0c5a4", "#f6efe0"])
STORM = LinearSegmentedColormap.from_list("storm", ["#d5e9df", "#76baba", "#337b92", "#332953", "#681d4f"])
BURDEN = LinearSegmentedColormap.from_list("burden", ["#f7e7af", "#e6b35b", "#c77a42", "#a44f42", "#641d37"])
RECOVERY = LinearSegmentedColormap.from_list("recovery", ["#ede8cf", "#a9c9a6", "#57a392", "#247367", "#164340"])
BASIN_COLORS = ListedColormap(["#9fc5a5", "#cfb18f", "#acb9d5", "#c8b3cf", "#e2ce86", "#7ab9bd", "#8ea373", "#d6978e"])


class Atlas:
    def __init__(self, snapshot):
        self.snapshot = snapshot
        self.geo = snapshot["phase1"]["macroGeographyPackage"]
        self.phase2 = snapshot["phase2"]
        debug = snapshot["diagnostics"]["physicalWorldDebugBundle"]
        self.fields = {entry["payload"]["fieldId"]: entry["payload"] for entry in debug["fieldSnapshots"]}
        self.geometry = {entry["artifactId"].removeprefix("foundation_geometry_"): entry["payload"]
                         for entry in debug["intermediateOutputs"]
                         if entry["artifactId"].startswith("foundation_geometry_")}
        self.graph = next(entry["payload"] for entry in debug["graphSnapshots"]
                          if entry["sourceLayerId"] == "hybridConnectivityGraph")
        mask = self.fields["coastJaggednessControlledLandWaterMaskField"]
        self.width, self.height = mask["width"], mask["height"]
        self.land = np.asarray(mask["values"]).reshape(self.height, self.width) >= mask["threshold"]
        self.topology = self.geometry["coastalAccessTopology"]

    def raster(self, field):
        return np.asarray(self.fields[field]["values"]).reshape(self.height, self.width)

    def record_grid(self, regions, id_key, records):
        values = np.full(self.width * self.height, np.nan)
        for region in regions:
            value = records.get(region[id_key])
            if value is not None:
                values[np.asarray(region["cellIndices"], dtype=int)] = value
        return np.where(self.land, values.reshape(self.height, self.width), np.nan)

    def base_map(self, ax, title):
        ax.set_title(title, loc="left", fontweight="bold", fontsize=14, color=INK, pad=10)
        ax.imshow(self.land, cmap=ListedColormap([WATER, LAND]), interpolation="nearest", vmin=0, vmax=1)
        ax.set_xlim(-0.5, self.width - 0.5)
        ax.set_ylim(self.height - 0.5, -0.5)
        ax.set_xticks([])
        ax.set_yticks([])
        for spine in ax.spines.values():
            spine.set_color("#a7ada3")

    def plot_cells(self, ax, indices, *args, **kwargs):
        indices = np.asarray(indices)
        return ax.plot(indices % self.width, indices // self.width, *args, **kwargs)

    def overlay(self, ax, values, cmap, maximum=1):
        return ax.imshow(np.ma.masked_invalid(values), cmap=cmap, interpolation="nearest", vmin=0, vmax=maximum)

    def navigation(self, ax):
        self.base_map(ax, "Берега и морские маршруты")
        elev = self.raster("seaLevelAppliedElevationField")
        self.overlay(ax, np.where(self.land, elev, np.nan), RELIEF, maximum=0.5)
        edges = {edge["edgeId"]: edge for edge in self.graph["edges"]}
        paths = self.geometry["macroRoutes"]["candidateRoutes"]
        passage_routes = {route for passage in self.topology["islandPassages"] for route in passage["routeIds"]}
        ranked = [route for route in paths if route["crossContinentRoute"]]
        ranked += [route for route in paths if route["routeId"] in passage_routes]
        ranked += [route for route in paths if route["routeMode"] == "marine_assisted" and not route["crossContinentRoute"]][:2]
        drawn = set()
        for route in ranked:
            for key in route["edgePathIds"]:
                if key in drawn or "waterPathCellIndices" not in edges[key]:
                    continue
                drawn.add(key)
                self.plot_cells(ax, edges[key]["waterPathCellIndices"], color=ROUTE if route["crossContinentRoute"] else ISLAND,
                                linewidth=1.45, zorder=4, alpha=0.9)

        for port in self.topology["ports"]:
            index = port["landCellIndex"]
            color = ISLAND if port["islandId"] else PAPER
            ax.scatter(index % self.width, index // self.width, c=color, s=21, edgecolor=INK, linewidths=0.55, zorder=5)
        for passage in self.topology["islandPassages"]:
            index = passage["cellIndex"]
            ax.scatter(index % self.width, index // self.width, c=LOCK, marker="D", s=30, edgecolor=INK, linewidths=0.6, zorder=6)
        for body in self.geometry["continentBodies"]["continentBodies"]:
            center = body["centroidPoint"]
            ax.text(center["x"], center["y"], body["recordDraft"]["continentId"], fontsize=8, ha="center",
                    color=INK, weight="bold", bbox={"facecolor": PAPER, "edgecolor": "none", "pad": 1.2, "alpha": 0.83})

    def basins(self, ax):
        self.base_map(ax, "Водосборы, русла и плиты")
        watersheds = self.geometry["watershedSegmentation"]["watersheds"]
        basin_index = {watershed["watershedId"]: index % len(BASIN_COLORS.colors) for index, watershed in enumerate(watersheds)}
        raster = self.record_grid(watersheds, "watershedId", basin_index)
        self.overlay(ax, raster, BASIN_COLORS, maximum=len(BASIN_COLORS.colors) - 1)
        pressure = self.raster("platePressureField")
        ax.contour(pressure, levels=[0.48, 0.72], colors=["#455a52", "#332f41"], linewidths=[0.48, 0.75], alpha=0.54)
        candidates = self.geometry["majorRiverCandidates"]["majorRiverCandidates"]
        for candidate in candidates:
            indices = candidate.get("pathCellIndices") or candidate.get("riverPathCellIndices") or candidate.get("lineCellIndices")
            if indices:
                self.plot_cells(ax, indices, color="#226890", linewidth=1.05, zorder=4)
        for plate in self.geometry["plateSeedDistribution"]["plateSeeds"]:
            point = plate["seedPoint"]
            ax.scatter(point["x"], point["y"], marker="+", color=PAPER, s=23, linewidths=1.3, zorder=5)
            ax.text(point["x"] + 2, point["y"] - 2, plate["plateId"].replace("plate_", ""), color=PAPER, fontsize=6.6,
                    bbox={"facecolor": WATER, "edgecolor": "none", "pad": 1, "alpha": 0.65}, zorder=6)

    def record_panel(self, ax, title, rows, regions, id_key, palette):
        self.base_map(ax, title)
        values = self.record_grid(regions, id_key, {row["recordId"]: row["value"] for row in rows})
        return self.overlay(ax, values, palette)

    def render(self, destination):
        plt.rcParams.update({"font.family": "DejaVu Sans", "savefig.facecolor": PAPER})
        fig, axes = plt.subplots(3, 2, figsize=(14.2, 12.9), facecolor=PAPER)
        fig.subplots_adjust(left=0.062, right=0.938, top=0.838, bottom=0.09, hspace=0.39, wspace=0.11)
        axes = axes.ravel()
        self.navigation(axes[0])
        self.basins(axes[1])

        self.base_map(axes[2], "Phase 1 · интенсивность штормов")
        storm = self.overlay(axes[2], self.raster("stormCorridorField"), STORM)
        axes[2].contour(self.land, levels=[0.5], colors=INK, linewidths=0.57, alpha=0.62)
        relief = self.geometry["reliefRegionExtraction"]["reliefRegionBodies"]
        bands = [row for row in self.geometry["climateZoneClassification"]["zoneSummaries"] if row.get("cellIndices")]
        pressure_fields = self.phase2["pressureFieldPackage"]["domains"]
        rhythm_fields = self.phase2["environmentalRhythmPackage"]["domains"]
        pressure = self.record_panel(axes[3], "Phase 2 · трудность рельефа",
                                     pressure_fields["terrain"]["terrainHarshness"]["perReliefScores"],
                                     relief, "reliefRegionId", BURDEN)
        cadence = self.record_panel(axes[4], "Phase 2 · каденция штормов",
                                    rhythm_fields["storms"]["stormCadence"]["perBandScores"],
                                    bands, "climateBandId", STORM)
        recovery = self.record_panel(axes[5], "Phase 2 · темп восстановления",
                                     rhythm_fields["recovery"]["recoveryTempo"]["perReliefScores"],
                                     relief, "reliefRegionId", RECOVERY)

        for ax, plot in zip(axes[2:], [storm, pressure, cadence, recovery]):
            bar = fig.colorbar(plot, ax=ax, orientation="horizontal", fraction=0.049, pad=0.075, aspect=51,
                               ticks=[0, 0.25, 0.5, 0.75, 1])
            bar.ax.tick_params(labelsize=8, colors=MUTED, length=1.5)
            bar.outline.set_linewidth(0.4)
        route_legend = [
            Line2D([0], [0], color="#a97520", lw=2, label="Межконтинентальный"),
            Line2D([0], [0], color="#377e76", lw=2, label="Местный морской"),
            Line2D([0], [0], marker="o", markerfacecolor=PAPER, markeredgecolor=INK, ls="", label="Береговой выход"),
            Line2D([0], [0], marker="D", c="#a74669", ls="", label="Измеренный пролив")
        ]
        basin_legend = [
            Line2D([0], [0], c="#226890", lw=1.6, label="Русло"),
            Line2D([0], [0], c="#332f41", lw=1.05, label="Изолиния давления плит"),
            Line2D([0], [0], marker="+", c=INK, ls="", label="Опорная точка плиты")
        ]
        for ax, handles in ((axes[0], route_legend), (axes[1], basin_legend)):
            ax.legend(handles=handles, loc="upper center", bbox_to_anchor=(0.5, -0.045), ncol=len(handles),
                      fontsize=7.8, frameon=False, handletextpad=0.44, columnspacing=1.05)
        phase0 = self.snapshot["phase0"]["outputs"]["phase0Bundle"]["worldSeedProfile"]
        seed = self.snapshot["seed"]
        macro_seed = self.geo["macroSeed"]
        fact = self.snapshot["diagnostics"]["maritime"]["rows"][0]
        recovery_mean = self.phase2["environmentalRhythmPackage"]["synthesized"]["recoveryProfile"]["summary"]["mean"]
        plt.figtext(0.062, 0.96, "Paths / WorldGen V1", color=MUTED, fontsize=13, weight="bold")
        plt.figtext(0.062, 0.915, f"Мир {seed}", color=INK, fontsize=38, weight="bold")
        plt.figtext(0.064, 0.881, f"Macro seed {macro_seed}  ·  {self.width} × {self.height}  ·  "
                    f"Phase 2 {self.phase2['validationReport']['finalStatus']}  ·  {self.snapshot['revision'][:12]}",
                    color=MUTED, fontsize=10.8)
        plt.figtext(0.938, 0.947, f"{len(self.geo['continents'])} материка  /  {len(self.geo['seaRegions'])} бассейнов",
                    ha="right", color=INK, fontsize=13, weight="bold")
        plt.figtext(0.938, 0.922, f"{len(self.topology['islands'])} островов цепи  /  {len(self.topology['islandPassages'])} проливов",
                    ha="right", color=INK, fontsize=11)
        plt.figtext(0.938, 0.881, f"Морская зависимость {phase0['maritimeDependence']:.2f}  ·  "
                    f"Изменчивость среды {phase0['environmentalVolatility']:.2f}", ha="right", color=MUTED, fontsize=10.1)
        plt.figtext(0.062, 0.038, f"Контроль 0.1 → 0.9 · связующая ценность {fact['low']:.3f} → {fact['high']:.3f}   "
                    f"  /  Сводная готовность к восстановлению {recovery_mean:.3f}", color=INK, fontsize=10)
        plt.figtext(0.062, 0.018, "Поля и пути из PhysicalWorldDebugBundle и экспорта Phase 2. "
                    "Светлые клетки на картах записей обозначают отсутствие значений.", color=MUTED, fontsize=8.8)
        fig.savefig(destination, dpi=155, facecolor=PAPER)
        plt.close(fig)



def render_storm_control(data, destination):
    width, height = data["width"], data["height"]
    low = np.asarray(data["lowStorm"]).reshape(height, width)
    high = np.asarray(data["highStorm"]).reshape(height, width)
    land = np.asarray(data["land"]).reshape(height, width)
    delta = high - low
    plt.rcParams.update({"font.family": "DejaVu Sans"})
    fig, axes = plt.subplots(1, 3, figsize=(15.4, 6.0), facecolor=PAPER)
    fig.subplots_adjust(left=0.047, right=0.959, top=0.73, bottom=0.30, wspace=0.12)
    for axis, title, values, palette, cap in zip(
        axes, ["Изменчивость 0.1", "Изменчивость 0.9", "Прирост на тех же клетках"],
        [low, high, delta], [STORM, STORM, BURDEN], [1, 1, max(0.01, float(delta.max()))]
    ):
        plot = axis.imshow(values, cmap=palette, interpolation="nearest", vmin=0, vmax=cap)
        axis.contour(land, [0.5], colors=INK, linewidths=0.62)
        axis.set_title(title, loc="left", fontweight="bold", fontsize=12.8, color=INK, pad=10)
        axis.set_xticks([])
        axis.set_yticks([])
        bar = fig.colorbar(plot, ax=axis, orientation="horizontal", fraction=0.063, pad=0.105, aspect=35)
        bar.ax.tick_params(labelsize=8, colors=MUTED, length=1.5)
    seed = data["seed"]
    fig.text(0.047, 0.914, f"Мир {seed} · один профиль, два значения изменчивости", color=INK, fontsize=24, weight="bold")
    fig.text(0.047, 0.85, f"Одинаковые локальные seed, берега, рельеф, температура и влажность  ·  {data['revision'][:12]}",
             color=MUTED, fontsize=11.5)
    low_sea, high_sea = data["seaStormPressure"]
    low_break, high_break = data["stormBreakRisk"]
    low_cadence, high_cadence = data["stormCadence"]
    fig.text(0.047, 0.199, f"Давление штормов в {data['seaRegionId']}  {low_sea:.4f} → {high_sea:.4f}     "
             f"Уязвимость к штормам  {low_break:.4f} → {high_break:.4f}     "
             f"Каденция  {low_cadence:.4f} → {high_cadence:.4f}", color=INK, fontsize=10.8)
    fig.text(0.047, 0.133, f"Ответили {data['changedStormCells']:,} клеток. Первые две карты используют общую шкалу 0–1. "
             "У прироста своя шкала.", color=MUTED, fontsize=10.2)
    fig.savefig(destination, dpi=155, facecolor=PAPER)
    plt.close(fig)

def main():
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument("destination", type=Path)
    args.add_argument("snapshots", nargs="+", type=Path)
    options = args.parse_args()
    options.destination.mkdir(parents=True, exist_ok=True)
    for path in options.snapshots:
        snapshot = json.loads(path.read_text())
        if snapshot.get("schema") == "worldgen-storm-counterfactual-v1":
            render_storm_control(snapshot, options.destination / f"storm-control-{snapshot['seed']}.png")
        else:
            Atlas(snapshot).render(options.destination / f"atlas-{snapshot['seed']}.png")


if __name__ == "__main__":
    main()
