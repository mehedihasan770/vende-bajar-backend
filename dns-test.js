const dns = require('dns');
const { promisify } = require('util');
const resolveSrv = promisify(dns.resolveSrv);

async function testDNS(serverName, servers) {
    console.log(`\n--- Testing with DNS Servers: [${servers.join(', ')}] ---`);
    try {
        if (servers.length > 0) {
            dns.setServers(servers);
        } else {
            console.log('Using System Default DNS');
        }

        const target = `_mongodb._tcp.${serverName}`;
        console.log(`Resolving SRV: ${target}`);

        const startTime = Date.now();
        const addresses = await resolveSrv(target);
        const duration = Date.now() - startTime;

        console.log(`✅ SUCCESS (${duration}ms)`);
        console.log('Found addresses:', JSON.stringify(addresses, null, 2));
    } catch (err) {
        console.error(`❌ FAILED: ${err.code} - ${err.message}`);
    }
}

const serverToTest = 'cluster1.gy2g1ol.mongodb.net';

async function run() {
    // 1. Test with default system DNS
    await testDNS(serverToTest, []);

    // 2. Test with Google DNS
    await testDNS(serverToTest, ['8.8.8.8', '8.8.4.4']);

    // 3. Test with Cloudflare DNS
    await testDNS(serverToTest, ['1.1.1.1', '1.0.0.1']);
}

run();
