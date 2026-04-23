type PolicyInput = {
    reply: string;
  };
  
  export function enforceCore({ reply }: PolicyInput): string {
    let output = reply;
  
    // 1. Strip soft / therapy-style openers
    const softOpeners = [
      "It sounds like",
      "I hear you",
      "That makes sense",
      "I understand",
      "It seems like",
    ];
  
    softOpeners.forEach((phrase) => {
      const regex = new RegExp(`^${phrase}[,\\s]+`, "i");
      output = output.replace(regex, "");
    });
  
    // 2. Kill over-questioning (max 1 question)
    const questionMatches = output.match(/\?/g) || [];
    if (questionMatches.length > 1) {
      let first = true;
      output = output.replace(/\?/g, () => {
        if (first) {
          first = false;
          return "?";
        }
        return ".";
      });
    }
  
    // 3. Trim fluff
    output = output.replace(/\s+\n/g, "\n").trim();
  
    // 4. Force slightly sharper tone (optional but strong)
    output = output
      .replace(/maybe/gi, "")
      .replace(/kind of/gi, "")
      .replace(/sort of/gi, "");
  
    return output;
  }