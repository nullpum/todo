// app.js - 메인 애플리케이션 파일
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// PostgreSQL 연결 설정
const pool = new Pool({
  user: 'postgres',      // PostgreSQL 사용자 이름
  host: 'localhost',     // 호스트
  database: 'pcfriend',  // 데이터베이스 이름
  password: 'xapi1004',  // 비밀번호 (실제 사용시 변경 필요)
  port: 5432,            // PostgreSQL 포트
});

// 데이터베이스 초기화 함수
async function initializeDatabase() {
  try {
    // todos 테이블이 없으면 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('데이터베이스 초기화 완료');
  } catch (error) {
    console.error('데이터베이스 초기화 중 오류 발생:', error);
  }
}

// API 라우트 정의

// 모든 할 일 조회
app.get('/api/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('할 일 조회 중 오류 발생:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 새 할 일 추가
app.post('/api/todos', async (req, res) => {
  const { title } = req.body;
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: '할 일 제목은 필수입니다.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO todos (title) VALUES ($1) RETURNING *',
      [title]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('할 일 추가 중 오류 발생:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 할 일 상태 변경 (완료/미완료)
app.put('/api/todos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { completed } = req.body;

  if (completed === undefined) {
    return res.status(400).json({ error: '완료 상태는 필수입니다.' });
  }

  try {
    const result = await pool.query(
      'UPDATE todos SET completed = $1 WHERE id = $2 RETURNING *',
      [completed, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '해당 할 일을 찾을 수 없습니다.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('할 일 상태 변경 중 오류 발생:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 할 일 삭제
app.delete('/api/todos/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const result = await pool.query(
      'DELETE FROM todos WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '해당 할 일을 찾을 수 없습니다.' });
    }

    res.json({ message: '할 일이 삭제되었습니다.', deletedTodo: result.rows[0] });
  } catch (error) {
    console.error('할 일 삭제 중 오류 발생:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', async () => {
  await initializeDatabase();
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
