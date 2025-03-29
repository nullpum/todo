# Node.js + PostgreSQL Todo 애플리케이션

## 개요
이 패키지는 Node.js와 PostgreSQL을 사용하여 만든 간단한 Todo 리스트 애플리케이션입니다. 사용자는 할 일을 추가하고, 완료 상태를 변경하고, 삭제할 수 있습니다.

## 필수 요구사항
- Node.js (v14 이상)
- PostgreSQL (v10 이상)
- npm 또는 yarn

## 설치 방법

### 1. PostgreSQL 설정
1. PostgreSQL이 설치되어 있고 실행 중인지 확인합니다.
2. PostgreSQL에 접속하여 다음 명령어로 데이터베이스를 생성합니다:
   ```sql
   CREATE DATABASE todo_app;
   ```

### 2. 애플리케이션 설치
1. 패키지를 다운로드하고 압축을 풉니다.
2. 터미널에서 압축을 푼 폴더로 이동합니다.
3. 다음 명령어로 필요한 패키지를 설치합니다:
   ```bash
   npm install
   ```

### 3. 데이터베이스 연결 설정
`app.js` 파일을 열고 PostgreSQL 연결 설정을 수정합니다:
```javascript
const pool = new Pool({
  user: 'postgres',      // PostgreSQL 사용자 이름
  host: 'localhost',     // 호스트
  database: 'todo_app',  // 데이터베이스 이름
  password: 'postgres',  // 비밀번호
  port: 5432,            // PostgreSQL 포트
});
```
사용자 이름과 비밀번호를 실제 PostgreSQL 설정에 맞게 변경하세요.

### 4. 애플리케이션 실행
```bash
npm start
```

### 5. 접속
웹 브라우저에서 `http://localhost:3000`에 접속합니다.

## 파일 구조
```
todo-app/
├── app.js              # 백엔드 서버 코드
├── package.json        # 프로젝트 설정 파일
└── public/
    ├── index.html      # HTML 파일
    ├── style.css       # CSS 스타일시트
    └── script.js       # 프론트엔드 JavaScript
```

## 주요 기능
- 할 일 추가
- 할 일 목록 조회
- 할 일 완료 상태 변경
- 할 일 삭제
- 완료된 할 일 개수 통계

## 기술 스택
- **백엔드**: Node.js, Express
- **데이터베이스**: PostgreSQL
- **프론트엔드**: HTML, CSS, JavaScript (바닐라)

## API 엔드포인트
| 엔드포인트 | 메소드 | 설명 |
|------------|--------|------|
| /api/todos | GET | 모든 할 일 조회 |
| /api/todos | POST | 새 할 일 추가 |
| /api/todos/:id | PUT | 할 일 상태 변경 |
| /api/todos/:id | DELETE | 할 일 삭제 |

## 문제 해결
- **데이터베이스 연결 오류**: PostgreSQL 서버가 실행 중인지, 사용자 이름과 비밀번호가 올바른지 확인하세요.
- **서버 실행 오류**: 포트 3000이 이미 사용 중인 경우, `app.js`에서 다른 포트로 변경하세요.
- **클라이언트 오류**: 개발자 도구의 콘솔을 확인하여 JavaScript 오류를 디버깅하세요.

## 확장 가능성
이 애플리케이션은 다음과 같은 기능으로 확장할 수 있습니다:
- 사용자 인증 및 개인 할 일 목록
- 카테고리별 할 일 분류
- 마감일 및 우선순위 설정
- 할 일 검색 및 필터링

## 라이선스
MIT 라이선스
