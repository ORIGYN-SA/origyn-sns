npm run web:build
mkdir dist/.well-known
cp domains/ic-domains dist/.well-known/ic-domains
cp domains/custom-domains dist/.well-known/custom-domains
cp domains/ii-alternative-origins dist/.well-known/ii-alternative-origins
cp domains/ic-assets.json dist/.ic-assets.json
dfx deploy --network ic ogy_website_staging