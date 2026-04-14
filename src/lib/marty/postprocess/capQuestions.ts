export const capQuestions = (value: string, maxQuestions = 1) => {
    if (maxQuestions < 1) {
      return value.replace(/\?/g, ".");
    }
  
    let seen = 0;
  
    return value.replace(/\?/g, () => {
      seen += 1;
      return seen <= maxQuestions ? "?" : ".";
    });
  };