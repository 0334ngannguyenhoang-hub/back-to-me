# Production Config

Day la cau hinh production de web khong bi mat submissions va anh sau restart/redeploy.

## Render

Trong `Environment` cua Render, dien dung cac bien sau:

```env
HOST=0.0.0.0
PORT=10000

ADMIN_PROTECT=false
ADMIN_TOKEN=your-secret-token

DATABASE_DRIVER=postgres
POSTGRES_URL=postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
POSTGRES_SSL=true

STORAGE_DRIVER=s3
S3_BUCKET=back-to-me-cards
S3_REGION=ap-southeast-1
S3_ENDPOINT=https://[PROJECT-REF].supabase.co/storage/v1/s3
S3_FORCE_PATH_STYLE=false
S3_ACCESS_KEY_ID=your-supabase-s3-access-key-id
S3_SECRET_ACCESS_KEY=your-supabase-s3-secret-access-key
S3_PUBLIC_BASE_URL=https://[PROJECT-REF].supabase.co/storage/v1/object/public/back-to-me-cards
```

## Gia tri phai tranh

Neu tren Render con mot trong 2 gia tri nay thi van co nguy co mat data:

```env
DATABASE_DRIVER=sqlite
STORAGE_DRIVER=local
```

## Kiem tra sau khi save env

1. Redeploy service tren Render.
2. Mo:
   - `/api/health`
   - `/admin`
3. Xac nhan trong `/api/health` co:
   - `"databaseDriver":"postgres"`
   - `"storageDriver":"s3"`
   - `"volatile":false`
4. Trong `/admin` khong con hien banner canh bao mat data.

## Neu admin muon mo cong khai

```env
ADMIN_PROTECT=false
```

## Neu admin muon co token

```env
ADMIN_PROTECT=true
ADMIN_TOKEN=your-secret-token
```

Khi do mo bang:

```text
https://your-domain.onrender.com/admin?token=your-secret-token
```
