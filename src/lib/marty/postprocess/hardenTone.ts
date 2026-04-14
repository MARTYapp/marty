const stripBannedOpeners = (value: string) => {
    return value
      .replace(/^it sounds like\s*/i, "")
      .replace(/^that sounds like\s*/i, "")
      .replace(/^have you considered\s*/i, "")
      .replace(/^it’s understandable that\s*/i, "")
      .replace(/^it's understandable that\s*/i, "")
      .replace(/^i’m here for you[,.!\s]*/i, "")
      .replace(/^i'm here for you[,.!\s]*/i, "");
  };
  
  export const hardenTone = (value: string) => {
    let next = value.trim();
  
    next = stripBannedOpeners(next);
  
    next = next.replace(/\bI think\b/gi, "");
    next = next.replace(/\bmaybe\b/gi, "");
    next = next.replace(/\bperhaps\b/gi, "");
    next = next.replace(/\s{2,}/g, " ").trim();
  
    if (next.length > 220 && !next.includes("\n") && next.split(". ").length > 3) {
      next = next.split(". ").slice(0, 3).join(". ");
      if (!/[.!?]$/.test(next)) next += ".";
    }
  
    return next;
  };