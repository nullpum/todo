// app.js - 메인 애플리케이션 파일
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// JWT 시크릿 키 (실제 사용시 환경변수로 관리해야 함)
const JWT_SECRET = 'your_jwt_secret_key';

// PostgreSQL 연결 설정
const pool = new Pool({
  user: 'postgres',      // PostgreSQL 사용자 이름
  host: 'localhost',     // 호스트
  database: 'pcfriend',  // 데이터베이스 이름
  password: 'xapi1004',  // 비밀번호 (실제 사용시 변경 필요)
  port: 5432,            // PostgreSQL 포트
});

/*
const pool = new Pool({
  connectionString: "postgres://koyeb-adm:npg_51OATXpLNhoz@ep-odd-lab-a2t4lk1p.eu-central-1.pg.koyeb.app/koyebdb",
  ssl: {
    rejectUnauthorized: false // 필요에 따라 설정
  }
});
*/

// 데이터베이스 초기화 함수
async function initializeDatabase() {
  try {
    // users 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // todos 테이블이 없으면 생성 (user_id 필드 추가)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('데이터베이스 초기화 완료');
  } catch (error) {
    console.error('데이터베이스 초기화 중 오류 발생:', error);
  }
}

// 인증 미들웨어
const authenticateToken = (req, res, next) => {
  console.log('인증 미들웨어 실행');
  const authHeader = req.headers['authorization'];
  console.log('Authorization 헤더:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('토큰이 없음, 인증 실패');
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('토큰 검증 실패:', err.message);
      return res.status(403).json({ error: '토큰이 유효하지 않습니다.' });
    }
    console.log('토큰 검증 성공, 사용자:', user);
    req.user = user;
    next();
  });
};

// 기본 경로에서 로그인 페이지로 리다이렉트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 회원가입 API
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '사용자 이름과 비밀번호는 필수입니다.' });
  }

  try {
    // 사용자 이름 중복 확인
    const userExists = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: '이미 사용 중인 사용자 이름입니다.' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at',
      [username, hashedPassword]
    );

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('회원가입 중 오류 발생:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 로그인 API
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '사용자 이름과 비밀번호는 필수입니다.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: '사용자 이름이 존재하지 않습니다.' });
    }

    // 비밀번호 검증
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('로그인 중 오류 발생:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// API 라우트 정의

// 모든 할 일 조회 (인증 필요)
app.get('/api/todos', authenticateToken, async (req, res) => {
  console.log('할 일 목록 조회 요청 수신, 사용자 ID:', req.user.id);
  
  try {
    // 현재 로그인한 사용자의 할 일만 조회
    const result = await pool.query(
      'SELECT t.*, u.username FROM todos t JOIN users u ON t.user_id = u.id WHERE t.user_id = $1 ORDER BY t.created_at DESC',
      [req.user.id]
    );
    
    console.log('조회된 할 일 수:', result.rows.length);
    console.log('조회 결과:', result.rows);
    
    res.json(result.rows);
  } catch (error) {
    console.error('할 일 조회 중 오류 발생:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 새 할 일 추가 (인증 필요)
app.post('/api/todos', authenticateToken, async (req, res) => {
  console.log('할 일 추가 요청 수신:', req.body);
  console.log('인증된 사용자:', req.user);
  
  const { title } = req.body;
  if (!title || title.trim() === '') {
    console.log('제목이 비어있음');
    return res.status(400).json({ error: '할 일 제목은 필수입니다.' });
  }

  try {
    console.log('할 일 DB 저장 시도:', title, req.user.id);
    
    const result = await pool.query(
      'INSERT INTO todos (title, user_id) VALUES ($1, $2) RETURNING *',
      [title, req.user.id]
    );
    
    console.log('DB 저장 결과:', result.rows[0]);
    
    // 사용자 정보 추가
    const todoWithUser = {
      ...result.rows[0],
      username: req.user.username
    };
    
    console.log('응답으로 보낼 데이터:', todoWithUser);
    res.status(201).json(todoWithUser);
  } catch (error) {
    console.error('할 일 추가 중 오류 발생:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 할 일 상태 변경 (완료/미완료) (인증 필요)
app.put('/api/todos/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  const { completed } = req.body;

  if (completed === undefined) {
    return res.status(400).json({ error: '완료 상태는 필수입니다.' });
  }

  try {
    // 해당 할 일이 현재 사용자의 것인지 확인
    const todoCheck = await pool.query(
      'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (todoCheck.rows.length === 0) {
      return res.status(404).json({ error: '해당 할 일을 찾을 수 없거나 접근 권한이 없습니다.' });
    }

    const result = await pool.query(
      'UPDATE todos SET completed = $1 WHERE id = $2 RETURNING *',
      [completed, id]
    );

    // 사용자 정보 추가
    const todoWithUser = {
      ...result.rows[0],
      username: req.user.username
    };

    res.json(todoWithUser);
  } catch (error) {
    console.error('할 일 상태 변경 중 오류 발생:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 할 일 삭제 (인증 필요)
app.delete('/api/todos/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // 해당 할 일이 현재 사용자의 것인지 확인
    const todoCheck = await pool.query(
      'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (todoCheck.rows.length === 0) {
      return res.status(404).json({ error: '해당 할 일을 찾을 수 없거나 접근 권한이 없습니다.' });
    }

    const result = await pool.query(
      'DELETE FROM todos WHERE id = $1 RETURNING *',
      [id]
    );

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