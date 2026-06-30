import prisma from "../config/prisma.js";

export const createProject = async (projectData) => {
  const { milestones, ...coreData } = projectData;

  return await prisma.project.create({
    data: {
      ...coreData,
      milestones: {
        create: milestones,
      },
    },
    include: {
      client: { select: { companyName: true, contactName: true } },
      lead: { select: { id: true, legalName: true, designation: true } },
      members: { select: { id: true, legalName: true } },
      milestones: { orderBy: { dueDate: "asc" } },
      service: { select: { name: true, icon: true } }
    },
  });
};

export const getAllProjects = async (page = 1, limit = 9, filters = {}) => {
  const skip = (page - 1) * limit;
  const { search, status, priority, health } = filters;

  const whereClause = {};

  if (status && status !== "All") whereClause.status = status;
  if (priority && priority !== "All priorities")
    whereClause.priority = priority;

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { client: { companyName: { contains: search, mode: "insensitive" } } },
      { lead: { legalName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [totalProjects, projects] = await Promise.all([
    prisma.project.count({ where: whereClause }),
    prisma.project.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { companyName: true } },
        lead: { select: { id: true, legalName: true } },
        members: { select: { id: true, legalName: true } }, 
        milestones: { select: { id: true, isCompleted: true, dueDate: true } },
        service: { select: { name: true, icon: true } }
      },
    }),
  ]);

  const now = new Date();

  const formattedProjects = projects.map((project) => {
    const totalMilestones = project.milestones.length;
    const completedMilestones = project.milestones.filter(
      (m) => m.isCompleted,
    ).length;

    const progressPercentage =
      totalMilestones === 0
        ? 0
        : Math.round((completedMilestones / totalMilestones) * 100);

    const latestMilestone = project.milestones.reduce((latest, current) => {
      return !latest || new Date(current.dueDate) > new Date(latest.dueDate)
        ? current
        : latest;
    }, null);

    const hasOverdueMilestones = project.milestones.some(
      (m) => !m.isCompleted && new Date(m.dueDate) < now,
    );
    const calculatedHealth = hasOverdueMilestones ? "AT_RISK" : "ON_TRACK";

    const { milestones, ...projectData } = project;

    return {
      ...projectData,
      progressPercentage,
      dueDate: latestMilestone ? latestMilestone.dueDate : null,
      health: calculatedHealth,
    };
  });

  let finalProjects = formattedProjects;
  let finalTotal = totalProjects;

  if (health && health !== "All health") {
    finalProjects = formattedProjects.filter((p) => p.health === health);
    finalTotal = finalProjects.length;
  }

  return {
    projects: finalProjects,
    pagination: {
      totalRecords: finalTotal,
      currentPage: page,
      limit: limit,
      totalPages: Math.ceil(finalTotal / limit),
      hasNextPage: page < Math.ceil(finalTotal / limit),
      hasPrevPage: page > 1,
      filtersApplied: filters,
    },
  };
};

export const deleteProject = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    const err = new Error("Project not found");
    err.code = "P2025";
    throw err;
  }

  return await prisma.project.delete({
    where: { id: projectId },
  });
};
