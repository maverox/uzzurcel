const {exec} = require('child_process');
const path = require('path');
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3')
const mime = require('mime-types');
const { log } = require('console');
const s3CLient = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: 'AKIAXYKJUWVFCTZARDO5',
        secretAccessKey: '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',


    }
});

async function init() {
    console.log('Executing script.js');
    const outDirPath = path.join(__dirname, 'output');
    
    const p = exec(`cd ${outDirPath} && npm install && npm run build`);
    p.stdout.on('data', (data) => {
        console.log(data.toString());
    });
    p.stdout.on('error', (data) => {
        console.log('Error', data.toString());
    });
    p.on('close', async () => {
        console.log(`Build completed with exited with code ${code}`);
        const distFolderPath = path.join(outDirPath, 'dist');
        const distFolderContents = fs.readdirSync(distFolderPath, {recursive: true});

        for(const file of distFolderContents) {
            if(fs.lstatSync(file).isDirectory())  continue;
            console.log('uploading to s3', file);


            const command = new PutObjectCommand({
                Bucket: 'uzzurcel',
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(file),
                ContentType: mime.lookup(file)
            });
            await s3CLient.send(command);

            console.log('Uploaded to s3', file);
        }
        console.log('Done !!');

    });

}
init();