#!/usr/bin/env python3
"""Compare production and hypothetical shorelines from the continental relief probe."""

import argparse
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import TwoSlopeNorm
import numpy as np


def render(report):
    worlds = report['worlds']
    paper = '#f5f1e7'
    ink = '#20343a'
    fig, axes = plt.subplots(len(worlds), 2, squeeze=False, figsize=(13, 3.7 * len(worlds) + 2), facecolor=paper)
    fig.subplots_adjust(left=.065, right=.94, top=.87, bottom=.16, hspace=.26, wspace=.10)
    fig.text(.065, .952, 'Paths  /  Уровень моря и континентальные перемычки', fontsize=19, color=ink,
             fontweight='semibold')
    fig.text(.065, .918, f"{report['revision'][:12]}  ·  один рельеф до островного поднятия и морской переработки",
             fontsize=9, color=ink)
    norm = TwoSlopeNorm(vmin=-.18, vcenter=0, vmax=.28)
    record_axes = []
    for pair, world in zip(axes, worlds):
        width, height = (world['worldBounds'][key] for key in ('width', 'height'))
        bed = np.asarray(world['preMarineElevation']).reshape(height, width)
        chosen = world['chosen']
        size = world['minimumContinentArea']
        levels = world['sampledLevels']
        second_area = lambda row: (row['leadingAreas'] + [0, 0])[1]
        potential = next((row for row in levels if second_area(row) >= size), None)
        comparison = potential or max(levels, key=second_area)
        seed = world['seed']
        labels = [
            f"{seed}  ·  Выбранный срез на {chosen['percentile']:.1%}",
            f"{'Первое разделение' if potential else 'Наибольший второй массив'}  ·  "
            f"{comparison['percentile']:.1%}, второй массив {second_area(comparison):,} кл.".replace(',', ' ')
        ]
        for ax, level, title in zip(pair, [chosen, comparison], labels):
            relative = bed - level['cutoff']
            image = ax.imshow(relative, cmap='BrBG_r', norm=norm, interpolation='nearest')
            ax.contour(relative, [0], colors=ink, linewidths=.42)
            ax.set(xticks=[], yticks=[])
            ax.set_title(title, loc='left', color=ink, fontsize=11, pad=7)
            record_axes.append(ax)
    color_bar = fig.colorbar(image, ax=record_axes, pad=.05, aspect=48, fraction=.045, orientation='horizontal')
    color_bar.set_label('Нормированная отметка относительно уровня воды', fontsize=9, color=ink)
    fig.text(.065, .083, 'Уровни проверены с шагом 0,2 процентильного пункта. Минимальная площадь материка — 819 макроклеток.',
             fontsize=9, color=ink)
    fig.text(.065, .052, 'Подъём воды меняет площадь суши и разделяет массивы. После экспорта дополнительно проверяются острова и морские пути.',
             fontsize=9, color=ink)
    return fig


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('report', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    figure = render(json.loads(args.report.read_text()))
    figure.savefig(args.output)
