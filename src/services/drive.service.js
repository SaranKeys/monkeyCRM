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

    console.log(`\n[Drive Upload Init] Environment Check:`);
    console.log(`- CLIENT_ID exists: ${!!CLIENT_ID}`);
    console.log(`- CLIENT_SECRET exists: ${!!CLIENT_SECRET}`);
    console.log(`- REFRESH_TOKEN exists: ${!!REFRESH_TOKEN}`);
    console.log(`- FOLDER_ID exists: ${!!FOLDER_ID}`);

    try {

        console.log(`[Drive Upload] Attempting to upload: ${fileName} | MimeType: ${mimeType} | Size: ${fileBuffer?.length} bytes`);
        
        const bufferStream = new Readable();
        bufferStream.push(fileBuffer);
        bufferStream.push(null);
          
        const finalFileName = prefix ? `${prefix}_${fileName}` : `${Date.now()}_${fileName}`;
        console.log(`[Drive Upload] Final computed file name: ${finalFileName}`);

        console.log(`[Drive Upload] Sending file stream to Google Drive...`);
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
        
        console.log(`[Drive Upload] Successfully created file! File ID: ${response.data.id}`);

        console.log(`[Drive Upload] Setting permissions to 'anyone/reader'...`);
        await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });
        console.log(`[Drive Upload] Permissions set successfully.`);

        return {
            url : response.data.webViewLink,
            driveFileId: response.data.id
        }
    } catch (error) {
        console.error('\n==================== [GOOGLE DRIVE UPLOAD FATAL ERROR] ====================');
        console.error('[Standard Error Message]:', error.message);
        
        if (error.response && error.response.data) {
            console.error('[Google API Detailed Error]:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('[Full Error Object]:', error);
        }
        console.error('===========================================================================\n');
        
        throw new Error('Failed to upload document to storage server');
    }
};

export const deleteFileFromDrive = async (driveFileId) => {
    try {
        console.log(`[Drive Delete] Attempting to delete file ID: ${driveFileId}`);
        await drive.files.delete({ fileId: driveFileId });
        console.log(`[Drive Delete] Successfully deleted file ID: ${driveFileId}`);
        return true;
    } catch (error) {
        console.error('\n==================== [GOOGLE DRIVE DELETE FATAL ERROR] ====================');
        console.error('[Standard Error Message]:', error.message);
        
        if (error.response && error.response.data) {
            console.error('[Google API Detailed Error]:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('[Full Error Object]:', error);
        }
        console.error('===========================================================================\n');
        
        throw new Error('Failed to delete file from Google Drive');
    }
};