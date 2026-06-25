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

export const uploadEmployeeDocs = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },  
}).fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'panPhoto', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
    { name: 'bankDocument', maxCount: 1 },
]);