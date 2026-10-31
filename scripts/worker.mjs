import {openDatabase} from '../app/db.mjs';
import {Service} from '../app/service.mjs';
import {periodBounds,now} from '../app/domain.mjs';
const db=await openDatabase();try{const s=new Service(db);await s.expire();const users=await db.all("SELECT * FROM profiles WHERE role='employee' AND demo=?",[s.demo?1:0]);for(const u of users)await s.remind(u);for(const period of ['weekly','monthly','quarterly','semester','yearly'])await s.rankings(period,periodBounds(period,now()).start-1);console.log('Expiry, progress reminders and prior-period snapshots processed.');}finally{await db.close();}
