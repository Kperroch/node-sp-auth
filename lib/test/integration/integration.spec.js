"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const request = require("request-promise");
const _ = require("lodash");
const http = require("http");
const https = require("https");
const url = require("url");
const spauth = require("./../../src/index");
const config_1 = require("./../../src/config");
let config = require('./config');
let tests = [
    {
        name: 'on-premise user credentials',
        creds: config.onpremCreds,
        url: config.onpremNtlmEnabledUrl
    },
    {
        name: 'on-premise user UPN credentials',
        creds: config.onpremUpnCreds,
        url: config.onpremNtlmEnabledUrl
    },
    {
        name: 'on-premise user+domain credentials',
        creds: config.onpremUserWithDomainCreds,
        url: config.onpremNtlmEnabledUrl
    },
    {
        name: 'fba on-premise user credentials',
        creds: config.onpremFbaCreds,
        url: config.onpremFbaEnabledUrl
    },
    {
        name: 'adfs online user credentials',
        creds: config.onlineWithAdfsCreds,
        url: config.onlineUrl
    },
    {
        name: 'online user credentials',
        creds: config.onlineCreds,
        url: config.onlineUrl
    },
    {
        name: 'on-premise addin only',
        creds: config.onpremAddinOnly,
        url: config.onpremAdfsEnabledUrl
    },
    {
        name: 'online addin only',
        creds: config.onlineAddinOnly,
        url: config.onlineUrl
    },
    {
        name: 'adfs user credentials',
        creds: config.adfsCredentials,
        url: config.onpremAdfsEnabledUrl
    },
    {
        name: 'ondemand - online',
        creds: {
            ondemand: true
        },
        url: config.onlineUrl
    },
    {
        name: 'ondemand - on-premise with ADFS',
        creds: {
            ondemand: true
        },
        url: config.onpremAdfsEnabledUrl
    },
    {
        name: 'file creds - online',
        creds: null,
        url: config.onlineUrl
    },
    {
        name: 'file creds - on-premise - NTLM',
        creds: null,
        url: config.onpremNtlmEnabledUrl
    },
    {
        name: 'file creds - on-premise - ADFS',
        creds: null,
        url: config.onpremAdfsEnabledUrl
    }
];
tests.forEach(test => {
    describe(`node-sp-auth: integration - ${test.name}`, () => {
        it('should get list title with core http(s)', function (done) {
            this.timeout(90 * 1000);
            let parsedUrl = url.parse(test.url);
            let documentTitle = 'Documents';
            let isHttps = parsedUrl.protocol === 'https:';
            let send = isHttps ? https.request : http.request;
            let agent = isHttps ? new https.Agent({ rejectUnauthorized: false }) :
                new http.Agent();
            spauth.getAuth(test.url, test.creds)
                .then(response => {
                let options = getDefaultHeaders();
                let headers = _.assign(options.headers, response.headers);
                if (response.options && response.options['agent']) {
                    agent = response.options['agent'];
                }
                send({
                    host: parsedUrl.host,
                    hostname: parsedUrl.hostname,
                    port: parseInt(parsedUrl.port, 10),
                    protocol: parsedUrl.protocol,
                    path: `${parsedUrl.path}_api/web/lists/getbytitle('${documentTitle}')`,
                    method: 'GET',
                    headers: headers,
                    agent: agent
                }, clientRequest => {
                    let results = '';
                    clientRequest.on('data', chunk => {
                        results += chunk;
                    });
                    clientRequest.on('error', chunk => {
                        done(new Error('Unexpected error during http(s) request'));
                    });
                    clientRequest.on('end', () => {
                        let data = JSON.parse(results);
                        chai_1.expect(data.d.Title).to.equal(documentTitle);
                        done();
                    });
                }).end();
            })
                .catch(done);
        });
        it('should get list title', function (done) {
            this.timeout(90 * 1000);
            let documentTitle = 'Documents';
            spauth.getAuth(test.url, test.creds)
                .then(response => {
                let options = getDefaultHeaders();
                _.assign(options.headers, response.headers);
                _.assign(options, response.options);
                options.url = `${test.url}_api/web/lists/getbytitle('${documentTitle}')`;
                return request.get(options);
            })
                .then((data) => {
                chai_1.expect(data.body.d.Title).to.equal(documentTitle);
                done();
            })
                .catch(done);
        });
        it('should get Title field', function (done) {
            this.timeout(90 * 1000);
            let fieldTitle = 'Title';
            spauth.getAuth(test.url, test.creds)
                .then(response => {
                let options = getDefaultHeaders();
                _.assign(options.headers, response.headers);
                _.assign(options, response.options);
                options.url = `${test.url}_api/web/fields/getbytitle('${fieldTitle}')`;
                return request.get(options);
            })
                .then(data => {
                chai_1.expect(data.body.d.Title).to.equal(fieldTitle);
                done();
            })
                .catch(done);
        });
        it('should not setup custom options for request', function (done) {
            spauth.setup({
                requestOptions: {
                    headers: {}
                }
            });
            config_1.request.get('http://google.com', {
                simple: false,
                resolveWithFullResponse: true
            })
                .then((result) => {
                chai_1.expect(result.request.headers['my-test-header']).equals(undefined);
                done();
            })
                .catch(done);
        });
        it('should setup custom options for request', function (done) {
            spauth.setup({
                requestOptions: {
                    headers: {
                        'my-test-header': 'my value'
                    }
                }
            });
            config_1.request.get('http://google.com', {
                simple: false,
                resolveWithFullResponse: true
            })
                .then((result) => {
                chai_1.expect(result.request.headers['my-test-header']).equals('my value');
                done();
            })
                .catch(done);
        });
    });
});
function getDefaultHeaders() {
    let options = _.assign({}, {
        headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose'
        },
        json: true,
        strictSSL: false,
        resolveWithFullResponse: true,
        simple: true
    });
    return options;
}
//# sourceMappingURL=integration.spec.js.map