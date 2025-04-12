import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Portal-specific API routes
  app.get("/api/dashboard/:portalType", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const portalType = req.params.portalType;
    const user = req.user;

    if (user.portalType !== portalType) {
      return res.status(403).json({ 
        message: "Access forbidden: You don't have permission to access this portal" 
      });
    }

    // Return dashboard data based on portal type
    let dashboardData: any = {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        portalType: user.portalType,
      }
    };
    
    // We would add specific data for each portal type here
    // This is just the basic structure
    switch (portalType) {
      case "student":
        dashboardData = {
          ...dashboardData,
          stats: {
            progress: 78,
            activeCourses: 3,
            nextPayment: "15/07/2023",
          },
          courses: []
        };
        break;
      case "partner":
        dashboardData = {
          ...dashboardData,
          stats: {
            students: 42,
            commission: 1250.00,
            pendingPayment: 750.00,
          },
          referrals: []
        };
        break;
      case "polo":
        dashboardData = {
          ...dashboardData,
          stats: {
            activeStudents: 126,
            newEnrollments: 15,
            revenue: 24680.00,
          },
          locations: []
        };
        break;
      case "admin":
        dashboardData = {
          ...dashboardData,
          stats: {
            totalUsers: 1528,
            totalInstitutions: 23,
            monthlyRevenue: 156400.00,
          },
          recentActivity: []
        };
        break;
    }

    res.json(dashboardData);
  });

  const httpServer = createServer(app);

  return httpServer;
}
