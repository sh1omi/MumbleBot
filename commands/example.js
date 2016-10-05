'use strict';
module.exports = [
  {
    alias:['example'],
    level: 1,
    action: (msg,user,client) => {
      client.sendMessage("sh1omi",msg.type);
    }
  },
  {
    alias:['example2'],
    level: 5,
    action: (msg,user,client) => {
      client.sendMessage("hello?",msg.type);
    }
  },
  {
    alias:['gethash'],
    level: 1,
    action: (msg,user,client) => {
      if(msg.params.length == 0) client.sendMessage(msg.cmd+" [name]",msg.type);
			else {
        let target = client.userByName(msg.params[0]);
        if(target) client.sendMessage(target.hash,msg.type);
        else client.sendMessage("Could not find someone with that name.",msg.type);
      }
    }
  }
];