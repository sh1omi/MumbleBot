const mumble = require('mumble');
const dateFormat = require('dateformat');
const http = require('http');
const fs = require('fs');

let options = {
    key: fs.readFileSync( 'key.pem' ),
    cert: fs.readFileSync( 'cert.pem' )
};

let cmd = {},permissions = {};

console.log( 'Connecting' );
mumble.connect( 'mumble://example.server', options, (error,client) => { // Replace the ip of the mumble server.
    if( error ) { throw new Error( error ); }
    console.log( 'Connected' );
    client.authenticate( 'your_bot_nickname' ); // Replace your bot nickname.

    client.on( 'initialized', () => {
        console.log( 'Connection initialized' );
        LoadModules();
    });

    client.on( 'message', (message,user,scope) => {
        let type = {};
        if(scope.charAt(0)=='c') type = {channel_id:[user.channel.id]};
        else type = {session:[user.session]};
        console.log(type);
        if(message.charAt(0)=='!'){ // You can change the prefix '!' for the commands.
            console.log("["+dateFormat(new Date(), "HH:MM:ss")+" / "+user.channel.name+"] "+user.name+": "+message);
            let msg = {};
            msg.params = message.split(" ");
            msg.cmd = msg.params[0].substr(1).toLowerCase();
            msg.params.shift();
            msg.type = type;
            if (typeof cmd[msg.cmd] != "undefined") {
                let level = 1;
                if(typeof permissions[user.hash] != "undefined") level = permissions[user.hash];
                if(typeof cmd[msg.cmd][0] == "function") {
                    if(level >= cmd[msg.cmd][1]) cmd[msg.cmd][0](msg,user,client);
                    else client.sendMessage("You dont have enough power to do the command: "+msg.cmd,type);
                }else {
                    if(level >= cmd[cmd[msg.cmd]][1]) cmd[cmd[msg.cmd]][0](msg,user,client);
                    else client.sendMessage("You dont have enough power to do the command: "+msg.cmd,type);
                }
            }else client.sendMessage("Hmm, you need help? type !help :)",type);
        }
    });
});

let LoadModules = () => {
    let help = "";
    cmd = {};
    fs.readdirSync(require("path").join(__dirname, "commands")).forEach(function(file) {
        delete require.cache[require.resolve("./commands/" + file)];
        let command = require("./commands/" + file);
        console.log(file+" loaded.");
        for (let i = 0;i < command.length; i++) {
            cmd[command[i].alias[0]] = [];
            cmd[command[i].alias[0]][0] = command[i].action;
            cmd[command[i].alias[0]][1] = command[i].level;
            help += "!"+command[i].alias[0];
            if(command[i].alias.length!=1){
                help += "(";
                for (let y = 1;y < command[i].alias.length; y++) {
                    cmd[command[i].alias[y]] = command[i].alias[0];
                    help += "!"+command[i].alias[y]+", ";
                }
            help = help.substring(0, help.length-2) + ")";
        }
        help += ", ";
    }
    });
    help += " !level, !reload";

    /* Extra Commands */
    cmd['help'] = [];
    cmd['help'][0] = (msg,user,client) => {
        client.sendMessage(help,msg.type);
    };
    cmd['help'][1] = 1;

    cmd['level'] = [];
    cmd['level'][0] = (msg,user,client)=> {
        if(msg.params.length!=2) client.sendMessage(msg.cmd+" [hash] [level]",msg.type);
        else{
        if(isNaN(msg.params[1])) return client.sendMessage(msg.cmd+" [hash] [Must be a number]",msg.type);
        let levels;
        levels = JSON.parse(fs.readFileSync('data/permissions.json', 'utf8'));
        levels[msg.params[0]] = parseInt(msg.params[1]);
        fs.writeFile('data/permissions.json', JSON.stringify(levels), function(err) {
            if(err) return console.log(err);
            client.sendMessage(msg.params[0]+" is now level "+msg.params[1],msg.type);
        });
        permissions = levels;
        }
    };
    cmd['level'][1] = 10;

    cmd['reload'] = [];
    cmd['reload'][0] = (msg,user,client) => {
        LoadModules();
        client.sendMessage(Object.keys(cmd).length + " commands loaded",msg.type);
    };
    cmd['reload'][1] = 10;

    fs.writeFile("data/help.json", help, function(err) {
        if(err) return console.log(err);
    });
};

/* Files */
fs.writeFile("data/permissions.json", "{}", { flag: 'wx' }, function (err) {
    if(err.code != "EEXIST") return console.log(err);
});
fs.readFile("data/permissions.json", "utf8", function (err,data) {
  if (err) return console.log(err);
  permissions = JSON.parse(data);
});