
POCKET_IC_SERVER_VERSION="4.0.0"

if [[ $OSTYPE == "linux-gnu"* ]]
then
    PLATFORM=linux
elif [[ $OSTYPE == "darwin"* ]]
then
    PLATFORM=darwin
else
    echo "OS not supported: ${OSTYPE:-$RUNNER_OS}"
    exit 1
fi

cd backend/integration_tests
echo "PocketIC download starting"
curl -Ls https://github.com/dfinity/pocketic/releases/download/${POCKET_IC_SERVER_VERSION}/pocket-ic-x86_64-${PLATFORM}.gz -o pocket-ic.gz || exit 1
gzip -df pocket-ic.gz
chmod +x pocket-ic
echo "PocketIC download completed"
cd ../..
