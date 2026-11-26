#!/usr/bin/env python3
"""Render exact regional cell measurements collected by the foundation generator."""

import argparse
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.colors import BoundaryNorm, ListedColormap, PowerNorm
from matplotlib.patches import Patch
import numpy as np


WATER = '#e7eff2'
INK = '#23353b'
CLASS_COLORS = ['#d4bd99', '#77a9be', '#d59a70', '#1d7467']
CLASS_LABELS = ['Открыто, пути нет', 'Открыто, путь есть', 'Укрыто, пути нет', 'Укрыто, путь есть']


def plot_island(case, revision, maximum_inflow, maximum_allocation):
    points = case['samples']
    x = np.asarray([cell['x'] for cell in points])
    y = np.asarray([cell['y'] for cell in points])
    left, top = x.min(), y.min()
    shape = (y.max() - top + 1, x.max() - left + 1)
    at = y - top, x - left
    extent = (left - .5, x.max() + .5, y.max() + .5, top - .5)
    record = case['record']
    sheltered = record['shelteredWaterAccess']
    water = record['waterAccess']
    fig, axs = plt.subplots(2, 2, figsize=(11.7, 8.3), facecolor='white')
    fig.subplots_adjust(left=.06, right=.94, top=.80, bottom=.13, wspace=.27, hspace=.35)
    fig.text(.06, .95, 'Островные укрытия и вода', fontsize=21, weight='bold', color=INK)
    status = 'Phase 2 · экспорт' if case['exported'] else 'Phase 1 · диагностический снимок'
    fig.text(.06, .901, f"Seed {case['seed']}   ·   {case['islandId']}   ·   {status}", fontsize=11, color=INK)
    fig.text(.06, .864, f"Укрыто {sheltered['landCellCount']} из {record['landCellCount']} клеток   ·   "
             f"путь к источнику {water['reachableCellCount']}   ·   совместное покрытие {sheltered['reachableCellCount']}",
             fontsize=10, color=INK)

    plots = [
        ('Укрытие и путь к источнику',
         [2 * cell['sheltered'] + cell['reachable'] for cell in points], None, None),
        ('Обычный приток на единицу площади', [cell['ordinary'] for cell in points], 'YlGnBu', maximum_inflow),
        ('Маловодный приток на единицу площади', [cell['lowSeason'] for cell in points], 'YlGnBu', maximum_inflow),
        ('Выделенный маловодный бюджет', [cell['allocatedLow'] for cell in points], 'Purples', maximum_allocation),
    ]
    for ax, (title, values, cmap, vmax) in zip(axs.flat, plots):
        raster = np.full(shape, np.nan)
        raster[at] = values
        ax.set(title=title, facecolor=WATER, xticks=[], yticks=[])
        if cmap:
            scale = {'norm': PowerNorm(gamma=.5, vmin=0, vmax=vmax)} if cmap == 'Purples' else {'vmin': 0, 'vmax': vmax}
            image = ax.imshow(raster, extent=extent, interpolation='nearest', cmap=cmap, **scale)
            bar = fig.colorbar(image, ax=ax, orientation='horizontal', pad=.08, fraction=.06, shrink=.79)
            if cmap == 'Purples':
                ticks = [vmax * fraction ** 2 for fraction in (0, .25, .5, .75, 1)]
                bar.set_ticks(ticks, labels=[f'{tick:.2g}' for tick in ticks])
            bar.ax.tick_params(labelsize=8)
        else:
            ax.imshow(raster, extent=extent, interpolation='nearest',
                      cmap=ListedColormap(CLASS_COLORS), norm=BoundaryNorm(np.arange(-.5, 4.5), 4))
            source = np.asarray([cell['source'] for cell in points], dtype=bool)
            ax.scatter(x[source], y[source], s=3, c=INK, linewidths=0)
            handles = [Patch(color=color, label=label) for color, label in zip(CLASS_COLORS, CLASS_LABELS)]
            ax.legend(handles=handles, loc='upper center', bbox_to_anchor=(.5, -.05), ncol=2, frameon=False, fontsize=8)
    fig.text(.06, .072, 'Точки отмечают потенциальные источники. Выделенный бюджет показан на единицу обслуживаемой площади.',
             fontsize=9, color=INK)
    fig.text(.06, .038, f"Сетка ×{case['subdivision']}   ·   {revision[:12]}   ·   общие шкалы, для бюджета корневая шкала",
             fontsize=8, color=INK)
    return fig


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('measurements', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    data = json.loads(args.measurements.read_text())
    cases = data['cases']
    maximum_inflow = max(1e-6, max(cell['ordinary'] for case in cases for cell in case['samples']))
    maximum_allocation = max(1e-6, max(cell['allocatedLow'] for case in cases for cell in case['samples']))
    with PdfPages(args.output) as pdf:
        for case in cases:
            figure = plot_island(case, data['revision'], maximum_inflow, maximum_allocation)
            pdf.savefig(figure)
            plt.close(figure)


if __name__ == '__main__':
    main()
