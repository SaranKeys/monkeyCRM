import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const allowedExtensions = ['.jpeg', '.jpg', '.png', '.pdf'];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        console.log(`[Upload Blocked] Name: ${file.originalname} | Mimetype sent: ${file.mimetype}`);
        cb(new Error(`Invalid file type. Only JPEG, PNG, and PDF are allowed.`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export const uploadEmployeeDocs = upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'panPhoto', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
    { name: 'bankDocument', maxCount: 1 },
]);

export const uploadClientDocs = upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'msa', maxCount: 1 },
    { name: 'nda', maxCount: 1 },
    { name: 'taxCert', maxCount: 1 },
    { name: 'brandAssets', maxCount: 1 }
]);


// for attachments in TASKs
const dynamicFileFilter = (req, file, cb) => {
    if (
        file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') || 
        file.mimetype === 'application/pdf'
    ) {
        cb(null, true);
    } else {
        console.log(`[Upload Blocked] Name: ${file.originalname} | Mimetype sent: ${file.mimetype}`);
        cb(new Error(`Invalid file type. Only Images, Videos, and PDFs are allowed for tasks.`), false);
    }
};

const dynamicUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: dynamicFileFilter,
    limits: { fileSize: 50 * 1024 * 1024 },  
});

export const uploadTaskFiles = dynamicUpload.array('files', 5);