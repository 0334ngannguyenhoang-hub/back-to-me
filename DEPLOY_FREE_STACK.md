# Deploy Mien Phi: Supabase + Render

## Stack

- Frontend + backend web: Render Free
- Database + storage anh: Supabase Free

## 1. Tao Supabase project

1. Dang ky / dang nhap Supabase.
2. Tao project moi.
3. Trong `Project Settings -> Database`, copy `Connection string`.
//postgresql://postgres:[YOUR-PASSWORD]@db.ifzoxlwmkabpqgzaollt.supabase.co:5432/postgres
4. Trong `Storage`, tao bucket public, vi du `back-to-me-cards`.
5. Trong `Storage -> S3`, tao `Access Key` va `Secret Key`.
6. Ghi lai:
   - `PROJECT_REF`
   - `REGION`
   - `BUCKET`
   - `ACCESS_KEY_ID`
   - `SECRET_ACCESS_KEY`

## 2. Dien env local de test

Tao file `.env` tu `.env.example`:

```env
HOST=0.0.0.0
PORT=8000
ADMIN_TOKEN=your-secret-token

DATABASE_DRIVER=postgres
POSTGRES_URL=postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
POSTGRES_SSL=true

STORAGE_DRIVER=s3
S3_BUCKET=back-to-me-cards
S3_REGION=your-supabase-region
S3_ENDPOINT=https://[PROJECT-REF].supabase.co/storage/v1/s3
S3_ACCESS_KEY_ID=your-supabase-s3-access-key-id
S3_SECRET_ACCESS_KEY=your-supabase-s3-secret-access-key
S3_PUBLIC_BASE_URL=https://[PROJECT-REF].supabase.co/storage/v1/object/public/back-to-me-cards
```

## 3. Chay local

```bash
npm install
npm start
```

Mo:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/admin?token=your-secret-token`

## 4. Day len GitHub

```bash
git add .
git commit -m "Prepare free deploy stack with Supabase and Render"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## 5. Deploy len Render

1. Dang nhap Render.
2. Chon `New -> Web Service`.
3. Noi repo GitHub cua ban.
4. Render se doc `render.yaml`.
5. Vao `Environment` va dien cac env giong file `.env`.

## 6. Sau nay update ban moi nhat

Moi lan sua trong VS Code:

```bash
git add .
git commit -m "Mo ta thay doi"
git push origin main
```

Neu Render dang linked voi repo, no se tu deploy ban moi.

Neu muon keo code moi nhat ve may khac:

```bash
git pull origin main
```
