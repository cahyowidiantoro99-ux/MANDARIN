// ECB internal exam policy. Work vocabulary and learning games have separate rules.
export const examPassThreshold=(track,level)=>track==='hsk'&&Number(level)>=5?60:80;
// Question snapshots freeze the rule for each new app exam without rewriting history.
export const savedPassThreshold=questions=>[60,80].includes(questions[0]?.pass_threshold)?questions[0].pass_threshold:80;
