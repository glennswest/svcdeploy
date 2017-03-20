var util = require('util');

var exec=require('child_process').exec;

var svc_bill      = {name:'svcbill',      image:'glennswest/rockbase', port:"8080", stateful:true,mnt:'/data'};
var svc_devown    = {name:'svcdevown',    image:'glennswest/rockbase', port:"8080", stateful:true,mnt:'/data'};
var svc_devsee    = {name:'svcdevsee',    image:'glennswest/rockbase', port:"8080", stateful:true,mnt:'/data'};
var svc_devloc    = {name:'svcdevloc',    image:'glennswest/rockbase', port:"8080", stateful:true,mnt:'/data'};
var svc_loceui    = {name:'svcloceui',    image:'glennswest/rockbase', port:"8080", stateful:true,mnt:'/data'};
var svc_locpxy    = {name:'svclocpxy',    image:'glennswest/rockbase', port:"8080", stateful:true,mnt:'/data'};
var svc_nomloc    = {name:'svcnomloc',    image:'glennswest/rockbase', port:"8080", stateful:true,mnt:'/data'};
var svc_person    = {name:'svcperson',    image:'glennswest/rockbase', port:"8080", stateful:true,mnt:'/data'};
var svc_personloc = {name:'svcpersonloc', image:'glennswest/rockbase', port:"8080", stateful:true,mnt:'/data'};
var svc_rawloc    = {name:'svcrawloc',    image:'glennswest/rockbase', port:"8080", stateful:true,mnt:'/data'};
var svc_room      = {name:'svcroom',      image:'glennswest/rockbase', port:"8080", stateful:true,mnt:'/data'};
var svc_roomdev   = {name:'svcroomdev',   image:'glennswest/rockbase', port:"8080", stateful:true,mnt:'/data'};
var svc_senexp    = {name:'svcsenexp',    image:'glennswest/rockbase', port:"8080", stateful:false};
var svc_mqtt      = {name:'svcmqtt',      image:'glennswest/svcmqtt',  port:"8080", stateful:true,mnt:'/work'};


var deploy_list = [svc_bill,
                   svc_devown,
                   svc_devsee,
                   svc_devloc,
                   svc_loceui,
                   svc_locpxy,
                   svc_nomloc,
                   svc_person,
                   svc_personloc,
                   svc_rawloc,
                   svc_room,
                   svc_roomdev,
                   svc_senexp,
                   svc_mqtt];

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

deploy(deploy_list);
