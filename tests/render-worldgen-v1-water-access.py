#!/usr/bin/env python3
"""Map measured macro drainage branches and island water access from audit snapshots."""

import argparse
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.colors import ListedColormap


PAPER = '#f5f1e7'
INK = '#1a3036'
SEA = '#dce9e7'


def map_panel(fig, ax, title, values, cmap, label=None, **limits):
    ax.set_title(title, loc='left', fontsize=11, color=INK, fontweight='semibold', pad=8)
    ax.set(xticks=[], yticks=[], facecolor=SEA)
    image = ax.imshow(np.ma.masked_invalid(values), cmap=cmap, interpolation='nearest', **limits)
    if label:
        bar = fig.colorbar(image, ax=ax, orientation='horizontal', pad=.07, aspect=36)
        bar.set_label(label, fontsize=8, color=INK)
        bar.ax.tick_params(labelsize=7)


def render(snapshot):
    diagnostics = snapshot['diagnostics']
    debug = diagnostics['physicalWorldDebugBundle']
    geography = (snapshot.get('phase1') or diagnostics['rejectedPhase2Candidate']['sourcePhase1'])['macroGeographyPackage']
    terrain = next(row['payload'] for row in debug['fieldSnapshots'] if row['sourceLayerId'] == 'finalRelativeElevationField')
    outputs = {row['sourceLayerId']:row['payload'] for row in debug['intermediateOutputs']
               if row['artifactId'].startswith('foundation_geometry_')}
    water = geography['environmentalCoverage']['localWater']
    drainage = outputs['finalDrainage']
    access = outputs['localWaterAccess']
    macro_bed = np.asarray(terrain['values'])
    shape = (terrain['height'], terrain['width'])
    terminal = np.asarray(drainage['terminalLandCellIndices'])
    distance = np.asarray(access['distance'], dtype=float)
    branches = water['branches']
    spill = np.zeros(terminal.size)
    for branch in branches:
        spill[branch['outletCellIndex']] = branch['spillElevation'] or 0
    storage = np.where(terminal >= 0, np.maximum(0, spill[terminal] - macro_bed), 0)
    coverage = np.where(terminal < 0, np.nan, ((terminal * 2654435761) % 31).astype(float)).reshape(shape)

    regional = outputs['regionalArchipelagoSurface']
    grid = regional['grid']
    regional_shape = (grid['height'], grid['width'])
    regional_distances = np.full(grid['width'] * grid['height'], np.nan)
    no_source = np.zeros(regional_distances.size)
    by_island = {row['islandId']:row['waterAccess'] for row in regional['islandEnvironment']['records']}
    for island in regional['islandRecords']:
        measured = by_island[island['islandId']]['meanDistance']
        for start, length in island['landRuns']:
            if measured is None:
                no_source[start:start + length] = 1
            else:
                regional_distances[start:start + length] = measured

    fig, axs = plt.subplots(2, 2, figsize=(13, 9), facecolor=PAPER)
    fig.subplots_adjust(left=.07, right=.94, top=.83, bottom=.13, wspace=.18, hspace=.31)
    fig.text(.07, .95, f"Paths  /  Сток и доступ к воде  /  {snapshot['seed']}", fontsize=21, color=INK, fontweight='semibold')
    status = 'Phase 2 прошла' if 'phase2' in snapshot else 'Phase 2 отклонила пакет'
    fig.text(.07, .906, f"{snapshot['revision'][:12]}  ·  {status}  ·  {len(branches)} фактических терминалов",
             fontsize=9, color=INK)
    palette = ListedColormap(plt.get_cmap('tab20b')(np.linspace(0, 1, 20)))
    map_panel(fig, axs[0, 0], 'Фактические ветви на итоговой поверхности', coverage, palette, vmin=0, vmax=30)
    major = max(geography['environmentalCoverage']['riverBasins'],
                key=lambda key: geography['environmentalCoverage']['riverBasins'][key]['landCellCount'])
    watershed = next(row for row in outputs['watershedSegmentation']['watersheds'] if row['recordDraft']['riverBasinId'] == major)
    boundary = np.zeros(terminal.size)
    boundary[watershed['cellIndices']] = 1
    axs[0, 0].contour((boundary * (terminal >= 0)).reshape(shape), [.5], colors='#6d173e', linewidths=.55)
    map_panel(fig, axs[0, 1], 'Место для удержания под первым седлом', np.where(storage > 0, storage, np.nan).reshape(shape),
              'PuBu', 'Нормированная высота до седла', vmin=0, vmax=max(.001, np.percentile(storage[storage > 0], 99) if np.any(storage) else 0))
    map_panel(fig, axs[1, 0], 'Путь по суше к потенциальному источнику', np.where(distance >= 0, distance, np.nan).reshape(shape),
              'YlGnBu', 'Кардинальные шаги в макроклетках', vmin=0, vmax=max(1, np.percentile(distance[distance >= 0], 95) if np.any(distance >= 0) else 0))
    map_panel(fig, axs[1, 1], 'Средний путь к источнику на каждом острове', regional_distances.reshape(regional_shape),
              'YlGnBu', 'Длина на региональной сетке в макроклетках', vmin=0,
              vmax=max(.125, np.nanpercentile(regional_distances, 98) if np.any(np.isfinite(regional_distances)) else 0))
    axs[1, 1].imshow(np.ma.masked_where(no_source == 0, no_source).reshape(regional_shape), interpolation='nearest',
                     cmap=ListedColormap(['#b76351']), vmin=0, vmax=1)
    fig.text(.07, .059, f'Контур отмечает крупнейшую каноническую группу {major}. Красные острова не имеют достижимого источника по текущему расчёту.', fontsize=9, color=INK)
    fig.text(.07, .029, 'Расчёт использует поверхностный сток и рельеф. Объём под седлом измерен геометрически.', fontsize=9, color=INK)
    return fig


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshots', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('seeds', nargs='+', type=int)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    with PdfPages(args.output / 'local-water-atlas.pdf', metadata={'Title':'Paths · Сток и доступ к воде'}) as pdf:
        for seed in args.seeds:
            snapshot = json.loads((args.snapshots / f'seed-{seed}.json').read_text())
            fig = render(snapshot)
            pdf.savefig(fig, dpi=140)
            fig.savefig(args.output / f'water-access-{seed}.png', dpi=135)
            plt.close(fig)


if __name__ == '__main__':
    main()
