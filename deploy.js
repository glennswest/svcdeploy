var mdns = require('mdns-js');
var util = require('util');
var process = require('process');
var fssync = require('fs-sync');
var fs = require('fs');

var execFile=require('child_process').execFile;
myIP = process.env.myIP;
console.log("My IP is: " + myIP);

servers = [];

var ad = mdns.createAdvertisement(mdns.tcp('mqtt'), 1883,{
          name:'svcmqtt',
          txt:{
            txtvers:'1'
           }
         });
ad.start();


// Start up server
function restart_server(data){

        if (!data){
           console.log("Starting Mosquitto");
          } else {
           console.log("Mosquitto - " + data + "Restarting");
          }
        child = execFile('/usr/sbin/mosquitto',['-v','-c','/etc/mosquitto/mosquitto.conf'], {cwd: "/etc/mosquitto"}, (error, stdout, stderr) => {
                if (error){
                   console.log(stderr);
                   console.log("Error On Exec: " + util.inspect(error) + "");
                   }
                console.log(stdout);
                //restart_server("Restarting Mosquitto");
                });
        console.log("Server PID= " + util.inspect(child.pid) + "");
        child.stderr.on('data',function(data){
            console.log(data.toString());
            });
        child.stdout.on('data',function(data){
            console.log(data.toString());
            });
        server_pid = child.pid;
}

// mosquitto-base.conf
function update_config()
{
	theline = "address ";
        servers.forEach(function(element){
              theline = theline + element.ip + ":1883  ";
              });
	options = {};
        options.force = true;
        fssync.copy('/etc/mosquitto/mosquitto-base.conf','/etc/mosquitto/mosquitto.conf',options);
        fs.appendFileSync('/etc/mosquitto/mosquitto.conf','\n# Updated by svcmqtt\n');
        if (servers.length == 0) return; // Dont do empty connections
        fs.appendFileSync('/etc/mosquitto/mosquitto.conf','connection sitecom\n');
        fs.appendFileSync('/etc/mosquitto/mosquitto.conf',theline);
        fs.appendFileSync('/etc/mosquitto/mosquitto.conf',"start_type automatic");
}



// watch all mqtt servers 
var browser = mdns.createBrowser(mdns.tcp('mqtt'));
browser.on('ready', function onReady(){
      console.log('browser is ready');
      setTimeout(restart_server,3000);
      browser.discover();
      });
//service up:  { addresses: [ '192.168.1.231' ],
//  query: [],
//  port: 1883,
//  fullname: 'svcmqtt._mqtt._tcp.local',
//  txt: [ 'txtvers=1' ],
//  type: 
//   [ { name: 'mqtt',
//       protocol: 'tcp',
//       subtypes: [],
//       description: undefined },
//     { name: 'mqtt',
//       protocol: 'tcp',
//       subtypes: [],
//       description: undefined } ],
//  host: 'svcmqtt.local',
//  interfaceIndex: 2,
//  networkInterface: 'pseudo multicast' }

function findIP(ipaddr){
     return servers.ip === ipaddr;
     }
function add_server(s)
{
   update_config();
   if (s.ip == myIP){
      console.log("Ignoring: Self");
      return;
      }
   x = servers.find(o => o.ip === s.ip);
   if (!x){
       servers.push(server);
       console.log(util.inspect(s));
       console.log("Added " + s.ip);
       }
}
browser.on('update', function(service) {
  server = {};
  //console.log("service up: ", service);
  ip = service.addresses[0];
  service.type.forEach(function(element){
       if (element.name == 'mqtt'){
          server.ip = ip;
          add_server(server);
          }
       });
});


