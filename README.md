# Web Crawler exercise

Crawls a website and outputs the site map, including assets and links between pages.

When running the script, the site map is output both on the console and in `./output/siteMap.txt`.

## Run in docker

```
$ chmod +x ./run.sh
$ ./run.sh http://www.some.website.com
```

**NOTE:** You might need to run the `run.sh` script with admin privileges, depending on how Docker is configured.

## Run from the command line

```
$ mkdir -p ./output
$ npm install
$ npm run build
$ node ./dist/index.js http://www.some.website.com --production
```

## Run tests

```
$ npm install
$ npm test
```
