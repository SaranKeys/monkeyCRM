import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";

export const createClient = async (clientData, fileUrls) => {
  const { email, password, role, ...profileData } = clientData;

  const hashedPassword = await bcrypt.hash(password, 10);

  const record = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "CLIENT",
      },
    });

    const profile = await tx.clientProfile.create({
      data: {
        userId: user.id,

        companyName: profileData.companyName,
        brandName: profileData.brandName,
        website: profileData.website,
        industry: profileData.industry,
        companySize: profileData.companySize,
        foundedYear: profileData.foundedYear,
        description: profileData.description,
        linkedin: profileData.linkedin,

        contactName: profileData.contactName,
        contactEmail: profileData.contactEmail,
        contactPhone: profileData.contactPhone,
        contactDesignation: profileData.contactDesignation,
        contactMethod: profileData.contactMethod,
        timezone: profileData.timezone,

        additionalContacts: profileData.additionalContacts || [],

        registeredAddress: profileData.registeredAddress,
        operatingAddress: profileData.operatingAddress,
        country: profileData.country,

        billingCurrency: profileData.billingCurrency,
        billingContact: profileData.billingContact,
        billingEmail: profileData.billingEmail,
        taxId: profileData.taxId,
        paymentTerms: profileData.paymentTerms,
        paymentMethod: profileData.paymentMethod,
        poRequired: profileData.poRequired,

        clientSince: profileData.clientSince,
        source: profileData.source,
        accountOwner: profileData.accountOwner,
        engagementType: profileData.engagementType,
        status: profileData.status,

        ...fileUrls,
      },
    });

    return { user, profile };
  });

  return record;
};

export const getAllClients = async () => {
    return await prisma.clientProfile.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { email: true, isActive: true } }
        }
    });
};

export const getClientById = async (profileId) => {
    const client = await prisma.clientProfile.findUnique({
        where: { id: profileId },
        include: {
            user: { select: { email: true, isActive: true } }
        }
    });

    if (!client) {
        const err = new Error('Client not found');
        err.code = 'P2025';
        throw err;
    }
    return client;
};

export const updateClient = async (profileId, updateData) => {
    return await prisma.clientProfile.update({
        where: { id: profileId },
        data: updateData,
        include: {
            user: { select: { email: true, isActive: true } }
        }
    });
};

export const deleteClient = async (profileId) => {
    const profile = await prisma.clientProfile.findUnique({ where: { id: profileId } });
    if (!profile) {
        const err = new Error('Client not found');
        err.code = 'P2025';
        throw err;
    }

    return await prisma.user.delete({
        where: { id: profile.userId },
        include: { clientProfile: true }
    });
};