# Back To Me

Website public cho campaign `BACK TO ME`, gồm:

- Frontend static cho người dùng tạo card
- Backend nhận 2 ảnh PNG + metadata
- Trang admin xem submission và export CSV cho Excel

## Chạy local

```bash
npm install
npm start
```

Mặc định web + API chạy cùng một server ở:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/product.html`
- `http://127.0.0.1:8000/admin`

## Biến môi trường

Copy từ `.env.example` và điền giá trị thật.

### Local demo

```env
DATABASE_DRIVER=sqlite
STORAGE_DRIVER=local
```

### Cloud mode miễn phí với Supabase Free

```env
DATABASE_DRIVER=postgres
POSTGRES_URL=postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
POSTGRES_SSL=true

STORAGE_DRIVER=s3
S3_BUCKET=your-public-bucket
S3_REGION=your-supabase-region
S3_ENDPOINT=https://[PROJECT-REF].supabase.co/storage/v1/s3
S3_ACCESS_KEY_ID=your-supabase-s3-access-key-id
S3_SECRET_ACCESS_KEY=your-supabase-s3-secret-access-key
S3_PUBLIC_BASE_URL=https://[PROJECT-REF].supabase.co/storage/v1/object/public/your-public-bucket
```

## Gợi ý miễn phí

- Hosting web/API: Render Free
- Database + ảnh: Supabase Free

Theo docs chính thức mình đã kiểm tra:

- Supabase Free có 2 free projects: [billing docs](https://supabase.com/docs/guides/platform/billing-on-supabase)
- Supabase Free có 1 GB storage: [storage size docs](https://supabase.com/docs/guides/platform/manage-your-usage/storage-size)
- Free plan cho phép file limit đến 50 MB: [file limits docs](https://supabase.com/docs/guides/storage/uploads/file-limits)
- Supabase Storage hỗ trợ S3-compatible endpoint: [S3 compatibility docs](https://supabase.com/docs/guides/storage/s3/compatibility)
- Render có free web service: [Render free docs](https://render.com/docs/free)

## Supabase Storage S3

Supabase Storage hỗ trợ S3-compatible API, nên backend hiện tại dùng được luôn với:

- endpoint dạng `https://[PROJECT-REF].supabase.co/storage/v1/s3`
- region lấy theo project region của Supabase
- access key / secret key tạo trong phần Storage S3 settings

## Deploy web

Project có sẵn `render.yaml` để deploy lên Render từ GitHub.

Render docs mình dùng tham chiếu:

- [Web Services](https://render.com/docs/web-services)
- [Environment Variables](https://render.com/docs/configure-environment-variables)
- [Deploy for Free](https://render.com/docs/free)

## Admin

Nếu có `ADMIN_TOKEN`, mở admin bằng:

```text
https://your-domain/admin?token=your-secret-token
```

## Export Excel

CSV export:

```text
/api/submissions/export.csv
```

Mở trực tiếp bằng Excel được.
