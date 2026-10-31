import {openDatabase} from '../app/db.mjs';
const db=await openDatabase();await db.migrate();console.log(`Migration applied (${db.kind}).`);await db.close();
