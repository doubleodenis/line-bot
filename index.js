const linebot = require('linebot');
var axios = require('axios');
axios.defaults.headers.common['Authorization'] = `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`;

const TIMEZONE_OFFSET = 4; //4 hrs behind

const bot = linebot({
    channelId: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    verify: true // default=true
});

var mainChatId = null;
var otherChatId = null;
function getMainChat(groupId) {
    if(!groupId) return;

    if(mainChatId == groupId || otherChatId == groupId) return;


    axios.get(`https://api.line.me/v2/bot/group/${groupId}/members/count`).then((res) => {
        axios.get(`https://api.line.me/v2/bot/group/${groupId}/summary`).then(res2 => {
            if(res.data.count > 10 && res2.data.groupName == "The Groupies" && mainChatId == null) {
                mainChatId = groupId;
                if(!happyBirthdayClockOn)
                    happyBirthday(); //start happy birthday clock
            }
            else {
                otherChatId = groupId;
            }
            console.log(res2, mainChatId, otherChatId);
        })
        .catch(err => console.log(err))
    })
    .catch((err) => console.log(err));
}



var happyBirthdayClockOn = false;

// setTimeout(happyBirthday, birthdayTimeout());

function birthdayTimeout() {
    const today = new Date();
    today.setHours(today.getHours() + TIMEZONE_OFFSET);
    const hours = today.getHours();
    
    var ampm = hours >= 12 ? 'pm' : 'am';
         
    var tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));
    tomorrow.setHours(TIMEZONE_OFFSET,0,0);
    tomorrow.setMilliseconds(0);

    var waitTime =(tomorrow.getTime() - today.getTime());

    return waitTime;
}

function happyBirthday() {

    const today = new Date();

    const birthdays = {
        "Susan": "01/09/1998",
        "Danny": "11/23/1998",
        "Marcel": "11/11/1998",
        "Abdiel": "09/14/1997",
        "Denis": "11/11/1998",
        "KC": "05/19/1998",
        "Justin": "05/01/1998",
        "Alyson": "06/02/1998",
        "Kristen": "07/30/1998",
        "Brian": "07/12/1998",
        "Lynch": "10/27/1998",
        "Darian": "01/27/1998",
        "Amelia": "08/30/2000",
        "Daniel": "04/13/2001",
        "David": "03/04/1998",
        "Marcel's mom": "01/29/1970",
        "test": "07/01/2020"
    }


    for(const name in birthdays) {
        const birthdate = new Date(birthdays[name]);
         
        if(birthdate.getMonth() + 1 == today.getMonth() + 1 && birthdate.getDate() == today.getDate()) {
            if(name != "test")
                _pushTextMessage(mainChatId, [`Happy birthday ${name}! ~From Denis`]);
            else
                _pushTextMessage(otherChatId, [`Testing my birthday timer checker at 12 am? :)`]);
        }
    }
     
    // happyBirthdayClock = setInterval(happyBirthday, birthdayTimeout()); 
    happyBirthdayClock = setTimeout(happyBirthday, birthdayTimeout());
}

function _pushTextMessage(id, _messages) {
    const messages = _messages.map(msg => {
        return {
            type: "text",
            text: msg
        }
    });

    // axios.post(`https://api.line.me/v2/bot/message/push`, {
    //     to: id,
    //     messages: messages
    // }).then(res => {
    //     console.log(`Sent bday message to ${id}`);
    // })
    // .catch(err => console.log(err))

    bot.push(id, messages);
}

function getUser(groupId, userId) {
    return axios.get(`https://api.line.me/v2/bot/group/${groupId}/member/${userId}`)
        .then((res) => res)
        .catch((err) => console.log(err));
}
let users = [];

