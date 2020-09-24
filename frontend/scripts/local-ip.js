const os = require('os')
var ifaces = os.networkInterfaces()

function getLocalIp() {
    const interfaces = {} // key is the IP address, value the network adapter name

    console.log('Looking up network interfaces')
    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0

        ifaces[ifname].forEach(function (iface) {
            // Skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            if ('IPv4' !== iface.family || iface.internal !== false)
                return

            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                console.log(ifname + ':' + alias, iface.address)
                interfaces[iface.address] = ifname + ':' + alias
            } else {
                // this interface has only one ipv4 adress
                console.log(ifname, iface.address)
                interfaces[iface.address] = ifname + ':' + alias
            }
            ++alias
        })
    })

    const ipAddresses = Object.keys(interfaces) // keys are the ip addresses

    if (ipAddresses.length == 0) {
        console.error('Could not determine the local IP address for serverUrl, defaulting to localhost')
        return 'localhost'

    } else if (ipAddresses.length == 1) {
        var ip = ipAddresses[0]
        let type = interfaces[ip]
        if (type.toLowerCase().indexOf('wi-fi') !== -1 && type.toLowerCase().indexOf('wifi') !== -1)
            console.warn('Network interface does not appear to be WiFi.  Builds pushed to a phone may not be able to connect to the sever')

        return ip
    } else {
        // Prefer a WiFi network interface
        let wifiIP = null
        ipAddresses.forEach(ip => {
            if (interfaces[ip].toLowerCase().indexOf('wi-fi') !== -1 || interfaces[ip].toLowerCase().indexOf('wifi') !== -1) {
                console.log('Found Wi-Fi network interface candidate: ' + interfaces[ip])
                wifiIP = ip
            }
        })
        if(wifiIP)
            return wifiIP

        console.error('Could not determine WiFi network interface. Using ' + ipAddresses[0] + ' ' + interfaces[ipAddresses[0]])
        return ipAddresses[0]
    }
}


module.exports = {
    getLocalIp: getLocalIp
}