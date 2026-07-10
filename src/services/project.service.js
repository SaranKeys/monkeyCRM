import prisma from "../config/prisma.js";

export const createProject = async (projectData) => {
  const { milestones, ...coreData } = projectData;

  const existingProject = await prisma.project.findFirst({
    where: {
      name: { equals: coreData.name, mode: "insensitive" },
      clientId: coreData.clientId,
    },
  });

  if (existingProject) {
    const err = new Error(
      `Duplicate Alert: A project named '${coreData.name}' already exists for this client.`,
    );
    err.isDuplicate = true;
    throw err;
  }

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
      service: { select: { name: true, icon: true } },
    },
  });
};

export const getAllProjects = async (page = 1, limit = 9, filters = {}, user) => {
  const skip = (page - 1) * limit;
  const { search, status, priority, health } = filters;

  const AND = [];

  if (user) {
    if (user.role === "EMPLOYEE") {
      const profile = await prisma.employeeProfile.findUnique({
        where: { userId: user.id }
      });
      if (profile) {
        AND.push({
          OR: [
            { leadId: profile.id }, 
            { memberIds: { has: profile.id } } 
          ]
        });
      }
    } else if (user.role === "CLIENT") {
      const profile = await prisma.clientProfile.findUnique({
        where: { userId: user.id }
      });
      if (profile) {
        AND.push({ clientId: profile.id });
      }
    }
  }

  if (status && status !== "All") AND.push({ status });
  if (priority && priority !== "All priorities") AND.push({ priority });

  if (search) {
    AND.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { client: { companyName: { contains: search, mode: "insensitive" } } },
        { lead: { legalName: { contains: search, mode: "insensitive" } } },
      ]
    });
  }

  const whereClause = AND.length > 0 ? { AND } : {};

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
        service: { select: { name: true, icon: true } },
        phases: { 
          select: { 
            tasks: { select: { status: true } } 
          } 
        }
      },
    }),
  ]);

  const now = new Date();

  const formattedProjects = projects.map((project) => {
    const totalTasks = project.phases.reduce((acc, phase) => acc + phase.tasks.length, 0);
    const completedTasks = project.phases.reduce((acc, phase) => {
      return acc + phase.tasks.filter(t => t.status === "DONE").length;
    }, 0);

    const progressPercentage =
      totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    const latestMilestone = project.milestones.reduce((latest, current) => {
      return !latest || new Date(current.dueDate) > new Date(latest.dueDate)
        ? current
        : latest;
    }, null);

    const hasOverdueMilestones = project.milestones.some(
      (m) => !m.isCompleted && new Date(m.dueDate) < now,
    );
    const calculatedHealth = hasOverdueMilestones ? "AT_RISK" : "ON_TRACK";

    const { milestones, phases, ...projectData } = project;

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

  const hasMembers = project.memberIds && project.memberIds.length > 0;
  const hasLead = project.leadId !== null;

  if (hasMembers || hasLead) {
    const err = new Error("Action blocked: Project contains active personnel.");
    err.isAssigned = true; 
    throw err;
  }

  return await prisma.project.delete({
    where: { id: projectId },
  });
};

export const getProjectById = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: {
        select: { id: true, companyName: true, contactName: true, contactEmail: true },
      },
      service: {
        select: { id: true, name: true, icon: true, page2Fields: true },
      },
      lead: { select: { id: true, legalName: true, designation: true } },
      members: { select: { id: true, legalName: true, designation: true } },
      milestones: { orderBy: { dueDate: "asc" } },
      phases: { 
        select: { 
          tasks: { select: { status: true } } 
        } 
      }
    },
  });

  if (!project) {
    const err = new Error("Project not found");
    err.code = "P2025";
    throw err;
  }

  const now = new Date();

  const totalTasks = project.phases.reduce((acc, phase) => acc + phase.tasks.length, 0);
  const completedTasks = project.phases.reduce((acc, phase) => {
    return acc + phase.tasks.filter(t => t.status === "DONE").length;
  }, 0);

  const progressPercentage =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

  const latestMilestone = project.milestones.reduce((latest, current) => {
    return !latest || new Date(current.dueDate) > new Date(latest.dueDate)
      ? current
      : latest;
  }, null);

  const hasOverdueMilestones = project.milestones.some(
    (m) => !m.isCompleted && new Date(m.dueDate) < now,
  );

  const calculatedHealth = hasOverdueMilestones ? "AT_RISK" : "ON_TRACK";
  
  const { phases, ...projectData } = project;

  return {
    ...projectData,
    progressPercentage,
    dueDate: latestMilestone ? latestMilestone.dueDate : null,
    health: calculatedHealth,
  };
};

export const getProjectTeam = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      lead: {
        select: {
          id: true,
          legalName: true,
          profilePhotoUrl: true,
          designation: true,
        },
      },
      members: {
        select: {
          id: true,
          legalName: true,
          profilePhotoUrl: true,
          designation: true,
        },
      },
    },
  });

  return project;
};

export const updateProject = async (projectId, updateData) => {
  return await prisma.project.update({
    where: { id: projectId },
    data: updateData,
    include: {
      client: { select: { companyName: true, contactName: true } },
      lead: { select: { legalName: true, profilePhotoUrl: true } },
    },
  });
};