bot.on('message', function (event) {
    console.log(event);

    if(mainChatId == null)
        getMainChat(event.source.groupId);

    event.source.profile().then(profile => {
        let found = users.find(user => user.userId == event.source.userId || profile.displayName == user.displayName)

        if(!found) { //add user
            users.push({
                userId: event.source.userId,
                user: profile.displayName,
                role: profile.displayName == "Double O' Menace" ? 'god' : 'user'
            })
        }
        else if(found && found.userId == null) { //update user
            users.forEach(user => {
                if(user.user == found.user) user.userId = event.source.userId;
            })
        }
    })

    console.log('Users: ');
    console.log(users);

    const currentUser = users.find(user => event.source.userId == user.userId);
    console.log(currentUser)
    switch (event.message.type) {
        case 'text':
            let message = event.message.text;

            //For darian
            if(message.includes('stimulate my pants') || message.includes('Stimulate my pants')) {
                event.source.profile().then(function (profile) {
                    return event.reply('** Stimulating ' + profile.displayName + "'s pants right now, wow! **");
                });
            }

            if (message.substring(0, 1) == '~') //If prepended with ~, it's a SPECIAL COMMAND
            {
                message = message.substring(1, message.length);
                if (message.length == 0) return event.reply('No command found.');
                
                const value = message.match(/"(.*?)"|\w+/g); //Matches args and commands within " " or not
                console.log(value); // should return words in quotations and without, ex: word and "word or words" but it doesn't
                const command = value[0];
                let args = value.slice(1, value.length);
                args = args.map(arg => {
                    if(arg.substring(0,1) == '"') return arg.substring(1, message.length - 1); //Remove quotations
                    else return arg;
                })

                let permission = 'user';
                if(currentUser)
                    permission = currentUser.role; //get current permission
                
                switch (command) {
                    case 'rolldie': //~rolldie <number>
                        let randomNum = Math.floor(Math.random() * (args[0] - 0) + 0); 
                        event.reply(`Dice rolled a ${randomNum}`);
                    break;
                    case 'adduser': //~adduser -@[displayName]
                        const addUserIndex = message.indexOf('-@');
                        const addUserMsg = message.slice(addUserIndex + 2, message.length);
                        users.push({
                            userId: null,
                            user: addUserMsg, //display name
                            role: 'user'
                        })
                        event.reply(`User ${addUserMsg} added`)
                    break;
                    case 'setusers': //~setusers -@[displayName] @[..displayNames]
                        const setUsersIndex = message.indexOf('-@');
                        const setUsersMsg = message.slice(setUsersIndex, message.length);
                        let names = setUsersMsg.split(' @');
                        names.forEach(name => {
                            let found = users.find(user => user.user == name);
                            if(!found) {
                                users.push({
                                    userId: null,
                                    user: name, //display name
                                    role: 'user'
                                })
                            }
                        })

                        event.reply('Users array set.')
                    break;
                    case 'getusers': //~getusers
                        let getUsersMsg = '';
                        users.forEach(user => {
                            getUsersMsg += user.user + "\n";
                        })
                        event.reply('Users:\n' + getUsersMsg);
                    break;
                    case 'set': //~set [subcommand] [..args]

                        //check permission first
 
                        if(permission == 'god' || permission == 'dev') //you have power to SET
                        {
                            
                            //role [userId | userDisplayName] [role]
                            //Role: god | dev | user | bitch
                            if(args[0] == 'role') {
                                const user = users.find(user => user.displayName == args[1] || user.userId == args[1]);
                                if(!user) return event.reply(`User ${args[2]} was not found.`);
                                if(args[2]) {
                                    switch(args[2]) {
                                        case 'god':
                                            return event.reply('Nice try buddy.')
                                        break;
                                        case 'bitch':
                                            user.role = 'bitch';
                                        break;
                                        case 'user':
                                            user.role = 'user';
                                        break;
                                        case 'dev':
                                            user.role = 'dev';
                                        break;
                                        default:
                                            user.role = 'user';
                                        break;
                                    }
                                    event.reply(`User ${args[1]} is now role "${user.role}"`);
                                }          
                            }
                            else if(args[0] == 'users') { //role @:[user] [...users]
                                console.log(args)
                            }
                        }
                        else {
                            event.reply("You don't have permission to do this");
                        }
                    break;
                    case 'users':
                        if(currentUser.role == 'god' || currentUser.role == 'dev') {
                            users.forEach(user => {
                                event.reply(user);
                            })
                        }
                        else {
                            event.reply("You don't have permission to do that.");
                        }
                    break;
                    case 'leavebot':
                        if (event.source.type == 'group')
                            bot.leaveGroup(event.source.groupId);
                        else if (event.source.type == 'room')
                            bot.leaveRoom(event.source.roomId);
                    break; 
                    case 'me':
                        event.source.profile().then(function (profile) {
                            //profile.userId
                            return event.reply('Hello ' + profile.displayName);
                        });
                    break;
                    case 'broadcast':
                        bot.broadcast('Broadcast!');
                        break;
                    case 'confirm':
                        if (args.length < 3) return event.reply('Missing values to execute command, try ~help');
                        
                        event.reply({
                            type: 'template',
                            altText: 'this is a confirm template',
                            template: {
                                type: 'confirm',
                                text: args[0],
                                actions: [{
                                    type: 'message',
                                    label: args[1],
                                    text: args[1]
                                }, {
                                    type: 'message',
                                    label: args[2],
                                    text: args[2]
                                }]
                            }
                        });
                        break;
                    case 'button':
                        event.reply({
                            "type": "template",
                            "altText": "This is a buttons template",
                            "template": {
                                "type": "buttons",
                                "thumbnailImageUrl": "",//"https://example.com/bot/images/image.jpg",
                                "imageAspectRatio": "rectangle",
                                "imageSize": "cover",
                                "imageBackgroundColor": "#FFFFFF",
                                "title": "Menu",
                                "text": "Please select",
                                /*"defaultAction": {
                                    "type": "uri",
                                    "label": "View detail",
                                    "uri": "http://example.com/page/123"
                                },*/
                                "actions": [
                                    /*{
                                      "type": "uri",
                                      "label": "View detail",
                                      "uri": "http://example.com/page/123"
                                    }*/
                                ]
                            }
                          })
                    break;
                    case 'version':
                        event.reply('linebot@' + require('../package.json').version);
                        break;
                    case 'help':
                        if(args[0] == 'dev')  event.reply('Dev commands:')

                        event.reply('Help: \n@everyone\n~me\n~version\n~leavebot\n' +
                            '~confirm [text] [answer1] [answer2] //Not working right now\n' +
                            '~set role [userId | userDisplayName] [role] //Doesnt work with display name\n' +
                            '~adduser ');
                        break;
                    default:
                        event.reply('Not a valid command! Try ~help')
                    break;
                }
            }
            else if(message.substring(0,1) == '@')
            {
                if(message.substring(1, message.length) == 'everyone')
                {
                    let msg = "";
                    users.forEach(user => {
                        msg += "@" + user.user + " "
                    }) 
                    event.reply(msg);
                }
            }
                /* Original text event
                switch (message) {
                    case 'Me':
                        event.source.profile().then(function (profile) {
                            return event.reply('Hello ' + profile.displayName + ' ' + profile.userId);
                        });
                        break;
                    case 'Member':
                        event.source.member().then(function (member) {
                            return event.reply(JSON.stringify(member));
                        });
                        break;
                    case 'Picture':
                        //   event.reply({
                        //     type: 'image',
                        //     originalContentUrl: 'https://d.line-scdn.net/stf/line-lp/family/en-US/190X190_line_me.png',
                        //     previewImageUrl: 'https://d.line-scdn.net/stf/line-lp/family/en-US/190X190_line_me.png'
                        //   });
                        break;
                    case 'Location':
                        //   event.reply({
                        //     type: 'location',
                        //     title: 'LINE Plus Corporation',
                        //     address: '1 Empire tower, Sathorn, Bangkok 10120, Thailand',
                        //     latitude: 13.7202068,
                        //     longitude: 100.5298698
                        //   });
                        break;
                    case 'Push':
                        bot.push('U17448c796a01b715d293c34810985a4c', ['Hey!', 'สวัสดี ' + String.fromCharCode(0xD83D, 0xDE01)]);
                        break;
                    case 'Push2':
                        bot.push('Cba71ba25dafbd6a1472c655fe22979e2', 'Push to group');
                        break;
                    case 'Multicast':
                        bot.push(['U17448c796a01b715d293c34810985a4c', 'Cba71ba25dafbd6a1472c655fe22979e2'], 'Multicast!');
                        break;
                    case 'Broadcast':
                        bot.broadcast('Broadcast!');
                        break;
                    case 'Confirm':
                        event.reply({
                            type: 'template',
                            altText: 'this is a confirm template',
                            template: {
                                type: 'confirm',
                                text: 'Are you sure?',
                                actions: [{
                                    type: 'message',
                                    label: 'Yes',
                                    text: 'yes'
                                }, {
                                    type: 'message',
                                    label: 'No',
                                    text: 'no'
                                }]
                            }
                        });
                        break;
                    case 'Multiple':
                        return event.reply(['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5']);
                        break;
                    case 'Version':
                        event.reply('linebot@' + require('../package.json').version);
                        break;
                    default:
                        event.reply(event.message.text).then(function (data) {
                            console.log('Success', data);
                        }).catch(function (error) {
                            console.log('Error', error);
                        });
                        break;
                }*/

        break;
        case 'image':
            //   event.message.content().then(function (data) {
            //     const s = data.toString('hex').substring(0, 32);
            //     return event.reply('Nice picture! ' + s);
            //   }).catch(function (err) {
            //     return event.reply(err.toString());
            //   });
            break;
        case 'video':
            // event.reply('Nice video!');
            break;
        case 'audio':
            // event.reply('Nice audio!');
            break;
        case 'location':
            // event.reply(['That\'s a good location!', 'Lat:' + event.message.latitude, 'Long:' + event.message.longitude]);
            break;
        case 'sticker':
            // event.reply({
            //     type: 'sticker',
            //     packageId: 1,
            //     stickerId: 1
            // });
            break;
        default:
            // event.reply('Unknow message: ' + JSON.stringify(event));
            break;
    }
});

