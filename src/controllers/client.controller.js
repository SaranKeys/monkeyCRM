import * as clientService from '../services/client.service.js';
import { uploadFileToDrive } from '../services/drive.service.js';
import { registerClientSchema } from '../validations/client.validation.js';

export const registerClient = async (req, res) => {
    try {
        const validationResult = registerClientSchema.shape.body.safeParse(req.body);
        
        if (!validationResult.success) {
            const structuralErrors = validationResult.error.issues.map(e => ({ 
                field: e.path.join('.'), 
                message: e.message 
            }));
            return res.status(400).json({ status: 'fail', errors: structuralErrors });
        }

        const validatedData = validationResult.data;

        const cleanCompanyName = validatedData.companyName.trim().replace(/\s+/g, '_');
        const filePrefix = `Client_${cleanCompanyName}`;

        const reqFiles = req.files || {};
        
        const uploadTasks = {
            logoUrl: reqFiles['logo'] ? uploadFileToDrive(reqFiles['logo'][0].buffer, reqFiles['logo'][0].originalname, reqFiles['logo'][0].mimetype, filePrefix) : Promise.resolve(null),
            msaUrl: reqFiles['msa'] ? uploadFileToDrive(reqFiles['msa'][0].buffer, reqFiles['msa'][0].originalname, reqFiles['msa'][0].mimetype, filePrefix) : Promise.resolve(null),
            ndaUrl: reqFiles['nda'] ? uploadFileToDrive(reqFiles['nda'][0].buffer, reqFiles['nda'][0].originalname, reqFiles['nda'][0].mimetype, filePrefix) : Promise.resolve(null),
            taxCertUrl: reqFiles['taxCert'] ? uploadFileToDrive(reqFiles['taxCert'][0].buffer, reqFiles['taxCert'][0].originalname, reqFiles['taxCert'][0].mimetype, filePrefix) : Promise.resolve(null),
            brandAssetsUrl: reqFiles['brandAssets'] ? uploadFileToDrive(reqFiles['brandAssets'][0].buffer, reqFiles['brandAssets'][0].originalname, reqFiles['brandAssets'][0].mimetype, filePrefix) : Promise.resolve(null),
        };

        const resolvedUrls = {};
        const keys = Object.keys(uploadTasks);
        const results = await Promise.all(Object.values(uploadTasks));

        keys.forEach((key, index) => {
            if (results[index]) {
                resolvedUrls[key] = results[index];
            }
        });

        const record = await clientService.createClient(validatedData, resolvedUrls);

        return res.status(201).json({
            status: 'success',
            message: 'Client registered successfully.',
            data: {
                userId: record.user.id,
                profileId: record.profile.id,
                companyName: record.profile.companyName
            }
        });

    } catch (error) {
        console.error('[Client Registration Error]:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({ status: 'fail', message: 'A user with this email already exists.' });
        }
        
        return res.status(error.statusCode || 500).json({ 
            status: 'fail', 
            message: error.message || 'Internal Server Error' 
        });
    }
};