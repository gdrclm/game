"""Render before/after charts from F8-Q generation snapshots."""
import argparse
from collections import Counter
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
from matplotlib.colors import Normalize, to_rgb
from matplotlib.lines import Line2D
import numpy as np

from worldgen_v1_quality_metrics import World


LAND = "#e7cf95"
SEA = "#14364a"
ROUTE = "#6bc6eb"
CUT = "#f35c63"
BYPASS = "#66efab"
CHART = "#0b2031"
INK = "#edf5f6"


def draw_base(ax, world):
    height, width = world.height, world.width
    land = world.land.reshape(height, width)
    data = world.field("seaLevelAppliedElevationField")
    elevation = np.asarray(data["values"]).reshape(height, width) if data else land.astype(float)
    brightness = np.clip(0.82 + elevation * 0.29, 0.77, 1.09)
    mask = np.where(land[:, :, None], to_rgb(LAND), to_rgb(SEA)) * brightness[:, :, None]
    ax.imshow(np.clip(mask, 0, 1), interpolation="nearest")
    ax.set(xticks=[], yticks=[])
    for spine in ax.spines.values():
        spine.set_color("#516d7d")


def paint_water_traffic(ax, world):
    usage = Counter(step for route in world.routes for step in world.route_steps(route))
    if not usage:
        return
    cap = max(usage.values())
    lines = [world.points(step) for step in usage]
    strengths = np.asarray(list(usage.values())) / cap
    colors = np.repeat(np.asarray([(*to_rgb(ROUTE), 1)]), len(lines), axis=0)
    colors[:, 3] = 0.24 + 0.76 * strengths
    ax.add_collection(LineCollection(lines, colors=colors, linewidths=0.55 + strengths * 1.25, zorder=3))


def paint_access(ax, world, resupply_cmap):
    rows = world.outputs["isolationAnalysis"]["nodeIsolationRows"]
    for row in rows:
        if not row["projectable"]:
            continue
        point = row["normalizedAnchorPoint"]
        x, y = point["x"] * (world.width - 1), point["y"] * (world.height - 1)
        ax.scatter(x, y, marker="D" if row["coreAnchor"] else "o", s=32 if row["coreAnchor"] else 15,
                   c=[row["resupplyCost"]], norm=Normalize(0, 1), cmap=resupply_cmap,
                   edgecolors=INK, linewidths=0.6, zorder=5)
    for passage in world.topology["islandPassages"]:
        x, y = world.points([passage["cellIndex"]])[0]
        ax.scatter(x, y, marker="+", c=CUT, linewidths=0.9, s=20, zorder=6)


def choose_after(world):
    passages = world.topology["islandPassages"]
    return max(passages, key=lambda item: float("inf") if item["bypassTravelCells"] is None
               else (item["bypassTravelCells"] - item["travelCells"]) / item["travelCells"], default=None)


def choose_before(world, after, passage):
    if not passage:
        return next(iter(world.topology["islandPassages"]), None)
    center = after.points(passage["shoreCellIndices"]).mean(axis=0)
    return min(world.topology["islandPassages"],
               key=lambda item: np.linalg.norm(center - world.points(item["shoreCellIndices"]).mean(axis=0)), default=None)


def title(ax, value, loc="left"):
    ax.set_title(value, loc=loc, fontsize=10, weight="semibold", color=INK, pad=8)


def fixed_terminals(world, passage):
    if not passage:
        return []
    edge = next(row for row in world.graphs["seaConnectivityGraph"]["edges"] if row["edgeId"] == passage["seaEdgeId"])
    path = edge["waterPathCellIndices"]
    return [path[0], path[-1]]


def plot_section(ax, world, passage, limits):
    draw_base(ax, world)
    paint_water_traffic(ax, world)
    ax.set_xlim(*limits[0])
    ax.set_ylim(*limits[1])
    if not passage:
        return "There is no measured section in this panel."
    blocked = set(passage["restrictedCellIndices"])
    sea = world.graphs["seaConnectivityGraph"]["edges"]
    path = next(row["waterPathCellIndices"] for row in sea if row["edgeId"] == passage["seaEdgeId"])
    terminals = fixed_terminals(world, passage)
    # Draw the actual grid cells, including those closed by the legacy circular test.
    cut_xy = world.points(list(blocked))
    ax.scatter(*cut_xy.T, s=13, marker="s", color=CUT, linewidths=0, alpha=0.8, zorder=4)
    ax.plot(*world.points(path).T, color="#ffdf96", linewidth=1.5, zorder=5)
    ax.scatter(*world.points(terminals).T, s=41, marker="^", color=INK, edgecolors=CHART, linewidths=0.7, zorder=8)
    shores = world.points(passage["shoreCellIndices"])
    ax.scatter(*shores.T, s=24, color=CUT, marker="x", zorder=7)
    if any(cell in blocked for cell in terminals):
        return f"Cut includes a terminal · {len(blocked)} closed cells"
    bypass = world.water_path(*terminals, blocked)
    if bypass:
        ax.plot(*world.points(bypass).T, color=BYPASS, linewidth=1.25, zorder=6)
        return f"Open terminals · {len(path) - 1} → {len(bypass) - 1} steps"
    return "Open terminals · water access between them is cut"


