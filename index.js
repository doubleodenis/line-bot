const linebot = require('linebot');

const bot = linebot({
    channelId: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    verify: true // default=true
});
let permission = false; //testing if permissions persist
let users = [];
bot.on('message', function (event) {
    console.log(event);
    let added = false;
    users.forEach(user => {
        if(user.userId == event.source.userId) added = true;
    })
    if(!added) {
        event.source.profile().then(profile => {
            users.push({
                userId: event.source.userId,
                user: profile.displayName,
                role: 'user'
            })
        })
    }
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
                console.log(value);
                const command = value[0];
                const args = value.slice(1, value.length);

                switch (command) {
                    case 'set': //~set [subcommand] [..args]

                    //role [userId] [role]
                    //Role: dev | user | bitch

                    event.source.profile().then(function (profile) {
                        return event.reply('Hello ' + profile.userId);
                    });
                        //if(args[0] && event.source.userId)
                    break;
                    case 'permission':
                        if(args[0] && args[0] == 'true')
                            permission = true;
                        else if(args[0] && args[0] == 'false')
                            permission = false;
                        
                        event.reply(permission);
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
                        if (args.length != 3) return event.reply('Missing values to execute command, try ~help');

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
                    case 'version':
                        event.reply('linebot@' + require('../package.json').version);
                        break;
                    case 'help':
                        if(args[0] == 'dev')  event.reply('Dev commands:')

                        event.reply('Help: \n~me\n~version\n~leavebot\n' +
                            '~confirm [text] [answer1] [answer2]');
                        break;
                    default:
                        event.reply('Not a valid command! Try ~help')
                    break;
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