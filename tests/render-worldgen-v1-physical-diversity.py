#!/usr/bin/env python3
"""Compare raster-backed regional relief and macro controls from paired audit snapshots."""

import argparse
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.colors import PowerNorm, TwoSlopeNorm
import numpy as np


INLAND_LIMIT = 0.057


def load_snapshot(directory, seed):
    snapshot = json.loads((directory / f'seed-{seed}.json').read_text())
    debug = snapshot['diagnostics']['physicalWorldDebugBundle']
    region = next(row['payload'] for row in debug['intermediateOutputs']
                  if row['sourceLayerId'] == 'regionalArchipelagoSurface')
    fields = {row['sourceLayerId']: row['payload'] for row in debug['fieldSnapshots']}
    grid = region['grid']
    shape = grid['height'], grid['width']
    return snapshot['revision'], region, fields, np.asarray(region['inheritedElevation']).reshape(shape), +        np.asarray(region['signedRelativeElevation']).reshape(shape)


def variations(elevation, axis, subdivision):
    values = np.moveaxis(elevation, axis, -1)
    jump = np.abs(np.diff(values, n=2, axis=-1)) * subdivision
    aligned = np.arange(1, values.shape[-1] - 1) % subdivision == 0
    return jump, aligned


def curvature_metrics(elevation, reference, subdivision):
    aligned_total = total = 0.0
    aligned_count = 0
    for axis in (0, 1):
        jump, aligned = variations(elevation, axis, subdivision)
        heights = np.moveaxis(reference, axis, -1)
        inland = ((heights[..., :-2] > INLAND_LIMIT) & (heights[..., 1:-1] > INLAND_LIMIT)
                  & (heights[..., 2:] > INLAND_LIMIT))
        aligned_total += jump[inland & aligned].sum()
        aligned_count += np.count_nonzero(inland & aligned)
        total += jump[inland].sum()
    return (float(aligned_total / total) if total else None,
            float(aligned_total / aligned_count) if aligned_count else None)


def longest_shore_run(elevation):
    land = (elevation > 0).astype(int)
    longest = 0
    for axis in (0, 1):
        edges = np.moveaxis(np.diff(land, axis=axis), axis, 0)
        for row in edges:
            changes = np.r_[0, np.flatnonzero(np.diff(row)) + 1, row.size]
            lengths = np.diff(changes)[row[changes[:-1]] != 0]
            if lengths.size:
                longest = max(longest, int(lengths.max()))
    return longest


def controls(fields):
    wetness = fields['wetnessField']
    height, width = wetness['height'], wetness['width']
    wet = np.asarray(wetness['values']).reshape(height, width)
    final_mask = fields['coastJaggednessControlledLandWaterMaskField']
    land = np.asarray(final_mask['values']).reshape(height, width) >= final_mask['threshold']
    jumps = []
    for latitude in (.16, .36, .5, .64, .84):
        row = int(np.ceil(latitude * (height - 1)))
        if 0 < row < height:
            both_land = land[row] & land[row - 1]
            if both_land.any():
                jumps.append(float(np.abs(wet[row] - wet[row - 1])[both_land].mean()))
    return {'wetnessBeltTransitionMean': float(np.mean(jumps)) if jumps else None,
            'platePressure': fields['platePressureField']['values'],
            'wetness': wetness['values']}


def metrics(before, after):
    _, old_region, old_fields, old_inherited, old_bed = before
    _, new_region, new_fields, new_inherited, new_bed = after
    assert old_region['grid'] == new_region['grid']
    subdivision = old_region['grid']['subdivision']
    old_macro, new_macro = controls(old_fields), controls(new_fields)
    def footprints(region):
        return {row['islandId']: (row['landRuns'], row['physicalOrigin']) for row in region['islandRecords']}

    rows = {'changedLandWaterCells': int(np.count_nonzero((old_bed > 0) != (new_bed > 0))),
            'unchangedRegionalSeaDepths': bool(np.array_equal(old_bed[old_bed <= 0], new_bed[old_bed <= 0])),
            'unchangedFootprintsAndOrigins': footprints(old_region) == footprints(new_region),
            'unchangedRegionalNetwork': old_region['waterNetwork'] == new_region['waterNetwork'],
            'unchangedPlatePressureAndWetness': old_macro == new_macro,
            'wetnessBeltTransitionMean': old_macro['wetnessBeltTransitionMean']}
    for key, region, inherited, bed in [('before', old_region, old_inherited, old_bed),
                                        ('after', new_region, new_inherited, new_bed)]:
        slopes = np.hypot(*np.gradient(bed)) * subdivision
        inland_slopes = slopes[old_inherited > INLAND_LIMIT]
        inherited_share, inherited_mean = curvature_metrics(inherited, old_inherited, subdivision)
        final_share, final_mean = curvature_metrics(bed, old_inherited, subdivision)
        rows[key] = {
            'inheritedInlandSeamShare': inherited_share,
            'inheritedInlandMeanSeamJump': inherited_mean,
            'finalInlandSeamShare': final_share,
            'finalInlandMeanSeamJump': final_mean,
            'inlandSlopeMedianP95': [float(v) for v in np.quantile(inland_slopes, [.5, .95])] if inland_slopes.size else [],
            'longestStraightCoastMacroCells': longest_shore_run(bed) / subdivision,
            'origins': region['summary']['originCounts'],
            'connectedCapacity': [row['largestConnectedEligibleCount'] for row in region['summary']['areaSensitivity']]
        }
    return rows


