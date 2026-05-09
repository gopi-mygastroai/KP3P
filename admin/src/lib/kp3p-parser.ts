export interface ParsedSections {
  HEADER?:string; RISK?:string; STRIDE?:string; SCREENING?:string;
  VACCINES?:string; TREATMENT?:string; MONITORING?:string;
  COMORBIDITIES?:string; ALERTS?:string; EVIDENCE?:string;
  PATIENT_TELUGU?:string; CONTACT?:string;
}
export function parseModelOutput(text:string):ParsedSections {
  const s:ParsedSections={};
  let cur:keyof ParsedSections|null=null, buf:string[]=[];
  for(const line of text.split('\n')){
    const m=line.trim().match(/^##SECTION:(\w+)##/);
    if(m){if(cur)s[cur]=buf.join('\n').trim();cur=m[1] as keyof ParsedSections;buf=[];}
    else if(cur)buf.push(line);
  }
  if(cur)s[cur]=buf.join('\n').trim();
  return s;
}
export function getField(text:string,key:string):string{
  return text.match(new RegExp(`^${key}:\\s*(.+)$`,'m'))?.[1]?.trim()??'';
}
export function getRows(text:string):string[][]{
  return text.split('\n').filter(l=>l.trim().startsWith('ROW|'))
    .map(l=>l.trim().slice(4).split('|').map(p=>p.trim()));
}
export function getBullets(text:string):string[]{
  return text.split('\n').filter(l=>l.trim().startsWith('- ')).map(l=>l.trim().slice(2).trim());
}
export function getAlerts(text:string,type:'ALERT_DANGER'|'ALERT_WARNING'):string[]{
  return text.split('\n').filter(l=>l.trim().startsWith(`${type}:`))
    .map(l=>l.trim().slice(type.length+1).trim()).filter(Boolean);
}
