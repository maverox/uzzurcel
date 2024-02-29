const {exec} = require('child_process');
const path = require('path');
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3')
const mime = require('mime-types');
const { log } = require('console');
const fs = require('fs');
const Redis = require('ioredis');
require('dotenv').config();

const PROJECT_ID = process.env.PROJECT_ID;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const redisUri = process.env.REDIS_URI;
// console.log('PROJECT_ID', PROJECT_ID);
// console.log('accessKeyId', accessKeyId);
// console.log('secretAccessKey', secretAccessKey);
const publisher = new Redis(redisUri || 'rediss://default:AVNS_3PufbSGknfc4JCBT9Vw@redis-74756b6-uzzurcel.a.aivencloud.com:18898');

function publishLog(log) {
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify(log));
}
const s3CLient = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId,
        secretAccessKey,
    }
});


async function init() {
    console.log('Executing script.js');
    publishLog(`Starting Build for ${PROJECT_ID}`);
    const outDirPath = path.join(__dirname, 'output');
    
    const p = exec(`cd ${outDirPath} && npm install && npm run build`);
    p.stdout.on('data', (data) => {
        console.log(data.toString());
        publishLog(data.toString());
    });
    p.stdout.on('error', (data) => {
        console.log('Error', data.toString());
        publishLog(`Error: ${data.toString()}`);
    });
    p.on('close', async (code) => {
        console.log('Build completed');
        publishLog(`Build completed`);
        const distFolderPath = path.join(outDirPath, 'dist');
        const distFolderContents = fs.readdirSync(distFolderPath, {recursive: true});
        
        publishLog(`Starting to upload to s3`);
        for(const file of distFolderContents) {
            const filePath = path.join(distFolderPath, file);
            if(fs.lstatSync(filePath).isDirectory())  continue;
            console.log('uploading to s3', filePath);
            publishLog(`Uploading to s3: ${filePath}`)

            const command = new PutObjectCommand({
                Bucket: 'uzzurcel',
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath)
            });
            await s3CLient.send(command);
            
            console.log('Uploaded completed to s3');
        }
        publishLog(`Upload to s3 completed`);

    });

}
init();