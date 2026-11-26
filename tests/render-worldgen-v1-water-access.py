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
NO_SOURCE = '#b76351'


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
    downstream = np.asarray(drainage['downstreamCellIndices'])
    contributing = np.asarray(drainage['contributingCells'])
    candidate = np.flatnonzero((downstream >= 0) & (contributing >= drainage['reachMinimumContributingCells']))
    y, x = np.divmod(candidate, shape[1])
    keep = (x % 3 == 0) & (y % 3 == 0)
    y, x = y[keep], x[keep]
    target_y, target_x = np.divmod(downstream[candidate[keep]], shape[1])
    axs[1, 0].quiver(x, y, target_x - x, target_y - y, angles='xy', scale_units='xy', scale=.6,
                     color=INK, alpha=.63, width=.0023)
    map_panel(fig, axs[1, 1], 'Средний путь к источнику на каждом острове', regional_distances.reshape(regional_shape),
              'YlGnBu', 'Длина на региональной сетке в макроклетках', vmin=0,
              vmax=max(.125, np.nanpercentile(regional_distances, 98) if np.any(np.isfinite(regional_distances)) else 0))
    axs[1, 1].imshow(np.ma.masked_where(no_source == 0, no_source).reshape(regional_shape), interpolation='nearest',
                     cmap=ListedColormap([NO_SOURCE]), vmin=0, vmax=1)
    fig.text(.07, .059, f'Контур отмечает крупнейшую каноническую группу {major}. Красные острова не имеют достижимого источника по текущему расчёту.', fontsize=9, color=INK)
    fig.text(.07, .029, 'Стрелки отмечают направления на выборочных участках развитого стока. Объём под седлом измерен геометрически.', fontsize=9, color=INK)
    return fig


def render_island_environment(snapshot):
    debug = snapshot['diagnostics']['physicalWorldDebugBundle']
    regional = next(row['payload'] for row in debug['intermediateOutputs']
                    if row['sourceLayerId'] == 'regionalArchipelagoSurface')
    grid = regional['grid']
    shape = (grid['height'], grid['width'])
    rows = {record['islandId']: record for record in regional['islandEnvironment']['records']}
    islands = regional['islandRecords']
    climate = np.full(shape, np.nan)
    shelter = np.full(shape, np.nan)
    flow = np.full(shape, np.nan)
    landfall = np.full(shape, np.nan)
    unwatered = np.zeros(shape, dtype=bool)
    no_landfall = np.zeros(shape, dtype=bool)
    for island in islands:
        record = rows[island['islandId']]
        setting = record['physicalSetting']
        temperature = setting['climateRange']['temperature']
        coastal_distance = setting['transport']['meanDistanceToLandfall']
        seasonal_flow = record['waterAccess']['meanSourceLowFlow']
        for start, length in island['landRuns']:
            cells = slice(start, start + length)
            climate.flat[cells] = temperature['max'] - temperature['min']
            shelter.flat[cells] = setting['terrainShelter']['shelteredLandCells'] / island['areaCells']
            flow.flat[cells] = seasonal_flow if seasonal_flow is not None else np.nan
            landfall.flat[cells] = coastal_distance if coastal_distance is not None else np.nan
            unwatered.flat[cells] = seasonal_flow is None
            no_landfall.flat[cells] = coastal_distance is None
    fig, axs = plt.subplots(2, 2, figsize=(12, 10), facecolor=PAPER)
    fig.subplots_adjust(left=.09, right=.92, top=.846, bottom=.102, wspace=.17, hspace=.32)
    fig.text(.08, .953, f"Paths  /  Природная среда островов  /  {snapshot['seed']}", fontsize=21, color=INK, fontweight='semibold')
    fig.text(.08, .914, f"{snapshot['revision'][:12]}  ·  {len(islands)} островов  ·  региональная сетка ×{grid['subdivision']}",
             fontsize=10, color=INK)
    map_panel(fig, axs[0, 0], 'Различия температуры внутри острова', climate,
              'magma_r', 'Диапазон нормированного индекса', vmin=0, vmax=1)
    map_panel(fig, axs[0, 1], 'Защита рельефом по ветру', shelter,
              'YlGn', 'Доля экранированной суши', vmin=0, vmax=1)
    for ax, title, values, missing, label, cmap in [
        (axs[1, 0], 'Доступный сток в маловодный сезон', flow, unwatered, 'Средний индекс притока', 'YlGnBu'),
        (axs[1, 1], 'Путь от проверенного берегового выхода', landfall, no_landfall, 'Средняя длина в макроклетках', 'Oranges')
    ]:
        maximum = max(.001, float(np.nanmax(values))) if np.any(np.isfinite(values)) else 1
        map_panel(fig, ax, title, values, cmap, label, vmin=0, vmax=maximum)
        ax.imshow(np.ma.masked_where(~missing, missing), interpolation='nearest',
                  cmap=ListedColormap([NO_SOURCE]), vmin=0, vmax=1)
    fig.text(.08, .053, 'Красный цвет означает отсутствие измеренного доступа к источнику или береговому выходу в соответствующей панели.',
             fontsize=9, color=INK)
    fig.text(.08, .024, 'Температура уточнена по высоте. Экранирование учитывает преграды со стороны преобладающего ветра.',
             fontsize=9, color=INK)
    return fig


