const express = require('express');
const path = require('path');
const httpProxy = require('http-proxy');

const app = express();
const PORT = process.env.PORT || 8000;
const BASE_PATH = 'https://uzzurcel.s3.ap-south-1.amazonaws.com/__outputs/';
const proxy = httpProxy.createProxy();

app.use((req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];
    const projectId = subdomain;

    const resolvesTo = `${BASE_PATH}${projectId}/index.html`; 
    console.log('resolvesTo', resolvesTo);
    return proxy.web(req, res, {
        target: resolvesTo,
        changeOrigin: true
    });


})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});