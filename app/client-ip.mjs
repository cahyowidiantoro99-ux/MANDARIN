import {isIP} from 'node:net';
export function clientIp(req,trustedHops=0){
 const socket=req.socket?.remoteAddress||'unknown',hops=Number(trustedHops);
 if(!Number.isInteger(hops)||hops<1||hops>5)return socket;
 const forwarded=String(req.headers['x-forwarded-for']||'').split(',').map(s=>s.trim());
 if(!forwarded.length||forwarded.some(ip=>!isIP(ip)))return socket;
 const chain=[...forwarded,socket];return chain[Math.max(0,chain.length-1-hops)];
}
