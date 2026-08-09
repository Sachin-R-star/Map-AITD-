import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RoutingService } from '../services/routing.service';
import { PathNode } from '../models/PathNode';

export const routeQuerySchema = z.object({
  query: z.object({
    startNodeId: z.string().min(1, 'startNodeId is required'),
    endNodeId: z.string().min(1, 'endNodeId is required'),
    accessibleOnly: z
      .string()
      .optional()
      .transform(val => val === 'true'),
    maxGrade: z
      .string()
      .optional()
      .transform(val => (val ? parseFloat(val) : undefined))
  })
});

export const handleGetRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startNodeId, endNodeId, accessibleOnly, maxGrade } = req.query as any;

    console.log(
      `[Navigation Controller] Route query from ${startNodeId} to ${endNodeId} (accessibleOnly: ${accessibleOnly})`
    );

    const path = await RoutingService.findRoute(startNodeId, endNodeId, {
      accessibleOnly: !!accessibleOnly,
      maxGrade
    });

    if (!path || path.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'No route found between selected points.'
      });
      return;
    }

    // Convert the computed path nodes into GeoJSON LineString coordinates
    const coordinates = path.map(node => node.coordinates);

    res.status(200).json({
      status: 'success',
      data: {
        type: 'Feature',
        properties: {
          startNodeId,
          endNodeId,
          accessibleOnly: !!accessibleOnly,
          nodeSequence: path.map(node => node.nodeId)
        },
        geometry: {
          type: 'LineString',
          coordinates // [[lng, lat], [lng, lat], ...]
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
export default handleGetRoute;
