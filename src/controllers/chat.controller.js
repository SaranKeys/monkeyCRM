import * as chatService from '../services/chat.service.js';

export const getChatHistory = async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;

        const [messages, totalMessages] = await Promise.all([
            chatService.getProjectChatHistory(projectId, page, limit),
            chatService.getChatCount(projectId)
        ]);
        
        return res.status(200).json({ 
            status: "success", 
            data: messages,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalMessages / limit),
                totalMessages,
                hasMore: (page * limit) < totalMessages 
            }
        });
    } catch (error) {
        console.error("[Chat History Error]:", error);
        return res.status(500).json({ status: "fail", message: error.message });
    }
};