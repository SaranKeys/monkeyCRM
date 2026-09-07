import prisma from "../../config/prisma.js";

// 🟢 FAKE MONGODB ID FOR DEMO (Bypasses the 'system' crash)
const DEMO_USER_ID = "000000000000000000000000"; 

// 1. GET PERSONA (Fetches Live, Drafts, AND Archives!)
export const getPersona = async (req, res) => {
    try {
        const published = await prisma.saarthiPersona.findFirst({ where: { status: "PUBLISHED" } });
        
        const drafts = await prisma.saarthiPersona.findMany({ 
            where: { status: "DRAFT" },
            orderBy: { createdAt: 'desc' }
        });

        // 🟢 NEW: Fetch the historical versions!
        const archived = await prisma.saarthiPersona.findMany({
            where: { status: "ARCHIVED" },
            orderBy: { publishedAt: 'desc' } // Sort so the most recent old version is first
        });

        return res.status(200).json({ 
            status: "success", 
            data: { 
                published, 
                drafts, 
                archived // 🟢 Expose it to the frontend!
            } 
        });
    } catch (error) {
        console.error("[Get Persona Error]:", error);
        return res.status(500).json({ status: "fail", message: "Failed to fetch personas" });
    }
};

// 2. SAVE DRAFT (Create new or update existing if ID is provided)
export const savePersonaDraft = async (req, res) => {
    try {
        const { id, ...updateData } = req.body; 
        const currentUser = req.user?.id || DEMO_USER_ID;

        if (id) {
            // Update an existing specific draft
            const updatedDraft = await prisma.saarthiPersona.update({
                where: { id: id },
                data: { ...updateData }
            });
            return res.status(200).json({ status: "success", message: "Draft updated.", data: updatedDraft });
      } else {
            // Create a brand new draft
            const currentDraftCount = await prisma.saarthiPersona.count({ where: { status: "DRAFT" } });
            
            if (currentDraftCount >= 5) {
                return res.status(400).json({ status: "fail", message: "Maximum of 5 drafts allowed. Please delete one first." });
            }

            // 🟢 1. Fetch the Live Persona to use as a base template
            const published = await prisma.saarthiPersona.findFirst({ where: { status: "PUBLISHED" } });
            if (!published) {
                return res.status(400).json({ status: "fail", message: "No published persona exists to clone from!" });
            }

            // 🟢 2. Strip out the metadata we DO NOT want to copy
            const { id: pubId, createdAt, updatedAt, publishedAt, publishedBy, ...baseTemplate } = published;

            // Figure out the next version number
            const highestRecord = await prisma.saarthiPersona.findFirst({ orderBy: { version: 'desc' } });
            const nextVersion = highestRecord ? highestRecord.version + 1 : 1;

            // 🟢 3. Create the Draft (Base Template + Your Tweaks)
            const newDraft = await prisma.saarthiPersona.create({
                data: {
                    ...baseTemplate, // This safely fills in aiDisclosure, signOff, etc!
                    name: updateData.name || updateData.displayName || `Draft Persona v${nextVersion}`,
                    ...updateData,   // Your Postman JSON overwrites the specific fields
                    status: "DRAFT",
                    version: nextVersion,
                    createdBy: currentUser
                }
            });
            
            return res.status(201).json({ status: "success", message: "New draft created.", data: newDraft });
        }
    } catch (error) {
        console.error("[Save Draft Error]:", error);
        return res.status(500).json({ status: "fail", message: "Failed to save draft" });
    }
};

// 3. PUBLISH (Publish a specific draft by ID)
export const publishPersona = async (req, res) => {
    try {
        const { draftId, changeNote } = req.body; // 🟢 NOW REQUIRES draftId
        const currentUser = req.user?.id || DEMO_USER_ID;

        if (!draftId || !changeNote) {
            return res.status(400).json({ status: "fail", message: "draftId and changeNote are required." });
        }

        const draft = await prisma.saarthiPersona.findUnique({ where: { id: draftId } });
        
        if (!draft || draft.status !== "DRAFT") {
            return res.status(404).json({ status: "fail", message: "Valid draft not found." });
        }

        await prisma.$transaction(async (tx) => {
            // Archive the currently published version
            await tx.saarthiPersona.updateMany({
                where: { status: "PUBLISHED" },
                data: { status: "ARCHIVED" }
            });

            // Promote the selected Draft to Published
            await tx.saarthiPersona.update({
                where: { id: draft.id },
                data: { 
                    status: "PUBLISHED", 
                    changeNote,
                    publishedAt: new Date(),
                    publishedBy: currentUser
                }
            });

            // Log it
            await tx.saarthiAuditLog.create({
                data: {
                    action: "PUBLISH",
                    entity: "PERSONA",
                    entityId: draft.id,
                    toVersion: draft.version,
                    userId: currentUser,
                    diff: changeNote
                }
            });
        });

        return res.status(200).json({ status: "success", message: "Persona published successfully!" });
    } catch (error) {
        console.error("[Publish Error]:", error);
        return res.status(500).json({ status: "fail", message: "Failed to publish persona" });
    }
};

// 4. DELETE DRAFT (Trash a draft you don't want anymore)
export const deletePersonaDraft = async (req, res) => {
    try {
        const { id } = req.params;

        const draft = await prisma.saarthiPersona.findUnique({ where: { id } });
        if (!draft || draft.status !== "DRAFT") {
            return res.status(400).json({ status: "fail", message: "Only drafts can be deleted." });
        }

        await prisma.saarthiPersona.delete({ where: { id } });

        return res.status(200).json({ status: "success", message: "Draft deleted." });
    } catch (error) {
        console.error("[Delete Draft Error]:", error);
        return res.status(500).json({ status: "fail", message: "Failed to delete draft" });
    }
};