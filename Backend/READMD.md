# set up
Export the environment variable
```bash
export $(cat .env | xargs)
```
Then run docker container for pgBouncer in the directory Backend
```bash
docker-compose up -d 
```

## To test the database API
Run the following cmd in /Backend. Remember to replace the [PASSWORD] with actual password
```bash
psql "postgresql://postgres.eaknjohaqfrhxygadlfb:cAp_stOnE%40soft3888@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" -f db_setup/dbTest.sql
```

# To run testcase on API
Ensure that Docker is running in the backned. Then simply run
```bash
npm test
```

For WSL, run this before testing
```bash
docker pull postgres:16-alpine   # pre-pull public image

mkdir -p ~/.docker-clean
printf '{ "auths": { "https://index.docker.io/v1/": {} } }\n' > ~/.docker-clean/config.json
export DOCKER_CONFIG=$HOME/.docker-clean
```