def render_linked_basins(snapshot):
    debug = snapshot['diagnostics']['physicalWorldDebugBundle']
    regional = next(row['payload'] for row in debug['intermediateOutputs']
                    if row['sourceLayerId'] == 'regionalArchipelagoSurface')
    grid = regional['grid']
    shape = (grid['height'], grid['width'])
    record = max(regional['islandEnvironment']['records'], key=lambda row:
                 row['waterAccess']['storageSpaceToSurfaceWater'] - row['waterAccess']['storageSpace'])
    island = next(row for row in regional['islandRecords'] if row['islandId'] == record['islandId'])
    relief = np.asarray(regional['signedRelativeElevation']).reshape(shape)
    cells = np.concatenate([np.arange(start, start + length) for start, length in island['landRuns']])
    y, x = np.divmod(cells, shape[1])
    branches = [row for row in record['catchments'] if row['retentionToSurfaceWater']
                and row['retentionToSurfaceWater']['spillElevation'] > row['spillElevation']]
    if not branches:
        raise ValueError(f"Seed {snapshot['seed']} has no measured linked basins on this regional surface")
    branches.sort(key=lambda row: row['outletCellIndex'])
    points = np.asarray([row['outletCellIndex'] for row in branches])
    py, px = np.divmod(points, shape[1])
    fig, (terrain, levels) = plt.subplots(1, 2, figsize=(13, 7.6), facecolor=PAPER)
    fig.subplots_adjust(left=.088, right=.95, top=.82, bottom=.15, wspace=.3)
    fig.text(.087, .943, f"Paths  /  Связанные впадины  /  {snapshot['seed']}", fontsize=21,
             color=INK, fontweight='semibold')
    fig.text(.087, .901, f"{snapshot['revision'][:12]}  ·  {record['islandId']}  ·  региональная сетка ×{grid['subdivision']}",
             fontsize=9, color=INK)
    map_panel(fig, terrain, 'Рельеф и дно локальных впадин', relief, 'BrBG_r',
              'Нормированная отметка над уровнем моря', vmin=-.15, vmax=.15)
    terrain.contour(relief, [0], colors=INK, linewidths=.55, alpha=.6)
    terrain.set_xlim(x.min() - 6, x.max() + 6)
    terrain.set_ylim(y.max() + 6, y.min() - 6)
    terrain.scatter(px, py, s=18, c='#761f40', edgecolors=PAPER, linewidths=.7)
    levels.set_title('Порог первой впадины и путь к водоёму', loc='left', fontsize=11,
                     color=INK, fontweight='semibold', pad=8)
    position = np.arange(len(branches))
    sill = [row['spillElevation'] for row in branches]
    surface = [row['retentionToSurfaceWater']['spillElevation'] for row in branches]
    levels.hlines(position, sill, surface, color='#658b8c', linewidth=2)
    levels.scatter(sill, position, s=24, c='#23767a', label='Первое седло')
    levels.scatter(surface, position, s=24, c='#761f40', label='Выход к воде')
    levels.set(xlabel='Нормированная высота пути перелива', ylabel='Впадины по порядку с севера на юг',
               yticks=[], facecolor=PAPER)
    levels.grid(axis='x', linewidth=.4)
    levels.legend(loc='best', frameon=False)
    water = record['waterAccess']
    fig.text(.087, .084, f"Оценка вместимости  ·  под первыми седлами {water['storageSpace']:.6f}"
             f"  ·  до связного перелива к воде {water['storageSpaceToSurfaceWater']:.6f}", fontsize=10, color=INK)
    fig.text(.087, .041, 'Точки на карте показывают дно впадин. Вместимость измерена по рельефу без модели просачивания и испарения.',
             fontsize=9, color=INK)
    return fig


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshots', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('seeds', nargs='+', type=int)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--island-environment', action='store_true')
    mode.add_argument('--linked-basins', action='store_true')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    filename, image_name, title, renderer = 'local-water-atlas', 'water-access', 'Сток и доступ к воде', render
    if args.island_environment:
        filename = image_name = 'island-environment'
        title, renderer = 'Природная среда островов', render_island_environment
    if args.linked_basins:
        filename = image_name = 'linked-basins'
        title, renderer = 'Связанные впадины', render_linked_basins
    with PdfPages(args.output / f'{filename}.pdf', metadata={'Title': f'Paths · {title}'}) as pdf:
        for seed in args.seeds:
            snapshot = json.loads((args.snapshots / f'seed-{seed}.json').read_text())
            fig = renderer(snapshot)
            pdf.savefig(fig, dpi=140)
            fig.savefig(args.output / f'{image_name}-{seed}.png', dpi=135)
            plt.close(fig)


if __name__ == '__main__':
    main()
