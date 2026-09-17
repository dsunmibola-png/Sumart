import type {
  Request,
  Response,
} from "express";

import {
  getDashboardAnalytics,
} from "../services/dashboardService";

export const getDashboard =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const dashboard =
        await getDashboardAnalytics();

      return res.status(200).json(
        dashboard
      );
    } catch (error) {
      console.error(
        "Dashboard analytics error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load dashboard analytics",
      });
    }
  };