def comparison_atlas(before, after, output):
    fig, grid = plt.subplots(2, 2, figsize=(12.8, 10.0), gridspec_kw={"height_ratios": [1.1, 1.0]}, facecolor=CHART)
    fig.subplots_adjust(top=0.89, bottom=0.16, left=0.05, right=0.95, wspace=0.13, hspace=0.20)
    fig.text(0.05, 0.955, f"Paths  /  Seed {after.seed}", fontsize=27, weight="bold", color=INK)
    fig.text(0.05, 0.923, "Phase 1 coastline, sampled sailing network and a closure in each revision",
             fontsize=11, color="#bdd6e0")
    resupply_cmap = "magma"
    after_passage = choose_after(after)
    before_passage = choose_before(before, after, after_passage)
    for col, (world, label, passage) in enumerate(zip((before, after), ("Baseline", "F8-Q"), (before_passage, after_passage))):
        world_ax = grid[0, col]
        draw_base(world_ax, world)
        paint_water_traffic(world_ax, world)
        paint_access(world_ax, world, resupply_cmap)
        world_ax.scatter(*world.points(fixed_terminals(world, passage)).T, marker="^", s=33,
                         color=INK, edgecolors=CHART, linewidths=0.7, zorder=8)
        contrast = world.outputs["macroValidationDiagnostics"]["scoreBreakdown"]["centerPeripheryContrast"]["score"]
        stat = f"{len(world.routes)} route pairs  ·  contrast {contrast:.3f}"
        recovery = (world.data.get("phase2", {}).get("environmentalRhythmPackage", {})
                    .get("synthesized", {}).get("recoveryProfile", {}).get("summary", {}).get("mean"))
        if recovery is not None:
            stat += f"  ·  recovery {recovery:.3f}"
        elif "error" in world.data:
            stat += "  ·  export blocked"
        title(world_ax, label + "   /   " + stat)
    points = np.vstack([world.points(list(world.island_cells)) for world in (before, after)])
    minx, miny = points.min(axis=0) - 12
    maxx, maxy = points.max(axis=0) + 12
    limits = ((max(-0.5, minx), min(after.width - 0.5, maxx)),
              (min(after.height - 0.5, maxy), max(-0.5, miny)))
    for col, (world, passage) in enumerate(zip((before, after), (before_passage, after_passage))):
        section_ax = grid[1, col]
        label = plot_section(section_ax, world, passage, limits)
        title(section_ax, label, loc="center")
    legend = [
        Line2D([], [], color=ROUTE, lw=2, label="Sailed grid steps"),
        Line2D([], [], color="#ffdf96", lw=2, label="Measured lane"),
        Line2D([], [], color=BYPASS, lw=2, label="Water bypass"),
        Line2D([], [], marker="s", color=CUT, linestyle="", label="Closure"),
        Line2D([], [], marker="^", color=INK, linestyle="", label="Fixed terminal"),
        Line2D([], [], marker="D", color=INK, linestyle="", label="Core")
    ]
    handles = fig.legend(handles=legend, loc="lower center", bbox_to_anchor=(0.5, 0.045), ncols=6,
                         labelcolor=INK, frameon=False, fontsize=9)
    handles.set_zorder(9)
    bar_ax = fig.add_axes([0.52, 0.105, 0.17, 0.012])
    bar = fig.colorbar(plt.cm.ScalarMappable(norm=Normalize(0, 1), cmap=resupply_cmap), cax=bar_ax, orientation="horizontal",
                       ticks=[0, 0.5, 1])
    bar.ax.tick_params(colors=INK, labelsize=8, length=2)
    fig.text(0.505, 0.110, "Resupply cost", ha="right", va="center", color=INK, fontsize=9)
    fig.savefig(output, dpi=144, facecolor=fig.get_facecolor())
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("baseline", type=Path)
    parser.add_argument("candidate", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("seeds", nargs="+", type=int)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    for seed in args.seeds:
        before = World(args.baseline / f"seed-{seed}.json")
        after = World(args.candidate / f"seed-{seed}.json")
        if not before.debug or not after.debug:
            raise ValueError(f"Seed {seed} is missing real spatial diagnostics")
        comparison_atlas(before, after, args.output / f"f8q-{seed}.png")


if __name__ == "__main__":
    main()
