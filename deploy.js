var util = require('util');

var exec=require('child_process').exec;

var projects = ['rsc','serve1','serv2','serv3'];

var svc_person = {name:'svcperson', image:'glennswest/rockbase', port:"8080", stateful:true,mnt:'/data'};
var svc_mqtt   = {name:'svcmqtt',   image:'glennswest/svcmqtt',  port:"8080", stateful:true,mnt:'/work'};

var server1_person = svc_person;
var server2_person = svc_person;
var server3_person = svc_person;

server1_person.project = "serv1";
server2_person.project = "serv2";
server3_person.project = "serv3";

server1_mqtt = svc_mqtt;
server2_mqtt = svc_mqtt;
server3_mqtt = svc_mqtt;

server1_mqtt.project = "serv1";
server2_mqtt.project = "serv2";
server3_mqtt.project = "serv3";

var deploy_list = [server1_person,
                   server2_person,
                   server3_person,
                   server1_mqtt,
                   server2_mqtt,
                   server3_mqtt];

workq = [];
project = "";

function dosystem(thecmdline)
{
	thevalue = {};
        thevalue.cmd = thecmdline;
        workq.push(thevalue);
        if (workq.length == 1){
           dosystemexec();
           }
}

function dosystemexec()
{
        
        if (workq.length == 0){
           return;
           }
        thevalue = workq[0];
        thecmdline = thevalue.cmd;
        child = exec(thecmdline,(error, stdout, stderr) => {
                if (error){
                   console.log("Error On Exec: " + util.inspect(error) + "");
                   }
                });
        child.on('close',function(data){
               workq.shift(); // Remove currently operating entry
               dosystemexec();
               });
        child.stderr.on('data',function(data){
            console.log(data.toString());
            });
        child.stdout.on('data',function(data){
            thevalue = data.toString();
            console.log(thevalue);
            });
}

function deployvolume(name,mntpoint)
{
// oc volume dc/svcperson --add --mount-path=/data --type=persistentVolumeClaim --claim-name=svcperson

         dosystem('oc volume dc/' + name + ' --add  --mount-path=' + mntpoint + ' --type=persistentVolumeClaim ' + '--claim-name=' + name +
                  ' --claim-mode="ReadWriteOnce" --claim-size=10G');


}

function deploycontainer(name,image)
{

         dosystem('oc new-app ' + image + ' --name ' + name);
}

function deployport(name,port)
{
         dosystem('oc expose dc/' + name + ' --port=' + port); 
}

function deploysvc(name)
{
	dosystem('oc expose svc/' + name);

}

function deployliveness(name)
{
// oc set probe dc/svcperson --liveness --get-url='http://:8080/healthz'

   dosystem('oc set probe dc/' + name + " --liveness --get-url='http://:8080/healthz'");
}

function changeproject(thename)
{
    if (project != thename){
       dosystem('oc project ' + thename);
       project = thename;
       }
}


function dodeploy(thevalue)
{
     console.log(util.inspect(thevalue));
     console.log('Deploying ' + thevalue.name);
     deploycontainer(thevalue.name,thevalue.image);
     if (thevalue.stateful){
        deployvolume(thevalue.name,thevalue.mnt);
        }
     deployport(thevalue.name,thevalue.port);
     deploysvc(thevalue.name);
     deployliveness(thevalue.name);
}


function deploy(thelist)
{
	thelist.forEach(dodeploy);
} 

function createproject(thename)
{
	dosystem('oc new-project ' + thename);
}

function create_projects(thelist)
{
	thelist.forEach(createproject);
}

create_projects(projects);
deploy(deploy_list);
