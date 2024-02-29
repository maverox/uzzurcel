const express = require('express');
const { generateSlug } = require('random-word-slugs');
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');
const { Server } = require('socket.io');
const Redis = require('ioredis');
require('dotenv').config(
    {
        path: './.env'
    }

);

const app = express();
const redisUri = process.env.REDIS_URI;
const subscriber = new Redis(redisUri);
const port = process.env.PORT || 9000;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const io = new Server({
    cors: '*'
});
io.listen(9001, () => {
    console.log('socket server listening at http://localhost:9001');
});
io.on('connection', (socket) => {
    socket.on('subscribe', (channel) => {
        socket.join(channel);
        socket.emit('message', 'subscribed to ' + channel);
    });
})
app.use(express.json());

const ecsClient = new ECSClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId,
        secretAccessKey
    }
});

app.get('/', (req, res) => {
    res.send('Hello World!');
}
);

const config = {
    CLUSTER: 'arn:aws:ecs:ap-south-1:533267264842:cluster/builder-cluster',
    TASK_DEFINITION: 'arn:aws:ecs:ap-south-1:533267264842:task-definition/builder-task',

}

app.post('/project', async (req, res) => {
    const { gitURL, slug } = req.body;
    const projectSlug = slug ? slug : generateSlug();

    //spin up the container
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK_DEFINITION,
        launchType: 'FARGATE',
        networkConfiguration: {
            awsvpcConfiguration: {
                subnets: ['subnet-0736f0bc5a6d5910d', 'subnet-0643a73cc55bf7947', 'subnet-082ecc55f825277f0'],
                securityGroups: ['sg-0ab1d6d1b5f74d1c9'],
                assignPublicIp: 'ENABLED'
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'builder-image',
                    environment: [
                        {
                            name: 'GIT_REPOSITORY_URL',
                            value: gitURL
                        },
                        {
                            name: 'PROJECT_ID',
                            value: projectSlug
                        },
                        {
                            name: 'AWS_ACCESS_KEY_ID',
                            value: accessKeyId
                        },
                        {
                            name: 'AWS_SECRET_ACCESS_KEY',
                            value: secretAccessKey
                        }
                    ]
                }
            ]
        }
    });
    await ecsClient.send(command);
    res.json({ status: 'queued', data: { projectSlug, url: `http://${projectSlug}.localhost:8000` } });
});
async function initRedisSubscribe() {
    subscriber.psubscribe('logs:*');
    subscriber.on('pmessage', (pattern, channel, message) => {
        console.log('message', message);
        io.to(channel).emit('message', message);
    });
}
initRedisSubscribe();
app.listen(port, () => {
    console.log(`api server listening at http://localhost:${port}`);
}
);
