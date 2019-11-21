module.exports = (event) => {
    const messages = [
      {
        type: 'text',
        text: "Oh god. They've found me. If you don't see me again, don't come looking for me. I'll be alright I swear. XOXO",
      },
    ];
  
    return Promise.resolve(messages);
};