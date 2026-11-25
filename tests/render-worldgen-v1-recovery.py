"""Render measured F8-R fields and upstream failures from foundation snapshots."""
import argparse
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.patheffects as effects
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
from matplotlib.colors import Normalize
from matplotlib.lines import Line2D
from matplotlib.patches import Patch
import numpy as np


PAPER = "#0e1d28"
OCEAN = "#162f42"
UNCOVERED = "#6d777c"
INK = "#f0f5f5"
MUTED = "#aac2d0"
SCALE = Normalize(0, 0.6)
WATER_SCALE = Normalize(0, 1)


class Snapshot:
    def __init__(self, path):
        self.data = json.loads(path.read_text())
        bundle = self.data["diagnostics"]["physicalWorldDebugBundle"]
        self.geometry = {row["artifactId"].removeprefix("foundation_geometry_"): row["payload"]
                         for row in bundle["intermediateOutputs"]
                         if row["artifactId"].startswith("foundation_geometry_")}
        self.graphs = {row["sourceLayerId"]: row["payload"] for row in bundle["graphSnapshots"]}
        mask = next(row["payload"] for row in bundle["fieldSnapshots"]
                    if row["payload"]["fieldId"] == "coastJaggednessControlledLandWaterMaskField")
        self.land = np.asarray(mask["values"]).reshape(mask["height"], mask["width"]) >= mask["threshold"]
        self.phase2 = self.data.get("phase2") or self.data["diagnostics"].get("rejectedPhase2Candidate")

    def raster(self, carriers, values):
        result = np.full(self.land.size, np.nan)
        for region_id, cells in carriers:
            if region_id in values:
                result[cells] = values[region_id]
        return np.ma.masked_where(~self.land, result.reshape(self.land.shape))

    def relief(self, key):
        domain = self.phase2["environmentalRhythmPackage"]["domains"]["recovery"]
        values = {row["recordId"]: row["value"] for row in domain[key]["perReliefScores"]}
        bodies = self.geometry["reliefRegionExtraction"]["reliefRegionBodies"]
        return self.raster(((body["reliefRegionId"], body["cellIndices"]) for body in bodies), values)

    def water_stress(self):
        field = self.phase2["pressureFieldPackage"]["domains"]["hydrology"]["waterStress"]
        values = {row["recordId"]: row["value"] for row in field["perBasinScores"]}
        basins = self.geometry["watershedSegmentation"]["watersheds"]
        return self.raster(((body["recordDraft"]["riverBasinId"], body["cellIndices"]) for body in basins), values)

    def stage_label(self):
        report = self.phase2["pressureFieldPackage"]["synthesized"]
        pressure = np.mean([row["value"] for row in report.values()])
        recovery = self.phase2["environmentalRhythmPackage"]["synthesized"]["recoveryProfile"]["summary"]["mean"]
        status = "экспорт" if self.data.get("phase2") else "отклонённый пакет"
        return f"{status}  ·  восстановление {recovery:.3f}  ·  давление {pressure:.3f}"

    def water_paths(self):
        active = {edge for route in self.geometry["macroRoutes"]["candidateRoutes"] for edge in route["edgePathIds"]}
        paths = [row["waterPathCellIndices"] for row in self.graphs["hybridConnectivityGraph"]["edges"]
                 if row["edgeId"] in active and len(row.get("waterPathCellIndices", [])) > 1]
        width = self.land.shape[1]
        return [np.column_stack((np.asarray(path) % width, np.asarray(path) // width)) for path in paths]


def draw_base(ax, land, raster=None, cmap=None, norm=None):
    ax.set_facecolor(OCEAN)
    ax.imshow(np.ma.masked_where(~land, np.ones(land.shape)), interpolation="nearest",
              cmap=matplotlib.colors.ListedColormap([UNCOVERED]), vmin=0, vmax=1)
    if raster is not None:
        ax.imshow(raster, interpolation="nearest", cmap=cmap, norm=norm)
    ax.set(xticks=[], yticks=[])
    for spine in ax.spines.values():
        spine.set_color("#3e5a6b")


def draw_labels(ax, snapshot, labels):
    for body in snapshot.geometry["reliefRegionExtraction"]["reliefRegionBodies"]:
        identifier = body["reliefRegionId"]
        if identifier not in labels:
            continue
        point = body["centroidPoint"]
        ax.text(point["x"], point["y"], identifier.removeprefix("relief_"), color=INK, ha="center", va="center",
                fontsize=8, weight="bold", path_effects=[effects.withStroke(linewidth=2.5, foreground=PAPER)])


FIELDS = [
    ("Темп восстановления", "viridis", SCALE, lambda world: world.relief("recoveryTempo")),
    ("Устойчивость укрытия", "plasma", SCALE, lambda world: world.relief("reliefPersistence")),
    ("Водный стресс в бассейнах", "YlOrRd", WATER_SCALE, lambda world: world.water_stress()),
]


def fields_atlas(before, after, output, labels):
    assert before.data["seed"] == after.data["seed"] and np.array_equal(before.land, after.land)
    fig, axes = plt.subplots(2, 3, figsize=(14, 7.8), facecolor=PAPER)
    fig.subplots_adjust(left=0.045, right=0.955, top=0.76, bottom=0.19, wspace=0.06, hspace=0.25)
    fig.text(0.045, 0.948, f'Paths  /  Seed {after.data["seed"]}', size=29, weight="bold", color=INK)
    fig.text(0.045, 0.894, "Восстановление, укрытия и вода на неизменной географии", size=13, color=MUTED)
    for row, (world, label) in enumerate(((before, "До F8-R"), (after, "После F8-R"))):
        bounds = axes[row, 0].get_position()
        fig.text(bounds.x0, bounds.y1 + 0.018, f"{label}   /   {world.stage_label()}", size=11, color=INK, weight="bold")
        for col, (_, cmap, norm, raster) in enumerate(FIELDS):
            ax = axes[row, col]
            draw_base(ax, world.land, raster(world), cmap, norm)
            if col == 2:
                ax.add_collection(LineCollection(world.water_paths(), colors="#b3d4e5", alpha=0.5, linewidths=0.62))
            else:
                draw_labels(ax, world, labels)
    for ax, (name, cmap, norm, _) in zip(axes[1], FIELDS):
        b = ax.get_position()
        cax = fig.add_axes([b.x0, 0.122, b.width, 0.015])
        fig.text(b.x0, 0.149, name, size=10, weight="bold", color=INK)
        fig.colorbar(plt.cm.ScalarMappable(norm=norm, cmap=cmap), cax=cax, orientation="horizontal",
                     ticks=np.linspace(norm.vmin, norm.vmax, 4 if norm.vmax == 0.6 else 5))
        cax.tick_params(colors=MUTED, labelsize=8, length=2)
    fig.legend(handles=[Patch(color=UNCOVERED, label="Суша вне опубликованных областей"),
                        Line2D([], [], color="#b3d4e5", label="Водные шаги макромаршрутов")],
               labelcolor=MUTED, loc="lower left", bbox_to_anchor=(0.039, 0.024), ncols=2, frameon=False, fontsize=9)
    height, width = after.land.shape
    fig.text(0.955, 0.043, f'{before.data["revision"][:7]} → {after.data["revision"][:7]}  ·  {width} × {height}',
             size=9, color=MUTED, ha="right")
    fig.savefig(output, dpi=145, facecolor=fig.get_facecolor())
    plt.close(fig)


def rejection_atlas(before_dir, after_dir, seeds, output):
    fig, axes = plt.subplots(1, len(seeds), figsize=(14, 4.3), facecolor=PAPER, squeeze=False)
    fig.subplots_adjust(left=0.045, right=0.955, top=0.71, bottom=0.23, wspace=0.06)
    fig.text(0.045, 0.87, "Paths  /  Миры, остановленные на Phase 1", size=25, color=INK, weight="bold")
    fig.text(0.045, 0.78, "Маска суши из диагностики. Те же причины отказа до и после F8-R.", size=11, color=MUTED)
    for ax, seed in zip(axes[0], seeds):
        before, after = (Snapshot(folder / f"seed-{seed}.json") for folder in (before_dir, after_dir))
        assert np.array_equal(before.land, after.land) and before.data["error"] == after.data["error"]
        draw_base(ax, after.land)
        ax.set_title(f"Seed {seed}", fontsize=11, color=INK, loc="left", pad=8)
        error = after.data["error"]
        text = ("Опубликовано меньше двух материков." if '"continents"' in error
                else "Архипелаг и проливы отсутствуют\nв проекте пакета Phase 1.")
        b = ax.get_position()
        fig.text(b.x0, 0.22, text, fontsize=10, color=MUTED, va="top")
    fig.savefig(output, dpi=145, facecolor=fig.get_facecolor())
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("before", type=Path)
    parser.add_argument("after", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("seeds", nargs="+", type=int)
    parser.add_argument("--label", action="append", default=[], help="Relief record id to annotate on field maps")
    parser.add_argument("--phase1-rejections", action="store_true")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    if args.phase1_rejections:
        rejection_atlas(args.before, args.after, args.seeds, args.output / "phase1-rejections.png")
        return
    for seed in args.seeds:
        before, after = (Snapshot(directory / f"seed-{seed}.json") for directory in (args.before, args.after))
        fields_atlas(before, after, args.output / f"seed-{seed}-recovery.png", args.label)


if __name__ == "__main__":
    main()
