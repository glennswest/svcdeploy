var util = require('util');

var exec=require('child_process').exec;

var svc_person = {name:'svcperson', image:'glennswest/rockbase', port:"8080", stateful:true,mnt:'/data'};
var svc_mqtt   = {name:'svcmqtt',   image:'glennswest/svcmqtt',  port:"8080", stateful:true,mnt:'/data'};

//var deploy_list = [svc_person,
//                   svc_mqtt];
var deploy_list = [svc_person];

workq = [];

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


function dodeploy(thevalue)
{
     console.log(util.inspect(thevalue));
     console.log('Deploying ' + thevalue.name);
     deploycontainer(thevalue.name,thevalue.image);
     if (thevalue.stateful){
        deployvolume(thevalue.name,thevalue.mnt);
        }
     deployport(thevalue.name,thevalue.port);
}

function deploy(thelist)
{
	thelist.forEach(dodeploy);
} 

deploy(deploy_list);
