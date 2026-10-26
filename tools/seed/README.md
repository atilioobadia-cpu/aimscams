# seed

Synthetic Tanzanian demo data for local and test installations only. Never use member,
staff or tenant data from the reference corpus (hard rule 6).

Skeleton until the Phase 2 identity models land.

```powershell
cd tools/seed
npm install
$env:APP_ENV="local"; npm run seed
```
