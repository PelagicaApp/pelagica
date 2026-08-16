#!/bin/bash
#
# Set up Tizen Studio
#
TIZEN_STUDIO="$GITHUB_WORKSPACE/tizen-studio"
INSTALLER="$GITHUB_WORKSPACE/tizen-studio_5.1.bin"

wget -nc -O "$INSTALLER"  http://download.tizen.org/sdk/Installer/tizen-studio_5.1/web-cli_Tizen_Studio_5.1_ubuntu-64.bin
chmod a+x "$INSTALLER"
"$INSTALLER" --accept-license "$TIZEN_STUDIO"

PATH="$TIZEN_STUDIO/tools/ide/bin:$PATH"

#
# XML-escape a value for safe use inside a double-quoted XML attribute.
#
xml_escape() {
    local s="$1"
    s="${s//&/\&amp;}"
    s="${s//</\&lt;}"
    s="${s//>/\&gt;}"
    s="${s//\"/\&quot;}"
    s="${s//\'/\&apos;}"
    printf '%s' "$s"
}

#
# Parse arguments
#
if [ "$8" = "partner" ]; then
    PRIVILEGE=parner
else
    PRIVILEGE=public
fi

PROJECT_DIR="$1"

if [ -n "$2" ]; then
    CUSTOM_AUTHOR_CERT="$GITHUB_WORKSPACE/author-cert.cer"
    echo -n "$2" | base64 -d >"$CUSTOM_AUTHOR_CERT"
fi
DEFAULT_AUTHOR_CERT="$TIZEN_STUDIO/tools/certificate-generator/certificates/developer/tizen-developer-ca.cer"
AUTHOR_CERT="${CUSTOM_AUTHOR_CERT:-"$DEFAULT_AUTHOR_CERT"}"

AUTHOR_KEY="$GITHUB_WORKSPACE/author-key.p12"
echo -n "$3" | base64 -d >"$AUTHOR_KEY"

AUTHOR_PASSWORD="$(xml_escape "$4")"

if [ -n "$5" ]; then
    CUSTOM_DISTRIBUTOR_CERT="$GITHUB_WORKSPACE/distributor-cert.cer"
    echo -n "$5" | base64 -d >"$CUSTOM_DISTRIBUTOR_CERT"
fi
DEFAULT_DISTRIBUTOR_CERT="$TIZEN_STUDIO/tools/certificate-generator/certificates/distributor/sdk-$PRIVILEGE/tizen-distributor-ca.cer"
DISTRIBUTOR_CERT="${CUSTOM_DISTRIBUTOR_CERT:-"$DEFAULT_DISTRIBUTOR_CERT"}"

if [ -n "$6" ]; then
    CUSTOM_DISTRIBUTOR_KEY="$GITHUB_WORKSPACE/distributor-key.p12"
    echo -n "$6" | base64 -d >"$CUSTOM_DISTRIBUTOR_KEY"
fi
DEFAULT_DISTRIBUTOR_KEY="$TIZEN_STUDIO/tools/certificate-generator/certificates/distributor/sdk-$PRIVILEGE/tizen-distributor-signer.p12"
DISTRIBUTOR_KEY="${CUSTOM_DISTRIBUTOR_KEY:-"$DEFAULT_DISTRIBUTOR_KEY"}"

DISTRIBUTOR_PASSWORD="$(xml_escape "${7:-tizenpkcs12passfordsigner}")"

cat <<EOF
Build and signing parameters:
 - project-dir: $PROJECT_DIR
 - author-cert: $AUTHOR_CERT
 - author-key: $AUTHOR_KEY
 - author-password: ***
 - distributor-cert: $DISTRIBUTOR_CERT
 - distributor-key: $DISTRIBUTOR_KEY
 - distributor-password: ***
 - privilege: $PRIVILEGE
EOF

#
# Create profiles.xml
#
GLOBAL_PROFILES_PATH="$(tizen cli-config -l | grep -i 'default.profiles.path=' | sed 's/^default\.profiles\.path=//g')"
cat <<EOF >"$GLOBAL_PROFILES_PATH"
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<profiles active="sourcetoad-tizen-public" version="3.1">
    <profile name="sourcetoad-tizen-public">
        <profileitem ca="$AUTHOR_CERT" distributor="0" key="$AUTHOR_KEY" password="$AUTHOR_PASSWORD" rootca=""/>
        <profileitem ca="$DISTRIBUTOR_CERT" distributor="1" key="$DISTRIBUTOR_KEY" password="$DISTRIBUTOR_PASSWORD" rootca=""/>
        <profileitem ca="" distributor="2" key="" password="" rootca=""/>
    </profile>
</profiles>
EOF
chmod a-w "$GLOBAL_PROFILES_PATH"

#
# Build and sign
#
PACKAGE_OUTPUT_DIR="$PROJECT_DIR/output-wgt"
ERROR_LOG="$GITHUB_WORKSPACE/tizen-studio-data/cli/logs/cli.log"

tizen build-web -- "$PROJECT_DIR" \
    && tizen package -t wgt -s sourcetoad-tizen-public -o "$PACKAGE_OUTPUT_DIR" -- "$PROJECT_DIR/.buildResult"

# shellcheck disable=SC2181
if [ $? -eq 0 ]; then
    PACKAGE_OUTPUT_PATH="$(find "$PACKAGE_OUTPUT_DIR" -maxdepth 1 -name '*.wgt' -print -quit)"
    if [ -n "$PACKAGE_OUTPUT_PATH" ]; then
        SUCCESS=true
        echo "package-artifact=$PACKAGE_OUTPUT_PATH" >> "$GITHUB_OUTPUT"
    else
        SUCCESS=false
        echo "tizen package reported success but no .wgt file was found in $PACKAGE_OUTPUT_DIR" >&2
    fi
else
    SUCCESS=false
    cat "$ERROR_LOG"
fi

#
# Clean up
#
tizen clean -- "$PROJECT_DIR"

rm -rf "$GLOBAL_PROFILES_PATH" \
    "$CUSTOM_AUTHOR_CERT" \
    "$CUSTOM_DISTRIBUTOR_CERT" \
    "$CUSTOM_DISTRIBUTOR_KEY"

if $SUCCESS; then
    exit 0;
else
    exit 1;
fi
