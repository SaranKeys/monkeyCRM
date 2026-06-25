// import { google } from 'googleapis';
// import path from 'path';
// import { Readable } from 'stream';

// const KEY_FILE_PATH = path.join(process.cwd(), 'google-credentials.json');
// const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// const auth = new google.auth.GoogleAuth({
//     keyFile: KEY_FILE_PATH,
//     scopes: ['https://www.googleapis.com/auth/drive.file'],
// });

// const drive = google.drive({ version: 'v3', auth });


// export const uploadFileToDrive = async (fileBuffer, fileName, mimeType) => {
//     try {
//         const bufferStream = new Readable();
//         bufferStream.push(fileBuffer);
//         bufferStream.push(null);

//         const response = await drive.files.create({
//             requestBody: {
//                 name: `${Date.now()}_${fileName}`,
//                 parents: [FOLDER_ID],
//             },
//             media: {
//                 mimeType: mimeType,
//                 body: bufferStream,
//             },
//             fields: 'id, webViewLink',
//         });

//         await drive.permissions.create({
//             fileId: response.data.id,
//             requestBody: {
//                 role: 'reader',
//                 type: 'anyone',
//             },
//         });

//         return response.data.webViewLink;
//     } catch (error) {
//         console.error('[Google Drive Upload Error]:', error);
//         throw new Error('Failed to upload document to storage server');
//     }
// };


import { google } from 'googleapis';
import { Readable } from 'stream';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'  
);

oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export const uploadFileToDrive = async (fileBuffer, fileName, mimeType, prefix = "") => {
    try {
        const bufferStream = new Readable();
        bufferStream.push(fileBuffer);
        bufferStream.push(null);

        const finalFileName = prefix ? `${prefix}_${fileName}` : `${Date.now()}_${fileName}`;

        const response = await drive.files.create({
            requestBody: {
                name: finalFileName,  
                parents: [FOLDER_ID],
            },
            media: {
                mimeType: mimeType,
                body: bufferStream,
            },
            fields: 'id, webViewLink',
        });

        await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        return response.data.webViewLink;
    } catch (error) {
        console.error('[Google Drive Upload Error]:', error);
        throw new Error('Failed to upload document to storage server');
    }
};