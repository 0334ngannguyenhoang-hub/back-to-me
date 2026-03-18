# Back To Me Backend

## Run

```bash
npm run start:backend
```

Backend mặc định chạy ở `http://127.0.0.1:8000`.

## API

- `GET /api/health`
- `POST /api/submissions`
- `GET /api/submissions`
- `GET /api/submissions/export.csv`
- `GET /api/submissions/count`
- `GET /admin`

## Data

- Database: `server/data/submissions.db`
- Uploaded cards: `server/storage/submissions/<YYYY-MM-DD>/<submissionId>/`

File CSV export có thể mở trực tiếp bằng Excel.

## Cloud Ready

Backend hỗ trợ 2 mode:

- Local demo:
  - `DATABASE_DRIVER=sqlite`
  - `STORAGE_DRIVER=local`
- Cloud:
  - `DATABASE_DRIVER=postgres`
  - `POSTGRES_URL=...`
  - `STORAGE_DRIVER=s3`
  - `S3_BUCKET=...`
  - `S3_REGION=...`
  - `S3_ENDPOINT=...`
  - `S3_ACCESS_KEY_ID=...`
  - `S3_SECRET_ACCESS_KEY=...`
  - `S3_PUBLIC_BASE_URL=...`

## Admin Token

Nếu muốn khóa trang admin:

```bash
set ADMIN_TOKEN=your-secret-token
```

Sau đó mở:

```text
http://127.0.0.1:8000/admin?token=your-secret-token
```
