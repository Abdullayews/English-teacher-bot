import dotenv from 'dotenv';
import pool from './db.js';
dotenv.config();

const words = [
  ['apple', 'A1', 'food'], ['dog', 'A1', 'animals'], ['run', 'A1', 'verb'],
  ['beautiful', 'A2', 'description'], ['car', 'A2', 'transport'],
  ['decision', 'B1', 'abstract'], ['manage', 'B1', 'verb'],
  ['require', 'B2', 'verb'], ['significant', 'B2', 'description'],
  ['acquire', 'C1', 'verb'], ['ubiquitous', 'C1', 'abstract']
  // ... (500 söz burada olmalıdır)
];

const rules = [
  ['Present Simple', 'Səhər hərəkətləri üçün istifadə olunur.', 'I play football.', 'A1', 1],
  ['Past Simple', 'Keçmişdə olmuş hadisələr.', 'I played football.', 'A2', 1],
  ['Present Perfect', 'Keçmişdə baş verib və indi də təsiri var.', 'I have played football.', 'B1', 1]
  // ... (50 qayda burada olmalıdır)
];

const questions = [
  ['word_quiz', 'What is the meaning of "apple"?', JSON.stringify(['A) Dog', 'B) Fruit', 'C) Car', 'D) House']), 'B', 'Alma meyvəsidir.', 'A1', 'food'],
  ['rule_quiz', 'Choose correct: She ___ to school.', JSON.stringify(['A) go', 'B) goes', 'C) going', 'D) gone']), 'B', 'Present Simple, 3-cü tək şəxs.', 'A1', 'grammar']
  // ... (20+ sual burada olmalıdır)
];

async function seed() {
  try {
    console.log('Seeding words...');
    await pool.query('INSERT IGNORE INTO words (word, level, category) VALUES ?', [words.map(w => [w[0], w[1], w[2]])]);
    
    console.log('Seeding rules...');
    await pool.query('INSERT IGNORE INTO rules (title, content, example, level, sequence_number) VALUES ?', [rules.map(r => [r[0], r[1], r[2], r[3], r[4]])]);
    
    console.log('Seeding questions...');
    await pool.query('INSERT IGNORE INTO questions (type, question_text, options, correct_answer, explanation, level, category) VALUES ?', [questions.map(q => [q[0], q[1], q[2], q[3], q[4], q[5], q[6]])]);
    
    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}
seed();