def plot_pair(seed, before, after, macro_control):
    old_revision, region, old_fields, old_inherited, old_bed = before
    new_revision, _, new_fields, new_inherited, new_bed = after
    grid = region['grid']
    subdivision = grid['subdivision']
    fig, axs = plt.subplots(2, 2, figsize=(11.7, 8.3), facecolor='white')
    fig.subplots_adjust(left=.07, right=.91, top=.83, bottom=.10, wspace=.15, hspace=.31)
    heading = 'Тектоника и климат на макросетке' if macro_control else 'Склоны региональных островов'
    fig.text(.07, .95, f'{heading} · {seed}', fontsize=21, weight='bold')
    fig.text(.07, .9, f'{old_revision[:7]}   /   {new_revision[:7]}   ·   одинаковые шкалы в каждой паре', fontsize=10)

    def pair(row, rasters, title, cmap, norm, units):
        for col, values in enumerate(rasters):
            ax = axs[row, col]
            ax.set_title(f'{title} · {"до" if col == 0 else "после"}', fontsize=11, loc='left')
            image = ax.imshow(values, cmap=cmap, norm=norm, interpolation='nearest')
            ax.set(xticks=[], yticks=[])
        fig.colorbar(image, ax=axs[row].tolist(), shrink=.8, label=units)

    if macro_control:
        def field(source, name):
            data = source[name]
            return np.asarray(data['values']).reshape(data['height'], data['width'])
        for row, name, title in [(0, 'platePressureField', 'Давление плит'), (1, 'wetnessField', 'Влажность')]:
            rasters = [field(fields, name) for fields in (old_fields, new_fields)]
            pair(row, rasters, title, 'viridis', plt.Normalize(min(arr.min() for arr in rasters),
                                                              max(arr.max() for arr in rasters)), 'Индекс поля')
        fig.text(.07, .04, 'Макрополя показаны как контроль масштаба влияния регионального изменения.', fontsize=9)
    else:
        island = max(region['islandRecords'], key=lambda row: row['areaCells'])
        cells = np.concatenate([np.arange(start, start + length) for start, length in island['landRuns']])
        y, x = np.divmod(cells, grid['width'])
        crop = (slice(max(0, y.min() - 9), y.max() + 10), slice(max(0, x.min() - 9), x.max() + 10))
        pair(0, [bed[crop] for bed in (old_bed, new_bed)], 'Высота и глубина', 'BrBG',
             TwoSlopeNorm(0, -.06, .35), 'Относительная высота')
        jumps = []
        for bed in (old_inherited, new_inherited):
            jump = np.zeros_like(bed)
            jump[:, 1:-1] += variations(bed, 1, subdivision)[0]
            jump[1:-1, :] += variations(bed, 0, subdivision)[0].T
            jumps.append(np.where(old_inherited[crop] > INLAND_LIMIT, jump[crop], np.nan))
        finite = np.asarray(jumps)[np.isfinite(jumps)]
        peak = max(1e-8, np.quantile(finite, .99)) if finite.size else 1e-8
        pair(1, jumps, 'Скачок уклона внутри суши', 'magma', PowerNorm(.5, 0, peak), 'Высота / макроклетку')
        fig.text(.07, .04, f'{island["islandId"]}   ·   сетка ×{subdivision}   ·   цветовая шкала скачков до 99-го процентиля пары',
                 fontsize=9)
    return fig


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('baseline', type=Path)
    parser.add_argument('candidate', type=Path)
    parser.add_argument('atlas', type=Path)
    parser.add_argument('seeds', type=int, nargs='+')
    parser.add_argument('--maps', type=int, nargs='+')
    parser.add_argument('--macro-map', type=int)
    args = parser.parse_args()
    result = {'baselineRevision': None, 'candidateRevision': None, 'worlds': {}}
    with PdfPages(args.atlas) as pdf:
        for seed in args.seeds:
            before, after = [load_snapshot(path, seed) for path in (args.baseline, args.candidate)]
            if result['baselineRevision'] is None:
                result['baselineRevision'], result['candidateRevision'] = before[0], after[0]
            assert (before[0], after[0]) == (result['baselineRevision'], result['candidateRevision'])
            result['worlds'][seed] = metrics(before, after)
            if args.maps is None or seed in args.maps or seed == args.macro_map:
                figure = plot_pair(seed, before, after, seed == args.macro_map)
                pdf.savefig(figure)
                plt.close(figure)
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