bot.on('follow', function (event) {
    event.reply('follow: ' + event.source.userId);
});

bot.on('unfollow', function (event) {
    event.reply('unfollow: ' + event.source.userId);
});

bot.on('join', function (event) {
    if (event.source.groupId) {
        //event.reply('join group: ' + event.source.groupId);
        event.reply("Woah woah woah, what's going on here guys. It's me.")
    }
    if (event.source.roomId) {
        //event.reply('join room: ' + event.source.roomId);
        event.reply("Hm, what's this?")
    }
});

bot.on('leave', function (event) {
    if (event.source.groupId) {
        console.log('leave group: ' + event.source.groupId);
    }
    if (event.source.roomId) {
        console.log('leave room: ' + event.source.roomId);
    }
});

bot.on('memberJoined', function (event) {
    event.source.profile().then(function (profile) {
        if (event.source.type === 'group') {
            event.reply('memberJoined: Welcome to the group.');
        }
        if (event.source.type === 'room') {
            event.reply('memberJoined: Welcome to the room.');
        }
    });
});

bot.on('memberLeft', function (event) {
    console.log('memberLeft: Goodbye.');
});

bot.on('postback', function (event) {
    event.reply('postback: ' + event.postback.data);
});

bot.on('beacon', function (event) {
    event.reply('beacon: ' + event.beacon.hwid);
});

bot.listen('/webhook', process.env.PORT || 80, function () {
    console.log('LineBot is running on port ' + process.env.PORT);
});
