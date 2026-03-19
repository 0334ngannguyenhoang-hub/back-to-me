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
- Cloud miễn phí với Supabase:
  - `DATABASE_DRIVER=postgres`
  - `POSTGRES_URL=postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
  - `STORAGE_DRIVER=s3`
  - `S3_BUCKET=your-public-bucket`
  - `S3_REGION=your-supabase-region`
  - `S3_ENDPOINT=https://[PROJECT-REF].supabase.co/storage/v1/s3`
  - `S3_ACCESS_KEY_ID=your-supabase-s3-access-key-id`
  - `S3_SECRET_ACCESS_KEY=your-supabase-s3-secret-access-key`
  - `S3_PUBLIC_BASE_URL=https://[PROJECT-REF].supabase.co/storage/v1/object/public/your-public-bucket`

## Admin Token

Mặc định admin đang mở công khai.

Nếu muốn khóa trang admin:

```bash
set ADMIN_PROTECT=true
set ADMIN_TOKEN=your-secret-token
```

Sau đó mở:

```text
http://127.0.0.1:8000/admin?token=your-secret-token
```
