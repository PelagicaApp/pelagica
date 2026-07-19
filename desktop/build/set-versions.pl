#!/usr/bin/env perl
# Updates the version strings embedded in the desktop build assets under desktop/build/.
# Invoked from the root Taskfile's `version` task as: perl desktop/build/set-versions.pl <version>
#
# This lives in its own script (rather than inline `cmd:` perl one-liners in the Taskfile)
# because go-task's Windows shell mangles backslash escapes and ${...} backreferences when
# passing arguments to external programs, corrupting regexes like \s, \/, and ${1}.
use strict;
use warnings;

my $version = shift @ARGV or die "Usage: set-versions.pl <version>\n";

sub replace_in_file {
    my ($file, $pattern, $replace_code) = @_;
    open(my $fh, '<', $file) or die "Can't open $file: $!";
    local $/;
    my $content = <$fh>;
    close $fh;

    $content =~ s/$pattern/$replace_code->()/e;

    open(my $out, '>', $file) or die "Can't write $file: $!";
    print $out $content;
    close $out;
}

replace_in_file(
    'desktop/build/darwin/Info.plist',
    qr/(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/,
    sub { "$1$version$2" }
);

replace_in_file(
    'desktop/build/darwin/Info.plist',
    qr/(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/,
    sub { "$1$version$2" }
);

replace_in_file(
    'desktop/build/windows/info.json',
    qr/"file_version":\s*"[^"]*"/,
    sub { qq("file_version": "$version") }
);

replace_in_file(
    'desktop/build/windows/info.json',
    qr/"ProductVersion":\s*"[^"]*"/,
    sub { qq("ProductVersion": "$version") }
);

replace_in_file(
    'desktop/build/windows/wails.exe.manifest',
    qr/(<assemblyIdentity type="win32" name="app\.pelagica\.desktop" version=")[^"]*(")/,
    sub { "$1$version$2" }
);

replace_in_file(
    'desktop/build/windows/nsis/wails_tools.nsh',
    qr/(!define INFO_PRODUCTVERSION ")[^"]*(")/,
    sub { "$1$version$2" }
);

print "Version set to $version in desktop/build/darwin/Info.plist and desktop/build/windows/{info.json,wails.exe.manifest,nsis/wails_tools.nsh}\n";
