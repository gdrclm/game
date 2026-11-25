"""Compare actual WorldGen phase snapshots. These observations are advisory."""
import heapq
import itertools
import json
import math
from collections import Counter, defaultdict, deque
from pathlib import Path

import numpy as np


class World:
    def __init__(self, file):
        self.data = json.loads(file.read_text())
        self.seed = self.data["seed"]
        self.debug = self.data.get("diagnostics", {}).get("physicalWorldDebugBundle")
        if not self.debug:
            return
        self.outputs = {row["artifactId"].removeprefix("foundation_geometry_"): row["payload"]
                        for row in self.debug["intermediateOutputs"]
                        if row["artifactId"].startswith("foundation_geometry_")}
        self.graphs = {row["sourceLayerId"]: row["payload"] for row in self.debug["graphSnapshots"]}
        self.mask = self.field("coastJaggednessControlledLandWaterMaskField")
        self.width, self.height = self.mask["width"], self.mask["height"]
        self.land = np.asarray(self.mask["values"]) >= self.mask["threshold"]
        self.topology = self.outputs["coastalAccessTopology"]
        self.island_cells = {cell for island in self.topology["islands"] for cell in island["cellIndices"]}
        self.port_cells = {port["waterCellIndex"] for port in self.topology["ports"]}
        self.routes = self.outputs["macroRoutes"]["candidateRoutes"]
        self.hybrid = self.graphs["hybridConnectivityGraph"]
        self.nodes = {node["nodeId"]: node for node in self.hybrid["nodes"]}
        self.edges = {edge["edgeId"]: edge for edge in self.hybrid["edges"]}
        self.adjacency = defaultdict(list)
        for edge in self.edges.values():
            cost = max(0.01, edge.get("traversalCost", edge["coarseRouteCost"]))
            left, right = edge["fromNodeId"], edge["toNodeId"]
            self.adjacency[left].append((right, cost))
            self.adjacency[right].append((left, cost))

    def field(self, name):
        return next((row["payload"] for row in self.debug["fieldSnapshots"]
                     if row["payload"]["fieldId"] == name), None)

    def points(self, cells):
        cells = np.asarray(cells, dtype=int)
        return np.column_stack((cells % self.width, cells // self.width))

    def neighbors(self, cell):
        x, y = cell % self.width, cell // self.width
        if x > 0:
            yield cell - 1
        if x < self.width - 1:
            yield cell + 1
        if y > 0:
            yield cell - self.width
        if y < self.height - 1:
            yield cell + self.width

    def water_path(self, start, end, blocked):
        if start in blocked or end in blocked:
            return None
        parents = {start: None}
        queue = deque([start])
        while queue:
            cell = queue.popleft()
            if cell == end:
                path = []
                while cell is not None:
                    path.append(cell)
                    cell = parents[cell]
                return path[::-1]
            for neighbor in self.neighbors(cell):
                if not self.land[neighbor] and neighbor not in parents and neighbor not in blocked:
                    parents[neighbor] = cell
                    queue.append(neighbor)
        return None

    def land_bodies(self):
        unvisited = set(np.flatnonzero(self.land).tolist())
        bodies = []
        while unvisited:
            start = unvisited.pop()
            queue = [start]
            for cell in queue:
                for neighbor in self.neighbors(cell):
                    if neighbor in unvisited:
                        unvisited.remove(neighbor)
                        queue.append(neighbor)
            bodies.append(queue)
        return sorted(bodies, key=lambda cells: (-len(cells), min(cells)))

    def route_steps(self, route):
        steps = set()
        for edge_id in route["edgePathIds"]:
            cells = self.edges[edge_id].get("waterPathCellIndices", [])
            steps.update((min(a, b), max(a, b)) for a, b in itertools.pairwise(cells))
        return steps

    def distances(self, source_ids):
        costs = dict.fromkeys(source_ids, 0)
        queue = [(0, source) for source in source_ids]
        heapq.heapify(queue)
        while queue:
            cost, node = heapq.heappop(queue)
            if cost > costs[node]:
                continue
            for other, weight in self.adjacency[node]:
                new_cost = cost + weight
                if new_cost < costs.get(other, math.inf):
                    costs[other] = new_cost
                    heapq.heappush(queue, (new_cost, other))
        return costs


def spread(values):
    values = list(values)
    if not values:
        return None
    return dict(zip(("min", "p10", "median", "p90", "max"),
                    (round(float(v), 5) for v in np.percentile(values, [0, 10, 50, 90, 100]))))


def summarize_passages(world):
    sea_by_id = {edge["edgeId"]: edge for edge in world.graphs["seaConnectivityGraph"]["edges"]}
    rows = []
    for passage in world.topology["islandPassages"]:
        sea = sea_by_id.get(passage["seaEdgeId"])
        path = (sea or {}).get("waterPathCellIndices", [])
        blocked = set(passage["restrictedCellIndices"])
        after = None
        if len(path) < 2:
            status = "missing_path"
        elif path[0] in blocked or path[-1] in blocked:
            status = "endpoint_confounded"
        elif any(not any(not world.land[n] and n not in blocked for n in world.neighbors(port))
                 for port in (path[0], path[-1])):
            status = "terminal_access_confounded"
        else:
            bypass = world.water_path(path[0], path[-1], blocked)
            if bypass is None:
                status = "disconnected_after_closure"
            else:
                after = len(bypass) - 1
                status = "measured_detour" if after > len(path) - 1 else "no_detour"
        rows.append({"id": passage["passageId"], "status": status, "width": round(passage["widthCells"], 3),
                     "closedCells": len(blocked), "routesUsingFootprint": len(passage["routeIds"]),
                     "beforeCells": len(path) - 1 if path else None, "afterCells": after})
    return rows


def summarize_morphology(world):
    def shore(cells):
        water_edges = sum(not world.land[n] for cell in cells for n in world.neighbors(cell))
        return water_edges, round(water_edges / (4 * math.sqrt(len(cells))), 3)

    bodies = world.land_bodies()
    published = world.outputs["continentBodies"]["continentBodies"]
    retained = {cell: continent["recordDraft"]["continentId"] for continent in published for cell in continent["cellIndices"]}
    mainland = []
    for cells in bodies:
        overlap = Counter(retained[cell] for cell in cells if cell in retained)
        if overlap and overlap.most_common(1)[0][1] > len(cells) / 2:
            mainland.append((cells, overlap.most_common(1)[0][0]))
    distances = np.full(world.land.size, -1, dtype=int)
    queue = [cell for cells, _ in mainland for cell in cells]
    distances[queue] = 0
    for cell in queue:
        for neighbor in world.neighbors(cell):
            if distances[neighbor] < 0:
                distances[neighbor] = distances[cell] + 1
                queue.append(neighbor)
    continents = []
    shapes = {continent["recordDraft"]["continentId"]: continent for continent in published}
    for cells, cid in mainland:
        xy = world.points(cells)
        covariance = np.cov(xy, rowvar=False)
        eig, direction = np.linalg.eigh(covariance)
        axis = direction[:, -1]
        edges, complexity = shore(cells)
        continents.append({
            "id": cid, "areaCells": len(cells), "coastEdges": edges, "coastComplexity": complexity,
            "centroid": [round(v, 2) for v in xy.mean(axis=0)],
            "axisDegrees": round(math.degrees(math.atan2(axis[1], axis[0])) % 180, 1),
            "axisRatio": round(math.sqrt(eig[-1] / max(1, eig[0])), 3),
            "profile": shapes[cid]["macroShape"], "reliefContrast": shapes[cid]["macroShapeSignals"]["reliefContrast"]
        })
    islands = world.topology["islands"]
    peaks = world.points([r["peakCellIndex"] for r in islands])
    turns = []
    for a, b in itertools.pairwise(np.diff(peaks, axis=0)):
        cross = a[0] * b[1] - a[1] * b[0]
        turns.append(round(math.degrees(math.atan2(abs(cross), a @ b)), 3))
    hotspot = world.outputs["seaLevelModel"]["hotspotChain"] or {}
    return {
        "landFraction": round(float(world.land.mean()), 5), "landComponentAreas": [len(body) for body in bodies],
        "shorelineAttempts": len(world.outputs["seaLevelModel"]["shorelineAttempts"]),
        "continents": continents,
        "chainShore": [dict(areaCells=len(r["cellIndices"]), coastEdges=shore(r["cellIndices"])[0],
                            mainlandDistance=int(distances[r["cellIndices"]].min())) for r in islands],
        "chainOfPeaks": peaks.tolist(), "chainTurnsDegrees": turns,
        "crossTrackShifts": [r.get("crossTrackShift", 0) for r in hotspot.get("peaks", [])],
        "crustSupportGain": [round(r.get("crustSupportGain", 0), 6) for r in hotspot.get("peaks", [])]
    }


def summarize_network(world):
    # Route overlap uses undirected cardinal steps, with no credit for a shared port alone.
    sailings = [(route, world.route_steps(route)) for route in world.routes]
    sailings = [(route, steps) for route, steps in sailings if steps]
    usage = Counter(step for _, steps in sailings for step in steps)
    overlaps = []
    for (a, x), (b, y) in itertools.combinations(sailings, 2):
        if {a["fromNodeId"], a["toNodeId"]}.isdisjoint({b["fromNodeId"], b["toNodeId"]}):
            overlaps.append(len(x & y) / len(x | y))
    available = {node_id for node_id, node in world.nodes.items()
                 if node_id in world.adjacency or node["nodeType"] != "sea_region"}
    contextual_nodes = len(world.nodes) - len(available)
    paths = {node: world.distances([node]) for node in sorted(available)}
    unvisited = available.copy()
    components = []
    while unvisited:
        reachable = unvisited.intersection(paths[min(unvisited)])
        components.append(len(reachable))
        unvisited.difference_update(reachable)
    transit = Counter(node for route in world.routes for node in set(route["nodePathIds"][1:-1]))
    corridors = world.outputs["macroCorridors"]["macroCorridors"]
    outages = [sample for corridor in corridors for sample in corridor["dependenceSampleRows"]]
    return {
        "routes": len(world.routes), "sailings": len(sailings),
        "uniqueWaterFootprints": len({frozenset(steps) for _, steps in sailings}),
        "waterSteps": len(usage), "sharedWaterStepFraction": round(sum(n > 1 for n in usage.values()) / max(1, len(usage)), 5),
        "maximumRoutesOnWaterStep": max(usage.values(), default=0),
        "pairsWithDifferentTerminals": len(overlaps), "pairJaccard": spread(overlaps),
        "disjointPairCount": sum(value == 0 for value in overlaps),
        "graphNodeCount": len(available), "contextualBasinCount": contextual_nodes,
        "componentSizes": sorted(components, reverse=True),
        "reachablePairFraction": round(sum(n * (n - 1) for n in components) / max(1, len(available) * (len(available) - 1)), 5),
        "travelCost": spread(cost for source, distances in paths.items() for target, cost in distances.items()
                             if source < target),
        "sampledTransit": spread(transit[node] / max(1, len(world.routes)) for node in available),
        "harmonicCentrality": spread(sum(1 / cost for cost in distances.values() if cost) / max(1, len(available) - 1)
                                   for distances in paths.values()),
        "corridorClasses": dict(Counter(c["corridorDependenceClass"] for c in corridors)),
        "closurePairs": len(outages), "blockedPairs": sum(row["blockedWithoutCorridor"] for row in outages),
        "altCosts": spread(row["alternativeRouteCost"] for row in outages if row["alternativeRouteCost"] is not None),
        "altPenalty": spread(row["relativeDetourPenalty"] for row in outages if row["relativeDetourPenalty"] is not None)
    }


def summarize_contrast(world):
    iso = world.outputs["isolationAnalysis"]
    cores = set(iso["coreAnchorNodeIds"])
    core_cost = world.distances(cores)
    island_ports = {p["coastalNodeId"] for p in world.topology["ports"] if p["islandId"]}
    groups = defaultdict(list)
    for row in iso["nodeIsolationRows"]:
        if not row["projectable"]:
            continue
        group = ("core" if row["coreAnchor"] else "island" if row["sourceCoastalNodeId"] in island_ports
                 else "mainlandCoast" if row["nodeType"] == "coastal_terminal" else "mainlandInterior")
        groups[group].append(row)
    fields = ["routeCoverageCount", "distanceFromCore", "resupplyCost", "weatherAdjustedIsolation",
              "autonomousSurvivalScore", "lossInCollapseLikelihood", "peripheryScore"]
    diagnostics = world.outputs["macroValidationDiagnostics"]["scoreBreakdown"]["centerPeripheryContrast"]
    phase2 = world.data.get("phase2", {})
    recovery = phase2.get("environmentalRhythmPackage", {}).get("synthesized", {}).get("recoveryProfile", {})
    return {
        "score": diagnostics["score"], "scoreComponents": diagnostics["componentScores"],
        "coreAnchorCount": len(cores),
        "groups": {group: {
            "nodes": len(rows), "coreTravelCost": spread(core_cost[r["nodeId"]] for r in rows if r["nodeId"] in core_cost),
            **{field: spread(r[field] for r in rows) for field in fields}
        } for group, rows in sorted(groups.items())},
        "regionalSegments": len(world.outputs["regionalSegmentationAnalysis"]["regionalSegments"]),
        "peripheryClusterCount": len(world.outputs["peripheryClusters"]["clusters"]),
        "phase2Recovery": recovery.get("summary", {}).get("mean")
    }


def summarize(world):
    row = {"seed": world.seed, "exportedPhase2": "phase2" in world.data}
    if "error" in world.data:
        row["error"] = world.data["error"]
    if world.debug:
        row.update(passages=summarize_passages(world), morphology=summarize_morphology(world),
                   network=summarize_network(world), contrast=summarize_contrast(world))
    return row


def main():
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("baseline", type=Path)
    parser.add_argument("candidate", type=Path)
    parser.add_argument("seeds", nargs="+", type=int)
    args = parser.parse_args()
    result = {"schema": "worldgen-v1-f8q-comparison-v1", "worlds": []}
    for seed in args.seeds:
        before = World(args.baseline / f"seed-{seed}.json")
        after = World(args.candidate / f"seed-{seed}.json")
        result["baselineRevision"] = before.data.get("revision")
        result["candidateRevision"] = after.data.get("revision")
        result["worlds"].append({"seed": seed, "baseline": summarize(before), "candidate": summarize(after)})
    print(json.dumps(result, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
