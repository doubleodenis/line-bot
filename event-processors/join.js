module.exports = (event) => {
    const messages = [
      {
        type: 'text',
        text: 'Hi, my name is Groupies Bot. Finally I MADE IT. I WORK!',
      },
    ];
  
    return Promise.resolve(messages);
};