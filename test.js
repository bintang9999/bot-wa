import { createGuestReport } from './campuscare.js';
import Database from 'better-sqlite3';

try {
  const result = createGuestReport('+6285712867153', '6285712867153', 'Lampu mati', 'mati konsletttt', 'har 201', 'wa_test.jpg', 'Umum', 'Medium');
  console.log("Success:", result);
} catch (e) {
  console.error("Error is:", e.message);
  console.error("Stack:", e.stack);
}
