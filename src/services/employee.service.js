import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const createEmployee = async (employeeData, documentUrls) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: employeeData.email },
  });
  if (existingUser) {
    const err = new Error("Email is already registered");
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(employeeData.password, 10);

  return await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: employeeData.email,
        password: hashedPassword,
        role: "EMPLOYEE",
      },
    });

    const newProfile = await tx.employeeProfile.create({
      data: {
        userId: newUser.id,
        legalName: employeeData.legalName,
        preferredName: employeeData.preferredName,
        dob: employeeData.dob,
        gender: employeeData.gender,
        personalMobile: employeeData.personalMobile,
        bloodGroup: employeeData.bloodGroup,
        emergencyName: employeeData.emergencyName,
        emergencyRelation: employeeData.emergencyRelation,
        emergencyPhone: employeeData.emergencyPhone,
        aadhaarNumber: employeeData.aadhaarNumber,
        panNumber: employeeData.panNumber,
        currentAddress: employeeData.currentAddress,
        permanentAddress: employeeData.permanentAddress,
        accountName: employeeData.accountName,
        bankName: employeeData.bankName,
        accountNumber: employeeData.accountNumber,
        ifscCode: employeeData.ifscCode,
        branchName: employeeData.branchName,
        designation: employeeData.designation,
        department: employeeData.department,
        reportingManager: employeeData.reportingManager,
        employmentType: employeeData.employmentType,
        workMode: employeeData.workMode,
        baseLocation: employeeData.baseLocation,
        dateOfJoining: employeeData.dateOfJoining,
        probationDays: employeeData.probationDays,
        totalExperience: employeeData.totalExperience,
        relevantExp: employeeData.relevantExp,

        profilePhotoUrl: documentUrls.profilePhotoUrl,
        aadhaarFrontUrl: documentUrls.aadhaarFrontUrl,
        aadhaarBackUrl: documentUrls.aadhaarBackUrl,
        panPhotoUrl: documentUrls.panPhotoUrl,
        addressProofUrl: documentUrls.addressProofUrl,
        bankDocumentUrl: documentUrls.bankDocumentUrl,
      },
    });

    return { user: newUser, profile: newProfile };
  });
};

export const getAllEmployees = async () => {
  return await prisma.employeeProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { email: true, isActive: true, role: true },
      },
    },
  });
};

export const getEmployeeById = async (profileId) => {
  const employee = await prisma.employeeProfile.findUnique({
    where: { id: profileId },
    include: {
      user: {
        select: { email: true, isActive: true, role: true },
      },
    },
  });

  if (!employee) {
    const err = new Error("Employee not found");
    err.code = "P2025";
    throw err;
  }
  return employee;
};

export const updateEmployee = async (profileId, updateData) => {
  return await prisma.employeeProfile.update({
    where: { id: profileId },
    data: updateData,
    include: {
      user: {
        select: { email: true, isActive: true },
      },
    },
  });
};

export const deleteEmployee = async (profileId) => {
  const profile = await prisma.employeeProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    const err = new Error("Employee not found");
    err.code = "P2025";
    throw err;
  }

  const deletedUser = await prisma.user.delete({
    where: { id: profile.userId },
    include: { employeeProfile: true },
  });
  return deletedUser;
};
