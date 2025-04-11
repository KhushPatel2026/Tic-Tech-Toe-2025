const abusiveWords = ['badword1', 'badword2', 'curse', 'swear'];

module.exports = (text) => {
  const lowerText = text.toLowerCase();
  return abusiveWords.some(word => lowerText.includes(word));
};