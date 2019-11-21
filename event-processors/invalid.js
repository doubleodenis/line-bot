module.exports = () => {
    const messages = [
      {
        type: 'text',
        text: 'Unable to process event',
      },
    ];
  
    return Promise.resolve(messages);
};