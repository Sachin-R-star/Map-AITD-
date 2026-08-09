import { PathNode, IPathNode } from '../models/PathNode';

export class RoutingService {
  /**
   * Helper: Calculate Haversine distance between two coordinates in meters
   */
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radius of Earth in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Find shortest path using A* Pathfinding Algorithm
   */
  static async findRoute(
    startNodeId: string,
    endNodeId: string,
    options: { accessibleOnly?: boolean; maxGrade?: number } = {}
  ): Promise<IPathNode[] | null> {
    // 1. Fetch all nodes to build graph in-memory for A* execution speed
    const nodes = await PathNode.find().lean();
    const nodeMap = new Map<string, typeof nodes[0]>();
    for (const node of nodes) {
      nodeMap.set(node.nodeId, node);
    }

    const startNode = nodeMap.get(startNodeId);
    const endNode = nodeMap.get(endNodeId);
    if (!startNode || !endNode) return null;

    // Open set: nodes to be evaluated (using Array, sorted or searched for min fScore)
    const openSet: string[] = [startNodeId];

    // cameFrom[n] = node immediately preceding it on the cheapest path
    const cameFrom = new Map<string, string>();

    // gScore[n] = cost of the cheapest path from start to n currently known
    const gScore = new Map<string, number>();
    gScore.set(startNodeId, 0);

    // fScore[n] = gScore[n] + h(n), representing current best guess
    const fScore = new Map<string, number>();
    fScore.set(
      startNodeId,
      this.calculateDistance(
        startNode.coordinates[1],
        startNode.coordinates[0],
        endNode.coordinates[1],
        endNode.coordinates[0]
      )
    );

    const getHScore = (nodeId: string): number => {
      const node = nodeMap.get(nodeId);
      if (!node) return Infinity;
      return this.calculateDistance(
        node.coordinates[1],
        node.coordinates[0],
        endNode.coordinates[1],
        endNode.coordinates[0]
      );
    };

    while (openSet.length > 0) {
      // Find node in openSet with lowest fScore
      let currentId = openSet[0];
      let lowestF = fScore.get(currentId) ?? Infinity;
      for (const id of openSet) {
        const f = fScore.get(id) ?? Infinity;
        if (f < lowestF) {
          lowestF = f;
          currentId = id;
        }
      }

      // If we reached the destination, reconstruct the path
      if (currentId === endNodeId) {
        const path: IPathNode[] = [];
        let curr: string | undefined = currentId;
        while (curr) {
          const dbNode = await PathNode.findOne({ nodeId: curr });
          if (dbNode) path.unshift(dbNode);
          curr = cameFrom.get(curr);
        }
        return path;
      }

      // Remove currentId from openSet
      const index = openSet.indexOf(currentId);
      if (index > -1) {
        openSet.splice(index, 1);
      }

      const currentNode = nodeMap.get(currentId);
      if (!currentNode) continue;

      for (const edge of currentNode.edges) {
        // Accessibility Constraints
        if (options.accessibleOnly && !edge.stepFree) {
          continue; // Skip inaccessible edge
        }
        if (options.maxGrade !== undefined && edge.grade !== undefined && edge.grade > options.maxGrade) {
          continue; // Skip too steep edge
        }

        const neighborId = edge.targetNodeId;
        const tentativeGScore = (gScore.get(currentId) ?? Infinity) + edge.distance;

        if (tentativeGScore < (gScore.get(neighborId) ?? Infinity)) {
          cameFrom.set(neighborId, currentId);
          gScore.set(neighborId, tentativeGScore);
          fScore.set(neighborId, tentativeGScore + getHScore(neighborId));

          if (!openSet.includes(neighborId)) {
            openSet.push(neighborId);
          }
        }
      }
    }

    return null; // No route found
  }
}
