#!/usr/bin/env python3
"""Render the polar boundary case and pressure/recovery evidence from the foundation audit."""

import argparse
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.colors import TwoSlopeNorm
from matplotlib.patches import Rectangle
import numpy as np


PAPER = '#f5f1e7'
INK = '#20343a'
PLUM = '#752546'


def layers(snapshot):
    debug = snapshot['diagnostics']['physicalWorldDebugBundle']
    return ({row['sourceLayerId']: row['payload'] for row in debug[k]}
            for k in ('fieldSnapshots', 'intermediateOutputs'))


def frame(snapshot, heading):
    fig, axes = plt.subplots(1, 2, figsize=(13, 6.3), facecolor=PAPER)
    fig.subplots_adjust(left=.07, right=.95, bottom=.16, top=.79, wspace=.17)
    fig.text(.07, .93, f"Paths  /  {heading}  /  {snapshot['seed']}", color=INK, fontsize=20,
             fontweight='semibold')
    fig.text(.07, .883, f"Исходный снимок {snapshot['revision'][:12]}  ·  отклонённый пакет",
             color=INK, fontsize=9)
    return fig, axes


def polar_edge(snapshot):
    fields, outputs = layers(snapshot)
    field = fields['finalRelativeElevationField']
    height, width = field['height'], field['width']
    bed = np.asarray(field['values']).reshape(height, width)
    regions = outputs['seaRegionClusters']['seaRegionClusters']
    edge = next(sea for sea in regions if sea['recordDraft']['seaRegionId'] == 'sea_04')
    y, x = np.divmod(np.asarray(edge['cellIndices']), width)
    fig, axes = frame(snapshot, 'Вода на границе карты')
    for ax in axes:
        image = ax.imshow(bed, cmap='BrBG_r', interpolation='nearest',
                          norm=TwoSlopeNorm(vmin=-.18, vcenter=0, vmax=.24))
        ax.set(xticks=[], yticks=[])
        ax.contour(bed, [0], colors=INK, linewidths=.42)
    marker = Rectangle((x.min() - 7.5, -.5), width - x.min() + 7, y.max() + 7,
                       fill=False, edgecolor=PLUM, linewidth=1.3)
    axes[0].add_patch(marker)
    axes[0].set_title('Северо-восточный край мира', loc='left', color=INK, fontsize=11)
    axes[1].set(xlim=(x.min() - 15.5, width - .5), ylim=(y.max() + 9.5, -.5))
    axes[1].set_title('Две водные клетки целиком на границе', loc='left', color=INK, fontsize=11)
    for cx, cy in zip(x, y):
        axes[1].add_patch(Rectangle((cx - .5, cy - .5), 1, 1, fill=False, edgecolor=PLUM, linewidth=1.7))
    bar = fig.colorbar(image, ax=axes, orientation='horizontal', pad=.06, aspect=45, shrink=.75)
    bar.set_label('Нормированная отметка относительно уровня моря', fontsize=9, color=INK)
    fig.text(.07, .068, 'Внутри карты у этого водного участка нет наблюдаемой чаши или подтверждённого порта.',
             color=INK, fontsize=9)
    return fig


def recovery_landscape(snapshot):
    fields, outputs = layers(snapshot)
    field = fields['finalRelativeElevationField']
    shape = (field['height'], field['width'])
    bed = np.asarray(field['values']).reshape(shape)
    regions = outputs['reliefRegionExtraction']['reliefRegionBodies']
    candidate = snapshot['diagnostics']['rejectedPhase2Candidate']
    fragility = candidate['pressureFieldPackage']['domains']['ecology']['ecologicalFragility']
    persistence = candidate['environmentalRhythmPackage']['domains']['recovery']['reliefPersistence']
    fig, axes = frame(snapshot, 'Состояние среды и длительность восстановления')
    for ax, domain, name in zip(axes, [fragility, persistence],
                                ['Экологическая хрупкость', 'Устойчивость окна восстановления']):
        by_id = {row['recordId']: row['value'] for row in domain['perReliefScores']}
        values = np.full(shape, np.nan)
        for region in regions:
            values.flat[region['cellIndices']] = by_id[region['reliefRegionId']]
        ax.set(xticks=[], yticks=[], facecolor='#dce9e7')
        image = ax.imshow(values, cmap='YlOrRd', interpolation='nearest', vmin=0, vmax=.45)
        ax.contour(bed, [0], colors=INK, linewidths=.42)
        ax.set_title(name, loc='left', color=INK, fontsize=11)
    bar = fig.colorbar(image, ax=axes, orientation='horizontal', pad=.06, aspect=45, shrink=.75)
    bar.set_label('Значение по области рельефа, общая шкала', fontsize=9, color=INK)
    fig.text(.07, .068, 'Проверка глобально отсортированных средних отклонила пакет. Карты показывают разные профили на общей географии.',
             color=INK, fontsize=9)
    return fig


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshots', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    with PdfPages(args.output) as pdf:
        for seed, render in [(3840024598, polar_edge), (1665754063, recovery_landscape)]:
            snapshot = json.loads((args.snapshots / f'seed-{seed}.json').read_text())
            figure = render(snapshot)
            pdf.savefig(figure, dpi=145)
            plt.close(figure)
